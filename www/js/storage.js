/**
 * Vuel (فويل) - Offline-First Storage (IndexedDB + localStorage mirror)
 * Stores Profile (Name, Age, Level, Gems, Interests), Mistakes Deck, and Scenario Chats.
 */
(function () {
  const DB_NAME = "vuel_offline_db";
  const DB_VERSION = 1;
  const PROFILE_LS_KEY = "vuel_profile_v1";
  const MISTAKES_LS_KEY = "vuel_mistakes_v1";

  const DEFAULT_PROFILE = {
    name: "",
    age: "",
    level: "beginner", // "beginner" | "advanced"
    gems: 25,
    streak: 0,
    interests: [],
    activeCharacter: "owl",
    activeOutfit: "default",
    unlockedCharacters: ["owl"],
    unlockedOutfits: ["default", "chef", "shopkeeper", "suit", "traveler", "doctor"],
    speechSpeed: "normal", // "slow" | "normal"
    activeScenarioId: "grocery_store",
    completedScenarios: [],
    onboardingDone: false
  };

  let dbInstance = null;

  function openDb() {
    return new Promise((resolve) => {
      if (!window.indexedDB) {
        resolve(null);
        return;
      }
      if (dbInstance) {
        resolve(dbInstance);
        return;
      }
      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains("kv")) {
            db.createObjectStore("kv", { keyPath: "key" });
          }
          if (!db.objectStoreNames.contains("mistakes")) {
            db.createObjectStore("mistakes", { keyPath: "id" });
          }
        };
        req.onsuccess = (e) => {
          dbInstance = e.target.result;
          resolve(dbInstance);
        };
        req.onerror = () => resolve(null);
      } catch (_) {
        resolve(null);
      }
    });
  }

  async function idbPut(storeName, value) {
    const db = await openDb();
    if (!db) return;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, "readwrite");
        tx.objectStore(storeName).put(value);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch (_) {
        resolve();
      }
    });
  }

  async function idbGetAll(storeName) {
    const db = await openDb();
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, "readonly");
        const req = tx.objectStore(storeName).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve(null);
      } catch (_) {
        resolve(null);
      }
    });
  }

  function loadProfileSync() {
    try {
      const raw = localStorage.getItem(PROFILE_LS_KEY);
      if (raw) {
        return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
      }
    } catch (_) {}
    return { ...DEFAULT_PROFILE };
  }

  function saveProfileSync(profile) {
    const merged = { ...DEFAULT_PROFILE, ...profile };
    try {
      localStorage.setItem(PROFILE_LS_KEY, JSON.stringify(merged));
    } catch (_) {}
    idbPut("kv", { key: "profile", value: merged });
    return merged;
  }

  async function loadMistakes() {
    const fromIdb = await idbGetAll("mistakes");
    if (Array.isArray(fromIdb) && fromIdb.length > 0) {
      return fromIdb.sort((a, b) => b.createdAt - a.createdAt);
    }
    try {
      const raw = localStorage.getItem(MISTAKES_LS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return [];
  }

  async function saveMistake(entry) {
    const list = await loadMistakes();
    const exists = list.some(
      (m) => m.wrong.toLowerCase() === entry.wrong.toLowerCase() && m.correct.toLowerCase() === entry.correct.toLowerCase()
    );
    if (exists) return list;

    const item = {
      id: "m_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      wrong: entry.wrong,
      correct: entry.correct,
      explanationAr: entry.explanationAr || "راجع التركيب الصحيح لهذه الجملة.",
      scenarioId: entry.scenarioId || "",
      scenarioTitleAr: entry.scenarioTitleAr || "تدريب عام",
      createdAt: Date.now(),
      mastered: false
    };
    const updated = [item, ...list].slice(0, 200);
    try {
      localStorage.setItem(MISTAKES_LS_KEY, JSON.stringify(updated));
    } catch (_) {}
    await idbPut("mistakes", item);
    return updated;
  }

  async function markMistakeMastered(id) {
    const list = await loadMistakes();
    const updated = list.map((m) => (m.id === id ? { ...m, mastered: true } : m));
    try {
      localStorage.setItem(MISTAKES_LS_KEY, JSON.stringify(updated));
    } catch (_) {}
    const target = updated.find((m) => m.id === id);
    if (target) await idbPut("mistakes", target);
    return updated;
  }

  /**
   * Silently extracts Name, Age, and Interests from natural conversation.
   */
  function extractAndMergeProfile(userText, currentProfile, aiProfilePatch) {
    const next = { ...currentProfile, interests: [...(currentProfile.interests || [])] };
    let changed = false;
    const text = String(userText || "").trim();

    // Name patterns (English & Arabic)
    const nameMatch =
      text.match(/\b(?:my name is|i am|i'm|call me)\s+([A-Z][a-z]{2,18}|[a-z]{3,16})\b/i) ||
      text.match(/(?:اسمي|أنا)\s+([^\s،.!؟]{2,16})/);
    if (nameMatch && nameMatch[1]) {
      const candidate = nameMatch[1].trim();
      const stopWords = new Set(["happy", "sad", "good", "fine", "ready", "here", "going", "student", "teacher", "hungry", "tired", "sorry", "looking", "trying"]);
      if (!stopWords.has(candidate.toLowerCase()) && !/^\d+$/.test(candidate)) {
        next.name = candidate.charAt(0).toUpperCase() + candidate.slice(1);
        changed = true;
      }
    }

    // Age patterns
    const ageMatch =
      text.match(/\b(?:i am|i'm|age is)\s*(\d{1,2})\s*(?:years old|yo)?\b/i) ||
      text.match(/(?:عمري|سني)\s*(\d{1,2})/);
    if (ageMatch && ageMatch[1]) {
      const n = parseInt(ageMatch[1], 10);
      if (n >= 5 && n <= 95) {
        next.age = String(n);
        changed = true;
      }
    }

    // Interests patterns
    const interestKeywords = [
      "football", "soccer", "coding", "programming", "music", "movies", "travel", "cooking",
      "reading", "gaming", "coffee", "art", "photography", "fitness", "books", "science",
      "البرمجة", "كرة القدم", "السفر", "الطبخ", "القراءة", "الألعاب", "التصميم", "الرياضة"
    ];
    const lower = text.toLowerCase();
    for (const kw of interestKeywords) {
      if (lower.includes(kw.toLowerCase()) && !next.interests.includes(kw)) {
        next.interests.push(kw);
        changed = true;
      }
    }

    // AI structured profile patch
    if (aiProfilePatch && typeof aiProfilePatch === "object") {
      if (aiProfilePatch.name && typeof aiProfilePatch.name === "string") {
        next.name = aiProfilePatch.name.trim();
        changed = true;
      }
      if (aiProfilePatch.age) {
        next.age = String(aiProfilePatch.age);
        changed = true;
      }
      if (Array.isArray(aiProfilePatch.interests)) {
        for (const item of aiProfilePatch.interests) {
          if (item && !next.interests.includes(item)) {
            next.interests.push(item);
            changed = true;
          }
        }
      }
    }

    if (changed) {
      next.interests = next.interests.slice(0, 12);
      return saveProfileSync(next);
    }
    return currentProfile;
  }

  function clearAllData() {
    try {
      localStorage.removeItem(PROFILE_LS_KEY);
      localStorage.removeItem(MISTAKES_LS_KEY);
    } catch (_) {}
    if (window.indexedDB) {
      try { indexedDB.deleteDatabase(DB_NAME); } catch (_) {}
    }
    dbInstance = null;
    return saveProfileSync({ ...DEFAULT_PROFILE });
  }

  window.VuelStorage = {
    DEFAULT_PROFILE,
    loadProfileSync,
    saveProfileSync,
    loadMistakes,
    saveMistake,
    markMistakeMastered,
    extractAndMergeProfile,
    clearAllData
  };
})();
