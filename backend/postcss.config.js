import autoprefixer from "autoprefixer";
import tailwindcss from "tailwindcss";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendDirectory = path.dirname(fileURLToPath(import.meta.url));

export default {
  plugins: [
    tailwindcss({
      config: path.resolve(backendDirectory, "../tailwind.config.js"),
    }),
    autoprefixer(),
  ],
};
