/**
 * Vuel (فويل) - Intelligent Conversational AI Client + Adaptive Offline Engine
 */
(function () {
  function buildSystemPrompt(profile, scenario, recentMistakes) {
    const levelDesc =
      profile.level === "advanced"
        ? "ADVANCED MODE: Converse naturally in fluent English. ONLY use Arabic if the user says they don't understand ('I am not understand', 'I don't understand', 'ما معنى هذه؟'), then gently clarify in Arabic and return smoothly to English."
        : "BEGINNER MODE: Speak short, clear, warm English (1-2 sentences). ALWAYS understand and respond directly to what the user JUST said first! If they say 'I am not understand' or seem confused, explain the previous point warmly in Arabic and say it more simply. If they make a grammar mistake (like 'I am not understand' -> 'I don't understand'), gently correct it in Arabic and encourage them to repeat.";

    const memoryLines = [
      profile.name ? `Student Name: ${profile.name}` : null,
      profile.age ? `Student Age: ${profile.age}` : null,
      `Level: ${profile.level}`,
      `Gems: ${profile.gems}`,
      profile.interests && profile.interests.length
        ? `Interests: ${profile.interests.join(", ")}`
        : null,
      recentMistakes && recentMistakes.length
        ? `Recent mistakes: ${recentMistakes.slice(0, 3).map((m) => m.wrong + " -> " + m.correct).join("; ")}`
        : null
    ]
      .filter(Boolean)
      .join(" | ");

    return `You are Vuel (فويل), a warm, super attentive live-call AI English tutor in the roleplay scenario "${scenario.titleEn}" (${scenario.titleAr}).
${levelDesc}
Student Context: ${memoryLines}
CRITICAL LIVE-CALL RULES:
1. Listen carefully to the student's actual message! Never ignore what they asked or said just to jump to a scripted question.
2. Keep spoken English natural and concise (1-2 sentences, max 40 words) so it sounds great on a live voice call.
3. Put spoken English FIRST. If Arabic help/correction/translation is needed, put it on a new line prefixed with "AR:".
4. If the student shares their name, age, or hobbies, append silently at the end: [[PROFILE:{"name":"...","age":"...","interests":["..."]}]]
5. If the student made an English grammar/vocabulary mistake, append silently at the end: [[MISTAKE:{"wrong":"...","correct":"...","explanationAr":"..."}]]`;
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

  function detectCommonMistake(userText) {
    const t = String(userText || "").trim();
    const checks = [
      {
        re: /\bi\s+(?:am\s+not|no|not)\s+understand\b/i,
        wrong: t,
        correct: t.replace(/\bi\s+(?:am\s+not|no|not)\s+understand\b/i, "I don't understand"),
        explanationAr: "للتعبير عن عدم الفهم بالإنجليزية لا نستخدم (am not) مع الفعل (understand)، بل نستخدم (don't): I don't understand."
      },
      {
        re: /\bi\s+don't\s+understood\b/i,
        wrong: t,
        correct: t.replace(/\bunderstood\b/i, "understand"),
        explanationAr: "بعد (don't) يأتي الفعل في صورته الأساسية بدون تصريف: I don't understand."
      },
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
        re: /\bi\s+am\s+(live|work|study|like|want)\b/i,
        wrong: t,
        correct: t.replace(/\bi\s+am\s+(live|work|study|like|want)\b/i, "I $1"),
        explanationAr: "لا نضع (am) قبل الأفعال الأساسية مثل live/work/like؛ نقول مباشرة: I live / I work."
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
        re: /\bi\s+have\s+(\d+)\s+years?\b/i,
        wrong: t,
        correct: t.replace(/\bi\s+have\s+(\d+)\s+years?\b/i, "I am $1 years old"),
        explanationAr: "لذكر العمر بالإنجليزية نستخدم (I am ... years old) وليس (I have)."
      },
      {
        re: /\bi\s+very\s+like\b/i,
        wrong: t,
        correct: t.replace(/\bi\s+very\s+like\b/i, "I really like"),
        explanationAr: "قبل الفعل نستخدم (really) وليس (very): I really like."
      },
      {
        re: /\bthanks\s+you\b/i,
        wrong: t,
        correct: t.replace(/\bthanks\s+you\b/i, "thank you"),
        explanationAr: "نقول إما (Thank you) بدون s أو (Thanks) لوحدها."
      },
      {
        re: /\bhow\s+many\s+(money|water|milk|sugar|time)\b/i,
        wrong: t,
        correct: t.replace(/\bhow\s+many\b/i, "How much"),
        explanationAr: "مع الأسماء غير المعدودة نستخدم (How much) وليس (How many)."
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
    const mistake = detectCommonMistake(text);
    const nameCall = profile.name ? `, ${profile.name}` : "";

    // 1) Comprehension / Confusion / Repeat intent (handles "I am not understand", "I don't understand", "what?", etc.)
    if (/(?:not\s+understand|don't\s+understand|didn't\s+understand|no\s+understand|confused|repeat|say\s+that\s+again|slower|ما\s*فهمت|مش\s*فاهم|لم\s*أفهم|أعد|بطيء)/i.test(text)) {
      const simplifiedAr = scenario.openingLineAr || "لا تقلق أبداً، سأشرح لك ببساطة!";
      const hint = (scenario.hints && scenario.hints[0]) || "Yes, please.";
      return {
        englishText: `No worries${nameCall}! Let me make it simpler: "${lastAiText || scenario.openingLine}". You can answer: "${hint}"`,
        arabicNote: mistake
          ? `لا تقلق أبداً 😊: ${mistake.explanationAr} — ومعنى كلامي السابق هو: "${simplifiedAr}". جرّب أن تجيب بهذه الجملة السهلة: "${hint}"`
          : `بكل سرور 😊 معنى ما قلته لك: "${simplifiedAr}". يمكنك الرد بسهولة: "${hint}"`,
        mistakePatch: mistake,
        gemsEarned: 5
      };
    }

    // 2) Explicit Translation request ("ما معنى هذه؟")
    if (/ما معنى|ترجم|what does .* mean|meaning of/i.test(text)) {
      const wordMatch = text.match(/mean(?:ing)?(?:\s+of)?\s+["']?([a-zA-Z]+)["']?/i);
      const targetWord = wordMatch ? wordMatch[1] : "";
      if (targetWord && window.VuelDictionary) {
        const entry = window.VuelDictionary.lookup(targetWord);
        return {
          englishText: `Great question! "${entry.word}" means ${entry.meaningAr}. Now let's continue in the ${scenario.titleEn}!`,
          arabicNote: `معنى "${entry.word}" (${entry.arabicPhonetic}): ${entry.meaningAr}. والآن لنكمل الحوار بالإنجليزية!`,
          mistakePatch: null,
          gemsEarned: 5
        };
      }
      return {
        englishText: `Of course! It means: ${scenario.openingLineAr || lastAiText}. Ready to reply in English?`,
        arabicNote: `المقصود بالجملة: "${scenario.openingLineAr || lastAiText}" — ويمكنك الضغط على أي كلمة إنجليزية أعلاه لترجمتها فوراً!`,
        mistakePatch: null,
        gemsEarned: 5
      };
    }

    // 3) Grammar correction in Beginner mode (prioritize teaching warmly before continuing)
    if (mistake && profile.level === "beginner") {
      return {
        englishText: `Good try${nameCall}! We say: "${mistake.correct}". Can you say that one more time?`,
        arabicNote: `تصحيح ذكي 🌟: ${mistake.explanationAr} الجملة الصحيحة: "${mistake.correct}". كررها بصوتك الآن!`,
        mistakePatch: mistake,
        gemsEarned: 5
      };
    }

    // 4) Greetings & conversational small talk ("Hello", "How are you?", "My name is...")
    if (/^(?:hello|hi|hey|good\s+morning|good\s+evening|how\s+are\s+you|peace|مرحبا|أهلا|السلام)/i.test(lower)) {
      return {
        englishText: `Hey${nameCall}! I'm doing awesome and super happy to talk with you! Back to our ${scenario.titleEn}—what would you like to say or ask first?`,
        arabicNote: profile.level === "beginner"
          ? `أهلاً بك${profile.name ? " يا " + profile.name : ""}! أنا بخير وسعيد بالتحدث معك. والآن لنكمل موقف (${scenario.titleAr}): ماذا تريد أن تقول أو تطلب؟`
          : "",
        mistakePatch: mistake,
        gemsEarned: 8
      };
    }

    // 5) Questions from user (How much, Where, Can I, What...)
    if (/\?|^(?:how|what|where|when|why|can|could|do|does|is|are)\b/i.test(lower)) {
      if (/how\s+much|price|cost/i.test(lower)) {
        return {
          englishText: `It is only five dollars today! Would you like to take it or see something else?`,
          arabicNote: profile.level === "beginner" ? "السعر خمسة دولارات فقط اليوم! هل تود أخذه أم رؤية شيء آخر؟" : "",
          mistakePatch: mistake,
          gemsEarned: 10
        };
      }
      if (/where/i.test(lower)) {
        return {
          englishText: `It is right over there on the second aisle to your left. Shall I show you?`,
          arabicNote: profile.level === "beginner" ? "هو هناك مباشرة في الممر الثاني على يسارك. هل أريك إياه؟" : "",
          mistakePatch: mistake,
          gemsEarned: 10
        };
      }
    }

    // 6) Pure Arabic input -> help translate into English naturally
    const hasArabic = /[\u0600-\u06FF]/.test(text);
    const hasEnglish = /[a-zA-Z]{2,}/.test(text);
    if (hasArabic && !hasEnglish) {
      const hint = (scenario.hints && scenario.hints[0]) || "Could you help me, please?";
      return {
        englishText: `Nice! Here is how you say that in English: "${hint}". Try saying it out loud!`,
        arabicNote: `ممتاز! جرّب أن تنطقها بالإنجليزية هكذا: "${hint}"`,
        mistakePatch: null,
        gemsEarned: 5
      };
    }

    // 7) Natural scenario continuation
    const turnCount = history.filter((m) => m.role === "user").length;
    const followUps = scenario.followUps || [];
    const followUp = followUps[turnCount % Math.max(1, followUps.length)] ||
      `That sounds great${nameCall}! Tell me a bit more so we keep practicing.`;

    return {
      englishText: (profile.level === "advanced" ? "" : `Well said${nameCall}! `) + followUp,
      arabicNote: profile.level === "beginner"
        ? `ممتاز${profile.name ? " يا " + profile.name : ""}! جملتك طبيعية جداً. واصل الحوار في (${scenario.titleAr}).`
        : "",
      mistakePatch: mistake || null,
      gemsEarned: 10
    };
  }

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
        if (onNetworkDrop) onNetworkDrop();
        controller.abort();
      }, 9500);
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
      if (!accumulated.trim()) throw new Error("Empty response");
      const parsed = parseTaggedResponse(accumulated);
      return {
        ...parsed,
        gemsEarned: parsed.mistakePatch ? 5 : 10,
        mode: "live"
      };
    } catch (_) {
      if (stallTimer) clearTimeout(stallTimer);
      if (onNetworkDrop) onNetworkDrop();
      const offlineResult = generateOfflineReply({ userText, profile, scenario, history, lastAiText });
      return { ...offlineResult, mode: "offline-fallback" };
    }
  }

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
                ? "ممتاز! أنت في المستوى المتقدم. تم فتح وضع المكالمة المتقدمة ومكافأتك بـ 30 جوهرة!"
                : "بداية رائعة! سنبدأ بالمستوى المبتدئ مع شرح دافئ بالعربية ومكافأة 15 جوهرة!")
            };
          }
        }
      } catch (_) {}
    }

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
