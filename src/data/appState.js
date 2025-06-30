import { makeAutoObservable, autorun, runInAction } from 'mobx';

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

  storyMemory = {
    askedWhoAreYou: false,
    askedAboutCones: false,
    askedAboutMath: false,
    heardAllJokes: false,
    farewellSaid: false
  };

  chatLogs = [];

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    this.loadFromStorage();
  }

  //////////////////////////////////////
  // 🚀 PROFILE
  //////////////////////////////////////
  addXP(amount) {
    this.profile.xp += amount;
    const newLevel = Math.floor(this.profile.xp / 100) + 1;
    if (newLevel > this.profile.level) {
      this.profile.level = newLevel;
    }
  }

  setUsername(name) {
    this.profile.username = name;
  }

  setLastPlayed(timestamp = Date.now()) {
    this.profile.lastPlayed = timestamp;
  }

  unlockBadge(id) {
    if (!this.profile.badges.includes(id)) {
      this.profile.badges.push(id);
      this.setPendingBadge(id);
    }
  }

  markModeComplete(mode) {
    if (!this.profile.completedModes.includes(mode)) {
      this.profile.completedModes.push(mode);
    }
  }

  setSeenIntro(flag = true) {
    this.profile.seenIntro = flag;
  }

  //////////////////////////////////////
  // 🎯 STATS
  //////////////////////////////////////
  incrementQuickServeSessions() {
    this.stats.quickServe.sessions += 1;
  }

  updateQuickServeHighScore(score) {
    if (score > this.stats.quickServe.topScore) {
      this.stats.quickServe.topScore = score;
    }
  }

  addInfinityTime(seconds) {
    this.stats.infinity.timeSpent += seconds;
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

  //////////////////////////////////////
  // 🎨 SETTINGS
  //////////////////////////////////////
  setSetting(key, value) {
    if (this.settings.hasOwnProperty(key)) {
      this.settings[key] = value;
    }
  }

  toggleMute() {
    this.settings.mute = !this.settings.mute;
  }

  setTheme(themeId) {
    this.settings.theme = themeId;
  }

  //////////////////////////////////////
  // 🧠 UI STATE
  //////////////////////////////////////
  setTriggerBadgeModal(flag = true) {
    this.uiState.triggerBadgeModal = flag;
  }

  clearTriggerBadgeModal() {
    this.uiState.triggerBadgeModal = false;
  }

  setPendingBadge(id) {
    this.uiState.pendingBadgePopup = id;
  }

  clearPendingBadgePopup() {
    this.uiState.pendingBadgePopup = null;
  }

  setCurrentMode(mode) {
    this.uiState.currentMode = mode;
  }

  clearCurrentMode() {
    this.uiState.currentMode = null;
  }

  setMode(mode) {
    this.setCurrentMode(mode);
  }

  //////////////////////////////////////
  // 🔮 MOOD ENGINE (XP DRIVEN)
  //////////////////////////////////////
  getCompletionPercent() {
    const xp = this.profile.xp;
    const maxXP = 500;
    return Math.min((xp / maxXP) * 100, 100);
  }

  getMood() {
    const pct = this.getCompletionPercent();
    if (pct >= 100) return 'cosmic';
    if (pct >= 80) return 'elated';
    if (pct >= 60) return 'hyped';
    if (pct >= 40) return 'silly';
    if (pct >= 20) return 'curious';
    return 'happy';
  }

  //////////////////////////////////////
  // 🧠 STORY MEMORY (PERSISTENT)
  //////////////////////////////////////
  setMemory(key, value = true) {
    if (this.storyMemory.hasOwnProperty(key)) {
      this.storyMemory[key] = value;
    }
  }

  resetMemory() {
    this.storyMemory = {
      askedWhoAreYou: false,
      askedAboutCones: false,
      askedAboutMath: false,
      heardAllJokes: false,
      farewellSaid: false
    };
  }

  //////////////////////////////////////
  // 📝 CHAT LOGGER (NEW!!)
  //////////////////////////////////////
  logChat(input, matched, response) {
    this.chatLogs.push({
      input,
      matched,
      response,
      timestamp: Date.now()
    });
  }

  clearChatLogs() {
    this.chatLogs = [];
  }

  exportChatLogs() {
    const blob = new Blob(
      [JSON.stringify(this.chatLogs, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chatLogs.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  //////////////////////////////////////
  // 💾 STORAGE
  //////////////////////////////////////
  saveToStorage() {
    const dataToSave = {
      profile: this.profile,
      settings: this.settings,
      stats: this.stats,
      storyProgress: this.storyProgress,
      storyMemory: this.storyMemory,
      chatLogs: this.chatLogs
    };
    localStorage.setItem('snowcone_save_data', JSON.stringify(dataToSave));
  }

  loadFromStorage() {
    const raw = localStorage.getItem('snowcone_save_data');
    if (raw) {
      try {
        const data = JSON.parse(raw);
        runInAction(() => {
          Object.assign(this.profile, data.profile);
          Object.assign(this.settings, data.settings);
          Object.assign(this.stats, data.stats);
          Object.assign(this.storyProgress, data.storyProgress);
          Object.assign(this.storyMemory, data.storyMemory);
          this.chatLogs = data.chatLogs || [];
        });
      } catch (err) {
        console.warn('⚠️ Bad save data. Resetting to defaults.', err);
      }
    }
  }

  resetAllData() {
    localStorage.removeItem('snowcone_save_data');
    window.location.reload();
  }
}

export const appState = new AppState();

/////////////////////////////////
// 💾 AUTO SAVE MACHINE
/////////////////////////////////
autorun(() => {
  appState.saveToStorage();
});

/////////////////////////////////
// 🧪 DEV FLAG
/////////////////////////////////
window.devFlags = { build: "v0.5.0-Sacred_Jukebox" };
