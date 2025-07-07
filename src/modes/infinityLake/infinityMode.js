// /src/modes/infinity/infinityMode.js

import './infinityMode.css';
import { swapModeBackground, applyBackgroundTheme } from '../../managers/backgroundManager.js';
import { playTransition } from '../../managers/transitionManager.js';
import { appState } from '../../data/appState.js';

let score = 0;
let currentCorrect = 0;

let problemEl, answerBtns, scoreDisplay, resultMsg;

export function loadInfinityMode() {
  console.log('♾️ Loading Infinity Mode');
  appState.setMode('infinity');

  const menuWrapper = document.querySelector('.menu-wrapper');
  const gameContainer = document.getElementById('game-container');

  menuWrapper?.classList.add('hidden');
  gameContainer.classList.remove('hidden');
  gameContainer.style.display = 'flex';

  renderUI();
  swapModeBackground('assets/img/modes/infinityLake/infinityBG.png');
  setupEventHandlers();
  startGame();
}


export function stopInfinityMode() {
  const container = document.getElementById('game-container');
  container.innerHTML = '';
  container.classList.add('hidden');
  container.style.display = 'none';

  cleanupEventHandlers();
  console.log('♾️ Infinity Mode cleaned up!');
}

function renderUI() {
  const container = document.getElementById('game-container');
  container.innerHTML = `
    <div class="aspect-wrap">
      <div class="game-frame">
        <img id="modeBackground" class="background-fill" src="${import.meta.env.BASE_URL}assets/img/modes/infinityLake/infinityBG.png"
          alt="Infinity Mode Background"
        />
        <div class="il-grid">
          <div class="il-title">♾️ Infinity Lake</div>

          <div class="il-stage">
            <div class="twins-box">👯‍♀️</div>
            <div class="score-box">Score: <span id="infScore">0</span></div>
          </div>

          <div class="il-math">
            <div id="mathProblem">-- + -- = ?</div>
            <div class="answer-options">
              <button class="ans-btn" data-choice="0">?</button>
              <button class="ans-btn" data-choice="1">?</button>
              <button class="ans-btn" data-choice="2">?</button>
            </div>
            <div id="coneResultMsg" class="result-msg"></div>
          </div>

          <div class="il-controls">
            <div class="mode-buttons">
              <button data-mode="add">+</button>
              <button data-mode="sub">−</button>
              <button data-mode="mul">×</button>
              <button data-mode="div">÷</button>
              <button data-mode="alg">𝒙</button>
            </div>
            <div class="utility-buttons">
              <button id="backToMenu">Main<br>Menu</button>
              <button id="resetGame">Reset</button>
              <button id="muteToggle">🔇</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  problemEl = document.getElementById('mathProblem');
  answerBtns = Array.from(document.querySelectorAll('.ans-btn'));
  scoreDisplay = document.getElementById('infScore');
  resultMsg = document.getElementById('coneResultMsg');
}

function setupEventHandlers() {
  document.getElementById('backToMenu')?.addEventListener('click', returnToMenu);
  document.getElementById('resetGame')?.addEventListener('click', startGame);
  answerBtns.forEach(btn => btn.addEventListener('click', () => handleAnswer(btn)));
}

function cleanupEventHandlers() {
  document.getElementById('backToMenu')?.removeEventListener('click', returnToMenu);
  document.getElementById('resetGame')?.removeEventListener('click', startGame);
  answerBtns.forEach(btn => btn.removeEventListener('click', handleAnswer));
}

function returnToMenu() {
  playTransition(() => {
    stopInfinityMode();
    document.querySelector('.menu-wrapper')?.classList.remove('hidden');
    applyBackgroundTheme();
  });
}

function startGame() {
  score = 0;
  updateScore();
  newProblem();
}

function newProblem() {
  const a = Math.floor(Math.random() * 20) + 1;
  const b = Math.floor(Math.random() * 20) + 1;
  const correctAnswer = a + b;
  currentCorrect = correctAnswer;

  // Generate fake options
  let options = [correctAnswer];
  while (options.length < 3) {
    let fake = correctAnswer + Math.floor(Math.random() * 11) - 5;
    if (!options.includes(fake) && fake >= 0) options.push(fake);
  }
  options.sort(() => Math.random() - 0.5);

  problemEl.textContent = `${a} + ${b} = ?`;
  answerBtns.forEach((btn, i) => {
    btn.textContent = options[i];
    btn.dataset.value = options[i];
  });
}

function handleAnswer(btn) {
  const guess = parseInt(btn.dataset.value);
  if (guess === currentCorrect) {
    handleCorrect();
  } else {
    handleIncorrect();
  }
}

function handleCorrect() {
  score++;
  appState.addXP(5);
  showResult('✅ Correct! +5 XP', '#00ffee');
  updateScore();
  newProblem();
}

function handleIncorrect() {
  showResult('❌ Nope. Try again!', '#ff5555');
}

function updateScore() {
  scoreDisplay.textContent = score;
}

function showResult(msg, color) {
  resultMsg.textContent = msg;
  resultMsg.style.color = color;
  setTimeout(() => resultMsg.textContent = '', 1500);
}
