import { getData } from '../data/cdms.js';

export const allBadges = {
  // Exploration + Completion (5)
  first_steps:        { label: 'First 🍦',        short: 'Get XP',        png: 'snowconebadge.png', unlocks: null },
  math_zen:           { label: 'Zen 🧘',          short: '100 XP',        png: 'snowconebadge.png', unlocks: 'cosmic_01' },
  mode_tour:          { label: 'Tour 🎪',         short: 'Try Modes',     png: 'snowconebadge.png', unlocks: null },
  theme_swap:         { label: 'Style 🎨',        short: 'Change Theme',  png: 'snowconebadge.png', unlocks: 'summer' },
  listened_music:     { label: 'Vibes 🎧',        short: 'Play Music',    png: 'snowconebadge.png', unlocks: 'cosmic_02' },

  // Kids Mode (2)
  kids_place_car:     { label: 'Grid 🚗',         short: 'Place Car',     png: 'snowconebadge.png', unlocks: 'spring' },
  kids_match_master:  { label: 'Match 🔢',        short: 'Match Game',    png: 'snowconebadge.png', unlocks: 'freedom' },

  // Quick Serve (4)
  quick_50:           { label: 'QS 50 ⚡',         short: 'QS: 50pts',     png: 'snowconebadge.png', unlocks: null },
  quick_100:          { label: 'QS 100 ⚡',        short: 'QS: 100pts',    png: 'snowconebadge.png', unlocks: 'cosmic_03' },
  quick_200:          { label: 'QS 200 ⚡',        short: 'QS: 200pts',    png: 'snowconebadge.png', unlocks: 'cosmic_07' },
  quick_300:          { label: 'QS 300 ⚡',        short: 'QS: 300pts',    png: 'snowconebadge.png', unlocks: 'cosmic_05' },

  // Infinity Mode (4)
  inf_50_1min:        { label: '50 🔁',           short: '50 in 1m',      png: 'snowconebadge.png', unlocks: 'harvest' },
  inf_100_2min:       { label: '100 🔁',          short: '100 in 2m',     png: 'snowconebadge.png', unlocks: 'winter' },
  inf_250_4min:       { label: '250 🔁',          short: '250 in 4m',     png: 'snowconebadge.png', unlocks: 'christmas' },
  inf_600_10min:      { label: '600 🔁',          short: '600 in 10m',    png: 'snowconebadge.png', unlocks: 'valentine' },

  // Story Mode (5)
  story_started:      { label: 'Enter 📖',        short: 'Start Story',   png: 'snowconebadge.png', unlocks: null },
  story_finished:     { label: 'Clear 🌲',        short: 'Finish Story',  png: 'snowconebadge.png', unlocks: 'fall' },
  story_perfect:      { label: 'Perfect ✔️',      short: 'No Mistakes',   png: 'snowconebadge.png', unlocks: 'cosmic_06' },
  story_cat:          { label: 'Cat 🐱',          short: 'Find Cat',      png: 'snowconebadge.png', unlocks: 'newyear' },
  story_phil:         { label: 'Phil 👽',         short: 'Meet Phil',     png: 'snowconebadge.png', unlocks: 'halloween' },

  // Final Completion (1)
  legend:             { label: 'Legend 🏆',       short: '100% Game',     png: 'snowconebadge.png', unlocks: 'cosmic_04' }
};



export function renderBadgeGrid() {
  const grid = document.getElementById('badgeGrid');
  const data = getData();
  if (!grid) return;

  grid.innerHTML = ''; // clear old grid

  const grouped = {
    '🌍 Core Progress': ['first_steps', 'math_zen', 'mode_tour', 'theme_swap', 'listened_music'],
    '🧸 Kids Cones': ['kids_place_car', 'kids_match_master'],
    '⚡ Quick Serve': ['quick_50', 'quick_100', 'quick_200', 'quick_300'],
    '🎮 Infinity Mode': ['inf_50_1min', 'inf_100_2min', 'inf_250_4min', 'inf_600_10min'],
    '🧠 Story Mode': ['story_started', 'story_finished', 'story_perfect', 'story_cat', 'story_phil'],
    '🏆 Completion': ['legend']
  };

  for (const [sectionTitle, badgeKeys] of Object.entries(grouped)) {
    const groupWrapper = document.createElement('div');
    groupWrapper.classList.add('badge-group');

    const section = document.createElement('div');
    section.classList.add('badge-section');
    section.textContent = sectionTitle;
    groupWrapper.appendChild(section);

    const groupGrid = document.createElement('div');
    groupGrid.classList.add('badge-grid');

    badgeKeys.forEach(id => {
      const info = allBadges[id];
      const tile = document.createElement('div');
      tile.classList.add('badge-tile');

      const unlocked = data.profile.badges?.includes(id);

      const img = document.createElement('img');
      img.classList.add('badge-img');
      img.src = unlocked
        ? `${import.meta.env.BASE_URL}assets/img/icons/${info.png}`
        : `${import.meta.env.BASE_URL}assets/img/icons/cone_locked.png`;
      img.alt = info.label;
      tile.appendChild(img);

      const shortLabel = document.createElement('div');
      shortLabel.classList.add('badge-short');
      shortLabel.textContent = info.short || '?????';
      tile.appendChild(shortLabel);

      if (unlocked) {
        const label = document.createElement('div');
        label.classList.add('badge-label');
        label.textContent = info.label;
        tile.appendChild(label);
        tile.classList.add('unlocked');
      }

      groupGrid.appendChild(tile);
    });

    groupWrapper.appendChild(groupGrid);
    grid.appendChild(groupWrapper);
  }
}
