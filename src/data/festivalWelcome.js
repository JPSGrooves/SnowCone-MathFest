// src/data/festivalWelcome.js
// Welcome-screen "festival progress" brain.
// - 12 states total:
//   0–9:  ten 10% bands based on completion
//   10 : "all core badges done, go chase legendary cones"
//   11 : "full completion + legend badge = pure vibes"
// - Also picks one badge to nudge the player toward.

import { appState } from './appState.js';
import { allBadges as BADGES } from './badges.js';

// ───────────────────────────────────────────────────────────────
// Badge targeting – pick one badge to suggest
// ───────────────────────────────────────────────────────────────

function pickNextBadgeTarget({ preferLegendary = false } = {}) {
  const owned = new Set(appState?.profile?.badges || []);
  const entries = Object.entries(BADGES || {});

  const nonLegendCore = [];
  const legendaryPool = [];

  for (const [id, meta] of entries) {
    if (id === 'legend') continue; // meta-badge, not a cone itself
    const legendary = !!(meta && meta.legendary);

    if (legendary) {
      legendaryPool.push([id, meta]);
    } else {
      nonLegendCore.push([id, meta]);
    }
  }

  // Filter out badges the player already has
  const coreMissing = nonLegendCore.filter(([id]) => !owned.has(id));
  const legendaryMissing = legendaryPool.filter(([id]) => !owned.has(id));

  let candidate = null;

  if (preferLegendary) {
    // First try: a missing legendary badge
    if (legendaryMissing.length) {
      candidate = legendaryMissing[0];
    } else if (coreMissing.length) {
      candidate = coreMissing[0];
    }
  } else {
    // First try: a missing core badge
    if (coreMissing.length) {
      candidate = coreMissing[0];
    } else if (legendaryMissing.length) {
      candidate = legendaryMissing[0];
    }
  }

  if (!candidate) {
    // Nothing left to suggest
    return null;
  }

  const [id, meta] = candidate;

  const niceName =
    meta?.short ||         // 👈 matches what shows in the badge grid
    meta?.displayName ||
    meta?.title ||
    meta?.label ||
    id;

  return { id, name: niceName };
}
// Do they actually have *all* the legendary cone badges?
function hasAllLegendaryCones(profile) {
  try {
    const owned = new Set(profile?.badges || []);
    const entries = Object.entries(BADGES || {});

    const legendaryIds = entries
      .filter(([id, meta]) => !!meta?.legendary) // leg_* cones only
      .map(([id]) => id);

    if (!legendaryIds.length) return false; // defensive, but in practice we have some

    return legendaryIds.every(id => owned.has(id));
  } catch {
    return false;
  }
}

// ───────────────────────────────────────────────────────────────
// Completion / streak snapshot
// ───────────────────────────────────────────────────────────────

// ⬆️ your existing imports stay the same

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
    // fallback if anything explodes – keep defaults
  }

  // defensive clamp
  pct = Math.max(0, Math.min(100, Math.round(pct)));

  return { pct, legendDone, badgesFrac };
}

