// src/data/menuThemePackages.js
// 🍧 Menu Theme Package Data
//
// Theme packages are visual loadouts.
// Living Truck behavior stays separate.
// Themes may inform dialogue, but they do not own sim state.

export const labelColorMap = {
  menubackground: {
    kids:     '#ff77ff',
    quick:    '#00ffee',
    tips:     '#ffee00',
    story:    '#ff4488',
    infinity: '#88ccff',
    options:  '#cccccc'
  },
  spring: {
    kids:     '#ebc2ff',
    quick:    '#ffebc2',
    tips:     '#c2f1ff',
    story:    '#c2f1ff',
    infinity: '#d4d4ed',
    options:  '#ffc2dd'
  },
  summer: {
    kids:     '#ffdd00',  // same
    quick:    '#ff8f2b',  // a tad brighter than #ff7a1a
    tips:     '#3ad63a',  // just a tad brighter than #33cc33
    story:    '#ff99e6',  // brighter than #ff66cc
    infinity: '#00ddff',  // same
    options:  '#fff2e6'   // basically white (soft warm tint)
  },

  fall: {
    kids:     '#ffaa00',
    quick:    '#ff6600',
    tips:     '#66cc33',
    story:    '#cc6633',
    infinity: '#ffffff',
    options:  '#a377cc'
  },
  winter: {
    kids:     '#aaddff',
    quick:    '#ccccff',
    tips:     '#66ffff',
    story:    '#ddddff',
    infinity: '#ffffff',
    options:  '#66ccff'
  },
  freedom: {
    kids:     '#ff4444',
    quick:    '#ffffff',
    tips:     '#3366ff',
    story:    '#ffcc00',
    infinity: '#bbbbbb',
    options:  '#ff4444'
  },
  halloween: {
    kids:     '#ff9933',
    quick:    '#6600cc',
    tips:     '#00cc66',
    story:    '#cc0000',
    infinity: '#dddddd',
    options:  '#ff4444'
  },
  harvest: {
    kids:     '#ffcc00',   // (keep)
    quick:    '#FFF2CC',   // ← creamy light so it pops
    tips:     '#FFE9A6',   // ← warm pale gold
    story:    '#FFD27F',   // ← peachy light
    infinity: '#ffffff',   // (keep)
    options:  '#FFD8B0'  // ← true near-black for real contrast
  },
  christmas: {
    kids:     '#00dd00',
    quick:    '#dd0000',
    tips:     '#ffffff',
    story:    '#ff66cc',
    infinity: '#aaaaaa',
    options:  '#ccccff'
  },
  newyear: {
    kids:     '#A98BEF', // good
    quick:    '#ffcc00', // good
    tips:     '#ffcc00', // was #999999 → lighter, closer to white
    story:    '#A98BEF', // was #330066 → much lighter purple
    infinity: '#ff00ff', // good
    options:  '#E0E0E0'  // was #111111 → light gray for dark bg
  },
  valentine: {
    kids:     '#ffe6f0',
    quick:    '#ffe6f0',
    tips:     '#ffcccc',
    story:    '#ffcccc',
    infinity: '#ffe6f0',
    options:  '#ff6699'
  },
  cosmic_01: {
    kids:     '#cc66ff',
    quick:    '#00ffff',
    tips:     '#ffcc00',
    story:    '#ff6699',
    infinity: '#ffffff',
    options:  '#9999ff'
  },
  cosmic_02: {
    kids:     '#ff99cc',
    quick:    '#33ccff',
    tips:     '#ccff66',
    story:    '#ff66cc',
    infinity: '#cccccc',
    options:  '#6666ff'
  },
  cosmic_03: {
    kids:     '#ffffff',
    quick:    '#88ffcc',
    tips:     '#00cc99',
    story:    '#66ccff',
    infinity: '#ccffff',
    options:  '#333399'
  },
  cosmic_04: {
    kids:     '#aaffff',
    quick:    '#ffffff',
    tips:     '#66ccff',
    story:    '#99ccff',
    infinity: '#33ccff',
    options:  '#66ccff'
  },
  cosmic_05: {
    kids:     '#ffcc00',
    quick:    '#ff9900',
    tips:     '#00ffff',
    story:    '#ff33cc',
    infinity: '#ffffff',
    options:  '#ff0066'
  },
  cosmic_06: {
    kids:     '#7BAFD4', // Tar Heel blue (Carolina)
    quick:    '#ff0000',
    tips:     '#ffccff',
    story:    '#D8A0B2', // very light maroon/rose
    infinity: '#ff99ff',
    options:  '#C47AE6'  // lighter purple than #9900cc
  },
cosmic_07: {
  kids:     '#F2F8FF', // near-white, whisper of blue
  quick:    '#F2F8FF',
  tips:     '#F2F8FF',
  story:    '#EDF5FF', // hair darker for readability
  infinity: '#F7FBFF', // almost pure white
  options:  '#EDF6FF'
}

};

