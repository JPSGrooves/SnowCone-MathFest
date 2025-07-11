import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/SnowCone-MathFest/', // GH Pages magic cone trail
  plugins: [
    react()
  ],
  server: {
    port: 5173,
    strictPort: true
  }
});
