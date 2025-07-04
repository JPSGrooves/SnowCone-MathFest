// 🍧 quickServeGame.js — Cosmic Game Logic 💀✨

import { appState } from '../../data/appState.js';
import * as gridFX from './quickServeGridFX.js';
import * as phil from './quickServePhil.js';
import { hookReturnButton } from '../../utils/returnToMenu.js';
import { showMenu } from '../../managers/sceneManager.js';
import { playCorrect, playIncorrect } from './soundFX.js';
import { playTrack, stopTrack } from '../../managers/musicManager.js';
import { stopQS, playQSRandomTrack } from './quickServeMusic.js';
import { renderGameUI } from './quickServe.js'; // 💥 Need to export this!

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

export function appendToAnswer(val) {
  currentAnswer += val;
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

  showResultMsg(true, 3);
  gridFX.bumpGridGlow();
  phil.bumpJam();
  playCorrect();

  checkBadgeUnlock();

  currentAnswer = '';
  updateAnswerDisplay();
  generateProblem();
}

function handleIncorrect() {
  showResultMsg(false, 0);
  gridFX.bumpGridGlow('bad');
  phil.triggerGlitch();
  playIncorrect();
}

function showResultMsg(isCorrect, xp = 0) {
  const resultMsg = document.getElementById('qsResultMsg');
  const xpMsg = document.getElementById('qsXPMsg');

  if (!resultMsg || !xpMsg) return;

  // 💚 Result feedback (right side)
  resultMsg.textContent = isCorrect ? '✅ Correct!' : '❌ Nope!';
  resultMsg.classList.remove('hidden');
  resultMsg.classList.toggle('error', !isCorrect);

  // 🍧 XP feedback (left side)
  xpMsg.textContent = `🍧 ${xp} XP`;
  xpMsg.classList.remove('hidden');
  xpMsg.classList.toggle('zero', xp === 0);
  xpMsg.style.color = isCorrect ? '#00ffee' : '#ff4444';
  xpMsg.style.textShadow = isCorrect
    ? '0 0 4px #00ffee88'
    : '0 0 4px #ff444488';

  setTimeout(() => {
    resultMsg.classList.add('hidden');
    xpMsg.classList.add('hidden');
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
    <p>XP Earned: ${score * 3}</p>
    <button id="playAgainBtn">🎧 Play Again</button>
    <button id="menuBtn">🔙 Menu</button>
  `;

  document.getElementById('game-container').appendChild(popup);

  document.getElementById('playAgainBtn')?.addEventListener('click', async () => {
    popup.remove();

    await stopQS();            // Fade out old song
    stopGameLogic();           // Stop game state
    renderGameUI();            // Rebuild full UI
    setTimeout(() => playQSRandomTrack(), 50);  // 🔥 Let DOM breathe, then start music
  });


  document.getElementById('menuBtn')?.addEventListener('click', () => {
    popup.remove();
    stopQS();         // 🔇💀 Kill the DJ properly
    stopTrack();      // 🪦 Belt + suspenders
    stopGameLogic();
    showMenu();
    });
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

// ✅ Keypad Helpers (export for keypad use)
// ✅ Keypad Helpers (export for keypad use)
export {
  toggleNegative,
  clearAnswer,
  submitAnswer
};