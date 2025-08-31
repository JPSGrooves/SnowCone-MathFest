// appState.js
import { makeAutoObservable, autorun, runInAction } from 'mobx';
import {
  getCompletionPercent as computeCompletionPercent,
  computeCompletionBreakdown
} from '../managers/completionManager.js';

class AppState {
  profile = {
    // ... existing
    unlockedThemes: [],     // 🆕 stash of unlocked backgrounds
    infinityHighScore: 0,
    infinityLongestStreak: 0,
    username: 'Friend',
    xp: 0,
    level: 1,
    qsHighScore: 0, // 🏁 Add this!
    badges: [],
    completedModes: [],
    lastPlayed: null,
    seenIntro: false,
    streakDays: 0,
    lastStreakDayKey: null // 'YYYY-MM-DD' in America/New_York
  };
  

  settings = {
    theme: 'menubackground',
    mute: false,
    difficulty: 'normal',
    loop: false,
    shuffle: false,
    gameMode: 'add' // 🧪 NEW: default mode!
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

  // ✅ Per-mode XP that feeds completion math (clamped by completionManager caps)
  progress = {
    story:       { xp: 0 },   // cap 800
    kidsCamping: { xp: 0 },   // cap 1000
    quickServe:  { xp: 0 },   // cap 500
    infinity:    { xp: 0 },   // cap 1000
  };


  uiState = {
    pendingBadgePopup: null,
    triggerBadgeModal: false,
    currentMode: null,
    gameMode: 'add' // 💥 Default safe value!
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

    return amount; // ✅ This makes it future-safe
  }

  // ---------- Mode XP helpers (feed completion buckets) ----------
  _addXPNumber(n) { return Number.isFinite(+n) ? Math.max(0, +n) : 0; }

  addStoryXP(amount) {
    const n = this._addXPNumber(amount);
    if (!n) return 0;
    this.addXP(n);
    this.progress.story.xp += n;
    return n;
  }
  addKidsCampingXP(amount) {
    const n = this._addXPNumber(amount);
    if (!n) return 0;
    this.addXP(n);
    this.progress.kidsCamping.xp += n;
    return n;
  }
  addQuickServeXP(amount) {
    const n = this._addXPNumber(amount);
    if (!n) return 0;
    this.addXP(n);
    this.progress.quickServe.xp += n;
    return n;
  }
  addInfinityXP(amount) {
    const n = this._addXPNumber(amount);
    if (!n) return 0;
    this.addXP(n);
    this.progress.infinity.xp += n;
    return n;
  }


  setUsername(name) {
    this.profile.username = name;
  }

  setLastPlayed(timestamp = Date.now()) {
    this.profile.lastPlayed = timestamp;
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

  setQuickServeHighScore(score) {
    if (score > this.profile.qsHighScore) {
      this.profile.qsHighScore = score;
      console.log(`🏆 New QuickServe High Score: ${score}`);
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

    // 🔥 Count daily streak on real gameplay modes only
    const gameplayModes = new Set([
      'mathtips',
      'quickserve',
      'infinity',
      'story',
      'kids',
      'camping'
      // add/remove to match your actual mode ids
    ]);

    if (gameplayModes.has(mode)) {
      try { this.touchDailyStreak(`enter:${mode}`); } catch {}
    }
  }


  setGameMode(mode) {
    this.settings.gameMode = mode;
  }

  getGameMode() {
    return this.settings.gameMode;
  }

  //////////////////////////////////////
  // 🔮 MOOD ENGINE (XP DRIVEN)
  //////////////////////////////////////
  // ---------- Completion & Mood ----------
  getCompletionPercent() {
    try {
      // 🔥 real model: 70% XP + 25% badges + 5% legend
      return computeCompletionPercent(this);
    } catch {
      // fallback if manager isn't loaded yet
      return Math.min(Math.round((this.profile.xp / 4000) * 100), 100);
    }
  }

  // (optional) expose full breakdown for debugging / UI badges page
  getCompletionBreakdown() {
    try {
      return computeCompletionBreakdown(this);
    } catch {
      return {
        totalPercent: Math.min(Math.round((this.profile.xp / 4000) * 100), 100),
        xp: { xpFrac: (this.profile.xp / 4000), buckets: { story:0, kids:0, quickServe:0, infinity:0, extra:0 } },
        badgesFrac: 0, legendDone: false
      };
    }
  }

  getMood() {
    const pct = this.getCompletionPercent();
    if (pct >= 100) return 'cosmic';
    if (pct >= 80)  return 'elated';
    if (pct >= 60)  return 'hyped';
    if (pct >= 40)  return 'silly';
    if (pct >= 20)  return 'curious';
    return 'happy';
  }


  //////////////////////////////////////
  // 🍄 POP COUNT (Kids Camping)
  //////////////////////////////////////
  popCount = 0;

  incrementPopCount(amount = 1) {
    this.popCount += amount;
    document.dispatchEvent(new CustomEvent('campScoreUpdated', { detail: this.popCount })); // Notify UI
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
   // 💾 STORAGE (patch both methods)

  // saveToStorage()
  saveToStorage() {
    const dataToSave = {
      profile: this.profile,
      settings: this.settings,
      stats: this.stats,
      storyProgress: this.storyProgress,
      storyMemory: this.storyMemory,
      chatLogs: this.chatLogs,
      popCount: this.popCount,
      progress: this.progress,              // ✅ add this
    };
    localStorage.setItem('snowcone_save_data', JSON.stringify(dataToSave));
  }

  // loadFromStorage()
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
          this.popCount = data.popCount || 0;

          // ✅ merge progress safely (keep defaults if missing)
          if (data.progress) {
            this.progress.story       = { xp: 0, ...(data.progress.story || {}) };
            this.progress.kidsCamping = { xp: 0, ...(data.progress.kidsCamping || {}) };
            this.progress.quickServe  = { xp: 0, ...(data.progress.quickServe || {}) };
            this.progress.infinity    = { xp: 0, ...(data.progress.infinity || {}) };
          }
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

  //////////////////////////////////////
  // 🔥 DAILY STREAK (America/New_York)
  //////////////////////////////////////
  getNYDayKey(ts = Date.now()) {
    const d = new Date(ts);
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/New_York',
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(d);
    const y = parts.find(p => p.type === 'year')?.value || '0000';
    const m = parts.find(p => p.type === 'month')?.value || '00';
    const dd = parts.find(p => p.type === 'day')?.value || '00';
    return `${y}-${m}-${dd}`;
  }

  // Call this on meaningful activity (e.g., solved rep).
  touchDailyStreak(reason = 'activity') {
    const today = this.getNYDayKey();
    const last  = this.profile.lastStreakDayKey;

    if (!last) {
      this.profile.lastStreakDayKey = today;
      this.profile.streakDays = 1; // first real activity = day 1
      return this.profile.streakDays;
    }

    if (last === today) return this.profile.streakDays; // already counted today

    const yest = this.getNYDayKey(Date.now() - 86400000);
    this.profile.streakDays = (last === yest) ? (this.profile.streakDays + 1) : 1;
    this.profile.lastStreakDayKey = today;
    return this.profile.streakDays;
  }
  // ✅ quick checks
  hasBadge(id) {
    return Array.isArray(this.profile.badges) && this.profile.badges.includes(id);
  }

  hasTheme(themeId) {
    const base = ['menubackground', 'freedom']; // always usable
    const unlocked = this.profile.unlockedThemes || [];
    return base.includes(themeId) || unlocked.includes(themeId);
  }

  // ✅ unlock a theme (id from allBadges[id].unlocks)
  unlockTheme(themeId) {
    if (!themeId) return false;
    const arr = this.profile.unlockedThemes || (this.profile.unlockedThemes = []);
    if (!arr.includes(themeId)) {
      arr.push(themeId);
      console.log(`🎨 Theme unlocked: ${themeId}`);
      return true;
    }
    return false;
  }

  // ✅ badge inventory (kept simple; badgeManager does the theme side)
  unlockBadge(id) {
    if (!this.profile.badges.includes(id)) {
      this.profile.badges.push(id);
      this.setPendingBadge(id); // banner hook
    }
  }
} // ← make sure this is the actual end of the class

export const appState = new AppState();

// 💾 AUTO SAVE MACHINE
autorun(() => {
  appState.saveToStorage();
});

// 🧪 DEV FLAG
window.devFlags = { build: "v0.8.8-The Grampy P Badge" };
