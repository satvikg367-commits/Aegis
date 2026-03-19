import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const appRoot = path.resolve(__dirname);
const devBackendTarget = process.env.VITE_DEV_BACKEND_TARGET || "http://127.0.0.1:4000";

export default defineConfig({
  root: appRoot,
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    fs: {
      strict: true,
      allow: [appRoot]
    },
    proxy: {
      "/api": {
        target: devBackendTarget,
        changeOrigin: true,
        secure: false
      }
    },
    watch: {
      ignored: (filePath) => !filePath.startsWith(appRoot)
    }
  },
  optimizeDeps: {
    entries: [path.resolve(appRoot, "index.html")]
  }
});
