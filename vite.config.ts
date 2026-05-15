import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "node:path";

// Repo name on GitHub determines the base path on GitHub Pages.
// User URL: https://tilastomuuttujat.github.io/book-haven/
const REPO = "book-haven";

export default defineConfig(({ mode }) => ({
  base: mode === "production" ? `/${REPO}/` : "/",
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    host: "::",
    port: 8080,
    strictPort: true,
  },
}));
