import { appState } from '../data/appState.js';

// 🧠 Mirror the platform flag from main.js
const PLATFORM = import.meta.env.VITE_PLATFORM || 'web';

// 🍎 Per-theme iOS art overrides
const IOS_THEME_FILES = {
  // default map screen
  menubackground: 'menubackgroundiOS.png', // note the capital B

  // seasons / holidays
  spring:     'springiOS.png',
  summer:     'summeriOS.png',
  fall:       'falliOS.png',
  winter:     'winteriOS.png',
  halloween:  'halloweeniOS.png',
  harvest:    'harvestiOS.png',
  christmas:  'christmasiOS.png',
  newyear:    'newyeariOS.png',
  valentine:  'valentineiOS.png',
  freedom:    'freedomiOS.png',

  // cosmic variants
  cosmic_01: 'cosmic_01iOS.png',
  cosmic_02: 'cosmic_02iOS.png',
  cosmic_03: 'cosmic_03iOS.png',
  cosmic_04: 'cosmic_04iOS.png',
  cosmic_05: 'cosmic_05iOS.png',
  cosmic_06: 'cosmic_06iOS.png',
  cosmic_07: 'cosmic_07iOS.png', // safe even if you add this one later
};


export function applyBackgroundTheme() {
  const bg = document.getElementById('menuImage');
  if (!bg) {
    console.warn('🍧 No menuImage element found!');
    return;
  }

  let theme = appState.settings.theme;

  if (!theme || typeof theme !== 'string' || theme === 'default') {
    theme = 'menubackground';
    appState.setSetting('theme', theme);
  }

  // 🚧 guard: if locked, fall back to default
  if (!appState.hasTheme(theme)) {
    console.warn('🔒 Theme locked, falling back:', theme);
    theme = 'menubackground';
    appState.setSetting('theme', theme);
  }

  // 🍎 iOS gets different art *for the same theme name*
  bg.src = resolveMenuBackgroundFile(theme);
  console.log('🧊 Background set to:', theme, 'file:', bg.src);

  // 🎨 Update label glow colors
  applyLabelColors(theme);
}

function resolveMenuBackgroundFile(theme) {
  let filename;

  // 🍎 If we’re in the iOS build and have a custom file, use that
  if (PLATFORM === 'ios' && IOS_THEME_FILES[theme]) {
    filename = IOS_THEME_FILES[theme];
  } else {
    // otherwise fall back to the shared web asset (theme.png)
    filename = `${theme}.png`;
  }

  return `assets/img/branding/${filename}`;
}
function applyLabelColors(theme) {
  const colors = labelColorMap[theme];
  if (!colors) return;

  Object.entries(colors).forEach(([key, color]) => {
    const label = document.querySelector(`.menu-label.${key}`);
    if (label) label.style.color = color;
  });
}

export function swapBackground(themeName) {
  const bg = document.getElementById('menuImage');
  if (!bg) {
    console.warn('🚨 No #menuImage found to swap.');
    return;
  }

  appState.setSetting('theme', themeName); // 🧠 persist new theme
  bg.src = resolveMenuBackgroundFile(themeName);

  console.log(`🌌 Swapped to theme: ${themeName} (file: ${bg.src})`);
}

// 🧪 dev tool: call from console
window.swapBackground = swapBackground;

// 🎨 Label Color Themes by Background
const labelColorMap = {
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

window.setTheme = (themeName) => {
  appState.setSetting('theme', themeName);
  applyBackgroundTheme();
};

document.getElementById('labelQuickServe')?.addEventListener('click', () => {
  startMode('quickServe');
});

export function swapModeBackground(fullPathToFile) {
  const bg = document.getElementById('modeBackground');
  if (!bg) {
    console.warn("🚨 No #modeBackground found to swap.");
    return;
  }

  bg.src = '';
  bg.offsetHeight; // force reflow
  bg.src = `${import.meta.env.BASE_URL}${fullPathToFile}`;

  console.log(`🌌 Mode background swapped to: ${fullPathToFile}`);
}

