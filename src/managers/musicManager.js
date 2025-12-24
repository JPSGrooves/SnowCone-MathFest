// src/managers/musicManager.js
import { Howl, Howler } from 'howler';
import { isIOSNative } from '../utils/platform.js'; // 🔍 single source of truth

// iOS: prefer WebAudio so the hardware silent switch behaves consistently.
// (HTML5 <audio> is the one that tends to ignore the silent switch.)
function preferWebAudioOnIOS() {
  try {
    const ua = navigator.userAgent || '';
    const isiOS =
      /iPad|iPhone|iPod/.test(ua) ||
      // iPadOS reports as Mac sometimes:
      (ua.includes('Mac') && 'ontouchend' in document);
    return isiOS;
  } catch {
    return false;
  }
}

function getDefaultHtml5() {
  // html5:true = <audio>
  // html5:false = WebAudio
  return preferWebAudioOnIOS() ? false : true;
}


let currentTrack = null;

// Track meta for UI + index lookup
let currentTrackMeta = null;

// Optional override for end behavior (StoryMode wants to own rotation)
let currentEndOverride = null;

// 💿 Global music loudness (master ceiling for all modes)
const DEFAULT_MUSIC_VOLUME = 0.7; // was 1.0 – noticeably softer without feeling quiet

function getMusicVolume() {
  // Future-proof: if you ever add appState.settings.musicVolume, plug it in here.
  return DEFAULT_MUSIC_VOLUME;
}

let rafId = null;
const fadeDuration = 1000;

// 🔥 Track List
// managers/musicManager.js — full catalog (includes iOS-only tracks)
const allTracks = [
  { id: 'quikserve',      name: 'QuikServe OG',         file: 'quikserveST_OG.mp3' },
  { id: 'kktribute',      name: 'KK Tribute',           file: 'KKtribute.mp3' },
  { id: 'softdown',       name: 'Soft Down Math Vibes', file: 'softDownMathVibes.mp3' },
  { id: 'infadd',         name: 'Infinity Addition',    file: 'InfinityAddition.mp3' },
  { id: 'sc90',           name: 'SnowCone 90',          file: 'sc_90.mp3' },
  { id: 'nothingorg',     name: 'Nothing Organic',      file: 'nothing_organic.mp3' },
  { id: 'secrets',        name: 'Secrets of Math',      file: 'secretsOfMath.mp3' },
  { id: 'stoopidelectro', name: 'Stoopid Electro',      file: 'stoopidElectro.mp3' },
  { id: 'prologue',       name: 'Story Prologue',       file: 'prologueTrack.mp3' },
  { id: 'kittyPaws',      name: 'Kitty Paws',           file: 'kittyPaws.mp3' },
  { id: 'patchrelaxes',   name: 'Patch Relaxes',        file: 'patchRelaxes.mp3' },
  { id: 'bonusTime',      name: 'Bonus Time',           file: 'bonusTime.mp3' },

  // 🦟 iOS-exclusive: only shows up in native iOS shell
  {
    id: 'lastRun',
    name: 'Last Run',
    file: 'lastRun.mp3',
    iosExclusive: true,
  },
];

// 🧊 Public-facing track list (filtered by environment)
// - iOS native shell → includes Mosquito Smash and any future iosExclusive tracks
// - Browser / PWA → excludes all iosExclusive tracks entirely
function getTracks() {
  // ⚠️ IMPORTANT:
  // This runs at *call time*, not at module import time.
  // That means it can see `isIOSNative()` AFTER the native shell injects SC_IOS_NATIVE.
  return isIOSNative()
    ? allTracks
    : allTracks.filter(t => !t.iosExclusive);
}

let looping = false;
let shuffling = false;

//////////////////////////////
// 🎛️ Preload cache (for StoryMode + future)
//////////////////////////////
const howlCache = new Map(); // id -> { howl, meta, html5 }

/**
 * Preload tracks into a cache so first play is fast and transitions are smoother.
 * Only use this for small curated sets (like StoryMode's 3 tracks) to avoid memory bloat.
 */
export function preloadTracks(ids = [], opts = {}) {
  const {
    html5 = getDefaultHtml5(),
    volume = getMusicVolume(),
  } = opts;

  const tracks = getTracks();
  ids
    .filter(Boolean)
    .forEach((id) => {
      const meta = tracks.find(t => t.id === id);
      if (!meta) return;

      // If cached with same html5 setting, keep it
      const cached = howlCache.get(id);
      if (cached?.howl && cached.html5 === html5) return;

      try {
        const howl = new Howl({
          src: [`${import.meta.env.BASE_URL}assets/audio/tracks/${meta.file}`],
          loop: false,
          volume: volume,
          html5,
          preload: true,
          onloaderror: (_, err) => {
            console.warn('⚠️ Preload load error:', id, err);
          },
        });

        howlCache.set(id, { howl, meta, html5 });
      } catch (e) {
        console.warn('⚠️ preloadTracks failed for', id, e);
      }
    });
}

