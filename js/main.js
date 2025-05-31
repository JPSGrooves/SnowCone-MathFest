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

  // ⛑ Fallback + persist default
  if (!theme || typeof theme !== 'string' || theme === 'default') {
    theme = 'menubackground';
    setSetting('theme', theme);
  }

  const bg = document.getElementById('menuImage');
  if (bg) {
    bg.src = `assets/img/branding/${theme}.png`;
    console.log(`🌌 Background applied: ${theme}`);
  } else {
    console.warn("⚠️ No element with id 'menuImage' found.");
  }
}

// 🛸 Cosmic Modal Controls
function openCosmicModal() {
  document.getElementById('cosmicModal')?.classList.remove('hidden');
}

function closeCosmicModal() {
  document.getElementById('cosmicModal')?.classList.add('hidden');
}

window.openCosmicModal = openCosmicModal;
window.closeCosmicModal = closeCosmicModal;

// 🚀 DOM Ready Boot Sequence
window.addEventListener('DOMContentLoaded', () => {
  applyBackgroundTheme();
  loadInitialView();
  setupModalUI();
  setupSaveLoadUI();
  setupVolumeSliders();
  console.log("🧼 Clean boot: SnowCone initialized");
});
