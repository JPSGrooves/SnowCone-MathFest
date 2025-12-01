// src/menu/menu.js — Home base launcher 🍧
// Uses sceneManager.startMode() so all modes are lazy-loaded in one place.

import { autorun } from 'mobx';
import { appState } from '../data/appState.js';
import { applyBackgroundTheme } from '../managers/backgroundManager.js';
import '../modals/infoModal.js';
import { playTransition } from '../managers/transitionManager.js';
import { startMode } from '../managers/sceneManager.js';

// 🍄 Secret XP popup helper ("mushroom popper" visual)
function spawnMushroomPopup(label, anchorRect) {
  const pop = document.createElement('div');
  pop.className = 'mushroom-pop';
  pop.textContent = label;

  document.body.appendChild(pop);

  const cx = anchorRect.left + anchorRect.width / 2;
  const baseCy = anchorRect.top + anchorRect.height / 2;
  const yOffset = Math.min(anchorRect.height * 0.5, 40);
  const cy = baseCy - yOffset;

  pop.style.left = `${cx}px`;
  pop.style.top = `${cy}px`;

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

  const handleTap = (ev) => {
    ev.stopPropagation();
    ev.preventDefault();

    try {
      appState.addXP(1);
    } catch (err) {
      console.warn('🍄 Mushroom popper XP failed', err);
    }

    const rect = btn.getBoundingClientRect();
    spawnMushroomPopup('+1 XP', rect);
  };

  btn.addEventListener('pointerdown', handleTap);

  menuWrapper.appendChild(btn);
}

/**
 * 🔢 Fill high score panel with current profile values
 * Right now we feature Infinity Lake (canonical high score).
 * You can extend this later for QuickServe / Kids / Story.
 */
function fillHighScoreValues(root) {
  const profile = appState.profile || {};

  const getNum = (key, fallback = 0) =>
    typeof profile[key] === 'number' ? profile[key] : fallback;

  const map = {
    infHigh: getNum('infinityHighScore', 0),
    infStreak: getNum('infinityLongestStreak', 0),
  };

  Object.entries(map).forEach(([dataKey, val]) => {
    const span = root.querySelector(`[data-stat="${dataKey}"]`);
    if (span) span.textContent = String(val);
  });
}

/**
 * 🏆 High score overlay (sits over the truck on main menu)
 */

export function setupMenu() {
  const menuWrapper = document.querySelector('.menu-wrapper');

  applyBackgroundTheme();

  if (!menuWrapper) {
    console.error('❌ .menu-wrapper not found – menu setup aborted.');
    return;
  }

  installMushroomPopper(menuWrapper);
  installHighScoreHitbox(menuWrapper);


  const labelToMode = {
    kids: 'kids',
    quick: 'quickServe',
    tips: 'mathtips',
    story: 'story',
    infinity: 'infinity',
  };

  Object.entries(labelToMode).forEach(([labelClass, modeName]) => {
    const label = document.querySelector(`.menu-label.${labelClass}`);
    if (!label) return;

    label.addEventListener('click', () => {
      menuWrapper.classList.add('hidden');

      playTransition(() => {
        console.log(`🚀 Launching mode: ${modeName}`);
        appState.setLastPlayed(Date.now());
        appState.setMode(modeName);
        startMode(modeName);
      });
    });
  });

  // 🏆 High Scores button (between Infinity Lake and Options in markup)
  const highScoreLabel = document.querySelector('.menu-label.highscores');
  if (highScoreLabel) {
    highScoreLabel.addEventListener('click', () => {
      // Stay on main menu – just show overlay over the truck
      openHighScoreOverlay();
    });
  }

  const title = document.querySelector('.menu-title-top');
  // openInfoModal is attached globally by infoModal.js
  // eslint-disable-next-line no-undef
  title?.addEventListener('click', () => openInfoModal('info'));

  autorun(() => {
    const theme = appState.settings?.theme;
    applyBackgroundTheme(theme);
  });

  menuWrapper.classList.remove('hidden');
}
// 🏆 High Score overlay helpers
function openHighScoreOverlay() {
  const overlay = document.getElementById('highScoreOverlay');
  const dimmer  = document.getElementById('cosmicOverlay');
  if (!overlay || !dimmer) return;

  const campingScore =
    typeof appState.popCount === 'number' ? appState.popCount : 0;

  const quickServeScore =
    appState.profile?.qsHighScore ??
    appState.stats?.quickServe?.topScore ??
    0;

  const infinityScore =
    appState.profile?.infinityHighScore ?? 0;

  const infinityStreak =
    appState.profile?.infinityLongestStreak ?? 0;

  const campingEl  = document.getElementById('hsCampingScore');
  const quickEl    = document.getElementById('hsQuickServeScore');
  const infinityEl = document.getElementById('hsInfinityScore');
  const streakEl   = document.getElementById('hsInfinityStreak');

  if (campingEl)  campingEl.textContent  = campingScore;
  if (quickEl)    quickEl.textContent    = quickServeScore;
  if (infinityEl) infinityEl.textContent = infinityScore;
  if (streakEl)   streakEl.textContent   = infinityStreak;

  document.body.classList.add('modal-open');
  dimmer.classList.remove('hidden');
  overlay.classList.remove('hidden');
}

function closeHighScoreOverlay() {
  const overlay = document.getElementById('highScoreOverlay');
  const dimmer  = document.getElementById('cosmicOverlay');
  if (!overlay || !dimmer) return;

  overlay.classList.add('hidden');
  dimmer.classList.add('hidden');
  document.body.classList.remove('modal-open');
}
// 🏆 Install High Score hitbox over the truck
// 🏆 Install High Score hitbox over the truck
function installHighScoreHitbox(menuWrapper) {
  if (!menuWrapper) return;

  const btn     = menuWrapper.querySelector('.menu-highscore-hitbox');
  const overlay = document.getElementById('highScoreOverlay');
  const closeBtn = overlay?.querySelector('.hs-close-btn');
  const dimmer   = document.getElementById('cosmicOverlay');

  if (!btn || !overlay) return;

  const handleTap = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    openHighScoreOverlay();
  };

  btn.addEventListener('pointerdown', handleTap);

  // ✖ explicit close button
  closeBtn?.addEventListener('click', (ev) => {
    ev.preventDefault();
    closeHighScoreOverlay();
  });

  // 🌌 click on the cosmic dimmer also closes (for consistency)
  dimmer?.addEventListener('click', () => {
    if (!overlay.classList.contains('hidden')) {
      closeHighScoreOverlay();
    }
  });

  // 🖱️ NEW: click anywhere outside the card to close
  overlay.addEventListener('click', (ev) => {
    // if the click is NOT inside .hs-card, close it
    if (!ev.target.closest('.hs-card')) {
      closeHighScoreOverlay();
    }
  });
}
