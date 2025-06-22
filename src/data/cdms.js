// ❄️ Cone Data Management System (CDMS)

export function setSetting(key, value) {
  try {
    localStorage.setItem(`snowcone_${key}`, JSON.stringify(value));
  } catch (e) {
    console.warn(`⚠️ Failed to save setting "${key}"`, e);
  }
}

export function getSetting(key, fallback = null) {
  try {
    const value = localStorage.getItem(`snowcone_${key}`);
    return value !== null ? JSON.parse(value) : fallback;
  } catch (e) {
    console.warn(`⚠️ Failed to load setting "${key}"`, e);
    return fallback;
  }
}

export function resetAllSettings() {
  const keys = [
    'mute', 'theme', 'loop', 'shuffle', 'difficulty',
    'username', 'seenIntro', 'xp', 'level'
  ];
  keys.forEach(key => localStorage.removeItem(`snowcone_${key}`));
}
