// 🍧 quickServeGame.js — Cosmic Game Logic 💀✨

import { appState } from '../../data/appState.js';
import * as gridFX from './quickServeGridFX.js';
import * as phil from './quickServePhil.js';
import { hookReturnButton } from '../../utils/returnToMenu.js';
import { showMenu } from '../../managers/sceneManager.js';
import {
  playCorrectSfx,
  playIncorrectSfx,
} from '../../managers/sfxManager.js';
import {
  renderGameUI,
  showQuickServeResults,
  getQuickServeSelectedCharacterScoreBonus,
  getQuickServeSelectedCharacterSummary,
  recordQuickServeSelectedCharacterScore,
} from './quickServe.js';
import { generateProblem } from '../../logic/mathBrain.js';
import { launchConfetti } from '../../utils/confetti.js';
import { maybeAwardQuickServeBadges, finalizeQuickServeRun, resetQuickServeRunMilestones } from './quickServeBadges.js';
import { awardBadge } from '../../managers/badgeManager.js';
import { hapticError } from '../../utils/haptics.js';



//////////////////////////////
// 🔥 Game State
//////////////////////////////
let score = 0;
  updateQuickServeStageEnergy(0);
let timeRemaining = 105;
let timerInterval = null;
let currentAnswer = '';
let gameRunning = false;

// 🌈 NEW STUFF
let currentMathMode = 'addSub';
let currentMathDifficulty = 'easy';
let currentCorrectAnswer = 0;
let currentXP = 3;
let currentPoints = 1;
let totalSessionXP = 0;

// 📊 Session stats for the result overlay
let totalServed = 0;
let totalMissed = 0;
let easyMisses = 0;
let mediumMisses = 0;
let hardMisses = 0;

// 🧮 Last missed problem (for Phil’s specific hint)
let lastMissedEquation = null;
let lastMissedAnswer = null;
let lastMissedMode = null;

// 🧠 meta for the current problem & last missed one
let currentProblemMeta = null;
let lastMissedMeta = null;

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

export function setMathMode(mode, difficulty = currentMathDifficulty) {
  currentMathMode = normalizeQuickServeMathMode(mode);
  currentMathDifficulty = normalizeQuickServeMathDifficulty(difficulty);

  const reward = getModeDifficultyRewards(currentMathMode, currentMathDifficulty);
  currentXP = reward.xp;
  currentPoints = reward.points;

  resetCurrentAnswer();
  renderProblem();
  highlightDifficultyButton(currentMathDifficulty);

  console.log(`🌈 Mode set to: ${currentMathMode}/${currentMathDifficulty}`);
}

export function setMathDifficulty(difficulty = currentMathDifficulty) {
  currentMathDifficulty = normalizeQuickServeMathDifficulty(difficulty);

  const reward = getModeDifficultyRewards(currentMathMode, currentMathDifficulty);
  currentXP = reward.xp;
  currentPoints = reward.points;

  resetCurrentAnswer();
  renderProblem();
  highlightDifficultyButton(currentMathDifficulty);

  console.log(`🌶️ Difficulty set to: ${currentMathMode}/${currentMathDifficulty}`);
}

export function setCurrentAnswer(val) {
  currentAnswer = val;
}


/* ───────────────── QuickServe Stage Energy Helpers START ─────────────────
   Visual-only bridge:
   - CSS reads data-qs-energy on .qs-grid.
   - Score makes the stage gradually glow harder.
   - Correct/wrong reactions are brief class pulses.
   ──────────────────────────────────────────────────────────────────────── */
function getQuickServeStageEnergy(scoreValue = score) {
  const n = Math.max(0, Number(scoreValue) || 0);

  if (n >= 75) return 5;
  if (n >= 50) return 4;
  if (n >= 25) return 3;
  if (n >= 10) return 2;
  if (n > 0) return 1;

  return 0;
}

function updateQuickServeStageEnergy(scoreValue = score) {
  const gridEl = document.querySelector('.qs-grid');
  if (!gridEl) return;

  const level = String(getQuickServeStageEnergy(scoreValue));
  gridEl.dataset.qsEnergy = level;
  document.body?.setAttribute('data-qs-energy', level);
}

function triggerQuickServeStageReaction(type = 'good') {
  const gridEl = document.querySelector('.qs-grid');
  if (!gridEl) return;

  const className = type === 'bad'
    ? 'qs-stage-react-bad'
    : 'qs-stage-react-good';

  gridEl.classList.remove('qs-stage-react-good', 'qs-stage-react-bad');
  void gridEl.offsetWidth;
  gridEl.classList.add(className);

  window.setTimeout(() => {
    gridEl?.classList.remove(className);
  }, type === 'bad' ? 360 : 420);
}
/* ───────────────── QuickServe Stage Energy Helpers END ───────────────── */

