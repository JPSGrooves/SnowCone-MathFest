// vite.config.native.js
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',                     // for capacitor://localhost
  server: {
    port: 5173,
    strictPort: true,
  },
});
