
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    proxy: {
      "/ai/chat": {
        target: "http://127.0.0.1:11434",
        changeOrigin: true,
        rewrite: () => "/api/chat",
        timeout: 180000,
        proxyTimeout: 180000,
      },
    },
  },
});
