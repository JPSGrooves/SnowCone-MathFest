import { loadQuickServe } from '../modes/quickServe/quickServe.js';
import { swapModeBackground } from './backgroundManager.js';

export function startMode(modeName) {
  if (modeName === 'quickServe') {
    swapModeBackground('quickServe/quickserveBG'); // ✅ goes to /assets/img/modes/quickServe/quickserveBG.png
    loadQuickServe();
  }

  // Other modes here...
}
