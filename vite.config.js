import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import Inspect from 'vite-plugin-inspect';

export default defineConfig({
  base: '/SnowCone-MathFest/', // GH Pages magic cone trail
  plugins: [
    react(),
    Inspect() // Optional dev tools — safe to keep
  ],
  server: {
    port: 5173,
    strictPort: true
  }
});
