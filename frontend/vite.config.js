import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    // Copy Cesium assets to build output
    viteStaticCopy({
      targets: [
        {
          src: path.join('node_modules', 'cesium', 'Build', 'Cesium', 'Workers'),
          dest: 'cesium'
        },
        {
          src: path.join('node_modules', 'cesium', 'Build', 'Cesium', 'ThirdParty'),
          dest: 'cesium'
        },
        {
          src: path.join('node_modules', 'cesium', 'Build', 'Cesium', 'Assets'),
          dest: 'cesium'
        },
        {
          src: path.join('node_modules', 'cesium', 'Build', 'Cesium', 'Widgets'),
          dest: 'cesium'
        }
      ]
    })
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
    // Define Cesium base URL for asset loading
    CESIUM_BASE_URL: JSON.stringify('/cesium')
  }
});
