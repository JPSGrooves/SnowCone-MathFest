// src/managers/musicManager.js
import { Howl, Howler } from 'howler';
import { isIOSNative } from '../utils/platform.js'; // 🔍 single source of truth


let _isBackgrounded = false;


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

// ─────────────────────────────────────────────────────────────
// iOS: prefer WebAudio so the hardware silent switch behaves consistently.
// NOTE: Whether silent switch mutes you ALSO depends on native AVAudioSession category.
// ─────────────────────────────────────────────────────────────
function preferWebAudioOnIOS() {
  try {
    const ua = navigator.userAgent || '';
    const isiOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (ua.includes('Mac') && 'ontouchend' in document);
    return isiOS;
  } catch {
    return false;
  }
}

function getDefaultHtml5() {
  // html5:true  => <audio> element (more resilient for background, BUT acts like media on iOS)
  // html5:false => WebAudio (best chance to respect Silent Switch when native is .ambient)

  const isiOS = preferWebAudioOnIOS();

  // ✅ Option A: On iOS we ALWAYS force WebAudio.
  if (isiOS) return false;

  // Desktop: ok either way; keep your preference
  return true;
}
function forceHtml5ForOptionA(requestedHtml5) {
  // If you are committed to Option A, iOS must never use html5 audio.
  const isiOS = preferWebAudioOnIOS();
  if (isiOS) return false;
  return !!requestedHtml5;
}



// ─────────────────────────────────────────────────────────────
// Global music loudness (master ceiling for all modes)
// ─────────────────────────────────────────────────────────────
const DEFAULT_MUSIC_VOLUME = 0.7;

function getMusicVolume() {
  return DEFAULT_MUSIC_VOLUME;
}

let currentTrack = null;
let currentTrackMeta = null;
let currentEndOverride = null;

let rafId = null;
const fadeDuration = 1000;

let looping = false;
let shuffling = false;

// ─────────────────────────────────────────────────────────────
// 🔥 Track Catalog (includes iOS-only tracks)
// ─────────────────────────────────────────────────────────────
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
  { id: 'lastRun', name: 'Last Run', file: 'lastRun.mp3', iosExclusive: true },
];

// Filtered by environment at call time
function getTracks() {
  return isIOSNative()
    ? allTracks
    : allTracks.filter(t => !t.iosExclusive);
}

// ─────────────────────────────────────────────────────────────
// 🧊 Mode “Scopes” (THIS is what makes musicManager rule everything)
// A scope can temporarily:
// - limit the playlist pool (e.g. QuickServe only)
// - force shuffle/loop defaults for that mode
// And then restore the prior state cleanly on exit.
// ─────────────────────────────────────────────────────────────
let _activePoolIds = null; // null => full catalog (filtered), else array of ids

const _scopeStack = [];
export function pushMusicScope(scope = {}) {
  // Save current state
  _scopeStack.push({
    poolIds: _activePoolIds ? [..._activePoolIds] : null,
    shuffling,
    looping,
  });

  // Apply scope overrides (only if provided)
  if (Array.isArray(scope.poolIds)) {
    setMusicPool(scope.poolIds);
  }
  if (typeof scope.shuffling === 'boolean') {
    setShuffle(scope.shuffling);
  }
  if (typeof scope.looping === 'boolean') {
    setLoop(scope.looping);
  }

  emitMusicState();
}

export function popMusicScope() {
  const prev = _scopeStack.pop();
  if (!prev) return;

  // Restore
  setMusicPool(prev.poolIds);
  setShuffle(prev.shuffling);
  setLoop(prev.looping);

  emitMusicState();
}

// Pool affects skip/prev/random + “current index” behavior.
// It does NOT hide tracks from Settings UI (that still uses getTrackList()).
export function setMusicPool(idsOrNull) {
  if (!idsOrNull) {
    _activePoolIds = null;
    emitMusicState();
    return;
  }

  const cleaned = (idsOrNull || [])
    .filter(Boolean)
    .map(String);

  // Keep only ids that exist in env-visible tracks
  const visible = new Set(getTracks().map(t => t.id));
  _activePoolIds = cleaned.filter(id => visible.has(id));

  emitMusicState();
}

