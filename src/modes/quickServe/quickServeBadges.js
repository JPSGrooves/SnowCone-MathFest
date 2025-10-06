// 🍧 quickServeBadges.js — single source of truth for QS badges + XP
import { appState } from '../../data/appState.js';
import { awardBadge } from '../../managers/badgeManager.js';

const QS_XP_PER_POINT = 0.5;

/** Award per-run cumulative XP and record high score. Call ONCE at run end. */
export function finalizeQuickServeRun(runScore) {
  const QS_XP_PER_POINT = 0.5;
  const xp = Math.max(0, Math.floor(runScore * QS_XP_PER_POINT));

  appState.addQuickServeXP(xp);

  // ✅ update both the profile-facing HS and the stats bucket
  appState.setQuickServeHighScore(runScore);
  appState.updateQuickServeHighScore(runScore);

  if (runScore >= 25)  awardBadge('quick_25');
  if (runScore >= 50)  awardBadge('quick_50');
  if (runScore >= 75)  awardBadge('quick_75');
  if (runScore >= 100) awardBadge('quick_100');
}


/** Check thresholds DURING the run as score increases. */
export function maybeAwardQuickServeBadges(score) {
  if (score >= 25)  awardBadge('quick_25');
  if (score >= 50)  awardBadge('quick_50');
  if (score >= 75)  awardBadge('quick_75');
  if (score >= 100) awardBadge('quick_100');
}
