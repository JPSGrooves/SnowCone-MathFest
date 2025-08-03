import { playTransition } from '../managers/transitionManager.js';
import { applyBackgroundTheme } from '../managers/backgroundManager.js';
import { appState } from '../data/appState.js';
import { stopTrack } from '../managers/musicManager.js';

export function stopGenericMode() {
  const container = document.getElementById('game-container');
  container.innerHTML = '';
  container.classList.add('hidden');
  container.style.display = 'none';

  document.querySelector('.menu-wrapper')?.classList.remove('hidden');

  applyBackgroundTheme();
  appState.clearCurrentMode();
}
export function hookReturnButton(id = 'backToMenu') {
  const btn = document.getElementById(id);
  if (!btn) return;

  btn.addEventListener('click', () => {
    stopTrack(); // 🚨 always shut the music down
    playTransition(() => {
      document.querySelector('#game-container')?.classList.add('hidden');
      document.querySelector('.menu-wrapper')?.classList.remove('hidden');
      applyBackgroundTheme();
    });
  });
}
