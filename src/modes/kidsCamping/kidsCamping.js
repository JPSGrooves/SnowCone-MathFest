import './kidsCamping.css';
import { swapModeBackground, applyBackgroundTheme } from '../../managers/backgroundManager.js';
import { playTransition } from '../../managers/transitionManager.js';
import { appState } from '../../data/appState.js';
import { hookReturnButton } from '../../utils/returnToMenu.js'; // BTM hook

// Game State (add per game, e.g., popCount = 0; tentLit = Array(9).fill(false); etc.)

// DOM Refs (add as built)

// ENTRY POINT
export function loadKidsMode() {
  console.log('🏕️ Loading Kids Camping Mode');

  appState.popCount = 0;         // 💥 Reset ACTUAL value
  updatePopUI?.();               // 🧼 Reset visible score immediately

  appState.setMode('kids');

  swapModeBackground('assets/img/modes/kidsCamping/kidsBG.png'); // Full path fix

  const menuWrapper = document.querySelector('.menu-wrapper');
  const gameContainer = document.getElementById('game-container');

  menuWrapper?.classList.add('hidden');
  gameContainer.classList.remove('hidden');
  gameContainer.style.display = 'flex';

  renderIntroScreen();
  setupIntroEventHandlers();
}


// EXIT POINT
export function stopKidsMode() {
  const container = document.getElementById('game-container');
  container.innerHTML = '';
  container.classList.add('hidden');
  container.style.display = 'none';

  appState.popCount = 0; // 🧼 Reset the camping score
  updatePopUI?.(); // Optional, guarantees it’s updated visually


  cleanupEventHandlers();
  console.log('🏕️ Kids Camping Mode cleaned up!');
}

// Render Intro (IL Mirror)
// kidsCamping.js (Updated renderIntroScreen for centering and sizing)

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
              Hello! We are the Dino Dividers! Let's play some games in Kids Camping!
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
}// Intro Handlers
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

        const grid = document.querySelector('.kc-grid');
        if (grid) grid.classList.add('fade-in');
      }, 450);
    }
  });
}

// Render Main UI (Grid)
function renderUI() {
  const container = document.getElementById('game-container');
  container.innerHTML = `
    <div class="kc-aspect-wrap">
      <div class="kc-game-frame">
        <img id="modeBackground" class="background-fill" src="${import.meta.env.BASE_URL}assets/img/modes/kidsCamping/kidsBG.png" alt="Kids Camping Background" />
        <div class="kc-grid">
          <div class="kc-title">🦕 Kids Camping 🦕</div>
          <div class="kc-scroller-cell">Scroller</div>
          <div class="kc-tent-cell">Tent</div>
          <div class="kc-match-cell">Match</div>
          <div class="kc-slider-cell">Slider</div>
          <div class="kc-popper-cell">
            <button id="backToMenu">🔙 Menu</button>
            
            <div class="kc-score-box">
              <div class="kc-score-label">Camping Score</div>
              <span id="popCount">0</span>
            </div>

            <button id="mushroomPopper">🚗 Park!</button>
          </div>
        </div>
      </div>
    </div>
  `;

  hookReturnButton('backToMenu'); // Hook BTM
}

// Main Handlers (Stub—Add game events)
function setupEventHandlers() {
  document.getElementById('mushroomPopper')?.addEventListener('click', () => {
    appState.incrementPopCount(1);
    updatePopUI();
    animatePopCount();
  });
}


function cleanupEventHandlers() {
  // Remove listeners
}

function returnToMenu() {
  playTransition(() => {
    stopKidsMode();
    document.querySelector('.menu-wrapper')?.classList.remove('hidden');
    applyBackgroundTheme();
  });
}

// Game Logic (Stub)
function startGame() {
  // Init games
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



