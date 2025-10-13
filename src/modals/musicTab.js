// /src/settings/musicTab.js
// SnowCone MathFest — Settings » Music Tab (Jukebox)
// Layout: 
//   Row 1 → ⏮️  ⏯️  ⏭️
//   Row 2 → 🔁  🔀  🔇/🔊
//
// Keeps checkbox + button + musicManager mute in sync.
// Awards 'play_music' badge on first successful play via button.

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
  toggleMute
} from '../managers/musicManager.js';

import { appState } from '../data/appState.js';
import { awardBadge } from '../managers/badgeManager.js';

// one-time guard so we only award once per session (badgeManager also de-dupes)
let _awardedPlayMusic = false;

//////////////////////////////
// 🔥 Render Music Tab
//////////////////////////////
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

      <!-- 🎛️ 2×3 control grid -->
      <div class="jukebox-controls">
        <!-- Row 1 -->
        <button id="btnPrev" class="icon-btn grid-rew" title="Rewind">⏮️</button>
        <button id="btnPlayPause" class="icon-btn grid-play" title="Play/Pause">
          ${playing ? '⏸️' : '▶️'}
        </button>
        <button id="btnNext" class="icon-btn grid-ff" title="Fast-Forward">⏭️</button>

        <!-- Row 2 -->
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

//////////////////////////////
// 🎧 Setup Jukebox UI
//////////////////////////////
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

  //////////////////////////////
  // 🔇 Global Mute (Checkbox)
  //////////////////////////////
  muteToggle?.addEventListener('change', () => {
    setMuted(muteToggle.checked);
  });

  //////////////////////////////
  // 🔇/🔊 Jukebox Mute Button
  //////////////////////////////
  muteBtn?.addEventListener('click', () => {
    const currentlyMuted = getMutedState();
    setMuted(!currentlyMuted);
  });

  //////////////////////////////
  // ✨ Neon Glow Toggle
  //////////////////////////////
  glowToggle?.addEventListener('change', () => {
    document.body.classList.toggle('neon-progress', glowToggle.checked);
  });

  //////////////////////////////
  // 🎚️ Scrubbing (Seek)
  //////////////////////////////
  progressBar?.addEventListener('input', (e) => {
    const percent = parseFloat(e.target.value) / 100;
    if (!isNaN(percent) && percent >= 0 && percent <= 1) {
      scrubTo(percent);
    }
  });

  //////////////////////////////
  // ⏯️ Play / Pause  (🏅 badge hooks here)
  //////////////////////////////
  playPauseBtn?.addEventListener('click', () => {
    const wasPlaying = (playPauseBtn.dataset.playing === '1') || isPlaying();

    togglePlayPause();

    // Optimistic UI
    const nowPlaying = !wasPlaying;
    setPlayButtonUI(nowPlaying);

    // 🏅 Award only on transition into playing from this button
    if (!_awardedPlayMusic && !wasPlaying && nowPlaying) {
      try { awardBadge('play_music'); } catch {}
      _awardedPlayMusic = true;
    }

    settleUISoon();
  });

  //////////////////////////////
  // ⏭️ Next / ⏮️ Prev
  //////////////////////////////
  nextBtn?.addEventListener('click', () => {
    skipNext();
    settleUISoon();
  });

  prevBtn?.addEventListener('click', () => {
    skipPrev();
    settleUISoon();
  });

  //////////////////////////////
  // 🔁 Loop
  //////////////////////////////
  loopBtn?.addEventListener('click', () => {
    const looping = toggleLoop();
    loopBtn.classList.toggle('active', looping);
  });

  //////////////////////////////
  // 🔀 Shuffle
  //////////////////////////////
  shuffleBtn?.addEventListener('click', () => {
    const shuffling = toggleShuffle();
    shuffleBtn.classList.toggle('active', shuffling);
  });

  //////////////////////////////
  // 🎧 Select Track (Auto Play)
  //////////////////////////////
  trackSelect?.addEventListener('change', () => {
    const selectedTrack = trackSelect.value;
    playTrack(selectedTrack);
    settleUISoon();
  });

  //////////////////////////////
  // 🚀 Sync UI on Load
  //////////////////////////////
  requestAnimationFrame(() => {
    syncButtonStates();
    updateMuteUI(); // ensure checkbox + button match current global state
  });
}

//////////////////////////////
// 🎛️ UI Sync
//////////////////////////////
function syncButtonStates() {
  updateTrackLabel();
  updatePlayPauseButton();
}

function updateTrackLabel() {
  const label = document.getElementById('currentTrack');
  if (label) {
    const name = isPlaying() ? currentTrackName() : 'Push ▶️ to Play';
    label.textContent = name;
  }
}

function updatePlayPauseButton() {
  setPlayButtonUI(isPlaying());
}

//////////////////////////////
// 🛑 External Kill Switch
//////////////////////////////
export function stopMusicPlayer() {
  stopTrack();
  syncButtonStates();
}

function setPlayButtonUI(playing) {
  const btn = document.getElementById('btnPlayPause');
  if (!btn) return;
  btn.dataset.playing = playing ? '1' : '0';
  btn.textContent = playing ? '⏸️' : '▶️';
}

function settleUISoon(delay = 120) {
  setTimeout(() => {
    updateTrackLabel();
    setPlayButtonUI(isPlaying());
    updateMuteUI();
  }, delay);
}

//////////////////////////////
// 🔇 Unified Mute Control
//////////////////////////////
function setMuted(desired) {
  const target = !!desired;
  const now = safeIsMuted();

  // Prefer musicManager as source of truth.
  try {
    if (toggleMute.length >= 1) {
      toggleMute(target);       // if it accepts a boolean
    } else if (now !== target) {
      toggleMute();             // toggle-only signature
    }
  } catch {
    if (now !== target) {
      try { toggleMute(); } catch {}
    }
  }

  // Mirror into appState for UI/Theming coherence
  try { appState.setSetting('mute', target); } catch {}

  updateMuteUI(target);
}

function updateMuteUI(muted = safeIsMuted()) {
  const muteToggle = document.getElementById('muteToggle');
  const muteBtn    = document.getElementById('btnMute');

  if (muteToggle) {
    muteToggle.checked = !!muted;
  }
  if (muteBtn) {
    muteBtn.dataset.muted = muted ? '1' : '0';
    muteBtn.classList.toggle('active', muted);
    muteBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
    muteBtn.title = muted ? 'Unmute' : 'Mute';
    muteBtn.textContent = muted ? '🔇' : '🔊';
  }
}

function getMutedState() {
  return safeIsMuted();
}

function safeIsMuted() {
  try {
    const m = isMuted?.();
    if (typeof m === 'boolean') return m;
  } catch {}
  return !!appState?.settings?.mute;
}
