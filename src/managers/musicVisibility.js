// /src/managers/musicVisibility.js
// Global “lock screen” guard for SnowCone MathFest music 🎧
// Pauses when the tab/app is hidden, resumes if it was playing before.

import { isPlaying, togglePlayPause } from './musicManager.js';

// Tracks if we *should* resume when user returns
let wasPlayingBeforeHide = false;
let wired = false;

function onVisibilityChange() {
  try {
    const hidden = document.hidden;

    if (hidden) {
      // Snapshot current playing state and pause once.
      wasPlayingBeforeHide = !!isPlaying?.();
      if (wasPlayingBeforeHide) {
        togglePlayPause?.(); // pause
      }
    } else {
      // Only auto-resume if we *had* something playing when we left.
      if (wasPlayingBeforeHide) {
        togglePlayPause?.(); // resume from same position
      }
      wasPlayingBeforeHide = false;
    }
  } catch (err) {
    console.warn('[musicVisibility] visibility handler error:', err);
  }
}

// Call this once from your app bootstrap (e.g., main.js)
export function wireMusicVisibilityGuard() {
  if (wired) return;
  if (typeof document === 'undefined') return;
  document.addEventListener('visibilitychange', onVisibilityChange);
  wired = true;
}
