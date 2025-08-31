// 📦 src/managers/badgeManager.js
import { autorun } from 'mobx';

let store = null; // injected appState lives here

// 🏅 MASTER LIST — badges → optional theme unlock
export const allBadges = {
  // 🌍 Core Progress
  first_steps:    { label: 'First 🍦',        short: 'Get XP',             png: 'snowconebadge.png', unlocks: null },
  math_zen:       { label: 'Zen 🧘',          short: '1000 XP',            png: 'snowconebadge.png', unlocks: 'cosmic_01' },
  mode_tour:      { label: 'Tour 🎪',         short: 'Try Modes',          png: 'snowconebadge.png', unlocks: null },
  theme_swap:     { label: 'Style 🎨',        short: 'Change Theme',       png: 'snowconebadge.png', unlocks: 'summer' },
  listened_music: { label: 'Vibes 🎧',        short: 'Play Music',         png: 'snowconebadge.png', unlocks: null },
  talk_grampy:    { label: 'Chatty Cat 😺',   short: 'Talk to Grampy P',   png: 'snowconebadge.png', unlocks: null },

  // 🧸 Kids Mode
  kids_cars_speed:    { label: 'Grid Sprint 🚗',    short: 'Park cars < 60s',   png: 'snowconebadge.png', unlocks: 'spring' },
  kids_camp_10k:      { label: 'Camper 🏕️',        short: 'Camping 10,000',    png: 'snowconebadge.png', unlocks: 'harvest' },
  kids_mosquito:      { label: 'Mosquito Slayer 🦟',short: 'Squash the skeeter',png: 'snowconebadge.png', unlocks: 'newyear' },
  kids_ants_streak10: { label: 'Ant Nemesis 🐜',    short: 'Beat red ants ×10', png: 'snowconebadge.png', unlocks: 'halloween' },
  kids_tents_all:     { label: 'Starlit Tents ⛺',  short: 'Light all tents',    png: 'snowconebadge.png', unlocks: 'christmas' },

  // ⚡ Quick Serve (25 / 50 / 75 / 100)
  quick_25:   { label: 'QS 25 ⚡',   short: 'QS: 25pts',   png: 'snowconebadge.png', unlocks: null },
  quick_50:   { label: 'QS 50 ⚡',   short: 'QS: 50pts',   png: 'snowconebadge.png', unlocks: 'cosmic_03' },
  quick_75:   { label: 'QS 75 ⚡',   short: 'QS: 75pts',   png: 'snowconebadge.png', unlocks: 'cosmic_05' },
  quick_100:  { label: 'QS 100 ⚡',  short: 'QS: 100pts',  png: 'snowconebadge.png', unlocks: 'cosmic_07' },

  // 🔁 Infinity (25/1m, 50/2m, 100/4m, 250/10m)
  inf_25_1min:   { label: '25 🔁',   short: '25 in 1m',    png: 'snowconebadge.png', unlocks: 'fall' },
  inf_50_2min:   { label: '50 🔁',   short: '50 in 2m',    png: 'snowconebadge.png', unlocks: 'winter' },
  inf_100_4min:  { label: '100 🔁',  short: '100 in 4m',   png: 'snowconebadge.png', unlocks: 'valentine' },
  inf_250_10min: { label: '250 🔁',  short: '250 in 10m',  png: 'snowconebadge.png', unlocks: 'cosmic_06' },

  // 📖 Story (prologue only)
  story_prologue: { label: 'Prologue 📖', short: 'Finish Prologue', png: 'snowconebadge.png', unlocks: 'cosmic_02' },

  // 🏆 Completion
  legend: { label: 'Legend 🏆', short: '100% Game', png: 'snowconebadge.png', unlocks: 'cosmic_04' }
};

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
    'story_prologue'
  ],
  '🏆 Completion': [
    'legend'
  ]
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

  autorun(() => {
    // 👀 explicitly read length so this autorun tracks badge changes
    const _badgeCount = store.profile?.badges?.length || 0;
    const grid = document.getElementById('badgeGrid');
    if (grid) renderBadgeGrid(); // re-render on count change OR when grid exists
  });

  autorun(() => {
    if (!store) return;
    const popup = store.uiState?.pendingBadgePopup;
    if (typeof popup !== 'string' || !popup) return;

    const name = allBadges[popup]?.label || popup;
    const banner = document.createElement('div');
    banner.className = 'badge-banner';
    banner.textContent = `🎉 New badge unlocked: ${name}! Check Options ✨`;
    document.body.appendChild(banner);

    setTimeout(() => banner.remove(), 5000);
    store.clearPendingBadgePopup?.();
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
