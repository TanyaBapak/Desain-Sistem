import { createInertiaApp, router } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import axios from "axios";
import { toast } from "sonner";
import App from "../backend/resources/js/Pages/App";
import './index.css';

// Proteksi DOM reconciliation React 18 dari manipulasi eksternal
// (Google Translate, password manager autofill, ekstensi peramban, maupun transisi unmount cepat).
if (typeof window !== "undefined" && typeof Node === "function" && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    try {
      return originalRemoveChild.call(this, child) as T;
    } catch {
      if (child && child.parentNode && child.parentNode !== this) {
        try {
          return child.parentNode.removeChild(child) as T;
        } catch {
          // Node sudah dilepas dari DOM oleh ekstensi peramban
        }
      }
      return child;
    }
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    try {
      return originalInsertBefore.call(this, newNode, referenceNode) as T;
    } catch {
      if (referenceNode && referenceNode.parentNode && referenceNode.parentNode !== this) {
        try {
          return referenceNode.parentNode.insertBefore(newNode, referenceNode) as T;
        } catch {
          // Fallback ke appendChild jika posisi reference sudah invalid
        }
      }
      try {
        return this.appendChild(newNode) as T;
      } catch {
        return newNode;
      }
    }
  };
}

const ACCESS_DENIED_MESSAGE = "Anda tidak memiliki akses untuk tindakan ini.";

function redirectToLoginIfNeeded(): void {
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

const TOO_MANY_REQUESTS_MESSAGE = "Terlalu banyak permintaan (Error 429). Mohon tunggu beberapa detik sebelum mencoba kembali.";

// 401/419 berarti sesi berakhir. 403 berarti pengguna tidak berhak atas
// tindakan tersebut, jadi cukup tampilkan pesan tanpa mengeluarkan sesi.
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status: number | undefined = error.response?.status;
    if (status === 401 || status === 419) {
      redirectToLoginIfNeeded();
    } else if (status === 403) {
      toast.error(ACCESS_DENIED_MESSAGE);
    } else if (status === 429) {
      toast.error(TOO_MANY_REQUESTS_MESSAGE);
    }
    return Promise.reject(error);
  }
);

router.on("invalid", (event) => {
  const status = event.detail.response.status;
  if (status === 401 || status === 419) {
    event.preventDefault();
    redirectToLoginIfNeeded();
    return;
  }

  if (status === 403) {
    event.preventDefault();
    toast.error(ACCESS_DENIED_MESSAGE);
  } else if (status === 429) {
    event.preventDefault();
    toast.error(TOO_MANY_REQUESTS_MESSAGE);
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
    const rootContainer = el as HTMLElement & { _reactRootContainer?: ReturnType<typeof createRoot> };
    if (!rootContainer._reactRootContainer) {
      rootContainer._reactRootContainer = createRoot(el);
    }
    rootContainer._reactRootContainer.render(<InertiaApp {...props} />);
  },
});
