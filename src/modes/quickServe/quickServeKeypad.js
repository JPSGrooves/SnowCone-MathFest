// 🍧 quickServeKeypad.js
// QuickServe 1.5.x keypad wiring
//
// Current law:
// - Intro chooses math lane.
// - Intro chooses starting difficulty.
// - Intro chooses performer.
// - In-game keypad changes difficulty only.
// - In-game keypad does not change character or math lane.
//
// Current remap:
// - Old Enter position = Clear
// - Old Clear position = Mute
// - Old Mute position = %
// - Old Reset position = /
//
// Auto-submit and Clear-as-wrong come in the next pass.

import {
  toggleNegative,
  clearAnswer,
  markCurrentAnswerWrongAndClear,
  appendToAnswer,
  setMathDifficulty,
  setMathMode,
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
      { id: 'enter', label: 'Clear', class: 'btn-clear qs-keypad-clear-answer-btn' },
    ],
    [
      { id: 'multiplyDivide', label: 'Med', class: 'btn-mode' },
      { id: 'four', label: '4', class: 'btn-num' },
      { id: 'five', label: '5', class: 'btn-num' },
      { id: 'six', label: '6', class: 'btn-num' },
      {
        id: 'muteBtn',
        label: '<span class="qs-keypad-mute-icon" aria-hidden="true">🔊</span><span class="qs-keypad-mute-text">Mute</span>',
        class: 'btn-mode qs-keypad-mute-btn',
      },
    ],
    [
      { id: 'algMode', label: 'Hard', class: 'btn-mode' },
      { id: 'one', label: '1', class: 'btn-num' },
      { id: 'two', label: '2', class: 'btn-num' },
      { id: 'three', label: '3', class: 'btn-num' },
      { id: 'percent', label: '%', class: 'btn-num qs-keypad-symbol-btn' },
    ],
    [
      {
        id: 'menu',
        label: '<span class="qs-preflight-back-arrow">←</span><span class="qs-preflight-back-text">BACK</span>',
        class: 'btn-menu qs-keypad-stock-back-btn',
      },
      { id: 'decimal', label: '.', class: 'btn-num qs-keypad-symbol-btn' },
      { id: 'zero', label: '0', class: 'btn-num' },
      { id: 'negative', label: '±', class: 'btn-num qs-keypad-symbol-btn' },
      { id: 'slash', label: '/', class: 'btn-num qs-keypad-symbol-btn' },
    ],
  ];

  return `
    <div class="qs-keypad" aria-label="QuickServe keypad">
      ${rows.flat().map((button) => `
        <button id="${button.id}" class="${button.class}" type="button">
          ${button.label}
        </button>
      `).join('')}
    </div>
  `;
}

export function setupKeypad() {
  const byId = (id) => document.getElementById(id);

  const safeBind = (id, handler) => {
    const button = byId(id);
    if (!button) {
      console.warn(`⚠️ Missing keypad button: ${id}`);
      return;
    }

    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      handler();
    }, { passive: false });
  };

  const chooseDifficulty = (difficulty) => {
    console.log(`[QuickServe] In-game difficulty selected: ${difficulty}`);

    setMathDifficulty(difficulty);
    setQuickServeDifficultyFromInGameDifficulty(difficulty);
  };

  // Difficulty only.
  safeBind('plusMinus', () => chooseDifficulty('easy'));
  safeBind('multiplyDivide', () => chooseDifficulty('medium'));
  safeBind('algMode', () => chooseDifficulty('hard'));

  // Numbers.
  safeBind('zero', () => appendToAnswer('0'));
  safeBind('one', () => appendToAnswer('1'));
  safeBind('two', () => appendToAnswer('2'));
  safeBind('three', () => appendToAnswer('3'));
  safeBind('four', () => appendToAnswer('4'));
  safeBind('five', () => appendToAnswer('5'));
  safeBind('six', () => appendToAnswer('6'));
  safeBind('seven', () => appendToAnswer('7'));
  safeBind('eight', () => appendToAnswer('8'));
  safeBind('nine', () => appendToAnswer('9'));

  // Symbols.
  safeBind('decimal', () => appendToAnswer('.'));
  safeBind('negative', toggleNegative);
  safeBind('percent', () => appendToAnswer('%'));
  safeBind('slash', () => appendToAnswer('/'));

  // Temporary behavior until auto-submit pass:
  // Clear just clears. Next pass makes it Clear-as-wrong.
  safeBind('enter', markCurrentAnswerWrongAndClear);

  // Mute moved to the old Clear slot.
  safeBind('muteBtn', () => {
    toggleMute();
    updateMuteButtonLabel();
  });

  // Back to QS intro/preflight.
  safeBind('menu', returnQuickServeGameToIntro);

  // Keep music alive if setup happens after a scene rebuild.
  ensureQuickServeMusicPlaying();

  // Paint mute state after render.
  updateMuteButtonLabel();
}


export function handleKeypadInput(key) {
  const rawKey = String(key ?? '').trim();

  if (!rawKey) return;

  if (/^\d$/.test(rawKey)) {
    appendToAnswer(rawKey);
    return;
  }

  if (rawKey === '.') {
    appendToAnswer('.');
    return;
  }

  if (rawKey === '/') {
    appendToAnswer('/');
    return;
  }

  if (rawKey === '%') {
    appendToAnswer('%');
    return;
  }

  if (rawKey === '-' || rawKey === '±') {
    toggleNegative();
    return;
  }

  if (rawKey === 'Backspace' || rawKey === 'Delete') {
    clearAnswer();
    return;
  }

  // Current temporary keypad law:
  // Enter position is now Clear until the auto-submit/Clear-as-wrong pass lands.
  if (rawKey === 'Enter') {
    markCurrentAnswerWrongAndClear();
    return;
  }

  if (rawKey === 'Escape') {
    returnQuickServeGameToIntro();
  }
}


export function highlightModeButton(modeOrDifficulty = 'easy') {
  const raw = String(modeOrDifficulty || '').trim();

  const aliases = {
    easy: 'plusMinus',
    addSub: 'plusMinus',
    plusMinus: 'plusMinus',

    medium: 'multiplyDivide',
    med: 'multiplyDivide',
    multiDiv: 'multiplyDivide',
    multiplyDivide: 'multiplyDivide',

    hard: 'algMode',
    algebra: 'algMode',
    decimals: 'algMode',
    fractions: 'algMode',
    mixed: 'algMode',
    algMode: 'algMode',
  };

  const activeId = aliases[raw] || 'plusMinus';

  document.querySelectorAll('.btn-mode').forEach((button) => {
    if (button.id === 'muteBtn') return;
    button.classList.toggle('active-mode', button.id === activeId);
  });
}

export function resetQuickServeKeypadAnswerOnly() {
  clearAnswer();
}
