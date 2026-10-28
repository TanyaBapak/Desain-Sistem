import React from "react";
import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import App from "../backend/resources/js/Pages/App";
import { ErrorBoundary } from "./components/shared/ErrorBoundary";
import './index.css';

// Safe guard for external scripts/extensions (Google Translate, Cloudflare beacon) mutating DOM nodes
if (typeof Node === "function" && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn("Node.removeChild safely bypassed: child is not a child of this node.", child);
      }
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };
}

const storedTheme = window.localStorage.getItem("p2mi-theme");
const prefersDarkTheme = window.matchMedia("(prefers-color-scheme: dark)").matches;
document.documentElement.classList.toggle(
  "dark",
  storedTheme === "dark" || (storedTheme !== "light" && prefersDarkTheme),
);

void createInertiaApp({
  resolve: (name) => {
    if (name !== "App") {
      throw new Error(`Halaman Inertia tidak ditemukan: ${name}`);
    }

    return App;
  },
  setup({ el, App: InertiaPage, props }) {
    createRoot(el).render(
      <ErrorBoundary>
        <InertiaPage {...props} />
      </ErrorBoundary>,
    );
  },
});