export function getMusicPool() {
  return _activePoolIds ? [..._activePoolIds] : null;
}

// Active list for controls (skip/random/prev)
function getActiveList() {
  const visibleTracks = getTracks();
  if (!_activePoolIds || !_activePoolIds.length) return visibleTracks;

  const byId = new Map(visibleTracks.map(t => [t.id, t]));
  return _activePoolIds.map(id => byId.get(id)).filter(Boolean);
}
// 🧠 Action token: every play/stop increments, so old fade timers can’t kill new tracks
let _actionSeq = 0;
let _stopTimer = null;

// 🔥 iOS/WKWebView survival guard
// When the app backgrounds, WebAudio often suspends.
// On foreground, we resume the AudioContext and (if needed) rebuild the active Howl.
let _lifecycleWired = false;
let _bgSnapshot = null;
let _pendingGestureResume = null;

// Track what the last play call used (so we recreate consistently)
let _lastPlayOpts = {
  html5: null,
  useCache: false,
  volume: DEFAULT_MUSIC_VOLUME,
};

// ─────────────────────────────────────────────────────────────
// Native-triggerable lifecycle handlers (shared by web + native)
// ─────────────────────────────────────────────────────────────
function handleMusicBackground() {
  // Save state
  _bgSnapshot = snapshotPlaybackState();

  // Pause cleanly (don’t stop/unload)
  try {
    if (currentTrack && currentTrack.playing?.()) currentTrack.pause();
  } catch {}

  // Stop UI progress RAF
  try { cancelAnimationFrame(rafId); } catch {}
  rafId = null;

  // Clear any pending stop timers (avoid race killing on resume)
  clearStopTimer();
}

function handleMusicForeground() {
  // ✅ if we never backgrounded, do nothing
  if (!_isBackgrounded && !_bgSnapshot) return;

  // Kick the AudioContext back awake (harmless even if html5:true)
  resumeHowlerCtxSafe();

  const snap = _bgSnapshot;
  _bgSnapshot = null;

  if (!snap?.id) return;
  if (!snap.wasPlaying) return; // respect user pause

  // Try immediate rebuild resume
  hardResumeFromSnapshot(snap);

  // ✅ If iOS blocks it until gesture, we’ll finish on first tap/click
  rememberForGestureResume(snap);
}

function wireMusicLifecycleGuardsOnce() {
  if (_lifecycleWired) return;
  _lifecycleWired = true;

  try { Howler.autoSuspend = false; } catch {}

  // ─────────────────────────────────────────────────────────────
  // 🧠 iOS lifecycle de-dupe gate
  // ─────────────────────────────────────────────────────────────
  let _isBg = false;
  let _lastFlipAt = 0;

  function bgOnce(reason = '') {
    const now = Date.now();
    if (_isBg && (now - _lastFlipAt) < 150) return;
    if (_isBg) return;
    _isBg = true;
    _lastFlipAt = now;

    // ✅ keep module-wide truth in sync
    _isBackgrounded = true;

    try { handleMusicBackground(); } catch {}
  }

  function fgOnce(reason = '') {
    const now = Date.now();
    if (!_isBg && (now - _lastFlipAt) < 150) return;
    if (!_isBg) return;
    _isBg = false;
    _lastFlipAt = now;

    // ✅ keep module-wide truth in sync
    _isBackgrounded = false;

    try { handleMusicForeground(); } catch {}
  }


  // Web lifecycle signals (browser + WKWebView)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) bgOnce('visibilitychange');
    else fgOnce('visibilitychange');
  });

  window.addEventListener('pagehide', () => bgOnce('pagehide'));
  window.addEventListener('pageshow', () => fgOnce('pageshow'));

  // ✅ Native WKWebView/Capacitor bridge events (YOUR ViewController)
  window.addEventListener('scmf:nativeBackground', () => bgOnce('native'));
  window.addEventListener('scmf:nativeForeground', () => fgOnce('native'));

  // 🚫 IMPORTANT:
  // Do NOT also wire @capacitor/app appStateChange in native iOS.
  // It flips during sheets/modals and causes the audio zombie state.
  // If you ever need it for Android later, gate it like this:
  const hasNativeBridge = (typeof window !== 'undefined') && window.SC_IOS_NATIVE === true;

  if (!hasNativeBridge) {
    wireCapacitorAppLifecycle(() => bgOnce('capacitor'), () => fgOnce('capacitor'));
  }
}