export const themeLabels = {
  menubackground: '🌌 Default',
  fall: '🍂 Fall',
  winter: '❄️ Winter',
  spring: '🌸 Spring',
  summer: '☀️ Summer',
  halloween: '🎃 Halloween',
  harvest: '🌽 Harvest',
  christmas: '🎄 Christmas',
  freedom: '🎆 Freedom',
  newyear: '🎊 New Year',
  valentine: '💘 Valentine',
  cosmic_01: '🌀 Cosmic 01',
  cosmic_02: '🌀 Cosmic 02',
  cosmic_03: '🌀 Cosmic 03',
  cosmic_04: '🌀 Cosmic 04',
  cosmic_05: '🌀 Cosmic 05',
  cosmic_06: '🌀 Cosmic 06',
  cosmic_07: '🌀 Abery’s Cone'
};

export const unlockableThemes = [
  'fall',
  'winter',
  'spring',
  'summer',
  'halloween',
  'harvest',
  'christmas',
  'newyear',
  'valentine',
  'cosmic_01',
  'cosmic_02',
  'cosmic_03',
  'cosmic_04',
  'cosmic_05',
  'cosmic_06',
  'cosmic_07'
];

const DEFAULT_MENU_VISUALS = Object.freeze({
  backgroundPlate: 'assets/img/branding/menubackgroundPlate_default.png',

  // Legacy fallback: old baked menu map image.
  // Kept for browser fallback and safety while the 2027 plate system grows.
  legacyBackgroundTheme: 'menubackground',

  // Future actor slots.
  // These stay null until the PNGs exist.
  truckBack: 'assets/img/menu/packages/default/truckBack.png',
  truckFront: 'assets/img/menu/packages/default/truckFront.png',
  centerCone: 'assets/img/menu/packages/default/centerCone.png',
  character: 'assets/img/menu/packages/default/character.png',
  prop: 'assets/img/menu/packages/default/themeProp.png',
});

