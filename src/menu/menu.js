// 📍 src/menu/menu.js — Home base launcher 🍧
import { autorun } from 'mobx';
import { appState } from '../data/appState.js';
import { applyBackgroundTheme } from '../managers/backgroundManager.js';
import '../modals/infoModal.js';
import { playTransition } from '../managers/transitionManager.js';
import { startMode } from '../managers/sceneManager.js';

export function setupMenu() {
  const menuWrapper = document.querySelector('.menu-wrapper');
  const menuImage = document.getElementById('menuImage');

  applyBackgroundTheme();

  const labelToMode = {
    kids: 'kids',
    quick: 'quickServe',
    tips: 'mathtips',
    story: 'story',
    infinity: 'infinity',
  };

  // 🚀 Mode Launch Binding
  Object.entries(labelToMode).forEach(([labelClass, modeName]) => {
    const label = document.querySelector(`.menu-label.${labelClass}`);
    if (label) {
      label.addEventListener('click', () => {
        menuWrapper.classList.add('hidden');
        playTransition(() => {
          console.log(`🚀 Launching mode: ${modeName}`);
          appState.setLastPlayed(Date.now()); // or modeName if that’s what you wanna track
          appState.setMode(modeName);
          startMode(modeName);
        });
      });
    }
  });

  // ℹ️ Info Modal via Title Click
  const title = document.querySelector('.menu-title-top');
  title?.addEventListener('click', () => openInfoModal('info'));

  // 🧊 Theme Autorun (reacts to theme change)
  autorun(() => {
    const theme = appState.settings?.theme;
    applyBackgroundTheme(theme);
  });

  // 🎯 Reset visual lock if returning to menu
  menuWrapper.classList.remove('hidden');
}