// Optional exports (handy if you ever want to call directly)
export function nativeMusicDidBackground() {
  try { handleMusicBackground(); } catch {}
}
export function nativeMusicDidForeground() {
  try { handleMusicForeground(); } catch {}
}


function getHowlerCtx() {
  try {
    const H = window.Howler ?? globalThis.Howler;
    return H?.ctx || null;
  } catch {
    return null;
  }
}

function resumeHowlerCtxSafe() {
  try {
    const ctx = getHowlerCtx();
    if (!ctx) return false;
    if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
      ctx.resume().catch(() => {});
    }
    return true;
  } catch {
    return false;
  }
}

function snapshotPlaybackState() {
  const id =
    currentTrackMeta?.id ||
    (typeof currentTrackId === 'function' ? currentTrackId() : '') ||
    '';

  let seek = 0;
  let vol = getMusicVolume();

  try { seek = Number(currentTrack?.seek?.() || 0) || 0; } catch {}
  try { vol = Number(currentTrack?.volume?.() ?? vol) || vol; } catch {}

  const wasPlaying = !!(currentTrack && typeof currentTrack.playing === 'function' && currentTrack.playing());

  return {
    id,
    seek,
    wasPlaying,
    volume: vol,
    html5: _lastPlayOpts.html5 ?? getDefaultHtml5(),
    useCache: !!_lastPlayOpts.useCache,
    // Keep the StoryMode override alive if it was owning end behavior
    onEnd: currentEndOverride || null,
  };
}

function tryImmediateGestureResume(snap) {
  if (!snap?.id) return false;

  // don't fight mute
  try {
    const H = window.Howler ?? globalThis.Howler;
    if (H?._muted) return true;
  } catch {}

  // 1) resume audio context
  try { resumeHowlerCtxSafe(); } catch {}

  // 2) if currentTrack exists and matches, try to just play it NOW
  try {
    if (currentTrack && currentTrackMeta?.id === snap.id) {
      // restore seek first (iOS is picky)
      if (typeof snap.seek === 'number' && isFinite(snap.seek) && snap.seek > 0) {
        try { currentTrack.seek(snap.seek); } catch {}
      }
      try { currentTrack.volume(snap.volume ?? getMusicVolume()); } catch {}
      try { currentTrack.play(); } catch {}
      return true;
    }
  } catch {}

  // 3) rebuild a new howl and play immediately (no stopTrack, no fades)
  const meta = resolveTrackMeta(snap.id);
  if (!meta) return false;

  const enforcedHtml5 = forceHtml5ForOptionA(snap.html5);
  const howl = makeHowl(meta, { html5: enforcedHtml5, volume: snap.volume ?? getMusicVolume() });

  // adopt it as current immediately
  currentTrack = howl;
  currentTrackMeta = meta;
  bindHowlHandlers(howl, meta, { onEnd: snap.onEnd || null });

  try { howl.stop(); } catch {}
  try { howl.seek(0); } catch {}
  try { howl.volume(snap.volume ?? getMusicVolume()); } catch {}

  // IMPORTANT: play FIRST inside gesture
  try { howl.play(); } catch {}

  // then seek (some iOS builds only honor seek after play)
  if (typeof snap.seek === 'number' && isFinite(snap.seek) && snap.seek > 0) {
    try { howl.seek(snap.seek); } catch {}
  }

  startProgressUpdater();
  emitMusicState();
  return true;
}


