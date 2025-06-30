// 🎛️ cosmicModal.js – Sacred Modal System 🍧🚛
import { autorun } from 'mobx';
import { appState } from '../data/appState.js';

import { renderProfileTab, setupProfileTabUI } from './profileTab.js';
import { renderThemesTab, setupThemesTabUI } from './themesTab.js';
import { renderMusicTab, setupMusicTabUI } from './musicTab.js';
import { renderVersionTab, setupVersionTabUI } from './versionTab.js';

//////////////////////////////
// 🚀 Open / Close Modal
//////////////////////////////
export function openModal(tab = 'profile') {
  const modal = document.getElementById('cosmicModal');
  const overlay = document.getElementById('cosmicOverlay');
  if (!modal) return console.warn('🛑 cosmicModal not found');

  modal.classList.remove('hidden');
  overlay?.classList.remove('hidden');
  overlay?.classList.add('show');

  requestAnimationFrame(() => {
    renderTab(tab);
  });
}

export function closeModal() {
  const modal = document.getElementById('cosmicModal');
  const overlay = document.getElementById('cosmicOverlay');

  modal?.classList.add('hidden');
  overlay?.classList.remove('show');
  overlay?.classList.add('hidden');
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

  document.querySelector('.label-options')?.addEventListener('click', () => {
    console.log('⚙️ Options clicked – opening modal');
    openModal('profile');
  });

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
