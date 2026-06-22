// src/menu/menu.js — Home base launcher 🍧
// Uses sceneManager.startMode() so all modes are lazy-loaded in one place.

import { autorun } from 'mobx';
import { appState } from '../data/appState.js';
import { applyBackgroundTheme } from '../managers/backgroundManager.js';
import '../modals/infoModal.js';
import { playTransition, playMenuModeTransition } from '../managers/transitionManager.js';
import { startMode } from '../managers/sceneManager.js';
import { awardBadge } from '../managers/badgeManager.js'; 
import { hapticTap } from '../utils/haptics.js'; // 📳 tiny cone tap vibes



// src/menu/menu.js

// 🔁 Force the main title's neon animation to restart.
// Safari/WKWebView sometimes "freezes" filter animations
// after modes with heavy CSS/filters. We just toggle the
// animation property inline to kick the keyframes again.
export function restartMenuTitleNeon() {
  const title = document.querySelector('.menu-title-top');
  if (!title) return;

  const hardKick = () => {
    // WKWebView/Kids Camping return fix:
    // CSS owns the themed title glow with !important, so use a CSS reset class
    // instead of relying on inline style.animation = 'none'.
    title.classList.remove('menu-title-neon-rekick');
    title.classList.add('menu-title-neon-hard-reset');

    // Force layout so WebKit commits the no-animation state.
    void title.offsetWidth;

    requestAnimationFrame(() => {
      title.classList.remove('menu-title-neon-hard-reset');

      // Re-add a harmless marker class to force another style recalc.
      title.classList.add('menu-title-neon-rekick');
      void title.offsetWidth;
    });
  };

  hardKick();
  requestAnimationFrame(hardKick);
  setTimeout(hardKick, 120);
  setTimeout(hardKick, 360);
  setTimeout(hardKick, 720);

  setTimeout(() => {
    title.classList.remove('menu-title-neon-rekick');
    title.classList.remove('menu-title-neon-hard-reset');
  }, 1200);
}


function prepareMenuTitleGlowGate(menuWrapper) {
  if (!menuWrapper) return;

  menuWrapper.classList.add('title-glow-gating');
  menuWrapper.classList.remove('title-glow-ready');
}

function revealMenuTitleGlowWhenReady(menuWrapper) {
  if (!menuWrapper) return;

  // Cold launch fix:
  // Do not restart the neon animation here.
  // The restart itself is what causes the startup blink.
  menuWrapper.classList.remove('title-glow-gating');
  menuWrapper.classList.add('title-glow-ready');
}

function installMenuNeonVisibilityWatcher(menuWrapper) {
  if (!menuWrapper || menuWrapper.dataset.neonVisibilityWatcher === '1') return;

  menuWrapper.dataset.neonVisibilityWatcher = '1';

  let pendingKick = 0;

  const kickIfVisible = () => {
    if (menuWrapper.classList.contains('hidden')) return;

    window.clearTimeout(pendingKick);

    requestAnimationFrame(() => {
      restartMenuTitleNeon();
    });

    pendingKick = window.setTimeout(() => {
      restartMenuTitleNeon();
    }, 180);
  };

  const observer = new MutationObserver(kickIfVisible);
  observer.observe(menuWrapper, {
    attributes: true,
    attributeFilter: ['class', 'style']
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) kickIfVisible();
  });

  window.addEventListener('focus', kickIfVisible);

  kickIfVisible();
}



