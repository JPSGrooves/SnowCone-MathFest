// src/achievementsWatcher.js
import { autorun } from 'mobx';
import { awardBadge, allBadges as BADGES } from './managers/badgeManager.js';

let wired = false;

function hasAllNonLegend(ownedSet) {
  const allNonLegend = Object.keys(BADGES).filter(id => id !== 'legend');
  return allNonLegend.every(id => ownedSet.has(id));
}

export function startAchievementsWatcher(appStateRef) {
  if (!appStateRef) { console.warn('startAchievementsWatcher: missing appStateRef'); return; }
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
  // 🏆 LEGEND (100% completion model = 70% XP + 25% badges + 5% legend)
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
    // console.log('[achievements] legend percent check', { pct });
    if (pct >= 95) {
      awardBadge('legend');
    }
  });

  // B) XP slice (≥70%) + all non-legend badges
  autorun(() => {
    const owned = new Set(s.profile?.badges || []);
    if (owned.has('legend')) return;

    const breakdown = s.getCompletionBreakdown?.();
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

  console.log('✅ achievementsWatcher wired.');
}
