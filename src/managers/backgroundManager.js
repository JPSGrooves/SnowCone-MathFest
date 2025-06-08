import { getData, setSetting } from '../data/cdms.js';

export function applyBackgroundTheme() {
  const bg = document.getElementById('menuImage');
  if (!bg) {
    console.warn('🍧 No menuImage element found!');
    return;
  }

  const data = getData();
  let theme = data.settings?.theme;

  // fallback if unset or invalid
  if (!theme || typeof theme !== 'string' || theme === 'default') {
    theme = 'menubackground';
    setSetting('theme', theme);
  }

  bg.src = `assets/img/branding/${theme}.png`;
  console.log('🧊 Background set to:', theme);
}
