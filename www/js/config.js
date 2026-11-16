/**
 * Vuel (فويل) - Core Endpoint Configuration
 * Replace WORKER_URL below with your deployed Cloudflare Worker URL,
 * or configure it dynamically in the in-app Profile/Settings tab.
 */
const WORKER_URL = "PUT_YOUR_CLOUDFLARE_WORKER_URL_HERE";

window.VuelConfig = {
  DEFAULT_WORKER_URL: WORKER_URL,
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
      url !== "vuel.azzamalmiklafi.workers.dev" &&
      (url.startsWith("https://") || url.startsWith("http://"))
    );
  }
};
