import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/auth": { target: "http://localhost:4000", changeOrigin: true },
      "/projects": { target: "http://localhost:4000", changeOrigin: true },
      "/tasks": { target: "http://localhost:4000", changeOrigin: true },
      "/users": { target: "http://localhost:4000", changeOrigin: true },
      "/stream": { target: "http://localhost:4000", changeOrigin: true },
      "/health": { target: "http://localhost:4000", changeOrigin: true },
    },
  },
});
