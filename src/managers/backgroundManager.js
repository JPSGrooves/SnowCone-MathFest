import { appState } from '../data/appState.js';
import { getMenuThemePackage } from '../data/menuThemePackages.js';

export { themeLabels, unlockableThemes } from '../data/menuThemePackages.js';

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

function setMenuBackdropImage(src) {
  if (typeof document === 'undefined') return;
  if (!src || typeof src !== 'string') return;

  const cleanSrc = src.trim();

  // CSS variable stays useful for any older matte/fallback rules.
  document.documentElement.style.setProperty(
    '--scmf-menu-backdrop-image',
    `url("${cleanSrc}")`
  );

  const plate = document.getElementById('menuBackdropPlate');
  const wrapper = document.querySelector('.menu-wrapper');

  if (!plate) {
    console.warn('🍧 No #menuBackdropPlate found for menu plate.');
    return;
  }

  const markReady = () => {
    wrapper?.classList.add('plate-ready');
    console.log('🍧 Menu backdrop plate ready:', cleanSrc);
  };

  const markFailed = () => {
    wrapper?.classList.remove('plate-ready');
    console.warn('🍧 Menu backdrop plate failed, keeping legacy #menuImage:', cleanSrc);
  };

  plate.onload = markReady;
  plate.onerror = markFailed;

  if (plate.getAttribute('src') !== cleanSrc) {
    wrapper?.classList.remove('plate-ready');
    plate.setAttribute('src', cleanSrc);
  } else if (plate.complete && plate.naturalWidth > 0) {
    markReady();
  }

  console.log('🧊 Menu backdrop plate set to:', cleanSrc);
}


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

  // 🧊 iPad/tablet backdrop uses the exact same resolved theme art.
  // This lets the centered 11:16 stage stay untouched while the wider
  // tablet screen gets intentional themed fill behind it.
  setMenuBackdropImage(resolveMenuBackdropFile(theme));

  console.log('🧊 Background set to:', theme, 'file:', bg.src);

  // 🎨 Update label glow colors
  applyLabelColors(theme);
}


function resolveMenuBackdropFile(theme) {
  const pkg = getMenuThemePackage(theme);
  const fallback = getMenuThemePackage('menubackground');

  return pkg.visual?.backgroundPlate
    || fallback.visual?.backgroundPlate
    || 'assets/img/branding/menubackgroundPlate_default.png';
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
  const pkg = getMenuThemePackage(theme);
  const colors = pkg.visual?.labelColors;

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

  // Keep the iPad matte/backdrop synced with manual theme swaps.
  setMenuBackdropImage(resolveMenuBackdropFile(themeName));

  console.log(`🌌 Swapped to theme: ${themeName} (file: ${bg.src})`);
}

// 🧪 dev tool: call from console
window.swapBackground = swapBackground;

// 🎨 Label Color Themes by Background

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

