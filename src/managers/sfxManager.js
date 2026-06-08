// src/managers/sfxManager.js
// 🍧 Unified SCMF SFX manager
// iOS native → Swift AVAudioPlayer
// web fallback → Howler

import { Howl, Howler } from 'howler';
import {
  hasNativeAudioBridge,
  nativePlaySfx,
} from './nativeAudioBridge.js';

const SFX_VOLUME_DEFAULT = 0.25;

const SFX_FILES = {
  correct: 'correct.mp3',
  incorrect: 'incorrect.mp3',

  milestone: 'QuikServemilestone.mp3',
  QuikServemilestone: 'QuikServemilestone.mp3',

  points100: 'QuikServepoints100.mp3',
  QuikServepoints100: 'QuikServepoints100.mp3',

  mosquito: 'mosquito.mp3',
  tentSuccess: 'tentSuccess.mp3',

  smDing: 'smDing.mp3',
  smDing2: 'smDing2.mp3',

  honk1: 'honk1.mp3',
  honk2: 'honk2.mp3',
  honk3: 'honk3.mp3',
  honk4: 'honk4.mp3',
  honk5: 'honk5.mp3',
};

function normalizeSfxId(raw) {
  if (!raw) return '';

  let id = String(raw).trim();

  if (id.endsWith('.mp3')) {
    id = id.slice(0, -4);
  }

  switch (id) {
    case 'QuikServepointsmilestone':
      return 'milestone';

    case 'QuikServemilestone':
      return 'milestone';

    case 'QuikServepoints100':
      return 'points100';

    default:
      return id;
  }
}

export function playSfx(rawId, opts = {}) {
  const id = normalizeSfxId(rawId);
  if (!id) return false;

  const volume = typeof opts.volume === 'number'
    ? opts.volume
    : SFX_VOLUME_DEFAULT;

  if (hasNativeAudioBridge()) {
    return nativePlaySfx(id, { volume });
  }

  const file = SFX_FILES[id];

  if (!file) {
    console.warn(`[sfxManager] Unknown SFX "${rawId}" normalized="${id}"`);
    return false;
  }

  if (Howler?._muted) return true;

  try {
    const sfx = new Howl({
      src: [`${import.meta.env.BASE_URL}assets/audio/SFX/${file}`],
      volume,
      html5: false,
    });

    sfx.play();
    return true;
  } catch (err) {
    console.warn('[sfxManager] playSfx failed:', rawId, err);
    return false;
  }
}

export function playCorrectSfx() {
  return playSfx('correct', { volume: 0.2 });
}

export function playIncorrectSfx() {
  return playSfx('incorrect', { volume: 0.2 });
}

export function playMilestoneSfx() {
  return playSfx('milestone', { volume: 0.25 });
}

export function playPoints100Sfx() {
  return playSfx('points100', { volume: 0.25 });
}

export function playHonkSfx(index = 1, opts = {}) {
  const safe = Math.max(1, Math.min(5, Number(index) || 1));
  return playSfx(`honk${safe}`, opts);
}