import { createInertiaApp, router } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import axios from "axios";
import App from "../backend/resources/js/Pages/App";
import './index.css';

// Auto-redirect ke login bila sesi habis atau akses ditolak (401, 403, 419)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && [401, 403, 419].includes(error.response.status)) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

router.on("invalid", (event) => {
  const status = event.detail.response.status;
  if (status === 401 || status === 419 || status === 403) {
    event.preventDefault();
    window.location.href = "/login";
  }
});

// Top navigation progress bar for smooth feedback during Inertia visits
let progressTimer: ReturnType<typeof setInterval> | null = null;
let progressBarEl: HTMLDivElement | null = null;

function getProgressBar(): HTMLDivElement {
  if (!progressBarEl) {
    progressBarEl = document.createElement("div");
    progressBarEl.id = "app-navigation-progress-bar";
    progressBarEl.style.cssText =
      "position:fixed;top:0;left:0;right:0;height:3px;z-index:999999;pointer-events:none;opacity:0;transition:opacity 0.2s ease;";
    progressBarEl.innerHTML = `
      <div id="app-navigation-progress-inner" style="height:100%;width:0%;background:linear-gradient(90deg,#3b82f6,#6366f1,#06b6d4);box-shadow:0 0 10px rgba(59,130,246,0.7);transition:width 0.2s ease-out;"></div>
    `;
    document.body.appendChild(progressBarEl);
  }
  return progressBarEl;
}

router.on("start", () => {
  const bar = getProgressBar();
  const inner = bar.querySelector("#app-navigation-progress-inner") as HTMLElement;
  if (!inner) return;

  bar.style.opacity = "1";
  inner.style.width = "30%";

  if (progressTimer) clearInterval(progressTimer);
  let pct = 30;
  progressTimer = setInterval(() => {
    if (pct < 85) {
      pct += Math.random() * 15;
      inner.style.width = `${Math.min(pct, 85)}%`;
    }
  }, 200);
});

router.on("finish", () => {
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
  const bar = getProgressBar();
  const inner = bar.querySelector("#app-navigation-progress-inner") as HTMLElement;
  if (!inner) return;

  inner.style.width = "100%";
  setTimeout(() => {
    bar.style.opacity = "0";
    setTimeout(() => {
      inner.style.width = "0%";
    }, 200);
  }, 150);
});

const storedTheme = window.localStorage.getItem("p2mi-theme");
const prefersDarkTheme = window.matchMedia("(prefers-color-scheme: dark)").matches;
document.documentElement.classList.toggle(
  "dark",
  storedTheme === "dark" || (storedTheme !== "light" && prefersDarkTheme),
);

void createInertiaApp({
  title: (title) => (title ? `${title} — SMK Go Global` : "SMK Go Global"),
  progress: {
    delay: 50,
    color: "#2563eb",
    includeCSS: true,
    showSpinner: true,
  },
  resolve: (name) => {
    if (name !== "App") {
      throw new Error(`Halaman Inertia tidak ditemukan: ${name}`);
    }

    return App;
  },
  setup({ el, App: InertiaApp, props }) {
    createRoot(el).render(<InertiaApp {...props} />);
  },
});
