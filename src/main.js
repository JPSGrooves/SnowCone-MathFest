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
