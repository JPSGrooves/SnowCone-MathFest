// /js/dataManager.js

const STORAGE_KEY = 'snowconeUserData';

const DEFAULT_DATA = {
  profile: {
    username: "Guest",
    xp: 0,
    badges: [],
    created: new Date().toISOString()
  },
  scores: {
    quickServe: [],
    infinity: [],
    story: []
  },
  settings: {
    mute: false,
    difficulty: "normal",
    theme: "default",
    textSize: "normal"
  },
  storyProgress: {
    chapter: 0,
    seenPanels: []
  },
  stats: {
    quickServe: { problemsSolved: 0, sessions: 0 },
    infinity: { timeSpent: 0 },
    story: { completions: 0 }
  },
  unlocked: {
    themes: ["default"],
    cones: ["vanilla"]
  },
  music: {
    favorites: []
  },
  devFlags: {
    cheatsEnabled: false,
    build: "v0.1"
  }
};

// 🧠 Core Storage Handlers
function getData() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || DEFAULT_DATA;
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// 💾 High Score System
function saveScore(mode, score, initials = '???') {
  if (!mode || typeof score !== 'number') {
    console.warn('Missing or invalid mode/score in saveScore');
    return;
  }
  const data = getData();
  const entry = { score, initials, date: new Date().toISOString() };
  data.scores[mode] = [...(data.scores[mode] || []), entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  saveData(data);
}

function loadScores(mode) {
  return getData().scores[mode] || [];
}

// 🧠 XP and Badge Logic
function addXP(amount) {
  const data = getData();
  data.profile.xp = (data.profile.xp || 0) + amount;
  saveData(data);
  checkForBadges();
}

function getXP() {
  return getData().profile.xp || 0;
}

function unlockBadge(badgeId) {
  const data = getData();
  if (!data.profile.badges.includes(badgeId)) {
    data.profile.badges.push(badgeId);
    saveData(data);
  }
}

function checkForBadges() {
  const { xp, badges } = getData().profile;
  if (xp >= 10 && !badges.includes('first_steps')) unlockBadge('first_steps');
  if (xp >= 100 && !badges.includes('math_zen')) unlockBadge('math_zen');
}

// 📖 Story Progress Tracking
function saveStoryProgress(chapter, panelId) {
  const data = getData();
  data.storyProgress.chapter = chapter;
  if (!data.storyProgress.seenPanels.includes(panelId)) {
    data.storyProgress.seenPanels.push(panelId);
  }
  saveData(data);
}

function loadStoryProgress() {
  return getData().storyProgress;
}

// 📊 Stats Tracking
function updateStats(mode, key, increment = 1) {
  const data = getData();
  if (!data.stats[mode]) data.stats[mode] = {};
  data.stats[mode][key] = (data.stats[mode][key] || 0) + increment;
  saveData(data);
}

// 🛠️ Dev + Sync Utilities
function resetData() {
  localStorage.removeItem(STORAGE_KEY);
}

function markSynced() {
  const data = getData();
  data.devFlags.lastSync = new Date().toISOString();
  saveData(data);
}

function setBuildVersion(version) {
  const data = getData();
  data.devFlags.build = version;
  saveData(data);
}

function getSetting(key) {
  const data = getData();
  return data.settings[key];
}

function setSetting(key, value) {
  const data = getData();
  data.settings[key] = value;
  saveData(data);
}

function setupSaveLoadUI() {
  const downloadBtn = document.getElementById('downloadSaveBtn');
  const uploadInput = document.getElementById('uploadSaveInput');

  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return alert('No save data found.');
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'snowcone_save.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  if (uploadInput) {
    uploadInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        alert('Save file loaded! Refresh the page to apply it.');
      } catch {
        alert('⚠️ Invalid file. Please select a valid SnowCone save file (.json).');
      }
    });
  }
}

window.setupSaveLoadUI = setupSaveLoadUI;

// 🔍 Attach to window for testing
window.getData = getData;
window.saveData = saveData;
window.saveScore = saveScore;
window.loadScores = loadScores;
window.addXP = addXP;
window.getXP = getXP;
window.unlockBadge = unlockBadge;
window.checkForBadges = checkForBadges;
window.saveStoryProgress = saveStoryProgress;
window.loadStoryProgress = loadStoryProgress;
window.updateStats = updateStats;
window.resetData = resetData;
window.markSynced = markSynced;
window.setBuildVersion = setBuildVersion;
window.getSetting = getSetting;
window.setSetting = setSetting;
