// themesTab.js

import { getData, setSetting } from '../data/cdms.js';
import { unlockableThemes, themeLabels } from '../managers/backgroundManager.js';

export function renderThemesTab() {
  const data = getData();
  const currentTheme = data.settings.theme;
  const unlocked = data.profile?.unlockedThemes || [];

  let html = '<div class="theme-grid">';

  Object.keys(themeLabels).forEach(themeId => {
    const label = themeLabels[themeId];
    const isUnlocked = themeId === 'menubackground' || unlocked.includes(themeId);
    const active = currentTheme === themeId ? 'active' : '';

    html += `
      <div class="theme-tile ${isUnlocked ? '' : 'locked'} ${active}" data-theme="${themeId}">
        <div class="theme-preview" style="background-image:url('assets/img/branding/${themeId}.png')"></div>
        <div class="theme-label">${label}</div>
        ${!isUnlocked ? '<div class="theme-lock">🔒</div>' : ''}
      </div>
    `;
  });

  html += '</div>';
  return html;
}

// 🔥 Must be called after renderThemesTab injection
export function setupThemesTabUI() {
  const tiles = document.querySelectorAll('.theme-tile');
  if (!tiles.length) {
    console.warn('🌀 No theme tiles found to bind');
    return;
  }

  tiles.forEach(tile => {
    if (!tile.classList.contains('locked')) {
      tile.addEventListener('click', () => {
        const theme = tile.dataset.theme;
        console.log(`🎨 Theme selected: ${theme}`);
        setSetting('theme', theme);
        location.reload(); // reloads to reapply labelColorMap + bg
      });
    }
  });
}
