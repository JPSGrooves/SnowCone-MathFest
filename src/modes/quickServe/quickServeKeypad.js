// 🍧 quickServeKeypad.js
// QuickServe 1.5.x keypad wiring
//
// New law:
// - Intro chooses math lane.
// - Intro chooses starting difficulty.
// - Intro chooses performer.
// - In-game keypad may change difficulty only.
// - In-game keypad may NOT change character or math lane.

import {
  toggleNegative,
  clearAnswer,
  submitAnswer,
  appendToAnswer,
  stopGameLogic,
  startGameLogic,
  setMathDifficulty,
  setCurrentAnswer,
} from './quickServeGame.js';

import {
  returnQuickServeGameToIntro,
  ensureQuickServeMusicPlaying,
  setQuickServeDifficultyFromInGameDifficulty,
  updateMuteButtonLabel,
} from './quickServe.js';

import { toggleMute } from '../../managers/musicManager.js';

// Legacy re-export kept safe in case another module imports from keypad.
export { setMathMode, setMathDifficulty } from './quickServeGame.js';

export function generateKeypadHTML() {
  const rows = [
    [
      { id: 'plusMinus', label: 'Easy', class: 'btn-mode' },
      { id: 'seven', label: '7', class: 'btn-num' },
      { id: 'eight', label: '8', class: 'btn-num' },
      { id: 'nine', label: '9', class: 'btn-num' },
      { id: 'enter', label: 'Enter', class: 'btn-enter' },
    ],
    [
      { id: 'multiplyDivide', label: 'Med', class: 'btn-mode' },
      { id: 'four', label: '4', class: 'btn-num' },
      { id: 'five', label: '5', class: 'btn-num' },
      { id: 'six', label: '6', class: 'btn-num' },
      { id: 'clear', label: 'Clear', class: 'btn-clear' },
    ],
    [
      { id: 'algMode', label: 'Hard', class: 'btn-mode' },
      { id: 'one', label: '1', class: 'btn-num' },
      { id: 'two', label: '2', class: 'btn-num' },
      { id: 'three', label: '3', class: 'btn-num' },
      { id: 'muteBtn', label: '<span class="qs-keypad-mute-icon" aria-hidden="true">🔊</span><span class="qs-keypad-mute-text">Mute</span>', class: 'btn-mode' },
    ],
    [
      { id: 'menu', label: '<span class="qs-preflight-back-arrow">←</span><span class="qs-preflight-back-text">BACK</span>', class: 'btn-menu qs-keypad-stock-back-btn' },
      { id: 'decimal', label: '.', class: 'btn-num' },
      { id: 'zero', label: '0', class: 'btn-num' },
      { id: 'neg', label: '±', class: 'btn-num' },
      { id: 'reset', label: 'Reset', class: 'btn-menu' },
    ],
  ];

  const buttons = rows
    .map((row) =>
      row
        .map((btn) =>
          `<button id="${btn.id}" class="${btn.class}">${btn.label}</button>`
        )
        .join('\n')
    )
    .join('\n');

  return `<div class="qs-keypad">${buttons}</div>`;
}

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
    { id: 'decimal', val: '.' },
  ];

  const safeBind = (id, handler) => {
    const btn = document.getElementById(id);

    if (!btn) return;

    btn.addEventListener(
      'pointerdown',
      (e) => {
        e?.preventDefault?.();
        e?.stopPropagation?.();
        handler(e);
      },
      { passive: false }
    );
  };

  const chooseDifficulty = (difficulty) => {
    console.log(`[QuickServe] In-game difficulty selected: ${difficulty}`);

    // Change the live game difficulty.
    setMathDifficulty(difficulty);

    // Store it back into intro/preflight state.
    // When player hits Back Intro, the same difficulty remains selected.
    setQuickServeDifficultyFromInGameDifficulty(difficulty);
  };

  // ✴️ Number Keys
  keys.forEach(({ id, val }) => {
    safeBind(id, () => appendToAnswer(val));
  });

  // 🌶️ In-game difficulty buttons
  // These do NOT change math lane anymore.
  safeBind('plusMinus', () => chooseDifficulty('easy'));
  safeBind('multiplyDivide', () => chooseDifficulty('medium'));
  safeBind('algMode', () => chooseDifficulty('hard'));

  // 🧼 Control Buttons
  safeBind('reset', () => {
    console.log('🔁 Resetting QuickServe shift only');

    // Reset preserves current math lane and current difficulty.
    stopGameLogic();
    startGameLogic();
    ensureQuickServeMusicPlaying();
  });

  safeBind('neg', toggleNegative);
  safeBind('clear', clearAnswer);
  safeBind('enter', submitAnswer);

  safeBind('muteBtn', () => {
    toggleMute();
    updateMuteButtonLabel();
  });

  // ↩️ Return to QS intro/preflight.
  // Player can change character or math lane there.
  safeBind('menu', returnQuickServeGameToIntro);
}

export function handleKeypadInput(value) {
  const display = document.getElementById('answerDisplay');
  if (!display) return;

  const current = display.textContent;

  switch (value) {
    case 'enter':
      submitAnswer();
      break;

    case 'clear':
      updateAnswer('0');
      break;

    case 'neg':
      if (current.startsWith('-')) {
        updateAnswer(current.slice(1));
      } else {
        updateAnswer(current === '0' ? '-' : '-' + current);
      }
      break;

    case '.':
      if (!current.includes('.')) {
        updateAnswer(current + '.');
      }
      break;

    default:
      if (current === '0') {
        updateAnswer(value);
      } else {
        updateAnswer(current + value);
      }
      break;
  }
}

// Legacy helper name kept, but it now highlights difficulty buttons.
export function highlightModeButton(difficulty) {
  const activeId = {
    easy: 'plusMinus',
    medium: 'multiplyDivide',
    hard: 'algMode',
  }[difficulty] || 'plusMinus';

  document.querySelectorAll('.btn-mode').forEach((btn) => {
    if (btn.id === 'muteBtn') {
      btn.classList.remove('active-mode');
      return;
    }

    btn.classList.toggle('active-mode', btn.id === activeId);
  });
}

// Helper to set answer
function updateAnswer(newVal) {
  const display = document.getElementById('answerDisplay');

  if (display) {
    display.textContent = newVal;
  }

  setCurrentAnswer(newVal);
}
