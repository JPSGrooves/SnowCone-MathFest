// 🍦 AppState.js – MobX Global Store for SnowCone MathFest
import { makeAutoObservable, autorun } from 'mobx';

class AppState {
  profile = {
    username: 'Guest',
    xp: 0,
    level: 1,
    badges: [],
    completedModes: [],
    lastPlayed: null,
    seenIntro: false
  };

  settings = {
    theme: 'menubackground',
    mute: false,
    difficulty: 'normal',
    loop: false,
    shuffle: false
  };

  stats = {
    quickServe: { sessions: 0, topScore: 0 },
    infinity: { timeSpent: 0 },
    story: { chapter: 0 }
  };

  storyProgress = {
    currentChapter: 0,
    seenPanels: []
  };

  uiState = {
    pendingBadgePopup: null,
    triggerBadgeModal: false,
    currentMode: null
  };

  constructor() {
    makeAutoObservable(this);
    this.loadFromStorage();
  }

  // === PROFILE ===

  addXP(amount) {
    this.profile.xp += amount;
    const newLevel = Math.floor(this.profile.xp / 100) + 1;
    if (newLevel > this.profile.level) {
      this.profile.level = newLevel;
    }
  }

  setLastPlayed(timestamp) {
    this.profile.lastPlayed = timestamp;
  }

  unlockBadge(id) {
    if (!this.profile.badges.includes(id)) {
      this.profile.badges.push(id);
      this.uiState.pendingBadgePopup = id;
    }
  }

  markModeComplete(mode) {
    if (!this.profile.completedModes.includes(mode)) {
      this.profile.completedModes.push(mode);
    }
  }

  // === STATS ===

  updateTopScore(mode, score) {
    if (this.stats[mode] && score > this.stats[mode].topScore) {
      this.stats[mode].topScore = score;
    }
  }

  incrementStoryChapter() {
    this.stats.story.chapter++;
    this.storyProgress.currentChapter++;
  }

  markPanelSeen(panelId) {
    if (!this.storyProgress.seenPanels.includes(panelId)) {
      this.storyProgress.seenPanels.push(panelId);
    }
  }

  // === SETTINGS ===

  setSetting(key, value) {
    this.settings[key] = value;
  }

  // === UI STATE ===

  setTriggerBadgeModal(flag) {
    this.uiState.triggerBadgeModal = flag;
  }

  clearTriggerBadgeModal() {
    this.uiState.triggerBadgeModal = false;
  }

  clearPendingBadgePopup() {
    this.uiState.pendingBadgePopup = null;
  }

  setMode(modeName) {
    this.uiState.currentMode = modeName;
  }

  // === STORAGE ===

  loadFromStorage() {
    const raw = localStorage.getItem('snowcone_save_data');
    if (raw) {
      try {
        const data = JSON.parse(raw);
        Object.assign(this.profile, data.profile);
        Object.assign(this.settings, data.settings);
        Object.assign(this.stats, data.stats);
        Object.assign(this.storyProgress, data.storyProgress);
      } catch (err) {
        console.warn('⚠️ Bad save data. Using defaults.', err);
      }
    }
  }
}

export const appState = new AppState();

// 💾 SAVE ON CHANGE
autorun(() => {
  const dataToSave = {
    profile: appState.profile,
    settings: appState.settings,
    stats: appState.stats,
    storyProgress: appState.storyProgress
  };
  localStorage.setItem('snowcone_save_data', JSON.stringify(dataToSave));
});

// 🧪 Dev Flag
window.devFlags = { build: "v0.3.0-mobx" };
