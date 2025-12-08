// 📦 src/managers/badgeManager.js
import { autorun } from 'mobx';
import { allBadges as badgeDefs } from '../data/badges.js';

export const allBadges = badgeDefs;

let store = null;

// 🗂️ Grouping for the grid UI
const grouped = {
  '🌍 Core Progress': [
    'first_steps','math_zen','mode_tour','theme_swap','listened_music','talk_grampy'
  ],
  '🦖 Camping Games': [
    'kids_cars_speed','kids_camp_10k','kids_mosquito','kids_ants_streak10','kids_tents_all'
  ],
  '⚡ QuickServe': [
    'quick_25','quick_50','quick_75','quick_100'
  ],
  '🔁 Infinity Lake': [
    'inf_25_1min','inf_50_2min','inf_100_4min','inf_250_10min'
  ],
  '📖 Story Forest': [
    'story_prologue',
    'story_ch1',
    'story_ch2',
    'story_ch3',
    'story_ch4',
    'story_ch5',
  ],
  '🌀 Legendary Cones': [
    'legend',
    'leg_festival_regular',
    'leg_streak30',
    'leg_infinity_flow',
    'leg_dual_endings',
    'leg_menu_cone_clicker',
  ],
};


// 🔐 helpers
function hasBadge(id) {
  return !!store?.profile?.badges?.includes(id);
}
function ensureUnlockedThemesArray() {
  const prof = store?.profile;
  if (!prof) return [];
  if (!Array.isArray(prof.unlockedThemes)) prof.unlockedThemes = [];
  return prof.unlockedThemes;
}
function unlockThemeIfAny(id) {
  const theme = allBadges[id]?.unlocks;
  if (!theme) return;
  const unlocked = ensureUnlockedThemesArray();
  if (!unlocked.includes(theme)) unlocked.push(theme);
  // optional: auto-switch theme when unlocked
  // store.setSetting?.('theme', theme);
}

// 🎁 public API
// src/managers/badgeManager.js
const BADGE_ALIAS = { play_music: 'listened_music' };

export function awardBadge(id) {
  if (!store) { console.warn('badgeManager not initialized yet'); return false; }
  const canonical = BADGE_ALIAS[id] || id;
  if (!canonical || store.profile.badges.includes(canonical)) return false;
  if (!allBadges[canonical]) { console.warn('Unknown badge id:', canonical); return false; }

  store.unlockBadge?.(canonical);
  const unlockTheme = allBadges[canonical]?.unlocks;
  if (unlockTheme) store.unlockTheme?.(unlockTheme);
  return true;
}



// 🧩 render grid (can be called on demand)
export function renderBadgeGrid() {
  const grid = document.getElementById('badgeGrid');
  if (!grid || !store) return;

  grid.innerHTML = '';

  for (const [title, badgeKeys] of Object.entries(grouped)) {
    const groupWrapper = document.createElement('div');
    groupWrapper.classList.add('badge-group');

    const section = document.createElement('div');
    section.classList.add('badge-section');
    section.textContent = title;
    groupWrapper.appendChild(section);

    const groupGrid = document.createElement('div');
    groupGrid.classList.add('badge-grid');

    badgeKeys.forEach(id => {
      const badge = allBadges[id];
      const unlocked = hasBadge(id);

      const tile = document.createElement('div');
      tile.classList.add('badge-tile');
      if (unlocked) tile.classList.add('unlocked');

      const img = document.createElement('img');
      img.className = 'badge-img';
      img.src = unlocked
        ? `${import.meta.env.BASE_URL || '/'}assets/img/icons/${badge.png}`
        : `${import.meta.env.BASE_URL || '/'}assets/img/icons/cone_locked.png`;
      img.alt = badge.label;
      tile.appendChild(img);

      const short = document.createElement('div');
      short.className = 'badge-short';
      short.textContent = badge.short || '?????';
      tile.appendChild(short);

      if (unlocked) {
        const label = document.createElement('div');
        label.className = 'badge-label';
        label.textContent = badge.label;
        tile.appendChild(label);
      }

      groupGrid.appendChild(tile);
    });

    groupWrapper.appendChild(groupGrid);
    grid.appendChild(groupWrapper);
  }
}

// 🚀 init after appState exists (no circular import)
export function initBadgeManager(appStateRef) {
  store = appStateRef;

  // 🌀 Re-render badge grid whenever badge count changes
  autorun(() => {
    const _badgeCount = store.profile?.badges?.length || 0;
    const grid = document.getElementById('badgeGrid');
    if (grid) renderBadgeGrid();
  });

  // 🎉 Badge popup banner
  autorun(() => {
    if (!store) return;
    const popup = store.uiState?.pendingBadgePopup;
    if (typeof popup !== 'string' || !popup) return;

    const name = allBadges[popup]?.label || popup;
    const banner = document.createElement('div');
    banner.className = 'badge-banner';
    banner.textContent = `🎉 New badge unlocked: ${name}! Check Options ✨`;
    banner.style.pointerEvents = 'none';
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-live', 'polite');
    document.body.appendChild(banner);

    setTimeout(() => banner.remove(), 5000);
    store.clearPendingBadgePopup?.();
  });

  // 🌙/🏕️ Legendary Cones from daily streak
  autorun(() => {
    if (!store) return;
    const streak = Number(store.profile?.streakDays ?? 0);

    // 7-day: Festival Regular 🌙
    if (streak >= 7) {
      try { awardBadge('leg_festival_regular'); } catch (e) {
        console.warn('[badges] failed to award leg_festival_regular', e);
      }
    }

    // 30-day: Festival Local 🏕️
    if (streak >= 30) {
      try { awardBadge('leg_streak30'); } catch (e) {
        console.warn('[badges] failed to award leg_streak30', e);
      }
    }
  });
}
// 🔔 JUKEBOX-ONLY "play music" badge

(function setupJukeboxBadgeOnce() {
  const once = () => {
    try { awardBadge?.('listened_music'); } catch {}
    document.removeEventListener('sc:jukebox-play', once, true);
  };
  document.addEventListener('sc:jukebox-play', once, true);
})();
