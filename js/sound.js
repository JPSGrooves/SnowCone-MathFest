// /js/sound.js

function setupVolumeSliders() {
  const musicSlider = document.getElementById('musicVolume');
  const sfxSlider = document.getElementById('sfxVolume');

  if (!musicSlider || !sfxSlider) return;

  // Set initial values from settings
  musicSlider.value = getSetting('musicVolume') ?? 1;
  sfxSlider.value = getSetting('sfxVolume') ?? 1;

  // Music slider change
  musicSlider.addEventListener('input', (e) => {
    const vol = parseFloat(e.target.value);
    setSetting('musicVolume', vol);
    if (typeof setMusicVolume === 'function') setMusicVolume(vol);
  });

  // SFX slider change
  sfxSlider.addEventListener('input', (e) => {
    const vol = parseFloat(e.target.value);
    setSetting('sfxVolume', vol);
    if (typeof setSFXVolume === 'function') setSFXVolume(vol);
  });
}

window.setupVolumeSliders = setupVolumeSliders;
