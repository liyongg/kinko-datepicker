import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { config } from "dotenv";
import path from "path";

// Load environment variables from .env file located one directory above
config({ path: path.resolve(__dirname, "../.env") });

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: `http://localhost:${process.env.PORT}`, // Replace with your backend server URL
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
