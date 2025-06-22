import { autorun } from 'mobx';
import { appState } from '../data/appState.js';

export const allBadges = {
  // Exploration + Completion
  first_steps:        { label: 'First 🍦',        short: 'Get XP',        png: 'snowconebadge.png', unlocks: null },
  math_zen:           { label: 'Zen 🧘',          short: '100 XP',        png: 'snowconebadge.png', unlocks: 'cosmic_01' },
  mode_tour:          { label: 'Tour 🎪',         short: 'Try Modes',     png: 'snowconebadge.png', unlocks: null },
  theme_swap:         { label: 'Style 🎨',        short: 'Change Theme',  png: 'snowconebadge.png', unlocks: 'summer' },
  listened_music:     { label: 'Vibes 🎧',        short: 'Play Music',    png: 'snowconebadge.png', unlocks: 'cosmic_02' },

  // Kids Mode
  kids_place_car:     { label: 'Grid 🚗',         short: 'Place Car',     png: 'snowconebadge.png', unlocks: 'spring' },
  kids_match_master:  { label: 'Match 🔢',        short: 'Match Game',    png: 'snowconebadge.png', unlocks: 'freedom' },

  // Quick Serve
  quick_50:           { label: 'QS 50 ⚡',         short: 'QS: 50pts',     png: 'snowconebadge.png', unlocks: null },
  quick_100:          { label: 'QS 100 ⚡',        short: 'QS: 100pts',    png: 'snowconebadge.png', unlocks: 'cosmic_03' },
  quick_200:          { label: 'QS 200 ⚡',        short: 'QS: 200pts',    png: 'snowconebadge.png', unlocks: 'cosmic_07' },
  quick_300:          { label: 'QS 300 ⚡',        short: 'QS: 300pts',    png: 'snowconebadge.png', unlocks: 'cosmic_05' },

  // Infinity Mode
  inf_50_1min:        { label: '50 🔁',           short: '50 in 1m',      png: 'snowconebadge.png', unlocks: 'harvest' },
  inf_100_2min:       { label: '100 🔁',          short: '100 in 2m',     png: 'snowconebadge.png', unlocks: 'winter' },
  inf_250_4min:       { label: '250 🔁',          short: '250 in 4m',     png: 'snowconebadge.png', unlocks: 'christmas' },
  inf_600_10min:      { label: '600 🔁',          short: '600 in 10m',    png: 'snowconebadge.png', unlocks: 'valentine' },

  // Story Mode
  story_started:      { label: 'Enter 📖',        short: 'Start Story',   png: 'snowconebadge.png', unlocks: null },
  story_finished:     { label: 'Clear 🌲',        short: 'Finish Story',  png: 'snowconebadge.png', unlocks: 'fall' },
  story_perfect:      { label: 'Perfect ✔️',      short: 'No Mistakes',   png: 'snowconebadge.png', unlocks: 'cosmic_06' },
  story_cat:          { label: 'Cat 🐱',          short: 'Find Cat',      png: 'snowconebadge.png', unlocks: 'newyear' },
  story_phil:         { label: 'Phil 👽',         short: 'Meet Phil',     png: 'snowconebadge.png', unlocks: 'halloween' },

  // Final Completion
  legend:             { label: 'Legend 🏆',       short: '100% Game',     png: 'snowconebadge.png', unlocks: 'cosmic_04' }
};

const grouped = {
  '🌍 Core Progress': ['first_steps', 'math_zen', 'mode_tour', 'theme_swap', 'listened_music'],
  '🧸 Kids Cones': ['kids_place_car', 'kids_match_master'],
  '⚡ Quick Serve': ['quick_50', 'quick_100', 'quick_200', 'quick_300'],
  '🎮 Infinity Mode': ['inf_50_1min', 'inf_100_2min', 'inf_250_4min', 'inf_600_10min'],
  '🧠 Story Mode': ['story_started', 'story_finished', 'story_perfect', 'story_cat', 'story_phil'],
  '🏆 Completion': ['legend']
};

export function renderBadgeGrid() {
  const grid = document.getElementById('badgeGrid');
  if (!grid) return;

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
      const unlocked = appState.profile.badges.includes(id);

      const tile = document.createElement('div');
      tile.classList.add('badge-tile');
      if (unlocked) tile.classList.add('unlocked');

      const img = document.createElement('img');
      img.className = 'badge-img';
      img.src = unlocked
        ? `${import.meta.env.BASE_URL}assets/img/icons/${badge.png}`
        : `${import.meta.env.BASE_URL}assets/img/icons/cone_locked.png`;
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

// 🔁 Auto-render when badge state changes
autorun(() => {
  const grid = document.getElementById('badgeGrid');
  if (grid) renderBadgeGrid();
});

// 🛎️ Auto-popup when badge is earned
autorun(() => {
  const popup = appState.uiState.pendingBadgePopup;
  if (popup && typeof popup === 'string') {
    const banner = document.createElement('div');
    banner.className = 'badge-banner';
    banner.textContent = `🎉 New badge unlocked: ${popup}! Check Options ✨`;
    document.body.appendChild(banner);

    setTimeout(() => banner.remove(), 5000);
    appState.clearPendingBadgePopup();
  }
});
