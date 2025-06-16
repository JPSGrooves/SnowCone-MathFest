import './quickServe.css'; // 🍦 QuickServe styles
import { applyBackgroundTheme } from '../../managers/backgroundManager.js';

export function loadQuickServe() {
  console.log("🍧 Loading QuickServe Mode");

  const menuWrapper = document.querySelector('.menu-wrapper');
  const gameContainer = document.getElementById('game-container');

  // ❌ Kill menu
  menuWrapper?.classList.add('hidden');

  // ✅ Show game zone
  gameContainer.classList.remove('hidden');
  gameContainer.style.display = 'flex';
  gameContainer.innerHTML = `
    <div class="game-frame">
      <img src="assets/img/modes/quickServe/quickserveBG.png" class="qs-bg" alt="QuickServe Background" />
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

  // 🔙 Return to main menu
  const returnBtn = document.getElementById('returnToMenu');
  returnBtn?.addEventListener('click', () => {
    gameContainer.classList.add('hidden');
    gameContainer.innerHTML = ''; // 🧼 clean slate
    menuWrapper?.classList.remove('hidden');
    applyBackgroundTheme(); // 🍭 restore background
  });
}
