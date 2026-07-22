// src/managers/musicManager.js
import { Howl, Howler } from 'howler';
import { isIOSNative } from '../utils/platform.js'; // 🔍 single source of truth
import {
  hasNativeAudioBridge,
  nativePlayTrack,
  nativePauseTrack,
  nativeResumeTrack,
  nativeStopTrack,
  nativeSetLooping,
  nativeSetMuted,
  nativeSeekPercent,
  nativeRequestMusicState,
  subscribeNativeAudioState,
} from './nativeAudioBridge.js';

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

// ─────────────────────────────────────────────────────────────
// 🍎 Native iOS audio lane
// Swift owns real playback on iOS.
// JS keeps enough state to update buttons/labels.
// ─────────────────────────────────────────────────────────────
let nativePlaying = false;
let nativeMuted = false;
let nativeSeekBase = 0;
let nativeSeekStartedAt = 0;

let nativeCurrentTime = 0;
let nativeDuration = 0;
let nativeSeekRatio = 0;
let nativeSuppressedByExternalAudio = false;

let nativeEndedHandledTrackId = '';
let nativeEndedHandledAt = 0;

let nativeStateWired = false;
let nativeStatePollTimer = null;

// Engine polling is NOT the Music Tab scrubber.
// This keeps Swift-owned native audio advancing in games/modes even when
// the Radio/Music Tab UI is closed.
let nativeEngineStatePollTimer = null;
let nativeEngineStatePollingWanted = false;

function useNativeAudio() {
  return hasNativeAudioBridge();
}

function nowSeconds() {
  try {
    return performance.now() / 1000;
  } catch {
    return Date.now() / 1000;
  }
}

function nativeEstimatedSeek() {
  if (!nativePlaying) return nativeSeekBase;
  return nativeSeekBase + Math.max(0, nowSeconds() - nativeSeekStartedAt);
}

function setNativePlaybackState({ playing, seek = null } = {}) {
  if (typeof seek === 'number' && Number.isFinite(seek)) {
    nativeSeekBase = Math.max(0, seek);
  } else if (nativePlaying && playing === false) {
    nativeSeekBase = nativeEstimatedSeek();
  }

  if (typeof playing === 'boolean') {
    nativePlaying = playing;
    if (nativePlaying) {
      nativeSeekStartedAt = nowSeconds();
    }
  }

  emitMusicState();
}

function wireNativeAudioStateOnce() {
  if (nativeStateWired) return;
  nativeStateWired = true;

  subscribeNativeAudioState((state = {}) => {
    applyNativeAudioState(state);
  });
}

function nativeStateLooksFinished(state = {}) {
  if (!useNativeAudio()) return false;

  const trackId = typeof state.trackId === 'string' ? state.trackId : '';
  if (!trackId) return false;

  // Native Swift is now the only authority for "finished."
  // Do not guess from currentTime/duration. A paused scrubber near the end
  // is NOT the same thing as a completed track.
  if (state.ended !== true) return false;

  if (!!state.playing) return false;
  if (!!state.looping || looping) return false;
  if (!!state.suppressedByExternalAudio) return false;

  return true;
}

function maybeAutoAdvanceNativeEndedTrack(state = {}) {
  if (!nativeStateLooksFinished(state)) return;

  const trackId = typeof state.trackId === 'string'
    ? state.trackId
    : currentTrackMeta?.id || '';

  if (!trackId) return;

  const now = Date.now();

  // Prevent repeated polling from firing skipNext 10 times.
  if (
    nativeEndedHandledTrackId === trackId &&
    now - nativeEndedHandledAt < 1500
  ) {
    return;
  }

  nativeEndedHandledTrackId = trackId;
  nativeEndedHandledAt = now;

  console.log('🎵 [SCMF][Music] Native track ended; advancing:', trackId);

  setTimeout(() => {
    handleNativeTrackEnded(trackId);
  }, 0);
}

function handleNativeTrackEnded(trackId) {
  // Story/custom callers still get first claim.
  if (typeof currentEndOverride === 'function') {
    try {
      currentEndOverride(trackId);
    } catch (err) {
      console.warn('⚠️ Native onEnd override error:', err);
    }
    return;
  }

  if (looping) return;

  if (shuffling) {
    playRandomTrack();
    return;
  }

  skipNext();
}

