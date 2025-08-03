// kidsCamping.js

import './kidsCamping.css';
import { swapModeBackground, applyBackgroundTheme } from '../../managers/backgroundManager.js';
import { playTransition } from '../../managers/transitionManager.js';
import { appState } from '../../data/appState.js';
import { hookReturnButton } from '../../utils/returnToMenu.js';
import { createTentLineGame, initGameLine } from './kidsCampingTentLineGame.js';
import { runInAction } from 'mobx';
import { cleanupTentLineGame } from './kidsCampingTentLineGame.js';
import { stopTrack, playTrack } from '../../managers/musicManager.js'; // 🎶 add this
import { initParkingGame } from './parkingGame.js';
import { preventDoubleTapZoom } from '../../utils/preventDoubleTapZoom.js';





export function loadKidsMode() {
  runInAction(() => {
    appState.popCount = 0;
  });

  document.querySelectorAll('.kc-tent-inner-cell, .kc-grid, .kc-game-frame, .kc-aspect-wrap')
    .forEach(el => preventDoubleTapZoom(el));

  document.body.addEventListener('touchstart', unlockAudioContext, { once: true });
  document.body.addEventListener('click', unlockAudioContext, { once: true });

  function unlockAudioContext() {
    if (Howler.ctx && Howler.ctx.state === 'suspended') {
      Howler.ctx.resume().then(() => {
        console.log('🔓 Howler AudioContext unlocked');
      });
    }
  }

  console.log('🏕️ Loading Kids Camping Mode');
  stopTrack(); // 💥 shut down current music (jukebox etc)
  updatePopUI?.();
  appState.setMode('kids');

  const menuWrapper = document.querySelector('.menu-wrapper');
  const gameContainer = document.getElementById('game-container');

  menuWrapper?.classList.add('hidden');
  gameContainer.classList.remove('hidden');
  gameContainer.style.display = 'flex';

  // ✅ Load background *first*
  setTimeout(() => swapModeBackground('assets/img/modes/kidsCamping/kidsBG.png'), 0);

  // 🍧 PRELOAD PNGs BEFORE UI RENDERS
  import('./preloadParkingSprites.js').then(mod => mod.preloadParkingSprites());

  // 🏁 Then show the UI
  renderIntroScreen();
  setupIntroEventHandlers();
}


export function stopKidsMode() {
  stopTrack(); // ⛔ fade out camping music
  cleanupTentLineGame();

  const container = document.getElementById('game-container');
  container.innerHTML = '';
  container.classList.add('hidden');
  container.style.display = 'none';

  appState.popCount = 0;
  updatePopUI?.();
  cleanupEventHandlers();
  console.log('🏕️ Kids Camping Mode cleaned up!');
}

