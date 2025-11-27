// 📍 src/menu/menu.js — Home base launcher 🍧
import { autorun } from 'mobx';
import { appState } from '../data/appState.js';
import { applyBackgroundTheme } from '../managers/backgroundManager.js';
import '../modals/infoModal.js';
import { playTransition } from '../managers/transitionManager.js';
import { startMode } from '../managers/sceneManager.js';

// 🍄 Secret XP popup helper ("mushroom popper" visual)
function spawnMushroomPopup(label, anchorRect) {
  // ❌ NO LONGER clearing existing popups — let them overlap + stack for spam feedback
  const pop = document.createElement('div');
  pop.className = 'mushroom-pop';
  pop.textContent = label;

  document.body.appendChild(pop);

  // 🎯 X stays centered on the cone
  const cx = anchorRect.left + anchorRect.width / 2;

  // ⬆️ Y gets nudged up so it’s not under your thumb
  const baseCy = anchorRect.top + anchorRect.height / 2;
  const yOffset = Math.min(anchorRect.height * 0.5, 40); // tweak 40 if you want it higher/lower
  const cy = baseCy - yOffset;

  pop.style.left = `${cx}px`;
  pop.style.top = `${cy}px`;

  // kick off animation on next frame
  requestAnimationFrame(() => {
    pop.classList.add('mushroom-pop-live');
  });

  pop.addEventListener(
    'animationend',
    () => {
      pop.remove();
    },
    { once: true }
  );
}

// 🍄 Install the secret cone hitbox on the menu
function installMushroomPopper(menuWrapper) {
  if (!menuWrapper) return;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'mushroom-popper-hitbox';
  btn.setAttribute('aria-label', 'Secret SnowCone XP');

  // spam-friendly: every tap / click = +1 XP
  const handleTap = (ev) => {
    ev.stopPropagation();
    ev.preventDefault();

    try {
      appState.addXP(1); // generic global XP
    } catch (err) {
      console.warn('🍄 Mushroom popper XP failed', err);
    }

    const rect = btn.getBoundingClientRect();
    spawnMushroomPopup('+1 XP', rect);
  };

  // use pointer events so it plays nice across mouse/touch
  btn.addEventListener('pointerdown', handleTap);

  menuWrapper.appendChild(btn);
}

export function setupMenu() {
  const menuWrapper = document.querySelector('.menu-wrapper');
  const menuImage = document.getElementById('menuImage'); // still here if you need it

  applyBackgroundTheme();

  // 🔐 Make sure menu exists before wiring anything else
  if (!menuWrapper) {
    console.error('❌ .menu-wrapper not found – menu setup aborted.');
    return;
  }

  // 🍄 Secret SnowCone XP hot-zone
  installMushroomPopper(menuWrapper);

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
  // openInfoModal is attached globally by infoModal.js
  // eslint-disable-next-line no-undef
  title?.addEventListener('click', () => openInfoModal('info'));

  // 🧊 Theme Autorun (reacts to theme change)
  autorun(() => {
    const theme = appState.settings?.theme;
    applyBackgroundTheme(theme);
  });

  // 🎯 Reset visual lock if returning to menu
  menuWrapper.classList.remove('hidden');
}
