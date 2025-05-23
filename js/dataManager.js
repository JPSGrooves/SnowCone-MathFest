
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

function getData() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || DEFAULT_DATA;
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// High Scores
function saveScore(mode, score, initials = '???') {
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

// XP and Badges
function addXP(amount) {
  const data = getData();
  data.profile.xp = (data.profile.xp || 0) + amount;
  saveData(data);
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

// Story Progress
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

// Attach to window for console testing
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