/**
 * Optional: clear cached/preloaded tracks.
 */
export function unloadPreloadedTracks(ids = null) {
  if (!ids) {
    howlCache.forEach(({ howl }) => {
      try { howl.unload(); } catch {}
    });
    howlCache.clear();
    return;
  }

  ids.filter(Boolean).forEach((id) => {
    const cached = howlCache.get(id);
    if (cached?.howl) {
      try { cached.howl.unload(); } catch {}
    }
    howlCache.delete(id);
  });
}

//////////////////////////////
// 🧠 Track resolver
//////////////////////////////
function resolveTrackMeta(id) {
  const tracks = getTracks();
  return tracks.find(t => t.id === id) || null;
}

function makeHowl(meta, opts = {}) {
  const {
    html5 = getDefaultHtml5(),
    volume = getMusicVolume(),
  } = opts;

  return new Howl({
    src: [`${import.meta.env.BASE_URL}assets/audio/tracks/${meta.file}`],
    loop: looping,
    volume,
    html5,
    preload: true,
  });
}

function getHowlFor(meta, opts = {}) {
  const {
    useCache = false,
    html5 = getDefaultHtml5(),
    volume = getMusicVolume(),
  } = opts;

  if (useCache) {
    const cached = howlCache.get(meta.id);
    if (cached?.howl && cached.html5 === html5) {
      // ensure desired volume (safe)
      try { cached.howl.volume(volume); } catch {}
      return cached.howl;
    }

    // create & store if missing
    const howl = makeHowl(meta, { html5, volume });
    howlCache.set(meta.id, { howl, meta, html5 });
    return howl;
  }

  return makeHowl(meta, { html5, volume });
}

//////////////////////////////
// 🧩 Attach handlers (single source of truth)
//////////////////////////////
function bindHowlHandlers(howl, meta, opts = {}) {
  const { onEnd = null } = opts;

  // Clear any prior listeners (important when reusing cached Howls)
  try { howl.off(); } catch {}

  howl.on('play', () => {
    updateTrackLabel(meta.name);
    startProgressUpdater();
  });

  howl.on('end', () => {
    // 1) Caller-owned end behavior (StoryMode rotation)
    if (typeof onEnd === 'function') {
      try { onEnd(meta.id); } catch (e) { console.warn('⚠️ onEnd override error:', e); }
      return;
    }

    // 2) Default behavior (your existing music player rules)
    if (looping) return;

    if (shuffling) {
      playRandomTrack();
    } else {
      skipNext(); // <-- keeps your normal "album next" behavior
    }
  });

  howl.on('playerror', (_, err) => {
    console.warn('⚠️ Play error:', err);
    howl.once('unlock', () => howl.play());
  });

  // store override reference (debug / sanity)
  currentEndOverride = onEnd || null;
}

//////////////////////////////
// 🛑 Stop Track (with Fade)
//////////////////////////////
export function stopTrack(callback) {
  if (!currentTrack) {
    callback?.();
    return;
  }

  const t = currentTrack;
  const shouldUnload = !isHowlCached(t); // ✅ key line

  try { t.off('end'); } catch {}

  try {
    t.fade(t.volume(), 0, fadeDuration);
  } catch {}

  setTimeout(() => {
    try { prevHowl.off(); } catch {}
    try { prevHowl.stop(); } catch {}

    // ✅ Don't unload if cached
    if (!isHowlCached(prevHowl)) {
      try { prevHowl.unload(); } catch {}
    } else {
      try { prevHowl.seek(0); } catch {}
    }

    if (currentTrackMeta && currentTrackMeta.id === nextMeta.id) {
      updateTrackLabel(nextMeta.name);
    }
  }, crossfadeMs);

  cancelAnimationFrame(rafId);
}

