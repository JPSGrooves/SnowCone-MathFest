// kidsCamping.js

import './kidsCamping.css';
import { swapModeBackground, applyBackgroundTheme } from '../../managers/backgroundManager.js';
import { playTransition } from '../../managers/transitionManager.js';
import { appState } from '../../data/appState.js';
import { hookReturnButton } from '../../utils/returnToMenu.js';
import { createTentLineGame, initGameLine } from './kidsCampingTentLineGame.js';
import { runInAction } from 'mobx';
import { cleanupTentLineGame } from './kidsCampingTentLineGame.js';


export function loadKidsMode() {
  runInAction(() => {
    appState.popCount = 0;
  });
  console.log('🏕️ Loading Kids Camping Mode');
  updatePopUI?.();
  appState.setMode('kids');

  const menuWrapper = document.querySelector('.menu-wrapper');
  const gameContainer = document.getElementById('game-container');

  menuWrapper?.classList.add('hidden');
  gameContainer.classList.remove('hidden');
  gameContainer.style.display = 'flex';

  renderIntroScreen();
  setupIntroEventHandlers();
  setTimeout(() => swapModeBackground('assets/img/modes/kidsCamping/kidsBG.png'), 0);
}

export function stopKidsMode() {
  cleanupTentLineGame(); // ☠️ wipe old game state!

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
}

function renderUI() {
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
          <div class="kc-slider-cell">Slider</div>
          <div class="kc-popper-cell">
            <div class="kc-popper-lineup">
              <button id="backToMenu">🔙<br/>Menu</button>
              <img src="${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/stegoVider.png" class="kc-icon" />
              <div class="kc-score-box">
                <div class="kc-score-label">Camping Score</div>
                <span id="popCount">0</span>
              </div>
              <img src="${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/brachioVider.png" class="kc-icon" />
              <button id="mushroomPopper">🚗<br/>Park!</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  hookReturnButton('backToMenu');
}

function setupEventHandlers() {
  const popBtn = document.getElementById('mushroomPopper');
  if (popBtn) {
    const triggerPop = () => {
      appState.incrementPopCount(1);
      updatePopUI();
      animatePopCount();
    };

    popBtn.addEventListener('pointerdown', triggerPop);
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
    tentZone.innerHTML = ''; // Clear existing content
    console.log('Tent zone found, clearing and rendering');

    const tentGameEl = createTentLineGame((score) => {
      appState.incrementPopCount(score);
      updatePopUI();
      animatePopCount();
    });

    tentZone.appendChild(tentGameEl);
    console.log('Tent game element appended');

    // ❌ No longer manually calling drawLineGlow here
  } else {
    console.error('Tent zone not found!');
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