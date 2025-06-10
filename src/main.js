import { applyBackgroundTheme } from './managers/backgroundManager.js';

// 🍧 Load background on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  applyBackgroundTheme();
});

// 🔐 Optional: Vite env variable debug
if (import.meta.env?.VITE_SECRET_KEY) {
  console.log("🔐 VITE_SECRET_KEY:", import.meta.env.VITE_SECRET_KEY);
} else {
  console.warn("🚨 No VITE_SECRET_KEY found. Is .env missing?");
}
// 🍧 Anti–Double-Tap Zoom Shield
let lastTouchTime = 0;

document.addEventListener('touchend', function (e) {
  const now = new Date().getTime();
  if (now - lastTouchTime <= 300) {
    e.preventDefault(); // ❌ block zoom
  }
  lastTouchTime = now;
}, true);

// 🛡️ Extra Safari Gesture Block
document.addEventListener('gesturestart', function (e) {
  e.preventDefault();
});

import './modals/infoModal.js';