let _gestureResumeArmed = false;

function rememberForGestureResume(snap) {
  if (!snap?.id) return;

  // If user muted globally, do nothing
  try {
    const H = window.Howler ?? globalThis.Howler;
    if (H?._muted) return;
  } catch {}

  _pendingGestureResume = snap;

  // ✅ Only arm once until it fires
  if (_gestureResumeArmed) return;
  _gestureResumeArmed = true;

  const fire = () => {
    _gestureResumeArmed = false;

    const s = _pendingGestureResume;
    _pendingGestureResume = null;

    if (!s?.id || !s.wasPlaying) return;

    // ✅ do it right now, inside the gesture stack
    const ok = tryImmediateGestureResume(s);

    // if it failed, last-ditch: your older rebuild path
    if (!ok) {
      try { resumeHowlerCtxSafe(); } catch {}
      try { hardResumeFromSnapshot(s); } catch {}
    }
  };


  // ✅ Capture phase catches the gesture early, before UI swallows it
  const optsCapture = { capture: true, passive: false };

  // pointerdown is the most reliable modern signal
  try { window.addEventListener('pointerdown', fire, { ...optsCapture, once: true }); } catch {}
  // fallback for older iOS
  try { window.addEventListener('touchstart', fire, { ...optsCapture, once: true }); } catch {}
  try { window.addEventListener('mousedown', fire, { capture: true, once: true }); } catch {}
  // keyboard fallback (simulators / desktop)
  try { window.addEventListener('keydown', fire, { capture: true, once: true }); } catch {}

  try { document.addEventListener('pointerdown', fire, { ...optsCapture, once: true }); } catch {}
  try { document.addEventListener('touchstart', fire, { ...optsCapture, once: true }); } catch {}
}

function hardResumeFromSnapshot(snap) {
  if (!snap?.id) return;

  // 🚫 If user muted globally, don’t fight them
  try {
    const H = window.Howler ?? globalThis.Howler;
    if (H?._muted) return;
  } catch {}

  // ✅ Kill any zombied instance before rebuilding
  try {
    if (currentTrack) {
      try { currentTrack.off?.(); } catch {}
      try { currentTrack.stop?.(); } catch {}
    }
  } catch {}

  playTrack(snap.id, {
    fadeMs: 0,
    crossfadeMs: 0,
    html5: snap.html5,
    useCache: snap.useCache,
    volume: snap.volume,
    startAt: snap.seek,
    onEnd: snap.onEnd,
  });
}


async function wireCapacitorAppLifecycle(onBg, onFg) {
  // Only in native shells; safe to fail in web/PWA
  try {
    const w = window ?? globalThis;
    if (!w.Capacitor) return;

    // Prefer official App plugin events
    const mod = await import('@capacitor/app').catch(() => null);
    const App = mod?.App;
    if (!App?.addListener) return;

    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) onFg();
      else onBg();
    });
  } catch {
    // ignore
  }
}
// ─────────────────────────────────────────────────────────────
// 🎛️ Preload cache (StoryMode + future)
// ─────────────────────────────────────────────────────────────
const howlCache = new Map(); // id -> { howl, meta, html5 }

