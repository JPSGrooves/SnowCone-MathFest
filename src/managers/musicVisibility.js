// /src/managers/musicVisibility.js
// Global “lock screen” guard for SnowCone MathFest music 🎧
//
// Web only now.
// Native iOS audio lifecycle is owned by Swift.

import { isIOSNative } from '../utils/platform.js';
import { isPlaying, togglePlayPause } from './musicManager.js';

let wasPlayingBeforeHide = false;
let wired = false;

function isNativeIOSAudioRuntime() {
  try {
    if (typeof window !== 'undefined' && window.SC_IOS_NATIVE === true) return true;
  } catch {}

  try {
    return isIOSNative();
  } catch {}

  return false;
}

function onVisibilityChange() {
  if (isNativeIOSAudioRuntime()) return;

  try {
    const hidden = document.hidden;

    if (hidden) {
      wasPlayingBeforeHide = !!isPlaying?.();
      if (wasPlayingBeforeHide) {
        togglePlayPause?.();
      }
    } else {
      if (wasPlayingBeforeHide) {
        togglePlayPause?.();
      }
      wasPlayingBeforeHide = false;
    }
  } catch (err) {
    console.warn('[musicVisibility] visibility handler error:', err);
  }
}

export function wireMusicVisibilityGuard() {
  if (wired) return;
  if (typeof document === 'undefined') return;

  wired = true;

  if (isNativeIOSAudioRuntime()) {
    console.log('[musicVisibility] Native iOS detected; visibility guard disabled.');
    return;
  }

  document.addEventListener('visibilitychange', onVisibilityChange);
}