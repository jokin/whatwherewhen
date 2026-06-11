import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt", // user confirms updates via the in-app toast
      includeAssets: ["fonts/*.woff2", "icons/*.png"],
      manifest: {
        name: "Elsewhere '26 — What Where When",
        short_name: "WWW '26",
        description: "The Elsewhere festival guide — 677 events, 37 camps, fully offline.",
        theme_color: "#2e4439",
        background_color: "#e8dfc9",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "/icons/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/pwa-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // precache the entire app — it must work fully offline, fonts and data included
        globPatterns: ["**/*.{js,css,html,woff2,png,svg,json,webmanifest}"],
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
