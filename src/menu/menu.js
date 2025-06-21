// 📍 src/menu/menu.js — Home base launcher 🍧

import { applyBackgroundTheme } from '../managers/backgroundManager.js';
import '../modals/infoModal.js';
import { playTransition } from '../managers/transitionManager.js';
import { startMode } from '../managers/sceneManager.js'; // ✅ You need this

export function setupMenu() {
  const menuWrapper = document.querySelector('.menu-wrapper');
  const menuImage = document.getElementById('menuImage');

  applyBackgroundTheme();

  const labelToMode = {
    kids: 'kids',
    quick: 'quickServe',
    tips: 'mathtips',   // 👈 'mathTips' was wrong casing before
    story: 'story',
    infinity: 'infinity',
  };

  Object.entries(labelToMode).forEach(([labelClass, modeName]) => {
    const label = document.querySelector(`.menu-label.${labelClass}`);
    if (label) {
      label.addEventListener('click', () => {
        console.log(`✨ Transitioning to ${modeName}`);
        menuWrapper.classList.add('hidden');
        playTransition(() => {
          console.log(`🚀 Launching mode: ${modeName}`);
          startMode(modeName);
        });
      });
    }
  });

  const title = document.querySelector('.menu-title-top');
  title?.addEventListener('click', () => openInfoModal('info'));

  // ✅ This brings the labels back if they were hidden
  menuWrapper.classList.remove('hidden');
}