export function preloadTracks(ids = [], opts = {}) {
  const {
    html5 = getDefaultHtml5(),
    volume = getMusicVolume(),
  } = opts;

  const enforcedHtml5 = forceHtml5ForOptionA(html5);

  const tracks = getTracks();
  ids.filter(Boolean).forEach((id) => {
    const meta = tracks.find(t => t.id === id);
    if (!meta) return;

    const cached = howlCache.get(id);
    if (cached?.howl && cached.html5 === enforcedHtml5) return;

    try {
      const howl = new Howl({
        src: [`${import.meta.env.BASE_URL}assets/audio/tracks/${meta.file}`],
        loop: false,
        volume,
        html5: enforcedHtml5,
        preload: true,
        onloaderror: (_, err) => {
          console.warn('⚠️ Preload load error:', id, err);
        },
      });

      howlCache.set(id, { howl, meta, html5: enforcedHtml5 });
    } catch (e) {
      console.warn('⚠️ preloadTracks failed for', id, e);
    }
  });
}

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

// ─────────────────────────────────────────────────────────────
// 🧠 Track resolver + Howl creation
// ─────────────────────────────────────────────────────────────
function resolveTrackMeta(id) {
  const tracks = getTracks();
  return tracks.find(t => t.id === id) || null;
}

function makeHowl(meta, opts = {}) {
  const {
    html5 = getDefaultHtml5(),
    volume = getMusicVolume(),
  } = opts;

  // ✅ ENFORCE Option A at the source (critical)
  const enforcedHtml5 = forceHtml5ForOptionA(html5);

  return new Howl({
    src: [`${import.meta.env.BASE_URL}assets/audio/tracks/${meta.file}`],
    loop: looping,
    volume,
    html5: enforcedHtml5,
    preload: true,

    onloaderror: (_, err) => {
      console.warn('⚠️ LOAD ERROR:', meta.id, meta.file, 'html5=', enforcedHtml5, err);
    },
    onplayerror: (_, err) => {
      console.warn('⚠️ PLAY ERROR:', meta.id, meta.file, 'html5=', enforcedHtml5, err);
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
      try { cached.howl.volume(volume); } catch {}
      return cached.howl;
    }

    const howl = makeHowl(meta, { html5, volume });
    howlCache.set(meta.id, { howl, meta, html5 });
    return howl;
  }

  return makeHowl(meta, { html5, volume });
}

// ─────────────────────────────────────────────────────────────
// 🧩 Handlers (single source of truth)
// ─────────────────────────────────────────────────────────────
function bindHowlHandlers(howl, meta, opts = {}) {
  const { onEnd = null } = opts;

  // If cached Howl reused, clear listeners first
  try { howl.off(); } catch {}

  howl.on('play', () => {
    updateTrackLabel(meta.name);
    startProgressUpdater();
    emitMusicState();
  });

  howl.on('pause', () => emitMusicState());

  howl.on('stop', () => emitMusicState());

  howl.on('end', () => {
    emitMusicState();

    // 1) Caller-owned end behavior (Story rotation)
    if (typeof onEnd === 'function') {
      try { onEnd(meta.id); } catch (e) { console.warn('⚠️ onEnd override error:', e); }
      return;
    }

    // 2) Default behavior
    if (looping) return;

    if (shuffling) {
      playRandomTrack();
    } else {
      skipNext();
    }
  });

  howl.on('playerror', (_, err) => {
    console.warn('⚠️ Play error:', err);
    howl.once('unlock', () => howl.play());
  });

  currentEndOverride = onEnd || null;
}

// ─────────────────────────────────────────────────────────────
// 🛑 Stop Track (with Fade) — guarded against race conditions
// ─────────────────────────────────────────────────────────────
export function stopTrack(callback, opts = {}) {
  const { fadeMs = fadeDuration, seq = bumpSeq() } = opts;

  if (!currentTrack) {
    callback?.();
    emitMusicState();
    return;
  }

  const t = currentTrack;

  clearStopTimer();

  try { cancelAnimationFrame(rafId); } catch {}
  rafId = null;

  try { t.off(); } catch {}

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
    emitMusicState();
    return;
  }

  try {
    const v = typeof t.volume === 'function' ? t.volume() : getMusicVolume();
    t.fade(v, 0, fadeMs);
  } catch {}

  _stopTimer = setTimeout(() => {
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
    emitMusicState();
  }, fadeMs + 20);
}

