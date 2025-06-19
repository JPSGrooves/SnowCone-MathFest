// 📍 src/menu/menu.js — Home base launcher 🍧

import { applyBackgroundTheme } from '../managers/backgroundManager.js';
import { openInfoModal } from '../managers/infoModal.js';
import { startMode } from '../managers/sceneManager.js';

export function setupMenu() {
  const menuWrapper = document.querySelector('.menu-wrapper');
  const menuImage = document.getElementById('menuImage');

  // 🧊 Lock in that theme background
  applyBackgroundTheme();

  // 🌟 Menu label click handlers
  const labelToMode = {
    kids: 'kids',
    quick: 'quickServe',
    tips: 'mathTips',
    story: 'story',
    infinity: 'infinity',
  };

  Object.entries(labelToMode).forEach(([labelClass, modeName]) => {
    const label = document.querySelector(`.menu-label.${labelClass}`);
    if (label) {
      label.addEventListener('click', () => {
        menuWrapper.classList.add('hidden');
        startMode(modeName);
      });
    }
  });

  // 🎪 Title = Info Modal
  const title = document.querySelector('.menu-title-top');
  title?.addEventListener('click', () => openInfoModal());

  // ✅ Restore menu state if returning
  menuWrapper.classList.remove('hidden');
}