function applyNativeAudioState(state = {}) {
  const trackId = typeof state.trackId === 'string' ? state.trackId : '';
  const trackName = typeof state.trackName === 'string' ? state.trackName : '';

  nativePlaying = !!state.playing;
  nativeMuted = !!state.muted;
  nativeSuppressedByExternalAudio = !!state.suppressedByExternalAudio;

  if (typeof state.looping === 'boolean') {
    looping = state.looping;
  }

  nativeCurrentTime = Number.isFinite(Number(state.currentTime))
    ? Math.max(0, Number(state.currentTime))
    : 0;

  nativeDuration = Number.isFinite(Number(state.duration))
    ? Math.max(0, Number(state.duration))
    : 0;

  if (nativeDuration > 0) {
    nativeSeekRatio = Math.max(0, Math.min(1, nativeCurrentTime / nativeDuration));
  } else if (Number.isFinite(Number(state.seekPercent))) {
    nativeSeekRatio = Math.max(0, Math.min(1, Number(state.seekPercent)));
  } else {
    nativeSeekRatio = 0;
  }

  nativeSeekBase = nativeCurrentTime;
  nativeSeekStartedAt = nowSeconds();

  if (trackId) {
    currentTrackMeta =
      resolveTrackMeta(trackId) ||
      {
        id: trackId,
        name: trackName || trackId,
        file: '',
      };
  }

  emitMusicState();
  maybeAutoAdvanceNativeEndedTrack(state);
}

function shouldPollNativeMusicEngineState() {
  if (!useNativeAudio()) return false;
  if (!nativeEngineStatePollingWanted) return false;

  try {
    if (typeof document !== 'undefined') {
      if (document.hidden || document.visibilityState === 'hidden') {
        return false;
      }
    }
  } catch {
    return false;
  }

  // If Swift has parked SCMF for Apple Music / Spotify, don't poke it.
  if (nativeSuppressedByExternalAudio) return false;

  // If JS has no active track identity, there is nothing to advance.
  if (!currentTrackMeta?.id) return false;

  return true;
}

export function startNativeMusicEnginePolling() {
  if (!useNativeAudio()) return;

  nativeEngineStatePollingWanted = true;
  wireNativeAudioStateOnce();

  if (nativeEngineStatePollTimer) return;

  try {
    nativeRequestMusicState();
  } catch {}

  nativeEngineStatePollTimer = setInterval(() => {
    if (!shouldPollNativeMusicEngineState()) {
      return;
    }

    try {
      nativeRequestMusicState();
    } catch (err) {
      console.warn('⚠️ Native music engine state request failed:', err);
    }
  }, 650);
}

export function stopNativeMusicEnginePolling() {
  nativeEngineStatePollingWanted = false;

  if (!nativeEngineStatePollTimer) return;

  clearInterval(nativeEngineStatePollTimer);
  nativeEngineStatePollTimer = null;
}

function shouldPollNativeMusicState() {
  if (!useNativeAudio()) return false;

  try {
    if (typeof document !== 'undefined') {
      if (document.hidden || document.visibilityState === 'hidden') {
        return false;
      }

      // Music Tab polling only makes sense while the Music Tab player exists.
      const hasMusicTabControls =
        !!document.getElementById('trackProgress') &&
        !!document.getElementById('trackTimer') &&
        !!document.getElementById('btnPlayPause');

      if (!hasMusicTabControls) {
        return false;
      }
    }
  } catch {
    return false;
  }

  return true;
}

export function startNativeMusicStatePolling() {
  if (!useNativeAudio()) return;

  wireNativeAudioStateOnce();

  if (!shouldPollNativeMusicState()) {
    return;
  }

  if (nativeStatePollTimer) return;

  nativeRequestMusicState();

  nativeStatePollTimer = setInterval(() => {
    if (!shouldPollNativeMusicState()) {
      stopNativeMusicStatePolling();
      return;
    }

    nativeRequestMusicState();
  }, 500);
}



