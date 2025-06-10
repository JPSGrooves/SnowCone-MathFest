import { getData, setSetting } from '../data/cdms.js';

export function applyBackgroundTheme() {
  const bg = document.getElementById('menuImage');
  if (!bg) {
    console.warn('🍧 No menuImage element found!');
    return;
  }

  const data = getData();
  let theme = data.settings?.theme;

  if (!theme || typeof theme !== 'string' || theme === 'default') {
    theme = 'menubackground';
    setSetting('theme', theme);
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

  if (typeof setSetting === 'function') {
    setSetting('theme', themeName); // 🧠 persist new theme
  }

  bg.src = `assets/img/branding/${themeName}.png`;
  console.log(`🌌 Swapped to theme: ${themeName}`);
}

// 🧪 dev tool: call from console
window.swapBackground = swapBackground;

// 🎨 Label Color Themes by Background
const labelColorMap = {
  cosmic_07: {
    kids:     '#ffffff',
    quick:    '#ffffff',
    tips:     '#ffffff',
    story:    '#ffffff',
    infinity: '#ffffff',
    options:  '#ffffff'
  },
  fall: {
    kids: '#ffaa00',
    quick: '#ff6600',
    tips: '#66cc33',
    story: '#cc6633',
    infinity: '#ffffff',
    options: '#663300'
  },
  // Add more as needed...
};
