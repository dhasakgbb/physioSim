import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    force: true, // Force pre-bundling on every server start
  },
  optimizeDeps: {
    force: true, // Always re-optimize dependencies
  },
  build: {
    minify: false, // Disable minification for easier debugging
  },
  cacheDir: process.env.NODE_ENV === 'production' ? '.vite' : false, // Disable cache in dev
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
  },
});
