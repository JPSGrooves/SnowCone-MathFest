// src/managers/musicManager.js
import { Howl, Howler } from 'howler';
import { isIOSNative } from '../utils/platform.js'; // 🔍 single source of truth

// 🧠 Action token: every play/stop increments, so old fade timers can’t kill new tracks
let _actionSeq = 0;
let _stopTimer = null;

function bumpSeq() {
  _actionSeq += 1;
  return _actionSeq;
}

function clearStopTimer() {
  if (_stopTimer) {
    try { clearTimeout(_stopTimer); } catch {}
    _stopTimer = null;
  }
}

// ==============================
// 🍧 iOS Wake / Audio Recovery
// ==============================

// iOS will suspend/interupt WebAudio when screen locks / app backgrounds.
// Sometimes Howler doesn't recover automatically, so we force resume
// and if needed, rebuild the audio context.

// One-time attachment guard
let _wakeHandlersAttached = false;

// Throttle so we don't spam resume calls
let _lastWakeKick = 0;

function _now() {
  return Date.now ? Date.now() : new Date().getTime();
}

async function _resumeHowlerContext(reason = 'unknown') {
  try {
    const ctx = Howler?.ctx;
    if (!ctx) return false;

    // iOS can be: 'suspended', 'interrupted', or sometimes 'running' but dead.
    if (ctx.state !== 'running') {
      try {
        await ctx.resume();
        // console.log('🎧 Howler ctx resumed via', reason, 'state=', ctx.state);
      } catch (e) {
        // console.warn('⚠️ ctx.resume failed via', reason, e);
      }
    }

    return (Howler?.ctx?.state === 'running');
  } catch (e) {
    // console.warn('⚠️ _resumeHowlerContext error', reason, e);
    return false;
  }
}

function _rebuildHowlerContext(reason = 'unknown') {
  // Only do this as a last resort.
  // Howler has some private helpers; we try those first, then a safe-ish manual rebuild.
  try {
    // console.log('🧯 Rebuilding Howler audio context via', reason);

    if (typeof Howler?._setupAudioContext === 'function') {
      Howler._setupAudioContext();
      return true;
    }

    // Manual fallback (best effort)
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;

    Howler.ctx = new AC();

    // masterGain is how Howler routes volume/mute.
    try {
      Howler.masterGain = Howler.ctx.createGain();
      Howler.masterGain.gain.value = typeof Howler.volume === 'function' ? Howler.volume() : 1;
      Howler.masterGain.connect(Howler.ctx.destination);
    } catch {}

    return true;
  } catch (e) {
    // console.warn('⚠️ _rebuildHowlerContext failed', reason, e);
    return false;
  }
}

function _nukeDeadHowls(reason = 'unknown') {
  try {
    const list = Howler?._howls || [];
    for (const h of list) {
      try { h.stop(); } catch {}
      try { h.unload(); } catch {}
    }
  } catch {}

  // ✅ flush your cache too (otherwise you might reuse unloaded howls)
  try {
    if (typeof howlCache !== 'undefined' && howlCache?.clear) {
      howlCache.clear();
    }
  } catch {}

}

async function _kickAudioEngine(reason = 'wake') {
  const t = _now();
  if (t - _lastWakeKick < 250) return; // throttle
  _lastWakeKick = t;

  // 1) Resume if possible
  const ok = await _resumeHowlerContext(reason);
  if (ok) return;

  // 2) If resume didn't work, rebuild ctx
  const rebuilt = _rebuildHowlerContext(reason);
  if (rebuilt) {
    await _resumeHowlerContext(`${reason}:afterRebuild`);
  }

  // 3) If still not running, hard reset howls (last resort)
  if (Howler?.ctx && Howler.ctx.state !== 'running') {
    _nukeDeadHowls(`${reason}:stillNotRunning`);
    _rebuildHowlerContext(`${reason}:afterNuke`);
    await _resumeHowlerContext(`${reason}:afterNukeRebuild`);
  }
}

function _attachIOSWakeHandlers() {
  if (_wakeHandlersAttached) return;
  _wakeHandlersAttached = true;

  // 🔑 This is the big one: screen lock/unlock often fires visibility changes.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      _kickAudioEngine('visibilitychange:show');
      setTimeout(() => _kickAudioEngine('visibilitychange:show:delayed'), 300);
    }
  });


  // iOS Safari/WKWebView sometimes needs these too
  window.addEventListener('pageshow', () => _kickAudioEngine('pageshow'), { passive: true });
  window.addEventListener('focus', () => _kickAudioEngine('focus'), { passive: true });

  // If the user taps after unlock, that gesture is a perfect "resume ctx" moment.
  window.addEventListener('pointerdown', () => _kickAudioEngine('pointerdown'), { passive: true });

  // Capacitor native: catch actual foreground/background transitions
  // (Safe: if plugin isn't available, it just no-ops.)
  (async () => {
    try {
      const mod = await import('@capacitor/app');
      const App = mod?.App;
      if (!App?.addListener) return;

      App.addListener('appStateChange', (state) => {
        if (state?.isActive) _kickAudioEngine('capacitor:active');
      });
    } catch {
      // no-op (web build or plugin not present)
    }
  })();
}

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

// iOS-specific: don't let Howler auto-suspend fight us after unlock.
try {
  if (preferWebAudioOnIOS()) {
    Howler.autoSuspend = false; // ✅ prevents "stuck suspended" edge cases
  }
} catch {}

