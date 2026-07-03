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
  setQuickServeModeFromInGameMathMode,
  setQuickServeDifficultyFromInGameDifficulty,
} from './quickServe.js';
import { generateProblem } from '../../logic/mathBrain.js';
import { launchConfetti } from '../../utils/confetti.js';
import { maybeAwardQuickServeBadges, finalizeQuickServeRun, resetQuickServeRunMilestones } from './quickServeBadges.js';
import { awardBadge } from '../../managers/badgeManager.js';
import { hapticSuccess, hapticError } from '../../utils/haptics.js';



//////////////////////////////
// 🔥 Game State
//////////////////////////////
const QS_SHIFT_SECONDS = 105;

let score = 0;
let timeRemaining = QS_SHIFT_SECONDS;
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
  clearQuickServeAutoSubmitTimer();
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


/* ───────────────── QuickServe Auto Submit Parser START ─────────────────
   Purpose:
   - Correct answers auto-submit.
   - Clear button becomes the wrong-answer lane when input is wrong.
   - 1/2 parses as 0.5.
   - 25% parses as 25.
   - Empty answer state remains empty/?; 0 is a real answer.
   ─────────────────────────────────────────────────────────────────────── */
let qsAutoSubmitTimer = null;
const QS_AUTO_SUBMIT_DELAY_MS = 65;

function clearQuickServeAutoSubmitTimer() {
  if (qsAutoSubmitTimer) {
    window.clearTimeout(qsAutoSubmitTimer);
    qsAutoSubmitTimer = null;
  }
}

function parseQuickServeAnswer(rawValue) {
  const raw = String(rawValue ?? '').trim();

  if (!raw || raw === '-' || raw === '.' || raw === '-.' || raw === '/' || raw === '%') {
    return Number.NaN;
  }

  if (raw.endsWith('%')) {
    const percentNumber = Number(raw.slice(0, -1));
    return Number.isFinite(percentNumber) ? percentNumber : Number.NaN;
  }

  if (raw.includes('/')) {
    const parts = raw.split('/');
    if (parts.length !== 2) return Number.NaN;

    const numerator = Number(parts[0]);
    const denominator = Number(parts[1]);

    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
      return Number.NaN;
    }

    return numerator / denominator;
  }

  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : Number.NaN;
}

function quickServeAnswersMatch(playerRaw, correctRaw) {
  const guess = parseQuickServeAnswer(playerRaw);
  const correct = Number(correctRaw);

  if (!Number.isFinite(guess) || !Number.isFinite(correct)) {
    return false;
  }

  return Math.abs(guess - correct) < 0.001;
}

function isCurrentQuickServeAnswerCorrect() {
  return quickServeAnswersMatch(currentAnswer, currentCorrectAnswer);
}

function maybeAutoSubmitQuickServeAnswer() {
  if (!gameRunning) return;
  if (!String(currentAnswer || '').trim()) return;
  if (!isCurrentQuickServeAnswerCorrect()) return;

  clearQuickServeAutoSubmitTimer();

  qsAutoSubmitTimer = window.setTimeout(() => {
    qsAutoSubmitTimer = null;

    if (!gameRunning) return;
    if (!isCurrentQuickServeAnswerCorrect()) return;

    submitAnswer();
  }, QS_AUTO_SUBMIT_DELAY_MS);
}

function normalizeQuickServeAnswerInput(current, val) {
  const existing = String(current ?? '');
  const next = String(val ?? '');

  if (!next) return existing;

  if (/^\d$/.test(next)) {
    if (existing === '0') return next;
    return existing + next;
  }

  if (next === '.') {
    if (existing.includes('%')) return existing;

    const activePart = existing.includes('/')
      ? existing.split('/').pop()
      : existing;

    if (activePart.includes('.')) return existing;

    return existing ? existing + '.' : '0.';
  }

  if (next === '/') {
    if (!existing || existing.includes('/') || existing.includes('%')) return existing;
    if (existing === '-' || existing.endsWith('.')) return existing;
    return existing + '/';
  }

  if (next === '%') {
    if (!existing || existing.includes('%') || existing.includes('/')) return existing;
    if (existing === '-' || existing.endsWith('.')) return existing;
    return existing + '%';
  }

  return existing;
}
/* ───────────────── QuickServe Auto Submit Parser END ───────────────── */