export function getFestivalWelcomeModel() {
  const { pct, legendDone, badgesFrac } = getCompletionSnapshot();

  const profile    = appState?.profile || {};
  const username   = profile.username || 'Friend';
  const streakRaw  = profile.streakDays ?? 0;
  const streakDays = Number.isFinite(Number(streakRaw)) ? Number(streakRaw) : 0;

  const firstVisit = !profile.hasSeenWelcome;
  if (firstVisit) {
    profile.hasSeenWelcome = true;
  }

  const greeting        = firstVisit ? 'Welcome' : 'Welcome back';
  const allCoreDone     = badgesFrac >= 1;
  const allLegendaryOwn = hasAllLegendaryCones(profile);

  // State 12: FULL COMPLETE = core 100% + *all* legendary cones + Legend badge
  if (legendDone && allLegendaryOwn && pct >= 100) {
    return {
      kind: 'full_complete',
      greeting,
      username,
      streakDays,
      percent: pct,
      title: FULL_COMPLETE_MESSAGE.title,
      line: FULL_COMPLETE_MESSAGE.line,
      suggestion: null,
      suggestionText: 'Replay your favorite mode or flex a high score run.',
    };
  }

  // State 11: core is done, but legendary layer is not fully cleared yet
  if (allCoreDone && (!legendDone || !allLegendaryOwn)) {
    const target = pickNextBadgeTarget({ preferLegendary: true });

    const suggestionText = target
      ? `Try hunting down the "${target.name}" legendary badge to unlock the final legend.`
      : 'Check your badges—legendary cones are the last secret layer.';

    return {
      kind: 'legend_chase',
      greeting,
      username,
      streakDays,
      percent: pct,
      title: LEGEND_CHASE_MESSAGE.title,
      line: LEGEND_CHASE_MESSAGE.line,
      suggestion: target,
      suggestionText,
    };
  }

  // States 0–10: normal 10% bands (unchanged)
  const bandIndex = Math.max(0, Math.min(9, Math.floor(pct / 10)));
  const band = BAND_MESSAGES[bandIndex];

  const target = pickNextBadgeTarget({ preferLegendary: false });

  const suggestionText = target
    ? `Try earning the "${target.name}" badge to nudge your completion higher.`
    : 'You’ve scooped up almost everything—revisit any mode that feels fun.';

  return {
    kind: 'band',
    bandIndex,
    greeting,
    username,
    streakDays,
    percent: pct,
    title: band.title,
    line: band.line,
    suggestion: target,
    suggestionText,
  };
}

function getStreakDays() {
  try {
    return Number(appState?.profile?.streakDays ?? 0);
  } catch {
    return 0;
  }
}

// ───────────────────────────────────────────────────────────────
// 12 messages: 10 bands + 2 special states
// ───────────────────────────────────────────────────────────────

// 10 base bands for 0–99%
// index = 0..9 based on Math.floor(pct / 10)
const BAND_MESSAGES = [
  {
    id: 'band_0',
    title: 'Rank: Baby Cone',
    line: 'Day-one festival vibes. Every scoop counts.',
  },
  {
    id: 'band_1',
    title: 'Rank: Cone Camper',
    line: 'You’ve pitched your tent and started exploring.',
  },
  {
    id: 'band_2',
    title: 'Rank: Cone Cruiser',
    line: 'You know your way around a couple modes now.',
  },
  {
    id: 'band_3',
    title: 'Rank: Cone Climber',
    line: 'You’re climbing the XP hill, scoop by scoop.',
  },
  {
    id: 'band_4',
    title: 'Rank: Half-Cone Hero',
    line: 'Half the festival has your footprints on it.',
  },
  {
    id: 'band_5',
    title: 'Rank: Cone Captain',
    line: 'More done than not. Your cones are adding up.',
  },
  {
    id: 'band_6',
    title: 'Rank: Badge Scout',
    line: 'Your badge row is getting chunky. Keep hunting.',
  },
  {
    id: 'band_7',
    title: 'Rank: Festival Pilot',
    line: 'You’re steering through the high-range routes now.',
  },
  {
    id: 'band_8',
    title: 'Rank: Glow Chaser',
    line: 'Almost full festival. A few pushes unlock the finale.',
  },
  {
    id: 'band_9',
    title: 'Rank: Cone Commander',
    line: 'Late-game vibes. Target a few specific badges to finish core progress.',
  },
];

const LEGEND_CHASE_MESSAGE = {
  id: 'legend_chase',
  title: 'Rank: Legendary Cone Hunter',
  line: 'Core festival paths are cleared. Time to chase the rare cones.',
};

const FULL_COMPLETE_MESSAGE = {
  id: 'full_complete',
  title: 'Rank: Festival Legend',
  line: 'You’ve seen it all. Everything now is pure style runs and vibes.',
};

// ───────────────────────────────────────────────────────────────
// Public API – model for the startup card
// ───────────────────────────────────────────────────────────────
