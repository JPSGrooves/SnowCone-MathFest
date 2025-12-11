// src/utils/haptics.js
// 🔊 SnowCone MathFest – unified haptics layer

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { isIOSNative } from './platform.js';

// Internal: safe call wrapper so we never crash the game
async function safeNativeCall(fn, label) {
  try {
    await fn();
    // console.log(`[HAPTICS] native ${label} ok`);
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

// Central helper so we can log what path we’re taking
function usingNativeHaptics() {
  const native = isIOSNative();
  // console.log('[HAPTICS] usingNativeHaptics?', { native, hasPlugin: !!Haptics });
  return native && !!Haptics;
}

// 🧊 Light tap – menus, small clicks
export function hapticTap() {
  if (!usingNativeHaptics()) {
    // Web / PWA path → use navigator.vibrate when available
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
  if (!usingNativeHaptics()) {
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
  if (!usingNativeHaptics()) {
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
  if (!usingNativeHaptics()) {
    vibrate([0, 25, 10, 25]);
    return;
  }

  safeNativeCall(
    () => Haptics.impact({ style: ImpactStyle.Medium }),
    'softPulse'
  );
}
