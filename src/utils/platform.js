// src/utils/platform.js

// 🌐 Unified platform detection — stays dynamic
export function isIOSNative() {
  const w = typeof window !== 'undefined' ? window : globalThis;

  // 1) Native flag injected by Capacitor/WKWebView
  const nativeFlag = !!w.SC_IOS_NATIVE;

  // 2) Capacitor presence check (extra safety)
  const hasCapacitor = !!w.Capacitor;

  // 3) Build-time env from Vite (--mode ios + .env.ios)
  const envFlag = import.meta.env?.VITE_PLATFORM === 'ios';

  return nativeFlag || hasCapacitor || envFlag;
}

export function getPlatformLabel() {
  return isIOSNative() ? 'ios-native' : 'web';
}

