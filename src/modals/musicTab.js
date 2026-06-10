// src/modals/musicTab.js

import {
  playTrack,
  togglePlayPause,
  skipNext,
  skipPrev,
  toggleShuffle,
  toggleLoop,
  getLooping,
  getShuffling,
  stopTrack,
  isPlaying,
  currentTrackName,
  currentTrackId,
  getTrackList,
  scrubTo,
  isMuted,
  toggleMute,
  subscribeMusicState,
  getMusicState,
  startNativeMusicStatePolling,
  stopNativeMusicStatePolling,
} from '../managers/musicManager.js';

import { appState } from '../data/appState.js';
import { awardBadge } from '../managers/badgeManager.js';

let _awardedPlayMusic = false;

// Keep one subscription per mount
let _unsubMusic = null;

let _musicTabAbort = null;

let _scrubbingMusic = false;

let _lastGoodTrackLabel = '';

let _lastGoodMusicClock = {
  trackId: '',
  currentTime: 0,
  duration: 0,
  seekPercent: 0,
};

function bindMusicTabEvent(el, type, handler, options = {}) {
  if (!el || !_musicTabAbort?.signal) return;

  el.addEventListener(type, handler, {
    ...options,
    signal: _musicTabAbort.signal,
  });
}

export function renderMusicTab() {
  const muted = safeIsMuted();
  const loopActive = getLooping();
  const shuffleActive = getShuffling();
  const playing = isPlaying();
  const trackList = getTrackList();
  const activeTrackId = currentTrackId();
  const displayTrackName = getMusicDisplayLabel();

  const trackOptions = trackList.map(track => `
    <option value="${track.id}" ${activeTrackId === track.id ? 'selected' : ''}>
      ${track.name}
    </option>
  `).join('');

  return `
    <div class="settings-block music-deck-card">
      <div class="music-deck-header">

        <div class="music-deck-art-slot" aria-hidden="true">
          <img
            class="music-deck-art"
            src="${import.meta.env.BASE_URL}assets/img/ui/radio/snowcone-radio-slim.png"
            alt=""
          />
        </div>
      </div>

      <div class="music-deck-screen">
        <div class="music-deck-screen-label">Now Playing</div>

        <div class="track-title-container music-deck-title-wrap">
          <div id="currentTrack" class="track-title music-deck-track-title">
            ${displayTrackName}
          </div>
        </div>

        <div class="music-deck-progress-wrap">
          <input type="range" id="trackProgress" value="0" min="0" max="100" />
          <div id="trackTimer" class="music-deck-timer">0:00 / 0:00</div>
        </div>
      </div>

      <div class="music-deck-transport" aria-label="Music transport controls">
        <button id="btnPrev" class="icon-btn music-btn music-btn-side" title="Previous Track" aria-label="Previous Track">
          ⏮️
        </button>

        <button id="btnPlayPause" class="icon-btn music-btn music-btn-play" title="Play/Pause" aria-label="Play/Pause">
          ${playing ? '⏸️' : '▶️'}
        </button>

        <button id="btnNext" class="icon-btn music-btn music-btn-side" title="Next Track" aria-label="Next Track">
          ⏭️
        </button>
      </div>

      <div class="music-deck-toggles" aria-label="Music mode controls">
        <button id="btnLoop"
                class="icon-btn music-btn music-btn-toggle ${loopActive ? 'active' : ''}"
                title="Loop"
                aria-label="Loop">
          🔁
        </button>

        <button id="btnShuffle"
                class="icon-btn music-btn music-btn-toggle ${shuffleActive ? 'active' : ''}"
                title="Shuffle"
                aria-label="Shuffle">
          🔀
        </button>

        <button id="btnMute"
                class="icon-btn music-btn music-btn-toggle ${muted ? 'active' : ''}"
                data-muted="${muted ? '1' : '0'}"
                aria-pressed="${muted ? 'true' : 'false'}"
                title="${muted ? 'Unmute' : 'Mute'}"
                aria-label="${muted ? 'Unmute' : 'Mute'}">
          ${muted ? '🔇' : '🔊'}
        </button>
      </div>

      <div class="music-deck-picker">
        <label for="trackSelect">Track</label>
        <select id="trackSelect">${trackOptions}</select>
      </div>
    </div>
  `;
}

