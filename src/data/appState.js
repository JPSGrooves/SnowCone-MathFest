// appState.js
import { makeAutoObservable, autorun, runInAction, toJS, observable } from 'mobx';
import { allBadges as BADGES } from '../managers/badgeManager.js';

// ───────────────────────────────────────────────────────────────────────────────
// Small helpers
// ───────────────────────────────────────────────────────────────────────────────
class InventoryEntry {
  constructor(id, name, qty = 1, meta = {}) {
    Object.assign(this, { id, name, qty, meta });
  }
}

class CurrencyPurse {
  amount = 0;
  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }
  add(n = 0) {
    this.amount = Math.max(0, this.amount + (n | 0));
  }
  spend(n = 0) {
    n = n | 0;
    if (n <= 0) return true;
    if (this.amount < n) return false;
    this.amount -= n;
    return true;
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// AppState
// ───────────────────────────────────────────────────────────────────────────────
class AppState {
  // Profile / user meta
  profile = {
    unlockedThemes: [],
    infinityHighScore: 0,
    infinityLongestStreak: 0,
    username: 'Friend',
    xp: 0,
    level: 1,
    qsHighScore: 0,
    badges: [],
    completedModes: [],
    lastPlayed: null,
    seenIntro: false,
    streakDays: 0,
    lastStreakDayKey: null, // 'YYYY-MM-DD' in America/New_York
  };

  // Settings (single source of truth for gameMode)
  settings = {
    theme: 'menubackground',
    mute: false,
    difficulty: 'normal',
    loop: false,
    shuffle: false,
    gameMode: 'add',
  };

  // Stats
  stats = {
    quickServe: { sessions: 0, topScore: 0 },
    infinity: { timeSpent: 0 },
    story: { chapter: 0 },
  };

  // Story progress
  storyProgress = {
    currentChapter: 0,
    seenPanels: [],
  };

  // Per-mode XP (feeds completion math; caps enforced elsewhere)
  progress = {
    story: { xp: 0 },       // cap 800
    kidsCamping: { xp: 0 }, // cap 1000
    quickServe: { xp: 0 },  // cap 500
    infinity: { xp: 0 },    // cap 1000
  };

  // UI state (no duplicate gameMode here)
  uiState = {
    pendingBadgePopup: null,
    triggerBadgeModal: false,
    currentMode: null,
  };

  // Story memory flags
  storyMemory = {
    askedWhoAreYou: false,
    askedAboutCones: false,
    askedAboutMath: false,
    heardAllJokes: false,
    farewellSaid: false,
  };

  // Logs
  chatLogs = [];

  // Camping pop count
  popCount = 0;

  // Inventory & currency
  inventory = observable.map(); // id -> InventoryEntry (observable)
  purse = new CurrencyPurse();

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    this.loadFromStorage();
  }

  // ── XP / Leveling ────────────────────────────────────────────────────────────
  addXP(amount) {
    this.profile.xp += amount;
    const newLevel = Math.floor(this.profile.xp / 100) + 1;
    if (newLevel > this.profile.level) {
      this.profile.level = newLevel;
    }
    return amount;
  }

  _addXPNumber(n) { return Number.isFinite(+n) ? Math.max(0, +n) : 0; }

  addStoryXP(amount)       { const n = this._addXPNumber(amount); if (!n) return 0; this.addXP(n); this.progress.story.xp += n;       return n; }
  addKidsCampingXP(amount) { const n = this._addXPNumber(amount); if (!n) return 0; this.addXP(n); this.progress.kidsCamping.xp += n; return n; }
  addQuickServeXP(amount)  { const n = this._addXPNumber(amount); if (!n) return 0; this.addXP(n); this.progress.quickServe.xp += n;  return n; }
  addInfinityXP(amount)    { const n = this._addXPNumber(amount); if (!n) return 0; this.addXP(n); this.progress.infinity.xp += n;    return n; }

  setUsername(name) { this.profile.username = name; }
  setLastPlayed(timestamp = Date.now()) { this.profile.lastPlayed = timestamp; }

  markModeComplete(mode) {
    if (!this.profile.completedModes.includes(mode)) {
      this.profile.completedModes.push(mode);
    }
  }

  setSeenIntro(flag = true) { this.profile.seenIntro = flag; }

  // ── Stats ────────────────────────────────────────────────────────────────────
  incrementQuickServeSessions() { this.stats.quickServe.sessions += 1; }

  updateQuickServeHighScore(score) {
    if (score > this.stats.quickServe.topScore) {
      this.stats.quickServe.topScore = score;
    }
  }

  addInfinityTime(seconds) { this.stats.infinity.timeSpent += seconds; }

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

  // ── Settings / UI ────────────────────────────────────────────────────────────
  setSetting(key, value) {
    if (Object.prototype.hasOwnProperty.call(this.settings, key)) {
      this.settings[key] = value;
    }
  }
  toggleMute() { this.settings.mute = !this.settings.mute; }
  setTheme(themeId) { this.settings.theme = themeId; }

  setTriggerBadgeModal(flag = true) { this.uiState.triggerBadgeModal = flag; }
  clearTriggerBadgeModal() { this.uiState.triggerBadgeModal = false; }

  setPendingBadge(id) { this.uiState.pendingBadgePopup = id; }
  clearPendingBadgePopup() { this.uiState.pendingBadgePopup = null; }

  setCurrentMode(mode) { this.uiState.currentMode = mode; }
  clearCurrentMode() { this.uiState.currentMode = null; }

  setMode(mode) {
    this.setCurrentMode(mode);
    const gameplayModes = new Set(['mathtips','quickserve','infinity','story','kids','camping']);
    if (gameplayModes.has(mode)) {
      try { this.touchDailyStreak(`enter:${mode}`); } catch {}
    }
  }

  setGameMode(mode) { this.settings.gameMode = mode; }
  getGameMode() { return this.settings.gameMode; }

  // ── Completion / Mood ────────────────────────────────────────────────────────
  getCompletionPercent() {
    try {
      const owned = new Set(this.profile?.badges || []);
      const allIds = Object.keys(BADGES || {});
      const nonLegendIds = allIds.filter(id => id !== 'legend');

      const nonLegendOwned = nonLegendIds.filter(id => owned.has(id)).length;
      const haveLegend = owned.has('legend');

      const nonLegendFrac = nonLegendIds.length ? (nonLegendOwned / nonLegendIds.length) : 0;
      const pct = (nonLegendFrac * 95) + (haveLegend ? 5 : 0);

      return Math.round(Math.min(100, Math.max(0, pct)));
    } catch {
      const haveLegend = !!this.profile?.badges?.includes?.('legend');
      const total = (this.profile?.badges || []).length;
      const nonLegendOwned = haveLegend ? (total - 1) : total;
      const approx = (nonLegendOwned / Math.max(1, total)) * 95 + (haveLegend ? 5 : 0);
      return Math.round(Math.min(100, Math.max(0, approx)));
    }
  }

  getCompletionBreakdown() {
    const owned = new Set(this.profile?.badges || []);
    const allIds = Object.keys(BADGES || {});
    const nonLegendIds = allIds.filter(id => id !== 'legend');

    const nonLegendOwned = nonLegendIds.filter(id => owned.has(id)).length;
    const haveLegend = owned.has('legend');

    const nonLegendFrac = nonLegendIds.length ? (nonLegendOwned / nonLegendIds.length) : 0;

    const totalPercent = Math.round(
      Math.min(100, (nonLegendFrac * 95) + (haveLegend ? 5 : 0))
    );

    return {
      totalPercent,
      badges: {
        nonLegendTotal: nonLegendIds.length,
        nonLegendOwned,
        badgesFrac: nonLegendFrac,
      },
      legendDone: haveLegend,
    };
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

  // ── Kids Camping pop count ───────────────────────────────────────────────────
  incrementPopCount(amount = 1) {
    this.popCount += amount;
    document.dispatchEvent(new CustomEvent('campScoreUpdated', { detail: this.popCount }));
  }

  // ── Story memory ─────────────────────────────────────────────────────────────
  setMemory(key, value = true) {
    if (Object.prototype.hasOwnProperty.call(this.storyMemory, key)) {
      this.storyMemory[key] = value;
    }
  }
  resetMemory() {
    this.storyMemory = {
      askedWhoAreYou: false,
      askedAboutCones: false,
      askedAboutMath: false,
      heardAllJokes: false,
      farewellSaid: false,
    };
  }

  // ── Chat logs ────────────────────────────────────────────────────────────────
  logChat(input, matched, response) {
    this.chatLogs.push({ input, matched, response, timestamp: Date.now() });
  }
  clearChatLogs() { this.chatLogs = []; }
  exportChatLogs() {
    const blob = new Blob([JSON.stringify(this.chatLogs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'chatLogs.json'; a.click();
    URL.revokeObjectURL(url);
  }

  // ── Inventory / Currency API ─────────────────────────────────────────────────
  addItem(id, payload = {}) {
    const cur = this.inventory.get(id);
    if (cur) {
      cur.qty += 1;
      this.inventory.set(id, cur);
    } else {
      const e = new InventoryEntry(id, payload.name ?? id, 1, payload.meta ?? {});
      this.inventory.set(id, e);
    }
  }
  removeItem(id, n = 1) {
    const cur = this.inventory.get(id);
    if (!cur) return;
    cur.qty = Math.max(0, cur.qty - (n | 0));
    if (cur.qty === 0) this.inventory.delete(id);
    else this.inventory.set(id, cur);
  }
  hasItem(id) { return this.inventory.has(id); }
  getItem(id) { return this.inventory.get(id) ?? null; }
  listItems() { return Array.from(this.inventory.values()); }

  addCurrency(n) { this.purse.add(n); }
  spendCurrency(n) { return this.purse.spend(n); }
  getCurrency() { return this.purse.amount; }

  // ── Storage ─────────────────────────────────────────────────────────────────
  saveToStorage() {
    try {
      const dataToSave = {
        profile:       toJS(this.profile),
        settings:      toJS(this.settings),
        stats:         toJS(this.stats),
        storyProgress: toJS(this.storyProgress),
        storyMemory:   toJS(this.storyMemory),
        chatLogs:      toJS(this.chatLogs),
        popCount:      this.popCount,
        progress:      toJS(this.progress),
        currency:      this.purse.amount,
        inventory:     Object.fromEntries(this.inventory), // { id -> InventoryEntry }
      };
      localStorage.setItem('snowcone_save_data', JSON.stringify(dataToSave));
    } catch (e) {
      console.warn('save failed', e);
    }
  }

  loadFromStorage() {
    const raw = localStorage.getItem('snowcone_save_data');
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      runInAction(() => {
        Object.assign(this.profile,       data.profile);
        Object.assign(this.settings,      data.settings);
        Object.assign(this.stats,         data.stats);
        Object.assign(this.storyProgress, data.storyProgress);
        Object.assign(this.storyMemory,   data.storyMemory);
        this.chatLogs = data.chatLogs || [];
        this.popCount = data.popCount || 0;

        if (data.progress) {
          this.progress.story       = { xp: 0, ...(data.progress.story || {}) };
          this.progress.kidsCamping = { xp: 0, ...(data.progress.kidsCamping || {}) };
          this.progress.quickServe  = { xp: 0, ...(data.progress.quickServe || {}) };
          this.progress.infinity    = { xp: 0, ...(data.progress.infinity || {}) };
        }

        if (typeof data.currency === 'number') this.purse.amount = data.currency | 0;
        this.inventory.clear();
        if (data.inventory && typeof data.inventory === 'object') {
          for (const [id, obj] of Object.entries(data.inventory)) {
            this.inventory.set(
              id,
              new InventoryEntry(id, obj.name ?? id, obj.qty ?? 1, obj.meta ?? {})
            );
          }
        }
      });
    } catch (err) {
      console.warn('⚠️ Bad save data. Resetting to defaults.', err);
    }
  }

  resetAllData() {
    localStorage.removeItem('snowcone_save_data');
    window.location.reload();
  }

  // ── Daily streak (America/New_York) ──────────────────────────────────────────
  getNYDayKey(ts = Date.now()) {
    const d = new Date(ts);
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/New_York',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(d);
    const y  = parts.find(p => p.type === 'year')?.value || '0000';
    const m  = parts.find(p => p.type === 'month')?.value || '00';
    const dd = parts.find(p => p.type === 'day')?.value || '00';
    return `${y}-${m}-${dd}`;
  }

  touchDailyStreak() {
    const today = this.getNYDayKey();
    const last  = this.profile.lastStreakDayKey;

    if (!last) {
      this.profile.lastStreakDayKey = today;
      this.profile.streakDays = 1;
      return this.profile.streakDays;
    }
    if (last === today) return this.profile.streakDays;

    const yest = this.getNYDayKey(Date.now() - 86400000);
    this.profile.streakDays = (last === yest) ? (this.profile.streakDays + 1) : 1;
    this.profile.lastStreakDayKey = today;
    return this.profile.streakDays;
  }

  // ── Badges / Themes ─────────────────────────────────────────────────────────
  hasBadge(id) {
    return Array.isArray(this.profile.badges) && this.profile.badges.includes(id);
  }
  hasTheme(themeId) {
    const base = ['menubackground', 'freedom'];
    const unlocked = this.profile.unlockedThemes || [];
    return base.includes(themeId) || unlocked.includes(themeId);
  }
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
  unlockBadge(id) {
    if (!this.profile.badges.includes(id)) {
      this.profile.badges.push(id);
      this.setPendingBadge(id);
    }
  }
}

// singleton
export const appState = new AppState();

// Deep-tracked autosave (reads snapshots so mutations trigger this)
autorun(() => {
  void toJS(appState.profile);
  void toJS(appState.settings);
  void toJS(appState.stats);
  void toJS(appState.storyProgress);
  void toJS(appState.storyMemory);
  void toJS(appState.chatLogs);
  void toJS(appState.progress);
  void Object.fromEntries(appState.inventory);
  void appState.purse.amount;
  appState.saveToStorage();
});

// 🧪 DEV FLAG
window.devFlags = { build: 'v0.9.9 — Just Small Details Now' };
