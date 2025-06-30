import './kidsCamping.css';
import { swapModeBackground, applyBackgroundTheme } from '../../managers/backgroundManager.js';
import { playTransition } from '../../managers/transitionManager.js';
import { appState } from '../../data/appState.js';

// === 🏕️ Game State ===
let popCount = 0;

// === 🔗 DOM Refs
let popBtn, spinBtn, popCountDisplay, spinResultDisplay, returnBtn;

// === 🚀 ENTRY POINT
export function loadKidsMode() {
  console.log('🏕️ Loading Kids Camping Mode');
  appState.setMode('kids');

  swapModeBackground('kidsCamping');

  const menuWrapper = document.querySelector('.menu-wrapper');
  const gameContainer = document.getElementById('game-container');

  menuWrapper?.classList.add('hidden');
  gameContainer.classList.remove('hidden');
  gameContainer.style.display = 'flex';

  renderUI();
  setupEventHandlers();
  startGame();
}

// === 💀 EXIT POINT
export function stopKidsMode() {
  const container = document.getElementById('game-container');
  container.innerHTML = '';
  container.classList.add('hidden');
  container.style.display = 'none';

  cleanupEventHandlers();

  console.log('🏕️ Kids Camping Mode cleaned up!');
}

//////////////////////////////
// 🎨 Render UI
//////////////////////////////
function renderUI() {
  const container = document.getElementById('game-container');

  container.innerHTML = `
    <div class="game-frame">
      <img id="modeBackground" class="background-fill" src="assets/img/modes/kidsCamping/campingBG.png" alt="Camping Background" />
      <div class="kc-grid">
        <div class="kc-header">
          <h1>🏕️ Kids Camping Zone</h1>
        </div>

        <div class="kc-content">
          <div class="fidget-game">
            <h2>🍄 Mushroom Popper</h2>
            <button id="popBtn">Pop!</button>
            <div id="popCount">Pops: 0</div>
          </div>

          <div class="fidget-game">
            <h2>🌌 Spin the Cones</h2>
            <button id="spinBtn">Spin!</button>
            <div id="spinResult">Result: 🎲</div>
          </div>
        </div>

        <div class="kc-footer">
          <button id="returnToMenu" class="btn-return">🔙 Return to Menu</button>
        </div>
      </div>
    </div>
  `;

  repaintBackground();

  // 🔗 DOM refs
  popBtn = document.getElementById('popBtn');
  spinBtn = document.getElementById('spinBtn');
  popCountDisplay = document.getElementById('popCount');
  spinResultDisplay = document.getElementById('spinResult');
  returnBtn = document.getElementById('returnToMenu');
}

//////////////////////////////
// 🚦 Event Handlers
//////////////////////////////
function setupEventHandlers() {
  popBtn?.addEventListener('click', handlePop);
  spinBtn?.addEventListener('click', handleSpin);
  returnBtn?.addEventListener('click', returnToMenu);
}

function cleanupEventHandlers() {
  popBtn?.removeEventListener('click', handlePop);
  spinBtn?.removeEventListener('click', handleSpin);
  returnBtn?.removeEventListener('click', returnToMenu);
}

//////////////////////////////
// 🔙 Return to Menu
//////////////////////////////
function returnToMenu() {
  playTransition(() => {
    stopKidsMode();
    document.querySelector('.menu-wrapper')?.classList.remove('hidden');
    applyBackgroundTheme();
  });
}

//////////////////////////////
// 🎯 Game Logic
//////////////////////////////
function startGame() {
  popCount = 0;
  updatePopCount();
  spinResultDisplay.textContent = 'Result: 🎲';
}

function handlePop() {
  popCount++;
  updatePopCount();
}

function handleSpin() {
  const spinResults = ['🍧', '🎲', '🌈', '🔥', '❄️', '🚀'];
  const random = spinResults[Math.floor(Math.random() * spinResults.length)];
  spinResultDisplay.textContent = `Result: ${random}`;
}

function updatePopCount() {
  popCountDisplay.textContent = `Pops: ${popCount}`;
}

//////////////////////////////
// 🔄 Background Refresh
//////////////////////////////
function repaintBackground() {
  requestAnimationFrame(() => {
    setTimeout(() => {
      const img = document.getElementById('modeBackground');
      if (img) img.src = img.src;
    }, 10);
  });
}