export function stopNativeMusicStatePolling() {
  if (!nativeStatePollTimer) return;

  clearInterval(nativeStatePollTimer);
  nativeStatePollTimer = null;
}
function playNativeTrackByMeta(meta, opts = {}) {
  if (!meta?.id) return;

  const {
    volume = getMusicVolume(),
    startAt = 0,
  } = opts;

  currentTrack = null;
  currentTrackMeta = meta;
  currentEndOverride = opts.onEnd || null;
  nativeEndedHandledTrackId = '';
  nativeEndedHandledAt = 0;

  nativePlayTrack(meta.id, {
    volume,
    startAt,
    looping,
  });

  // THE native auto-advance fix:
  // Swift owns playback, but JS owns shuffle/skip/onEnd logic.
  // Therefore JS must keep asking Swift for ended state even when the
  // Radio/Music Tab is closed.
  startNativeMusicEnginePolling();

  // Prime one state request shortly after play so JS and Swift agree.
  window.setTimeout(() => {
    try { nativeRequestMusicState(); } catch {}
  }, 180);

  nativeSeekBase = typeof startAt === 'number' && Number.isFinite(startAt)
    ? Math.max(0, startAt)
    : 0;

  // 🍧 Important:
  // Swift now owns real playback, but JS still needs a practical local state
  // so the Music Tab can toggle Play → Pause correctly.
  //
  // If Apple Music / Spotify is active, Swift may park this request.
  // That means the UI can be slightly optimistic until we add native state callbacks.
  // But without this, the button sends resumeTrack forever and never sends pauseTrack.
  nativePlaying = true;
  nativeSeekStartedAt = nowSeconds();

  updateTrackLabel(meta.name);
  emitMusicState();
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

  // 🏕️ Kids Camping signature tracks
  { id: 'kcParkingVibes', name: 'Parking Vibes',         file: 'parkingVibes.mp3' },
  { id: 'kcMosquito',     name: 'Squito Swat',           file: 'mosquito.mp3' },
  { id: 'kcTentLines',    name: 'Tent Lines',            file: 'tentLines.mp3' },

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

  // 🍎 Native iOS audio is owned by Swift now.
  // Do NOT let JS lifecycle handlers pause/resume native music.
  //
  // Why:
  // - Swift already handles app background/foreground.
  // - JS was sending resumeTrack before Swift could politely detect Apple Music/Spotify.
  // - That made SCMF music resume over the user's external music.
  if (useNativeAudio()) {
    console.log('🍎 [SCMF][Music] Native audio owns lifecycle; JS lifecycle guard disabled.');
    return;
  }

  try { Howler.autoSuspend = false; } catch {}

  // ─────────────────────────────────────────────────────────────
  // 🧠 Web lifecycle de-dupe gate
  // ─────────────────────────────────────────────────────────────
  let _isBg = false;
  let _lastFlipAt = 0;

  function bgOnce(reason = '') {
    const now = Date.now();
    if (_isBg && (now - _lastFlipAt) < 150) return;
    if (_isBg) return;

    _isBg = true;
    _lastFlipAt = now;
    _isBackgrounded = true;

    try { handleMusicBackground(); } catch {}
  }

  function fgOnce(reason = '') {
    const now = Date.now();
    if (!_isBg && (now - _lastFlipAt) < 150) return;
    if (!_isBg) return;

    _isBg = false;
    _lastFlipAt = now;
    _isBackgrounded = false;

    try { handleMusicForeground(); } catch {}
  }

  // Web lifecycle signals only.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) bgOnce('visibilitychange');
    else fgOnce('visibilitychange');
  });

  window.addEventListener('pagehide', () => bgOnce('pagehide'));
  window.addEventListener('pageshow', () => fgOnce('pageshow'));

  // Capacitor fallback only for non-native-audio environments.
  wireCapacitorAppLifecycle(() => bgOnce('capacitor'), () => fgOnce('capacitor'));
}

