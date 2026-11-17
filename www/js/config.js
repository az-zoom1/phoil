/**
 * Vuel (فويل) - Core Endpoint & Curriculum Configuration
 * - WORKER_URL: رابط Cloudflare Worker الخاص بالذكاء الاصطناعي
 * - CURRICULUM_URL: رابط موقع المناهج (تبويب "مناهج" في الأسفل)
 */
const WORKER_URL = "https://vuel.azzamalmiklafi.workers.dev";
const CURRICULUM_URL = "https://azm-study.free.nf";

window.VuelConfig = {
  DEFAULT_WORKER_URL: WORKER_URL,
  DEFAULT_CURRICULUM_URL: CURRICULUM_URL,
  getWorkerUrl() {
    try {
      const override = localStorage.getItem("vuel_worker_url_override");
      if (override && override.trim().startsWith("http")) {
        return override.trim();
      }
    } catch (_) {}
    return WORKER_URL;
  },
  setWorkerUrl(url) {
    try {
      if (!url || !url.trim()) {
        localStorage.removeItem("vuel_worker_url_override");
      } else {
        localStorage.setItem("vuel_worker_url_override", url.trim());
      }
    } catch (_) {}
  },
  isWorkerConfigured() {
    const url = this.getWorkerUrl();
    return Boolean(
      url &&
      url !== "PUT_YOUR_CLOUDFLARE_WORKER_URL_HERE" &&
      (url.startsWith("https://") || url.startsWith("http://"))
    );
  },
  getCurriculumUrl() {
    try {
      const override = localStorage.getItem("vuel_curriculum_url_override");
      if (override && override.trim().startsWith("http")) {
        return override.trim();
      }
    } catch (_) {}
    return CURRICULUM_URL;
  },
  setCurriculumUrl(url) {
    try {
      if (!url || !url.trim()) {
        localStorage.removeItem("vuel_curriculum_url_override");
      } else {
        const clean = url.trim().startsWith("http") ? url.trim() : "https://" + url.trim();
        localStorage.setItem("vuel_curriculum_url_override", clean);
      }
    } catch (_) {}
  }
};
