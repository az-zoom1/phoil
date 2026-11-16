/**
 * Vuel (فويل) - Expressive Animated SVG Characters & Modular Outfits
 * Characters: owl (Vuel), bear (Barni), elephant (Elly)
 * Outfits: default, chef, shopkeeper, suit, traveler, doctor, tech, royal
 * Mouth states: closed | half | open | wide | smile
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

  function renderOutfitTop(outfitId) {
    switch (outfitId) {
      case "chef":
        return `
          <g class="outfit-top">
            <path d="M58 34 C50 18, 72 10, 80 18 C88 8, 108 18, 102 34 Z" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="2"/>
            <rect x="60" y="32" width="40" height="9" rx="3" fill="#E2E8F0"/>
          </g>`;
      case "traveler":
        return `
          <g class="outfit-top">
            <path d="M52 36 C56 18, 104 18, 108 36 Z" fill="#F59E0B" stroke="#B45309" stroke-width="2"/>
            <rect x="46" y="34" width="68" height="7" rx="3.5" fill="#D97706"/>
          </g>`;
      case "tech":
        return `
          <g class="outfit-top">
            <rect x="46" y="54" width="68" height="15" rx="7" fill="rgba(0,229,255,0.28)" stroke="#00E5FF" stroke-width="2.2"/>
            <line x1="56" y1="61" x2="72" y2="61" stroke="#00E5FF" stroke-width="2" opacity="0.8"/>
          </g>`;
      case "royal":
        return `
          <g class="outfit-top">
            <polygon points="56,34 62,14 74,26 80,10 86,26 98,14 104,34" fill="#FBBF24" stroke="#F59E0B" stroke-width="2"/>
            <circle cx="80" cy="24" r="3" fill="#00E5FF"/>
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
            <path d="M52 104 L108 104 L112 138 L48 138 Z" fill="#F8FAFC"/>
            <path d="M70 104 L80 116 L90 104" fill="none" stroke="#EF4444" stroke-width="3"/>
          </g>`;
      case "shopkeeper":
        return `
          <g class="outfit-body">
            <path d="M54 104 L106 104 L110 138 L50 138 Z" fill="#10B981"/>
            <rect x="82" y="112" width="18" height="10" rx="2" fill="#ECFDF5"/>
          </g>`;
      case "suit":
        return `
          <g class="outfit-body">
            <path d="M48 104 L112 104 L116 138 L44 138 Z" fill="#1E293B"/>
            <polygon points="72,104 88,104 80,122" fill="#F8FAFC"/>
            <polygon points="77,108 83,108 84,132 80,136 76,132" fill="#00E5FF"/>
          </g>`;
      case "doctor":
        return `
          <g class="outfit-body">
            <path d="M50 104 L110 104 L114 138 L46 138 Z" fill="#F1F5F9"/>
            <path d="M62 104 C62 124, 98 124, 98 104" fill="none" stroke="#00E5FF" stroke-width="3"/>
            <circle cx="80" cy="122" r="4" fill="#0284C7"/>
          </g>`;
      case "traveler":
        return `
          <g class="outfit-body">
            <path d="M54 104 L106 104 L108 138 L52 138 Z" fill="#0F766E"/>
            <line x1="58" y1="104" x2="64" y2="138" stroke="#F59E0B" stroke-width="5"/>
            <line x1="102" y1="104" x2="96" y2="138" stroke="#F59E0B" stroke-width="5"/>
          </g>`;
      case "royal":
        return `
          <g class="outfit-body">
            <path d="M46 104 L114 104 L118 138 L42 138 Z" fill="#6D28D9"/>
            <path d="M54 104 Q80 116 106 104" fill="none" stroke="#FBBF24" stroke-width="4"/>
          </g>`;
      default:
        return `
          <g class="outfit-body">
            <path d="M56 104 Q80 118 104 104 L106 116 Q80 128 54 116 Z" fill="#00E5FF" opacity="0.88"/>
          </g>`;
    }
  }

  function renderOwlSvg(outfitId) {
    return `
      <svg viewBox="0 0 160 144" xmlns="http://www.w3.org/2000/svg">
        <!-- Body -->
        <ellipse cx="80" cy="112" rx="38" ry="30" fill="#164E63" stroke="#00E5FF" stroke-width="2"/>
        <ellipse cx="80" cy="116" rx="24" ry="20" fill="#0E7490"/>
        ${renderOutfitBody(outfitId)}
        <!-- Wings -->
        <path d="M40 94 C24 106, 26 128, 44 132 C48 122, 48 106, 40 94 Z" fill="#0891B2"/>
        <path d="M120 94 C136 106, 134 128, 116 132 C112 122, 112 106, 120 94 Z" fill="#0891B2"/>
        <!-- Head -->
        <ellipse cx="80" cy="64" rx="40" ry="36" fill="#0E7490" stroke="#00E5FF" stroke-width="2"/>
        <!-- Ear tufts -->
        <polygon points="44,44 36,20 58,34" fill="#00E5FF"/>
        <polygon points="116,44 124,20 102,34" fill="#00E5FF"/>
        <!-- Facial Discs -->
        <circle cx="62" cy="62" r="16" fill="#082F49" stroke="#38BDF8" stroke-width="2"/>
        <circle cx="98" cy="62" r="16" fill="#082F49" stroke="#38BDF8" stroke-width="2"/>
        <!-- Eyes -->
        <g class="char-eyes">
          <circle cx="62" cy="62" r="8.5" fill="#FBBF24"/>
          <circle cx="98" cy="62" r="8.5" fill="#FBBF24"/>
          <circle cx="62" cy="62" r="4" fill="#070B14"/>
          <circle cx="98" cy="62" r="4" fill="#070B14"/>
          <circle cx="64.5" cy="59.5" r="1.8" fill="#FFFFFF"/>
          <circle cx="100.5" cy="59.5" r="1.8" fill="#FFFFFF"/>
        </g>
        <!-- Animated Beak / Mouth Group -->
        <g id="vuel-mouth-group" class="mouth-group">
          <polygon points="80,68 72,77 88,77" fill="#F59E0B"/>
          <path id="vuel-mouth-cavity" d="M74 77 Q80 77 86 77 Q80 78 74 77 Z" fill="#450A0A"/>
          <polygon id="vuel-lower-jaw" points="73,77 87,77 80,82" fill="#D97706"/>
        </g>
        ${renderOutfitTop(outfitId)}
      </svg>`;
  }

  function renderBearSvg(outfitId) {
    return `
      <svg viewBox="0 0 160 144" xmlns="http://www.w3.org/2000/svg">
        <!-- Ears -->
        <circle cx="46" cy="36" r="14" fill="#92400E" stroke="#F59E0B" stroke-width="2"/>
        <circle cx="46" cy="36" r="7" fill="#FDE68A"/>
        <circle cx="114" cy="36" r="14" fill="#92400E" stroke="#F59E0B" stroke-width="2"/>
        <circle cx="114" cy="36" r="7" fill="#FDE68A"/>
        <!-- Body -->
        <ellipse cx="80" cy="114" rx="40" ry="28" fill="#78350F" stroke="#F59E0B" stroke-width="2"/>
        ${renderOutfitBody(outfitId)}
        <!-- Head -->
        <circle cx="80" cy="66" r="37" fill="#92400E" stroke="#F59E0B" stroke-width="2"/>
        <ellipse cx="80" cy="76" rx="20" ry="15" fill="#FDE68A"/>
        <!-- Eyes -->
        <g class="char-eyes">
          <circle cx="62" cy="58" r="5" fill="#070B14"/>
          <circle cx="98" cy="58" r="5" fill="#070B14"/>
          <circle cx="63.5" cy="56" r="1.8" fill="#FFFFFF"/>
          <circle cx="99.5" cy="56" r="1.8" fill="#FFFFFF"/>
        </g>
        <!-- Nose -->
        <ellipse cx="80" cy="69" rx="6.5" ry="4.5" fill="#1E293B"/>
        <!-- Mouth -->
        <g id="vuel-mouth-group" class="mouth-group">
          <path id="vuel-mouth-cavity" d="M72 78 Q80 79 88 78 Q80 80 72 78 Z" fill="#450A0A"/>
          <path id="vuel-lower-jaw" d="M71 78 Q80 83 89 78" fill="none" stroke="#451A03" stroke-width="2.6" stroke-linecap="round"/>
        </g>
        ${renderOutfitTop(outfitId)}
      </svg>`;
  }

  function renderElephantSvg(outfitId) {
    return `
      <svg viewBox="0 0 160 144" xmlns="http://www.w3.org/2000/svg">
        <!-- Big Ears -->
        <ellipse cx="36" cy="66" rx="22" ry="30" fill="#5B21B6" stroke="#8B5CF6" stroke-width="2"/>
        <ellipse cx="36" cy="66" rx="13" ry="20" fill="#C4B5FD" opacity="0.45"/>
        <ellipse cx="124" cy="66" rx="22" ry="30" fill="#5B21B6" stroke="#8B5CF6" stroke-width="2"/>
        <ellipse cx="124" cy="66" rx="13" ry="20" fill="#C4B5FD" opacity="0.45"/>
        <!-- Body -->
        <ellipse cx="80" cy="114" rx="38" ry="28" fill="#6D28D9" stroke="#A78BFA" stroke-width="2"/>
        ${renderOutfitBody(outfitId)}
        <!-- Head -->
        <circle cx="80" cy="64" r="35" fill="#7C3AED" stroke="#A78BFA" stroke-width="2"/>
        <!-- Eyes -->
        <g class="char-eyes">
          <circle cx="62" cy="56" r="5.5" fill="#FFFFFF"/>
          <circle cx="98" cy="56" r="5.5" fill="#FFFFFF"/>
          <circle cx="62" cy="56" r="3" fill="#070B14"/>
          <circle cx="98" cy="56" r="3" fill="#070B14"/>
        </g>
        <!-- Mouth behind trunk -->
        <g id="vuel-mouth-group" class="mouth-group">
          <ellipse id="vuel-mouth-cavity" cx="80" cy="82" rx="8" ry="1.5" fill="#450A0A"/>
          <path id="vuel-lower-jaw" d="M72 82 Q80 86 88 82" fill="none" stroke="#DDD6FE" stroke-width="2.4" stroke-linecap="round"/>
        </g>
        <!-- Cute Trunk -->
        <path d="M75 68 C74 84, 88 92, 92 84 C94 80, 90 77, 87 80" fill="none" stroke="#A78BFA" stroke-width="8" stroke-linecap="round"/>
        ${renderOutfitTop(outfitId)}
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
    }
    return html;
  }

  /**
   * Updates SVG mouth geometry strictly for lip-sync.
   * state: "closed" | "half" | "open" | "wide" | "smile"
   */
  function setMouthState(state) {
    const mount = document.getElementById("svg-character-mount");
    const cavity = document.getElementById("vuel-mouth-cavity");
    const jaw = document.getElementById("vuel-lower-jaw");
    if (!cavity || !jaw) return;

    const isSpeaking = state === "half" || state === "open" || state === "wide";
    if (mount) {
      mount.classList.toggle("speaking", isSpeaking);
    }

    const isEllipse = cavity.tagName.toLowerCase() === "ellipse";
    if (isEllipse) {
      const ryMap = { closed: "1.2", smile: "2.2", half: "4.5", open: "7.5", wide: "9.5" };
      cavity.setAttribute("ry", ryMap[state] || "1.2");
      return;
    }

    if (jaw.tagName.toLowerCase() === "polygon") {
      // Owl beak
      const dropMap = { closed: 80, smile: 81, half: 85, open: 90, wide: 93 };
      const drop = dropMap[state] || 80;
      jaw.setAttribute("points", `73,77 87,77 80,${drop}`);
      cavity.setAttribute(
        "d",
        isSpeaking
          ? `M74 77 Q80 76 86 77 Q80 ${drop - 1} 74 77 Z`
          : `M74 77 Q80 77 86 77 Q80 78 74 77 Z`
      );
    } else {
      // Bear mouth
      const dropMap = { closed: 80, smile: 83, half: 86, open: 91, wide: 94 };
      const drop = dropMap[state] || 80;
      jaw.setAttribute("d", `M71 78 Q80 ${drop} 89 78`);
      cavity.setAttribute(
        "d",
        isSpeaking
          ? `M72 78 Q80 77 88 78 Q80 ${drop} 72 78 Z`
          : `M72 78 Q80 79 88 78 Q80 79 72 78 Z`
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
    freezeMouth
  };
})();
