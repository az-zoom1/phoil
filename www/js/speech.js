/**
 * Vuel (فويل) - Unified TTS / STT + Real-Time Lip-Sync & Karaoke Sync
 * Crucial Rule: Immediately freezes/closes the SVG mouth the moment TTS finishes,
 * stops, OR if the internet connection drops/stalls mid-stream.
 */
(function () {
  let activeUtteranceId = null;
  let activeWordElements = [];
  let activeCharOffsets = [];
  let mouthCycleTimer = null;
  let fallbackWordTimer = null;
  let sttCallbacks = null;
  let networkOnline = navigator.onLine !== false;
  let isTtsPlaying = false;

  const MOUTH_SEQUENCE = ["half", "open", "wide", "half", "open", "closed"];
  let mouthSeqIndex = 0;

  function setBadgeState(mode, label) {
    const el = document.getElementById("stage-speech-indicator");
    if (!el) return;
    el.className = "speech-badge " + mode;
    el.textContent = label;
  }

  function clearLipSyncTimers() {
    if (mouthCycleTimer) {
      clearInterval(mouthCycleTimer);
      mouthCycleTimer = null;
    }
    if (fallbackWordTimer) {
      clearInterval(fallbackWordTimer);
      fallbackWordTimer = null;
    }
  }

  function freezeSpeechAndMouth(reasonLabel) {
    isTtsPlaying = false;
    clearLipSyncTimers();
    if (window.VuelCharacters) {
      window.VuelCharacters.freezeMouth();
    }
    activeWordElements.forEach((el) => {
      el.classList.remove("word-active");
    });
    if (reasonLabel) {
      setBadgeState("frozen", reasonLabel);
    } else {
      setBadgeState("idle", "جاهز للاستماع");
    }
  }

  function startMouthPulse() {
    clearInterval(mouthCycleTimer);
    mouthSeqIndex = 0;
    mouthCycleTimer = setInterval(() => {
      if (!isTtsPlaying) {
        freezeSpeechAndMouth();
        return;
      }
      const state = MOUTH_SEQUENCE[mouthSeqIndex % MOUTH_SEQUENCE.length];
      mouthSeqIndex++;
      window.VuelCharacters && window.VuelCharacters.setMouthState(state);
    }, 115);
  }

  function highlightWordAtCharIndex(charIndex) {
    if (!activeWordElements.length || !activeCharOffsets.length) return;
    let matchedIdx = -1;
    for (let i = 0; i < activeCharOffsets.length; i++) {
      const range = activeCharOffsets[i];
      if (charIndex >= range.start && charIndex <= range.end) {
        matchedIdx = i;
        break;
      }
    }
    if (matchedIdx === -1) return;
    highlightWordIndex(matchedIdx);
  }

  function highlightWordIndex(idx) {
    activeWordElements.forEach((el, i) => {
      el.classList.toggle("word-active", i === idx);
      if (i < idx) el.classList.add("word-spoken");
    });
    // Pulse mouth distinctly on every new word boundary
    if (isTtsPlaying && window.VuelCharacters) {
      window.VuelCharacters.setMouthState(idx % 2 === 0 ? "wide" : "open");
    }
  }

  function computeWordOffsets(text) {
    const offsets = [];
    const regex = /\S+/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      offsets.push({
        word: match[0],
        start: match.index,
        end: match.index + match[0].length
      });
    }
    return offsets;
  }

  function toggleAudioButtons(playing) {
    const replayBtn = document.getElementById("btn-replay-tts");
    const stopBtn = document.getElementById("btn-stop-tts");
    if (replayBtn) replayBtn.classList.toggle("hidden", playing);
    if (stopBtn) stopBtn.classList.toggle("hidden", !playing);
  }

  function speakWithKaraoke(text, wordElements, rate, lang = "en-US") {
    stopSpeaking();
    const cleanText = String(text || "").trim();
    if (!cleanText) return;

    activeWordElements = Array.isArray(wordElements) ? wordElements : [];
    activeCharOffsets = computeWordOffsets(cleanText);
    const uttId = "utt_" + Date.now();
    activeUtteranceId = uttId;
    isTtsPlaying = true;
    toggleAudioButtons(true);
    setBadgeState("speaking", "يتحدث الآن...");
    startMouthPulse();

    // Estimate fallback karaoke timing in case platform TTS omits word boundaries
    let receivedNativeBoundary = false;
    const msPerWord = Math.round((60000 / 155) / (rate || 1));
    let fallbackIdx = 0;

    function startFallbackWordTicker() {
      if (fallbackWordTimer) clearInterval(fallbackWordTimer);
      highlightWordIndex(0);
      fallbackWordTimer = setInterval(() => {
        if (!isTtsPlaying || receivedNativeBoundary) {
          clearInterval(fallbackWordTimer);
          return;
        }
        fallbackIdx++;
        if (fallbackIdx < activeWordElements.length) {
          highlightWordIndex(fallbackIdx);
        } else {
          clearInterval(fallbackWordTimer);
        }
      }, Math.max(180, msPerWord));
    }

    // 1) Prefer Android Native TTS Bridge for rock-solid WebView audio
    if (window.VuelBridge && typeof window.VuelBridge.speak === "function") {
      const ok = window.VuelBridge.speak(cleanText, lang, rate || 1.0, uttId);
      if (ok) {
        startFallbackWordTicker();
        // Safety watchdog in case utterance hangs
        setTimeout(() => {
          if (activeUtteranceId === uttId && isTtsPlaying) {
            stopSpeaking();
          }
        }, Math.max(8000, cleanText.length * 140));
        return;
      }
    }

    // 2) Fallback to Web Speech API (Desktop / Chrome / Capacitor)
    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(cleanText);
        utter.lang = lang;
        utter.rate = rate || 1.0;

        utter.onstart = () => {
          if (activeUtteranceId !== uttId) return;
          startFallbackWordTicker();
        };

        utter.onboundary = (event) => {
          if (activeUtteranceId !== uttId) return;
          if (typeof event.charIndex === "number") {
            receivedNativeBoundary = true;
            highlightWordAtCharIndex(event.charIndex);
          }
        };

        utter.onend = () => {
          if (activeUtteranceId !== uttId) return;
          toggleAudioButtons(false);
          freezeSpeechAndMouth();
        };

        utter.onerror = () => {
          if (activeUtteranceId !== uttId) return;
          toggleAudioButtons(false);
          freezeSpeechAndMouth();
        };

        window.speechSynthesis.speak(utter);
        return;
      } catch (_) {}
    }

    // 3) Visual-only timed karaoke fallback if TTS engine is unavailable on device
    startFallbackWordTicker();
    const totalDuration = Math.max(1500, activeWordElements.length * msPerWord + 350);
    setTimeout(() => {
      if (activeUtteranceId === uttId) {
        toggleAudioButtons(false);
        freezeSpeechAndMouth();
      }
    }, totalDuration);
  }

  function stopSpeaking() {
    activeUtteranceId = null;
    toggleAudioButtons(false);
    if (window.VuelBridge && typeof window.VuelBridge.stopSpeaking === "function") {
      try { window.VuelBridge.stopSpeaking(); } catch (_) {}
    }
    if (window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch (_) {}
    }
    freezeSpeechAndMouth();
  }

  // Called by Android Native Bridge
  window.__vuelNativeTtsEvent = function (type, id, start) {
    if (id && activeUtteranceId && id !== activeUtteranceId) return;
    if (type === "range" && start >= 0) {
      highlightWordAtCharIndex(start);
    } else if (type === "end") {
      toggleAudioButtons(false);
      freezeSpeechAndMouth();
    }
  };

  // Speech-to-Text (STT)
  function startListening(callbacks, lang = "en-US") {
    sttCallbacks = callbacks;

    if (window.VuelBridge && typeof window.VuelBridge.startListening === "function") {
      window.VuelBridge.startListening(lang);
      return true;
    }

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      callbacks.onError && callbacks.onError("Speech recognition unavailable on this browser");
      return false;
    }

    try {
      const rec = new SpeechRec();
      rec.lang = lang;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.onstart = () => callbacks.onReady && callbacks.onReady();
      rec.onresult = (e) => {
        const res = e.results[e.results.length - 1];
        const transcript = res[0].transcript;
        if (res.isFinal) {
          callbacks.onResult && callbacks.onResult(transcript);
        } else {
          callbacks.onPartial && callbacks.onPartial(transcript);
        }
      };
      rec.onerror = (e) => callbacks.onError && callbacks.onError(e.error || "mic_error");
      rec.onend = () => callbacks.onEnd && callbacks.onEnd();
      rec.start();
      window.__activeWebRec = rec;
      return true;
    } catch (err) {
      callbacks.onError && callbacks.onError(err.message);
      return false;
    }
  }

  function stopListening() {
    if (window.VuelBridge && typeof window.VuelBridge.stopListening === "function") {
      try { window.VuelBridge.stopListening(); } catch (_) {}
    }
    if (window.__activeWebRec) {
      try { window.__activeWebRec.stop(); } catch (_) {}
      window.__activeWebRec = null;
    }
  }

  window.__vuelNativeSttEvent = function (type, payload) {
    if (!sttCallbacks) return;
    if (type === "ready") sttCallbacks.onReady && sttCallbacks.onReady();
    else if (type === "partial") sttCallbacks.onPartial && sttCallbacks.onPartial(payload);
    else if (type === "result") {
      sttCallbacks.onResult && sttCallbacks.onResult(payload);
      sttCallbacks.onEnd && sttCallbacks.onEnd();
    } else if (type === "error") {
      sttCallbacks.onError && sttCallbacks.onError(payload);
      sttCallbacks.onEnd && sttCallbacks.onEnd();
    }
  };

  // Monitor network drops to immediately freeze mouth during stalled streams
  window.addEventListener("offline", () => {
    networkOnline = false;
    freezeSpeechAndMouth("انقطع الاتصال - توقف الفم");
  });
  window.addEventListener("online", () => {
    networkOnline = true;
    if (!isTtsPlaying) setBadgeState("idle", "جاهز للاستماع");
  });

  window.VuelSpeech = {
    speakWithKaraoke,
    stopSpeaking,
    freezeMouthOnStreamDrop: () => freezeSpeechAndMouth("توقف البث - فم مغلق"),
    startListening,
    stopListening,
    isOnline: () => {
      if (window.VuelBridge && typeof window.VuelBridge.isOnline === "function") {
        try { return Boolean(window.VuelBridge.isOnline()); } catch (_) {}
      }
      return navigator.onLine !== false && networkOnline;
    }
  };
})();