// Optional exports (handy if you ever want to call directly)
export function nativeMusicDidBackground() {
  // Native iOS audio is handled by Swift lifecycle now.
  if (useNativeAudio()) return;

  try { handleMusicBackground(); } catch {}
}
export function nativeMusicDidForeground() {
  // Native iOS audio is handled by Swift lifecycle now.
  if (useNativeAudio()) return;

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
  if (useNativeAudio()) {
    stopNativeMusicEnginePolling();
    nativeStopTrack();

    nativePlaying = false;
    nativeSeekBase = 0;
    nativeSeekStartedAt = 0;

    currentTrack = null;
    currentTrackMeta = null;
    currentEndOverride = null;

    callback?.();
    emitMusicState();
    return;
  }

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
    startAt = null,
  } = opts;

  // ✅ Native iOS path: Swift owns playback.
  if (useNativeAudio()) {
    const meta = resolveTrackMeta(id);
    if (!meta) {
      console.warn(`⚠️ Native track "${id}" not found.`);
      return;
    }

    playNativeTrackByMeta(meta, {
      volume,
      startAt: typeof startAt === 'number' && Number.isFinite(startAt) ? startAt : 0,
      onEnd,
    });

    return;
  }

  // ✅ Web fallback path: existing Howler behavior.
  wireMusicLifecycleGuardsOnce();

  const enforcedHtml5 = forceHtml5ForOptionA(html5);
  _lastPlayOpts = { html5: enforcedHtml5, useCache, volume };

  const seq = bumpSeq();
  clearStopTimer();

  const meta = resolveTrackMeta(id);
  if (!meta) {
    console.warn(`⚠️ Track "${id}" not found.`);
    return;
  }

  const nextHowl = getHowlFor(meta, { useCache, html5: enforcedHtml5, volume });

  if (crossfadeMs > 0) {
    crossfadeTo(nextHowl, meta, { crossfadeMs, onEnd, volume, startAt });
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

    try { nextHowl.play(); } catch {}

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
export function togglePlayPause(opts = {}) {
  if (useNativeAudio()) {
    if (!currentTrackMeta) {
      playTrack();
      emitMusicState();
      return;
    }

    if (nativePlaying) {
      nativePauseTrack();
      setNativePlaybackState({ playing: false });
    } else {
      // 🍎 v1.2.0 policy:
      // Resume/request SCMF music, but do NOT override Apple Music / Spotify.
      // Swift will park it if user soundtrack is active.
      nativeResumeTrack({ allowExternalAudio: false });
      setNativePlaybackState({ playing: true });
    }

    return;
  }

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
  if (useNativeAudio()) {
    nativeMuted = typeof desired === 'boolean'
      ? desired
      : !nativeMuted;

    nativeSetMuted(nativeMuted);

    // Keep Howler mute state mirrored for any leftover web fallback sounds.
    try { Howler.mute(nativeMuted); } catch {}

    emitMusicState();
    return nativeMuted;
  }

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
  if (useNativeAudio()) return nativeMuted;
  return Howler._muted;
}

// ─────────────────────────────────────────────────────────────
// 🔁 Loop / 🔀 Shuffle (add explicit setters for sanity)
// ─────────────────────────────────────────────────────────────
export function toggleLoop() {
  return setLoop(!looping);
}

function refreshNativeMusicStateSoon() {
  if (!useNativeAudio()) return;

  wireNativeAudioStateOnce();

  try {
    nativeRequestMusicState();
  } catch {}

  // Ask again one beat later because AVAudioPlayer can update its looped
  // currentTime just after the button tap / loop toggle.
  setTimeout(() => {
    try { nativeRequestMusicState(); } catch {}
  }, 120);
}

export function setLoop(val) {
  looping = !!val;

  if (useNativeAudio()) {
    nativeSetLooping(looping);

    // 🍧 Native owns the real playhead.
    // Do NOT immediately emit JS-estimated time here.
    // After a loop boundary, JS may still think the scrubber is near 100%,
    // while AVAudioPlayer has already wrapped back to the start.
    refreshNativeMusicStateSoon();

    return looping;
  }

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
  const list = getActiveList();
  if (!list.length) return 0;

  const id = currentTrackMeta?.id || '';

  if (id) {
    const byId = list.findIndex(t => t.id === id);
    if (byId >= 0) return byId;
  }

  if (!currentTrack) return 0;

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
  if (useNativeAudio()) return nativePlaying;
  return currentTrack?.playing() ?? false;
}

export function currentTrackName() {
  return currentTrackMeta?.name || '(none)';
}

export function currentTrackId() {
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
  wireMusicLifecycleGuardsOnce();

  if (useNativeAudio()) {
    wireNativeAudioStateOnce();
    nativeRequestMusicState();
  }

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
  const p = Number(percent);
  if (!Number.isFinite(p)) return;

  const clamped = Math.max(0, Math.min(1, p));

  if (useNativeAudio()) {
    wireNativeAudioStateOnce();

    nativeSeekRatio = clamped;

    if (nativeDuration > 0) {
      nativeCurrentTime = nativeDuration * clamped;
      nativeSeekBase = nativeCurrentTime;
      nativeSeekStartedAt = nowSeconds();
    }

    nativeSeekPercent(clamped);
    nativeRequestMusicState();
    emitMusicState();
    return;
  }

  if (!currentTrack) return;

  const duration = currentTrack.duration();
  if (duration && clamped >= 0 && clamped <= 1) {
    currentTrack.seek(clamped * duration);
  }
}

export function getCurrentSeekPercent() {
  if (useNativeAudio()) {
    if (nativeDuration > 0) {
      const elapsed = nativePlaying
        ? Math.max(0, nowSeconds() - nativeSeekStartedAt)
        : 0;

      const estimated = Math.min(nativeDuration, nativeSeekBase + elapsed);
      return Math.max(0, Math.min(1, estimated / nativeDuration));
    }

    return nativeSeekRatio;
  }

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
  let currentTime = 0;
  let duration = 0;

  if (useNativeAudio()) {
    const elapsed = nativePlaying
      ? Math.max(0, nowSeconds() - nativeSeekStartedAt)
      : 0;

    currentTime = nativeDuration > 0
      ? Math.min(nativeDuration, nativeSeekBase + elapsed)
      : nativeCurrentTime;

    duration = nativeDuration;
  }

  return {
    playing: isPlaying(),
    muted: isMuted(),
    looping,
    shuffling,
    trackId: currentTrackId(),
    trackName: currentTrackName(),
    pool: getMusicPool(),

    seekPercent: getCurrentSeekPercent(),
    currentTime,
    duration,
    suppressedByExternalAudio: nativeSuppressedByExternalAudio,
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

