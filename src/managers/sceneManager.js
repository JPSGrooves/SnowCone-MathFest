import { loadQuickServe } from '../modes/quickServe/quickServe.js';
import { swapModeBackground } from './backgroundManager.js';

export function startMode(modeName) {
  if (modeName === 'quickServe') {
    loadQuickServe();
  }

  // Other modes here...
}

