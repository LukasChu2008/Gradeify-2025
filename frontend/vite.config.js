import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // NEW: proxy auth + user data to backend
      "/auth": "http://localhost:3001",
      "/me": "http://localhost:3001",
    },
    // (optional) if Codespaces: set host true so it binds properly
    host: true,
  },
});
