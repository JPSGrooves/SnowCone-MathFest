function setupVolumeSliders() {
  const musicSlider = document.getElementById('musicVolume');
  const sfxSlider = document.getElementById('sfxVolume');

  if (!musicSlider || !sfxSlider) return;

  musicSlider.value = getSetting('musicVolume') ?? 1;
  sfxSlider.value = getSetting('sfxVolume') ?? 1;

  musicSlider.addEventListener('input', (e) => {
    const vol = parseFloat(e.target.value);
    setSetting('musicVolume', vol);
    setMusicVolume(vol);
  });

  sfxSlider.addEventListener('input', (e) => {
    const vol = parseFloat(e.target.value);
    setSetting('sfxVolume', vol);
    setSFXVolume(vol);
  });
}

window.setupVolumeSliders = setupVolumeSliders;

