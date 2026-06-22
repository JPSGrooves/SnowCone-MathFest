// 🧊 Import styles FIRST so Vite injects them early
import './infoModal.css';
import { hapticTap } from '../utils/haptics.js';
import { appState } from '../data/appState.js';
import { getThemeAccent } from '../data/themeAccentLaw.js';

// 🎨 Info modal theme accent law
// Scope: Info/About popup only.
// No layout, sizing, or modal behavior changes.
const INFO_THEME_ACCENTS = Object.freeze({
  menubackground: '#00ffee',
  default: '#00ffee',

  fall: '#c98243',
  harvest: '#c98243',

  winter: '#9fe8ff',

  spring: '#ff9fcd',

  summer: '#ffe66d',

  halloween: '#ff8a1f',

  concert: '#67d85a',

  christmas: '#8fffd1',

  freedom: '#9fd7ff',

  clouds: '#f7fbff',
  cloud: '#f7fbff',
  newyear: '#f7fbff',

  valentine: '#ff82c8',

  cosmic_01: '#9a7cff',
  cosmic_02: '#9a7cff',
  cosmic_03: '#9a7cff',
  cosmic_04: '#9a7cff',
  cosmic_05: '#9a7cff',
  cosmic_06: '#9a7cff',
  cosmic_07: '#ff82c8',
});

function getInfoThemeAccent(themeId = appState.settings?.theme || 'menubackground') {
  const cleanId = String(themeId || 'menubackground').toLowerCase();

  if (INFO_THEME_ACCENTS[cleanId]) {
    return INFO_THEME_ACCENTS[cleanId];
  }

  if (cleanId.startsWith('cosmic')) {
    return '#9a7cff';
  }

  return INFO_THEME_ACCENTS.menubackground;
}

function applyInfoThemeAccent() {
  const modal = document.getElementById('infoModal');
  if (!modal) return;

  const { accent, glow, faint } = getThemeAccent(appState.settings?.theme);

  modal.style.setProperty('--scmf-info-accent', accent);
  modal.style.setProperty('--scmf-info-accent-soft', glow);
  modal.style.setProperty('--scmf-info-accent-faint', faint);
}

// 🧊 Info Modal Controls
function openInfoModal() {
  const modal = document.getElementById('infoModal');
  if (!modal) return;

  // If Cosmic modal is up, just close it instead of stacking
  const cosmic   = document.getElementById('cosmicModal');
  const overlay  = document.getElementById('cosmicOverlay');
  if (cosmic && !cosmic.classList.contains('hidden')) {
    cosmic.classList.add('hidden');
    overlay?.classList.remove('show');
    overlay?.classList.add('hidden');

    try {
      hapticTap();
    } catch (err) {
      console.warn('📳 info-title tapped while cosmic open (close cosmic) haptic failed:', err);
    }

    return;
  }

  // Already visible? ignore extra opens
  if (!modal.classList.contains('hidden')) {
    return;
  }

  try {
    hapticTap();
  } catch (err) {
    console.warn('📳 info open haptic failed (safe):', err);
  }

  applyInfoThemeAccent();

  modal.classList.remove('hidden');
  modal.style.display = 'flex';
}

function closeInfoModal() {
  const modal = document.getElementById('infoModal');
  if (!modal || modal.classList.contains('hidden')) return;

  try {
    hapticTap();
  } catch (err) {
    console.warn('📳 info close haptic failed (safe):', err);
  }

  modal.classList.add('hidden');
  modal.style.display = 'none';
}

// ✅ DOM Ready check to make sure title exists before binding
document.addEventListener('DOMContentLoaded', () => {
  const title = document.querySelector('.menu-title-top');
  if (!title) {
    console.warn('⚠️ .menu-title-top not found!');
  } else {
    console.log('🎯 Title found. Binding click.');
    title.addEventListener('click', () => {
      console.log('🎯 Title click detected');
      openInfoModal();
    });
  }

  // 🕳 Outside-click-to-close for Info Modal
  const modal = document.getElementById('infoModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      // Only close if you click directly on the overlay background,
      // not on inner content.
      if (e.target === modal) {
        console.log('🕳 Info modal background clicked – closing');
        closeInfoModal();
      }
    });
  }
});

// Escape key closes modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeInfoModal();
});

console.log('🍧 infoModal.js loaded');

// 🔓 Optional: expose globally
window.openInfoModal = openInfoModal;
window.closeInfoModal = closeInfoModal;
