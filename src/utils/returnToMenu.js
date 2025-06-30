import { playTransition } from '../managers/transitionManager.js';
import { applyBackgroundTheme } from '../managers/backgroundManager.js';
import { appState } from '../data/appState.js';

export function stopGenericMode() {
  const container = document.getElementById('game-container');
  container.innerHTML = '';
  container.classList.add('hidden');
  container.style.display = 'none';

  document.querySelector('.menu-wrapper')?.classList.remove('hidden');

  applyBackgroundTheme();
  appState.clearCurrentMode();
}

export function hookReturnButton(id) {
  const btn = document.getElementById(id);
  if (btn) {
    btn.addEventListener('click', () => {
      playTransition(() => {
        stopGenericMode();
      });
    });
  }
}
