/**
 * Vuel (فويل) - Unified TTS / STT + Real-Time Lip-Sync, Karaoke & Live Call Audio
 * Crucial Rule: Immediately freezes/closes the SVG mouth the moment TTS finishes,
 * stops, OR if the internet connection drops/stalls mid-stream.
 */
(function () {
  let activeUtteranceId = null;
  let activeWordElements = [];
  let activeCharOffsets = [];
  let mouthCycleTimer = null;
  let fallbackWordTimer = null;
  let safetyWatchdogTimer = null;
  let activeTtsDoneCallback = null;
  let sttCallbacks = null;
  let networkOnline = navigator.onLine !== false;
  let isTtsPlaying = false;
  let isSttActive = false;

  const MOUTH_SEQUENCE = ["narrow", "half", "open", "wide", "round", "half", "narrow", "open", "closed"];
  let mouthSeqIndex = 0;

  function setHaloState(mode) {
    const ring = document.getElementById("call-halo-ring");
    if (!ring) return;
    ring.classList.remove("speaking", "listening", "muted");
    if (mode === "speaking" || mode === "listening" || mode === "muted") {
      ring.classList.add(mode);
    }
  }

  function setBadgeState(mode, label) {
    const el = document.getElementById("stage-speech-indicator");
    if (el) {
      el.className = "speech-badge " + mode;
      el.textContent = label;
    }
    if (mode === "speaking") {
      setHaloState("speaking");
      window.VuelCharacters && window.VuelCharacters.setBodyState("speaking");
    } else if (mode === "listening") {
      setHaloState("listening");
      window.VuelCharacters && window.VuelCharacters.setBodyState("listening");
    } else if (mode === "muted") {
      setHaloState("muted");
      window.VuelCharacters && window.VuelCharacters.setBodyState("idle");
    } else {
      setHaloState("idle");
      window.VuelCharacters && window.VuelCharacters.setBodyState("idle");
    }
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
    if (safetyWatchdogTimer) {
      clearTimeout(safetyWatchdogTimer);
      safetyWatchdogTimer = null;
    }
  }

  function freezeSpeechAndMouth(reasonLabel, invokeDoneCallback) {
    const wasPlaying = isTtsPlaying;
    isTtsPlaying = false;
    clearLipSyncTimers();
    if (window.VuelCharacters) {
      window.VuelCharacters.freezeMouth();
    }
    activeWordElements.forEach((el) => {
      el.classList.remove("word-active");
    });
    toggleAudioButtons(false);
    if (reasonLabel) {
      setBadgeState("frozen", reasonLabel);
    } else if (!isSttActive) {
      setBadgeState("idle", "جاهز للمكالمة");
    }

    const cb = activeTtsDoneCallback;
    activeTtsDoneCallback = null;
    if (invokeDoneCallback && wasPlaying && typeof cb === "function") {
      cb();
    }
  }

  function startMouthPulse() {
    clearInterval(mouthCycleTimer);
    mouthSeqIndex = 0;
    mouthCycleTimer = setInterval(() => {
      if (!isTtsPlaying) {
        freezeSpeechAndMouth(null, false);
        return;
      }
      const state = MOUTH_SEQUENCE[mouthSeqIndex % MOUTH_SEQUENCE.length];
      mouthSeqIndex++;
      window.VuelCharacters && window.VuelCharacters.setMouthState(state);
    }, 78);
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
    if (matchedIdx !== -1) {
      highlightWordIndex(matchedIdx);
    }
  }

  function highlightWordIndex(idx) {
    activeWordElements.forEach((el, i) => {
      el.classList.toggle("word-active", i === idx);
      if (i < idx) el.classList.add("word-spoken");
    });
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

  function speakWithKaraoke(text, wordElements, rate, lang = "en-US", onFinished = null) {
    stopSpeaking(true);
    stopListening();

    const cleanText = String(text || "").trim();
    if (!cleanText) {
      if (typeof onFinished === "function") onFinished();
      return;
    }

    activeWordElements = Array.isArray(wordElements) ? wordElements : [];
    activeCharOffsets = computeWordOffsets(cleanText);
    activeTtsDoneCallback = onFinished;
    const uttId = "utt_" + Date.now();
    activeUtteranceId = uttId;
    isTtsPlaying = true;
    toggleAudioButtons(true);
    setBadgeState("speaking", "🔊 فويل يتحدث...");
    startMouthPulse();

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
      }, Math.max(175, msPerWord));
    }

    // 1) Android Native TTS Bridge
    if (window.VuelBridge && typeof window.VuelBridge.speak === "function") {
      const ok = window.VuelBridge.speak(cleanText, lang, rate || 1.0, uttId);
      if (ok) {
        startFallbackWordTicker();
        safetyWatchdogTimer = setTimeout(() => {
          if (activeUtteranceId === uttId && isTtsPlaying) {
            freezeSpeechAndMouth(null, true);
          }
        }, Math.max(7000, cleanText.length * 140));
        return;
      }
    }

    // 2) Web Speech API (Browser / Desktop fallback)
    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(cleanText);
        utter.lang = lang;
        utter.rate = rate || 1.0;

        try {
          const voices = window.speechSynthesis.getVoices() || [];
          const prefix = String(lang || "en").slice(0, 2).toLowerCase();
          const match = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith(prefix));
          if (match) utter.voice = match;
        } catch (_) {}

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
          freezeSpeechAndMouth(null, true);
        };

        utter.onerror = () => {
          if (activeUtteranceId !== uttId) return;
          freezeSpeechAndMouth(null, true);
        };

        window.speechSynthesis.speak(utter);
        if (typeof window.speechSynthesis.resume === "function") {
          window.speechSynthesis.resume();
        }
        startFallbackWordTicker();
        safetyWatchdogTimer = setTimeout(() => {
          if (activeUtteranceId === uttId && isTtsPlaying) {
            freezeSpeechAndMouth(null, true);
          }
        }, Math.max(7000, cleanText.length * 145));
        return;
      } catch (_) {}
    }

    // 3) Timed visual karaoke fallback
    startFallbackWordTicker();
    const totalDuration = Math.max(1400, activeWordElements.length * msPerWord + 350);
    safetyWatchdogTimer = setTimeout(() => {
      if (activeUtteranceId === uttId) {
        freezeSpeechAndMouth(null, true);
      }
    }, totalDuration);
  }

  function stopSpeaking(suppressCallback = false) {
    if (suppressCallback) {
      activeTtsDoneCallback = null;
    }
    activeUtteranceId = null;
    if (window.VuelBridge && typeof window.VuelBridge.stopSpeaking === "function") {
      try { window.VuelBridge.stopSpeaking(); } catch (_) {}
    }
    if (window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch (_) {}
    }
    freezeSpeechAndMouth(null, false);
  }

  window.__vuelNativeTtsEvent = function (type, id, start) {
    if (id && activeUtteranceId && id !== activeUtteranceId) return;
    if (type === "range" && start >= 0) {
      highlightWordAtCharIndex(start);
    } else if (type === "end") {
      freezeSpeechAndMouth(null, true);
    }
  };

  function hasMicPermission() {
    if (window.VuelBridge && typeof window.VuelBridge.hasMicPermission === "function") {
      try { return Boolean(window.VuelBridge.hasMicPermission()); } catch (_) {}
    }
    return true;
  }

  function requestMicPermission() {
    if (window.VuelBridge && typeof window.VuelBridge.requestMicPermission === "function") {
      try {
        window.VuelBridge.requestMicPermission();
        return true;
      } catch (_) {}
    }
    return false;
  }

  function launchVoicePrompt(callbacks, lang = "en-US") {
    sttCallbacks = callbacks;
    isSttActive = true;
    if (window.VuelBridge && typeof window.VuelBridge.launchVoicePrompt === "function") {
      try {
        window.VuelBridge.launchVoicePrompt(lang);
        return true;
      } catch (_) {}
    }
    isSttActive = false;
    return false;
  }

  function startListening(callbacks, lang = "en-US") {
    sttCallbacks = callbacks;
    isSttActive = true;

    if (window.VuelBridge && typeof window.VuelBridge.startListening === "function") {
      window.VuelBridge.startListening(lang);
      return true;
    }

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      isSttActive = false;
      callbacks.onError && callbacks.onError("recognizer_unavailable");
      return false;
    }

    try {
      if (window.__activeWebRec) {
        try { window.__activeWebRec.abort(); } catch (_) {}
      }
      const rec = new SpeechRec();
      rec.lang = lang;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      let gotResult = false;

      rec.onstart = () => callbacks.onReady && callbacks.onReady();
      rec.onresult = (e) => {
        const res = e.results[e.results.length - 1];
        const transcript = res[0].transcript;
        if (res.isFinal) {
          gotResult = true;
          isSttActive = false;
          callbacks.onResult && callbacks.onResult(transcript);
        } else {
          callbacks.onPartial && callbacks.onPartial(transcript);
        }
      };
      rec.onerror = (e) => {
        isSttActive = false;
        const code = e.error || "mic_error";
        if (code === "no-speech" || code === "aborted") {
          callbacks.onSilence && callbacks.onSilence(code);
        } else {
          callbacks.onError && callbacks.onError(code);
        }
      };
      rec.onend = () => {
        isSttActive = false;
        if (!gotResult) {
          callbacks.onEnd && callbacks.onEnd();
        }
      };
      rec.start();
      window.__activeWebRec = rec;
      return true;
    } catch (err) {
      isSttActive = false;
      callbacks.onError && callbacks.onError(err.message);
      return false;
    }
  }

  function stopListening() {
    isSttActive = false;
    sttCallbacks = null;
    if (window.VuelBridge && typeof window.VuelBridge.stopListening === "function") {
      try { window.VuelBridge.stopListening(); } catch (_) {}
    }
    if (window.__activeWebRec) {
      try { window.__activeWebRec.abort(); } catch (_) {}
      window.__activeWebRec = null;
    }
  }

  window.__vuelNativeSttEvent = function (type, payload) {
    if (!sttCallbacks) return;
    if (type === "permission_granted") {
      sttCallbacks.onPermissionGranted && sttCallbacks.onPermissionGranted();
    } else if (type === "ready") {
      sttCallbacks.onReady && sttCallbacks.onReady();
    } else if (type === "rms") {
      sttCallbacks.onRms && sttCallbacks.onRms(parseFloat(payload) || 0);
    } else if (type === "partial") {
      sttCallbacks.onPartial && sttCallbacks.onPartial(payload);
    } else if (type === "result") {
      isSttActive = false;
      const cb = sttCallbacks;
      sttCallbacks = null;
      cb.onResult && cb.onResult(payload);
    } else if (type === "error") {
      isSttActive = false;
      const cb = sttCallbacks;
      sttCallbacks = null;
      // code_6 = SPEECH_TIMEOUT, code_7 = NO_MATCH (normal silence in hands-free calls)
      if (payload === "code_6" || payload === "code_7") {
        cb.onSilence && cb.onSilence(payload);
      } else {
        cb.onError && cb.onError(payload);
      }
    }
  };

  window.addEventListener("offline", () => {
    networkOnline = false;
    freezeSpeechAndMouth("انقطع الاتصال - توقف الفم", false);
  });
  window.addEventListener("online", () => {
    networkOnline = true;
    if (!isTtsPlaying && !isSttActive) setBadgeState("idle", "جاهز للمكالمة");
  });

  window.VuelSpeech = {
    speakWithKaraoke,
    stopSpeaking,
    freezeMouthOnStreamDrop: () => freezeSpeechAndMouth("توقف البث - فم مغلق", false),
    startListening,
    launchVoicePrompt,
    stopListening,
    hasMicPermission,
    requestMicPermission,
    setBadgeState,
    isSpeaking: () => isTtsPlaying,
    isListening: () => isSttActive,
    isOnline: () => {
      if (window.VuelBridge && typeof window.VuelBridge.isOnline === "function") {
        try { return Boolean(window.VuelBridge.isOnline()); } catch (_) {}
      }
      return navigator.onLine !== false && networkOnline;
    }
  };
})();
