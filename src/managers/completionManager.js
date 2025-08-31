// src/managers/completionManager.js
// Cosmic truth of "Game Completion" — no spaghetti, just vibes.

import { allBadges } from '../data/badges.js';

const clamp01 = (x) => Math.max(0, Math.min(1, Number.isFinite(x) ? x : 0));

export const COMPLETION_CONFIG = {
  weights: { xp: 0.70, badges: 0.25, legend: 0.05 },
  xpCaps: {
    global: 4000,
    story: 800,
    kidsCamping: 1000,
    quickServe: 500,
    infinity: 1000,
    // extra is derived as global - (story + kids + qs + inf) = 700
  }
};

function read(store, path, def = 0) {
  try {
    return path.split('.').reduce((a, k) => (a && a[k] != null ? a[k] : undefined), store) ?? def;
  } catch { return def; }
}

function safeNum(n) { return Number.isFinite(+n) ? +n : 0; }

function getNonLegendCounts(profile) {
  const ids = Object.keys(allBadges);
  const nonLegend = ids.filter(id => id !== 'legend');
  const have = Array.isArray(profile?.badges) ? profile.badges.filter(id => id !== 'legend') : [];
  return { haveCount: have.length, totalCount: nonLegend.length };
}

/**
 * Reads per-mode XP safely, clamps to the spec’d caps,
 * and computes the “extra” XP bucket (not from the four modes).
 */
function computeXPBuckets(store) {
  const caps = COMPLETION_CONFIG.xpCaps;

  // Known per-mode XP (these should exist in your appState; we read defensively)
  const storyXP      = safeNum(read(store, 'progress.story.xp'));
  const kidsXP       = safeNum(read(store, 'progress.kidsCamping.xp'));
  const quickServeXP = safeNum(read(store, 'progress.quickServe.xp'));
  const infinityXP   = safeNum(read(store, 'progress.infinity.xp'));

  // Total XP lifetime
  const totalXP = safeNum(read(store, 'profile.xp', 0));

  // Clamp per-mode toward their caps — extra beyond caps does NOT count to completion
  const cStory      = Math.min(storyXP, caps.story);
  const cKids       = Math.min(kidsXP, caps.kidsCamping);
  const cQS         = Math.min(quickServeXP, caps.quickServe);
  const cInfinity   = Math.min(infinityXP, caps.infinity);

  // “Known” XP we’re attributing to mode buckets (before clamp, for remainder math)
  const knownRaw = storyXP + kidsXP + quickServeXP + infinityXP;

  // Extra bucket:
  //   - We only take XP NOT from those four mode streams.
  //   - If your MathTips/streak XP lives outside those mode counters, it flows here.
  //   - Cap = global - (caps of the four modes).
  const extraCap = caps.global - (caps.story + caps.kidsCamping + caps.quickServe + caps.infinity); // 700
  const otherRaw = Math.max(0, totalXP - knownRaw); // anything not in the four modes
  const cExtra   = Math.min(otherRaw, extraCap);

  const credited = cStory + cKids + cQS + cInfinity + cExtra;
  const xpFrac   = clamp01(credited / caps.global);

  return {
    caps, credited, xpFrac,
    buckets: { story: cStory, kids: cKids, quickServe: cQS, infinity: cInfinity, extra: cExtra }
  };
}

/** Public: compute normalized fractions for each bucket + final percent (0–100). */
export function computeCompletionBreakdown(store) {
  const { weights } = COMPLETION_CONFIG;

  // XP bucket (70%)
  const xp = computeXPBuckets(store);

  // Badges bucket (25%) — exclude 'legend' from this fraction
  const { haveCount, totalCount } = getNonLegendCounts(store?.profile);
  const badgesFrac = totalCount > 0 ? clamp01(haveCount / totalCount) : 0;

  // Legend bucket (5%) — only when XP full AND all non-legend badges done
  const legendDone = xp.xpFrac >= 1 && badgesFrac >= 1 && Array.isArray(store?.profile?.badges) && store.profile.badges.includes('legend');
  const legendFrac = legendDone ? 1 : 0;

  const total =
    (xp.xpFrac * weights.xp) +
    (badgesFrac * weights.badges) +
    (legendFrac * weights.legend);

  return {
    xp, badgesFrac, legendDone,
    weights,
    totalFrac: clamp01(total),
    totalPercent: Math.round(clamp01(total) * 100)
  };
}

/** Convenience for UI (returns 0–100). */
export function getCompletionPercent(store) {
  return computeCompletionBreakdown(store).totalPercent;
}
