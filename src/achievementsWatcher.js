// src/achievementsWatcher.js
import { autorun } from 'mobx';
import { awardBadge } from './managers/badgeManager.js';

let wired = false;

export function startAchievementsWatcher(appStateRef) {
  if (!appStateRef) { console.warn('startAchievementsWatcher: missing appStateRef'); return; }
  if (wired) return;
  wired = true;

  const s = appStateRef;

  // 🖌️ Theme badge …
  autorun(() => {
    const theme = s.settings?.theme;
    const badges = s.profile?.badges || [];
    const hasThemeBadge = badges.includes('theme_swap');
    if (!hasThemeBadge && theme && theme !== 'menubackground') {
      awardBadge('theme_swap');
    }
  });

  // 🧭 Mode tour …
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
    if (allTried && !badges.has('mode_tour')) awardBadge('mode_tour');
  });

  // 🏅 XP milestones — fires for ANY mode that adds XP
  autorun(() => {
    const xp = Number(s.profile?.xp) || 0;
    const owned = new Set(s.profile?.badges || []);

    // 📌 your canon names:
    if (xp >= 1 && !owned.has('first_steps')) awardBadge('first_steps');   // “Get XP”
    if (xp >= 1000 && !owned.has('math_zen')) awardBadge('math_zen');      // “1000 XP”
  });

  console.log('✅ achievementsWatcher wired.');
}
