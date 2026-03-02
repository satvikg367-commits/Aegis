import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const appRoot = path.resolve(__dirname);

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
    watch: {
      ignored: (filePath) => !filePath.startsWith(appRoot)
    }
  },
  optimizeDeps: {
    entries: [path.resolve(appRoot, "index.html")]
  }
});