// ─────────────────────────────────────────────────────────────
// 🌊 Crossfade transition
// ─────────────────────────────────────────────────────────────
function crossfadeTo(nextHowl, nextMeta, opts = {}) {
  const {
    crossfadeMs = fadeDuration,
    onEnd = null,
    volume = getMusicVolume(),
    startAt = null, // 👈 NEW
  } = opts;

  const prevHowl = currentTrack;

  if (!prevHowl) {
    currentTrack = nextHowl;
    currentTrackMeta = nextMeta;
    bindHowlHandlers(nextHowl, nextMeta, { onEnd });

    try { nextHowl.stop(); } catch {}
    try { nextHowl.seek(0); } catch {}
    try { nextHowl.volume(volume); } catch {}
    try { nextHowl.play(); } catch {}

    if (typeof startAt === 'number' && isFinite(startAt) && startAt > 0) {
      setTimeout(() => {
        try { nextHowl.seek(startAt); } catch {}
      }, 0);
    }

    startProgressUpdater();
    return;
  }

  currentTrack = nextHowl;
  currentTrackMeta = nextMeta;
  bindHowlHandlers(nextHowl, nextMeta, { onEnd });

  let prevVol = volume;
  try { prevVol = prevHowl.volume(); } catch {}

  try { nextHowl.stop(); } catch {}
  try { nextHowl.seek(0); } catch {}

  // Start new at 0, then fade up
  try { nextHowl.volume(0); } catch {}
  try { nextHowl.play(); } catch {}

  if (typeof startAt === 'number' && isFinite(startAt) && startAt > 0) {
    setTimeout(() => {
      try { nextHowl.seek(startAt); } catch {}
    }, 0);
  }

  try { nextHowl.fade(0, volume, crossfadeMs); } catch {}
  try { prevHowl.fade(prevVol, 0, crossfadeMs); } catch {}

  setTimeout(() => {
    try { prevHowl.off(); } catch {}
    try { prevHowl.stop(); } catch {}

    // ✅ IMPORTANT: don’t unload cached Howls (preloaded Story tracks, etc.)
    if (isHowlCached(prevHowl)) {
      try { prevHowl.seek(0); } catch {}
      try { prevHowl.volume(volume); } catch {}
    } else {
      try { prevHowl.unload(); } catch {}
    }

    if (currentTrackMeta && currentTrackMeta.id === nextMeta.id) {
      updateTrackLabel(nextMeta.name);
    }
  }, crossfadeMs + 20);

  startProgressUpdater();
}

// ─────────────────────────────────────────────────────────────
// 🚀 Play Track — atomic + can switch instantly
// ─────────────────────────────────────────────────────────────
export function playTrack(id = getFirstTrackId(), opts = {}) {
  const {
    onEnd = null,
    crossfadeMs = 0,
    html5 = getDefaultHtml5(),
    useCache = false,
    volume = getMusicVolume(),
    fadeMs = fadeDuration,
    startAt = null, // 👈 NEW
  } = opts;

  // ✅ Wire survival guards once, early
  wireMusicLifecycleGuardsOnce();

  // Remember how we played last time (so resume rebuild matches)
  const enforcedHtml5 = forceHtml5ForOptionA(html5);
  _lastPlayOpts = { html5: enforcedHtml5, useCache, volume };

  const seq = bumpSeq();     // ✅ ONE bump for the whole operation
  clearStopTimer();

  const meta = resolveTrackMeta(id);
  if (!meta) {
    console.warn(`⚠️ Track "${id}" not found.`);
    return;
  }

  const nextHowl = getHowlFor(meta, { useCache, html5: enforcedHtml5, volume });

  if (crossfadeMs > 0) {
    crossfadeTo(nextHowl, meta, { crossfadeMs, onEnd, volume, startAt }); // 👈 pass through
    return;
  }

  stopTrack(() => {
    if (_actionSeq !== seq) return;

    currentTrack = nextHowl;
    currentTrackMeta = meta;
    bindHowlHandlers(nextHowl, meta, { onEnd });

    try { nextHowl.stop(); } catch {}
    try { nextHowl.seek(0); } catch {}
    try { nextHowl.volume(volume); } catch {}

    // ✅ Start playback
    try { nextHowl.play(); } catch {}

    // ✅ NEW: restore position after play starts (more reliable in iOS)
    if (typeof startAt === 'number' && isFinite(startAt) && startAt > 0) {
      setTimeout(() => {
        try { nextHowl.seek(startAt); } catch {}
      }, 0);
    }

    startProgressUpdater();
  }, { fadeMs, seq });
}

