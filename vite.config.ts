import { defineConfig } from "vite";

const REPO = "book-haven";

export default defineConfig(({ mode }) => ({
  base: mode === "production" ? `/${REPO}/` : "/",
  server: {
    host: "::",
    port: 8080,
    strictPort: true,
  },
}));
