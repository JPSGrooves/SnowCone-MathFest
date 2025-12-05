// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const isIosBuild = mode === 'ios';

  return {
    // 📦 Web build → GitHub Pages, ios build → Capacitor
    base: isIosBuild ? '/' : '/SnowCone-MathFest/',
    server: {
      port: 5173,
      strictPort: true,
    },
  };
});
