// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const isIosBuild = mode === 'ios';

  return {
    // ✅ iOS/Capacitor wants root paths (capacitor://localhost/)
    // ✅ Web/GH Pages wants repo subpath
    base: isIosBuild ? '/' : '/SnowCone-MathFest/',

    server: {
      port: 5173,
      strictPort: true,
    },
  };
});