export function setupMusicTabUI() {
  // 🍧 Prevent duplicate button listeners when the modal/tab remounts.
  // Without this, one tap can fire old handlers from previous Music Tab mounts.
  try { _musicTabAbort?.abort(); } catch {}
  _musicTabAbort = new AbortController();

  // Stop native polling if this tab gets mounted again / aborted later.
  try {
    _musicTabAbort.signal.addEventListener(
      'abort',
      () => {
        try { stopNativeMusicStatePolling?.(); } catch {}
      },
      { once: true }
    );
  } catch {}

  startNativeMusicStatePolling();

    const restartPollingIfMusicTabVisible = () => {
    try {
      if (document.hidden || document.visibilityState === 'hidden') return;

      const hasMusicTabControls =
        !!document.getElementById('trackProgress') &&
        !!document.getElementById('trackTimer') &&
        !!document.getElementById('btnPlayPause');

      if (hasMusicTabControls) {
        startNativeMusicStatePolling();
      }
    } catch {}
  };

  bindMusicTabEvent(window, 'pagehide', () => {
    stopNativeMusicStatePolling();
  });

  bindMusicTabEvent(window, 'pageshow', () => {
    restartPollingIfMusicTabVisible();
  });

  bindMusicTabEvent(window, 'scmf:nativeBackground', () => {
    stopNativeMusicStatePolling();
  });

  bindMusicTabEvent(window, 'scmf:nativeForeground', () => {
    setTimeout(restartPollingIfMusicTabVisible, 150);
  });

  bindMusicTabEvent(document, 'visibilitychange', () => {
    if (document.hidden || document.visibilityState === 'hidden') {
      stopNativeMusicStatePolling();
    } else {
      restartPollingIfMusicTabVisible();
    }
  });

  const muteToggle   = document.getElementById('muteToggle');
  const glowToggle   = document.getElementById('glowToggle');
  const playPauseBtn = document.getElementById('btnPlayPause');
  const nextBtn      = document.getElementById('btnNext');
  const prevBtn      = document.getElementById('btnPrev');
  const loopBtn      = document.getElementById('btnLoop');
  const shuffleBtn   = document.getElementById('btnShuffle');
  const muteBtn      = document.getElementById('btnMute');
  const trackSelect  = document.getElementById('trackSelect');
  const progressBar  = document.getElementById('trackProgress');
  const timer        = document.getElementById('trackTimer');

  document.body.classList.add('neon-progress');

  // 🔥 Subscribe once: UI becomes reactive instead of guessing with timeouts.
  try { _unsubMusic?.(); } catch {}
  _unsubMusic = subscribeMusicState((state) => {
    const suppressed = !!state.suppressedByExternalAudio;
    const playing = !!state.playing;

    setPlayButtonUI(playing);

    updateTrackLabelUI(getMusicDisplayLabel(state));

    updateMuteUI(state.muted);

    if (loopBtn) loopBtn.classList.toggle('active', !!state.looping);
    if (shuffleBtn) shuffleBtn.classList.toggle('active', !!state.shuffling);

    updateMusicClockUI(state, { progressBar, timer });

    if (trackSelect && state.trackId) {
      const opt = trackSelect.querySelector(`option[value="${state.trackId}"]`);
      if (opt) trackSelect.value = state.trackId;
    }

    if (muteToggle) muteToggle.checked = !!state.muted;
  });

  // 🔇 Global Mute Checkbox
  bindMusicTabEvent(muteToggle, 'change', () => {
    setMuted(muteToggle.checked);
  });

  // 🔇 / 🔊 Jukebox Mute Button
  bindMusicTabEvent(muteBtn, 'click', () => {
    const currentlyMuted = safeIsMuted();
    setMuted(!currentlyMuted);
  });

  // ✨ Neon Glow Toggle
  bindMusicTabEvent(glowToggle, 'change', () => {
    document.body.classList.toggle('neon-progress', glowToggle.checked);
  });

  // 🎚️ Scrubber start
  bindMusicTabEvent(progressBar, 'pointerdown', () => {
    _scrubbingMusic = true;
  });

  bindMusicTabEvent(progressBar, 'touchstart', () => {
    _scrubbingMusic = true;
  }, { passive: true });

  // 🎚️ Scrubbing seek
  bindMusicTabEvent(progressBar, 'input', (e) => {
    const percent = Math.max(
      0,
      Math.min(1, parseFloat(e.target.value) / 100)
    );

    if (Number.isNaN(percent)) return;

    const s = getMusicState?.() || {};

    const trackId =
      s.trackId ||
      currentTrackId?.() ||
      _lastGoodMusicClock.trackId ||
      '';

    const duration =
      Number(s.duration) > 0
        ? Number(s.duration)
        : Number(_lastGoodMusicClock.duration || 0);

    const currentTime =
      duration > 0
        ? duration * percent
        : 0;

    _lastGoodMusicClock = {
      trackId,
      currentTime,
      duration,
      seekPercent: percent,
    };

    if (timer) {
      timer.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
    }

    scrubTo(percent);
  });

  // 🎚️ Scrubber end
  bindMusicTabEvent(progressBar, 'pointerup', () => {
    _scrubbingMusic = false;
  });

  bindMusicTabEvent(progressBar, 'touchend', () => {
    _scrubbingMusic = false;
  }, { passive: true });

  bindMusicTabEvent(progressBar, 'change', () => {
    _scrubbingMusic = false;
  });

  // ⏯️ Play / Pause
  bindMusicTabEvent(playPauseBtn, 'click', () => {
    const wasPlaying = isPlaying();

    // If this tap is pausing, freeze the UI clock from the visible scrubber
    // BEFORE the native/web state has a chance to report fake 0:00.
    if (wasPlaying) {
      freezeClockFromVisibleProgress(progressBar, timer);
    }

    // v1.2.0 policy:
    // This does NOT override Apple Music / Spotify.
    // Swift parks SCMF music if user soundtrack is active.
    togglePlayPause({ userInitiated: false });

    const nowPlaying = isPlaying();

    if (!_awardedPlayMusic && !wasPlaying && nowPlaying) {
      try { awardBadge('play_music'); } catch {}
      _awardedPlayMusic = true;
    }
  });

  // ⏭️ Next / ⏮️ Prev
  bindMusicTabEvent(nextBtn, 'click', () => {
    skipNext();
  });

  bindMusicTabEvent(prevBtn, 'click', () => {
    skipPrev();
  });

  // 🔁 Loop
  bindMusicTabEvent(loopBtn, 'click', () => {
    const on = toggleLoop();
    loopBtn.classList.toggle('active', on);
  });

  // 🔀 Shuffle
  bindMusicTabEvent(shuffleBtn, 'click', () => {
    const on = toggleShuffle();
    shuffleBtn.classList.toggle('active', on);
  });

  // 🎧 Select Track
  bindMusicTabEvent(trackSelect, 'change', () => {
    const selectedTrack = trackSelect.value;
    const selectedLabel = getSelectedTrackLabel();

    if (selectedLabel) {
      rememberGoodTrackLabel(selectedLabel);
      updateTrackLabelUI(selectedLabel);
    }

    playTrack(selectedTrack, { fadeMs: 0 });
  });

  // Initial sync
  try {
    const s = getMusicState?.();

    if (s) {
      setPlayButtonUI(!!s.playing);

      updateTrackLabelUI(getMusicDisplayLabel(s));

      updateMuteUI(!!s.muted);

      updateMusicClockUI(s, { progressBar, timer });
    } else {
      updateMuteUI(safeIsMuted());
    }
  } catch {
    updateMuteUI(safeIsMuted());
  }
}

