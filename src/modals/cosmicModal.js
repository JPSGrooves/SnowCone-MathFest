import { autorun } from 'mobx';
import { appState } from '../data/appState.js';

import { renderProfileTab, setupProfileTabUI } from './profileTab.js';
import { renderThemesTab, setupThemesTabUI } from './themesTab.js';
import { renderMusicTab, setupMusicTabUI } from './musicTab.js';
import { renderVersionTab, setupVersionTabUI } from './versionTab.js';

export function openModal(tab = 'profile') {
  const modal = document.getElementById('cosmicModal');
  const overlay = document.getElementById('cosmicOverlay');
  if (!modal) return console.warn("🛑 cosmicModal not found");

  modal.classList.remove('hidden');
  overlay?.classList.remove('hidden');
  overlay?.classList.add('show');

  renderTab(tab);
}

export function closeModal() {
  const modal = document.getElementById('cosmicModal');
  const overlay = document.getElementById('cosmicOverlay');

  if (modal) modal.classList.add('hidden');
  overlay?.classList.remove('show');
  overlay?.classList.add('hidden');
}

function renderTab(tabName) {
  const content = document.getElementById('modalContent');
  if (!content) return;

  // Activate correct tab button
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  // Inject content
  switch (tabName) {
    case 'profile':
      content.innerHTML = renderProfileTab();
      setupProfileTabUI();
      break;
    case 'themes':
      content.innerHTML = renderThemesTab();
      setupThemesTabUI();
      break;
    case 'music':
      content.innerHTML = renderMusicTab();
      setupMusicTabUI();
      break;
    case 'version':
      content.innerHTML = renderVersionTab();
      setupVersionTabUI();
      break;
    default:
      content.innerHTML = `<p>Unknown tab: ${tabName}</p>`;
      break;
  }

  // 🔁 Always rebind close button after tab swap
  const closeBtn = document.querySelector('.modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      console.log("❌ Cosmic modal closing!");
      closeModal();
    });
  }
}

// 🔄 Unified Tab Click Handling
function handleTabClick(e) {
  const tab = e.currentTarget.dataset.tab;
  console.log(`🪐 Tab clicked: ${tab}`);
  renderTab(tab);
}

function setupTabListeners() {
  console.log("🧪 Setting up tab listeners...");
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', handleTabClick);
  });

  document.querySelector('.label-options')?.addEventListener('click', () => {
    console.log("⚙️ Options clicked – opening modal");
    openModal('profile');
  });
}

// 🧊 Init once DOM ready
document.addEventListener('DOMContentLoaded', () => {
  setupTabListeners();
  console.log("🧊 Cosmic modal listeners wired.");
});

window.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.querySelector('.modal-close');
  closeBtn?.addEventListener('click', () => {
    console.log("❌ Closing modal from global listener");
    closeModal();
  });
});

window.openModal = openModal;

// 🌌 REACT TO BADGE UNLOCK AND OPEN MODAL
autorun(() => {
  const badgeFlag = appState.uiState?.triggerBadgeModal;
  if (badgeFlag) {
    console.log("🌈 Badge modal trigger received via autorun!");
    openModal('profile'); // you could change this to 'themes' or 'version' if better
    appState.clearTriggerBadgeModal();
  }
});

// 📲 PWA install logic still lives here
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