function installMenuNeonReturnWatcher(menuWrapper) {
  if (!menuWrapper || menuWrapper.dataset.neonReturnWatcher === '1') return;

  menuWrapper.dataset.neonReturnWatcher = '1';

  let wasHidden = menuWrapper.classList.contains('hidden');
  let armed = false;
  let pendingKick = 0;

  // Arm after cold menu reveal has settled.
  window.setTimeout(() => {
    armed = true;
    wasHidden = menuWrapper.classList.contains('hidden');
  }, 900);

  const maybeKickAfterReturn = () => {
    const isHidden = menuWrapper.classList.contains('hidden');

    if (isHidden) {
      wasHidden = true;
      return;
    }

    // Do not kick on first cold launch.
    if (!armed) return;

    // Only kick when the menu was actually hidden before.
    if (!wasHidden) return;

    wasHidden = false;
    window.clearTimeout(pendingKick);

    pendingKick = window.setTimeout(() => {
      requestAnimationFrame(() => {
        restartMenuTitleNeon();
      });
    }, 90);
  };

  const observer = new MutationObserver(maybeKickAfterReturn);
  observer.observe(menuWrapper, {
    attributes: true,
    attributeFilter: ['class', 'style']
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && armed && !menuWrapper.classList.contains('hidden')) {
      maybeKickAfterReturn();
    }
  });

  window.addEventListener('focus', () => {
    if (armed && !menuWrapper.classList.contains('hidden')) {
      maybeKickAfterReturn();
    }
  });
}

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
    ev?.stopPropagation?.();
    ev?.preventDefault?.();

    // 📳 Soft, spam-safe tap haptic
    try {
      hapticTap();
    } catch (err) {
      console.warn('🍄 Mushroom popper haptic failed', err);
    }

    try {
      // +1 XP per tap (existing behavior)
      appState.addXP(1);

      // 🧮 Track lifetime cone taps via flags
      const prev = typeof appState.getFlag === 'function'
        ? Number(appState.getFlag('menuConeClicks', 0) || 0)
        : Number((appState.flags && appState.flags.menuConeClicks) || 0);

      const next = prev + 1;

      if (typeof appState.setFlag === 'function') {
        appState.setFlag('menuConeClicks', next);
      } else {
        appState.flags = appState.flags || {};
        appState.flags.menuConeClicks = next;
      }

      // 🌀 Legendary Cone: Cone Clicker (1000 taps)
      if (next >= 1000) {
        awardBadge('leg_menu_cone_clicker');
      }
    } catch (err) {
      console.warn('🍄 Mushroom popper XP/Legendary failed', err);
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

  
  prepareMenuTitleGlowGate(menuWrapper);
applyBackgroundTheme();

  if (!menuWrapper) {
    console.error('❌ .menu-wrapper not found – menu setup aborted.');
    return;
  }

  installMushroomPopper(menuWrapper);
  installHighScoreHitbox(menuWrapper);
  installMenuNeonReturnWatcher(menuWrapper);

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
      playMenuModeTransition(() => {
        menuWrapper.classList.add('hidden');

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
  title?.addEventListener('click', () => {
    if (window.openInfoModal) {
      console.log('🪩 Title clicked – opening info modal via global');
      window.openInfoModal(); // no need for the 'info' arg
    } else {
      console.warn('⚠️ window.openInfoModal not found');
    }
  });


  autorun(() => {
    const theme = appState.settings?.theme;
    applyBackgroundTheme(theme);
  });

  menuWrapper.classList.remove('hidden');

  // Cold launch: reveal title without restarting the animation.
  revealMenuTitleGlowWhenReady(menuWrapper);
}
function openHighScoreOverlay() {
  const overlay = document.getElementById('highScoreOverlay');
  const dimmer  = document.getElementById('cosmicOverlay');
  if (!overlay || !dimmer) return;

  const profile = appState.profile || {};
  const stats   = appState.stats || {};

  // 🏕️ Camping: lifetime best, not current run
  const campingScore =
    typeof profile.campingHighScore === 'number'
      ? profile.campingHighScore
      : 0;

  // 🍔 QuickServe: profile high score, then stats fallback
  const quickServeScore =
    typeof profile.qsHighScore === 'number'
      ? profile.qsHighScore
      : (stats.quickServe?.topScore ?? 0);

  // ♾️ Infinity Lake: keep BOTH raw high score (local only) and longest streak
  const infinityScore =
    typeof profile.infinityHighScore === 'number'
      ? profile.infinityHighScore
      : (stats.infinityLake?.topScore ?? 0);

  const infinityStreak =
    typeof profile.infinityLongestStreak === 'number'
      ? profile.infinityLongestStreak
      : 0;

  // 🎯 Hook up the visual slots
  const campingEl  = document.getElementById('hsCampingScore');
  const quickEl    = document.getElementById('hsQuickServeScore');
  const infinityEl = document.getElementById('hsInfinityScore');
  const streakEl   = document.getElementById('hsInfinityStreak');

  if (campingEl)  campingEl.textContent  = campingScore;
  if (quickEl)    quickEl.textContent    = quickServeScore;
  if (infinityEl) infinityEl.textContent = infinityScore;
  if (streakEl)   streakEl.textContent   = infinityStreak;

  // 📳 Tiny haptic nudge when the high score sheet appears
  try {
    hapticTap();
  } catch (err) {
    console.warn('🏆 High score haptic failed (safe to ignore):', err);
  }

  document.body.classList.add('modal-open');
  dimmer.classList.remove('hidden');
  overlay.classList.remove('hidden');
}

function closeHighScoreOverlay() {
  const overlay = document.getElementById('highScoreOverlay');
  const dimmer  = document.getElementById('cosmicOverlay');
  if (!overlay || !dimmer) return;

  try {
    hapticTap(); // same tiny tap vibe you use on open
  } catch (err) {
    console.warn('🏆 High score close haptic failed (safe to ignore):', err);
  }

  overlay.classList.add('hidden');
  dimmer.classList.add('hidden');
  document.body.classList.remove('modal-open');
}
// 🏆 Install High Score hitbox over the truck
// 🏆 Install High Score hitbox over the truck
// 🏆 Install High Score hitbox over the truck
// 🏆 Install High Score hitbox over the truck
function installHighScoreHitbox(menuWrapper) {
  if (!menuWrapper) return;

  const btn      = menuWrapper.querySelector('.menu-highscore-hitbox');
  const overlay  = document.getElementById('highScoreOverlay');
  const closeBtn = overlay?.querySelector('.hs-close-btn');
  const dimmer   = document.getElementById('cosmicOverlay');

  if (!btn || !overlay) return;

  // ✅ Use CLICK instead of pointerdown so the target element
  // is locked before the dimmer/overlay appear.
  const handleClick = (ev) => {
    ev?.preventDefault?.();
    ev?.stopPropagation?.();
    openHighScoreOverlay();
  };

  btn.addEventListener('click', handleClick);

  // ✖ explicit close button
  closeBtn?.addEventListener('click', (ev) => {
    ev?.preventDefault?.();
    closeHighScoreOverlay();
  });

  // 🌌 click on the cosmic dimmer also closes (for consistency)
  dimmer?.addEventListener('click', () => {
    if (!overlay.classList.contains('hidden')) {
      closeHighScoreOverlay();
    }
  });

  // 🖱️ Click anywhere outside the card to close
  overlay.addEventListener('click', (ev) => {
    // Only close if the click is *not* inside the card
    if (!ev.target.closest('.hs-card')) {
      closeHighScoreOverlay();
    }
  });
}