export function stopMusicPlayer() {
  stopTrack();
}

function setPlayButtonUI(playing) {
  const btn = document.getElementById('btnPlayPause');
  if (!btn) return;
  btn.dataset.playing = playing ? '1' : '0';
  btn.textContent = playing ? '⏸️' : '▶️';
}

function updateTrackLabelUI(text) {
  const label = document.getElementById('currentTrack');
  if (label) label.textContent = text;
}

function safeCurrentTrackName() {
  try {
    return cleanTrackLabel(currentTrackName?.() || '');
  } catch {
    return '';
  }
}

function cleanTrackLabel(value) {
  if (typeof value !== 'string') return '';

  const trimmed = value.trim();
  const lowered = trimmed.toLowerCase();

  if (!trimmed) return '';
  if (lowered === '(none)') return '';
  if (lowered === 'none') return '';
  if (lowered === 'null') return '';
  if (lowered === 'undefined') return '';

  return trimmed;
}

function getTrackLabelById(trackId) {
  if (!trackId) return '';

  try {
    const found = getTrackList()?.find(track => track.id === trackId);
    return cleanTrackLabel(found?.name || '');
  } catch {
    return '';
  }
}

function getSelectedTrackLabel() {
  const select = document.getElementById('trackSelect');
  const option = select?.selectedOptions?.[0];
  return cleanTrackLabel(option?.textContent || '');
}

