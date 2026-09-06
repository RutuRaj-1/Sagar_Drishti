import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Cesium static assets are pre-copied to public/cesium/ so Vite serves them
// in both dev and prod. The CESIUM_BASE_URL global points there.

export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    host: true,
    port: 5173,
    proxy: {
      // Explicit IPv4 target prevents IPv6 resolution failure on Windows
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
  define: {
    // Cesium assets are served from /cesium/ by Vite's public folder
    CESIUM_BASE_URL: JSON.stringify('/cesium'),
    // Cesium uses global – make it available in ESM context
    global: 'window',
  },
  build: {
    chunkSizeWarningLimit: 10000,
  },
});
