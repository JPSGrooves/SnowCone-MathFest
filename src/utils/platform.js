// src/utils/platform.js

// 🧠 Are we running the *iOS build* of SnowCone (built with .env.ios)?
export function isIOSBuild() {
  const platform = import.meta.env?.VITE_PLATFORM || 'web';
  return platform === 'ios';
}

// 🌐 Unified platform detection — but *only* true for the iOS build
export function isIOSNative() {
  const w = typeof window !== 'undefined' ? window : globalThis;

  // 1) If this isn't the iOS-flavored bundle, we are never "native iOS"
  if (!isIOSBuild()) return false;

  // 2) Native hints only relevant *inside* that bundle
  const nativeFlag   = !!w.SC_IOS_NATIVE;    // set by your WKWebView shell
  const hasCapacitor = !!w.Capacitor;        // Capacitor bridge present
  const ua           = w.navigator?.userAgent || '';
  const isiOSUA      = /iPhone|iPad|iPod/i.test(ua);

  // Any of these is enough *once* we know we're in the iOS build
  return nativeFlag || hasCapacitor || isiOSUA;
}

// Optional label helper if you want it for logging/UI
export function getPlatformLabel() {
  return isIOSNative() ? 'ios-native' : 'web';
}
