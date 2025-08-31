// 📦 src/data/badges.js
// Source of truth for badge definitions used across the app.

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

// Handy constant for UIs (e.g., Math Tips intro bubble)
export const TOTAL_BADGES = Object.keys(allBadges).length; // → 21
