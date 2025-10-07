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
import { generateProblem } from '../../logic/mathBrain.js';
import { launchConfetti } from '../../utils/confetti.js';
import { maybeAwardQuickServeBadges, finalizeQuickServeRun } from './quickServeBadges.js';
import { awardBadge } from '../../managers/badgeManager.js';




//////////////////////////////
// 🔥 Game State
//////////////////////////////
let score = 0;
let timeRemaining = 105;
let timerInterval = null;
let currentAnswer = '';
let gameRunning = false;

// 🌈 NEW STUFF
let currentMathMode = 'addSub';
let currentCorrectAnswer = 0;
let currentXP = 3;
let currentPoints = 1;
let totalSessionXP = 0;

//////////////////////////////
// 🚀 Scene Lifecycle
//////////////////////////////

export { endGame as endQuickServeGame };

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
  setCurrentAnswer(''); // ✨ keep inputManager harmony
}

export function appendToAnswer(val) {
  currentAnswer += val;
  updateAnswerDisplay();
}

export function setMathMode(mode) {
  currentMathMode = mode;

  // 🎯 Set XP and point rewards based on mode
  switch (mode) {
    case 'addSub':
      currentXP = 3;
      currentPoints = 1;
      break;
    case 'multiDiv':
      currentXP = 5;
      currentPoints = 3;
      break;
    case 'algebra':
      currentXP = 8;
      currentPoints = 5;
      break;
    default:
      currentXP = 3;
      currentPoints = 1;
      break;
  }

  resetCurrentAnswer();
  renderProblem();
  highlightModeButton(mode);

  console.log(`🌈 Mode set to: ${mode}`);
}


export function setCurrentAnswer(val) {
  currentAnswer = val;
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
  highlightModeButton(currentMathMode); // 🌟 Apply glow to current mode
  gameRunning = true;
  updateScore();
  updateAnswerDisplay();
  startTimer();
  phil.startPhilPoseTimer();
  gridFX.startGridPulse();

  renderProblem();
}
function highlightModeButton(mode) {
  const map = {
    addSub: 'plusMinus',
    multiDiv: 'multiplyDivide',
    algebra: 'algMode'
  };

  const activeId = map[mode];
  document.querySelectorAll('.btn-mode').forEach(btn => {
    btn.classList.toggle('active-mode', btn.id === activeId);
  });
}


function modeToButtonId(mode) {
  switch (mode) {
    case 'addSub': return 'plusMinus';
    case 'multiDiv': return 'multiplyDivide';
    case 'algebra': return 'algMode';
    default: return '';
  }
}

