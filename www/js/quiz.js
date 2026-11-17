/**
 * Vuel (فويل) - Offline Interactive English Quiz Tab ("الاختبار")
 * Works 100% offline with Vocabulary, Grammar & Situational Conversation quizzes + Android TTS audio.
 */
(function () {
  const VOCAB_BANK = [
    { en: "Grocery store", ar: "بقالة / متجر مواد غذائية", hint: "مكان شراء الطعام والخبز" },
    { en: "Receipt", ar: "إيصال / فاتورة", hint: "الورقة التي تأخذها بعد الدفع" },
    { en: "Passport", ar: "جواز سفر", hint: "وثيقة السفر الدولية" },
    { en: "Appointment", ar: "موعد", hint: "موعد عند الطبيب أو العمل" },
    { en: "Delicious", ar: "لذيذ جداً", hint: "وصف للطعام الشهي" },
    { en: "Experience", ar: "خبرة", hint: "سنوات الممارسة في العمل" },
    { en: "Luggage", ar: "أمتعة السفر", hint: "الحقائب في المطار" },
    { en: "Pharmacy", ar: "صيدلية", hint: "مكان شراء الدواء" },
    { en: "Schedule", ar: "جدول مواعيد", hint: "تنظيم أوقات الدراسة أو العمل" },
    { en: "Discount", ar: "تخفيض / خصم", hint: "تخفيض السعر في المتجر" },
    { en: "Boarding pass", ar: "بطاقة صعود الطائرة", hint: "تذكرة الدخول للطائرة" },
    { en: "Breakfast", ar: "وجبة الإفطار", hint: "أول وجبة في الصباح" },
    { en: "Directions", ar: "اتجاهات الطريق", hint: "يمين، يسار، للأمام" },
    { en: "Library", ar: "مكتبة", hint: "مكان القراءة والكتب" },
    { en: "Customer", ar: "زبون / عميل", hint: "الشخص الذي يشتري من المتجر" },
    { en: "Weather", ar: "الطقس", hint: "حالة الجو اليوم" }
  ];

  const GRAMMAR_BANK = [
    {
      promptAr: "اختر الجملة الإنجليزية الصحيحة للتعبير عن عدم الفهم:",
      speakEn: "Which sentence is grammatically correct?",
      options: ["I am not understand", "I don't understand", "I no understand", "I doesn't understand"],
      correctIdx: 1,
      explainAr: "لإنكار الفعل (understand) نستخدم (don't) وليس (am not)."
    },
    {
      promptAr: "اختر الجملة الصحيحة في الزمن الماضي:",
      speakEn: "Yesterday, I went to the market.",
      options: ["Yesterday, I goed to the market.", "Yesterday, I go to the market.", "Yesterday, I went to the market.", "Yesterday, I going to the market."],
      correctIdx: 2,
      explainAr: "الفعل (go) شاذ في الماضي؛ صيغته الصحيحة هي (went)."
    },
    {
      promptAr: "كيف تسأل عن سعر الماء بطريقة صحيحة؟",
      speakEn: "How much is the water?",
      options: ["How many is the water?", "How much is the water?", "How old is the water?", "How price the water?"],
      correctIdx: 1,
      explainAr: "للسؤال عن السعر والكميات غير المعدودة نستخدم (How much)."
    },
    {
      promptAr: "اختر الصيغة الصحيحة للتعبير عن العمر:",
      speakEn: "I am twenty years old.",
      options: ["I have twenty years.", "I am twenty years old.", "I got twenty years.", "My age have twenty."],
      correctIdx: 1,
      explainAr: "بالإنجليزي نستخدم (I am ... years old) وليس (I have)."
    },
    {
      promptAr: "اختر الجملة الصحيحة مع المفرد الغائب (She):",
      speakEn: "She doesn't like coffee.",
      options: ["She don't like coffee.", "She doesn't likes coffee.", "She doesn't like coffee.", "She not like coffee."],
      correctIdx: 2,
      explainAr: "مع (He / She / It) نستخدم (doesn't) ثم الفعل في مصدره بدون (s)."
    },
    {
      promptAr: "اختر التعبير الصحيح للموافقة:",
      speakEn: "I completely agree with you.",
      options: ["I am agree with you.", "I agree with you.", "I agreeing with you.", "I am agreed you."],
      correctIdx: 1,
      explainAr: "الفعل (agree) لا يأخذ (am) قبله؛ نقول مباشرة: I agree with you."
    },
    {
      promptAr: "اختر الجملة الصحيحة مع الفعل (want):",
      speakEn: "I want to buy some bread.",
      options: ["I want buy some bread.", "I wanting to buy bread.", "I want to buy some bread.", "I am want to buy bread."],
      correctIdx: 2,
      explainAr: "بعد (want) يأتي (to + المصدر): want to buy."
    },
    {
      promptAr: "أكمل الجملة: He ___ three brothers.",
      speakEn: "He has three brothers.",
      options: ["have", "has", "having", "are"],
      correctIdx: 1,
      explainAr: "الضمير المفرد (He) يأخذ الفعل (has) وليس (have)."
    }
  ];

  const SITUATION_BANK = [
    {
      promptAr: "في المطعم: النادل يسألك 'Are you ready to order?' — ما الرد المناسب؟",
      speakEn: "Are you ready to order?",
      options: [
        "Yes, I would like grilled chicken, please.",
        "I am sleeping in the kitchen.",
        "My passport is in the suitcase.",
        "Yesterday I went to school."
      ],
      correctIdx: 0,
      explainAr: "للطلب بلطف في المطعم نستخدم: I would like..., please."
    },
    {
      promptAr: "في المطار: الموظف يسألك 'May I see your passport?' — ماذا تقول؟",
      speakEn: "May I see your passport?",
      options: [
        "How much is the apple?",
        "Here you go, and I have one suitcase to check.",
        "Can I see the dessert menu?",
        "I have a mild fever since yesterday."
      ],
      correctIdx: 1,
      explainAr: "عند تسليم جواز السفر نقول: Here you go (تفضل)."
    },
    {
      promptAr: "في البقالة: تريد معرفة مكان الحليب الطازج — ماذا تسأل؟",
      speakEn: "Excuse me, where can I find the fresh milk?",
      options: [
        "Excuse me, where can I find the fresh milk?",
        "What symptoms brought you here today?",
        "Which gate does the plane leave from?",
        "Tell me about your proudest project."
      ],
      correctIdx: 0,
      explainAr: "للسؤال المهذب عن مكان شيء في المتجر: Excuse me, where can I find...?"
    },
    {
      promptAr: "في مقابلة عمل: 'What is your biggest strength?' — كيف تجيب؟",
      speakEn: "What is your biggest strength?",
      options: [
        "I would like a paper bag, please.",
        "I am good at solving problems and teamwork.",
        "Please turn left at the traffic light.",
        "Two coffees with sugar, please."
      ],
      correctIdx: 1,
      explainAr: "للحديث عن نقاط قوتك في المقابلة: I am good at solving problems and teamwork."
    },
    {
      promptAr: "في المستشفى: الطبيب يسألك 'What brings you here today?' — ماذا تجيب؟",
      speakEn: "What brings you here today?",
      options: [
        "I have had a sore throat since yesterday.",
        "Could I get a window seat, please?",
        "I want to open a savings account.",
        "Can you lower the price a little?"
      ],
      correctIdx: 0,
      explainAr: "لوصف الأعراض للطبيب: I have had a sore throat since yesterday (لدي التهاب حلق منذ أمس)."
    },
    {
      promptAr: "إذا لم تسمع كلام المتحدث وتريد منه الإعادة بوضوح:",
      speakEn: "Could you say that again, please?",
      options: [
        "I am not understand you.",
        "Could you say that again, please?",
        "Give me the bill now.",
        "I don't have luggage."
      ],
      correctIdx: 1,
      explainAr: "أفضل عبارة مهذبة لطلب إعادة الكلام: Could you say that again, please?"
    }
  ];

  let activeMode = "mixed"; // mixed | vocab | grammar | situations
  let questions = [];
  let currentIndex = 0;
  let score = 0;
  let answeredCurrent = false;
  let roundGems = 0;
  let callbacks = {};

  function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function buildVocabQuestion(entry) {
    const distractors = shuffle(VOCAB_BANK.filter((v) => v.en !== entry.en)).slice(0, 3);
    const options = shuffle([
      { text: entry.ar, isCorrect: true },
      ...distractors.map((d) => ({ text: d.ar, isCorrect: false }))
    ]);
    return {
      categoryAr: "مفردات وترجمة",
      promptAr: `ما معنى الكلمة/العبارة الإنجليزية: "${entry.en}"؟`,
      highlightEn: entry.en,
      speakEn: entry.en,
      options: options.map((o) => o.text),
      correctIdx: options.findIndex((o) => o.isCorrect),
      explainAr: `"${entry.en}" تعني (${entry.ar}) — ${entry.hint}.`
    };
  }

  function generateRound(mode) {
    activeMode = mode || activeMode;
    const vocabQs = shuffle(VOCAB_BANK).map(buildVocabQuestion);
    const grammarQs = shuffle(GRAMMAR_BANK).map((g) => ({
      categoryAr: "قواعد وتصحيح",
      promptAr: g.promptAr,
      highlightEn: "",
      speakEn: g.speakEn,
      options: g.options,
      correctIdx: g.correctIdx,
      explainAr: g.explainAr
    }));
    const sitQs = shuffle(SITUATION_BANK).map((s) => ({
      categoryAr: "مواقف ومحادثة",
      promptAr: s.promptAr,
      highlightEn: "",
      speakEn: s.speakEn,
      options: s.options,
      correctIdx: s.correctIdx,
      explainAr: s.explainAr
    }));

    let pool = [];
    if (activeMode === "vocab") pool = vocabQs;
    else if (activeMode === "grammar") pool = grammarQs;
    else if (activeMode === "situations") pool = sitQs;
    else pool = shuffle([...vocabQs.slice(0, 4), ...grammarQs.slice(0, 3), ...sitQs.slice(0, 3)]);

    questions = pool.slice(0, Math.min(10, pool.length));
    currentIndex = 0;
    score = 0;
    roundGems = 0;
    answeredCurrent = false;
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderView(mountEl) {
    if (!mountEl) return;
    if (!questions.length) {
      generateRound(activeMode);
    }

    const modePills = `
      <div class="quiz-modes-row">
        <button class="cat-pill ${activeMode === "mixed" ? "active" : ""}" data-qmode="mixed" type="button">🌟 شامل</button>
        <button class="cat-pill ${activeMode === "vocab" ? "active" : ""}" data-qmode="vocab" type="button">📖 مفردات</button>
        <button class="cat-pill ${activeMode === "grammar" ? "active" : ""}" data-qmode="grammar" type="button">✍️ قواعد</button>
        <button class="cat-pill ${activeMode === "situations" ? "active" : ""}" data-qmode="situations" type="button">💬 مواقف</button>
      </div>
    `;

    // Completed Round Summary
    if (currentIndex >= questions.length) {
      const pct = Math.round((score / Math.max(1, questions.length)) * 100);
      mountEl.innerHTML = `
        ${modePills}
        <div class="quiz-summary-card">
          <div class="quiz-summary-emoji">${pct >= 80 ? "🏆" : pct >= 50 ? "🌟" : "💪"}</div>
          <h3>انتهى الاختبار بنجاح!</h3>
          <div class="quiz-score-big">${score} / ${questions.length} (${pct}%)</div>
          <p class="muted-text">ربحت <strong>+${roundGems} 💎</strong> جوهرة من هذا الاختبار بدون إنترنت!</p>
          <button id="btn-quiz-restart" class="primary-btn" style="width:100%;margin-top:12px" type="button">🔄 ابدأ اختباراً جديداً</button>
        </div>
      `;
      bindModeButtons(mountEl);
      const restartBtn = document.getElementById("btn-quiz-restart");
      if (restartBtn) {
        restartBtn.addEventListener("click", () => {
          generateRound(activeMode);
          renderView(mountEl);
        });
      }
      return;
    }

    const q = questions[currentIndex];
    const progressPct = Math.round(((currentIndex) / questions.length) * 100);

    mountEl.innerHTML = `
      ${modePills}
      <div class="quiz-progress-row">
        <span>السؤال ${currentIndex + 1} من ${questions.length} • <strong style="color:var(--neon-cyan)">${q.categoryAr}</strong></span>
        <span>النقاط: <strong style="color:var(--neon-emerald)">${score}</strong></span>
      </div>
      <div class="quiz-progress-track">
        <div class="quiz-progress-fill" style="width:${progressPct}%"></div>
      </div>

      <div class="quiz-card">
        <div class="quiz-q-top">
          <div class="quiz-prompt-ar">${escapeHtml(q.promptAr)}</div>
          <button id="btn-quiz-speak" class="icon-circle-btn" type="button" title="استمع للنطق" aria-label="استمع للنطق">🔊</button>
        </div>
        ${q.highlightEn ? `<div class="quiz-highlight-en" dir="ltr">${escapeHtml(q.highlightEn)}</div>` : ""}

        <div id="quiz-options-list" class="quiz-options-list">
          ${q.options.map((opt, idx) => `
            <button class="quiz-option-btn" data-opt-idx="${idx}" dir="auto" type="button">
              <span class="quiz-opt-letter">${String.fromCharCode(65 + idx)}</span>
              <span class="quiz-opt-text">${escapeHtml(opt)}</span>
            </button>
          `).join("")}
        </div>

        <div id="quiz-feedback-box" class="quiz-feedback-box hidden"></div>
        <button id="btn-quiz-next" class="primary-btn hidden" style="width:100%;margin-top:10px" type="button">
          ${currentIndex + 1 < questions.length ? "السؤال التالي ⬅️" : "عرض النتيجة النهائية 🏆"}
        </button>
      </div>
    `;

    bindModeButtons(mountEl);

    const speakBtn = document.getElementById("btn-quiz-speak");
    if (speakBtn) {
      speakBtn.addEventListener("click", () => {
        if (window.VuelSpeech && q.speakEn) {
          window.VuelSpeech.speakWithKaraoke(q.speakEn, [], 0.95, "en-US");
        }
      });
    }

    const optBtns = mountEl.querySelectorAll(".quiz-option-btn");
    optBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (answeredCurrent) return;
        answeredCurrent = true;
        const picked = Number(btn.dataset.optIdx);
        const isCorrect = picked === q.correctIdx;

        optBtns.forEach((b) => {
          const i = Number(b.dataset.optIdx);
          b.disabled = true;
          if (i === q.correctIdx) b.classList.add("opt-correct");
          else if (i === picked && !isCorrect) b.classList.add("opt-wrong");
        });

        const fb = document.getElementById("quiz-feedback-box");
        if (fb) {
          fb.classList.remove("hidden");
          fb.className = "quiz-feedback-box " + (isCorrect ? "fb-good" : "fb-bad");
          fb.innerHTML = isCorrect
            ? `✅ إجابة صحيحة! (+5 💎)<br><small>${escapeHtml(q.explainAr)}</small>`
            : `❌ إجابة غير صحيحة<br><small>${escapeHtml(q.explainAr)}</small>`;
        }

        if (isCorrect) {
          score++;
          roundGems += 5;
          if (typeof callbacks.onCorrectGem === "function") {
            callbacks.onCorrectGem(5);
          }
        }

        if (window.VuelSpeech && q.speakEn) {
          window.VuelSpeech.speakWithKaraoke(q.speakEn, [], 0.95, "en-US");
        }

        const nextBtn = document.getElementById("btn-quiz-next");
        if (nextBtn) nextBtn.classList.remove("hidden");
      });
    });

    const nextBtn = document.getElementById("btn-quiz-next");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        currentIndex++;
        answeredCurrent = false;
        renderView(mountEl);
      });
    }
  }

  function bindModeButtons(mountEl) {
    mountEl.querySelectorAll("[data-qmode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        generateRound(btn.dataset.qmode);
        renderView(mountEl);
      });
    });
  }

  window.VuelQuiz = {
    render(mountEl, opts = {}) {
      callbacks = opts;
      renderView(mountEl);
    },
    resetAndRender(mountEl, opts = {}) {
      callbacks = opts;
      generateRound(activeMode);
      renderView(mountEl);
    }
  };
})();
