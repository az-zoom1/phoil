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
    const arTagMatch = text.match(/\n\s*AR:\s*/i);
    if (arTagMatch) {
      const arIdx = arTagMatch.index;
      englishText = text.slice(0, arIdx).trim();
      arabicNote = text.slice(arIdx + arTagMatch[0].length).trim();
    } else if (/^AR:\s*/i.test(text)) {
      const lines = text.split("\n");
      arabicNote = lines[0].replace(/^AR:\s*/i, "").trim();
      englishText = lines.slice(1).join(" ").trim();
    } else {
      // Fallback: if Gemini placed Arabic paragraph on a new line without "AR:"
      const lines = text.split("\n");
      const firstArLineIdx = lines.findIndex((ln) => /^\s*[\u0600-\u06FF]/.test(ln));
      if (firstArLineIdx > 0) {
        englishText = lines.slice(0, firstArLineIdx).join(" ").trim();
        arabicNote = lines.slice(firstArLineIdx).join(" ").trim();
      }
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

  function buildOfflineErrorReply() {
    return {
      englishText: "Excuse me, sir. There is an error, and the internet is not connected. Would you like to go to the quiz?",
      arabicNote: "يا أيها السيد، هنالك خطأ، الإنترنت غير مفتوح. هل تريد الانتقال إلى الاختبار؟",
      profilePatch: null,
      mistakePatch: null,
      gemsEarned: 0,
      offlineError: true,
      mode: "offline-error"
    };
  }

  const PRIMARY_MODEL = "gemini-3-flash-preview";

  async function readWorkerStreamOrJson(res, onChunk, onActivity) {
    const contentType = res.headers.get("content-type") || "";
    let accumulated = "";

    if (res.body && contentType.includes("text/event-stream")) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        if (onActivity) onActivity();
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
              if (onChunk) {
                const cleanPreview = accumulated
                  .split("\nAR:")[0]
                  .replace(/\[\[(PROFILE|MISTAKE):[\s\S]*$/g, "");
                onChunk(cleanPreview, false);
              }
            }
          } catch (_) {}
        }
      }
      return accumulated;
    }

    const text = await res.text();
    // Handle case where SSE lines came back without text/event-stream header
    if (text.includes("data:")) {
      for (const line of text.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const raw = line.slice(5).trim();
        if (!raw || raw === "[DONE]") continue;
        try {
          const evt = JSON.parse(raw);
          if (evt.t) accumulated += evt.t;
        } catch (_) {}
      }
      if (accumulated) return accumulated;
    }
    try {
      const json = JSON.parse(text);
      return json.text || json.reply || text;
    } catch (_) {
      return text;
    }
  }

  let activeTurnController = null;

  function abortActiveTurn() {
    if (activeTurnController) {
      try { activeTurnController.abort(); } catch (_) {}
      activeTurnController = null;
    }
  }

  async function startScenarioOpening({ profile, scenario, recentMistakes }) {
    const workerUrl = window.VuelConfig && window.VuelConfig.getWorkerUrl();
    const configured = window.VuelConfig && window.VuelConfig.isWorkerConfigured();
    const online = window.VuelSpeech ? window.VuelSpeech.isOnline() : navigator.onLine !== false;
    if (!configured || !online) return buildOfflineErrorReply();

    abortActiveTurn();
    const controller = new AbortController();
    activeTurnController = controller;
    const tid = setTimeout(() => controller.abort(), 6500);

    try {
      const prompt = buildSystemPrompt(profile, scenario, recentMistakes);
      const openerInstruction = profile.level === "beginner"
        ? `Start the live call for scenario "${scenario.titleEn}" (${scenario.titleAr}) with a warm, natural 1-2 sentence English opening question, followed on a new line by "AR:" and a brief friendly Arabic translation.`
        : `Start the live call for scenario "${scenario.titleEn}" with a natural 1-2 sentence English opening question.`;

      const res = await fetch(workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model: PRIMARY_MODEL,
          systemPrompt: prompt,
          history: [],
          message: openerInstruction
        })
      });
      clearTimeout(tid);
      if (!res.ok) return buildOfflineErrorReply();

      const raw = await readWorkerStreamOrJson(res, null, null);
      if (!raw || !raw.trim()) return buildOfflineErrorReply();
      const parsed = parseTaggedResponse(raw);
      if (!parsed.englishText) return buildOfflineErrorReply();
      return {
        englishText: parsed.englishText,
        arabicNote: parsed.arabicNote || "",
        offlineError: false,
        mode: "live"
      };
    } catch (_) {
      clearTimeout(tid);
      return buildOfflineErrorReply();
    } finally {
      if (activeTurnController === controller) {
        activeTurnController = null;
      }
    }
  }

  async function sendTurn({ userText, profile, scenario, history, recentMistakes, onChunk, onNetworkDrop }) {
    const workerUrl = window.VuelConfig && window.VuelConfig.getWorkerUrl();
    const configured = window.VuelConfig && window.VuelConfig.isWorkerConfigured();
    const online = window.VuelSpeech ? window.VuelSpeech.isOnline() : navigator.onLine !== false;

    if (!configured || !online) {
      const offlineResult = buildOfflineErrorReply();
      if (onChunk) onChunk(offlineResult.englishText, true);
      return offlineResult;
    }

    abortActiveTurn();
    const controller = new AbortController();
    activeTurnController = controller;
    let stallTimer = null;
    const resetStallWatchdog = () => {
      if (stallTimer) clearTimeout(stallTimer);
      stallTimer = setTimeout(() => {
        if (onNetworkDrop) onNetworkDrop();
        controller.abort();
      }, 12500);
    };

    // Exclude the current user message if already appended to chatHistory so Worker does not duplicate it
    const rawHist = Array.isArray(history) ? history : [];
    const lastHist = rawHist[rawHist.length - 1];
    const priorHistory =
      lastHist && lastHist.role === "user" && (lastHist.text === userText || lastHist.englishText === userText)
        ? rawHist.slice(0, -1)
        : rawHist;

    try {
      resetStallWatchdog();
      const res = await fetch(workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model: PRIMARY_MODEL,
          systemPrompt: buildSystemPrompt(profile, scenario, recentMistakes),
          history: priorHistory.slice(-8).map((m) => ({ role: m.role, text: m.englishText || m.text })),
          message: userText
        })
      });

      if (!res.ok) {
        throw new Error("Worker HTTP " + res.status);
      }

      const accumulated = await readWorkerStreamOrJson(res, onChunk, resetStallWatchdog);

      if (stallTimer) clearTimeout(stallTimer);
      if (!accumulated.trim()) throw new Error("Empty response");
      const parsed = parseTaggedResponse(accumulated);
      return {
        ...parsed,
        gemsEarned: parsed.mistakePatch ? 5 : 10,
        offlineError: false,
        mode: "live"
      };
    } catch (_) {
      if (stallTimer) clearTimeout(stallTimer);
      if (onNetworkDrop) onNetworkDrop();
      return buildOfflineErrorReply();
    } finally {
      if (activeTurnController === controller) {
        activeTurnController = null;
      }
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
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(workerUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            model: PRIMARY_MODEL,
            systemPrompt: `Evaluate this English placement answer in JSON ONLY: {"level":"beginner"|"advanced","feedbackAr":"short enthusiastic Arabic feedback"}. Answer time: ${elapsedSeconds}s.`,
            history: [],
            message: text
          })
        });
        clearTimeout(tid);
        if (res.ok) {
          const fullText = await readWorkerStreamOrJson(res, null, null);
          const match = fullText.match(/\{[\s\S]*?"level"\s*:\s*"(beginner|advanced)"[\s\S]*?\}/);
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
    startScenarioOpening,
    sendTurn,
    abortActiveTurn,
    evaluatePlacementTest
  };
})();
