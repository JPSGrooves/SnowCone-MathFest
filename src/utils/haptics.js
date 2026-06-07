// src/utils/haptics.js
// 🔊 SnowCone MathFest – unified haptics layer (+ on-device self-test)

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { isNativeRuntime, getPlatformLabel } from './platform.js';

// Internal: safe call wrapper so we never crash the game
async function safeNativeCall(fn, label) {
  try {
    await fn();
    return true;
  } catch (err) {
    console.warn(`[HAPTICS] native ${label} failed`, err);
    return false;
  }
}

function canVibrate() {
  try {
    return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  } catch {
    return false;
  }
}

function vibrate(pattern) {
  if (!canVibrate()) return false;
  try {
    navigator.vibrate(pattern);
    return true;
  } catch {
    return false;
  }
}

function usingNativeHaptics() {
  const native = isNativeRuntime();

  // Be explicit: some environments can have an object but not the methods
  const hasPlugin =
    !!Haptics &&
    typeof Haptics.impact === 'function' &&
    typeof Haptics.notification === 'function' &&
    typeof Haptics.vibrate === 'function';

  return native && hasPlugin;
}

// 🧊 Light tap – menus, small clicks
export function hapticTap() {
  const native = usingNativeHaptics();
  // Debug line (leave it while hunting)
  console.log('[HAPTICS] hapticTap()', { native, platform: getPlatformLabel() });

  if (!native) {
    vibrate(15);
    return;
  }

  void safeNativeCall(
    () => Haptics.impact({ style: ImpactStyle.Light }),
    'tap'
  );
}

// 🎯 Medium impact – correct answers, good actions
export function hapticSuccess() {
  const native = usingNativeHaptics();
  console.log('[HAPTICS] hapticSuccess()', { native, platform: getPlatformLabel() });

  if (!native) {
    vibrate(50);
    return;
  }

  void safeNativeCall(
    () => Haptics.notification({ type: NotificationType.Success }),
    'success'
  );
}

// ⚠️ Error feedback – wrong answer, blocked action
export function hapticError() {
  const native = usingNativeHaptics();
  console.log('[HAPTICS] hapticError()', { native, platform: getPlatformLabel() });

  if (!native) {
    vibrate(80);
    return;
  }

  void safeNativeCall(
    () => Haptics.notification({ type: NotificationType.Error }),
    'error'
  );
}

// 🌊 Soft pulse – special rewards, XP, badges
export function hapticSoftPulse() {
  const native = usingNativeHaptics();
  console.log('[HAPTICS] hapticSoftPulse()', { native, platform: getPlatformLabel() });

  if (!native) {
    vibrate([0, 25, 10, 25]);
    return;
  }

  void safeNativeCall(
    () => Haptics.impact({ style: ImpactStyle.Medium }),
    'softPulse'
  );
}

/**
 * 🔬 Dev-only: quick on-device self-test.
 * Run in iOS Safari remote inspector console:
 *   window.__hapticsTest()
 */
export async function hapticsSelfTest() {
  const native = usingNativeHaptics();
  const platform = getPlatformLabel();

  console.log('[HAPTICS][TEST] begin', { native, platform, hasNavigatorVibrate: canVibrate() });

  if (!native) {
    console.log('[HAPTICS][TEST] native not available → trying navigator.vibrate patterns');
    console.log('[HAPTICS][TEST] vibrate(15) ok?', vibrate(15));
    await new Promise(r => setTimeout(r, 220));
    console.log('[HAPTICS][TEST] vibrate([0,25,10,25]) ok?', vibrate([0, 25, 10, 25]));
    return;
  }

  console.log('[HAPTICS][TEST] native available → running impact + notification + vibrate');
  await safeNativeCall(() => Haptics.impact({ style: ImpactStyle.Heavy }), 'test impact heavy');
  await new Promise(r => setTimeout(r, 250));
  await safeNativeCall(() => Haptics.notification({ type: NotificationType.Success }), 'test notif success');
  await new Promise(r => setTimeout(r, 250));
  await safeNativeCall(() => Haptics.notification({ type: NotificationType.Error }), 'test notif error');
  await new Promise(r => setTimeout(r, 250));
  await safeNativeCall(() => Haptics.vibrate(), 'test vibrate');
  console.log('[HAPTICS][TEST] done ✅');
}

// expose for easy console testing
if (typeof window !== 'undefined') {
  window.__hapticsTest = () => hapticsSelfTest();
}
