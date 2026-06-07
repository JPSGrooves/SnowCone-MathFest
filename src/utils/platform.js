// src/utils/platform.js
import { Capacitor } from '@capacitor/core';

/**
 * We want a VERY robust native detection for SCMF because:
 * - you inject SC_IOS_NATIVE via WKUserScript (we saw it in your Xcode logs)
 * - older builds used VITE_PLATFORM=ios
 * - Capacitor detection should be primary, but we add fallbacks so we don't
 *   accidentally drop into "web vibrate" (which iOS basically ignores anyway).
 *
 * IMPORTANT:
 * - We do NOT use iOS user-agent sniffing. Too easy to mis-detect Safari web.
 */

function getWindowish() {
  try {
    return typeof window !== 'undefined' ? window : globalThis;
  } catch {
    return globalThis;
  }
}

export function getNativePlatform() {
  // Returns: 'ios' | 'android' | 'web'
  try {
    if (Capacitor?.getPlatform) return Capacitor.getPlatform();
  } catch {
    // ignore
  }

  const w = getWindowish();
  try {
    if (w?.Capacitor?.getPlatform) return w.Capacitor.getPlatform();
  } catch {
    // ignore
  }

  // Fallback to build flag if present
  try {
    const p = import.meta?.env?.VITE_PLATFORM;
    if (p === 'ios' || p === 'android') return p;
  } catch {
    // ignore
  }

  return 'web';
}

export function isNativeRuntime() {
  const w = getWindowish();

  // 1) Primary: Capacitor API
  try {
    if (Capacitor?.isNativePlatform?.()) return true;
  } catch {
    // ignore
  }

  // 2) Secondary: global Capacitor bridge presence
  try {
    if (w?.Capacitor?.isNativePlatform?.()) return true;
    if (w?.Capacitor?.getPlatform && w.Capacitor.getPlatform() !== 'web') return true;
  } catch {
    // ignore
  }

  // 3) Your existing injected flag (proven by your Xcode logs)
  try {
    if (w?.SC_IOS_NATIVE === true) return true;
  } catch {
    // ignore
  }

  // 4) Legacy build-flag fallback (from your notes)
  try {
    const p = import.meta?.env?.VITE_PLATFORM;
    if (p && p !== 'web') return true;
  } catch {
    // ignore
  }

  return false;
}

export function isIOSNative() {
  try {
    return isNativeRuntime() && getNativePlatform() === 'ios';
  } catch {
    return false;
  }
}

export function getPlatformLabel() {
  try {
    const p = getNativePlatform();
    return isNativeRuntime() ? `${p}-native` : 'web';
  } catch {
    return 'web';
  }
}
