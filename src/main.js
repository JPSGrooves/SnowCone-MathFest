// 🍦 Import core systems
import { applyBackgroundTheme } from './managers/backgroundManager.js';
import { openModal } from './modals/cosmicModal.js';
import './modals/infoModal.js'; // doesn’t export, just initializes listeners
import { getSetting } from './data/cdms.js';
import { Howler } from 'howler';
import { startMode } from './managers/sceneManager.js';


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

// 🔐 Optional: Vite env check
if (import.meta.env?.VITE_SECRET_KEY) {
  console.log("🔐 VITE_SECRET_KEY:", import.meta.env.VITE_SECRET_KEY);
} else {
  console.warn("🚨 No VITE_SECRET_KEY found. Is .env missing?");
}

window.addEventListener('load', () => {
  // ✅ This waits for ALL assets including CSS + images
  applyBackgroundTheme();
  Howler.volume(getSetting('mute') ? 0 : 1);
});


document.querySelector('.menu-label.quick')?.addEventListener('click', () => {
  startMode('quickServe'); // 🔥 handles background + scene logic
});

