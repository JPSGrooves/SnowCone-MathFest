import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import Inspect from 'vite-plugin-inspect';

export default defineConfig({
  base: '/SnowCone-MathFest/', // 👈 this MUST match your repo name
  plugins: [
    react(),
    Inspect()
  ],
});