function startTimer() {
  const timerDisplay = document.getElementById('qsTimer');
  if (!timerDisplay) return;

  timerDisplay.textContent = formatTime(timeRemaining);

  timerInterval = setInterval(() => {
    timeRemaining--;
    timerDisplay.textContent = formatTime(timeRemaining);

    if (timeRemaining <= 0) {
      finalizeQuickServeRun(score);
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

  // ✅ finalizeQuickServeRun(score) already ran in the timer branch.
  // that function updates XP, badges, and high score.
  // just render the results UI off of the now-updated appState.
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



function submitAnswer() {
  const problemEl = document.getElementById('mathProblem');
  if (!problemEl) return;

  const correct = parseInt(problemEl.dataset.answer, 10);

  // 🧠 Treat empty answer as "0" ONLY if correct answer is zero
  const guessStr = currentAnswer.trim() === '' && correct === 0
    ? '0'
    : currentAnswer.trim();

  const guess = parseInt(guessStr, 10);

  if (guess === correct) {
    handleCorrect();
  } else {
    handleIncorrect();
  }
}


function handleCorrect() {
  // 🎯 score exactly by mode points (no double bump)
  score += currentPoints;
  updateScore();

  // 🏅 award QS milestone badges at live score
  maybeAwardQuickServeBadges(score);

  // 🍧 XP: trust the configured mode XP; don't assume addXP returns a delta
  appState.addXP(currentXP);
  totalSessionXP += currentXP;

  // ✨ feedback + juice
  showResultMsg(true, currentXP);
  gridFX.bumpGridGlow();
  phil.bumpJam();
  playCorrect();

  // (optional) keep your global XP-based cone badge
  checkBadgeUnlock();

  // 🔁 next problem
  currentAnswer = '';
  updateAnswerDisplay();
  renderProblem();
}




function handleIncorrect() {
  showResultMsg(false, 0);
  gridFX.bumpGridGlow('bad');
  phil.triggerGlitch();
  playIncorrect();

  // 💀 RESET answer display to '0' after wrong guess
  currentAnswer = '';
  updateAnswerDisplay();
}


function renderProblem() {
  const { equation, answer, xp = 3, points = 1 } = generateProblem(currentMathMode);
  currentCorrectAnswer = answer;
  currentXP = xp;
  currentPoints = points;

  const problemEl = document.getElementById('mathProblem');
  if (problemEl) {
    problemEl.textContent = `${equation} = ?`;
    problemEl.dataset.answer = answer.toString();
  }
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
  const xp = Number(appState.profile?.xp) || 0;
  const has = (appState.profile?.badges || []).includes('cone_master');
  if (xp >= 100 && !has) {
    awardBadge('cone_master');
  }
}


//////////////////////////////
// 🏆 Result Screen
//////////////////////////////
// ——— replace showResultScreen() ———
function showResultScreen() {
  const container = document.getElementById('game-container');
  if (!container) {
    console.warn('⚠️ No game-container found for result popup.');
    return;
  }

  // pull final state after finalizeQuickServeRun
  const isNewHighScore = score > (appState.profile.qsHighScore ?? 0);
  if (isNewHighScore) launchConfetti();

  const popup = document.createElement('div');
  popup.classList.add('result-popup');
  popup.id = 'qsResultPopup'; // 👈 lets CSS target QS popup specifically
  popup.innerHTML = buildResultHTML(isNewHighScore);

  container.appendChild(popup);

  // 🔘 compact button ids (IL-style)
  const playAgainBtn = popup.querySelector('#qsPlayAgainBtn');
  const backBtn      = popup.querySelector('#qsBackBtn');

  playAgainBtn?.addEventListener('click', handlePlayAgain);
  backBtn?.addEventListener('click', handleReturnToMenu);

  playAgainBtn?.focus();
}

// ——— replace buildResultHTML() ———
function buildResultHTML(isNewHighScore) {
  const highScore = appState.profile.qsHighScore ?? 0;
  const highScoreMsg = isNewHighScore
    ? `<p class="new-highscore-msg">🎉 New High Score!</p>`
    : '';

  return `
    <h2>🍧 Show Complete!</h2>
    <p>Score: ${score}</p>
    ${highScoreMsg}
    <p>High Score: ${highScore}</p>
    <p>XP Earned: ${totalSessionXP}</p>

    <!-- 🔘 wrap in a row like IL -->
    <div class="qs-result-buttons">
      <button id="qsBackBtn" class="back-to-menu-btn">🔙 Back to Menu</button>
      <button id="qsPlayAgainBtn" class="play-again-btn">🔁 Play Again</button>
    </div>
  `;
}


async function handlePlayAgain() {
  document.querySelector('.result-popup')?.remove();
  await stopQS();
  stopGameLogic();
  renderGameUI();
  setTimeout(() => playQSRandomTrack(), 50);
}

function handleReturnToMenu() {
  document.querySelector('.result-popup')?.remove();
  stopQS();
  stopTrack();
  stopGameLogic();
  showMenu();
}

function toggleNegative() {
  currentAnswer = currentAnswer.startsWith('-')
    ? currentAnswer.slice(1)
    : '-' + currentAnswer;
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