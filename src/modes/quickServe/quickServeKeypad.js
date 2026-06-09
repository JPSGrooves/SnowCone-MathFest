// 🍧 quickServeKeypad.js

import { 
  toggleNegative, 
  clearAnswer, 
  submitAnswer, 
  appendToAnswer 
} from './quickServeGame.js';

import { stopGameLogic, startGameLogic } from './quickServeGame.js';
import {
  returnToMenu,
  ensureQuickServeMusicPlaying
} from './quickServe.js'; // 🌟 Full QS exit + QS music guard
import { setMathMode } from './quickServeGame.js';
import { setCurrentAnswer } from './quickServeGame.js'; // 💥 you'll add this below
import { toggleMute } from '../../managers/musicManager.js';
import { updateMuteButtonLabel } from './quickServe.js'; // 💥 this is what we need


export { setMathMode } from './quickServeGame.js';


export function generateKeypadHTML() {
  const rows = [
    [
      { id: 'plusMinus', label: '+/-<br>Mode', class: 'btn-mode' },
      { id: 'seven', label: '7', class: 'btn-num' },
      { id: 'eight', label: '8', class: 'btn-num' },
      { id: 'nine', label: '9', class: 'btn-num' },
      { id: 'enter', label: 'Enter', class: 'btn-enter' },
    ],
    [
      { id: 'multiplyDivide', label: '×/÷<br>Mode', class: 'btn-mode' },
      { id: 'four', label: '4', class: 'btn-num' },
      { id: 'five', label: '5', class: 'btn-num' },
      { id: 'six', label: '6', class: 'btn-num' },
      { id: 'clear', label: 'Clear', class: 'btn-clear' },
    ],
    [
      { id: 'algMode', label: 'Alg<br>Mode', class: 'btn-mode' },
      { id: 'one', label: '1', class: 'btn-num' },
      { id: 'two', label: '2', class: 'btn-num' },
      { id: 'three', label: '3', class: 'btn-num' },
      { id: 'muteBtn', label: '🔊 Mute', class: 'btn-mode' },
    ],
    [
      { id: 'menu', label: 'Main<br>Menu', class: 'btn-menu' },
      { id: 'decimal', label: '.', class: 'btn-num' },
      { id: 'zero', label: '0', class: 'btn-num' },
      { id: 'neg', label: '±', class: 'btn-num' },
      { id: 'reset', label: 'Reset<br>Game', class: 'btn-menu' },
    ],
  ];

  const buttons = rows
    .map(row =>
      row
        .map(btn =>
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
    { id: 'decimal', val: '.' }
  ];

  const safeBind = (id, handler) => {
    const btn = document.getElementById(id);

    if (btn) {
      btn.addEventListener(
        'pointerdown',
        (e) => {
          e?.preventDefault?.();
          e?.stopPropagation?.();
          handler(e);
        },
        { passive: false }
      );
    }
  };

  // ✴️ Number Keys
  keys.forEach(({ id, val }) => {
    safeBind(id, () => appendToAnswer(val));
  });

  // 🧼 Control Buttons
  safeBind('reset', () => {
    console.log('🔁 Resetting QuickServe shift only');

    // Music is still owned by quickServe.js.
    // This reset does NOT force a new track.
    // It only restarts music if the QS soundtrack is already dead.
    stopGameLogic();
    setMathMode('addSub');
    startGameLogic();
    ensureQuickServeMusicPlaying();
  });

  safeBind('neg', toggleNegative);
  safeBind('clear', clearAnswer);
  safeBind('enter', submitAnswer);

  safeBind('plusMinus', () => {
    setMathMode('addSub');
  });
  safeBind('multiplyDivide', () => {
    setMathMode('multiDiv');
  });
  safeBind('algMode', () => {
    setMathMode('algebra');
  });


  safeBind('muteBtn', () => {
    toggleMute();
    updateMuteButtonLabel();
  });



  // 🌀 Return to Main Menu (Full cleanup)
  safeBind('menu', returnToMenu);
}


export function handleKeypadInput(value) {
  const display = document.getElementById('answerDisplay');
  if (!display) return;

  let current = display.textContent;

  switch (value) {
    case 'enter':
      submitAnswer(); // already exists?
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
      // Append digit or replace "0"
      if (current === '0') {
        updateAnswer(value);
      } else {
        updateAnswer(current + value);
      }
      break;
  }
}

export function highlightModeButton(mode) {
  const modeMap = {
    addSub: 0,
    multiDiv: 1,
    algebra: 2
  };

  const buttons = document.querySelectorAll('.mode-toggle');
  buttons.forEach((btn, i) => {
    if (i === modeMap[mode]) {
      btn.classList.add('active-mode');
    } else {
      btn.classList.remove('active-mode');
    }
  });
}


// Helper to set answer
function updateAnswer(newVal) {
  const display = document.getElementById('answerDisplay');
  if (display) {
    display.textContent = newVal;
  }
  setCurrentAnswer(newVal); // ✨ sync the real game variable
}