//////////////////////////////
// 🌊 Crossfade transition (seamless-ish)
//////////////////////////////
function crossfadeTo(nextHowl, nextMeta, opts = {}) {
  const {
    crossfadeMs = fadeDuration,
    onEnd = null,
    volume = getMusicVolume(),
  } = opts;

  const prevHowl = currentTrack;
  const prevMeta = currentTrackMeta;

  // If nothing playing, just play clean
  if (!prevHowl) {
    currentTrack = nextHowl;
    currentTrackMeta = nextMeta;
    bindHowlHandlers(nextHowl, nextMeta, { onEnd });

    try { nextHowl.stop(); } catch {}
    try { nextHowl.seek(0); } catch {}
    try { nextHowl.volume(volume); } catch {}
    try { nextHowl.play(); } catch {}

    startProgressUpdater();
    return;
  }

  // Set new as current immediately (UI + progress now points to new)
  currentTrack = nextHowl;
  currentTrackMeta = nextMeta;
  bindHowlHandlers(nextHowl, nextMeta, { onEnd });

  // Prepare both volumes
  let prevVol = 0;
  try { prevVol = prevHowl.volume(); } catch { prevVol = volume; }

  try { nextHowl.stop(); } catch {}
  try { nextHowl.seek(0); } catch {}

  // Start new at 0, then fade up
  try { nextHowl.volume(0); } catch {}
  try { nextHowl.play(); } catch {}

  // Fade in new
  try { nextHowl.fade(0, volume, crossfadeMs); } catch {}

  // Fade out previous
  try { prevHowl.fade(prevVol, 0, crossfadeMs); } catch {}

  // After fade, kill old track
  setTimeout(() => {
    // In case something else swapped tracks again, only stop/unload the old one
    try { prevHowl.off(); } catch {}
    try { prevHowl.stop(); } catch {}
    try { prevHowl.unload(); } catch {}

    // If we were still showing old meta (rare), refresh label
    if (currentTrackMeta && currentTrackMeta.id === nextMeta.id) {
      updateTrackLabel(nextMeta.name);
    }
  }, crossfadeMs);

  startProgressUpdater();
}

//////////////////////////////
// 🚀 Play Track
//////////////////////////////
export function playTrack(id = getFirstTrackId(), opts = {}) {
  const {
    onEnd = null,
    crossfadeMs = 0,
    html5 = getDefaultHtml5(),  // 👈 was true
    useCache = false,
    volume = getMusicVolume(),
  } = opts;

  const meta = resolveTrackMeta(id);
  if (!meta) {
    console.warn(`⚠️ Track "${id}" not found.`);
    return;
  }

  // Build or reuse howl
  const nextHowl = getHowlFor(meta, { useCache, html5, volume });

  // If crossfading, do NOT call stopTrack() (it delays playback by fadeDuration)
  if (crossfadeMs > 0) {
    crossfadeTo(nextHowl, meta, { crossfadeMs, onEnd, volume });
    return;
  }

  // Default legacy behavior (your original): fade out fully, then start next
  stopTrack(() => {
    currentTrack = nextHowl;
    currentTrackMeta = meta;
    bindHowlHandlers(nextHowl, meta, { onEnd });

    try { nextHowl.stop(); } catch {}
    try { nextHowl.seek(0); } catch {}
    try { nextHowl.volume(volume); } catch {}

    try { nextHowl.play(); } catch {}
    startProgressUpdater(); // don't wait for onplay
  });
}

//////////////////////////////
// 🔀 True Random Track
//////////////////////////////
export function playRandomTrack() {
  const tracks = getTracks();
  const currentIndex = getCurrentTrackIndex();
  let randomIndex;

  do {
    randomIndex = Math.floor(Math.random() * tracks.length);
  } while (tracks.length > 1 && randomIndex === currentIndex);

  stopTrack(() => {
    playTrack(tracks[randomIndex].id);
  });
}

//////////////////////////////
// ⏭️ Skip Next (Respects Shuffle)
//////////////////////////////
export function skipNext() {
  if (shuffling) {
    playRandomTrack();
    return;
  }

  const tracks = getTracks();
  const index = getCurrentTrackIndex();
  const next = (index + 1) % tracks.length;
  stopTrack(() => {
    playTrack(tracks[next].id);
  });
}

//////////////////////////////
// ⏮️ Skip Prev (Respects Shuffle)
//////////////////////////////
export function skipPrev() {
  if (shuffling) {
    playRandomTrack();
    return;
  }

  const tracks = getTracks();
  const index = getCurrentTrackIndex();
  const prev = (index - 1 + tracks.length) % tracks.length;
  stopTrack(() => {
    playTrack(tracks[prev].id);
  });
}

//////////////////////////////
// ⏯️ Play / Pause Toggle
//////////////////////////////
export function togglePlayPause() {
  if (!currentTrack) {
    playTrack();
    return;
  }

  if (currentTrack.playing()) {
    currentTrack.pause();
    cancelAnimationFrame(rafId);
  } else {
    currentTrack.play();
    startProgressUpdater();
  }
}

