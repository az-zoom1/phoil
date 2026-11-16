/**
 * Vuel (فويل) - Main Application Controller
 */
(function () {
  let profile = window.VuelStorage.loadProfileSync();
  let mistakes = [];
  let activeScenario = window.VuelScenarios.getById(profile.activeScenarioId);
  let chatHistory = [];
  let activeCategory = "all";
  let scenarioQuery = "";
  let currentTab = "stage";
  let lastAiEnglishText = "";
  let placementTimerInterval = null;
  let placementSeconds = 0;
  let flashcardIdx = 0;
  let isSending = false;

  const $ = (id) => document.getElementById(id);

  function showToast(msg) {
    const el = $("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("hidden");
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => el.classList.add("hidden"), 2600);
  }

  function updateGemsUI(delta) {
    if (typeof delta === "number" && delta !== 0) {
      profile.gems = Math.max(0, (profile.gems || 0) + delta);
      profile = window.VuelStorage.saveProfileSync(profile);
      const pill = $("btn-gems-pill");
      if (pill) {
        pill.classList.add("bump");
        setTimeout(() => pill.classList.remove("bump"), 250);
      }
    }
    const countEl = $("gems-count");
    if (countEl) countEl.textContent = String(profile.gems || 0);
  }

  function updateConnectionBadge() {
    const badge = $("connection-badge");
    if (!badge) return;
    const online = window.VuelSpeech.isOnline();
    const configured = window.VuelConfig.isWorkerConfigured();
    if (online && configured) {
      badge.className = "status-pill status-online";
      badge.textContent = "Worker متصل • بث مباشر";
    } else if (!online) {
      badge.className = "status-pill status-offline";
      badge.textContent = "أوفلاين • المعلّم المحلي";
    } else {
      badge.className = "status-pill status-offline";
      badge.textContent = "أوفلاين الذكي • جاهز";
    }
  }

  function getSpeechRate() {
    return profile.speechSpeed === "slow" ? 0.72 : 1.0;
  }

  function updateSpeedButton() {
    const label = $("speed-label");
    if (label) {
      label.textContent = profile.speechSpeed === "slow" ? "سرعة: بطيء" : "سرعة: عادي";
    }
  }

  function switchTab(tabName) {
    currentTab = tabName;
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    const target = $("view-" + tabName);
    if (target) target.classList.add("active");

    document.querySelectorAll(".nav-item").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === tabName);
    });

    if (tabName === "review") renderReviewView();
    if (tabName === "profile") renderProfileView();
    if (tabName === "scenarios") renderScenariosGrid();
  }

  // Android Back Button Handler
  window.__vuelHandleBack = function () {
    const popup = $("word-popup");
    if (popup && !popup.classList.contains("hidden")) {
      popup.classList.add("hidden");
      return true;
    }
    if (currentTab !== "stage") {
      switchTab("stage");
      return true;
    }
    return false;
  };

  function resolveOutfitForStage(scenario) {
    if (profile.activeOutfit && profile.activeOutfit !== "default" && profile.unlockedOutfits.includes(profile.activeOutfit)) {
      // Allow equipped rare outfits (tech / royal) to shine across scenarios, otherwise match scenario outfit!
      if (profile.activeOutfit === "tech" || profile.activeOutfit === "royal") {
        return profile.activeOutfit;
      }
    }
    return scenario.outfit || "default";
  }

  function renderStageHeaderAndCharacter() {
    $("stage-scenario-emoji").textContent = activeScenario.emoji;
    $("stage-scenario-title").textContent = `${activeScenario.titleAr} • ${activeScenario.titleEn}`;
    $("stage-level-tag").textContent =
      profile.level === "advanced"
        ? "المستوى: متقدم • محادثة إنجليزية + ترجمة بالضغط"
        : "المستوى: مبتدئ • تصحيح وشرح بالعربية";

    const charId = profile.activeCharacter || activeScenario.character || "owl";
    const outfitId = resolveOutfitForStage(activeScenario);
    const charMeta = window.VuelCharacters.CHARACTERS[charId] || window.VuelCharacters.CHARACTERS.owl;
    $("stage-char-name").textContent = charMeta.nameAr;

    window.VuelCharacters.renderCharacter(charId, outfitId, $("svg-character-mount"));
    window.VuelCharacters.freezeMouth();
  }

  function createInteractiveEnglishNodes(englishText) {
    const container = document.createElement("div");
    container.className = "bubble-en-line";
    container.dir = "ltr";
    const tokens = String(englishText || "").split(/(\s+)/);
    const wordEls = [];

    tokens.forEach((token) => {
      if (!token) return;
      if (/^\s+$/.test(token)) {
        container.appendChild(document.createTextNode(token));
      } else {
        const span = document.createElement("span");
        span.className = "vuel-word";
        span.textContent = token;
        span.dataset.word = token;
        span.addEventListener("click", () => openWordPopup(token));
        container.appendChild(span);
        wordEls.push(span);
      }
    });

    return { container, wordEls };
  }

  function appendUserBubble(text) {
    const feed = $("chat-feed");
    const row = document.createElement("div");
    row.className = "bubble-row user";
    const bubble = document.createElement("div");
    bubble.className = "bubble bubble-user";
    bubble.dir = "auto";
    bubble.textContent = text;
    row.appendChild(bubble);
    feed.appendChild(row);
    feed.scrollTop = feed.scrollHeight;
  }

  function appendAiBubble({ englishText, arabicNote, mistakePatch, speakNow }) {
    const feed = $("chat-feed");
    const row = document.createElement("div");
    row.className = "bubble-row ai";
    const bubble = document.createElement("div");
    bubble.className = "bubble bubble-ai";

    const { container, wordEls } = createInteractiveEnglishNodes(englishText);
    bubble.appendChild(container);

    const hintCaption = document.createElement("div");
    hintCaption.className = "tap-hint-caption";
    hintCaption.textContent = "اضغط على أي كلمة للترجمة الفورية والنطق";
    bubble.appendChild(hintCaption);

    if (arabicNote) {
      const arDiv = document.createElement("div");
      arDiv.className = "bubble-ar-note";
      arDiv.textContent = arabicNote;
      bubble.appendChild(arDiv);
    }

    if (mistakePatch && mistakePatch.correct) {
      const corrDiv = document.createElement("div");
      corrDiv.className = "bubble-correction-box";
      corrDiv.innerHTML = `✅ الصحيح: <span class="corr-good">${escapeHtml(mistakePatch.correct)}</span>`;
      bubble.appendChild(corrDiv);
    }

    row.appendChild(bubble);
    feed.appendChild(row);
    feed.scrollTop = feed.scrollHeight;

    lastAiEnglishText = englishText;
    window.__lastWordEls = wordEls;

    if (speakNow) {
      window.VuelSpeech.speakWithKaraoke(englishText, wordEls, getSpeechRate(), "en-US");
    }
    return { bubble, wordEls };
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function openWordPopup(rawToken) {
    const info = window.VuelDictionary.lookup(rawToken);
    if (!info) return;
    $("popup-word-en").textContent = info.word;
    $("popup-phonetic").textContent = info.ipa;
    $("popup-arabic-phonetic").textContent = "النطق التقريبي: " + info.arabicPhonetic;
    $("popup-meaning-ar").textContent = info.meaningAr;
    $("word-popup").classList.remove("hidden");
    window.__popupWord = info.word;
  }

  function startScenario(scenarioId, autoSpeak = true) {
    window.VuelSpeech.stopSpeaking();
    activeScenario = window.VuelScenarios.getById(scenarioId);
    profile.activeScenarioId = activeScenario.id;
    profile = window.VuelStorage.saveProfileSync(profile);

    chatHistory = [];
    $("chat-feed").innerHTML = "";
    renderStageHeaderAndCharacter();

    const opening = activeScenario.openingLine;
    const arNote = profile.level === "beginner" ? activeScenario.openingLineAr : "";
    chatHistory.push({ role: "assistant", englishText: opening });

    appendAiBubble({
      englishText: opening,
      arabicNote: arNote,
      mistakePatch: null,
      speakNow: autoSpeak
    });

    switchTab("stage");
  }

  async function handleUserMessage(rawText) {
    const text = String(rawText || "").trim();
    if (!text || isSending) return;
    isSending = true;

    $("chat-input").value = "";
    window.VuelSpeech.stopSpeaking();
    appendUserBubble(text);
    chatHistory.push({ role: "user", text });

    // Silently extract user memory (Name, Age, Interests)
    profile = window.VuelStorage.extractAndMergeProfile(text, profile);

    const recentMistakes = mistakes.slice(0, 5);
    let streamingRow = null;

    const result = await window.VuelAI.sendTurn({
      userText: text,
      profile,
      scenario: activeScenario,
      history: chatHistory,
      recentMistakes,
      lastAiText: lastAiEnglishText,
      onChunk: (partialEnglish) => {
        if (!streamingRow) {
          const feed = $("chat-feed");
          const row = document.createElement("div");
          row.className = "bubble-row ai";
          const bubble = document.createElement("div");
          bubble.className = "bubble bubble-ai";
          const enDiv = document.createElement("div");
          enDiv.className = "bubble-en-line";
          enDiv.dir = "ltr";
          bubble.appendChild(enDiv);
          row.appendChild(bubble);
          feed.appendChild(row);
          streamingRow = { row, enDiv };
        }
        streamingRow.enDiv.textContent = partialEnglish;
        $("chat-feed").scrollTop = $("chat-feed").scrollHeight;
      },
      onNetworkDrop: () => {
        window.VuelSpeech.freezeMouthOnStreamDrop();
      }
    });

    if (streamingRow) {
      streamingRow.row.remove();
    }

    if (result.profilePatch) {
      profile = window.VuelStorage.extractAndMergeProfile("", profile, result.profilePatch);
    }

    if (result.mistakePatch && result.mistakePatch.correct) {
      mistakes = await window.VuelStorage.saveMistake({
        ...result.mistakePatch,
        scenarioId: activeScenario.id,
        scenarioTitleAr: activeScenario.titleAr
      });
      showToast("تم حفظ التصحيح في 'أخطائي' للمراجعة أوفلاين 🃏");
    }

    const earned = result.gemsEarned || 10;
    profile.streak = (profile.streak || 0) + 1;
    if (profile.streak % 3 === 0) {
      updateGemsUI(earned + 5);
      showToast(`🔥 سلسلة رائعة! +${earned + 5} جوهرة 💎`);
    } else {
      updateGemsUI(earned);
    }

    chatHistory.push({ role: "assistant", englishText: result.englishText });
    appendAiBubble({
      englishText: result.englishText,
      arabicNote: result.arabicNote,
      mistakePatch: result.mistakePatch,
      speakNow: true
    });

    isSending = false;
  }

  // Scenarios Library Rendering
  function renderCategoryPills() {
    const container = $("category-pills");
    container.innerHTML = "";
    window.VuelScenarios.CATEGORIES.forEach((cat) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cat-pill" + (activeCategory === cat.id ? " active" : "");
      btn.textContent = cat.labelAr;
      btn.addEventListener("click", () => {
        activeCategory = cat.id;
        renderCategoryPills();
        renderScenariosGrid();
      });
      container.appendChild(btn);
    });
  }

  function renderScenariosGrid() {
    const grid = $("scenarios-grid");
    const q = scenarioQuery.trim().toLowerCase();
    const list = window.VuelScenarios.SCENARIOS.filter((s) => {
      const matchesCat = activeCategory === "all" || s.category === activeCategory;
      const matchesQ =
        !q ||
        s.titleAr.toLowerCase().includes(q) ||
        s.titleEn.toLowerCase().includes(q);
      return matchesCat && matchesQ;
    });

    $("scenarios-count-badge").textContent = String(list.length);
    grid.innerHTML = "";

    list.forEach((s) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "scenario-card" + (s.id === activeScenario.id ? " active-scenario" : "");
      card.innerHTML = `
        <div class="sc-top">
          <span class="sc-emoji">${s.emoji}</span>
          <span class="sc-diff">${s.difficulty}</span>
        </div>
        <div class="sc-title-ar">${escapeHtml(s.titleAr)}</div>
        <div class="sc-title-en">${escapeHtml(s.titleEn)}</div>
      `;
      card.addEventListener("click", () => startScenario(s.id, true));
      grid.appendChild(card);
    });
  }

  // Offline Review Deck Rendering
  async function renderReviewView() {
    mistakes = await window.VuelStorage.loadMistakes();
    const unmastered = mistakes.filter((m) => !m.mastered);
    const masteredCount = mistakes.length - unmastered.length;

    $("review-stats-row").innerHTML = `
      <div class="stat-tile"><strong>${unmastered.length}</strong><span>بطاقات للمراجعة</span></div>
      <div class="stat-tile"><strong>${masteredCount}</strong><span>متقنة</span></div>
      <div class="stat-tile"><strong>${profile.gems} 💎</strong><span>رصيدك</span></div>
    `;

    const stage = $("flashcard-stage");
    if (!unmastered.length) {
      stage.innerHTML = `
        <div class="flashcard">
          <div style="font-size:2rem;margin-bottom:6px">🌟</div>
          <strong>لا توجد أخطاء معلقة حالياً!</strong>
          <p class="muted-text">ابدأ محادثة جديدة وأي تصحيح لغوي سيُحفظ هنا تلقائياً للمراجعة بدون إنترنت.</p>
        </div>`;
    } else {
      if (flashcardIdx >= unmastered.length) flashcardIdx = 0;
      const card = unmastered[flashcardIdx];
      stage.innerHTML = `
        <div class="flashcard">
          <div class="muted-text" style="margin-bottom:6px">${escapeHtml(card.scenarioTitleAr)} • بطاقة ${flashcardIdx + 1} من ${unmastered.length}</div>
          <div class="fc-wrong">✗ ${escapeHtml(card.wrong)}</div>
          <div class="fc-correct">✓ ${escapeHtml(card.correct)}</div>
          <div class="fc-explain">${escapeHtml(card.explanationAr)}</div>
          <div class="fc-actions">
            <button id="fc-listen-btn" class="mini-outline-btn" type="button">🔊 استمع للنطق</button>
            <button id="fc-master-btn" class="primary-btn" type="button">أتقنتها (+5 💎)</button>
            <button id="fc-next-btn" class="ghost-btn" type="button">التالية ◀</button>
          </div>
        </div>
      `;
      $("fc-listen-btn").addEventListener("click", () => {
        window.VuelSpeech.speakWithKaraoke(card.correct, [], getSpeechRate(), "en-US");
      });
      $("fc-master-btn").addEventListener("click", async () => {
        mistakes = await window.VuelStorage.markMistakeMastered(card.id);
        updateGemsUI(5);
        showToast("أحسنت! +5 جوهرة لإتقان التصحيح 💎");
        renderReviewView();
      });
      $("fc-next-btn").addEventListener("click", () => {
        flashcardIdx = (flashcardIdx + 1) % unmastered.length;
        renderReviewView();
      });
    }

    const listEl = $("mistakes-list");
    listEl.innerHTML = "";
    mistakes.forEach((m) => {
      const row = document.createElement("div");
      row.className = "mistake-row";
      row.innerHTML = `
        <div style="min-width:0">
          <div class="fc-correct" style="font-size:0.92rem;margin:0">${escapeHtml(m.correct)}</div>
          <div class="muted-text">${escapeHtml(m.explanationAr)}</div>
        </div>
        <span class="choice-badge ${m.mastered ? "emerald" : "amber"}">${m.mastered ? "متقنة ✓" : "مراجعة"}</span>
      `;
      listEl.appendChild(row);
    });
  }

  // Profile, AI Memory & Shop View
  function renderProfileView() {
    const interestsStr = profile.interests && profile.interests.length
      ? profile.interests.join("، ")
      : "تُكتشف تلقائياً من حديثك";

    $("memory-profile-card").innerHTML = `
      <h3>🧠 ذاكرة الذكاء الاصطناعي المحلية</h3>
      <div class="memory-grid">
        <div class="memory-item"><small>الاسم</small><strong>${escapeHtml(profile.name || "غير محدد بعد")}</strong></div>
        <div class="memory-item"><small>العمر</small><strong>${escapeHtml(profile.age || "غير محدد بعد")}</strong></div>
        <div class="memory-item"><small>المستوى</small><strong>${profile.level === "advanced" ? "متقدم (Advanced)" : "مبتدئ (Beginner)"}</strong></div>
        <div class="memory-item"><small>المجوهرات</small><strong>${profile.gems} 💎</strong></div>
      </div>
      <div class="memory-item" style="margin-top:8px"><small>الاهتمامات المكتشفة</small><strong>${escapeHtml(interestsStr)}</strong></div>
    `;

    const charGrid = $("characters-shop-grid");
    charGrid.innerHTML = "";
    Object.values(window.VuelCharacters.CHARACTERS).forEach((ch) => {
      const unlocked = profile.unlockedCharacters.includes(ch.id);
      const equipped = profile.activeCharacter === ch.id;
      const item = document.createElement("div");
      item.className = "shop-item" + (equipped ? " equipped" : "");
      item.innerHTML = `
        <div style="height:82px;width:92px;margin:0 auto">${window.VuelCharacters.renderCharacter(ch.id, "default", null)}</div>
        <strong style="font-size:0.84rem">${ch.nameAr}</strong>
        <button class="shop-btn ${equipped ? "active" : unlocked ? "equip" : "buy"}" type="button">
          ${equipped ? "مُفعّل ✓" : unlocked ? "اختيار" : `فتح (${ch.price} 💎)`}
        </button>
      `;
      item.querySelector("button").addEventListener("click", () => {
        if (equipped) return;
        if (unlocked) {
          profile.activeCharacter = ch.id;
          profile = window.VuelStorage.saveProfileSync(profile);
          renderStageHeaderAndCharacter();
          renderProfileView();
        } else if (profile.gems >= ch.price) {
          profile.unlockedCharacters.push(ch.id);
          profile.activeCharacter = ch.id;
          updateGemsUI(-ch.price);
          showToast(`تم فتح شخصية ${ch.nameAr}! 🎉`);
          renderStageHeaderAndCharacter();
          renderProfileView();
        } else {
          showToast(`تحتاج ${ch.price - profile.gems} جوهرة إضافية 💎`);
        }
      });
      charGrid.appendChild(item);
    });

    const outfitGrid = $("outfits-shop-grid");
    outfitGrid.innerHTML = "";
    Object.values(window.VuelCharacters.OUTFITS).forEach((of) => {
      const unlocked = profile.unlockedOutfits.includes(of.id);
      const equipped = profile.activeOutfit === of.id;
      const item = document.createElement("div");
      item.className = "shop-item" + (equipped ? " equipped" : "");
      item.innerHTML = `
        <div style="font-size:1.9rem">${of.emoji}</div>
        <strong style="font-size:0.82rem">${of.nameAr}</strong>
        <button class="shop-btn ${equipped ? "active" : unlocked ? "equip" : "buy"}" type="button">
          ${equipped ? "مُجهّز ✓" : unlocked ? "تجهيز" : `شراء (${of.price} 💎)`}
        </button>
      `;
      item.querySelector("button").addEventListener("click", () => {
        if (equipped) return;
        if (unlocked) {
          profile.activeOutfit = of.id;
          profile = window.VuelStorage.saveProfileSync(profile);
          renderStageHeaderAndCharacter();
          renderProfileView();
        } else if (profile.gems >= of.price) {
          profile.unlockedOutfits.push(of.id);
          profile.activeOutfit = of.id;
          updateGemsUI(-of.price);
          showToast(`تم فتح ${of.nameAr}! ✨`);
          renderStageHeaderAndCharacter();
          renderProfileView();
        } else {
          showToast(`تحتاج ${of.price - profile.gems} جوهرة إضافية 💎`);
        }
      });
      outfitGrid.appendChild(item);
    });

    const currentUrl = window.VuelConfig.getWorkerUrl();
    $("worker-url-input").value = currentUrl === window.VuelConfig.DEFAULT_WORKER_URL && currentUrl.includes("PUT_YOUR")
      ? ""
      : currentUrl;
  }

  // Onboarding & AI Quick Placement Test
  function openOnboardingModal() {
    const modal = $("onboarding-modal");
    modal.classList.remove("hidden");
    $("onboarding-step-choose").classList.remove("hidden");
    $("onboarding-step-test").classList.add("hidden");
    $("placement-result-box").classList.add("hidden");
    window.VuelCharacters.renderCharacter("owl", "default", $("onboarding-owl-mount"));
  }

  function finishOnboarding(selectedLevel, bonusGems = 0) {
    profile.level = selectedLevel;
    profile.onboardingDone = true;
    profile = window.VuelStorage.saveProfileSync(profile);
    if (bonusGems) updateGemsUI(bonusGems);
    $("onboarding-modal").classList.add("hidden");
    if (placementTimerInterval) clearInterval(placementTimerInterval);
    startScenario(profile.activeScenarioId || "grocery_store", true);
  }

  function startPlacementFlow() {
    $("onboarding-step-choose").classList.add("hidden");
    $("onboarding-step-test").classList.remove("hidden");
    $("placement-result-box").classList.add("hidden");
    $("placement-answer-input").value = "";
    placementSeconds = 0;
    $("placement-timer").textContent = "0";
    clearInterval(placementTimerInterval);
    placementTimerInterval = setInterval(() => {
      placementSeconds++;
      $("placement-timer").textContent = String(placementSeconds);
    }, 1000);
    window.VuelSpeech.speakWithKaraoke(
      $("placement-question-text").textContent,
      [],
      getSpeechRate(),
      "en-US"
    );
  }

  async function submitPlacementAnswer() {
    const ans = $("placement-answer-input").value.trim();
    if (!ans) {
      showToast("اكتب أو انطق إجابتك بالإنجليزية أولاً");
      return;
    }
    clearInterval(placementTimerInterval);
    const resBox = $("placement-result-box");
    resBox.classList.remove("hidden");
    resBox.innerHTML = "جاري تقييم مستواك وسرعة استجابتك... ⚡";

    const evalRes = await window.VuelAI.evaluatePlacementTest(ans, placementSeconds);
    profile = window.VuelStorage.extractAndMergeProfile(ans, profile);

    resBox.innerHTML = `
      <div>${escapeHtml(evalRes.feedbackAr)}</div>
      <button id="btn-placement-continue" class="primary-btn" style="margin-top:10px;width:100%" type="button">
        ابدأ التعلم الآن 🚀
      </button>
    `;
    $("btn-placement-continue").addEventListener("click", () => {
      finishOnboarding(evalRes.level, evalRes.gemsReward);
    });
  }

  function bindEvents() {
    // Bottom nav
    document.querySelectorAll(".nav-item").forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.dataset.view));
    });

    $("btn-change-scenario").addEventListener("click", () => switchTab("scenarios"));
    $("btn-gems-pill").addEventListener("click", () => switchTab("profile"));

    $("btn-speed-toggle").addEventListener("click", () => {
      profile.speechSpeed = profile.speechSpeed === "normal" ? "slow" : "normal";
      profile = window.VuelStorage.saveProfileSync(profile);
      updateSpeedButton();
      showToast(profile.speechSpeed === "slow" ? "وضع النطق البطيء للمبتدئين 🐢" : "وضع النطق الطبيعي ⚡");
    });

    $("btn-replay-tts").addEventListener("click", () => {
      if (lastAiEnglishText) {
        window.VuelSpeech.speakWithKaraoke(lastAiEnglishText, window.__lastWordEls || [], getSpeechRate(), "en-US");
      }
    });
    $("btn-stop-tts").addEventListener("click", () => window.VuelSpeech.stopSpeaking());

    $("chat-form").addEventListener("submit", (e) => {
      e.preventDefault();
      handleUserMessage($("chat-input").value);
    });

    // Mic STT on stage
    let micActive = false;
    $("btn-mic").addEventListener("click", () => {
      if (micActive) {
        window.VuelSpeech.stopListening();
        micActive = false;
        $("btn-mic").classList.remove("listening");
        return;
      }
      window.VuelSpeech.stopSpeaking();
      micActive = true;
      $("btn-mic").classList.add("listening");
      window.VuelSpeech.startListening({
        onReady: () => showToast("تحدث بالإنجليزية الآن... 🎙️"),
        onPartial: (txt) => { $("chat-input").value = txt; },
        onResult: (txt) => {
          $("chat-input").value = txt;
          micActive = false;
          $("btn-mic").classList.remove("listening");
          if (txt && txt.trim()) handleUserMessage(txt);
        },
        onError: () => {
          micActive = false;
          $("btn-mic").classList.remove("listening");
          showToast("تعذر التقاط الصوت؛ يمكنك الكتابة مباشرة ⌨️");
        },
        onEnd: () => {
          micActive = false;
          $("btn-mic").classList.remove("listening");
        }
      }, "en-US");
    });

    // Smart Action Chips (Gems Economy)
    $("btn-smart-hint").addEventListener("click", () => {
      if (profile.gems < 5) {
        showToast("تحتاج 5 جواهر للحصول على تلميح ذكي 💎");
        return;
      }
      updateGemsUI(-5);
      const hints = activeScenario.hints || ["Could you help me, please?"];
      const pick = hints[Math.floor(Math.random() * hints.length)];
      $("chat-input").value = pick;
      showToast("💡 تلميح جاهز! (-5 💎) اضغط إرسال أو عدّله");
    });

    $("btn-skip-question").addEventListener("click", () => {
      if (profile.gems < 10) {
        showToast("تحتاج 10 جواهر لتجاوز السؤال 💎");
        return;
      }
      updateGemsUI(-10);
      const followUps = activeScenario.followUps || [];
      const nextLine = followUps[chatHistory.length % Math.max(1, followUps.length)] ||
        "No problem! Let's move to the next step—what else would you like to practice?";
      chatHistory.push({ role: "assistant", englishText: nextLine });
      appendAiBubble({
        englishText: nextLine,
        arabicNote: "⏭️ تم تجاوز السؤال (-10 💎) والانتقال للخطوة التالية!",
        mistakePatch: null,
        speakNow: true
      });
    });

    $("btn-what-means").addEventListener("click", () => {
      handleUserMessage("ما معنى هذه؟");
    });

    // Scenario Search
    $("scenario-search").addEventListener("input", (e) => {
      scenarioQuery = e.target.value || "";
      renderScenariosGrid();
    });

    // Word Popup
    $("popup-close-btn").addEventListener("click", () => $("word-popup").classList.add("hidden"));
    $("word-popup").addEventListener("click", (e) => {
      if (e.target.id === "word-popup") $("word-popup").classList.add("hidden");
    });
    $("popup-speak-btn").addEventListener("click", () => {
      if (window.__popupWord) {
        window.VuelSpeech.speakWithKaraoke(window.__popupWord, [], getSpeechRate(), "en-US");
      }
    });

    // Onboarding Events
    $("btn-level-beginner").addEventListener("click", () => finishOnboarding("beginner", 0));
    $("btn-level-advanced").addEventListener("click", () => finishOnboarding("advanced", 0));
    $("btn-start-placement").addEventListener("click", startPlacementFlow);
    $("btn-placement-back").addEventListener("click", () => {
      clearInterval(placementTimerInterval);
      $("onboarding-step-test").classList.add("hidden");
      $("onboarding-step-choose").classList.remove("hidden");
    });
    $("btn-placement-listen").addEventListener("click", () => {
      window.VuelSpeech.speakWithKaraoke($("placement-question-text").textContent, [], getSpeechRate(), "en-US");
    });
    $("btn-placement-mic").addEventListener("click", () => {
      window.VuelSpeech.startListening({
        onPartial: (t) => { $("placement-answer-input").value = t; },
        onResult: (t) => { $("placement-answer-input").value = t; },
        onError: () => showToast("اكتب إجابتك بالإنجليزية للمتابعة")
      }, "en-US");
    });
    $("btn-placement-submit").addEventListener("click", submitPlacementAnswer);

    // Settings
    $("btn-save-worker").addEventListener("click", () => {
      const val = $("worker-url-input").value.trim();
      window.VuelConfig.setWorkerUrl(val);
      updateConnectionBadge();
      showToast(val ? "تم حفظ رابط Cloudflare Worker بنجاح ✓" : "تمت العودة للإعداد الافتراضي");
    });
    $("btn-retake-placement").addEventListener("click", openOnboardingModal);
    $("btn-reset-data").addEventListener("click", () => {
      profile = window.VuelStorage.clearAllData();
      mistakes = [];
      updateGemsUI(0);
      openOnboardingModal();
      showToast("تم مسح البيانات المحلية وإعادة التهيئة");
    });

    window.addEventListener("online", updateConnectionBadge);
    window.addEventListener("offline", updateConnectionBadge);
  }

  async function init() {
    mistakes = await window.VuelStorage.loadMistakes();
    updateGemsUI(0);
    updateSpeedButton();
    updateConnectionBadge();
    renderCategoryPills();
    renderScenariosGrid();
    bindEvents();

    if (!profile.onboardingDone) {
      renderStageHeaderAndCharacter();
      openOnboardingModal();
    } else {
      startScenario(profile.activeScenarioId || "grocery_store", false);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
