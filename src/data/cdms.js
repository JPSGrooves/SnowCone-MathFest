const STORAGE_KEY = 'snowcone_save_data';

import { Howl, Howler } from 'howler';

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

// 🎯 Gets a specific setting (e.g. "theme")
export function getSetting(key) {
  return getData().settings?.[key];
}

// 🔍 Returns all settings (optional helper)
export function getAllSettings() {
  return getData().settings;
}

// 🛠️ Sets a specific setting and saves it
export function setSetting(key, value) {
  const data = getData();
  data.settings[key] = value;
  saveData(data);

  if (key === 'mute') {
    const volume = value ? 0 : 1;
    Howler.volume(volume); // 🌐 🔇 GLOBAL MUTE HERE
    console.log("🔊 Mute toggled. Howler.volume set to:", volume);
  }

  window.dispatchEvent(new CustomEvent('settingChanged', {
    detail: { key, value }
  }));
}

// 📦 Default values for first-time players
function getDefaultData() {
  return {
    profile: {
      username: 'Guest',
      xp: 0,
      level: 1,
      badges: [],             // e.g. ['first_steps', 'math_zen']
      completedModes: [],     // e.g. ['quickServe', 'story']
      lastPlayed: null,
      seenIntro: false
    },
    settings: {
      theme: 'menubackground',
      mute: false,
      difficulty: 'normal'
    },
    stats: {
      quickServe: {
        sessions: 0,
        topScore: 0
      },
      infinity: {
        timeSpent: 0
      },
      story: {
        chapter: 0
      }
    },
    storyProgress: {
      currentChapter: 0,
      seenPanels: []
    },
    created: Date.now()
  };
}

export function addXP(amount) {
  const data = getData();
  data.profile.xp += amount;

  // Optional: simple level-up idea
  const xpPerLevel = 100;
  const newLevel = Math.floor(data.profile.xp / xpPerLevel) + 1;
  if (newLevel > data.profile.level) {
    console.log(`🔺 Level up! ${data.profile.level} ➜ ${newLevel}`);
    data.profile.level = newLevel;
  }

  saveData(data);
  console.log(`🧠 +${amount} XP (Total: ${data.profile.xp})`);
}

export function unlockBadge(id) {
  const data = getData();
  if (!data.profile.badges.includes(id)) {
    data.profile.badges.push(id);
    saveData(data);
    console.log(`🏅 Badge Unlocked: ${id}`);
    // 🚧 insert GSAP or popup code here if needed
  }
}

window.devFlags = { build: "v0.3.0" };
