// 🍦 Import core systems
import { applyBackgroundTheme } from './managers/backgroundManager.js';
import { openModal } from './modals/cosmicModal.js';
import './modals/infoModal.js'; // doesn’t export, just initializes listeners
import { getSetting } from './data/cdms.js';
import { Howler } from 'howler';

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

// 🚀 DOM Ready Entry Point
document.addEventListener('DOMContentLoaded', () => {
  applyBackgroundTheme();

  // 🧊 Load mute state from localStorage
  Howler.volume(getSetting('mute') ? 0 : 1);
});