// ─────────────────────────────────────────────────────────────
// 🔀 Random / Skip / Prev (NOW respects active pool)
// ─────────────────────────────────────────────────────────────
export function playRandomTrack() {
  const tracks = getActiveList();
  if (!tracks.length) return;

  const currentIndex = getCurrentTrackIndex();
  let randomIndex;

  do {
    randomIndex = Math.floor(Math.random() * tracks.length);
  } while (tracks.length > 1 && randomIndex === currentIndex);

  playTrack(tracks[randomIndex].id, { fadeMs: 0 });
}

export function skipNext() {
  const tracks = getActiveList();
  if (!tracks.length) return;

  if (shuffling) {
    playRandomTrack();
    return;
  }

  const index = getCurrentTrackIndex();
  const next = (index + 1) % tracks.length;
  playTrack(tracks[next].id, { fadeMs: 0 });
}

export function skipPrev() {
  const tracks = getActiveList();
  if (!tracks.length) return;

  if (shuffling) {
    playRandomTrack();
    return;
  }

  const index = getCurrentTrackIndex();
  const prev = (index - 1 + tracks.length) % tracks.length;
  playTrack(tracks[prev].id, { fadeMs: 0 });
}

// ─────────────────────────────────────────────────────────────
// ⏯️ Play / Pause Toggle
// ─────────────────────────────────────────────────────────────
export function togglePlayPause() {
  if (!currentTrack) {
    playTrack();
    emitMusicState();
    return;
  }

  if (currentTrack.playing()) {
    currentTrack.pause();
    try { cancelAnimationFrame(rafId); } catch {}
    emitMusicState();
  } else {
    currentTrack.play();
    startProgressUpdater();
    emitMusicState();
  }
}

// ─────────────────────────────────────────────────────────────
// 🔇 Mute Controls
// ─────────────────────────────────────────────────────────────
export function toggleMute(desired) {
  if (typeof desired === 'boolean') {
    Howler.mute(desired);
    emitMusicState();
    return desired;
  }

  const muted = !Howler._muted;
  Howler.mute(muted);
  emitMusicState();
  return muted;
}

export function isMuted() {
  return Howler._muted;
}

// ─────────────────────────────────────────────────────────────
// 🔁 Loop / 🔀 Shuffle (add explicit setters for sanity)
// ─────────────────────────────────────────────────────────────
export function toggleLoop() {
  looping = !looping;
  if (currentTrack) currentTrack.loop(looping);
  emitMusicState();
  return looping;
}

export function setLoop(val) {
  looping = !!val;
  if (currentTrack) currentTrack.loop(looping);
  emitMusicState();
  return looping;
}

export function getLooping() {
  return looping;
}

export function toggleShuffle() {
  shuffling = !shuffling;
  emitMusicState();
  return shuffling;
}

export function setShuffle(val) {
  shuffling = !!val;
  emitMusicState();
  return shuffling;
}

export function getShuffling() {
  return shuffling;
}

// ─────────────────────────────────────────────────────────────
// 🔢 Current Index (within active pool if set)
// ─────────────────────────────────────────────────────────────
function getCurrentTrackIndex() {
  if (!currentTrack) return 0;

  const list = getActiveList();
  const src = currentTrack._src;
  const idx = list.findIndex(t => src && src.includes(t.file));
  return idx >= 0 ? idx : 0;
}

