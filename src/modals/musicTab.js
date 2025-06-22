// 🎛️ Cosmic Sound Selector (MobX Ready)
import { Howler } from 'howler';
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

import { appState } from '../data/appState.js';

export function renderMusicTab() {
  const muted = appState.settings.mute;
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

      <div class="jukebox-message" style="margin-top: 15px; font-size: 14px; line-height: 1.6; color: #cccccc;">
        You made it to the music player. That’s kinda amazing. 🌌<br>
        Math creates the music that connects the soul to the numbers of the festival.<br>
        I'm honored you're listening. Some of these tracks? You can <em>only</em> hear them here — at SnowCone MathFest. Enjoy! 🍧🎵
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
      appState.setSetting('mute', muted);
      Howler.volume(muted ? 0 : 1); // 🔇 immediate effect
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

// 🧊 External scene call
export function stopMusicPlayer() {
  stopTrack();
}
