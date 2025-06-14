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
  // 🌌 Default Theme adjust
  menubackground: {
    kids:     '#ff77ff',
    quick:    '#00ffee',
    tips:     '#ffee00',
    story:    '#ff4488',
    infinity: '#88ccff',
    options:  '#cccccc'
  },

  // 🌸 Spring – Bloom Beam adjust a bit
  spring: {
    kids:     '#cc66ff', // lavender
    quick:    '#00cc99', // mint green
    tips:     '#ffcc66', // pastel orange
    story:    '#ff66aa', // pink blossom
    infinity: '#66ddff', // sky blue
    options:  '#9999cc'  // soft violet
  },

  // ☀️ Summer – Solar Lick adjust story
  summer: {
    kids:     '#ffdd00', // sunny yellow
    quick:    '#ff6600', // creamsicle orange
    tips:     '#33cc33', // watermelon rind
    story:    '#ff3399', // hot pink
    infinity: '#00ddff', // pool water
    options:  '#ff9933'  // mango glaze
  },

  // 🍂 Fall – Maple Drip looks decent but adjust
  fall: {
    kids:     '#ffaa00', // pumpkin spice
    quick:    '#ff6600', // autumn blaze
    tips:     '#66cc33', // mossy green
    story:    '#cc6633', // maple bark
    infinity: '#ffffff', // neutral
    options:  '#663300'  // dark bark
  },

  // ❄️ Winter – Frost Spiral
  winter: {
    kids:     '#aaddff', // ice blue
    quick:    '#ffffff', // frost white
    tips:     '#66ffff', // glacial aqua
    story:    '#ddddff', // pale purple
    infinity: '#66ccff', // chilly cyan
    options:  '#ccccff'  // snow violet
  },

  // 🎆 Freedom – Firework Fizz (4th of July)
  freedom: {
    kids:     '#ff4444', // red pop
    quick:    '#ffffff', // stars
    tips:     '#3366ff', // blue blast
    story:    '#ffcc00', // sparkler gold
    infinity: '#bbbbbb', // smoke glow
    options:  '#222222'  // night sky
  },

  // 🎃 Halloween – Ghoulberry Hex
  halloween: {
    kids:     '#ff9933', // pumpkin
    quick:    '#6600cc', // witchy purple
    tips:     '#00cc66', // slime green
    story:    '#cc0000', // haunted red
    infinity: '#dddddd', // bone white
    options:  '#000000'  // void
  },

  // 🌽 Harvest – Cornucopia Crunch adjust story and qs
  harvest: {
    kids:     '#ffcc00', // corn gold
    quick:    '#996633', // gravy brown
    tips:     '#cc9900', // yam crust
    story:    '#993300', // cranberry rust
    infinity: '#ffffff', // neutral
    options:  '#333300'  // olive stem
  },

  // 🎄 Christmas – Merry Mint adjust qs and inf
  christmas: {
    kids:     '#00dd00', // pine green
    quick:    '#dd0000', // ornament red
    tips:     '#ffffff', // snow white
    story:    '#ff66cc', // candy pink
    infinity: '#aaaaaa', // silver bell
    options:  '#006600'  // dark pine
  },

  // 🎊 New Year – Midnight Pop adjust story
  newyear: {
    kids:     '#ffffff', // fireworks pop
    quick:    '#ffcc00', // champagne gold
    tips:     '#999999', // metallic silver
    story:    '#330066', // midnight purple
    infinity: '#ff00ff', // neon burst
    options:  '#111111'  // dark mode
  },

  // 💘 Valentine – Heart Melt adjust all maybe remake bg
  valentine: {
    kids:     '#ff6699', // bubblegum pink
    quick:    '#cc0066', // lipstick
    tips:     '#ffcccc', // soft blush
    story:    '#990033', // rose heart
    infinity: '#ffe6f0', // dreamy fog
    options:  '#660033'  // deep romance
  },
  // 🌀 Cosmic 01 – Nebula Swirl (10 XP)
  cosmic_01: {
    kids:     '#cc66ff', // violet burst
    quick:    '#00ffff', // aqua star
    tips:     '#ffcc00', // nebula core
    story:    '#ff6699', // pink gas cloud
    infinity: '#ffffff', // stellar white
    options:  '#9999ff'  // soft starlight
  },

  // 🌀 Cosmic 02 – Fractal Bloom (Story Clear)
  cosmic_02: {
    kids:     '#ff99cc', // bloom petal
    quick:    '#33ccff', // electric blue
    tips:     '#ccff66', // lime fractal
    story:    '#ff66cc', // glitch pink
    infinity: '#cccccc', // static white
    options:  '#6666ff'  // recursive indigo
  },

  // 🌀 Cosmic 03 – Logic Pulse (Math Zen Badge)
  cosmic_03: {
    kids:     '#ffffff', // focus white
    quick:    '#88ffcc', // calm mint
    tips:     '#00cc99', // theorem teal
    story:    '#66ccff', // thought ripple
    infinity: '#ccffff', // silent pulse
    options:  '#333399'  // deep logic core
  },

  // 🌀 Cosmic 04 – Galactic Ice (QuickServe Top Score) adjust infiinty 
  cosmic_04: {
    kids:     '#aaffff', // crystal frost
    quick:    '#ffffff', // flash ice
    tips:     '#66ccff', // glacier streak
    story:    '#99ccff', // chill zone
    infinity: '#33ccff', // subzero trail
    options:  '#005577'  // deep cold logic
  },

  // 🌀 Cosmic 05 – Coneverse Prime (All Modes Tried)
  cosmic_05: {
    kids:     '#ffcc00', // core energy
    quick:    '#ff9900', // cone sun
    tips:     '#00ffff', // hyper glow
    story:    '#ff33cc', // deep cone lore
    infinity: '#ffffff', // echo white
    options:  '#ff0066'  // coneverse axis
  },

  // 🌀 Cosmic 06 – Singularity Scoop (100% XP Bar)
  cosmic_06: {
    kids:     '#000000', // event horizon
    quick:    '#ff0000', // danger math
    tips:     '#ffccff', // anomaly pink
    story:    '#330033', // void bloom
    infinity: '#ff99ff', // glitch static
    options:  '#9900cc'  // singularity core
  },

  // 🌀 Cosmic 07 – Abery’s Cone (fifth badge? 🌀💖) adjust all
  cosmic_07: {
    kids:     '#ffffff', // gentle halo
    quick:    '#ffffff', // fave pink
    tips:     '#ffffff', // dream math
    story:    '#ffffff', // memory bloom
    infinity: '#ffffff', // soft fog
    options:  '#ffffff'  // Abery's aura
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
  'freedom',
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
  setSetting('theme', themeName);
  applyBackgroundTheme();
};
