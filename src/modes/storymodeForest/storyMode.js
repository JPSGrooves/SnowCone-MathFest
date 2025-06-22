import { swapModeBackground, applyBackgroundTheme } from '../../managers/backgroundManager.js';
import { playTransition } from '../../managers/transitionManager.js';


export function loadStoryMode() {
  console.log("📖 Loading Story Mode");

  const menuWrapper = document.querySelector('.menu-wrapper');
  const gameContainer = document.getElementById('game-container');

  menuWrapper?.classList.add('hidden');
  gameContainer.classList.remove('hidden');
  gameContainer.style.display = 'flex';

  gameContainer.innerHTML = `
    <div class="game-frame">
      <img id="modeBackground" class="background-fill" src="assets/img/modes/storymodeForest/storyBG.png" alt="Story Mode Background" loading="eager" />
      <div class="qs-grid">
        <div class="qs-header">
          <h1>🌲 Story Mode – Forest Entry</h1>
        </div>
        <div class="qs-content">
          <p>The forest is quiet... too quiet. But the math ghosts are whispering.</p>
        </div>
        <div class="qs-footer">
          <button id="returnToMenu" class="btn-return">🔙 Return to Menu</button>
        </div>
      </div>
    </div>
  `;

  requestAnimationFrame(() => {
    setTimeout(() => {
      const img = document.getElementById('modeBackground');
      if (img) {
        img.src = img.src;
        img.style.pointerEvents = 'none';
        console.log('🌲 Story Mode background repainted');
      }
    }, 10);
  });

  document.getElementById('returnToMenu')?.addEventListener('click', () => {
    playTransition(() => {
      gameContainer.classList.add('hidden');
      gameContainer.innerHTML = '';
      menuWrapper?.classList.remove('hidden');
      requestAnimationFrame(() => {
        applyBackgroundTheme();
      });
    });
  });
}
