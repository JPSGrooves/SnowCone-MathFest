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

  const trackOptions = trackList.map(track => `
    <option value="${track.id}" ${activeTrackId === track.id ? 'selected' : ''}>
      ${track.name}
    </option>
  `).join('');

  return `
    <div class="settings-block">
      <label>
        <input type="checkbox" id="muteToggle" ${muted ? 'checked' : ''} />
        🔇 Mute All
      </label>
      <label>
        <input type="checkbox" id="glowToggle" checked />
        🌟 Neon Mode
      </label>
    </div>

    <div class="settings-block jukebox">
      <h3>🎶 Now Playing:</h3>
      <div class="track-title-container">
        <div id="currentTrack" class="track-title">
          ${playing ? currentTrackName() : 'Push ▶️ to Play'}
        </div>
      </div>

      <input type="range" id="trackProgress" value="0" min="0" max="100" />
      <div id="trackTimer">0:00 / 0:00</div>

      <div class="jukebox-controls">
        <button id="btnPrev" class="icon-btn grid-rew" title="Rewind">⏮️</button>
        <button id="btnPlayPause" class="icon-btn grid-play" title="Play/Pause">
          ${playing ? '⏸️' : '▶️'}
        </button>
        <button id="btnNext" class="icon-btn grid-ff" title="Fast-Forward">⏭️</button>

        <button id="btnLoop" class="icon-btn grid-loop ${loopActive ? 'active' : ''}" title="Loop">🔁</button>
        <button id="btnShuffle" class="icon-btn grid-shuffle ${shuffleActive ? 'active' : ''}" title="Shuffle">🔀</button>
        <button id="btnMute"
                class="icon-btn grid-mute ${muted ? 'active' : ''}"
                data-muted="${muted ? '1' : '0'}"
                aria-pressed="${muted ? 'true' : 'false'}"
                title="${muted ? 'Unmute' : 'Mute'}">
          ${muted ? '🔇' : '🔊'}
        </button>
      </div>

      <div class="settings-block">
        <label for="trackSelect">🎧 Track List:</label>
        <select id="trackSelect">${trackOptions}</select>
      </div>

      <div class="jukebox-message">
        You made it to the music player. That’s kinda amazing. 🌌<br>
        Some of these tracks? You can <em>only</em> hear them here — at SnowCone MathFest. Enjoy! 🍧🎵
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

  document.body.classList.toggle('neon-progress', glowToggle?.checked);

  // 🔥 Subscribe once: UI becomes reactive instead of guessing with timeouts.
  try { _unsubMusic?.(); } catch {}
  _unsubMusic = subscribeMusicState((state) => {
    const suppressed = !!state.suppressedByExternalAudio;
    const playing = !!state.playing;

    setPlayButtonUI(playing);

    if (suppressed && state.trackName) {
      updateTrackLabelUI(`${state.trackName} — parked for user music`);
    } else {
      updateTrackLabelUI(playing ? state.trackName : 'Push ▶️ to Play');
    }

    updateMuteUI(state.muted);

    if (loopBtn) loopBtn.classList.toggle('active', !!state.looping);
    if (shuffleBtn) shuffleBtn.classList.toggle('active', !!state.shuffling);

    // Only native/web state moves the scrubber when the user is NOT actively dragging it.
    if (progressBar && typeof state.seekPercent === 'number' && !_scrubbingMusic) {
      const nextValue = Math.max(0, Math.min(100, state.seekPercent * 100));
      progressBar.value = String(nextValue);
    }

    if (timer) {
      timer.textContent = `${formatTime(state.currentTime)} / ${formatTime(state.duration)}`;
    }

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
    const percent = parseFloat(e.target.value) / 100;

    if (!isNaN(percent) && percent >= 0 && percent <= 1) {
      scrubTo(percent);

      const s = getMusicState?.();
      if (timer && s) {
        timer.textContent = `${formatTime(s.currentTime)} / ${formatTime(s.duration)}`;
      }
    }
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
    playTrack(selectedTrack, { fadeMs: 0 });
  });

  // Initial sync
  try {
    const s = getMusicState?.();

    if (s) {
      setPlayButtonUI(!!s.playing);

      if (s.suppressedByExternalAudio && s.trackName) {
        updateTrackLabelUI(`${s.trackName} — parked for user music`);
      } else {
        updateTrackLabelUI(s.playing ? s.trackName : 'Push ▶️ to Play');
      }

      updateMuteUI(!!s.muted);

      if (progressBar && typeof s.seekPercent === 'number') {
        progressBar.value = String(Math.max(0, Math.min(100, s.seekPercent * 100)));
      }

      if (timer) {
        timer.textContent = `${formatTime(s.currentTime)} / ${formatTime(s.duration)}`;
      }
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

function formatTime(rawSeconds = 0) {
  const total = Number.isFinite(Number(rawSeconds))
    ? Math.max(0, Math.floor(Number(rawSeconds)))
    : 0;

  const minutes = Math.floor(total / 60);
  const seconds = total % 60;

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}