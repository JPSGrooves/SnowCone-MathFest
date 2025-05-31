// main.js

function hideAllScreens() {
  document.querySelectorAll('main > section').forEach(el => {
    el.style.display = 'none';
  });
  document.querySelector('.menu-wrapper')?.style.display = 'none';
}

function loadInitialView() {
  hideAllScreens();
  document.querySelector('.menu-wrapper')?.style.display = 'flex';
}

function applyBackgroundTheme() {
  const data = getData();
  let theme = data.settings?.theme;
  if (!theme || typeof theme !== 'string') {
    theme = 'menubackground';
  }
  const bg = document.getElementById('menuImage');
  if (bg) {
    bg.src = `assets/img/branding/${theme}.png`;
  }
}

function openCosmicModal() {
  document.getElementById('cosmicModal')?.classList.remove('hidden');
}

function closeCosmicModal() {
  document.getElementById('cosmicModal')?.classList.add('hidden');
}

window.openCosmicModal = openCosmicModal;
window.closeCosmicModal = closeCosmicModal;

window.addEventListener('DOMContentLoaded', () => {
  applyBackgroundTheme();
  loadInitialView();
  setupModalUI();
  setupSaveLoadUI();
  setupVolumeSliders();
  console.log("🧼 Clean boot: SnowCone initialized");
});
