// 🍧 quickServeKeypad.js

import { 
  toggleNegative, 
  clearAnswer, 
  submitAnswer, 
  appendToAnswer 
} from './quickServeGame.js';

import { stopGameLogic, startGameLogic } from './quickServeGame.js';
import { stopTrack, playTrack } from '../../managers/musicManager.js';
import { returnToMenu } from './quickServe.js'; // 🌟 Full QS exit
import { stopQS, playQSRandomTrack } from './quickServeMusic.js'; // ✅ up top


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
      { id: 'neg', label: '±', class: 'btn-num' },
      { id: 'zero', label: '0', class: 'btn-num' },
      { id: 'decimal', label: '.', class: 'btn-num' },
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
      btn.addEventListener('pointerdown', e => {
        e.preventDefault();
        handler();
      }, { passive: false });
    }
  };

  // ✴️ Number Keys
  keys.forEach(({ id, val }) => {
    safeBind(id, () => appendToAnswer(val));
  });

  // 🧼 Control Buttons
  safeBind('reset', async () => {
    console.log('🔁 Resetting QuickServe and restarting track');

    await stopQS();         // 🌟 wait for music to fully stop
    stopGameLogic();        // 🎮 clear state
    startGameLogic();       // 🎬 start game
    playQSRandomTrack();    // 🎧 spin fresh vibes
  });

  safeBind('neg', toggleNegative);
  safeBind('clear', clearAnswer);
  safeBind('enter', submitAnswer);

  // 🚧 Algebra Mode (placeholder)
  safeBind('algMode', () => alert('🔢 Algebra Mode is under construction!'));

  // 🌀 Return to Main Menu (Full cleanup)
  safeBind('menu', returnToMenu);
}

let keyboardListener = null;

export function setupKeyboardInput() {
  // 🚫 Remove existing listener first
  if (keyboardListener) {
    window.removeEventListener('keydown', keyboardListener);
  }

  keyboardListener = (e) => {
    const key = e.key;

    if (key >= '0' && key <= '9') {
      appendToAnswer(key);
    } else if (key === '.') {
      appendToAnswer('.');
    } else if (key === 'Enter') {
      submitAnswer();
    } else if (key === 'Backspace') {
      clearAnswer();
    } else if (key === '-') {
      toggleNegative();
    }
  };

  window.addEventListener('keydown', keyboardListener);
}
