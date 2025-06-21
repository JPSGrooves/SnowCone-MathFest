import './quickServe.css'; // 🍦 QuickServe styles
import { swapModeBackground, applyBackgroundTheme } from '../../managers/backgroundManager.js';
import { playTransition } from '../../managers/transitionManager.js';


export function loadQuickServe() {
  console.log("🍧 Loading QuickServe Mode");

  const menuWrapper = document.querySelector('.menu-wrapper');
  const gameContainer = document.getElementById('game-container');

  // ❌ Hide menu
  menuWrapper?.classList.add('hidden');

  // ✅ Show game zone
  gameContainer.classList.remove('hidden');
  gameContainer.style.display = 'flex';

  // 🧱 Inject game DOM
  gameContainer.innerHTML = `
    <div class="game-frame">
      <img id="modeBackground" class="background-fill" src="assets/img/modes/quickServe/quickserveBG.png" alt="QuickServe Background" loading="eager" />
      <div class="qs-grid">
        <div class="qs-header">
          <h1>🍧 QuickServe Pavilion</h1>
        </div>
        <div class="qs-content">
          <p>Score cones. Stack math. This zone’s live but not wired yet!</p>
        </div>
        <div class="qs-footer">
          <button id="returnToMenu" class="btn-return">🔙 Return to Menu</button>
        </div>
      </div>
    </div>
  `;

  // 🌈 Mobile Repaint Fix
  requestAnimationFrame(() => {
    setTimeout(() => {
      const img = document.getElementById('modeBackground');
      if (img) {
        // 🌀 Force repaint trick
        img.src = img.src;

        // Reset pointer behavior
        img.style.pointerEvents = 'none';
        console.log('🧊 Forced mobile refresh + reset pointer events on modeBackground');
      }
    }, 10); // ⏱️ small tick to paint
  });

  // 🔙 Return to menu cleanup
  const returnBtn = document.getElementById('returnToMenu');
  returnBtn?.addEventListener('click', () => {
    playTransition(() => {
      gameContainer.classList.add('hidden');
      gameContainer.innerHTML = ''; // 💣 nuke game DOM
      menuWrapper?.classList.remove('hidden');

      requestAnimationFrame(() => {
        applyBackgroundTheme(); // 🌌 restore menu image
      });
    });
  });
}
