import react from "@vitejs/plugin-react";
import laravel from "laravel-vite-plugin";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const backendDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(backendDirectory, "..");

export default defineConfig({
  plugins: [
    laravel({
      input: ["resources/js/app.tsx"],
      refresh: ["../src/**", "resources/views/**"],
    }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(projectDirectory, "src"),
      "react": path.resolve(projectDirectory, "node_modules/react"),
      "react-dom": path.resolve(projectDirectory, "node_modules/react-dom"),
    },
    dedupe: ["react", "react-dom", "@inertiajs/react"],
  },
  server: {
    port: 3000,
    fs: {
      allow: [projectDirectory],
    },
  },
});
