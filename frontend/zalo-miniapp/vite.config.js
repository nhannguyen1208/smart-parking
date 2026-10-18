import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const appId = env.APP_ID || env.VITE_ZALO_MINI_APP_ID || "";

  return {
    plugins: [react(), tailwindcss()],
    // Required when packaging for Zalo CDN — see convert-web-app docs
    base: "./",
    appType: "spa",
    define: {
      __ZALO_MINI_APP_ID__: JSON.stringify(appId),
    },
    server: {
      port: 5173,
      host: true,
    },
    build: {
      modulePreload: { polyfill: false },
      rollupOptions: {
        output: {
          entryFileNames: "assets/[name].[hash].module.js",
          chunkFileNames: "assets/[name].[hash].module.js",
          assetFileNames: "assets/[name].[hash][extname]",
        },
      },
    },
  };
});
