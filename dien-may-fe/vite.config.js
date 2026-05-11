import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // Bind 0.0.0.0 để truy cập từ ngoài container
    allowedHosts: ["e-commerce-fe-hmfd.onrender.com"],
  },
});
