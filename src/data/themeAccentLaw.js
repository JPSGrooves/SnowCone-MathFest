// src/data/themeAccentLaw.js
// 🎨 SCMF Theme Accent Law
// One source of truth for theme-responsive UI accent colors.
//
// Used by:
// - Options / Cosmic modal
// - Info modal
// - Infinity Lake
// - future mode intro screens
//
// Keep this boring and centralized on purpose.
// Layout stays in CSS. This file only decides the accent color.

export const THEME_ACCENT_LAW = Object.freeze({
  menubackground: '#00ffee',
  default: '#00ffee',

  fall: '#c98243',

  // Harvest is GREEN by law.
  // Separate from fall so it does not drift brown again.
  harvest: '#79c95a',

  winter: '#9fe8ff',
  freedom: '#9fd7ff',

  spring: '#ff9fcd',

  summer: '#ffe66d',

  halloween: '#ff8a1f',

  concert: '#67d85a',

  christmas: '#8fffd1',

  clouds: '#f7fbff',
  cloud: '#f7fbff',
  newyear: '#f7fbff',
  new_year: '#f7fbff',

  valentine: '#ff82c8',

  cosmic: '#9a7cff',
  cosmic_01: '#9a7cff',
  cosmic_02: '#9a7cff',
  cosmic_03: '#9a7cff',
  cosmic_04: '#9a7cff',
  cosmic_05: '#9a7cff',
  cosmic_06: '#9a7cff',

  // Cosmic 07 is pink by law.
  cosmic_07: '#ff82c8',
  cosmic07: '#ff82c8',
});

export function normalizeThemeAccentId(themeId = 'menubackground') {
  return String(themeId || 'menubackground')
    .trim()
    .toLowerCase()
    .replaceAll('-', '_')
    .replaceAll(' ', '_');
}

export function getThemeAccent(themeId = 'menubackground') {
  const id = normalizeThemeAccentId(themeId);
  const compactId = id.replaceAll('_', '');

  let accent =
    THEME_ACCENT_LAW[id] ||
    THEME_ACCENT_LAW[compactId];

  if (!accent && compactId.startsWith('cosmic')) {
    accent = THEME_ACCENT_LAW.cosmic;
  }

  if (!accent) {
    accent = THEME_ACCENT_LAW.menubackground;
  }

  return {
    id,
    accent,
    glow: `${accent}55`,
    faint: `${accent}22`,
  };
}