//////////////////////////////
// 🎮 Runtime Logic
//////////////////////////////
function resetGameState() {
  score = 0;
  timeRemaining = 105;
  currentAnswer = '';
  gameRunning = false;

  // 🍧 per-run XP tally
  totalSessionXP = 0;

  // 📊 per-run stats for the result popup
  totalServed = 0;
  totalMissed = 0;
  easyMisses = 0;
  mediumMisses = 0;
  hardMisses = 0;

  // 🧮 clear last-miss memory
  lastMissedEquation = null;
  lastMissedAnswer = null;
  lastMissedMode = null;
  lastMissedMeta = null;

  // 🧠 clear current meta
  currentProblemMeta = null;

  // 🌟 Reset QS milestone haptics for this shift
  resetQuickServeRunMilestones();
}

function startGame() {
  highlightDifficultyButton(currentMathDifficulty); // 🌟 Apply glow to current mode
  gameRunning = true;
  updateScore();
  updateAnswerDisplay();
  startTimer();
  phil.startPhilPoseTimer();
  gridFX.startGridPulse();

  renderProblem();
}

function highlightDifficultyButton(difficulty = currentMathDifficulty) {
  const map = {
    easy: 'plusMinus',
    medium: 'multiplyDivide',
    hard: 'algMode',
  };

  const activeId = map[normalizeQuickServeMathDifficulty(difficulty)] || 'plusMinus';

  document.querySelectorAll('.btn-mode').forEach((btn) => {
    // Mute is also styled as btn-mode, but it is not a difficulty selector.
    if (btn.id === 'muteBtn') {
      btn.classList.remove('active-mode');
      return;
    }

    btn.classList.toggle('active-mode', btn.id === activeId);
  });
}

// Legacy shim: old calls now mean "refresh current difficulty highlight."
function highlightModeButton(mode) {
  highlightDifficultyButton(currentMathDifficulty);
}

function modeToButtonId(modeOrDifficulty) {
  const map = {
    easy: 'plusMinus',
    medium: 'multiplyDivide',
    hard: 'algMode',

    // Legacy math-mode fallbacks.
    addSub: 'plusMinus',
    multiDiv: 'multiplyDivide',
    algebra: 'algMode',
    mixed: 'algMode',
  };

  return map[modeOrDifficulty] || '';
}


function normalizeQuickServeMathMode(mode = 'addSub') {
  const raw = String(mode || '').trim();

  const aliases = {
    algebra: 'mixed',
    mixedReview: 'mixed',
    decimal: 'decimals',
    fraction: 'fractions',
  };

  const normalized = aliases[raw] || raw;

  return ['addSub', 'multiDiv', 'decimals', 'fractions', 'mixed'].includes(normalized)
    ? normalized
    : 'addSub';
}

function normalizeQuickServeMathDifficulty(difficulty = 'easy') {
  const raw = String(difficulty || '').trim();

  const aliases = {
    med: 'medium',
    normal: 'medium',
  };

  const normalized = aliases[raw] || raw;

  return ['easy', 'medium', 'hard'].includes(normalized)
    ? normalized
    : 'easy';
}

function getModeDifficultyRewards(mode = 'addSub', difficulty = 'easy') {
  const safeMode = normalizeQuickServeMathMode(mode);
  const safeDifficulty = normalizeQuickServeMathDifficulty(difficulty);

  const table = {
    addSub: {
      easy:   { xp: 3, points: 1 },
      medium: { xp: 4, points: 2 },
      hard:   { xp: 5, points: 3 },
    },
    multiDiv: {
      easy:   { xp: 5, points: 3 },
      medium: { xp: 6, points: 4 },
      hard:   { xp: 7, points: 5 },
    },
    decimals: {
      easy:   { xp: 5, points: 3 },
      medium: { xp: 7, points: 5 },
      hard:   { xp: 9, points: 7 },
    },
    fractions: {
      easy:   { xp: 5, points: 3 },
      medium: { xp: 7, points: 5 },
      hard:   { xp: 9, points: 7 },
    },
    mixed: {
      easy:   { xp: 6, points: 4 },
      medium: { xp: 8, points: 6 },
      hard:   { xp: 10, points: 8 },
    },
  };

  return table[safeMode]?.[safeDifficulty] || table.addSub.easy;
}

function startTimer() {
  const timerDisplay = document.getElementById('qsTimer');
  if (!timerDisplay) return;

  timerDisplay.textContent = formatTime(timeRemaining);

  timerInterval = setInterval(() => {
    timeRemaining--;
    timerDisplay.textContent = formatTime(timeRemaining);

    if (timeRemaining <= 0) {
      // 🎯 snapshot the old high score BEFORE finalize mutates it
      const prevHigh = appState.profile?.qsHighScore ?? 0;

      finalizeQuickServeRun(score);

      const didBeatHigh = score > prevHigh;

      clearInterval(timerInterval);
      endGame(didBeatHigh);
    }
  }, 1000);
}

