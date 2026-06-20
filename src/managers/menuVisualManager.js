// src/managers/menuVisualManager.js
// 🍧 Menu Visual Manager
//
// Applies menu scene package visuals to stable DOM slots.
// This is visual loadout only.
// Living Truck behavior stays separate.

import { getMenuThemePackage } from '../data/menuThemePackages.js';

const ACTOR_SLOTS = Object.freeze({
  truckBack: 'menuTruckBack',
  character: 'menuCharacter',
  truckFront: 'menuTruckFront',
  prop: 'menuThemeProp',
  centerCone: 'menuCenterCone',
});

function setActorImage(slotId, src) {
  if (typeof document === 'undefined') return;

  const img = document.getElementById(slotId);
  if (!img) {
    console.warn(`🍧 Missing menu actor slot: #${slotId}`);
    return;
  }

  if (!src || typeof src !== 'string') {
    img.removeAttribute('src');
    img.classList.remove('is-visible');
    img.classList.add('is-empty');
    return;
  }

  const cleanSrc = src.trim();

  img.onload = () => {
    img.classList.add('is-visible');
    img.classList.remove('is-empty');
    console.log(`🍧 Menu actor ready: #${slotId}`, cleanSrc);
  };

  img.onerror = () => {
    img.classList.remove('is-visible');
    img.classList.add('is-empty');
    console.warn(`🍧 Menu actor failed: #${slotId}`, cleanSrc);
  };

  if (img.getAttribute('src') !== cleanSrc) {
    img.classList.remove('is-visible');
    img.classList.remove('is-empty');
    img.setAttribute('src', cleanSrc);
  } else if (img.complete && img.naturalWidth > 0) {
    img.classList.add('is-visible');
    img.classList.remove('is-empty');
  }
}

function applyMenuTitleGlow(titleGlow = {}) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  const glowA = titleGlow.a || '#ffee00';
  const glowB = titleGlow.b || '#00ffee';
  const glowC = titleGlow.c || '#ff77ff';
  const halo = titleGlow.halo || 'rgba(255, 238, 0, 0.65)';

  root.style.setProperty('--scmf-title-glow-a', glowA);
  root.style.setProperty('--scmf-title-glow-b', glowB);
  root.style.setProperty('--scmf-title-glow-c', glowC);
  root.style.setProperty('--scmf-title-glow-halo', halo);
}

export function applyMenuVisualPackage(themeId = 'menubackground') {
  const pkg = getMenuThemePackage(themeId);
  const visuals = pkg.visual || {};
  applyMenuTitleGlow(visuals.titleGlow);

  Object.entries(ACTOR_SLOTS).forEach(([visualKey, slotId]) => {
    setActorImage(slotId, visuals[visualKey]);
  });

  document.documentElement.dataset.menuThemePackage = pkg.id;

  // Lightweight bridge for future Living Truck dialogue.
  window.SCMF_CURRENT_MENU_THEME_PACKAGE = pkg;

  console.log('🍧 Menu visual package applied:', pkg.id);
  return pkg;
}
