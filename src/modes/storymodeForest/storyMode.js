import './storyMode.css';
import { swapModeBackground, applyBackgroundTheme } from '../../managers/backgroundManager.js';
import { playTransition } from '../../managers/transitionManager.js';
import { appState } from '../../data/appState.js';

import {
  dialogueTree,
  getDialogue,
  chooseOption,
  resetDialogue
} from './dialogueManager.js';

// === 🔥 Local state
let dialogueBox, optionButtons, returnBtn;

//////////////////////////////
// 🚀 Entry Point
//////////////////////////////
export function loadStoryMode() {
  console.log('🌲 Loading Story Mode');
  appState.setMode('story');

  swapModeBackground('storymodeForest');

  const menuWrapper = document.querySelector('.menu-wrapper');
  const gameContainer = document.getElementById('game-container');

  menuWrapper?.classList.add('hidden');
  gameContainer.classList.remove('hidden');
  gameContainer.style.display = 'flex';

  renderUI();
  setupEventHandlers();
  renderDialogue();
}

//////////////////////////////
// 💀 Exit Point
//////////////////////////////
export function stopStoryMode() {
  resetDialogue();

  cleanupEventHandlers();

  const container = document.getElementById('game-container');
  container.innerHTML = '';
  container.classList.add('hidden');
  container.style.display = 'none';

  console.log('🌲 Story Mode cleaned up');
}

//////////////////////////////
// 🎨 Render UI
//////////////////////////////
function renderUI() {
  const container = document.getElementById('game-container');

  container.innerHTML = `
    <div class="game-frame">
      <img id="modeBackground" class="background-fill" src="assets/img/modes/storymodeForest/storyBG.png" alt="Story Mode Background" />
      <div class="sm-grid">
        <div class="sm-header">
          <h1>🌲 Story Mode – MathFest Chronicles</h1>
        </div>

        <div class="sm-content">
          <div class="dialogue-box" id="dialogueBox"></div>
          <div class="option-buttons" id="optionButtons"></div>
        </div>

        <div class="sm-footer">
          <button id="returnToMenu" class="btn-return">🔙 Return to Menu</button>
        </div>
      </div>
    </div>
  `;

  repaintBackground();

  // Cache elements
  dialogueBox = document.getElementById('dialogueBox');
  optionButtons = document.getElementById('optionButtons');
  returnBtn = document.getElementById('returnToMenu');
}

//////////////////////////////
// 🚦 Events
//////////////////////////////
function setupEventHandlers() {
  returnBtn?.addEventListener('click', returnToMenu);
}

function cleanupEventHandlers() {
  returnBtn?.removeEventListener('click', returnToMenu);
}

//////////////////////////////
// 🔙 Return to Menu
//////////////////////////////
function returnToMenu() {
  playTransition(() => {
    stopStoryMode();
    document.querySelector('.menu-wrapper')?.classList.remove('hidden');
    applyBackgroundTheme();
  });
}

//////////////////////////////
// 🧠 Dialogue Logic
//////////////////////////////
function renderDialogue() {
  const { line, options } = getDialogue();

  dialogueBox.innerHTML = `<p>🧠 ${line}</p>`;
  optionButtons.innerHTML = '';

  options.forEach((optionKey, index) => {
    const button = document.createElement('button');
    button.textContent = `${index + 1}. ${dialogueTree[optionKey].label}`;
    button.classList.add('option-btn');

    button.addEventListener('click', () => {
      playTransition('assets/img/storymode/transitionCone.png', () => {
        chooseOption(optionKey);
        renderDialogue();

        if (optionKey.startsWith('start_')) {
          const mode = optionKey.split('_')[1];
          console.log(`🚀 Launch ${mode} Mode here`);
          // Hook to sceneManager.startMode(mode);
        }
      });
    });

    optionButtons.appendChild(button);
  });

  if (options.length === 0) {
    const endButton = document.createElement('button');
    endButton.textContent = '🔙 Return to Menu';
    endButton.classList.add('option-btn');
    endButton.addEventListener('click', returnToMenu);
    optionButtons.appendChild(endButton);
  }
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
