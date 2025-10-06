// 🎧 soundFX.js — Cosmic SFX Engine 🍧🚛🔥

import { Howl, Howler } from 'howler';

//////////////////////////////
// 🔊 SFX Map (Vite-safe paths)
//////////////////////////////
const sfxMap = {
  correct: `${import.meta.env.BASE_URL}assets/audio/SFX/correct.mp3`,
  incorrect: `${import.meta.env.BASE_URL}assets/audio/SFX/incorrect.mp3`,
  milestone: `${import.meta.env.BASE_URL}assets/audio/SFX/QuikServepointsmilestone.mp3`,
  points100: `${import.meta.env.BASE_URL}assets/audio/SFX/QuikServepoints100.mp3`
};

//////////////////////////////
// 🚀 Load SFX Objects
//////////////////////////////
const SFX_VOLUME = 0.2; // 🔥 Turned way down but still audible

const sfx = {};
for (const [key, path] of Object.entries(sfxMap)) {
  sfx[key] = new Howl({
    src: [path],
    volume: Howler._muted ? 0 : SFX_VOLUME
  });
}

//////////////////////////////
// 🔥 Generic Play Handler
//////////////////////////////
function playSFX(name) {
  const sound = sfx[name];
  if (!sound) {
    console.warn(`⚠️ SFX "${name}" not found.`);
    return;
  }
  sound.play();
}

//////////////////////////////
// 🚀 Public SFX Triggers
//////////////////////////////
export function playCorrect() {
  playSFX('correct');
}

export function playIncorrect() {
  playSFX('incorrect');
}

export function playMilestone() {
  playSFX('milestone');
}

export function playPoints100() {
  playSFX('points100');
}

//////////////////////////////
// 🔇 Global Mute Control
//////////////////////////////
export function toggleSFXMute() {
  const isMuted = Howler._muted;
  Howler.mute(!isMuted);
  return !isMuted;
}

export function isSFXMuted() {
  return Howler._muted;
}