//////////////////////////////
// 🔇 Mute Controls
//////////////////////////////
export function toggleMute() {
  const muted = !Howler._muted;
  Howler.mute(muted);
  return muted;
}

export function isMuted() {
  return Howler._muted;
}

//////////////////////////////
// 🔁 Loop / 🔀 Shuffle
//////////////////////////////
export function toggleLoop() {
  looping = !looping;
  if (currentTrack) currentTrack.loop(looping);
  return looping;
}

export function getLooping() {
  return looping;
}

export function toggleShuffle() {
  shuffling = !shuffling;
  return shuffling;
}

export function getShuffling() {
  return shuffling;
}

//////////////////////////////
// 🔢 Get Current Index
//////////////////////////////
function getCurrentTrackIndex() {
  if (!currentTrack) return 0;
  const tracks = getTracks();
  const src = currentTrack._src;
  const idx = tracks.findIndex(t => src && src.includes(t.file));
  return idx >= 0 ? idx : 0;
}

//////////////////////////////
// ⏳ Progress Updater
//////////////////////////////
function startProgressUpdater() {
  const bar = document.getElementById('trackProgress');
  const timer = document.getElementById('trackTimer');

  if (!bar || !timer || !currentTrack) return;

  function update() {
    if (!currentTrack) return; // allow paused seek to show

    const seek = currentTrack.seek() || 0;
    const duration = currentTrack.duration() || 1;
    const percent = (seek / duration) * 100;

    bar.value = percent.toFixed(1);
    bar.max = 100;

    const format = (n) =>
      `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, '0')}`;
    timer.textContent = `${format(seek)} / ${format(duration)}`;

    rafId = requestAnimationFrame(update);
  }

  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(update);
}

//////////////////////////////
// 🎯 Getters
//////////////////////////////
export function isPlaying() {
  return currentTrack?.playing() ?? false;
}

export function currentTrackName() {
  if (!currentTrack) return '(none)';
  const tracks = getTracks();
  const src = currentTrack._src;
  const track = tracks.find(t => src && src.includes(t.file));
  return track?.name || currentTrackMeta?.name || '(unknown)';
}

export function currentTrackId() {
  if (!currentTrack) return '';
  const tracks = getTracks();
  const src = currentTrack._src;
  const track = tracks.find(t => src && src.includes(t.file));
  return track?.id ?? currentTrackMeta?.id ?? '';
}

export function getTrackList() {
  // Already filtered by environment via `getTracks()`
  return getTracks();
}

//////////////////////////////
// 🌌 Init (optional)
//////////////////////////////
export function initMusicPlayer() {
  updateTrackLabel('(none)');
}

//////////////////////////////
// 🌠 Fallback
//////////////////////////////
function getFirstTrackId() {
  const tracks = getTracks();
  return tracks[0]?.id ?? '';
}

//////////////////////////////
// 💫 Label Updater (Internal)
//////////////////////////////
function updateTrackLabel(name = currentTrackName()) {
  const label = document.getElementById('currentTrack');
  if (label) {
    label.textContent = name;
  }
}

export function scrubTo(percent) {
  if (!currentTrack) return;
  const duration = currentTrack.duration();
  if (duration && percent >= 0 && percent <= 1) {
    currentTrack.seek(percent * duration);
  }
}

export function getCurrentSeekPercent() {
  if (!currentTrack) return 0;
  const duration = currentTrack.duration();
  if (!duration) return 0;
  return (currentTrack.seek() || 0) / duration;
}

// 🎣 Infinity Lake loop keeps its own curated list
const infinityTrackIds = ['infadd', 'nothingorg', 'secrets', 'patchrelaxes', 'stoopidelectro'];

function shuffleInfinityTrackList() {
  return infinityTrackIds
    .map(id => ({ id, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(obj => obj.id);
}

let infQueue = shuffleInfinityTrackList();
let infIndex = 0;

export function playInfinityLoop() {
  const nextId = infQueue[infIndex];

  playTrack(nextId);

  infIndex = (infIndex + 1) % infQueue.length;
  if (infIndex === 0) {
    infQueue = shuffleInfinityTrackList(); // reshuffle after full loop
  }
}

// 🧊 Infinity just uses the global player, so stopping is simple
export function stopInfinityLoop() {
  stopTrack();
}
// managers/musicManager.js

function isHowlCached(howl) {
  for (const entry of howlCache.values()) {
    if (entry?.howl === howl) return true;
  }
  return false;
}
