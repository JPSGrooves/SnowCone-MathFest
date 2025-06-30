// 🍧 quickServeGame.js — Cosmic Game Logic 💀✨

import { appState } from '../../data/appState.js';
import * as gridFX from './quickServeGridFX.js';
import * as phil from './quickServePhil.js';
import { hookReturnButton } from '../../utils/returnToMenu.js';
import { showMenu } from '../../managers/sceneManager.js';
import { playCorrect, playIncorrect } from './soundFX.js';
import { playTrack, stopTrack } from '../../managers/musicManager.js';

//////////////////////////////
// 🔥 Game State
//////////////////////////////
let score = 0;
let timeRemaining = 105;
let timerInterval = null;
let currentAnswer = '';
let gameRunning = false;

//////////////////////////////
// 🚀 Scene Lifecycle
//////////////////////////////
export function startGameLogic() {
  resetGameState();
  startGame();
}

export function stopGameLogic() {
  clearInterval(timerInterval);
  phil.resetPhil();
  gridFX.stopGridPulse();
  gameRunning = false;
}

export function resetCurrentAnswer() {
  currentAnswer = '';
  updateAnswerDisplay();
}

//////////////////////////////
// 🎮 Runtime Logic
//////////////////////////////
function resetGameState() {
  score = 0;
  timeRemaining = 105;
  currentAnswer = '';
  gameRunning = false;
}

function startGame() {
  gameRunning = true;
  updateScore();
  updateAnswerDisplay();
  startTimer();
  phil.startPhilPoseTimer();
  gridFX.startGridPulse();
  generateProblem();
}

function startTimer() {
  const timerDisplay = document.getElementById('qsTimer');
  if (!timerDisplay) return;

  timerDisplay.textContent = formatTime(timeRemaining);

  timerInterval = setInterval(() => {
    timeRemaining--;
    timerDisplay.textContent = formatTime(timeRemaining);

    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      endGame();
    }
  }, 1000);
}

function endGame() {
  gameRunning = false;
  clearInterval(timerInterval);
  phil.philCelebrate();
  gridFX.stopGridPulse();
  showResultScreen();
}

//////////////////////////////
// 🔢 Game Functions
//////////////////////////////
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function updateAnswerDisplay() {
  const display = document.getElementById('answerDisplay');
  if (display) display.textContent = currentAnswer === '' ? '0' : currentAnswer;
}

function updateScore() {
  const scoreDisplay = document.getElementById('qsScore');
  if (scoreDisplay) scoreDisplay.textContent = score;
}

function generateProblem() {
  const a = Math.floor(Math.random() * 20) + 1;
  const b = Math.floor(Math.random() * 20) + 1;
  const problemEl = document.getElementById('mathProblem');

  if (problemEl) {
    problemEl.textContent = `${a} + ${b} = ?`;
    problemEl.dataset.answer = (a + b).toString();
  }
}

function submitAnswer() {
  const problemEl = document.getElementById('mathProblem');
  if (!problemEl) return;

  const guess = parseInt(currentAnswer.trim(), 10);
  const correct = parseInt(problemEl.dataset.answer, 10);

  if (guess === correct) {
    handleCorrect();
  } else {
    handleIncorrect();
  }
}

function handleCorrect() {
  score++;
  updateScore();
  appState.addXP(3);

  showResultMsg('✅ Correct! +3 XP', '#00ffee');
  gridFX.bumpGridGlow();
  phil.bumpJam();
  playCorrect();

  checkBadgeUnlock();

  currentAnswer = '';
  updateAnswerDisplay();
  generateProblem();
}

function handleIncorrect() {
  showResultMsg('❌ Nope!', '#ff5555');
  gridFX.bumpGridGlow('bad');
  phil.triggerGlitch();
  playIncorrect();
}

function showResultMsg(text, color) {
  const resultMsg = document.getElementById('qsResultMsg');
  if (!resultMsg) return;
  resultMsg.textContent = text;
  resultMsg.style.color = color;

  setTimeout(() => {
    resultMsg.textContent = '';
  }, 1500);
}

function checkBadgeUnlock() {
  if (appState.profile.xp >= 100 && !appState.profile.badges.includes('cone_master')) {
    appState.unlockBadge('cone_master');
    console.log('🏅 Badge unlocked: cone_master');
  }
}

//////////////////////////////
// 🏆 Result Screen
//////////////////////////////
function showResultScreen() {
  const popup = document.createElement('div');
  popup.classList.add('result-popup');

  popup.innerHTML = `
    <h2>🍧 Show Complete!</h2>
    <p>Score: ${score}</p>
    <button id="playAgainBtn">🎧 Play Again</button>
    <button id="menuBtn">🔙 Menu</button>
  `;

  document.getElementById('game-container').appendChild(popup);

  document.getElementById('playAgainBtn')?.addEventListener('click', () => {
    popup.remove();
    stopTrack();
    stopGameLogic();
    startGameLogic();
    playTrack('main');
  });

  document.getElementById('menuBtn')?.addEventListener('click', () => {
    popup.remove();
    stopTrack();
    stopGameLogic();
    showMenu();
  });
}

//////////////////////////////
// 🎛️ Keypad Logic
//////////////////////////////
export function setupKeypad() {
  const keys = [
    { id: 'zero', val: '0' },
    { id: 'one', val: '1' },
    { id: 'two', val: '2' },
    { id: 'three', val: '3' },
    { id: 'four', val: '4' },
    { id: 'five', val: '5' },
    { id: 'six', val: '6' },
    { id: 'seven', val: '7' },
    { id: 'eight', val: '8' },
    { id: 'nine', val: '9' },
    { id: 'decimal', val: '.' }
  ];

  keys.forEach(({ id, val }) => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', () => {
        currentAnswer += val;
        updateAnswerDisplay();
      });
    }
  });

  document.getElementById('reset')?.addEventListener('click', () => {
    stopTrack();
    stopGameLogic();
    startGameLogic();
    playTrack('main');
  });

  document.getElementById('neg')?.addEventListener('click', toggleNegative);
  document.getElementById('clear')?.addEventListener('click', clearAnswer);
  document.getElementById('enter')?.addEventListener('click', submitAnswer);
  document.getElementById('algMode')?.addEventListener('click', () => {
    alert('🔢 Algebra Mode is under construction!');
  });

  hookReturnButton('menu');
}

function toggleNegative() {
  if (currentAnswer.startsWith('-')) {
    currentAnswer = currentAnswer.slice(1);
  } else {
    currentAnswer = '-' + currentAnswer;
  }
  updateAnswerDisplay();
}

function clearAnswer() {
  currentAnswer = '';
  updateAnswerDisplay();
}
