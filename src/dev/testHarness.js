// src/dev/testHarness.js (load in dev only)
import { appState } from '../data/appState.js';
import { awardBadge } from '../managers/badgeManager.js';
import { computeCompletionBreakdown } from '../managers/completionManager.js';

window.scTest = {
  // XP
  addStory:  n => appState.addStoryXP(n),
  addKids:   n => appState.addKidsCampingXP(n),
  addQS:     n => appState.addQuickServeXP(n),
  addInf:    n => appState.addInfinityXP(n),
  addRaw:    n => appState.addXP(n),

  // Badges
  award:     id => awardBadge(id),
  seedBadges:() => ['first_steps','math_zen','mode_tour','theme_swap','listened_music','talk_grampy',
                    'kids_cars_speed','kids_camp_10k','kids_mosquito','kids_ants_streak10','kids_tents_all',
                    'quick_25','quick_50','quick_75','quick_100',
                    'inf_25_1min','inf_50_2min','inf_100_4min','inf_250_10min','story_prologue']
                   .forEach(id => awardBadge(id)),

  // Events
  playJukebox: () => document.dispatchEvent(new Event('sc:jukebox-play', { bubbles:true })),

  // Inspect
  breakdown: () => (console.table(computeCompletionBreakdown(appState)),
                    computeCompletionBreakdown(appState)),
  badges:    () => console.log(appState.profile.badges),
  reset:     () => appState.resetAllData(),
};
console.log('✅ scTest loaded. Try: scTest.playJukebox(), scTest.award("listened_music"), scTest.addKids(250), scTest.breakdown()');
