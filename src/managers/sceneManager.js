// 🚦 MobX Scene Manager
import { appState } from '../data/appState.js';

import { loadQuickServe, stopQuickServeGame } from '../modes/quickServe/quickServe.js';
import { loadKidsMode, stopKidsMode } from '../modes/kidsCamping/kidsCamping.js';
import { loadMathTips, stopMathTips } from '../modes/mathTips/mathTips.js';
import { loadStoryMode, stopStoryMode } from '../modes/storymodeForest/storyMode.js';
import { loadInfinityMode, stopInfinityMode } from '../modes/infinityLake/infinityMode.js';

import { applyBackgroundTheme } from './backgroundManager.js';

//////////////////////////////
// 🚀 GLOBAL SCENE SWAPPER
//////////////////////////////
export function startMode(modeName) {
  console.log(`🌀 Switching to ${modeName}...`);

  cleanupCurrentMode(); // <- 🔥 Universal Nuke

  appState.setMode(modeName); // 🧠 MobX tracks active mode

  switch (modeName) {
    case 'quickServe':
      loadQuickServe();
      break;
    case 'kids':
      loadKidsMode();
      break;
    case 'mathtips':
      loadMathTips();
      break;
    case 'story':
      loadStoryMode();
      break;
    case 'infinity':
      loadInfinityMode();
      break;
    default:
      console.warn(`⚠️ Unknown mode: ${modeName}`);
  }
}

//////////////////////////////
// 🧹 CLEAN UP EVERYTHING
//////////////////////////////
function cleanupCurrentMode() {
  const container = document.getElementById('game-container');
  const menuWrapper = document.querySelector('.menu-wrapper');

  // ✅ UI Reset
  container.classList.add('hidden');
  container.innerHTML = '';
  container.style.display = 'none';
  menuWrapper?.classList.remove('hidden');

  // ✅ Reset Background
  applyBackgroundTheme();

  // ✅ Kill running systems based on last mode
  switch (appState.mode) {
    case 'quickServe':
      stopQuickServeGame?.();
      break;
    case 'kids':
      stopKidsMode?.();
      break;
    case 'mathtips':
      stopMathTips?.();
      break;
    case 'story':
      stopStoryMode?.();
      break;
    case 'infinity':
      stopInfinityMode?.();
      break;
    default:
      // Nothing to stop if no prior mode
      break;
  }

  // ✅ Clear global trash later like music, chatbots, etc. if needed
}

export function showMenu() {
  const menuWrapper = document.querySelector('.menu-wrapper');
  const container = document.getElementById('game-container');

  container.innerHTML = '';
  container.classList.add('hidden');
  container.style.display = 'none';

  menuWrapper?.classList.remove('hidden');
}
