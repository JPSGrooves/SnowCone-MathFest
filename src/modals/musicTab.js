import { Howler } from 'howler';
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
  scrubTo
} from '../managers/musicManager.js';

import { appState } from '../data/appState.js';

//////////////////////////////
// 🔥 Render Music Tab
//////////////////////////////
export function renderMusicTab() {
  const muted = appState.settings.mute;
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
        <button id="btnPrev" class="icon-btn">⏮️</button>
        <button id="btnPlayPause" class="icon-btn">${playing ? '⏸️' : '▶️'}</button>
        <button id="btnNext" class="icon-btn">⏭️</button>
        <button id="btnLoop" class="icon-btn ${loopActive ? 'active' : ''}">🔁</button>
        <button id="btnShuffle" class="icon-btn ${shuffleActive ? 'active' : ''}">🔀</button>
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
  const muteToggle = document.getElementById('muteToggle');
  const glowToggle = document.getElementById('glowToggle');
  const playPauseBtn = document.getElementById('btnPlayPause');
  const nextBtn = document.getElementById('btnNext');
  const prevBtn = document.getElementById('btnPrev');
  const loopBtn = document.getElementById('btnLoop');
  const shuffleBtn = document.getElementById('btnShuffle');
  const trackSelect = document.getElementById('trackSelect');
  const progressBar = document.getElementById('trackProgress');

  document.body.classList.toggle('neon-progress', glowToggle?.checked);


  //////////////////////////////
  // 🔇 Mute
  //////////////////////////////
  muteToggle?.addEventListener('change', () => {
    const muted = muteToggle.checked;
    Howler.mute(muted);
    appState.setSetting('mute', muted);
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
  // ⏯️ Play / Pause
  //////////////////////////////
  playPauseBtn?.addEventListener('click', () => {
    togglePlayPause();
    syncButtonStates();
  });

  //////////////////////////////
  // ⏭️ Next
  //////////////////////////////
  nextBtn?.addEventListener('click', () => {
    skipNext();
    syncButtonStates();
  });

  //////////////////////////////
  // ⏮️ Prev
  //////////////////////////////
  prevBtn?.addEventListener('click', () => {
    skipPrev();
    syncButtonStates();
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
    syncButtonStates();
  });

  //////////////////////////////
  // 🚀 Sync UI on Load
  //////////////////////////////
  requestAnimationFrame(() => {
    syncButtonStates();
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
  const btn = document.getElementById('btnPlayPause');
  if (btn) {
    btn.textContent = isPlaying() ? '⏸️' : '▶️';
  }
}

//////////////////////////////
// 🛑 External Kill Switch
//////////////////////////////
export function stopMusicPlayer() {
  stopTrack();
  syncButtonStates();
}
