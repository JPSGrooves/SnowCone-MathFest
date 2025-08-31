// 🍦 Import core systems
import { applyBackgroundTheme } from './managers/backgroundManager.js';
import { openModal } from './modals/cosmicModal.js';
import './modals/infoModal.js'; // ⛩️ just runs, no export
import { Howler } from 'howler';
import { autorun } from 'mobx';
import { appState } from './data/appState.js';
import { setupMenu } from './menu/menu.js'; // ⬅️ this wires transitions
import { playTransition } from './managers/transitionManager.js'; // still available if needed
import { initBadgeManager } from './managers/badgeManager.js';
import { startAchievementsWatcher } from './achievementsWatcher.js';

// 🍧 Anti–Double-Tap Zoom Shield (esp. iOS Safari)
let lastTouchTime = 0;
document.addEventListener('touchend', (e) => {
  const now = new Date().getTime();
  if (now - lastTouchTime <= 300) e.preventDefault();
  lastTouchTime = now;
}, true);

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
if (import.meta.env?.VITE_SECRET_KEY) {
  console.log("🔐 VITE_SECRET_KEY:", import.meta.env.VITE_SECRET_KEY);
} else {
  console.warn("🚨 No VITE_SECRET_KEY found. Is .env missing?");
}

// 🌍 Inject favicons with proper base path
const base = import.meta.env.BASE_URL;

const links = [
  { rel: 'icon', type: 'image/x-icon', href: `${base}favicon.ico` },
  { rel: 'icon', type: 'image/png', sizes: '192x192', href: `${base}icon-192.png` },
  { rel: 'icon', type: 'image/png', sizes: '512x512', href: `${base}icon-512.png` },
  { rel: 'apple-touch-icon', href: `${base}apple-touch-icon.png` },
  { rel: 'manifest', href: `${base}manifest.json` }
];

links.forEach(attrs => {
  const link = document.createElement('link');
  Object.entries(attrs).forEach(([key, val]) => link.setAttribute(key, val));
  document.head.appendChild(link);
});

// ✅ OPTIONAL: tiny in-file test kit (so you don't need a separate file)
function attachDevHarness() {
  const w = (globalThis || window);
  w.appState = appState; // <-- console: appState.setTheme('summer')

  // lightweight badge/xp helpers
  w.scTest = {
    award: id => (import('./managers/badgeManager.js').then(m => m.awardBadge(id))),
    playJukebox: () => document.dispatchEvent(new Event('sc:jukebox-play', { bubbles: true })),
    addStory: n => appState.addStoryXP(n),
    addKids:  n => appState.addKidsCampingXP(n),
    addQS:    n => appState.addQuickServeXP(n),
    addInf:   n => appState.addInfinityXP(n),
    breakdown: async () => {
      const { computeCompletionBreakdown } = await import('./managers/completionManager.js');
      const b = computeCompletionBreakdown(appState);
      console.table(b.xp.buckets); console.log(b);
      return b;
    }
  };
  console.log('✅ Dev globals: appState, scTest');
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('📦 DOM ready. Starting app...');
  initBadgeManager(appState);          // 1) init badge store
  startAchievementsWatcher(appState);  // 2) wire autoruns AFTER manager
  if (import.meta.env.DEV) attachDevHarness();

  applyBackgroundTheme();
  console.log("🎨 Background applied.");

  autorun(() => {
    Howler.volume(appState.settings.mute ? 0 : 1);
    console.log("🔊 MobX mute autorun ran.");
  });

  const startup = document.getElementById('startup-screen');
  if (!startup) {
    console.error('❌ #startup-screen not found! Cannot start app.');
    return;
  } else {
    console.log("🚀 Found #startup-screen");
  }

  setTimeout(() => {
    console.log("🕒 Fading out startup...");
    startup.style.opacity = 0;

    setTimeout(() => {
      console.log("🔥 Removing startup, launching menu...");
      startup.remove();
      setupMenu();
    }, 600);
  }, 2500);
});
