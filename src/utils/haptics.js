// src/utils/haptics.js

// We’re coding this way so:
// 1) It never crashes if vibration/Haptics isn’t available.
// 2) It works both in browser-only PWA and in native (Capacitor) builds.
// 3) The rest of the app just calls tiny named helpers like hapticTap().

let canVibrate = false;

try {
  canVibrate =
    typeof navigator !== 'undefined' &&
    typeof navigator.vibrate === 'function';
} catch (err) {
  canVibrate = false;
}

// ─────────────────────────────────────────
// Basic patterns using the Vibration API
// ─────────────────────────────────────────

export function hapticSuccess() {
  console.log('[HAPTICS] hapticSuccess() fired');
  if (!canVibrate) return;
  navigator.vibrate([0, 30, 40, 30]);
}

export function hapticTap() {
  console.log('[HAPTICS] hapticTap() fired');
  if (!canVibrate) return;
  navigator.vibrate(15);
}

export function hapticError() {
  console.log('[HAPTICS] hapticError() fired');
  if (!canVibrate) return;
  navigator.vibrate([0, 20, 30, 20, 30, 20]);
}

export function hapticSoftPulse() {
  console.log('[HAPTICS] hapticSoftPulse() fired');
  if (!canVibrate) return;
  navigator.vibrate(10);
}
