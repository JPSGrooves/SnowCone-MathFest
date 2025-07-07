import { appState } from '../data/appState.js';

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

  bg.src = `assets/img/branding/${theme}.png`;
  console.log('🧊 Background set to:', theme);

  // 🎨 Update label glow colors
  applyLabelColors(theme);
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
    console.warn("🚨 No #menuImage found to swap.");
    return;
  }

  appState.setSetting('theme', themeName); // 🧠 persist new theme
  bg.src = `assets/img/branding/${themeName}.png`;
  console.log(`🌌 Swapped to theme: ${themeName}`);
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
    kids:     '#cc66ff',
    quick:    '#00cc99',
    tips:     '#ffcc66',
    story:    '#ff66aa',
    infinity: '#66ddff',
    options:  '#9999cc'
  },
  summer: {
    kids:     '#ffdd00',
    quick:    '#ff6600',
    tips:     '#33cc33',
    story:    '#ff3399',
    infinity: '#00ddff',
    options:  '#ff9933'
  },
  fall: {
    kids:     '#ffaa00',
    quick:    '#ff6600',
    tips:     '#66cc33',
    story:    '#cc6633',
    infinity: '#ffffff',
    options:  '#663300'
  },
  winter: {
    kids:     '#aaddff',
    quick:    '#ffffff',
    tips:     '#66ffff',
    story:    '#ddddff',
    infinity: '#66ccff',
    options:  '#ccccff'
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
    kids:     '#ffcc00',
    quick:    '#996633',
    tips:     '#cc9900',
    story:    '#993300',
    infinity: '#ffffff',
    options:  '#333300'
  },
  christmas: {
    kids:     '#00dd00',
    quick:    '#dd0000',
    tips:     '#ffffff',
    story:    '#ff66cc',
    infinity: '#aaaaaa',
    options:  '#006600'
  },
  newyear: {
    kids:     '#ffffff',
    quick:    '#ffcc00',
    tips:     '#999999',
    story:    '#330066',
    infinity: '#ff00ff',
    options:  '#111111'
  },
  valentine: {
    kids:     '#ff6699',
    quick:    '#cc0066',
    tips:     '#ffcccc',
    story:    '#990033',
    infinity: '#ffe6f0',
    options:  '#660033'
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
    options:  '#005577'
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
    kids:     '#000000',
    quick:    '#ff0000',
    tips:     '#ffccff',
    story:    '#330033',
    infinity: '#ff99ff',
    options:  '#9900cc'
  },
  cosmic_07: {
    kids:     '#ffffff',
    quick:    '#ffffff',
    tips:     '#ffffff',
    story:    '#ffffff',
    infinity: '#ffffff',
    options:  '#ffffff'
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

