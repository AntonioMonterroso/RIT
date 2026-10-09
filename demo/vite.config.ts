import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "node:path";

const raiz = path.resolve(__dirname, "..");

// Empaqueta todo el sistema en un único archivo HTML (modo local, sin servidor ni cuentas).
export default defineConfig({
  root: raiz,
  publicDir: false,
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: [
      { find: /^@\//, replacement: `${raiz}/` },
      { find: /^next\/link$/, replacement: path.resolve(__dirname, "shims/link.tsx") },
      { find: /^next\/navigation$/, replacement: path.resolve(__dirname, "shims/navigation.ts") },
    ],
  },
  // Sin Supabase en la demostración: el sistema usa el almacenamiento del navegador.
  define: {
    "process.env.NEXT_PUBLIC_SUPABASE_URL": "undefined",
    "process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY": "undefined",
  },
  css: { postcss: { plugins: [] } }, // Tailwind entra por su plugin de Vite; se ignora el postcss.config de Next
  build: {
    outDir: path.resolve(raiz, "dist-demo"),
    emptyOutDir: true,
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    chunkSizeWarningLimit: 6000,
    rollupOptions: { input: path.resolve(__dirname, "index.html") },
  },
});
