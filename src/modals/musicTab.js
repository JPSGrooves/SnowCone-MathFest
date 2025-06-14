// /src/tabs/musicTab.js 🎛️ Cosmic Sound Selector
import { getSetting, setSetting } from '../data/cdms.js';
import {
  playTrack,
  togglePlayPause,
  skipNext,
  skipPrev,
  toggleShuffle,
  setLoop,
  initMusicPlayer,
  getLooping,
  getShuffling,
  stopTrack
} from '../managers/musicManager.js';

export function renderMusicTab() {
  const muted = getSetting('mute');
  const loopActive = getLooping();
  const shuffleActive = getShuffling();

  return `
    <div class="settings-block">
      <label>
        <input type="checkbox" id="muteToggle" ${muted ? 'checked' : ''} />
        🔇 Mute all sound
      </label>
    </div>

    <div class="settings-block jukebox">
      <h3>🎶 Now Playing:</h3>
      <div id="currentTrack">(none)</div>
      <input type="range" id="trackProgress" value="0" min="0" max="100" disabled />
      <div id="trackTimer">0:00 / 0:00</div>

      <div class="jukebox-controls">
        <button id="btnPrev" class="icon-btn">⏮️</button>
        <button id="btnPlayPause" class="icon-btn">⏯️</button>
        <button id="btnNext" class="icon-btn">⏭️</button>
        <button id="btnLoop" class="icon-btn ${loopActive ? 'active' : ''}">🔁</button>
        <button id="btnShuffle" class="icon-btn ${shuffleActive ? 'active' : ''}">🔀</button>
      </div>
    </div>
  `;
}

export function setupMusicTabUI() {
  const muteToggle = document.getElementById('muteToggle');
  const loopBtn = document.getElementById('btnLoop');
  const shuffleBtn = document.getElementById('btnShuffle');

  if (muteToggle) {
    muteToggle.addEventListener('change', () => {
      const muted = muteToggle.checked;
      setSetting('mute', muted);
      // 🔇 Instantly apply global mute via Howler.volume()
    });
  }

  document.getElementById('btnPlayPause')?.addEventListener('click', togglePlayPause);
  document.getElementById('btnNext')?.addEventListener('click', skipNext);
  document.getElementById('btnPrev')?.addEventListener('click', skipPrev);

  loopBtn?.addEventListener('click', () => {
    const isNowLooping = setLoop(!getLooping());
    loopBtn.classList.toggle('active', isNowLooping);
  });

  shuffleBtn?.addEventListener('click', () => {
    const isNowShuffling = toggleShuffle();
    shuffleBtn.classList.toggle('active', isNowShuffling);
  });

  initMusicPlayer();
}

// 💥 Optional: stop music when entering a game mode
export function stopMusicPlayer() {
  stopTrack();
}
