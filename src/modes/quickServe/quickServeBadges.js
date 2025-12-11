// 🍧 quickServeBadges.js — single source of truth for QS badges + XP

import { appState } from '../../data/appState.js';
import { awardBadge } from '../../managers/badgeManager.js';
import { hapticSoftPulse } from '../../utils/haptics.js';

const QS_XP_PER_POINT = 0.5;

// 🌟 Per-run milestone state — reset at the start of each shift
let qsMilestoneState = {
  hit25: false,
  hit50: false,
  hit75: false,
  hit100: false,
};

/**
 * Reset per-run milestone flags.
 * Call this once at the start of every QuickServe shift.
 */
export function resetQuickServeRunMilestones() {
  qsMilestoneState = {
    hit25: false,
    hit50: false,
    hit75: false,
    hit100: false,
  };
}

/**
 * Award per-run cumulative XP and record high score.
 * Call ONCE at run end.
 */
export function finalizeQuickServeRun(runScore) {
  const safeScore = Number.isFinite(runScore) ? runScore : 0;
  const xp = Math.max(0, Math.floor(safeScore * QS_XP_PER_POINT));

  // 🧮 XP for the run
  appState.addQuickServeXP(xp);

  // 🏆 High score tracking (profile + stats bucket)
  appState.setQuickServeHighScore(safeScore);
  appState.updateQuickServeHighScore(safeScore);

  // ⚡ QS badges are awarded *during* the run by maybeAwardQuickServeBadges().
  // No badge logic here to avoid double-awards and duplicate haptics.
}

/**
 * Check thresholds DURING the run as score increases.
 *
 * – Fires at most ONCE per threshold *per run* (25/50/75/100).
 * – Unlocks the real badge idempotently, with silent=true to avoid
 *   badge-level haptics.
 * – Triggers a single haptic pulse for each fresh threshold this run.
 */
export function maybeAwardQuickServeBadges(score) {
  const safeScore = Number.isFinite(score) ? score : 0;

  const milestones = [
    { threshold: 25,  flag: 'hit25',  badgeId: 'quick_25'  },
    { threshold: 50,  flag: 'hit50',  badgeId: 'quick_50'  },
    { threshold: 75,  flag: 'hit75',  badgeId: 'quick_75'  },
    { threshold: 100, flag: 'hit100', badgeId: 'quick_100' },
  ];

  for (const m of milestones) {
    // Already crossed this threshold this run? Skip.
    if (qsMilestoneState[m.flag]) continue;

    // Not yet crossed, and this score finally reaches it
    if (safeScore >= m.threshold) {
      qsMilestoneState[m.flag] = true;

      // 🔓 Unlock the badge quietly (idempotent)
      //    – First time in life: badge is added
      //    – Later runs: awardBadge is a no-op, but that's fine
      try {
        awardBadge(m.badgeId, { silent: true });
      } catch (err) {
        console.warn('[QuickServe] failed to award badge', m.badgeId, err);
      }

      // 📳 Single local haptic for *this run* crossing this milestone
      try {
        hapticSoftPulse();
      } catch (err) {
        console.warn('[QuickServe] milestone haptic failed', err);
      }
    }
  }
}
