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
    kids:     '#ffb039', // brighter golden-brown, less dead/dark
    quick:    '#ff9760', // orange sherbet, readable and alive
    tips:     '#36dff5', // stronger aqua-teal
    story:    '#4e92ff', // vivid story blue
    infinity: '#917cfd', // bright violet lake glow
    options:  '#f97ac2'  // blossom pink with enough weight
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
    kids:     '#ff3f3f',
    quick:    '#ffffff',
    tips:     '#f2f6ff',
    story:    '#ffd21f',
    infinity: '#2f9bff', // still blue, but much more readable than #0062ff
    options:  '#ff4a4a'
  },
  halloween: {
    kids:     '#ff9933',
    quick:    '#8620ec',
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
    kids:     '#4dff62',
    quick:    '#ff4747',
    tips:     '#ffffff',
    story:    '#ff75df',
    infinity: '#4eeaff',
    options:  '#ffd84a' // gold reads better at the bottom than blue
  },
  newyear: {
    kids:     '#ffffff', // you said Camping is already the cleanest
    quick:    '#ffe600', // yellow works on blue sky
    tips:     '#39ff14', // slime green, but stronger
    story:    '#996dff', // purple instead of cyan; cyan dies on sky/clouds
    infinity: '#ff4fe3', // hot pink reads against blue/white
    options:  '#7ac5ff'
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
    kids:     '#F2F8FF',
    quick:    '#D9F4FF',
    tips:     '#FFF3B8',
    story:    '#F6D6FF',
    infinity: '#F7FBFF',
    options:  '#CDE7FF'
  }

};

export const titleGlowMap = {
  menubackground: {
    a: '#ffee00',
    b: '#00ffee',
    c: '#ff77ff',
    halo: 'rgba(255, 238, 0, 0.65)'
  },

  spring: {
    a: '#ff8ac8',
    b: '#ffe66d',
    c: '#49d6c9',
    halo: 'rgba(255, 138, 200, 0.6)'
  },

  summer: {
    a: '#ffdd00',
    b: '#ff7a1a',
    c: '#00ddff',
    halo: 'rgba(255, 221, 0, 0.65)'
  },

  fall: {
    a: '#ffb000',
    b: '#8a4b16',
    c: '#ffe066',
    halo: 'rgba(255, 176, 0, 0.7)'
  },

  winter: {
    a: '#ffffff',
    b: '#aaddff',
    c: '#66ccff',
    halo: 'rgba(170, 221, 255, 0.7)'
  },

  freedom: {
    a: '#ff3333',
    b: '#ffffff',
    c: '#0062ff',
    halo: 'rgba(255, 255, 255, 0.7)'
  },

  halloween: {
    a: '#ff8c22',
    b: '#7a2cff',
    c: '#00cc66',
    halo: 'rgba(255, 140, 34, 0.7)'
  },

  christmas: {
    a: '#55de55',
    b: '#ffffff',
    c: '#fa3f3f',
    halo: 'rgba(255, 255, 255, 0.7)'
  },

  valentine: {
    a: '#ffe6f0',
    b: '#ff6699',
    c: '#ff2f6d',
    halo: 'rgba(255, 102, 153, 0.7)'
  },

  cosmic_01: {
    a: '#cc66ff',
    b: '#00ffff',
    c: '#ffcc00',
    halo: 'rgba(204, 102, 255, 0.75)'
  },

  cosmic_02: {
    a: '#ff99cc',
    b: '#33ccff',
    c: '#ccff66',
    halo: 'rgba(51, 204, 255, 0.72)'
  },

  cosmic_03: {
    a: '#ffffff',
    b: '#88ffcc',
    c: '#00cc99',
    halo: 'rgba(136, 255, 204, 0.7)'
  },

  cosmic_04: {
    a: '#aaffff',
    b: '#ffffff',
    c: '#33ccff',
    halo: 'rgba(170, 255, 255, 0.7)'
  },

  cosmic_05: {
    a: '#ffcc00',
    b: '#00ffff',
    c: '#ff33cc',
    halo: 'rgba(255, 51, 204, 0.75)'
  },

  cosmic_06: {
    a: '#7BAFD4',
    b: '#ffccff',
    c: '#C47AE6',
    halo: 'rgba(196, 122, 230, 0.7)'
  },

  cosmic_07: {
    a: '#F2F8FF',
    b: '#CDE7FF',
    c: '#FFF3B8',
    halo: 'rgba(242, 248, 255, 0.72)'
  },

  harvest: {
    a: '#ff4fd8',
    b: '#ffd84f',
    c: '#38f7ff',
    halo: 'rgba(255, 79, 216, 0.72)'
  },

  newyear: {
    a: '#ffffff',
    b: '#7cff00',
    c: '#ff4fb8',
    halo: 'rgba(124, 255, 0, 0.7)'
  }
};

export const themeLabels = {
  menubackground: '🍧 Default',
  fall: '🍂 Fall',
  winter: '❄️ Winter',
  spring: '🌸 Spring',
  summer: '☀️ Summer',
  halloween: '🎃 Halloween',
  harvest: '🎸 Concert',
  christmas: '🎄 Christmas',
  freedom: '🇺🇸 Freedom',
  newyear: '☁️ Clouds',
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
  backgroundPlate: 'assets/img/menu/packages/default/backgroundPlate.png',

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

function resolveMenuPackageId(themeId) {
  return themeId === 'menubackground' ? 'default' : themeId;
}

function getMenuPackageAsset(themeId, filename) {
  const packageId = resolveMenuPackageId(themeId);
  return `assets/img/menu/packages/${packageId}/${filename}`;
}

function buildMenuThemePackage(themeId) {
  const cleanId = typeof themeId === 'string' && themeId.trim()
    ? themeId.trim()
    : 'menubackground';

  return Object.freeze({
    id: cleanId,
    label: themeLabels[cleanId] || themeLabels.menubackground || 'Default',

    visual: Object.freeze({
      ...DEFAULT_MENU_VISUALS,

      // 2027 theme package layer:
      // backgrounds + center cones can vary per theme now.
      // Truck / character / prop stay default for this test pass.
      backgroundPlate: getMenuPackageAsset(cleanId, 'backgroundPlate.png'),
      centerCone: getMenuPackageAsset(cleanId, 'centerCone.png'),

      // Old #menuImage fallback can still match selected theme.
      legacyBackgroundTheme: cleanId,

      // Existing font colors are now part of the package.
      labelColors: Object.freeze(labelColorMap[cleanId] || labelColorMap.menubackground || {}),
      titleGlow: Object.freeze(titleGlowMap[cleanId] || titleGlowMap.menubackground),
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
