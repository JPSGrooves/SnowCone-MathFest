// 🚦 MobX Scene Manager
import { appState } from '../data/appState.js';
import { loadQuickServe } from '../modes/quickServe/quickServe.js';
import { loadKidsMode } from '../modes/kidsCamping/kidsCamping.js';
import { loadMathTips } from '../modes/mathTips/mathTips.js';
import { loadStoryMode } from '../modes/storymodeForest/storyMode.js';
import { loadInfinityMode } from '../modes/infinityLake/infinityMode.js';

export function startMode(modeName) {
  appState.setMode(modeName); // 🧠 track active mode globally

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
      console.warn(`🌀 Unknown mode: ${modeName}`);
  }
}
