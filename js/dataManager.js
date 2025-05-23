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

