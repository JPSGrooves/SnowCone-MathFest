// 🎛️ cosmicModal.js – Sacred Modal System 🍧🚛
import { autorun } from 'mobx';
import { appState } from '../data/appState.js';
import { hapticTap } from '../utils/haptics.js'; // 📳 modal tap vibes

import { renderProfileTab, setupProfileTabUI } from './profileTab.js';
import { renderThemesTab, setupThemesTabUI } from './themesTab.js';
import { renderMusicTab, setupMusicTabUI } from './musicTab.js';
import { renderVersionTab, setupVersionTabUI } from './versionTab.js';

// 🍧 WKWebView tap-through shield (Capacitor iOS only)
let COSMIC_BLOCK_UNTIL = 0;

function isIOSNativeShell() {
  // You already log: "Running inside iOS shell (platform-ios)"
  // and you inject SC_IOS_NATIVE. We'll support both.
  const root = document.documentElement;
  const platform = root?.dataset?.platform;
  const flag = typeof window !== 'undefined' && window.SC_IOS_NATIVE === true;
  return platform === 'ios' || flag;
}

function blockUnderlyingTapsFor(ms = 350) {
  COSMIC_BLOCK_UNTIL = Date.now() + ms;
}

// Capture-phase killer: stops clicks/taps BEFORE menu labels see them
function installCosmicTapThroughShield() {
  const killer = (e) => {
    if (Date.now() < COSMIC_BLOCK_UNTIL) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }
  };

  // We listen to the full set, capture-phase
  document.addEventListener('pointerdown', killer, true);
  document.addEventListener('touchstart', killer, { capture: true, passive: false });
  document.addEventListener('touchend', killer, { capture: true, passive: false });
  document.addEventListener('click', killer, true);
}

//////////////////////////////
// 🚀 Open / Close Modal
//////////////////////////////
export function openModal(tab = 'profile') {
  const modal   = document.getElementById('cosmicModal');
  const overlay = document.getElementById('cosmicOverlay');
  if (!modal) return console.warn('🛑 cosmicModal not found');

  // Already open? Don't re-open or re-render (prevents "flash")
  if (!modal.classList.contains('hidden')) {
    return;
  }

  try {
    hapticTap();
  } catch (err) {
    console.warn('📳 cosmic open haptic failed (safe):', err);
  }

  modal.classList.remove('hidden');
  overlay?.classList.remove('hidden');
  overlay?.classList.add('show');

  requestAnimationFrame(() => {
    renderTab(tab);
  });
}

export function closeModal() {
  const modal   = document.getElementById('cosmicModal');
  const overlay = document.getElementById('cosmicOverlay');

  if (!modal || modal.classList.contains('hidden')) return;

  try { hapticTap(); } catch {}

  // 🧊 KEY: in WKWebView, swallow the tail-end event burst
  if (isIOSNativeShell()) {
    blockUnderlyingTapsFor(350);
  }

  modal.classList.add('hidden');
  overlay?.classList.remove('show');
  overlay?.classList.add('hidden');
}
function wireOverlayClose() {
  const overlay = document.getElementById('cosmicOverlay');
  if (!overlay) return;

  const handleOverlayDown = (e) => {
    const modal = document.getElementById('cosmicModal');
    if (!modal || modal.classList.contains('hidden')) return;

    // If the interaction started inside the modal, ignore
    if (modal.contains(e.target)) return;

    // If the High Score overlay is up, don't compete
    const hsOverlay = document.getElementById('highScoreOverlay');
    if (hsOverlay && !hsOverlay.classList.contains('hidden')) return;

    // Stop THIS event hard
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    closeModal();
  };

  overlay.addEventListener('pointerdown', handleOverlayDown, { passive: false });
  overlay.addEventListener('touchstart', handleOverlayDown, { passive: false });

  // Optional: if any click slips through, still block it
  overlay.addEventListener(
    'click',
    (e) => {
      if (!document.getElementById('cosmicModal')?.classList.contains('hidden')) return;
      if (isIOSNativeShell()) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    },
    true
  );
}

//////////////////////////////
// 🎛️ Render Tabs
//////////////////////////////
function renderTab(tabName) {
  const content = document.getElementById('modalContent');
  if (!content) return;

  const tabMap = {
    profile: { render: renderProfileTab, setup: setupProfileTabUI },
    themes: { render: renderThemesTab, setup: setupThemesTabUI },
    music: { render: renderMusicTab, setup: setupMusicTabUI },
    version: { render: renderVersionTab, setup: setupVersionTabUI },
  };

  const tab = tabMap[tabName];
  if (!tab) {
    content.innerHTML = `<p>Unknown tab: ${tabName}</p>`;
    return;
  }

  content.innerHTML = tab.render();

  // 🔥 DOM Paint before setup
  requestAnimationFrame(() => {
    tab.setup();
  });

  // 🔥 Tab Highlight
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  // 🔗 Close Button
  document.querySelector('.modal-close')?.addEventListener('click', () => {
    console.log('❌ Cosmic modal closing!');
    closeModal();
  });
}

//////////////////////////////
// 🪐 Tab Click Logic
//////////////////////////////
function handleTabClick(e) {
  const tab = e.currentTarget.dataset.tab;
  console.log(`🪐 Tab clicked: ${tab}`);
  renderTab(tab);
}

function setupTabListeners() {
  console.log('🧪 Setting up tab listeners...');

  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', handleTabClick);
  });

  const optionsLabel = document.querySelector('.label-options');
  if (optionsLabel) {
    optionsLabel.addEventListener('click', (e) => {
      console.log('⚙️ Options clicked');

      // Don't let this click bubble to anything weird behind it
      e.preventDefault();
      e.stopPropagation();

      const modal = document.getElementById('cosmicModal');

      if (modal && !modal.classList.contains('hidden')) {
        // If already open, treat this tap as "close"
        closeModal();
      } else {
        // Was closed → open fresh on Profile tab
        openModal('profile');
      }
    });
  }

  document.querySelector('.modal-close')?.addEventListener('click', () => {
    console.log('❌ Closing modal from global listener');
    closeModal();
  });
}

//////////////////////////////
// 🔥 DOM Ready Bootup
//////////////////////////////
document.addEventListener('DOMContentLoaded', () => {
  setupTabListeners();
  installCosmicTapThroughShield(); // 👈 add this
  wireOverlayClose();
  console.log('🧊 Cosmic modal listeners wired.');
});



window.openModal = openModal;

//////////////////////////////
// 🪩 Badge Modal Autorun
//////////////////////////////
autorun(() => {
  const badgeFlag = appState.uiState?.triggerBadgeModal;
  if (badgeFlag) {
    console.log('🌈 Badge modal trigger received via autorun!');
    openModal('profile');
    appState.clearTriggerBadgeModal();
  }
});

//////////////////////////////
// 📲 PWA Install Logic
//////////////////////////////
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;

  const installBtn = document.getElementById('installAppBtn');
  if (installBtn) {
    installBtn.style.display = 'inline-block';

    installBtn.addEventListener('click', () => {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('📲 User installed the app!');
        } else {
          console.log('🙅 Install dismissed.');
        }
        installBtn.style.display = 'none';
        deferredPrompt = null;
      });
    });
  }
});
