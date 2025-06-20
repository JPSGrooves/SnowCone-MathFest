import { loadQuickServe } from '../modes/quickServe/quickServe.js';
import { loadKidsMode } from '../modes/kidsCamping/kidsCamping.js';
import { loadMathTips } from '../modes/mathTips/mathTips.js';
import { loadStoryMode } from '../modes/storymodeForest/storyMode.js';
import { loadInfinityMode } from '../modes/infinityLake/infinityMode.js';

export function startMode(modeName) {
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
