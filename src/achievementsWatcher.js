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

// 🏆 Leaderboard IDs – v1: 3 core boards.
// These IDs must match what you configure in App Store Connect.
const LEADERBOARDS = {
  campingHighScore: 'scmf.camping.highscore',        // Camping games lifetime best
  quickServeHigh:   'scmf.quickserve.highscore',     // QuickServe profile.qsHighScore
  infinityStreak:   'scmf.infinity.longeststreak',   // Infinity Lake longest streak
};


// 🥇 Badge → Achievement mapping (v1).
// Keys: internal badge IDs from src/data/badges.js
// Values: Game Center achievement IDs defined in App Store Connect.
//
// This is your v1 “festival core” set of 10 achievements.

const BADGE_TO_ACHIEVEMENT = {
  // 📖 Story Mode
  story_prologue:      'scmf.story.prologue',      // Finish Prologue
  leg_dual_endings:    'scmf.story.dual_endings',  // See both endings

  // 🌀 Legendary
  legend:              'scmf.legend',              // Earn the Legendary Cone (100% completion)

  // ⚡ QuickServe
  quick_50:            'scmf.qs.shift_50',         // Serve 50 cones in one shift
  quick_100:           'scmf.qs.shift_100',        // Serve 100 cones in one shift

  // ♾️ Infinity Lake
  inf_100_4min:        'scmf.il.streak_100',       // 100 points in 4 minutes
  inf_250_10min:       'scmf.il.streak_250',       // 250 points in 10 minutes

  // 🧠 Meta / festival-wide
  talk_grampy:         'scmf.meta.grampyp',        // Talk to Grampy P
  leg_festival_regular:'scmf.meta.streak7',       // 7-day streak (Festival Regular)

  // 🧸 Kids Camping
  kids_mosquito:       'scmf.camp.mosquito',       // Smash the mosquito
};

// ───────────────────────────────────────────────────────────────────────────────
// GC watcher helpers (MobX autoruns that mirror state → Game Center)
// ───────────────────────────────────────────────────────────────────────────────

function createHighScoreWatcher(appState) {
  const lastSent = {
    campingHighScore: 0,
    quickServeHigh: 0,
    infinityStreak: 0,
  };

  return autorun(() => {
    const profile = appState.profile || {};

    const camping = numberOrZero(profile.campingHighScore);
    const qs      = numberOrZero(profile.qsHighScore);
    const streak  = numberOrZero(profile.infinityLongestStreak);

    // 🏕️ Camping – lifetime best camping score
    if (camping > lastSent.campingHighScore) {
      lastSent.campingHighScore = camping;
      GameCenter.reportLeaderboardScore({
        boardId: LEADERBOARDS.campingHighScore,
        value: camping,
      });
    }

    // 🍔 QuickServe – overall high score for shifts
    if (qs > lastSent.quickServeHigh) {
      lastSent.quickServeHigh = qs;
      GameCenter.reportLeaderboardScore({
        boardId: LEADERBOARDS.quickServeHigh,
        value: qs,
      });
    }

    // ♾️ Infinity Lake – longest streak only
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
