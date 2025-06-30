import './infinityMode.css';
import { swapModeBackground, applyBackgroundTheme } from '../../managers/backgroundManager.js';
import { playTransition } from '../../managers/transitionManager.js';
import { appState } from '../../data/appState.js';

// === 🔥 Game State ===
let score = 0;
let currentAnswer = '';
let currentCorrect = 0;

// === 🔗 DOM Refs
let problemEl, inputEl, submitBtn, scoreDisplay, resultMsg;

// === 🚀 ENTRY POINT
export function loadInfinityMode() {
  console.log('♾️ Loading Infinity Mode');
  appState.setMode('infinity');

  swapModeBackground('infinity');

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
export function stopInfinityMode() {
  const container = document.getElementById('game-container');
  container.innerHTML = '';
  container.classList.add('hidden');
  container.style.display = 'none';

  cleanupEventHandlers();
  console.log('♾️ Infinity Mode cleaned up!');
}

//////////////////////////////
// 🎨 Render UI
//////////////////////////////
function renderUI() {
  const container = document.getElementById('game-container');

  container.innerHTML = `
    <div class="game-frame">
      <img id="modeBackground" class="background-fill" src="assets/img/modes/infinity/infinityBG.png" alt="Infinity Mode Background" />
      <div class="infinity-grid">
        <div class="infinity-header">
          <h1>♾️ Infinity Lake</h1>
        </div>
        <div class="infinity-content">
          <div class="score-box">
            <span>Score:</span> <span id="infScore">0</span>
          </div>

          <div class="math-stack">
            <span id="mathProblem">-- + -- = ?</span>
            <input id="mathInput" type="number" placeholder="Answer..." />
            <button id="submitAnswer">✔️ Submit</button>
          </div>

          <div class="cone-status">
            <span id="coneResultMsg"></span>
          </div>
        </div>

        <div class="infinity-footer">
          <button id="returnToMenu" class="btn-return">🔙 Return to Menu</button>
        </div>
      </div>
    </div>
  `;

  repaintBackground();

  // 🎯 DOM refs
  problemEl = document.getElementById('mathProblem');
  inputEl = document.getElementById('mathInput');
  submitBtn = document.getElementById('submitAnswer');
  scoreDisplay = document.getElementById('infScore');
  resultMsg = document.getElementById('coneResultMsg');
}

//////////////////////////////
// 🚦 Event Handlers
//////////////////////////////
function setupEventHandlers() {
  document.getElementById('returnToMenu')?.addEventListener('click', returnToMenu);
  submitBtn?.addEventListener('click', submitAnswer);
  inputEl?.addEventListener('keydown', onInputKeydown);
}

function cleanupEventHandlers() {
  document.getElementById('returnToMenu')?.removeEventListener('click', returnToMenu);
  submitBtn?.removeEventListener('click', submitAnswer);
  inputEl?.removeEventListener('keydown', onInputKeydown);
}

function onInputKeydown(e) {
  if (e.key === 'Enter') submitAnswer();
}

//////////////////////////////
// 🔙 Return Flow
//////////////////////////////
function returnToMenu() {
  playTransition(() => {
    stopInfinityMode();
    document.querySelector('.menu-wrapper')?.classList.remove('hidden');
    applyBackgroundTheme();
  });
}

//////////////////////////////
// 🎮 Game Logic
//////////////////////////////
function startGame() {
  score = 0;
  currentAnswer = '';
  currentCorrect = 0;

  updateScore();
  newProblem();
}

function newProblem() {
  const a = Math.floor(Math.random() * 100) + 1;
  const b = Math.floor(Math.random() * 100) + 1;
  currentCorrect = a + b;

  problemEl.textContent = `${a} + ${b} = ?`;
  inputEl.value = '';
  inputEl.focus();
}

function submitAnswer() {
  const guess = parseInt(inputEl.value.trim(), 10);

  if (guess === currentCorrect) {
    handleCorrect();
  } else {
    handleIncorrect();
  }
}

function handleCorrect() {
  score += 1;
  appState.addXP(5);

  showResult('✅ Correct! +5 XP', '#00ffee');
  updateScore();
  newProblem();
}

function handleIncorrect() {
  showResult('❌ Nope. Try again!', '#ff5555');
}

function showResult(msg, color) {
  resultMsg.textContent = msg;
  resultMsg.style.color = color;
  setTimeout(() => resultMsg.textContent = '', 1500);
}

function updateScore() {
  scoreDisplay.textContent = score;
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
