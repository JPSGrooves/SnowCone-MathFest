// /src/settings/musicTab.js

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
  subscribeMusicState,   // 👈 NEW
  getMusicState          // 👈 optional but nice
} from '../managers/musicManager.js';

import { appState } from '../data/appState.js';
import { awardBadge } from '../managers/badgeManager.js';

let _awardedPlayMusic = false;

// Keep one subscription per mount
let _unsubMusic = null;

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

  document.body.classList.toggle('neon-progress', glowToggle?.checked);

  // 🔥 Subscribe once: UI becomes reactive instead of guessing with timeouts
  try { _unsubMusic?.(); } catch {}
  _unsubMusic = subscribeMusicState((state) => {
    // state: {playing, muted, looping, shuffling, trackName, trackId, pool}
    setPlayButtonUI(state.playing);
    updateTrackLabelUI(state.playing ? state.trackName : 'Push ▶️ to Play');
    updateMuteUI(state.muted);

    if (loopBtn) loopBtn.classList.toggle('active', !!state.looping);
    if (shuffleBtn) shuffleBtn.classList.toggle('active', !!state.shuffling);

    // Keep dropdown selection in sync if the currently playing track exists in list
    if (trackSelect && state.trackId) {
      const opt = trackSelect.querySelector(`option[value="${state.trackId}"]`);
      if (opt) trackSelect.value = state.trackId;
    }

    if (muteToggle) muteToggle.checked = !!state.muted;
  });

  // 🔇 Global Mute (Checkbox)
  muteToggle?.addEventListener('change', () => {
    setMuted(muteToggle.checked);
  });

  // 🔇/🔊 Jukebox Mute Button
  muteBtn?.addEventListener('click', () => {
    const currentlyMuted = safeIsMuted();
    setMuted(!currentlyMuted);
  });

  // ✨ Neon Glow Toggle
  glowToggle?.addEventListener('change', () => {
    document.body.classList.toggle('neon-progress', glowToggle.checked);
  });

  // 🎚️ Scrubbing (Seek)
  progressBar?.addEventListener('input', (e) => {
    const percent = parseFloat(e.target.value) / 100;
    if (!isNaN(percent) && percent >= 0 && percent <= 1) {
      scrubTo(percent);
    }
  });

  // ⏯️ Play / Pause (badge)
  playPauseBtn?.addEventListener('click', () => {
    const wasPlaying = isPlaying();
    togglePlayPause();

    // Badge on transition into playing from this button
    const nowPlaying = !wasPlaying;
    if (!_awardedPlayMusic && !wasPlaying && nowPlaying) {
      try { awardBadge('play_music'); } catch {}
      _awardedPlayMusic = true;
    }
  });

  // ⏭️ Next / ⏮️ Prev
  nextBtn?.addEventListener('click', () => skipNext());
  prevBtn?.addEventListener('click', () => skipPrev());

  // 🔁 Loop
  loopBtn?.addEventListener('click', () => {
    const on = toggleLoop();
    loopBtn.classList.toggle('active', on);
  });

  // 🔀 Shuffle
  shuffleBtn?.addEventListener('click', () => {
    const on = toggleShuffle();
    shuffleBtn.classList.toggle('active', on);
  });

  // 🎧 Select Track (Auto Play)
  trackSelect?.addEventListener('change', () => {
    const selectedTrack = trackSelect.value;
    playTrack(selectedTrack, { fadeMs: 0 });
  });

  // Initial sync
  try {
    const s = getMusicState?.();
    if (s) {
      setPlayButtonUI(!!s.playing);
      updateTrackLabelUI(s.playing ? s.trackName : 'Push ▶️ to Play');
      updateMuteUI(!!s.muted);
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
