// 🎧 soundFX.js — Cosmic SFX Engine 🍧🚛🔥
// Native iOS SFX route lives in src/managers/sfxManager.js.
// Browser fallback still works through Howler there.

import {
  playCorrectSfx,
  playIncorrectSfx,
  playMilestoneSfx,
  playPoints100Sfx,
} from '../../managers/sfxManager.js';

let sfxMuted = false;

function canPlay() {
  return !sfxMuted;
}

export function playCorrect() {
  if (!canPlay()) return;
  playCorrectSfx();
}

export function playIncorrect() {
  if (!canPlay()) return;
  playIncorrectSfx();
}

export function playMilestone() {
  if (!canPlay()) return;
  playMilestoneSfx();
}

export function playPoints100() {
  if (!canPlay()) return;
  playPoints100Sfx();
}

export function toggleSFXMute() {
  sfxMuted = !sfxMuted;
  console.log(`🔇 SFX ${sfxMuted ? 'Muted' : 'Unmuted'}`);
  return sfxMuted;
}

export function isSFXMuted() {
  return sfxMuted;
}