export function appendToAnswer(val) {
  currentAnswer = normalizeQuickServeAnswerInput(currentAnswer, val);
  updateAnswerDisplay();
  setCurrentAnswer(currentAnswer);
  maybeAutoSubmitQuickServeAnswer();
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

  // Keep the intro/preflight honest when the player changes lanes in-game.
  setQuickServeModeFromInGameMathMode(currentMathMode);
  setQuickServeDifficultyFromInGameDifficulty(currentMathDifficulty);

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

  // Keep the intro/preflight honest when the player changes difficulty in-game.
  setQuickServeDifficultyFromInGameDifficulty(currentMathDifficulty);

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
  const n = Math.max(0, Number(scoreValue) || 0);

  if (typeof gridFX.setGridScore === 'function') {
    gridFX.setGridScore(n);
  }

  const gridEl = document.querySelector('.qs-grid');
  if (!gridEl) return;

  const level = String(getQuickServeStageEnergy(n));
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
  timeRemaining = QS_SHIFT_SECONDS;
  currentAnswer = '';
  gameRunning = false;
  updateQuickServeStageEnergy(0);
  updateQuickServeTimerProgress();

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

    decimal: 'decimalMoney',
    decimals: 'decimalMoney',
    decimalsPercentsMoney: 'decimalMoney',

    percent: 'percents',
    percentage: 'percents',

    fraction: 'fractions',
  };

  const normalized = aliases[raw] || raw;

  return ['addSub', 'multiDiv', 'decimalMoney', 'percents', 'fractions', 'mixed'].includes(normalized)
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
    decimalMoney: {
      easy:   { xp: 5, points: 3 },
      medium: { xp: 7, points: 5 },
      hard:   { xp: 9, points: 7 },
    },
    percents: {
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



function updateQuickServeTimerProgress() {
  const mathEl = document.querySelector('.qs-math');
  if (!mathEl) return;

  const total = Math.max(1, QS_SHIFT_SECONDS);
  const remaining = Math.max(0, Math.min(total, Number(timeRemaining) || 0));
  const pct = Math.max(0, Math.min(100, (remaining / total) * 100));
  const scale = Math.max(0, Math.min(1, pct / 100));
  const timePressureActive = remaining > 0 && remaining <= 10;

  mathEl.style.setProperty('--qs-shift-progress', `${pct.toFixed(2)}%`);
  mathEl.style.setProperty('--qs-shift-progress-scale', scale.toFixed(4));
  mathEl.dataset.qsShiftProgress = String(Math.round(pct));
  mathEl.classList.toggle('qs-time-pressure', timePressureActive);

  const gridEl = document.querySelector('.qs-grid');
  gridEl?.classList.toggle('qs-time-pressure', timePressureActive);

  const timerBoxEl = document.querySelector('.qs-stage .timer-box');
  timerBoxEl?.classList.toggle('qs-time-pressure', timePressureActive);

  document.body?.classList.toggle('qs-time-pressure', timePressureActive);
}

function startTimer() {
  const timerDisplay = document.getElementById('qsTimer');
  if (!timerDisplay) return;

  timerDisplay.textContent = formatTime(timeRemaining);
  updateQuickServeTimerProgress();

  timerInterval = setInterval(() => {
    timeRemaining--;
    timerDisplay.textContent = formatTime(timeRemaining);
    updateQuickServeTimerProgress();

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

    // 🎛️ Mode/result metadata for concise result nudges.
    modeId: currentMathMode,
    difficulty: currentMathDifficulty,
    modeResult: characterResult.modeResult || null,
    modePreviousBest: Number(characterResult.modePreviousBest || 0),
    modeBestScore: Number(characterResult.modeBestScore || score),
    didBeatModeHighScore: Boolean(characterResult.didBeatModeHighScore),

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
  if (!display) return;

  const hasInput = String(currentAnswer || '').trim().length > 0;

  display.textContent = hasInput ? currentAnswer : '?';
  display.classList.toggle('is-empty', !hasInput);
}


function updateScore() {
  const scoreDisplay = document.getElementById('qsScore');
  if (scoreDisplay) scoreDisplay.textContent = score;
}

function submitAnswer() {
  if (!gameRunning) return;

  clearQuickServeAutoSubmitTimer();

  if (quickServeAnswersMatch(currentAnswer, currentCorrectAnswer)) {
    handleCorrect();
    return;
  }

  handleIncorrect();
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
  spawnQuickServeCorrectToast(currentXP);
  gridFX.bumpGridGlow();
  phil.bumpJam();
  playCorrectSfx();

  // 📳 Correct-answer haptic.
  // On iPad / no-haptic devices this should safely no-op through Capacitor/native.
  try {
    hapticSuccess();
  } catch (err) {
    console.warn('[QuickServe] hapticSuccess failed', err);
  }

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


function almostEqualQuickServeNumber(a, b, tolerance = 0.001) {
  return Math.abs(Number(a) - Number(b)) < tolerance;
}

function clarifyQuickServeFractionOfPrompt(rawPrompt = '', answer = currentCorrectAnswer) {
  const prompt = String(rawPrompt || '').trim();

  // Example ambiguity:
  // "1/4 of 28 - 3"
  //
  // Players can read this as:
  //   1/4 of (28 - 3)
  //
  // But the generator may mean:
  //   (1/4 of 28) - 3
  //
  // We display parentheses based on the actual stored answer so the UI
  // tells one clean truth.
  const match = prompt.match(
    /^(\d+)\s*\/\s*(\d+)\s+of\s+(-?\d+(?:\.\d+)?)\s*([+-])\s*(-?\d+(?:\.\d+)?)$/u
  );

  if (!match) return prompt;

  const numerator = Number(match[1]);
  const denominator = Number(match[2]);
  const base = Number(match[3]);
  const op = match[4];
  const tail = Number(match[5]);
  const correct = Number(answer);

  if (
    !Number.isFinite(numerator)
    || !Number.isFinite(denominator)
    || denominator === 0
    || !Number.isFinite(base)
    || !Number.isFinite(tail)
    || !Number.isFinite(correct)
  ) {
    return prompt;
  }

  const fraction = numerator / denominator;
  const opSign = op === '-' ? '-' : '+';

  const leftFirstValue =
    op === '-'
      ? (fraction * base) - tail
      : (fraction * base) + tail;

  const groupedValue =
    op === '-'
      ? fraction * (base - tail)
      : fraction * (base + tail);

  if (almostEqualQuickServeNumber(correct, groupedValue)) {
    return `${numerator}/${denominator} of (${base} ${opSign} ${tail})`;
  }

  if (almostEqualQuickServeNumber(correct, leftFirstValue)) {
    return `(${numerator}/${denominator} of ${base}) ${opSign} ${tail}`;
  }

  return prompt;
}

function formatQuickServeProblemPrompt(rawEquation = '', answer = currentCorrectAnswer) {
  const cleanPrompt = String(rawEquation || '')
    .replace(/\s*=\s*\?\s*$/u, '')
    .trim();

  return clarifyQuickServeFractionOfPrompt(cleanPrompt, answer);
}


/* ───────────────── QuickServe Equation Typography START ───────────────── */

function getQuickServeModeDisplayName(mode = currentMathMode) {
  const safeMode = normalizeQuickServeMathMode(mode);

  const labels = {
    addSub: 'Add/Subtract',
    multiDiv: 'Multiply/Divide',
    decimalMoney: 'Decimals/Money',
    percents: 'Percents',
    fractions: 'Fractions',
    mixed: 'Mixed Bag',
  };

  return labels[safeMode] || 'Add/Subtract';
}



function getQuickServeDifficultyDisplayName(difficulty = currentMathDifficulty) {
  const safeDifficulty = normalizeQuickServeMathDifficulty(difficulty);

  const labels = {
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
  };

  return labels[safeDifficulty] || 'Easy';
}

function getQuickServeEquationModeText() {
  return `${getQuickServeModeDisplayName()}: ${getQuickServeDifficultyDisplayName()}`;
}

function ensureQuickServeEquationModeLabel() {
  let label = document.getElementById('qsEquationModeLabel');

  if (label) return label;

  const stack = document.querySelector('.qs-math .center-stack');
  if (!stack) return null;

  label = document.createElement('div');
  label.id = 'qsEquationModeLabel';
  label.className = 'qs-equation-mode-label';
  label.setAttribute('aria-live', 'polite');

  stack.prepend(label);

  return label;
}

function updateQuickServeEquationModeLabel() {
  const label = ensureQuickServeEquationModeLabel();
  if (!label) return;

  label.textContent = getQuickServeEquationModeText();
}


function normalizeQuickServeEquationSpacing(rawEquation = '') {
  return String(rawEquation || '')
    // Operators that are never unary in our QS display.
    .replace(/\s*([+×÷=])\s*/gu, ' $1 ')
    // Only treat hyphen as a binary minus when it sits between two digits/parens.
    // This preserves leading negative numbers like -8 + 4.
    .replace(/(\d|\))\s*-\s*(\d|\()/gu, '$1 - $2')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeQuickServeEquationHTML(value = '') {
  return String(value ?? '').replace(/[&<>"']/g, (char) => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return map[char] || char;
  });
}

function formatQuickServeEquationMarkup(rawEquation = '') {
  const normalized = normalizeQuickServeEquationSpacing(rawEquation);
  const escaped = escapeQuickServeEquationHTML(normalized);

  return escaped
    .replace(/\$/g, '<span class="qs-money-symbol" aria-hidden="true">$</span>')
    .replace(/%/g, '<span class="qs-percent-symbol" aria-hidden="true">%</span>')
    .replace(/\s*\+\s*/g, '<span class="qs-op qs-op-plus">+</span>')
    .replace(/(\d|\))\s+-\s+(\d|\()/g, '$1<span class="qs-op qs-op-minus">-</span>$2')
    .replace(/\s*×\s*/g, '<span class="qs-op qs-op-times">×</span>')
    .replace(/\s*÷\s*/g, '<span class="qs-op qs-op-divide">÷</span>')
    .trim();
}



/* ───────────────── QuickServe Equation Typography END ───────────────── */

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

  updateQuickServeEquationModeLabel();

  const problemEl = document.getElementById('mathProblem');
  if (problemEl) {
    const cleanEquation = formatQuickServeProblemPrompt(equation, answer);

    problemEl.innerHTML = `${formatQuickServeEquationMarkup(cleanEquation)}<span class="qs-equals">=</span><span class="qs-question-mark">?</span>`;
    problemEl.dataset.answer = String(answer);
    problemEl.dataset.rawEquation = cleanEquation;
    problemEl.dataset.modeLabel = getQuickServeEquationModeText();
  }
}



let qsCorrectFeedbackBurstId = 0;

function spawnQuickServeCorrectFeedback(xp = 0) {
  const layer =
    document.getElementById('qsFeedbackLayer')
    || document.querySelector('.qs-math .center-stack');

  if (!layer) return false;

  qsCorrectFeedbackBurstId += 1;

  const safeXP = Math.max(0, Math.floor(Number(xp) || 0));
  const drift = ((qsCorrectFeedbackBurstId % 5) - 2) * 0.18;

  const burst = document.createElement('div');
  burst.className = 'qs-floating-feedback qs-floating-feedback-correct';
  burst.style.setProperty('--qs-feedback-drift', `${drift.toFixed(2)}rem`);
  burst.setAttribute('aria-hidden', 'true');

  const xpEl = document.createElement('span');
  xpEl.className = 'qs-floating-feedback-xp';
  xpEl.textContent = `🍧 ${safeXP} XP`;

  const resultEl = document.createElement('span');
  resultEl.className = 'qs-floating-feedback-result';
  resultEl.textContent = '✅ Correct!';

  burst.append(xpEl, resultEl);
  layer.appendChild(burst);

  const cleanup = () => burst.remove();

  burst.addEventListener('animationend', cleanup, { once: true });
  window.setTimeout(cleanup, 940);

  return true;
}

/* ───────────────── QuickServe Correct Toast Caveman START ─────────────────
   Purpose:
   - Correct feedback must fire every time, even on fast answers.
   - No observer.
   - No reused node.
   - No CSS-tail dependency.
   - Each correct answer creates one absolute-positioned inline toast.
   ──────────────────────────────────────────────────────────────────────── */
let qsCorrectToastId = 0;

function spawnQuickServeCorrectToast(xp = 0) {
  const host =
    document.querySelector('.qs-math')
    || document.querySelector('.center-stack')
    || document.querySelector('.qs-grid');

  if (!host) {
    console.warn('[QuickServe] Correct toast host missing.');
    return;
  }

  qsCorrectToastId += 1;

  const safeXP = Math.max(0, Math.floor(Number(xp) || 0));
  const drift = ((qsCorrectToastId % 5) - 2) * 4;

  const toast = document.createElement('div');
  toast.className = 'qs-correct-toast-caveman';
  toast.textContent = `🍧 ${safeXP} XP  ✅ Correct!`;
  toast.setAttribute('aria-hidden', 'true');

  Object.assign(toast.style, {
    position: 'absolute',
    left: '50%',
    bottom: 'clamp(1.18rem, 2.4svh, 1.65rem)',
    zIndex: '9999',
    pointerEvents: 'none',

    display: 'block',
    width: 'max-content',
    maxWidth: '92%',

    fontFamily: 'Orbitron, system-ui, sans-serif',
    fontWeight: '950',
    fontSize: 'clamp(0.78rem, 1.85svh, 1.12rem)',
    lineHeight: '1',
    letterSpacing: '-0.02em',
    whiteSpace: 'nowrap',
    textAlign: 'center',

    color: '#76ff9d',
    textShadow:
      '0 0 8px rgba(118,255,157,0.9), 0 0 18px rgba(118,255,157,0.42), 0 2px 7px rgba(0,0,0,0.95)',

    opacity: '0',
    transform: `translate3d(calc(-50% + ${drift}px), 0.36rem, 0) scale(0.96)`,
    filter: 'brightness(1.12)',
    transition:
      'opacity 160ms ease-out, transform 620ms ease-out, filter 620ms ease-out',
    willChange: 'opacity, transform, filter',
  });

  host.appendChild(toast);

  // Force layout so WKWebView actually applies the transition.
  void toast.offsetWidth;

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = `translate3d(calc(-50% + ${drift}px), -0.28rem, 0) scale(1)`;
    toast.style.filter = 'brightness(1.22)';
  });

  window.setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = `translate3d(calc(-50% + ${drift}px), -1.15rem, 0) scale(0.985)`;
    toast.style.filter = 'brightness(0.94) blur(1px)';
  }, 430);

  window.setTimeout(() => {
    toast.remove();
  }, 980);

  console.log(`[QuickServe] Correct toast spawned: ${safeXP} XP`);
}
/* ───────────────── QuickServe Correct Toast Caveman END ───────────────── */