// Attach wake handlers immediately (safe + idempotent)
if (preferWebAudioOnIOS() || isIOSNative()) {
  _attachIOSWakeHandlers();
  try { Howler.autoSuspend = false; } catch {}
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

    onloaderror: async function (_id, err) {
      console.warn('⚠️ LOAD ERROR:', meta.id, meta.file, 'html5=', html5, err);
      await _kickAudioEngine(`loaderror:${meta.id}`);
    },

    // ✅ IMPORTANT: use function() so `this` is the Howl instance
    onplayerror: async function (_id, err) {
      console.warn('⚠️ PLAY ERROR:', meta.id, meta.file, 'html5=', html5, err);

      await _kickAudioEngine(`playerror:${meta.id}`);

      try {
        const ctxOk = (Howler?.ctx?.state === 'running');
        if (ctxOk) {
          this.play(); // ✅ now actually works
        }
      } catch {}
    },
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

  // store override reference (debug / sanity)
  currentEndOverride = onEnd || null;
}

//////////////////////////////
// 🛑 Stop Track (with Fade)
//////////////////////////////
// 🛑 Stop Track (with Fade) — guarded against race conditions
// ✅ CHANGE 1: let stopTrack optionally *use* a provided seq instead of bumping again
export function stopTrack(callback, opts = {}) {
  const { fadeMs = fadeDuration, seq = bumpSeq() } = opts; // 👈 NEW: seq param w/ default bump

  if (!currentTrack) {
    callback?.();
    return;
  }

  const t = currentTrack;

  clearStopTimer();

  // stop progress updates
  try { cancelAnimationFrame(rafId); } catch {}
  rafId = null;

  // detach handlers so we don’t auto-skip while stopping
  try { t.off(); } catch {}

  // immediate stop
  if (!fadeMs || fadeMs <= 0) {
    try { t.stop(); } catch {}

    if (isHowlCached(t)) {
      try { t.seek(0); } catch {}
    } else {
      try { t.unload(); } catch {}
    }

    if (currentTrack === t) currentTrack = null;
    currentTrackMeta = null;
    currentEndOverride = null;

    callback?.();
    return;
  }

  // fade out
  try {
    const v = typeof t.volume === 'function' ? t.volume() : getMusicVolume();
    t.fade(v, 0, fadeMs);
  } catch {}

  _stopTimer = setTimeout(() => {
    // 🔒 Only execute if no newer play/stop has happened
    if (_actionSeq !== seq) return;

    try { t.stop(); } catch {}

    if (isHowlCached(t)) {
      try { t.seek(0); } catch {}
    } else {
      try { t.unload(); } catch {}
    }

    if (currentTrack === t) currentTrack = null;
    currentTrackMeta = null;
    currentEndOverride = null;

    callback?.();
  }, fadeMs + 20);
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
// 🚀 Play Track — atomic + can switch instantly with fadeMs:0
// ✅ CHANGE 2: in playTrack, bump ONCE and pass that same seq into stopTrack
export function playTrack(id = getFirstTrackId(), opts = {}) {
  const {
    onEnd = null,
    crossfadeMs = 0,
    html5 = getDefaultHtml5(),
    useCache = false,
    volume = getMusicVolume(),
    fadeMs = fadeDuration,
  } = opts;

  const seq = bumpSeq();     // ✅ ONE bump for the whole operation
  clearStopTimer();

  const meta = resolveTrackMeta(id);
  if (!meta) {
    console.warn(`⚠️ Track "${id}" not found.`);
    return;
  }

  const nextHowl = getHowlFor(meta, { useCache, html5, volume });

  if (crossfadeMs > 0) {
    crossfadeTo(nextHowl, meta, { crossfadeMs, onEnd, volume });
    return;
  }

  stopTrack(() => {
    // 🔒 Guard now works (stopTrack did NOT bump again)
    if (_actionSeq !== seq) return;

    currentTrack = nextHowl;
    currentTrackMeta = meta;
    bindHowlHandlers(nextHowl, meta, { onEnd });

    try { nextHowl.stop(); } catch {}
    try { nextHowl.seek(0); } catch {}
    try { nextHowl.volume(volume); } catch {}
    try { nextHowl.play(); } catch {}

    startProgressUpdater();
  }, { fadeMs, seq }); // 👈 pass same seq
}

//////////////////////////////
// 🔀 True Random Track
//////////////////////////////
// 🔀 True Random Track
export function playRandomTrack() {
  const tracks = getTracks();
  const currentIndex = getCurrentTrackIndex();
  let randomIndex;

  do {
    randomIndex = Math.floor(Math.random() * tracks.length);
  } while (tracks.length > 1 && randomIndex === currentIndex);

  // Let playTrack own stopping
  playTrack(tracks[randomIndex].id, { fadeMs: 0 });
}

// ⏭️ Skip Next (Respects Shuffle)
export function skipNext() {
  if (shuffling) {
    playRandomTrack();
    return;
  }

  const tracks = getTracks();
  const index = getCurrentTrackIndex();
  const next = (index + 1) % tracks.length;

  playTrack(tracks[next].id, { fadeMs: 0 });
}

// ⏮️ Skip Prev (Respects Shuffle)
export function skipPrev() {
  if (shuffling) {
    playRandomTrack();
    return;
  }

  const tracks = getTracks();
  const index = getCurrentTrackIndex();
  const prev = (index - 1 + tracks.length) % tracks.length;

  playTrack(tracks[prev].id, { fadeMs: 0 });
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
// 🔇 Mute Controls
export function toggleMute(desired) {
  // If caller passes a boolean, set explicitly.
  if (typeof desired === 'boolean') {
    Howler.mute(desired);
    return desired;
  }

  // Otherwise toggle
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
