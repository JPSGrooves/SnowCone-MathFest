// 🍦 main.js   - Import core systems
import { applyBackgroundTheme } from './managers/backgroundManager.js';
import { openModal } from './modals/cosmicModal.js';
import './modals/infoModal.js'; // ⛩️ just runs, no export
import { Howler } from 'howler';
import { autorun } from 'mobx';
import { appState } from './data/appState.js';
import { titleGlowMap } from './data/menuThemePackages.js';
import { setupMenu } from './menu/menu.js'; // ⬅️ this wires transitions
import { playTransition } from './managers/transitionManager.js'; // still available if needed
import { initBadgeManager } from './managers/badgeManager.js';
import { startAchievementsWatcher } from './achievementsWatcher.js';

import { wireMusicVisibilityGuard } from './managers/musicVisibility.js';
import { renderFestivalWelcomeOnStartup } from './ui/festivalWelcomeView.js'; 
import { installJsCrashCatcher } from './utils/jsCrashCatcher.js';

import { initRankManager } from './managers/rankManager.js';


installJsCrashCatcher();


// 🍧 Anti–Double-Tap Zoom Shield (esp. iOS Safari)
let lastTouchTime = 0;
document.addEventListener(
  'touchend',
  (e) => {
    const now = new Date().getTime();
    if (now - lastTouchTime <= 300) e.preventDefault();
    lastTouchTime = now;
  },
  true
);

// 🛡️ Extra Safari Gesture Block (prevents zoom glitching)
document.addEventListener('gesturestart', (e) => {
  e.preventDefault();
});
document.addEventListener('gesturechange', (e) => {
  e.preventDefault();
});
document.addEventListener('gestureend', (e) => {
  e.preventDefault();
});

// 🔐 Optional: Vite env check
// This is a build charm / sanity check, not a real secret.
// VITE_* values are bundled into the app, so never put real passwords here.
if (import.meta.env?.VITE_SECRET_KEY) {
  if (import.meta.env.DEV) {
    console.log('🔐 SCMF build charm loaded ✅');
  }
} else {
  console.warn('🚨 No SCMF build charm found. Is .env missing?');
}

// 🧠 Platform flag: 'web' (browser) or 'ios' (Capacitor build)
// eslint-disable-next-line no-undef
const PLATFORM = import.meta.env.VITE_PLATFORM || 'web';

if (PLATFORM === 'ios') {
  document.documentElement.classList.add('platform-ios');
  console.log('📱 Running inside iOS shell (platform-ios)');
}


// tag <html data-platform="web|ios"> so CSS can branch
document.documentElement.dataset.platform = PLATFORM;
console.log('🧠 SnowCone platform:', PLATFORM);

function primeStartupTitleGlowVars(themeId = appState.settings?.theme || 'menubackground') {
  const glow = titleGlowMap?.[themeId] || titleGlowMap?.menubackground;

  if (!glow) {
    console.warn('⚠️ No startup title glow map found for theme:', themeId);
    return;
  }

  const root = document.documentElement;

  root.style.setProperty('--scmf-title-glow-a', glow.a);
  root.style.setProperty('--scmf-title-glow-b', glow.b);
  root.style.setProperty('--scmf-title-glow-c', glow.c);
  root.style.setProperty('--scmf-title-glow-halo', glow.halo);

  root.dataset.scmfTitleGlowPrimed = themeId;

  if (import.meta.env.DEV) {
    console.log('✨ Startup title glow primed:', themeId);
  }
}

// Prime theme glow before DOMContentLoaded/menu animation can flash default colors.
primeStartupTitleGlowVars();

// 🌍 Inject favicons with proper base path
const base = import.meta.env.BASE_URL;

const links = [
  { rel: 'icon', type: 'image/x-icon', href: `${base}favicon.ico` },
  { rel: 'icon', type: 'image/png', sizes: '192x192', href: `${base}icon-192.png` },
  { rel: 'icon', type: 'image/png', sizes: '512x512', href: `${base}icon-512.png` },
  { rel: 'apple-touch-icon', href: `${base}apple-touch-icon.png` },
  { rel: 'manifest', href: `${base}manifest.json` },
];

links.forEach((attrs) => {
  const link = document.createElement('link');
  Object.entries(attrs).forEach(([key, val]) => link.setAttribute(key, val));
  document.head.appendChild(link);
});

// ✅ OPTIONAL: tiny in-file test kit (so you don't need a separate file)
function attachDevHarness() {
  const w = globalThis || window;
  w.appState = appState; // <-- console: appState.setTheme('summer')

  // lightweight badge/xp helpers
  w.scTest = {
    award: (id) => import('./managers/badgeManager.js').then((m) => m.awardBadge(id)),
    playJukebox: () => document.dispatchEvent(new Event('sc:jukebox-play', { bubbles: true })),
    addStory: (n) => appState.addStoryXP(n),
    addKids: (n) => appState.addKidsCampingXP(n),
    addQS: (n) => appState.addQuickServeXP(n),
    addInf: (n) => appState.addInfinityXP(n),
    breakdown: async () => {
      const { computeCompletionBreakdown } = await import('./managers/completionManager.js');
      const b = computeCompletionBreakdown(appState);
      console.table(b.xp.buckets);
      console.log(b);
      return b;
    },
  };
  console.log('✅ Dev globals: appState, scTest');
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('📦 DOM ready. Starting app...');
  initBadgeManager(appState);          // 1) init badge store
  initRankManager(appState);           // 2) watch Cone Rank changes
  startAchievementsWatcher(appState);  // 3) wire autoruns AFTER managers
  if (import.meta.env.DEV) attachDevHarness();

  // Re-prime once after app boot state settles, before applying full menu theme.
  primeStartupTitleGlowVars();

  applyBackgroundTheme();
  console.log('🎨 Background applied.');

  autorun(() => {
    Howler.volume(appState.settings.mute ? 0 : 1);
    console.log('🔊 MobX mute autorun ran.');
  });

  // 🔊 Wire tab-visibility → music auto-pause/resume once at startup
  wireMusicVisibilityGuard();

  const startup = document.getElementById('startup-screen');
  if (!startup) {
    console.error('❌ #startup-screen not found! Cannot start app.');
    return;
  } else {
    console.log('🚀 Found #startup-screen');
  }

  // 🧊 Render the Festival Progress card under the cone.
  // When the player taps "Play Game", we fade out and launch the menu.
  renderFestivalWelcomeOnStartup(() => {
    console.log('🔥 Launching menu from startup Play Game…');
    setupMenu();
  });
});
