// src/data/festivalWelcome.js
// Festival welcome / startup progress brain.
// Rank names and rank lines come from rankModel.js so Profile, Welcome,
// and future Festival Office panels all stay synced.

import { appState } from './appState.js';
import { allBadges as BADGES } from './badges.js';
import { getRankModelFromCompletion } from './rankModel.js';

// ───────────────────────────────────────────────────────────────
// Badge targeting – pick one badge to suggest
// ───────────────────────────────────────────────────────────────

function pickNextBadgeTarget({ preferLegendary = false } = {}) {
  const owned = new Set(appState?.profile?.badges || []);
  const entries = Object.entries(BADGES || {});

  const nonLegendCore = [];
  const legendaryPool = [];

  for (const [id, meta] of entries) {
    if (id === 'legend') continue;

    const legendary = !!(meta && meta.legendary);

    if (legendary) {
      legendaryPool.push([id, meta]);
    } else {
      nonLegendCore.push([id, meta]);
    }
  }

  const coreMissing = nonLegendCore.filter(([id]) => !owned.has(id));
  const legendaryMissing = legendaryPool.filter(([id]) => !owned.has(id));

  let candidate = null;

  if (preferLegendary) {
    if (legendaryMissing.length) {
      candidate = legendaryMissing[0];
    } else if (coreMissing.length) {
      candidate = coreMissing[0];
    }
  } else {
    if (coreMissing.length) {
      candidate = coreMissing[0];
    } else if (legendaryMissing.length) {
      candidate = legendaryMissing[0];
    }
  }

  if (!candidate) {
    return null;
  }

  const [id, meta] = candidate;

  const niceName =
    meta?.short ||
    meta?.displayName ||
    meta?.title ||
    meta?.label ||
    id;

  return {
    id,
    name: niceName,
  };
}

// ───────────────────────────────────────────────────────────────
// Completion / streak snapshot
// ───────────────────────────────────────────────────────────────

function getCompletionSnapshot() {
  let pct = 0;
  let legendDone = false;
  let badgesFrac = 0;

  try {
    if (typeof appState.getCompletionPercent === 'function') {
      pct = Number(appState.getCompletionPercent());
    }
  } catch {
    pct = 0;
  }

  try {
    if (typeof appState.getCompletionBreakdown === 'function') {
      const breakdown = appState.getCompletionBreakdown();

      if (breakdown && typeof breakdown === 'object') {
        legendDone = !!breakdown.legendDone;
        badgesFrac = Number(breakdown.badges?.badgesFrac ?? 0);
      }
    }
  } catch {
    // Keep safe defaults if completion math fails.
  }

  pct = Math.max(0, Math.min(100, Math.round(pct)));

  return {
    pct,
    legendDone,
    badgesFrac,
  };
}

// ───────────────────────────────────────────────────────────────
// Public API – model for the startup card / future Festival Office
// ───────────────────────────────────────────────────────────────

export function getFestivalWelcomeModel() {
  const { pct, legendDone, badgesFrac } = getCompletionSnapshot();

  const profile = appState?.profile || {};
  const username = profile.username || 'Friend';
  const streakRaw = profile.streakDays ?? 0;
  const streakDays = Number.isFinite(Number(streakRaw))
    ? Number(streakRaw)
    : 0;

  const firstVisit = !profile.hasSeenWelcome;

  if (firstVisit) {
    profile.hasSeenWelcome = true;
  }

  const greeting = firstVisit ? 'Welcome' : 'Welcome back';

  const breakdown = {
    badges: {
      badgesFrac,
    },
    legendDone,
  };

  const rank = getRankModelFromCompletion({
    percent: pct,
    breakdown,
  });

  if (rank.kind === 'full_complete') {
    return {
      kind: rank.kind,
      greeting,
      username,
      streakDays,
      percent: pct,
      title: rank.title,
      line: rank.line,
      rank,
      suggestion: null,
      suggestionText: 'Replay your favorite mode or flex a high score run.',
    };
  }

  if (rank.kind === 'legend_chase') {
    const target = pickNextBadgeTarget({ preferLegendary: true });

    const suggestionText = target
      ? `Try hunting down the "${target.name}" legendary badge to keep flexing the festival.`
      : 'Check your badges — legendary cones are the secret flex layer.';

    return {
      kind: rank.kind,
      greeting,
      username,
      streakDays,
      percent: pct,
      title: rank.title,
      line: rank.line,
      rank,
      suggestion: target,
      suggestionText,
    };
  }

  const target = pickNextBadgeTarget({ preferLegendary: false });

  const suggestionText = target
    ? `Try earning the "${target.name}" badge to nudge your completion higher.`
    : 'You’ve scooped up almost everything — revisit any mode that feels fun.';

  return {
    kind: rank.kind,
    bandIndex: rank.bandIndex,
    greeting,
    username,
    streakDays,
    percent: pct,
    title: rank.title,
    line: rank.line,
    rank,
    suggestion: target,
    suggestionText,
  };
}