import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Resolve React from this workspace to avoid monorepo version conflicts
const reactPath = path.dirname(require.resolve("react/package.json"));
const reactDomPath = path.dirname(require.resolve("react-dom/package.json"));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024, // 8MB — main bundle is ~5.7MB
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/],
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 },
            },
          },
        ],
      },
      manifest: false, // use existing public/manifest.json
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react": reactPath,
      "react-dom": reactDomPath,
      "react/jsx-runtime": path.join(reactPath, "jsx-runtime"),
      "react/jsx-dev-runtime": path.join(reactPath, "jsx-dev-runtime"),
    },
    dedupe: ["react", "react-dom"],
  },
}));