function renderIntroScreen() {
  const container = document.getElementById('game-container');
  container.innerHTML = `
    <div class="kc-aspect-wrap">
      <div class="kc-game-frame">
        <img 
          id="modeBackground" 
          class="background-fill kc-bg-img" 
          src="${import.meta.env.BASE_URL}assets/img/modes/kidsCamping/kidsBG.png" 
          alt="Kids Camping Background" 
        />

        <div class="kc-intro">
          <div class="kc-intro-stack">
            <div class="kc-speech">
              Hello! We're the Dino Dividers! Let's play some camping games! They are intended for little ones, but are fun for all ages!
            </div>
            <div class="director-wrapper">
              <img 
                id="directorSpriteIntro" 
                class="director-img" 
                src="${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/directors_intro.png" 
              />
            </div>
            <button id="startCamping" class="kc-intro-btn kc-btn-large start-camp-btn">⛺ Get to Camping! ⛺</button>
            <button id="backToMenuIntro" class="kc-intro-btn kc-btn-large back-to-menu-btn">🔙 Back to Menu</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function setupIntroEventHandlers() {
  document.querySelector('#backToMenuIntro')?.addEventListener('click', returnToMenu);
  document.querySelector('#startCamping')?.addEventListener('click', () => {
    const introEl = document.querySelector('.kc-intro');
    if (introEl) {
      introEl.classList.add('fade-out');
      setTimeout(() => {
        renderUI();
        setupEventHandlers();
        startGame();

        // 💥 Defer initGameLine reliably, fade-in or not
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            initGameLine(); // <- clean and guaranteed after DOM paints
          });
        });
      }, 450);
    }
  });
  document.querySelector('#backToMenuIntro')?.addEventListener('click', () => {
    stopTrack(); // 🔇 just in case
    returnToMenu(); 
  });
}

function renderUI() {
  playTrack('sc90'); // 🔊 let the camping begin
  const container = document.getElementById('game-container');
  container.innerHTML = `
    <div class="kc-aspect-wrap">
      <div class="kc-game-frame">
        <img id="modeBackground" class="background-fill" src="${import.meta.env.BASE_URL}assets/img/modes/kidsCamping/kidsBG.png" alt="Kids Camping Background" />
        <div class="kc-grid">
          <div class="kc-title">
            <img src="${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/rexVider.png" class="kc-icon kc-left-title" />
            <span class="kc-title-text">Kids Camping</span>
            <img src="${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/triceriVider.png" class="kc-icon kc-right-title" />
          </div>
          <div class="kc-scroller-cell">Scroller</div>
          <div class="kc-tent-zone"></div>
          <div class="kc-match-cell">Match</div>
          <div class="kc-slider-cell" id="parkingZone"></div>
          <div class="kc-popper-cell">
          <div class="kc-popper-lineup">
            <!-- Left Spacer -->
            <div class="kc-popper-slot">
              <button id="backToMenu">🔙<br/>Menu</button>
            </div>

            <!-- Center Score Wrap -->
            <div class="kc-score-wrap">
              <div class="kc-score-box">
                <div class="kc-score-label">Camping Score</div>
                <span id="popCount">0</span>
              </div>
            </div>

            <!-- Right Park + Mute Controls -->
            <!-- 🍉 Right Spacer -->
            <div class="kc-popper-slot">
              <button id="muteToggle" class="mute-btn">🔊<br/>Mute?</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  hookReturnButton('backToMenu');
}

function setupEventHandlers() {
  const popBtn = document.getElementById('parkTrigger');
  if (popBtn) {
    const triggerPop = () => {
      appState.incrementPopCount(1);
      updatePopUI();
      animatePopCount();
    };
    popBtn.addEventListener('pointerdown', triggerPop);
  }

  const muteBtn = document.getElementById('muteToggle');
  if (muteBtn) {
    const updateMuteVisual = () => {
      const isMuted = Howler._muted;
      muteBtn.innerHTML = isMuted ? '🔇<br/>Muted' : '🔊<br/>Mute?';
      muteBtn.classList.toggle('muted', isMuted);
    };

    muteBtn.addEventListener('click', () => {
      const isMuted = Howler._muted;
      Howler.mute(!isMuted);
      updateMuteVisual();
    });

    updateMuteVisual(); // 💡 Initialize UI state
  }

  document.querySelectorAll('.kc-icon, .kc-title img.kc-icon').forEach(icon => {
    icon.addEventListener('click', () => {
      icon.classList.remove('twisting');
      void icon.offsetWidth; // Force reflow
      icon.classList.add('twisting');
    });
  });
}


function cleanupEventHandlers() {}

function returnToMenu() {
  playTransition(() => {
    stopKidsMode();
    document.querySelector('.menu-wrapper')?.classList.remove('hidden');
    applyBackgroundTheme();
  });
}

function startGame() {
  const tentZone = document.querySelector('.kc-tent-zone');
  if (tentZone) {
    tentZone.innerHTML = '';
    console.log('Tent zone found, clearing and rendering');

    const tentGameEl = createTentLineGame((score) => {
      appState.incrementPopCount(score);
      updatePopUI();
      animatePopCount();
    });

    tentZone.appendChild(tentGameEl);
    console.log('Tent game element appended');
  } else {
    console.error('Tent zone not found!');
  }

  const parkingZone = document.getElementById('parkingZone');
  if (parkingZone) {
    initParkingGame(parkingZone);
    console.log('🚗 Parking game initialized!');
  } else {
    console.warn('⚠️ parkingZone not found in .kc-slider-cell');
  }
}


function updatePopUI() {
  const popSpan = document.getElementById('popCount');
  if (popSpan) popSpan.textContent = appState.popCount;
}

function animatePopCount() {
  const el = document.getElementById('popCount');
  if (!el) return;
  el.style.transform = 'scale(1.2)';
  el.style.transition = 'transform 0.2s ease';
  setTimeout(() => {
    el.style.transform = 'scale(1)';
  }, 200);
}
