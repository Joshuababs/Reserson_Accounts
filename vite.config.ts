import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  // Its own port so all three apps can run at once locally, which is the only way
  // to exercise a handoff between them.
  server: { port: 8097 },
});