function showResultMsg(isCorrect, xp = 0) {
  const resultMsg = document.getElementById('qsResultMsg');
  const xpMsg = document.getElementById('qsXPMsg');

  if (!resultMsg || !xpMsg) return;

  // Correct-answer law:
  // Spawn a fresh independent burst every time.
  // Do NOT reuse/restart the old single message node.
  if (isCorrect) {
    resultMsg.textContent = '';
    resultMsg.classList.remove(
      'show',
      'correct',
      'error',
      'cleared',
      'zero',
      'incorrect',
      'wrong',
      'bad',
      'good'
    );
    resultMsg.classList.add('hidden');
    resultMsg.removeAttribute('style');

    xpMsg.textContent = '';
    xpMsg.classList.remove(
      'show',
      'correct',
      'error',
      'cleared',
      'zero',
      'incorrect',
      'wrong',
      'bad',
      'good'
    );
    xpMsg.classList.add('hidden');
    xpMsg.removeAttribute('style');

    const didSpawn = spawnQuickServeCorrectFeedback(xp);

    // Tiny fallback: if the burst layer is missing for any reason,
    // show the old message once instead of showing nothing.
    if (!didSpawn) {
      resultMsg.textContent = `🍧 ${xp} XP  ✅ Correct!`;
      resultMsg.classList.remove('hidden');
      resultMsg.classList.add('show', 'correct');

      window.setTimeout(() => {
        resultMsg.classList.remove('show', 'correct', 'error');
        resultMsg.classList.add('hidden');
      }, 900);
    }

    return;
  }

  // Incorrect keeps the existing single-message behavior.
  // Clear feedback is handled by showQuickServeClearedFeedback(), untouched.
  resultMsg.textContent = '❌ Nope!';

  resultMsg.classList.remove(
    'hidden',
    'cleared',
    'show',
    'correct',
    'error',
    'zero',
    'incorrect',
    'wrong',
    'bad',
    'good'
  );

  resultMsg.classList.add('show', 'error');

  xpMsg.textContent = '';
  xpMsg.classList.remove(
    'cleared',
    'show',
    'correct',
    'error',
    'zero',
    'incorrect',
    'wrong',
    'bad',
    'good'
  );
  xpMsg.classList.add('hidden');

  xpMsg.removeAttribute('style');
  resultMsg.removeAttribute('style');

  window.setTimeout(() => {
    resultMsg.classList.remove('show', 'correct', 'error');
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
  if (!currentAnswer) {
    currentAnswer = '-';
  } else {
    currentAnswer = currentAnswer.startsWith('-')
      ? currentAnswer.slice(1)
      : '-' + currentAnswer;
  }

  updateAnswerDisplay();
  setCurrentAnswer(currentAnswer);
  maybeAutoSubmitQuickServeAnswer();
}


function clearAnswer() {
  clearQuickServeAutoSubmitTimer();
  currentAnswer = '';
  updateAnswerDisplay();
  setCurrentAnswer('');
}





/* ───────────────── QuickServe Clear Feedback START ───────────────── */
let qsClearFeedbackTimer = null;

function fireQuickServeClearIncorrectEffects() {
  triggerQuickServeStageReaction('bad');
  gridFX.bumpGridGlow('bad');
  phil.triggerGlitch();
  playIncorrectSfx();

  try {
    hapticError();
  } catch (err) {
    console.warn('[QuickServe] hapticError failed during clear feedback', err);
  }
}

function showQuickServeClearedFeedback() {
  const resultMsg = document.getElementById('qsResultMsg');
  const xpMsg = document.getElementById('qsXPMsg');

  if (qsClearFeedbackTimer) {
    window.clearTimeout(qsClearFeedbackTimer);
    qsClearFeedbackTimer = null;
  }

  // QS bottom feedback law:
  // Clear is a single centered bottom-row message.
  // It should not duplicate into both old corner lanes.
  if (xpMsg) {
    xpMsg.textContent = '';
    xpMsg.classList.remove(
      'show',
      'cleared',
      'zero',
      'error',
      'correct',
      'incorrect',
      'wrong',
      'bad',
      'good'
    );
    xpMsg.classList.add('hidden');
    xpMsg.removeAttribute('style');
  }

  if (resultMsg) {
    resultMsg.textContent = 'Cleared!';
    resultMsg.classList.remove(
      'hidden',
      'error',
      'correct',
      'incorrect',
      'wrong',
      'bad',
      'good',
      'zero'
    );
    resultMsg.classList.add('cleared', 'show');
    resultMsg.removeAttribute('style');
  }

  qsClearFeedbackTimer = window.setTimeout(() => {
    if (resultMsg) {
      resultMsg.classList.remove('show', 'cleared');

      if (resultMsg.textContent === 'Cleared!') {
        resultMsg.textContent = '';
      }

      resultMsg.classList.add('hidden');
    }

    if (xpMsg) {
      xpMsg.classList.remove('show', 'cleared');

      if (xpMsg.textContent === 'Cleared!') {
        xpMsg.textContent = '';
      }

      xpMsg.classList.add('hidden');
    }

    qsClearFeedbackTimer = null;
  }, 1150);
}

/* ───────────────── QuickServe Clear Feedback END ───────────────── */

function markCurrentAnswerWrongAndClear() {
  if (!gameRunning) {
    clearAnswer();
    return;
  }

  const hasInput = String(currentAnswer || '').trim().length > 0;

  if (!hasInput) {
    clearAnswer();
    return;
  }

  if (isCurrentQuickServeAnswerCorrect()) {
    submitAnswer();
    return;
  }

  clearQuickServeAutoSubmitTimer();

  // Starting finish point:
  // Clear with an entered answer fires the incorrect-feel lane
  // but says Cleared instead of Nope/0XP.
  clearAnswer();
  fireQuickServeClearIncorrectEffects();
  showQuickServeClearedFeedback();
}



// ✅ Keypad Helpers (export for keypad use)
export {
  toggleNegative,
  clearAnswer,
  markCurrentAnswerWrongAndClear,
  submitAnswer
};
