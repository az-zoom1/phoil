/**
 * Vuel (فويل) - Cloudflare Worker SSE Client + Adaptive AI Teaching Engine
 * Supports:
 *  - Lightweight streaming POST to WORKER_URL (SSE or chunked JSON)
 *  - Network-drop / stall watchdog that freezes SVG mouth immediately
 *  - Local Memory context injection (Name, Age, Level, Gems, Interests)
 *  - Intelligent Offline Fallback Engine when offline or WORKER_URL not yet set
 */
(function () {
  function buildSystemPrompt(profile, scenario, recentMistakes) {
    const levelDesc =
      profile.level === "advanced"
        ? "ADVANCED MODE: Converse strictly in natural, rich English. Only use Arabic if the student explicitly asks 'ما معنى هذه؟' or asks for translation, then immediately return to English."
        : "BEGINNER MODE: Speak simple, clear English sentences (1-2 sentences). If the student makes ANY grammar, tense, or vocabulary mistake, warmly explain and correct it in Arabic first, show the exact correct English sentence, and encourage them to repeat it in English.";

    const memoryLines = [
      profile.name ? `Student Name: ${profile.name}` : null,
      profile.age ? `Student Age: ${profile.age}` : null,
      `English Level: ${profile.level}`,
      `Gems: ${profile.gems}`,
      profile.interests && profile.interests.length
        ? `Interests: ${profile.interests.join(", ")}`
        : null,
      recentMistakes && recentMistakes.length
        ? `Recent mistakes to watch gently: ${recentMistakes.slice(0, 3).map((m) => m.wrong + " -> " + m.correct).join("; ")}`
        : null
    ]
      .filter(Boolean)
      .join(" | ");

    return `You are Vuel (فويل), an expressive, encouraging AI English tutor roleplaying in the scenario "${scenario.titleEn}" (${scenario.titleAr}).
${levelDesc}
Student Memory Context: ${memoryLines}
Rules:
1. Keep replies concise (under 45 words of spoken English) for fast mobile streaming and TTS.
2. Put your spoken English response FIRST, then if helpful in Beginner mode (or when explaining a mistake/translation), put a short Arabic note on a new line prefixed with "AR:".
3. If the student reveals their name, age, or interests, append a hidden tag at the very end: [[PROFILE:{"name":"...","age":"...","interests":["..."]}]]
4. If the student made an English mistake that should be saved to their review deck, append at the very end: [[MISTAKE:{"wrong":"...","correct":"...","explanationAr":"..."}]]`;
  }

  function parseTaggedResponse(rawText) {
    let text = String(rawText || "");
    let profilePatch = null;
    let mistakePatch = null;

    const profMatch = text.match(/\[\[PROFILE:(\{[\s\S]*?\})\]\]/);
    if (profMatch) {
      try { profilePatch = JSON.parse(profMatch[1]); } catch (_) {}
      text = text.replace(profMatch[0], "").trim();
    }

    const misMatch = text.match(/\[\[MISTAKE:(\{[\s\S]*?\})\]\]/);
    if (misMatch) {
      try { mistakePatch = JSON.parse(misMatch[1]); } catch (_) {}
      text = text.replace(misMatch[0], "").trim();
    }

    // Split English speech vs AR: Arabic note
    let englishText = text;
    let arabicNote = "";
    const arIdx = text.indexOf("\nAR:");
    if (arIdx !== -1) {
      englishText = text.slice(0, arIdx).trim();
      arabicNote = text.slice(arIdx + 4).trim();
    } else if (text.startsWith("AR:")) {
      const lines = text.split("\n");
      arabicNote = lines[0].replace(/^AR:\s*/, "").trim();
      englishText = lines.slice(1).join(" ").trim();
    }

    return { englishText, arabicNote, profilePatch, mistakePatch };
  }

  /**
   * Common ESL error detector for offline / instant feedback mode.
   */
  function detectCommonMistake(userText) {
    const t = String(userText || "").trim();
    const checks = [
      {
        re: /\bi\s+goed\b/i,
        wrong: t,
        correct: t.replace(/\bi\s+goed\b/i, "I went"),
        explanationAr: "الفعل (go) شاذ في الماضي؛ ماضيه الصحيح هو (went) وليس (goed)."
      },
      {
        re: /\b(he|she|it)\s+don't\b/i,
        wrong: t,
        correct: t.replace(/\bdon't\b/i, "doesn't"),
        explanationAr: "مع المفرد الغائب (He/She/It) نستخدم (doesn't) وليس (don't)."
      },
      {
        re: /\bi\s+am\s+agree\b/i,
        wrong: t,
        correct: t.replace(/\bi\s+am\s+agree\b/i, "I agree"),
        explanationAr: "الفعل (agree) لا يحتاج (am) قبله؛ نقول مباشرة: I agree."
      },
      {
        re: /\bi\s+want\s+buy\b/i,
        wrong: t,
        correct: t.replace(/\bwant\s+buy\b/i, "want to buy"),
        explanationAr: "بعد الفعل (want) نضع (to) قبل الفعل الثاني: I want to buy."
      },
      {
        re: /\b(he|she)\s+have\b/i,
        wrong: t,
        correct: t.replace(/\b(he|she)\s+have\b/i, "$1 has"),
        explanationAr: "مع (He / She) نستخدم (has) بدلاً من (have)."
      },
      {
        re: /\bi\s+very\s+like\b/i,
        wrong: t,
        correct: t.replace(/\bi\s+very\s+like\b/i, "I really like"),
        explanationAr: "في الإنجليزية لا نضع (very) قبل الفعل؛ نستخدم (really) مثل: I really like."
      },
      {
        re: /\bhow\s+many\s+(money|water|milk|sugar|time)\b/i,
        wrong: t,
        correct: t.replace(/\bhow\s+many\b/i, "How much"),
        explanationAr: "مع الأسماء غير المعدودة (money, water, time) نستخدم (How much) وليس (How many)."
      },
      {
        re: /\byesterday\s+i\s+(go|eat|buy|see)\b/i,
        wrong: t,
        correct: t
          .replace(/\bgo\b/i, "went")
          .replace(/\beat\b/i, "ate")
          .replace(/\bbuy\b/i, "bought")
          .replace(/\bsee\b/i, "saw"),
        explanationAr: "بما أن الجملة عن الأمس (yesterday)، نستخدم صيغة الماضي البسيط للفعل."
      }
    ];

    for (const c of checks) {
      if (c.re.test(t)) return c;
    }
    return null;
  }

  function generateOfflineReply({ userText, profile, scenario, history, lastAiText }) {
    const text = String(userText || "").trim();
    const lower = text.toLowerCase();

    // Check if user asks "ما معنى هذه؟" or translation in any mode
    if (/ما معنى|ترجم|what does .* mean|meaning of/i.test(text)) {
      const wordMatch = text.match(/mean(?:ing)?(?:\s+of)?\s+["']?([a-zA-Z]+)["']?/i);
      const targetWord = wordMatch ? wordMatch[1] : "";
      if (targetWord && window.VuelDictionary) {
        const entry = window.VuelDictionary.lookup(targetWord);
        return {
          englishText: `Let's continue our ${scenario.titleEn} practice! Try using "${targetWord}" in a sentence.`,
          arabicNote: `معنى "${entry.word}" (${entry.arabicPhonetic}): ${entry.meaningAr}. والآن لنكمل بالإنجليزية!`,
          mistakePatch: null,
          gemsEarned: 5
        };
      }
      return {
        englishText: `Sure! Let's keep practicing in the ${scenario.titleEn}. What would you say next?`,
        arabicNote: `الترجمة: "${scenario.openingLineAr || lastAiText}" — يمكنك أيضاً الضغط على أي كلمة إنجليزية أعلاه لترجمتها فوراً!`,
        mistakePatch: null,
        gemsEarned: 5
      };
    }

    // Check grammar mistake (especially in Beginner mode, or record in both)
    const mistake = detectCommonMistake(text);
    if (mistake && profile.level === "beginner") {
      return {
        englishText: `Nice try! Say it like this: "${mistake.correct}". Can you repeat that in English?`,
        arabicNote: `تصحيح لطيف 🌟: ${mistake.explanationAr} الجملة الصحيحة هي: "${mistake.correct}". حاول تكرارها بالإنجليزية الآن!`,
        mistakePatch: mistake,
        gemsEarned: 5
      };
    }

    // If user wrote purely in Arabic (and didn't ask for translation)
    const hasArabic = /[\u0600-\u06FF]/.test(text);
    const hasEnglish = /[a-zA-Z]{2,}/.test(text);
    if (hasArabic && !hasEnglish) {
      const hint = (scenario.hints && scenario.hints[0]) || "Could you help me, please?";
      return {
        englishText: `Good thought! Try saying it in English: "${hint}"`,
        arabicNote: `ممتاز! جرّب قولها بالإنجليزية الآن: "${hint}"`,
        mistakePatch: null,
        gemsEarned: 5
      };
    }

    // Advance natural scenario dialogue
    const turnCount = history.filter((m) => m.role === "user").length;
    const followUps = scenario.followUps || [];
    const followUp = followUps[turnCount % Math.max(1, followUps.length)] ||
      `That sounds great${profile.name ? ", " + profile.name : ""}! Tell me a bit more about what you need here.`;

    const praisePrefix =
      profile.level === "advanced"
        ? ""
        : "Awesome! ";

    return {
      englishText: praisePrefix + followUp,
      arabicNote: profile.level === "beginner"
        ? `أحسنت${profile.name ? " يا " + profile.name : ""}! جملتك ممتازة. أكمل المحادثة في سيناريو ${scenario.titleAr}.`
        : "",
      mistakePatch: mistake || null,
      gemsEarned: 10
    };
  }

  /**
   * Streams from Cloudflare Worker URL if configured & online,
   * otherwise uses Offline Tutor seamlessly.
   */
  async function sendTurn({ userText, profile, scenario, history, recentMistakes, lastAiText, onChunk, onNetworkDrop }) {
    const workerUrl = window.VuelConfig && window.VuelConfig.getWorkerUrl();
    const configured = window.VuelConfig && window.VuelConfig.isWorkerConfigured();
    const online = window.VuelSpeech ? window.VuelSpeech.isOnline() : navigator.onLine !== false;

    if (!configured || !online) {
      const offlineResult = generateOfflineReply({ userText, profile, scenario, history, lastAiText });
      if (onChunk) onChunk(offlineResult.englishText, true);
      return { ...offlineResult, mode: "offline" };
    }

    const controller = new AbortController();
    let stallTimer = null;
    const resetStallWatchdog = () => {
      if (stallTimer) clearTimeout(stallTimer);
      stallTimer = setTimeout(() => {
        // Network stalled mid-stream -> freeze SVG mouth immediately
        if (onNetworkDrop) onNetworkDrop();
        controller.abort();
      }, 9000);
    };

    try {
      resetStallWatchdog();
      const res = await fetch(workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          systemPrompt: buildSystemPrompt(profile, scenario, recentMistakes),
          history: history.slice(-8).map((m) => ({ role: m.role, text: m.englishText || m.text })),
          message: userText
        })
      });

      if (!res.ok) {
        throw new Error("Worker HTTP " + res.status);
      }

      const contentType = res.headers.get("content-type") || "";
      let accumulated = "";

      if (res.body && contentType.includes("text/event-stream")) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          resetStallWatchdog();
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const raw = line.slice(5).trim();
            if (!raw || raw === "[DONE]") continue;
            try {
              const evt = JSON.parse(raw);
              if (evt.t) {
                accumulated += evt.t;
                const cleanPreview = accumulated.split("\nAR:")[0].replace(/\[\[(PROFILE|MISTAKE):[\s\S]*$/g, "");
                if (onChunk) onChunk(cleanPreview, false);
              }
            } catch (_) {}
          }
        }
      } else {
        const json = await res.json();
        accumulated = json.text || json.reply || JSON.stringify(json);
      }

      if (stallTimer) clearTimeout(stallTimer);
      const parsed = parseTaggedResponse(accumulated);
      return {
        ...parsed,
        gemsEarned: parsed.mistakePatch ? 5 : 10,
        mode: "live"
      };
    } catch (_) {
      if (stallTimer) clearTimeout(stallTimer);
      if (onNetworkDrop) onNetworkDrop();
      // Graceful fallback to offline engine so user is never stuck
      const offlineResult = generateOfflineReply({ userText, profile, scenario, history, lastAiText });
      return { ...offlineResult, mode: "offline-fallback" };
    }
  }

  /**
   * Evaluates the AI Quick Placement Test based on accuracy, vocabulary, and response speed.
   */
  async function evaluatePlacementTest(answerText, elapsedSeconds) {
    const text = String(answerText || "").trim();
    const words = text.split(/\s+/).filter(Boolean);
    const mistake = detectCommonMistake(text);
    const hasComplexMarkers = /\b(because|although|however|usually|actually|especially|working|studying|favorite|interested)\b/i.test(text);
    const workerUrl = window.VuelConfig && window.VuelConfig.getWorkerUrl();
    const configured = window.VuelConfig && window.VuelConfig.isWorkerConfigured();
    const online = window.VuelSpeech ? window.VuelSpeech.isOnline() : navigator.onLine !== false;

    if (configured && online) {
      try {
        const res = await fetch(workerUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemPrompt: `Evaluate this English placement answer in JSON ONLY: {"level":"beginner"|"advanced","feedbackAr":"short enthusiastic Arabic feedback"}. Answer time: ${elapsedSeconds}s.`,
            history: [],
            message: text
          })
        });
        if (res.ok) {
          const raw = await res.text();
          const match = raw.match(/\{[\s\S]*?"level"\s*:\s*"(beginner|advanced)"[\s\S]*?\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            const isAdv = parsed.level === "advanced";
            return {
              level: parsed.level,
              gemsReward: isAdv ? 30 : 15,
              feedbackAr: parsed.feedbackAr || (isAdv
                ? "ممتاز! أنت في المستوى المتقدم. تم فتح وضع المحادثة الحرة ومكافأتك بـ 30 جوهرة!"
                : "بداية رائعة! سنبدأ بالمستوى المبتدئ مع شرح دافئ بالعربية ومكافأة 15 جوهرة!")
            };
          }
        }
      } catch (_) {}
    }

    // Local fast & accurate evaluator
    const score =
      (words.length >= 7 ? 2 : words.length >= 4 ? 1 : 0) +
      (!mistake ? 2 : 0) +
      (hasComplexMarkers ? 1 : 0) +
      (elapsedSeconds <= 25 ? 1 : 0);

    if (score >= 4) {
      return {
        level: "advanced",
        gemsReward: 30,
        feedbackAr: "ممتاز! أنت في المستوى المتقدم 🌟 إجابتك دقيقة وسريعة! تم ترقيتك ومكافأتك بـ 30 جوهرة 💎."
      };
    }

    return {
      level: "beginner",
      gemsReward: 15,
      feedbackAr: mistake
        ? `بداية جميلة! لاحظت تفصيلاً صغيراً (${mistake.explanationAr}). سنبدأ بالمستوى المبتدئ مع شروحات بالعربية ومكافأة 15 جوهرة 💎!`
        : "بداية رائعة ومشجعة! سنبدأ بالمستوى المبتدئ لترسيخ القواعد والثقة، وتفضل 15 جوهرة هدية 💎."
    };
  }

  window.VuelAI = {
    sendTurn,
    evaluatePlacementTest
  };
})();
