import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import App from "../backend/resources/js/Pages/App";
import './index.css';

// Guard against third-party DOM mutations (Google Translate, password managers, browser extensions)
if (typeof Node === "function" && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      if (child.parentNode) {
        return child.parentNode.removeChild(child);
      }
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (referenceNode.parentNode) {
        return referenceNode.parentNode.insertBefore(newNode, referenceNode);
      }
      return this.appendChild(newNode) as T;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
}

const storedTheme = window.localStorage.getItem("p2mi-theme");
const prefersDarkTheme = window.matchMedia("(prefers-color-scheme: dark)").matches;
document.documentElement.classList.toggle(
  "dark",
  storedTheme === "dark" || (storedTheme !== "light" && prefersDarkTheme),
);

void createInertiaApp({
  title: (title) => (title ? `${title} — SMK Go Global` : "SMK Go Global"),
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
