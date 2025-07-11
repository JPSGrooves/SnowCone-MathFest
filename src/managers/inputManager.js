// 🍧 Input Manager Brain — Final Form
// Manages all keyboard input for all game modes

let currentMode = null;

export function activateInputHandler(modeName) {
  currentMode = modeName;
}


import { handleKeypadInput } from '../modes/quickServe/quickServeKeypad.js';
import { endQuickServeGame } from '../modes/quickServe/quickServeGame.js';
import { toggleMute } from '../managers/musicManager.js';
import { setMathMode, resetCurrentAnswer } from '../modes/quickServe/quickServeGame.js';
import { highlightModeButton } from '../modes/quickServe/quickServeKeypad.js';
import { playQSRandomTrack, stopQS } from '../modes/quickServe/quickServeMusic.js';
import { stopGameLogic, startGameLogic } from '../modes/quickServe/quickServeGame.js';
import { appState } from '../data/appState.js';
import { endInfinityGame, newProblem, flashModeName } from '../modes/infinityLake/infinityMode.js';
import { updateModeButtonUI } from '../modes/infinityLake/infinityMode.js';
import { updateMuteButtonLabel } from '../modes/infinityLake/infinityMode.js';







// 🌀 Optional feedback visuals
// You can wire these to show mode flashes or mute pings
// import { flashModeName, flashMuteIcon } from './uiFeedback.js'; // Optional

document.addEventListener('keydown', (e) => {
  if (!currentMode) return;

  const key = e.key.toLowerCase();
  const shift = e.shiftKey;

  if (currentMode === 'infinity') {
    handleInfinityKeys(e, key, shift);
  }

  if (currentMode === 'quickServe') {
    handleQuickServeKeys(e, key, shift);
  }
});

// ♾️ Infinity Mode Keybinds
function handleInfinityKeys(e, key, shift) {
  const answerMap = { a: 0, '1': 0, s: 1, '2': 1, d: 2, '3': 2 };

  if (answerMap.hasOwnProperty(key)) {
    e.preventDefault();
    const index = answerMap[key];
    const btns = document.querySelectorAll('.ans-btn');
    if (btns[index]) btns[index].click();
    return;
  }

  if (['j', 'k', 'l'].includes(key)) {
    e.preventDefault();
    const modeMap = { j: 'addsub', k: 'multdiv', l: 'alg' };
    const mode = modeMap[key];
    if (mode) {
        appState.setGameMode(mode);
        newProblem();
        updateModeButtonUI(); // ✨ add this line
        flashModeName();
    }
    return;
  }


  if (key === 'e' && shift) {
    e.preventDefault();
    endInfinityGame();
    return;
  }

  if (key === 'm') {
    e.preventDefault();
    const muted = toggleMute();
    updateMuteButtonLabel(); // 💡 sync the label text
    if (muted) {
      document.body.classList.add('muted');
    } else {
      document.body.classList.remove('muted');
    }
  }
}


// 🍧 QuickServe Mode Keybinds
function handleQuickServeKeys(e, key, shift) {
  const inputKeys = {
    '0': '0', '1': '1', '2': '2',
    '3': '3', '4': '4', '5': '5',
    '6': '6', '7': '7', '8': '8',
    '9': '9', '.': '.', '-': 'neg',
    'enter': 'enter', 'backspace': 'clear'
  };

  const mapped = inputKeys[key];
  if (mapped) {
    e.preventDefault();
    handleKeypadInput(mapped);
    return;
  }

  if (key === 'e' && shift) {
    e.preventDefault();
    endQuickServeGame();
    return;
  }
  if (['j', 'k', 'l'].includes(key)) {
    e.preventDefault();
    switch (key) {
      case 'j': setMathMode('addSub'); break;
      case 'k': setMathMode('multiDiv'); break;
      case 'l': setMathMode('algebra'); break;
    }
    return;
  }
  if (key === 'r' && shift) {
    e.preventDefault();
    document.getElementById('reset')?.click(); // simulate button
    stopQS();
    stopGameLogic();
    setMathMode('addSub');         // Reset math mode to base
    resetCurrentAnswer();          // Clear the input
    highlightModeButton('addSub'); // 👈 make sure this updates UI glow
    startGameLogic();              // Restart engine
    playQSRandomTrack();           // Spin up DJ booth
    return;
  }


    if (key === 'm') {
      e.preventDefault();
      toggleMute();
      updateMuteButtonLabel(); // now always synced
      updateMuteButtonLabel(); // ✨ this now works every time
      return;
    }
}
