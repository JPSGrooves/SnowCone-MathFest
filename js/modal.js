// modal.js — Cosmic Modal Core Logic

function openCosmicModal() {
  document.getElementById('cosmicModal')?.classList.remove('hidden');
}

function closeCosmicModal() {
  document.getElementById('cosmicModal')?.classList.add('hidden');
}

// Wait until DOM is ready to bind close + tabs + sliders
document.addEventListener('DOMContentLoaded', () => {
  // 🔒 Close Button
  const closeModalBtn = document.querySelector('.close-modal');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeCosmicModal);
  }

  // 🔄 Tab Buttons
  const tabButtons = document.querySelectorAll('.tab-header button');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');

      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
      });
      document.getElementById(`tab-${tab}`)?.classList.remove('hidden');
    });
  });

  // 💾 Save
  document.getElementById('downloadSaveBtn')?.addEventListener('click', () => {
    const data = localStorage.getItem('snowconeUserData');
    if (!data) return alert('No save data found.');

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'snowcone_save.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  // 📤 Load
  document.getElementById('uploadSaveInput')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      localStorage.setItem('snowconeUserData', JSON.stringify(parsed));
      alert('Save file loaded! Refresh the page to apply it.');
    } catch (err) {
      alert('⚠️ Invalid file. Please select a valid SnowCone save file (.json).');
    }
  });

  // 🎛️ Sliders
  const musicSlider = document.getElementById('musicVolume');
  const sfxSlider = document.getElementById('sfxVolume');

  if (musicSlider) {
    musicSlider.value = getSetting('musicVolume') ?? 1;
    musicSlider.addEventListener('input', (e) => {
      const vol = parseFloat(e.target.value);
      setSetting('musicVolume', vol);
      if (typeof setMusicVolume === 'function') setMusicVolume(vol);
    });
  }

  if (sfxSlider) {
    sfxSlider.value = getSetting('sfxVolume') ?? 1;
    sfxSlider.addEventListener('input', (e) => {
      const vol = parseFloat(e.target.value);
      setSetting('sfxVolume', vol);
      if (typeof setSFXVolume === 'function') setSFXVolume(vol);
    });
  }
});

// 🌐 Global Exports
window.openCosmicModal = openCosmicModal;
window.closeCosmicModal = closeCosmicModal;