function rememberGoodTrackLabel(label) {
  const clean = cleanTrackLabel(label);
  if (clean) _lastGoodTrackLabel = clean;
  return clean;
}

function getMusicDisplayLabel(state = {}) {
  const stateName = cleanTrackLabel(state?.trackName);
  const currentName = safeCurrentTrackName();
  const idName = getTrackLabelById(state?.trackId);

  const bestName = rememberGoodTrackLabel(
    stateName ||
    currentName ||
    idName
  );

  if (state?.suppressedByExternalAudio && bestName) {
    return bestName;
  }

  // During track changes, native/web state can briefly report empty.
  // Keep the last real track label instead of flashing "(none)" or startup text.
  const looksLikeTransition =
    !!state?.trackId ||
    !!state?.playing ||
    Number(state?.duration || 0) > 0 ||
    Number(state?.currentTime || 0) > 0;

  if (looksLikeTransition && _lastGoodTrackLabel) {
    return _lastGoodTrackLabel;
  }

  return bestName || 'Push ▶️ to Play';
}

// ─────────────────────────────────────────────
// 🔇 Unified Mute Control
// ─────────────────────────────────────────────
function setMuted(desired) {
  const target = !!desired;
  const now = safeIsMuted();

  try {
    // toggleMute supports boolean signature in your manager
    toggleMute(target);
  } catch {
    if (now !== target) {
      try { toggleMute(); } catch {}
    }
  }

  try { appState.setSetting('mute', target); } catch {}
  updateMuteUI(target);
}

function updateMuteUI(muted = safeIsMuted()) {
  const muteToggle = document.getElementById('muteToggle');
  const muteBtn    = document.getElementById('btnMute');

  if (muteToggle) muteToggle.checked = !!muted;

  if (muteBtn) {
    muteBtn.dataset.muted = muted ? '1' : '0';
    muteBtn.classList.toggle('active', muted);
    muteBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
    muteBtn.title = muted ? 'Unmute' : 'Mute';
    muteBtn.textContent = muted ? '🔇' : '🔊';
  }
}

function safeIsMuted() {
  try {
    const m = isMuted?.();
    if (typeof m === 'boolean') return m;
  } catch {}
  return !!appState?.settings?.mute;
}

function rememberVisibleClockBeforePause(progressBar) {
  const s = getMusicState?.() || {};

  const trackId =
    s.trackId ||
    currentTrackId?.() ||
    _lastGoodMusicClock.trackId ||
    '';

  const duration =
    Number(s.duration) > 0
      ? Number(s.duration)
      : Number(_lastGoodMusicClock.duration || 0);

  if (duration <= 0) return;

  const stateCurrent =
    Number(s.currentTime) > 0
      ? Number(s.currentTime)
      : 0;

  const visiblePercent =
    progressBar && Number.isFinite(Number(progressBar.value))
      ? Math.max(0, Math.min(1, Number(progressBar.value) / 100))
      : 0;

  const visibleCurrent =
    visiblePercent > 0
      ? duration * visiblePercent
      : 0;

  const currentTime =
    stateCurrent > 0
      ? stateCurrent
      : visibleCurrent;

  if (currentTime <= 0) return;

  _lastGoodMusicClock = {
    trackId,
    currentTime,
    duration,
    seekPercent: Math.max(0, Math.min(1, currentTime / duration)),
  };
}

function getVisibleProgressPercent(progressBar) {
  if (!progressBar) return null;

  const raw = Number(progressBar.value);
  if (!Number.isFinite(raw)) return null;

  return Math.max(0, Math.min(1, raw / 100));
}