const THEME_VIBES = Object.freeze({
  menubackground: {
    season: 'neutral',
    weatherTone: 'clear-night',
    holidayTag: null,
    greetingHints: [
      'Clear sky over the stand tonight.',
      'Festival lights are humming.',
    ],
  },
  spring: {
    season: 'spring',
    weatherTone: 'fresh',
    holidayTag: null,
    greetingHints: ['Spring air at the stand today.'],
  },
  summer: {
    season: 'summer',
    weatherTone: 'hot',
    holidayTag: null,
    greetingHints: ['Hot one today. Perfect snow cone weather.'],
  },
  fall: {
    season: 'fall',
    weatherTone: 'cool',
    holidayTag: null,
    greetingHints: ['Cool breeze rolling through the festival.'],
  },
  winter: {
    season: 'winter',
    weatherTone: 'cold',
    holidayTag: null,
    greetingHints: ['Cold today! Snow cones still hit different.'],
  },
  halloween: {
    season: 'fall',
    weatherTone: 'spooky',
    holidayTag: 'halloween',
    greetingHints: ['Spooky night at the stand.'],
  },
  harvest: {
    season: 'fall',
    weatherTone: 'harvest',
    holidayTag: 'harvest',
    greetingHints: ['Harvest lights are glowing today.'],
  },
  christmas: {
    season: 'winter',
    weatherTone: 'cold',
    holidayTag: 'christmas',
    greetingHints: ['Cold today!', 'Christmas lights are doing most of the math tonight.'],
  },
  freedom: {
    season: 'summer',
    weatherTone: 'fireworks',
    holidayTag: 'fourth',
    greetingHints: ['Happy Fourth!', 'Fireworks over the stand tonight.'],
  },
  newyear: {
    season: 'winter',
    weatherTone: 'midnight',
    holidayTag: 'newyear',
    greetingHints: ['New year, new cone energy.'],
  },
  valentine: {
    season: 'winter',
    weatherTone: 'sweet',
    holidayTag: 'valentine',
    greetingHints: ['Sweet little festival night today.'],
  },
  cosmic_01: {
    season: 'cosmic',
    weatherTone: 'cosmic',
    holidayTag: null,
    greetingHints: ['Cosmic weather rolling in.'],
  },
  cosmic_02: {
    season: 'cosmic',
    weatherTone: 'cosmic',
    holidayTag: null,
    greetingHints: ['Cosmic weather rolling in.'],
  },
  cosmic_03: {
    season: 'cosmic',
    weatherTone: 'cosmic',
    holidayTag: null,
    greetingHints: ['Cosmic weather rolling in.'],
  },
  cosmic_04: {
    season: 'cosmic',
    weatherTone: 'cosmic',
    holidayTag: null,
    greetingHints: ['Cosmic weather rolling in.'],
  },
  cosmic_05: {
    season: 'cosmic',
    weatherTone: 'cosmic',
    holidayTag: null,
    greetingHints: ['Cosmic weather rolling in.'],
  },
  cosmic_06: {
    season: 'cosmic',
    weatherTone: 'cosmic',
    holidayTag: null,
    greetingHints: ['Cosmic weather rolling in.'],
  },
  cosmic_07: {
    season: 'cosmic',
    weatherTone: 'abery',
    holidayTag: null,
    greetingHints: ['Abery’s cone energy is high today.'],
  },
});

function buildMenuThemePackage(themeId) {
  const cleanId = typeof themeId === 'string' && themeId.trim()
    ? themeId.trim()
    : 'menubackground';

  return Object.freeze({
    id: cleanId,
    label: themeLabels[cleanId] || themeLabels.menubackground || 'Default',

    visual: Object.freeze({
      ...DEFAULT_MENU_VISUALS,

      // For now, every theme keeps the default plate until its own plate exists.
      // Later: replace per package, not with scattered CSS.
      backgroundPlate: DEFAULT_MENU_VISUALS.backgroundPlate,

      // Old #menuImage fallback can still match selected theme.
      legacyBackgroundTheme: cleanId,

      // Existing font colors are now part of the package.
      labelColors: Object.freeze(labelColorMap[cleanId] || labelColorMap.menubackground || {}),
    }),

    vibe: Object.freeze(THEME_VIBES[cleanId] || THEME_VIBES.menubackground),
  });
}

export const MENU_THEME_PACKAGES = Object.freeze(
  Object.fromEntries(
    Object.keys(themeLabels).map((themeId) => [
      themeId,
      buildMenuThemePackage(themeId),
    ])
  )
);

export function getMenuThemePackage(themeId = 'menubackground') {
  const cleanId = typeof themeId === 'string' && themeId.trim()
    ? themeId.trim()
    : 'menubackground';

  return MENU_THEME_PACKAGES[cleanId] || MENU_THEME_PACKAGES.menubackground;
}

export function getMenuThemeVibe(themeId = 'menubackground') {
  return getMenuThemePackage(themeId).vibe;
}

export function getMenuThemeVisuals(themeId = 'menubackground') {
  return getMenuThemePackage(themeId).visual;
}