// ─────────────────────────────────────────────────────────────
// ⏳ Progress Updater
// ─────────────────────────────────────────────────────────────
function startProgressUpdater() {
  const bar = document.getElementById('trackProgress');
  const timer = document.getElementById('trackTimer');

  if (!bar || !timer || !currentTrack) return;

  function update() {
    if (!currentTrack) return;

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

  try { cancelAnimationFrame(rafId); } catch {}
  rafId = requestAnimationFrame(update);
}

// ─────────────────────────────────────────────────────────────
// 🎯 Getters (track label uses real meta first)
// ─────────────────────────────────────────────────────────────
export function isPlaying() {
  return currentTrack?.playing() ?? false;
}

export function currentTrackName() {
  if (!currentTrack) return '(none)';
  return currentTrackMeta?.name || '(unknown)';
}

export function currentTrackId() {
  if (!currentTrack) return '';
  return currentTrackMeta?.id || '';
}

export function getTrackList() {
  // Settings UI uses full list (filtered only by iOS native availability)
  return getTracks();
}

// ─────────────────────────────────────────────────────────────
// 🌌 Init
// ─────────────────────────────────────────────────────────────
export function initMusicPlayer() {
  wireMusicLifecycleGuardsOnce(); // ✅ arm lifecycle + gesture safety early
  updateTrackLabel('(none)');
  emitMusicState();
}

// ─────────────────────────────────────────────────────────────
// 🌠 Fallback
// ─────────────────────────────────────────────────────────────
function getFirstTrackId() {
  const tracks = getTracks();
  return tracks[0]?.id ?? '';
}

// ─────────────────────────────────────────────────────────────
// 💫 Label Updater
// ─────────────────────────────────────────────────────────────
function updateTrackLabel(name = currentTrackName()) {
  const label = document.getElementById('currentTrack');
  if (label) label.textContent = name;
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

// ─────────────────────────────────────────────────────────────
// 🧊 Infinity Loop (keep API, now powered by pool + shuffle)
// ─────────────────────────────────────────────────────────────
const infinityTrackIds = ['infadd', 'nothingorg', 'secrets', 'patchrelaxes', 'stoopidelectro'];

let _infScopeOn = false;

export function playInfinityLoop() {
  // Infinity wants its own curated pool + shuffle on
  if (!_infScopeOn) {
    pushMusicScope({ poolIds: infinityTrackIds, shuffling: true, looping: false });
    _infScopeOn = true;
  }
  // Start if not already
  if (!isPlaying()) playRandomTrack();
}

export function stopInfinityLoop() {
  stopTrack();
  if (_infScopeOn) {
    popMusicScope();
    _infScopeOn = false;
  }
}

// ─────────────────────────────────────────────────────────────
// Cache detection
// ─────────────────────────────────────────────────────────────
function isHowlCached(howl) {
  for (const entry of howlCache.values()) {
    if (entry?.howl === howl) return true;
  }
  return false;
}

// ─────────────────────────────────────────────────────────────
// 🔔 State subscription (MusicTab stops guessing with timeouts)
// ─────────────────────────────────────────────────────────────
const _listeners = new Set();

export function getMusicState() {
  return {
    playing: isPlaying(),
    muted: isMuted(),
    looping,
    shuffling,
    trackId: currentTrackId(),
    trackName: currentTrackName(),
    pool: getMusicPool(),
  };
}

export function subscribeMusicState(fn) {
  if (typeof fn !== 'function') return () => {};
  _listeners.add(fn);
  // immediate fire
  try { fn(getMusicState()); } catch {}
  return () => {
    _listeners.delete(fn);
  };
}

function emitMusicState() {
  const state = getMusicState();
  _listeners.forEach((fn) => {
    try { fn(state); } catch {}
  });
}

