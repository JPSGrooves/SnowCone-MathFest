// src/data/rankModel.js
// Single source of truth for SnowCone rank names, rank lines, and rank order.
// Rank is currently based on SnowCone Completion %, not raw XP level.
// XP still has its own Level system: Level = Math.floor(profile.xp / 100) + 1.

export const RANK_BANDS = [
  {
    id: 'baby_cone',
    order: 0,
    minPercent: 0,
    title: 'Rank: Baby Cone',
    shortTitle: 'Baby Cone',
    line: 'Fresh Festival energy. Find your first cones!',
  },
  {
    id: 'cone_camper',
    order: 10,
    minPercent: 10,
    title: 'Rank: Cone Camper',
    shortTitle: 'Cone Camper',
    line: 'Looks like you might stay a while!',
  },
  {
    id: 'cone_cruiser',
    order: 20,
    minPercent: 20,
    title: 'Rank: Cone Cruiser',
    shortTitle: 'Cone Cruiser',
    line: 'You are learning the routes of the festival!',
  },
  {
    id: 'cone_groover',
    order: 30,
    minPercent: 30,
    title: 'Rank: Cone Groover',
    shortTitle: 'Cone Groover',
    line: 'Way to make your cone path!',
  },
  {
    id: 'badge_scout',
    order: 40,
    minPercent: 40,
    title: 'Rank: Badge Scout',
    shortTitle: 'Badge Scout',
    line: 'Your cone collection is looking real!',
  },
  {
    id: 'half_cone_hero',
    order: 50,
    minPercent: 50,
    title: 'Rank: Half-Cone Hero',
    shortTitle: 'Half-Cone Hero',
    line: 'The cone is half full!',
  },
  {
    id: 'cone_roller',
    order: 60,
    minPercent: 60,
    title: 'Rank: Cone Roller',
    shortTitle: 'Cone Roller',
    line: 'You are rolling through this festival with ease!',
  },
  {
    id: 'frequent_flyer',
    order: 70,
    minPercent: 70,
    title: 'Rank: Frequent Flyer',
    shortTitle: 'Frequent Flyer',
    line: 'Seeing the festival from a bird\'s eye view!',
  },
  {
    id: 'cone_connoisseur',
    order: 80,
    minPercent: 80,
    title: 'Rank: Cone Connoisseur',
    shortTitle: 'Cone Connoisseur',
    line: 'Your opinion on cones is well-informed by experience!',
  },
  {
    id: 'cone_commander',
    order: 90,
    minPercent: 90,
    title: 'Rank: Cone Commander',
    shortTitle: 'Cone Commander',
    line: 'The ghosts can see you targeting the last core cones!',
  },
];

export const LEGEND_CHASE_RANK = {
  id: 'legendary_cone_hunter',
  order: 95,
  minPercent: 95,
  title: 'Rank: Legendary Cone Hunter',
  shortTitle: 'Legendary Cone Hunter',
  line: '100% of Core Cones! The Legendary cone awaits!',
};

export const FULL_COMPLETE_RANK = {
  id: 'festival_legend',
  order: 100,
  minPercent: 100,
  title: 'Rank: Festival Legend',
  shortTitle: 'Festival Legend',
  line: 'You did everything! You are now a festival legend!',
};

function clampPercent(value) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function getCoreDoneFromBreakdown(breakdown) {
  return Number(breakdown?.badges?.badgesFrac ?? 0) >= 1;
}

function getLegendDoneFromBreakdown(breakdown) {
  return !!breakdown?.legendDone;
}

export function getRankModelFromCompletion({ percent = 0, breakdown = null } = {}) {
  const safePercent = clampPercent(percent);
  const coreDone = getCoreDoneFromBreakdown(breakdown);
  const legendDone = getLegendDoneFromBreakdown(breakdown);

  if (safePercent >= 100 && legendDone) {
    return {
      kind: 'full_complete',
      percent: safePercent,
      ...FULL_COMPLETE_RANK,
    };
  }

  if (coreDone && !legendDone) {
    return {
      kind: 'legend_chase',
      percent: safePercent,
      ...LEGEND_CHASE_RANK,
    };
  }

  const bandIndex = Math.max(0, Math.min(9, Math.floor(safePercent / 10)));
  const band = RANK_BANDS[bandIndex] || RANK_BANDS[0];

  return {
    kind: 'band',
    bandIndex,
    percent: safePercent,
    ...band,
  };
}

export function getRankModelForAppState(appState) {
  const percent = appState?.getCompletionPercent
    ? appState.getCompletionPercent()
    : 0;

  const breakdown = appState?.getCompletionBreakdown
    ? appState.getCompletionBreakdown()
    : null;

  return getRankModelFromCompletion({
    percent,
    breakdown,
  });
}

export function getRankOrder(rankId) {
  if (rankId === LEGEND_CHASE_RANK.id) {
    return LEGEND_CHASE_RANK.order;
  }

  if (rankId === FULL_COMPLETE_RANK.id) {
    return FULL_COMPLETE_RANK.order;
  }

  const band = RANK_BANDS.find((entry) => entry.id === rankId);
  return band ? band.order : -1;
}