function endGame(didBeatHighScore = false) {
  gameRunning = false;
  clearInterval(timerInterval);
  phil.philCelebrate();
  gridFX.stopGridPulse();

  // 🌟 New: detect a "perfect shift"
  const perfectRun = totalServed > 0 && totalMissed === 0;

  // 🎸 Track selected-character high score separately from the existing
  // global QuickServe/Game Center high score lane.
  const selectedCharacter = getQuickServeSelectedCharacterSummary();
  const characterResult = recordQuickServeSelectedCharacterScore(score);

  // 🎉 Confetti if high score OR perfect run
  if (didBeatHighScore || perfectRun) {
    launchConfetti();
  }

  // 🧠 hand stats + last missed (with meta) to the Phil overlay in quickServe.js
  showQuickServeResults({
    score,
    served:       totalServed,
    missed:       totalMissed,
    easyMisses,
    mediumMisses,
    hardMisses,
    lastMissed: lastMissedEquation && lastMissedAnswer != null
      ? {
          eq:     lastMissedEquation,     // "7 × 8"
          answer: lastMissedAnswer,       // 56
          mode:   lastMissedMode,         // 'multiDiv', etc.
          meta:   lastMissedMeta || null, // full step info from mathBrain (if any)
        }
      : null,
    // 🌟 pass this through for the popup to show a little line
    perfectRun,

    // 🎸 Character-result metadata for the QS results rebuild.
    character: selectedCharacter,
    characterHighScore: characterResult.bestScore,
    didBeatCharacterHighScore: characterResult.didBeatCharacterHighScore,
  });
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

  const correct = Number(problemEl.dataset.answer);

  // 🧠 Treat empty answer as "0" ONLY if correct answer is zero.
  const guessStr = currentAnswer.trim() === '' && correct === 0
    ? '0'
    : currentAnswer.trim();

  const guess = Number(guessStr);
  const isCorrect =
    Number.isFinite(guess)
    && Number.isFinite(correct)
    && Math.abs(guess - correct) < 0.001;

  if (isCorrect) {
    handleCorrect();
  } else {
    handleIncorrect();
  }
}

function handleCorrect() {
  triggerQuickServeStageReaction('good');
  // 📊 one more cone successfully served
  totalServed++;

  // 🎯 Score by mode points plus the selected character's unlock boost.
  // This makes unlockable performers actually matter without touching
  // Game Center IDs, badge IDs, the timer, keypad, or math generation.
  const characterBonus = getQuickServeSelectedCharacterScoreBonus();
  const earnedPoints = currentPoints + characterBonus;

  score += earnedPoints;
  updateQuickServeStageEnergy(score);
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
  playCorrectSfx();

  // (optional) keep your global XP-based cone badge
  checkBadgeUnlock();

  // 🔁 next problem
  currentAnswer = '';
  updateAnswerDisplay();
  renderProblem();
}

function handleIncorrect() {
  triggerQuickServeStageReaction('bad');
  // 📊 track a miss + which lane it came from
  totalMissed++;

  switch (currentMathDifficulty) {
    case 'easy':
      easyMisses++;
      break;
    case 'medium':
      mediumMisses++;
      break;
    case 'hard':
      hardMisses++;
      break;
  }

  // 🧮 remember the last missed equation + correct answer + meta
  const problemEl = document.getElementById('mathProblem');
  if (problemEl) {
    // renderProblem() formats like "7 × 8 = ?"
    const rawText = problemEl.textContent || '';
    lastMissedEquation = rawText.replace('= ?', '').trim(); // "7 × 8"
  } else {
    lastMissedEquation = null;
  }
  lastMissedAnswer = currentCorrectAnswer;
  lastMissedMode = currentMathMode;
  lastMissedMeta = currentProblemMeta || null;

  showResultMsg(false, 0);
  gridFX.bumpGridGlow('bad');
  phil.triggerGlitch();
  playIncorrectSfx();

  // 📳 Wrong-answer haptic
  try {
    hapticError();
  } catch (err) {
    console.warn('[QuickServe] hapticError failed', err);
  }

  // 💀 RESET answer display to '0' after wrong guess
  currentAnswer = '';
  updateAnswerDisplay();
}

function renderProblem() {
  const {
    equation,
    answer,
    xp = 3,
    points = 1,
    meta = null,
  } = generateProblem(currentMathMode, currentMathDifficulty);

  currentCorrectAnswer = Number(answer);
  currentXP = xp;
  currentPoints = points;
  currentProblemMeta = meta;

  const problemEl = document.getElementById('mathProblem');
  if (problemEl) {
    problemEl.textContent = `${equation} = ?`;
    problemEl.dataset.answer = String(answer);
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

  // Badge temporarily disabled:
  // if (xp >= 100 && !has) {
  //   awardBadge('cone_master');
  // }
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
export {
  toggleNegative,
  clearAnswer,
  submitAnswer
};
