/**
 * Vuel (فويل) - Fixed Production Endpoints (Read-Only)
 */
const WORKER_URL = "https://vuel.azzamalmiklafi.workers.dev";
const CURRICULUM_URL = "https://azm-study.free.nf";

try {
  localStorage.removeItem("vuel_worker_url_override");
  localStorage.removeItem("vuel_curriculum_url_override");
} catch (_) {}

window.VuelConfig = Object.freeze({
  DEFAULT_WORKER_URL: WORKER_URL,
  DEFAULT_CURRICULUM_URL: CURRICULUM_URL,
  getWorkerUrl() {
    return WORKER_URL;
  },
  isWorkerConfigured() {
    return true;
  },
  getCurriculumUrl() {
    return CURRICULUM_URL;
  }
});
