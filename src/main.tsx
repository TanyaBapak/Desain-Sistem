import React from "react";
import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import App from "../backend/resources/js/Pages/App";
import './index.css';

void createInertiaApp({
  resolve: (name) => {
    if (name !== "App") {
      throw new Error(`Halaman Inertia tidak ditemukan: ${name}`);
    }

    return App;
  },
  setup({ el, App: InertiaPage, props }) {
    createRoot(el).render(
      <React.StrictMode>
        <InertiaPage {...props} />
      </React.StrictMode>,
    );
  },
});
