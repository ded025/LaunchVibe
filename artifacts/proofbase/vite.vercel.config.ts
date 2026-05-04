/**
 * Vercel-safe Vite config for proofbase.
 * Unlike vite.config.ts (which throws on missing PORT/BASE_PATH),
 * this config uses safe defaults so Vercel CI builds succeed.
 *
 * Vercel build command uses this file:
 *   vite build --config vite.vercel.config.ts
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const basePath = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss({ optimize: false }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          clerk: ["@clerk/react"],
          leaflet: ["leaflet", "react-leaflet"],
          motion: ["framer-motion"],
        },
      },
    },
  },
});
