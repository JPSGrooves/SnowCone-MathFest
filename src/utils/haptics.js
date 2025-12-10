// src/utils/haptics.js
// 🔊 SnowCone MathFest – unified haptics layer

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { isIOSNative } from './platform.js';

// Internal: safe call wrapper so we never crash the game
async function safeNativeCall(fn, label) {
  try {
    await fn();
  } catch (err) {
    console.warn(`[HAPTICS] native ${label} failed`, err);
  }
}

// Small helper so we don't explode in non-browser / SSR-ish situations
function canVibrate() {
  try {
    return typeof navigator !== 'undefined' && !!navigator.vibrate;
  } catch {
    return false;
  }
}

function vibrate(pattern) {
  if (!canVibrate()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // ignore – some browsers lie about vibrate support
  }
}

// 🧊 Light tap – menus, small clicks
export function hapticTap() {
  // Web / PWA path → use navigator.vibrate when available
  if (!isIOSNative()) {
    vibrate(15);
    return;
  }

  // Native iOS shell → Capacitor haptics
  if (!Haptics) {
    // ultra-defensive: if plugin is missing for some reason, fall back to web vibe
    vibrate(15);
    return;
  }

  safeNativeCall(
    () => Haptics.impact({ style: ImpactStyle.Light }),
    'tap'
  );
}

// 🎯 Medium impact – correct answers, good actions
export function hapticSuccess() {
  if (!isIOSNative()) {
    vibrate(50);
    return;
  }

  if (!Haptics) {
    vibrate(50);
    return;
  }

  safeNativeCall(
    () => Haptics.notification({ type: NotificationType.Success }),
    'success'
  );
}

// ⚠️ Error feedback – wrong answer, blocked action
export function hapticError() {
  if (!isIOSNative()) {
    vibrate(80);
    return;
  }

  if (!Haptics) {
    vibrate(80);
    return;
  }

  safeNativeCall(
    () => Haptics.notification({ type: NotificationType.Error }),
    'error'
  );
}

// 🌊 Soft pulse – special rewards, XP, badges
export function hapticSoftPulse() {
  if (!isIOSNative()) {
    vibrate([0, 25, 10, 25]);
    return;
  }

  if (!Haptics) {
    vibrate([0, 25, 10, 25]);
    return;
  }

  safeNativeCall(
    () => Haptics.impact({ style: ImpactStyle.Medium }),
    'softPulse'
  );
}
