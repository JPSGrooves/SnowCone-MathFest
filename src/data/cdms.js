const STORAGE_KEY = 'snowcone_save_data';

// 🧠 Returns all stored data, or default if none
export function getData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  try {
    return raw ? JSON.parse(raw) : getDefaultData();
  } catch (err) {
    console.error('💥 Failed to parse stored data:', err);
    return getDefaultData();
  }
}

// 💾 Saves full data object
export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// 🎯 Gets a specific value (e.g. "settings.theme")
export function getSetting(key) {
  const data = getData();
  return data.settings?.[key];
}

// 🛠️ Sets a specific setting and saves
export function setSetting(key, value) {
  const data = getData();
  data.settings[key] = value;
  saveData(data);
}

// 📦 Default values for first-time players
function getDefaultData() {
  return {
    settings: {
      theme: 'menubackground',
      mute: false
    },
    xp: 0,
    badges: [],
    profile: {
      name: '',
      created: Date.now()
    },
    story: {
      currentChapter: 0
    }
  };
}

window.devFlags = { build: "v0.1.0" };
