// src/utils/platform.js

// 🌐 Unified platform detection — stays dynamic
// 🔍 True *only* inside the native iOS app.
// Your WKWebView / native shell should inject:  window.SC_IOS_NATIVE = true;
// Browsers (even on iPhone/iPad) will NOT set this, so this stays false on web.
export function isIOSNative() {
  if (typeof window === 'undefined') return false;
  return window.SC_IOS_NATIVE === true;
}

export function getPlatformLabel() {
  return isIOSNative() ? 'ios-native' : 'web';
}
