/**
 * Vuel (فويل) - Expressive Realistic SVG Characters with Body Language & Reactive Blinking
 * Characters: owl (Vuel), bear (Barni), elephant (Elly)
 * Moods: idle | listening | speaking | thinking | happy
 * Mouth states: closed | smile | narrow | half | open | wide | round
 */
(function () {
  const CHARACTERS = {
    owl: { id: "owl", nameAr: "فويل (البومة)", nameEn: "Vuel the Owl", price: 0 },
    bear: { id: "bear", nameAr: "بارني (الدب)", nameEn: "Barni the Bear", price: 25 },
    elephant: { id: "elephant", nameAr: "إيلي (الفيل)", nameEn: "Elly the Elephant", price: 40 }
  };

  const OUTFITS = {
    default: { id: "default", nameAr: "الزي الكلاسيكي", emoji: "🎓", price: 0 },
    chef: { id: "chef", nameAr: "زي الشيف (المطبخ)", emoji: "👨‍🍳", price: 0 },
    shopkeeper: { id: "shopkeeper", nameAr: "مريول البقالة", emoji: "🛒", price: 0 },
    suit: { id: "suit", nameAr: "بدلة المقابلات", emoji: "👔", price: 0 },
    traveler: { id: "traveler", nameAr: "قبعة المسافر", emoji: "🧳", price: 0 },
    doctor: { id: "doctor", nameAr: "معطف الطبيب", emoji: "🩺", price: 0 },
    tech: { id: "tech", nameAr: "نظارة السايبر النادرة", emoji: "🕶️", price: 30 },
    royal: { id: "royal", nameAr: "تاج الإتقان الملكي", emoji: "👑", price: 50 }
  };

  let blinkTimer = null;

  function sharedDefs() {
    return `
      <defs>
        <radialGradient id="owlHeadGrad" cx="42%" cy="28%" r="70%">
          <stop offset="0%" stop-color="#22D3EE"/>
          <stop offset="45%" stop-color="#0E7490"/>
          <stop offset="100%" stop-color="#062338"/>
        </radialGradient>
        <radialGradient id="owlDiscGrad" cx="50%" cy="45%" r="62%">
          <stop offset="0%" stop-color="#0C4A6E"/>
          <stop offset="75%" stop-color="#082F49"/>
          <stop offset="100%" stop-color="#041827"/>
        </radialGradient>
        <radialGradient id="owlBellyGrad" cx="50%" cy="28%" r="72%">
          <stop offset="0%" stop-color="#F0F9FF"/>
          <stop offset="55%" stop-color="#7DD3FC"/>
          <stop offset="100%" stop-color="#0284C7"/>
        </radialGradient>
        <radialGradient id="bearFurGrad" cx="40%" cy="28%" r="72%">
          <stop offset="0%" stop-color="#F59E0B"/>
          <stop offset="45%" stop-color="#92400E"/>
          <stop offset="100%" stop-color="#3D1704"/>
        </radialGradient>
        <radialGradient id="bearSnoutGrad" cx="50%" cy="32%" r="68%">
          <stop offset="0%" stop-color="#FFFBEB"/>
          <stop offset="60%" stop-color="#FDE68A"/>
          <stop offset="100%" stop-color="#D97706"/>
        </radialGradient>
        <radialGradient id="eleSkinGrad" cx="38%" cy="28%" r="72%">
          <stop offset="0%" stop-color="#C4B5FD"/>
          <stop offset="48%" stop-color="#6D28D9"/>
          <stop offset="100%" stop-color="#2E1065"/>
        </radialGradient>
        <radialGradient id="irisGoldGrad" cx="45%" cy="38%" r="62%">
          <stop offset="0%" stop-color="#FEF9C3"/>
          <stop offset="45%" stop-color="#F59E0B"/>
          <stop offset="100%" stop-color="#78350F"/>
        </radialGradient>
        <linearGradient id="beakGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FEF08A"/>
          <stop offset="55%" stop-color="#F59E0B"/>
          <stop offset="100%" stop-color="#92400E"/>
        </linearGradient>
        <linearGradient id="mouthInterior" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1E0407"/>
          <stop offset="100%" stop-color="#6B0F1A"/>
        </linearGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="3.5" flood-color="#000000" flood-opacity="0.48"/>
        </filter>
      </defs>`;
  }

  function renderOutfitTop(outfitId) {
    switch (outfitId) {
      case "chef":
        return `
          <g class="outfit-top" filter="url(#softShadow)">
            <path d="M55 34 C42 13, 66 2, 80 12 C94 2, 118 13, 105 34 Z" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
            <path d="M68 16 Q72 26 70 32 M80 13 Q80 24 80 32 M92 16 Q88 26 90 32" stroke="#CBD5E1" stroke-width="1.4" fill="none"/>
            <rect x="57" y="31" width="46" height="9" rx="4" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1"/>
          </g>`;
      case "traveler":
        return `
          <g class="outfit-top" filter="url(#softShadow)">
            <path d="M51 36 C55 14, 105 14, 109 36 Z" fill="#D97706" stroke="#78350F" stroke-width="1.5"/>
            <rect x="43" y="33" width="74" height="7" rx="3.5" fill="#B45309"/>
            <rect x="53" y="28" width="54" height="5" rx="2" fill="#0F766E"/>
          </g>`;
      case "tech":
        return `
          <g class="outfit-top" filter="url(#softShadow)">
            <rect x="42" y="51" width="76" height="19" rx="8" fill="rgba(0, 229, 255, 0.2)" stroke="#00E5FF" stroke-width="2"/>
            <line x1="50" y1="57" x2="72" y2="57" stroke="#A5F3FC" stroke-width="2" stroke-linecap="round" opacity="0.85"/>
            <circle cx="113" cy="60" r="2.2" fill="#10B981"/>
          </g>`;
      case "royal":
        return `
          <g class="outfit-top" filter="url(#softShadow)">
            <polygon points="54,34 60,11 73,24 80,6 87,24 100,11 106,34" fill="url(#beakGrad)" stroke="#FEF08A" stroke-width="1.5"/>
            <circle cx="80" cy="22" r="3.4" fill="#00E5FF"/>
            <circle cx="64" cy="26" r="2.2" fill="#F43F5E"/>
            <circle cx="96" cy="26" r="2.2" fill="#10B981"/>
          </g>`;
      default:
        return "";
    }
  }

  function renderOutfitBody(outfitId) {
    switch (outfitId) {
      case "chef":
        return `
          <g class="outfit-body">
            <path d="M50 105 L110 105 L116 145 L44 145 Z" fill="#F8FAFC"/>
            <path d="M68 105 L80 119 L92 105" fill="#EF4444"/>
            <circle cx="80" cy="127" r="2" fill="#94A3B8"/>
            <circle cx="80" cy="136" r="2" fill="#94A3B8"/>
          </g>`;
      case "shopkeeper":
        return `
          <g class="outfit-body">
            <path d="M52 105 L108 105 L113 145 L47 145 Z" fill="#059669"/>
            <rect x="64" y="122" width="32" height="16" rx="4" fill="#047857" stroke="#34D399" stroke-width="1"/>
            <rect x="85" y="110" width="18" height="9" rx="2" fill="#ECFDF5"/>
          </g>`;
      case "suit":
        return `
          <g class="outfit-body">
            <path d="M46 105 L114 105 L120 145 L40 145 Z" fill="#0F172A"/>
            <polygon points="70,105 90,105 80,127" fill="#F8FAFC"/>
            <polygon points="77,109 83,109 85,137 80,142 75,137" fill="#00E5FF"/>
            <path d="M60 105 L74 128 M100 105 L86 128" stroke="#334155" stroke-width="2.5"/>
          </g>`;
      case "doctor":
        return `
          <g class="outfit-body">
            <path d="M48 105 L112 105 L118 145 L42 145 Z" fill="#F1F5F9"/>
            <path d="M60 105 C60 128, 100 128, 100 105" fill="none" stroke="#0284C7" stroke-width="3.2" stroke-linecap="round"/>
            <circle cx="80" cy="125" r="5" fill="#00E5FF" stroke="#0F172A" stroke-width="1.5"/>
          </g>`;
      case "traveler":
        return `
          <g class="outfit-body">
            <path d="M52 105 L108 105 L112 145 L48 145 Z" fill="#0F766E"/>
            <line x1="56" y1="105" x2="64" y2="145" stroke="#F59E0B" stroke-width="5.5"/>
            <line x1="104" y1="105" x2="96" y2="145" stroke="#F59E0B" stroke-width="5.5"/>
          </g>`;
      case "royal":
        return `
          <g class="outfit-body">
            <path d="M44 105 L116 105 L122 145 L38 145 Z" fill="#5B21B6"/>
            <path d="M52 105 Q80 121 108 105" fill="none" stroke="#FBBF24" stroke-width="4.5"/>
            <circle cx="80" cy="117" r="4" fill="#00E5FF" stroke="#FDE047" stroke-width="1.5"/>
          </g>`;
      default:
        return `
          <g class="outfit-body">
            <path d="M54 105 Q80 122 106 105 L108 118 Q80 133 52 118 Z" fill="#0891B2" stroke="#22D3EE" stroke-width="1.5"/>
            <circle cx="80" cy="118" r="4" fill="#FBBF24"/>
          </g>`;
    }
  }

  function renderOwlSvg(outfitId) {
    return `
      <svg viewBox="0 0 160 152" xmlns="http://www.w3.org/2000/svg">
        ${sharedDefs()}
        <g class="char-torso">
          <ellipse cx="80" cy="118" rx="40" ry="30" fill="url(#owlHeadGrad)" filter="url(#softShadow)"/>
          <ellipse cx="80" cy="122" rx="25" ry="22" fill="url(#owlBellyGrad)" opacity="0.95"/>
          <path d="M67 114 Q73 120 79 114 M81 114 Q87 120 93 114 M73 127 Q80 132 87 127" stroke="#0369A1" stroke-width="1.9" fill="none" stroke-linecap="round"/>
          ${renderOutfitBody(outfitId)}
          <!-- Expressive Articulated Wings -->
          <path class="limb-left" d="M40 97 C19 107, 20 135, 42 138 C49 127, 49 109, 40 97 Z" fill="#0E7490" stroke="#38BDF8" stroke-width="1.5"/>
          <path class="limb-right" d="M120 97 C141 107, 140 135, 118 138 C111 127, 111 109, 120 97 Z" fill="#0E7490" stroke="#38BDF8" stroke-width="1.5"/>
        </g>

        <!-- Head Group with Body Language Tilt -->
        <g class="char-head">
          <ellipse cx="80" cy="63" rx="43" ry="38" fill="url(#owlHeadGrad)" filter="url(#softShadow)"/>
          <!-- Strong Sculpted Ear Tufts -->
          <path class="ear-left" d="M40 44 Q30 19 37 13 Q51 24 60 33 Z" fill="#0891B2" stroke="#67E8F9" stroke-width="1.4"/>
          <path class="ear-right" d="M120 44 Q130 19 123 13 Q109 24 100 33 Z" fill="#0891B2" stroke="#67E8F9" stroke-width="1.4"/>
          <!-- Deep Facial Discs -->
          <circle cx="60" cy="62" r="18.5" fill="url(#owlDiscGrad)" stroke="#38BDF8" stroke-width="2"/>
          <circle cx="100" cy="62" r="18.5" fill="url(#owlDiscGrad)" stroke="#38BDF8" stroke-width="2"/>
          <!-- Strong Owl Brow V-Ridge -->
          <path class="brow-left" d="M42 48 Q58 43 76 54" fill="none" stroke="#67E8F9" stroke-width="3.4" stroke-linecap="round"/>
          <path class="brow-right" d="M118 48 Q102 43 84 54" fill="none" stroke="#67E8F9" stroke-width="3.4" stroke-linecap="round"/>

          <!-- Realistic Eyes + Pupils + Upper Sweeping Eyelids -->
          <g class="char-eyes">
            <circle cx="60" cy="62" r="11" fill="url(#irisGoldGrad)"/>
            <circle cx="100" cy="62" r="11" fill="url(#irisGoldGrad)"/>
            <g class="pupil-group">
              <circle cx="60" cy="62" r="5.5" fill="#040710"/>
              <circle cx="100" cy="62" r="5.5" fill="#040710"/>
              <circle cx="63.2" cy="58.5" r="2.6" fill="#FFFFFF"/>
              <circle cx="103.2" cy="58.5" r="2.6" fill="#FFFFFF"/>
              <circle cx="57.5" cy="65.5" r="1.2" fill="#FFFFFF" opacity="0.78"/>
              <circle cx="97.5" cy="65.5" r="1.2" fill="#FFFFFF" opacity="0.78"/>
            </g>
            <!-- Smooth sweeping upper eyelids (scaleY animated!) -->
            <rect class="eyelid" x="47" y="50" width="26" height="24" rx="12" fill="#0E7490"/>
            <rect class="eyelid" x="87" y="50" width="26" height="24" rx="12" fill="#0E7490"/>
          </g>

          <!-- Soft Blush -->
          <ellipse cx="43" cy="74" rx="5.5" ry="2.8" fill="#FB7185" opacity="0.32"/>
          <ellipse cx="117" cy="74" rx="5.5" ry="2.8" fill="#FB7185" opacity="0.32"/>

          <!-- Articulated Beak & Mouth Cavity -->
          <g id="vuel-mouth-group" class="mouth-group">
            <path d="M80 62 L70 76 Q80 80 90 76 Z" fill="url(#beakGrad)" stroke="#78350F" stroke-width="1"/>
            <path d="M78 66 L77 73" stroke="#FEF9C3" stroke-width="1.3" stroke-linecap="round" opacity="0.7"/>
            <path id="vuel-mouth-cavity" d="M72 77 Q80 77 88 77 Q80 78 72 77 Z" fill="url(#mouthInterior)"/>
            <ellipse id="vuel-tongue" cx="80" cy="80" rx="4.2" ry="0" fill="#FB7185"/>
            <path id="vuel-lower-jaw" d="M72 77 Q80 82 88 77 Q80 84 72 77 Z" fill="#D97706"/>
          </g>
          ${renderOutfitTop(outfitId)}
        </g>
      </svg>`;
  }

  function renderBearSvg(outfitId) {
    return `
      <svg viewBox="0 0 160 152" xmlns="http://www.w3.org/2000/svg">
        ${sharedDefs()}
        <g class="char-torso">
          <ellipse cx="80" cy="120" rx="41" ry="28" fill="url(#bearFurGrad)" filter="url(#softShadow)"/>
          ${renderOutfitBody(outfitId)}
          <!-- Friendly Expressive Paws -->
          <ellipse class="limb-left" cx="38" cy="121" rx="11" ry="15" transform="rotate(18 38 121)" fill="#92400E" stroke="#F59E0B" stroke-width="1.4"/>
          <ellipse class="limb-right" cx="122" cy="121" rx="11" ry="15" transform="rotate(-18 122 121)" fill="#92400E" stroke="#F59E0B" stroke-width="1.4"/>
        </g>

        <g class="char-head">
          <!-- Articulated Ears -->
          <g class="ear-left">
            <circle cx="43" cy="35" r="15" fill="url(#bearFurGrad)" stroke="#F59E0B" stroke-width="1.5"/>
            <circle cx="43" cy="35" r="8" fill="#FDE68A" opacity="0.82"/>
          </g>
          <g class="ear-right">
            <circle cx="117" cy="35" r="15" fill="url(#bearFurGrad)" stroke="#F59E0B" stroke-width="1.5"/>
            <circle cx="117" cy="35" r="8" fill="#FDE68A" opacity="0.82"/>
          </g>

          <!-- Head & Sculpted Snout -->
          <circle cx="80" cy="64" r="40" fill="url(#bearFurGrad)" filter="url(#softShadow)"/>
          <ellipse cx="80" cy="77" rx="23" ry="18" fill="url(#bearSnoutGrad)"/>
          <!-- Strong Expressive Eyebrows -->
          <path class="brow-left" d="M49 44 Q60 40 70 45" fill="none" stroke="#FEF3C7" stroke-width="3.2" stroke-linecap="round"/>
          <path class="brow-right" d="M111 44 Q100 40 90 45" fill="none" stroke="#FEF3C7" stroke-width="3.2" stroke-linecap="round"/>

          <!-- Eyes + Pupils + Eyelids -->
          <g class="char-eyes">
            <circle cx="60" cy="56" r="7.8" fill="#FFFFFF"/>
            <circle cx="100" cy="56" r="7.8" fill="#FFFFFF"/>
            <g class="pupil-group">
              <circle cx="60" cy="56" r="5" fill="#1C1917"/>
              <circle cx="100" cy="56" r="5" fill="#1C1917"/>
              <circle cx="62" cy="53.6" r="2.2" fill="#FFFFFF"/>
              <circle cx="102" cy="53.6" r="2.2" fill="#FFFFFF"/>
            </g>
            <rect class="eyelid" x="51" y="47" width="18" height="18" rx="9" fill="#92400E"/>
            <rect class="eyelid" x="91" y="47" width="18" height="18" rx="9" fill="#92400E"/>
          </g>

          <!-- Cheeks, Whisker Dots & Glossy Nose -->
          <ellipse cx="46" cy="68" rx="6" ry="3.2" fill="#FB7185" opacity="0.38"/>
          <ellipse cx="114" cy="68" rx="6" ry="3.2" fill="#FB7185" opacity="0.38"/>
          <path d="M80 71 L80 78" stroke="#78350F" stroke-width="2" stroke-linecap="round"/>
          <ellipse cx="80" cy="67" rx="8.2" ry="5.5" fill="#1E293B"/>
          <ellipse cx="77.5" cy="65.2" rx="3" ry="1.4" fill="#CBD5E1" opacity="0.55"/>

          <!-- Articulated Mouth & Tongue -->
          <g id="vuel-mouth-group" class="mouth-group">
            <path id="vuel-mouth-cavity" d="M70 79 Q80 79 90 79 Q80 80 70 79 Z" fill="url(#mouthInterior)"/>
            <ellipse id="vuel-tongue" cx="80" cy="83" rx="5.5" ry="0" fill="#FB7185"/>
            <path id="vuel-lower-jaw" d="M70 79 Q80 84 90 79" fill="none" stroke="#451A03" stroke-width="2.6" stroke-linecap="round"/>
          </g>
          ${renderOutfitTop(outfitId)}
        </g>
      </svg>`;
  }

  function renderElephantSvg(outfitId) {
    return `
      <svg viewBox="0 0 160 152" xmlns="http://www.w3.org/2000/svg">
        ${sharedDefs()}
        <g class="char-torso">
          <ellipse cx="80" cy="120" rx="40" ry="28" fill="url(#eleSkinGrad)" filter="url(#softShadow)"/>
          ${renderOutfitBody(outfitId)}
          <ellipse class="limb-left" cx="40" cy="122" rx="10" ry="14" transform="rotate(14 40 122)" fill="#5B21B6" stroke="#A78BFA" stroke-width="1.3"/>
          <ellipse class="limb-right" cx="120" cy="122" rx="10" ry="14" transform="rotate(-14 120 122)" fill="#5B21B6" stroke="#A78BFA" stroke-width="1.3"/>
        </g>

        <g class="char-head">
          <!-- Large Flapping Ears -->
          <g class="ear-left">
            <ellipse cx="32" cy="66" rx="25" ry="32" fill="url(#eleSkinGrad)" filter="url(#softShadow)"/>
            <ellipse cx="32" cy="66" rx="14.5" ry="22" fill="#F5D0FE" opacity="0.45"/>
          </g>
          <g class="ear-right">
            <ellipse cx="128" cy="66" rx="25" ry="32" fill="url(#eleSkinGrad)" filter="url(#softShadow)"/>
            <ellipse cx="128" cy="66" rx="14.5" ry="22" fill="#F5D0FE" opacity="0.45"/>
          </g>

          <!-- Head -->
          <circle cx="80" cy="63" r="37" fill="url(#eleSkinGrad)" filter="url(#softShadow)"/>
          <!-- Strong Expressive Eyebrows -->
          <path class="brow-left" d="M49 43 Q60 38 70 44" fill="none" stroke="#EDE9FE" stroke-width="3.2" stroke-linecap="round"/>
          <path class="brow-right" d="M111 43 Q100 38 90 44" fill="none" stroke="#EDE9FE" stroke-width="3.2" stroke-linecap="round"/>

          <!-- Eyes + Pupils + Eyelids -->
          <g class="char-eyes">
            <circle cx="60" cy="55" r="7.8" fill="#FFFFFF"/>
            <circle cx="100" cy="55" r="7.8" fill="#FFFFFF"/>
            <g class="pupil-group">
              <circle cx="60" cy="55" r="4.8" fill="#0F172A"/>
              <circle cx="100" cy="55" r="4.8" fill="#0F172A"/>
              <circle cx="62" cy="52.8" r="2.2" fill="#FFFFFF"/>
              <circle cx="102" cy="52.8" r="2.2" fill="#FFFFFF"/>
            </g>
            <rect class="eyelid" x="51" y="46" width="18" height="18" rx="9" fill="#6D28D9"/>
            <rect class="eyelid" x="91" y="46" width="18" height="18" rx="9" fill="#6D28D9"/>
          </g>

          <!-- Cute Ivory Tusks -->
          <path d="M58 76 Q53 84 59 87 Q63 83 64 76 Z" fill="#FEFCE8" stroke="#E2E8F0" stroke-width="0.8"/>
          <path d="M102 76 Q107 84 101 87 Q97 83 96 76 Z" fill="#FEFCE8" stroke="#E2E8F0" stroke-width="0.8"/>

          <!-- Articulated Mouth + Tongue -->
          <g id="vuel-mouth-group" class="mouth-group">
            <ellipse id="vuel-mouth-cavity" cx="80" cy="83" rx="8.5" ry="1.2" fill="url(#mouthInterior)"/>
            <ellipse id="vuel-tongue" cx="80" cy="85" rx="4.5" ry="0" fill="#FB7185"/>
            <path id="vuel-lower-jaw" d="M71 83 Q80 87 89 83" fill="none" stroke="#EDE9FE" stroke-width="2.4" stroke-linecap="round"/>
          </g>

          <!-- Expressive Articulated Trunk with Wrinkles -->
          <g class="trunk-group">
            <path d="M74 66 C73 86, 91 96, 97 85 C99 80, 94 76, 89 79" fill="none" stroke="#A78BFA" stroke-width="9" stroke-linecap="round"/>
            <path d="M74 66 C73 86, 91 96, 97 85" fill="none" stroke="#EDE9FE" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
            <path d="M71 73 Q75 74 78 73 M72 79 Q76 80 79 79" stroke="#5B21B6" stroke-width="1.4" fill="none" stroke-linecap="round"/>
          </g>
          ${renderOutfitTop(outfitId)}
        </g>
      </svg>`;
  }

  function renderCharacter(charId, outfitId, mountEl) {
    const html =
      charId === "bear"
        ? renderBearSvg(outfitId)
        : charId === "elephant"
        ? renderElephantSvg(outfitId)
        : renderOwlSvg(outfitId);
    if (mountEl) {
      mountEl.innerHTML = html;
      scheduleRandomBlink();
    }
    return html;
  }

  function triggerBlink() {
    const mount = document.getElementById("svg-character-mount");
    if (!mount) return;
    mount.classList.remove("is-blinking");
    void mount.offsetWidth;
    mount.classList.add("is-blinking");
    setTimeout(() => mount.classList.remove("is-blinking"), 260);
  }

  function scheduleRandomBlink() {
    if (blinkTimer) clearTimeout(blinkTimer);
    const delay = 2600 + Math.floor(Math.random() * 2400);
    blinkTimer = setTimeout(() => {
      triggerBlink();
      scheduleRandomBlink();
    }, delay);
  }

  /**
   * Body Language & Facial Mood Controller:
   * mood: "idle" | "listening" | "speaking" | "thinking" | "happy"
   */
  function setBodyState(mood) {
    const mount = document.getElementById("svg-character-mount");
    if (!mount) return;
    mount.classList.remove("mood-idle", "mood-listening", "mood-speaking", "mood-thinking", "mood-happy");
    mount.classList.add("mood-" + (mood || "idle"));
    if (mood === "listening" || mood === "happy") {
      triggerBlink();
    }
  }

  function setMouthState(state) {
    const mount = document.getElementById("svg-character-mount");
    const cavity = document.getElementById("vuel-mouth-cavity");
    const jaw = document.getElementById("vuel-lower-jaw");
    const tongue = document.getElementById("vuel-tongue");
    if (!cavity || !jaw) return;

    const isSpeaking = state !== "closed" && state !== "smile";
    if (mount) {
      mount.classList.toggle("speaking", isSpeaking);
    }

    const ryTongueMap = { closed: 0, smile: 0, narrow: 1.4, half: 2.2, open: 3.1, wide: 3.6, round: 2.5 };
    if (tongue) {
      tongue.setAttribute("ry", String(ryTongueMap[state] || 0));
    }

    if (cavity.tagName.toLowerCase() === "ellipse") {
      const ryMap = { closed: "1.1", smile: "2.0", narrow: "3.4", half: "5.2", open: "7.8", wide: "9.4", round: "6.4" };
      const rxMap = { closed: "8", smile: "9.5", narrow: "6.5", half: "8.5", open: "9.5", wide: "11", round: "6" };
      cavity.setAttribute("ry", ryMap[state] || "1.1");
      cavity.setAttribute("rx", rxMap[state] || "8");
      return;
    }

    const dropMap = { closed: 79, smile: 80.5, narrow: 83, half: 86.5, open: 90.5, wide: 93.5, round: 88 };
    const halfWidthMap = { closed: 8, smile: 9.5, narrow: 5.5, half: 7.5, open: 8.5, wide: 9.5, round: 5.2 };
    const drop = dropMap[state] || 79;
    const hw = halfWidthMap[state] || 8;
    const lx = 80 - hw;
    const rx = 80 + hw;

    if (jaw.getAttribute("fill") === "#D97706") {
      jaw.setAttribute("d", `M${lx} 77 Q80 ${drop} ${rx} 77 Q80 ${drop + 3} ${lx} 77 Z`);
      cavity.setAttribute(
        "d",
        isSpeaking
          ? `M${lx + 0.5} 77 Q80 76 ${rx - 0.5} 77 Q80 ${drop} ${lx + 0.5} 77 Z`
          : `M73 77 Q80 77 87 77 Q80 78 73 77 Z`
      );
    } else {
      jaw.setAttribute("d", `M${lx} 79 Q80 ${drop + 2} ${rx} 79`);
      cavity.setAttribute(
        "d",
        isSpeaking
          ? `M${lx + 0.5} 79 Q80 78 ${rx - 0.5} 79 Q80 ${drop + 1} ${lx + 0.5} 79 Z`
          : `M70 79 Q80 79 90 79 Q80 80 70 79 Z`
      );
    }
  }

  function freezeMouth() {
    setMouthState("closed");
  }

  window.VuelCharacters = {
    CHARACTERS,
    OUTFITS,
    renderCharacter,
    setMouthState,
    setBodyState,
    triggerBlink,
    freezeMouth
  };
})();
