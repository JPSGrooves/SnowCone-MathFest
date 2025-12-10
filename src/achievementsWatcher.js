// 📦 src/achievementsWatcher.js
// Central place to:
//  1) Auto-award internal badges (theme swap, mode tour, XP, Legend).
//  2) Mirror high scores + badges out to Game Center (via GameCenter bridge).
// Safe on web; real work only happens if native bridge is present.

import { autorun } from 'mobx';
import { awardBadge, allBadges as BADGES } from './managers/badgeManager.js';
import { GameCenter } from './managers/gameCenterBridge.js';

let wired = false;

// ───────────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────────

function hasAllNonLegend(ownedSet) {
  // “Non-legend” here means: everything except the 100% Legend badge
  // and any explicitly marked legendary flex goals.
  const allNonLegend = Object.entries(BADGES)
    .filter(([id, meta]) => {
      if (id === 'legend') return false;
      if (meta && meta.legendary) return false;
      return true;
    })
    .map(([id]) => id);

  return allNonLegend.every(id => ownedSet.has(id));
}

function numberOrZero(val) {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

// ───────────────────────────────────────────────────────────────────────────────
// Game Center: Leaderboard + Achievement ID maps
// ───────────────────────────────────────────────────────────────────────────────

// 🏆 Leaderboard IDs – these MUST match App Store Connect later.
// You can rename these to the real Apple IDs when you create them.
const LEADERBOARDS = {
  campingHighScore: 'gc_camping_high',       // Camping Score (lifetime best)
  quickServeHigh:   'gc_quickserve_high',    // QuickServe profile.qsHighScore
  infinityHigh:     'gc_infinity_high',      // Infinity profile.infinityHighScore
  infinityStreak:   'gc_infinity_streak',    // Infinity profile.infinityLongestStreak
};

// 🥇 Badge → Achievement mapping.
// Keys: your internal badge IDs from badges.js
// Values: Game Center achievement IDs you’ll configure in App Store Connect.
const BADGE_TO_ACHIEVEMENT = {
  // 🌀 Legendary Cones
  leg_menu_cone_clicker: 'gc_cone_clicker',
  leg_festival_regular:  'gc_7day_streak',
  leg_streak30:          'gc_30day_streak',
  leg_infinity_flow:     'gc_infinity_flow',
  leg_dual_endings:      'gc_dual_endings',
  legend:                'gc_legend_100pct',

  // 🌍 Core-ish / “feel good” achievements
  first_steps:    'gc_first_xp',
  math_zen:       'gc_1000_xp',
  mode_tour:      'gc_mode_tour',
  theme_swap:     'gc_theme_swap',
  listened_music: 'gc_listened_music',
  talk_grampy:    'gc_grampy_chat',

  // 🧸 Kids Camping highlights
  kids_cars_speed:    'gc_kids_cars_speed',
  kids_camp_10k:      'gc_kids_camp_10k',
  kids_mosquito:      'gc_kids_mosquito',
  kids_ants_streak10: 'gc_kids_ants_streak10',
  kids_tents_all:     'gc_kids_tents_all',

  // ⚡ QuickServe
  quick_25:  'gc_qs_25',
  quick_50:  'gc_qs_50',
  quick_75:  'gc_qs_75',
  quick_100: 'gc_qs_100',

  // ♾️ Infinity
  inf_25_1min:   'gc_inf_25',
  inf_50_2min:   'gc_inf_50',
  inf_100_4min:  'gc_inf_100',
  inf_250_10min: 'gc_inf_250',

  // 📖 Story beats
  story_prologue: 'gc_story_prologue',
  story_ch1:      'gc_story_ch1',
  story_ch2:      'gc_story_ch2',
  story_ch3:      'gc_story_ch3',
  story_ch4:      'gc_story_ch4',
  story_ch5:      'gc_story_ch5',
};

// ───────────────────────────────────────────────────────────────────────────────
// GC watcher helpers (MobX autoruns that mirror state → Game Center)
// ───────────────────────────────────────────────────────────────────────────────

function createHighScoreWatcher(appState) {
  const lastSent = {
    campingHighScore: 0,
    quickServeHigh: 0,
    infinityHigh: 0,
    infinityStreak: 0,
  };

  return autorun(() => {
    const profile = appState.profile || {};

    const camping = numberOrZero(profile.campingHighScore);
    const qs      = numberOrZero(profile.qsHighScore);
    const inf     = numberOrZero(profile.infinityHighScore);
    const streak  = numberOrZero(profile.infinityLongestStreak);

    // 🏕️ Camping
    if (camping > lastSent.campingHighScore) {
      lastSent.campingHighScore = camping;
      GameCenter.reportLeaderboardScore({
        boardId: LEADERBOARDS.campingHighScore,
        value: camping,
      });
    }

    // 🍔 QuickServe
    if (qs > lastSent.quickServeHigh) {
      lastSent.quickServeHigh = qs;
      GameCenter.reportLeaderboardScore({
        boardId: LEADERBOARDS.quickServeHigh,
        value: qs,
      });
    }

    // ♾️ Infinity score
    if (inf > lastSent.infinityHigh) {
      lastSent.infinityHigh = inf;
      GameCenter.reportLeaderboardScore({
        boardId: LEADERBOARDS.infinityHigh,
        value: inf,
      });
    }

    // ♾️ Infinity longest streak
    if (streak > lastSent.infinityStreak) {
      lastSent.infinityStreak = streak;
      GameCenter.reportLeaderboardScore({
        boardId: LEADERBOARDS.infinityStreak,
        value: streak,
      });
    }
  });
}

function createBadgeWatcher(appState) {
  let lastBadgeSet = new Set(
    Array.isArray(appState.profile?.badges) ? appState.profile.badges : []
  );

  return autorun(() => {
    const raw = appState.profile?.badges;
    const nowIds = Array.isArray(raw) ? raw.slice() : [];
    const nowSet = new Set(nowIds);

    // Find newly-added badges since last tick
    for (const id of nowSet) {
      if (!lastBadgeSet.has(id)) {
        const achievementId = BADGE_TO_ACHIEVEMENT[id];
        if (achievementId) {
          // Full completion; you could later do partial % for grindy goals.
          GameCenter.reportAchievement({
            achievementId,
            percent: 100,
          });
        }
      }
    }

    lastBadgeSet = nowSet;
  });
}

// ───────────────────────────────────────────────────────────────────────────────
// Public entry
// ───────────────────────────────────────────────────────────────────────────────

export function startAchievementsWatcher(appStateRef) {
  if (!appStateRef) {
    console.warn('startAchievementsWatcher: missing appStateRef');
    return;
  }
  if (wired) return;
  wired = true;

  const s = appStateRef;

  // ────────────────────────────────────────────────────────────────────────────
  // 🎨 Theme swap badge (first time user leaves default theme)
  // ────────────────────────────────────────────────────────────────────────────
  autorun(() => {
    const theme = s.settings?.theme;
    const badges = s.profile?.badges || [];
    if (!badges.includes('theme_swap') && theme && theme !== 'menubackground') {
      awardBadge('theme_swap');
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 🎪 Mode tour (tried QS + Infinity + Kids + Story + MathTips chat)
  // ────────────────────────────────────────────────────────────────────────────
  autorun(() => {
    const badgesArr = s.profile?.badges || [];
    const badges = new Set(badgesArr);
    const storyXP = Number(s.progress?.story?.xp) || 0;

    const triedQS    = ['quick_25','quick_50','quick_75','quick_100'].some(id => badges.has(id));
    const triedInf   = ['inf_25_1min','inf_50_2min','inf_100_4min','inf_250_10min'].some(id => badges.has(id));
    const triedKids  = ['kids_cars_speed','kids_camp_10k','kids_mosquito','kids_ants_streak10','kids_tents_all'].some(id => badges.has(id));
    const triedStory = storyXP > 0 || badges.has('story_prologue');
    const triedTips  = badges.has('talk_grampy');

    if (triedQS && triedInf && triedKids && triedStory && triedTips && !badges.has('mode_tour')) {
      awardBadge('mode_tour');
    }
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 🏅 XP milestones (global XP)
  // ────────────────────────────────────────────────────────────────────────────
  autorun(() => {
    const xp = Number(s.profile?.xp) || 0;
    const owned = new Set(s.profile?.badges || []);
    if (xp >= 1 && !owned.has('first_steps')) awardBadge('first_steps');
    if (xp >= 1000 && !owned.has('math_zen')) awardBadge('math_zen');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 🏆 LEGEND (100% completion model comments live in appState)
  //
  // We give Legend if ANY of these becomes true:
  //  A) overall completion ≥ 95% (the last 5% is the Legend itself)
  //  B) player owns all non-legend badges AND XP slice (xpFrac) ≥ 0.70
  //  C) failsafe on boot if they already own all other badges
  //
  // Using multiple guards makes it resilient no matter what order the player
  // does things (or if this watcher was added after they’d progressed).
  // ────────────────────────────────────────────────────────────────────────────

  // A) Percent-based trigger
  autorun(() => {
    const owned = new Set(s.profile?.badges || []);
    if (owned.has('legend')) return;

    const pct = Number(s.getCompletionPercent?.() ?? 0);
    if (pct >= 95) {
      awardBadge('legend');
    }
  });

  // B) XP slice (≥70%) + all non-legend badges
  autorun(() => {
    const owned = new Set(s.profile?.badges || []);
    if (owned.has('legend')) return;

    const breakdown = s.getCompletionBreakdown?.();
    // xpFrac is optional for now; if it's missing, this path just won’t fire.
    const xpFrac = Number(breakdown?.xp?.xpFrac) || 0; // 0..1

    if (hasAllNonLegend(owned) && xpFrac >= 0.70) {
      awardBadge('legend');
    }
  });

  // C) Failsafe once on boot (covers “I already had everything”)
  queueMicrotask(() => {
    const owned = new Set(s.profile?.badges || []);
    if (!owned.has('legend') && hasAllNonLegend(owned)) {
      awardBadge('legend');
    }
  });

  // D) Reactive catch-all: if either badges list or percent changes, re-check.
  const checkLegendNow = () => {
    const owned = new Set(s.profile?.badges || []);
    if (owned.has('legend')) return;

    const pct = Number(s.getCompletionPercent?.() ?? 0);
    if (pct >= 95 || hasAllNonLegend(owned)) {
      awardBadge('legend');
    }
  };
  autorun(() => {
    // deliberately “touch” both values so this autorun re-runs on either change
    const _badgeCount = (s.profile?.badges || []).length;
    const _pct = Number(s.getCompletionPercent?.() ?? 0);
    void _badgeCount; void _pct;
    checkLegendNow();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Game Center mirrors (high scores + badges)
  // ────────────────────────────────────────────────────────────────────────────

  const stopHighScores = createHighScoreWatcher(s);
  const stopBadges     = createBadgeWatcher(s);

  console.log('✅ achievementsWatcher wired.');

  // Optional teardown if you ever need it:
  return () => {
    stopHighScores?.();
    stopBadges?.();
  };
}
