// src/managers/nativeAudioBridge.js
// 🍧 Native iOS audio bridge for SnowCone MathFest
// JS stays in charge of game logic.
// Swift owns iOS audio playback.

import { isIOSNative } from '../utils/platform.js';

function getWindowish() {
  try {
    return typeof window !== 'undefined' ? window : globalThis;
  } catch {
    return globalThis;
  }
}

const nativeAudioStateListeners = new Set();
let nativeAudioStateReceiverInstalled = false;

function installNativeAudioStateReceiver() {
  if (nativeAudioStateReceiverInstalled) return;
  nativeAudioStateReceiverInstalled = true;

  const w = getWindowish();

  w.__SCMF_receiveNativeAudioState = (payload = {}) => {
    nativeAudioStateListeners.forEach((fn) => {
      try { fn(payload); } catch (err) {
        console.warn('[nativeAudioBridge] native state listener failed:', err);
      }
    });
  };
}

export function subscribeNativeAudioState(fn) {
  if (typeof fn !== 'function') return () => {};

  installNativeAudioStateReceiver();
  nativeAudioStateListeners.add(fn);

  return () => {
    nativeAudioStateListeners.delete(fn);
  };
}

export function hasNativeAudioBridge() {
  try {
    const w = getWindowish();

    return (
      isIOSNative() &&
      !!w?.webkit?.messageHandlers?.scmfAudioBridge?.postMessage
    );
  } catch {
    return false;
  }
}

export function sendNativeAudio(payload = {}) {
  try {
    if (!hasNativeAudioBridge()) return false;

    const w = getWindowish();
    w.webkit.messageHandlers.scmfAudioBridge.postMessage(payload);

    return true;
  } catch (err) {
    console.warn('[nativeAudioBridge] postMessage failed:', err);
    return false;
  }
}

export function nativePlayTrack(id, opts = {}) {
  if (!id) return false;

  return sendNativeAudio({
    type: 'playTrack',
    id,
    volume: typeof opts.volume === 'number' ? opts.volume : 0.7,
    startAt: typeof opts.startAt === 'number' ? opts.startAt : 0,
    looping: !!opts.looping,

    // IMPORTANT:
    // Default mode music should NEVER override Apple Music / Spotify.
    // User soundtrack wins.
    allowExternalAudio: !!opts.allowExternalAudio,
  });
}

export function nativePauseTrack() {
  return sendNativeAudio({ type: 'pauseTrack' });
}

export function nativeResumeTrack(opts = {}) {
  return sendNativeAudio({
    type: 'resumeTrack',
    allowExternalAudio: !!opts.allowExternalAudio,
  });
}

export function nativeTogglePlayPause() {
  return sendNativeAudio({ type: 'togglePlayPause' });
}

export function nativeStopTrack() {
  return sendNativeAudio({ type: 'stopTrack' });
}

export function nativeSetLooping(looping) {
  return sendNativeAudio({
    type: 'setLooping',
    looping: !!looping,
  });
}

export function nativeSetMuted(muted) {
  return sendNativeAudio({
    type: 'setMuted',
    muted: !!muted,
  });
}

export function nativeSetMusicVolume(volume) {
  return sendNativeAudio({
    type: 'setMusicVolume',
    volume: Number.isFinite(Number(volume)) ? Number(volume) : 0.7,
  });
}

export function nativeSetSfxVolume(volume) {
  return sendNativeAudio({
    type: 'setSfxVolume',
    volume: Number.isFinite(Number(volume)) ? Number(volume) : 0.35,
  });
}

export function nativePlaySfx(id, opts = {}) {
  if (!id) return false;

  return sendNativeAudio({
    type: 'playSfx',
    id,
    volume: typeof opts.volume === 'number' ? opts.volume : 0.35,
  });
}

export function nativeSetPolicy(policy = 'respectSilentSwitch') {
  return sendNativeAudio({
    type: 'setPolicy',
    policy,
  });
}

export function nativeRequestMusicState() {
  return sendNativeAudio({ type: 'requestMusicState' });
}

export function nativeSeekPercent(percent) {
  const n = Number(percent);

  return sendNativeAudio({
    type: 'seekPercent',
    percent: Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0,
  });
}