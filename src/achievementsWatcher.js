// src/achievementsWatcher.js
import { autorun } from 'mobx';
import { awardBadge } from './managers/badgeManager.js';

let wired = false;

/**
 * Wire achievement reactions. Must be called AFTER appState exists.
 * Idempotent: no double-wiring during HMR.
 */
export function startAchievementsWatcher(appStateRef) {
  if (!appStateRef) {
    console.warn('startAchievementsWatcher: missing appStateRef');
    return;
  }
  if (wired) return;
  wired = true;

  const s = appStateRef; // <-- bind once, no “store is not defined” drama

  // 🖌️ Theme change → theme_swap (first non-default theme)
  const DEFAULT_THEME = 'menubackground';
  autorun(() => {
    // read observables so MobX tracks deps:
    const theme = s.settings?.theme;
    const badges = s.profile?.badges || [];
    const hasThemeBadge = badges.includes('theme_swap');

    if (!hasThemeBadge && theme && theme !== DEFAULT_THEME) {
      awardBadge('theme_swap');
    }
  });

  // 🧭 Mode tour → mode_tour after all tried at least once
  autorun(() => {
    const badgesArr = s.profile?.badges || [];
    const badges = new Set(badgesArr);
    const storyXP = Number(s.progress?.story?.xp) || 0;

    const triedQS    = ['quick_25','quick_50','quick_75','quick_100'].some(id => badges.has(id));
    const triedInf   = ['inf_25_1min','inf_50_2min','inf_100_4min','inf_250_10min'].some(id => badges.has(id));
    const triedKids  = ['kids_cars_speed','kids_camp_10k','kids_mosquito','kids_ants_streak10','kids_tents_all'].some(id => badges.has(id));
    const triedStory = storyXP > 0 || badges.has('story_prologue');
    const triedTips  = badges.has('talk_grampy');

    const allTried = triedQS && triedInf && triedKids && triedStory && triedTips;
    if (allTried && !badges.has('mode_tour')) {
      awardBadge('mode_tour');
    }
  });

  // (Optional) Log once so you know we’re live
  console.log('✅ achievementsWatcher wired.');
}