function freezeClockFromVisibleProgress(progressBar, timer) {
  const s = getMusicState?.() || {};

  const trackId =
    s.trackId ||
    currentTrackId?.() ||
    _lastGoodMusicClock.trackId ||
    '';

  const duration =
    Number(s.duration) > 0
      ? Number(s.duration)
      : Number(_lastGoodMusicClock.duration || 0);

  if (duration <= 0) return;

  const visiblePercent =
    getVisibleProgressPercent(progressBar) ??
    _lastGoodMusicClock.seekPercent ??
    0;

  const currentTime = duration * visiblePercent;

  _lastGoodMusicClock = {
    trackId,
    currentTime,
    duration,
    seekPercent: visiblePercent,
  };

  if (progressBar) {
    progressBar.value = String(visiblePercent * 100);
  }

  if (timer) {
    timer.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
  }
}

function getStableMusicClock(state = {}, progressBar = null) {
  const incomingTrackId =
    state?.trackId ||
    currentTrackId?.() ||
    _lastGoodMusicClock.trackId ||
    '';

  const previous = _lastGoodMusicClock;

  const trackChanged =
    !!incomingTrackId &&
    !!previous.trackId &&
    incomingTrackId !== previous.trackId;

  if (trackChanged) {
    _lastGoodMusicClock = {
      trackId: incomingTrackId,
      currentTime: 0,
      duration: 0,
      seekPercent: 0,
    };
  }

  const rawCurrentTime = Number(state?.currentTime);
  const rawDuration = Number(state?.duration);
  const rawSeekPercent = Number(state?.seekPercent);

  const hasDuration =
    Number.isFinite(rawDuration) &&
    rawDuration > 0;

  const hasCurrentTime =
    Number.isFinite(rawCurrentTime) &&
    rawCurrentTime >= 0;

  const hasSeekPercent =
    Number.isFinite(rawSeekPercent) &&
    rawSeekPercent >= 0 &&
    rawSeekPercent <= 1;

  const sameTrackOrUnknown =
    !incomingTrackId ||
    !previous.trackId ||
    incomingTrackId === previous.trackId;

  const duration =
    hasDuration
      ? rawDuration
      : Number(previous.duration || 0);

  // 🍧 BIG RULE:
  // If paused and we already know the track duration,
  // the visible scrubber owns the timer.
  if (!state?.playing && sameTrackOrUnknown && duration > 0) {
    const visiblePercent =
      getVisibleProgressPercent(progressBar) ??
      previous.seekPercent ??
      0;

    const currentTime = duration * visiblePercent;

    _lastGoodMusicClock = {
      trackId: incomingTrackId || previous.trackId,
      currentTime,
      duration,
      seekPercent: visiblePercent,
    };

    return _lastGoodMusicClock;
  }

  // While playing, trust real state.
  if (hasDuration) {
    let currentTime = hasCurrentTime ? rawCurrentTime : 0;

    if (
      currentTime === 0 &&
      hasSeekPercent &&
      rawSeekPercent > 0
    ) {
      currentTime = rawDuration * rawSeekPercent;
    }

    const seekPercent =
      hasSeekPercent
        ? rawSeekPercent
        : Math.max(0, Math.min(1, currentTime / rawDuration));

    _lastGoodMusicClock = {
      trackId: incomingTrackId,
      currentTime,
      duration: rawDuration,
      seekPercent,
    };

    return _lastGoodMusicClock;
  }

  // No useful state, but we have a previous real clock.
  if (sameTrackOrUnknown && previous.duration > 0) {
    return previous;
  }

  return {
    trackId: incomingTrackId,
    currentTime: 0,
    duration: 0,
    seekPercent: 0,
  };
}

function updateMusicClockUI(state = {}, { progressBar, timer } = {}) {
  const clock = getStableMusicClock(state, progressBar);

  // Playing: state/clock updates scrubber.
  // Paused: do NOT yank the scrubber around from native/web state.
  if (progressBar && !_scrubbingMusic && state?.playing) {
    const nextValue = Math.max(
      0,
      Math.min(100, clock.seekPercent * 100)
    );

    progressBar.value = String(nextValue);
  }

  if (timer) {
    timer.textContent = `${formatTime(clock.currentTime)} / ${formatTime(clock.duration)}`;
  }
}

function formatTime(rawSeconds = 0) {
  const total = Number.isFinite(Number(rawSeconds))
    ? Math.max(0, Math.floor(Number(rawSeconds)))
    : 0;

  const minutes = Math.floor(total / 60);
  const seconds = total % 60;

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}