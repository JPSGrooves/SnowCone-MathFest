// /src/modes/mathTips/packs/gameplay.pack.js
import { registerIntent, M } from '../intentEngine.js';
import { composeReply } from '../conversationPolicy.js';
import { appState } from '../../../data/appState.js';

const n=(x,d=0)=>Number.isFinite(+x)?+x:d;
const answer = (html)=>({ kind:'answer', html });

registerIntent({
  key: 'status_report',
  tests: [ M.include(['how am i doing','stats','status','progress','report']) ],
  base: 0.0,
  handler: ({ text }) => {
    const xp   = n(appState.profile.xp);
    const lvl  = n(appState.profile.level, Math.floor(xp/100)+1);
    const tips = n(appState.progress?.mathtips?.completedTips);
    const total= n(appState.progress?.mathtips?.totalTips, Math.max(10,tips));
    const qsPB = n(appState.profile.qsHighScore || appState.stats?.quickServe?.topScore);
    const ilSt = n(appState.profile.infinityLongestStreak || 0);

    const parts = [
      `Level <strong>${lvl}</strong>`,
      `XP <strong>${xp}</strong>`,
      `Tips <strong>${tips}/${total}</strong>`,
      qsPB ? `QuickServe PB <strong>${qsPB}</strong>` : null,
      ilSt ? `Infinity streak <strong>${ilSt}</strong>` : null,
    ].filter(Boolean);

    return composeReply({ userText:text, part: answer(parts.join(' • ')) });
  }
});

registerIntent({
  key: 'badges_count',
  tests: [ M.include(['badges','how many badges','show badges']) ],
  base: 0.65,
  handler: ({ text }) => {
    const count = (appState.profile.badges||[]).length;
    const line = count ? `You’ve earned <strong>${count}</strong> badge${count>1?'s':''}.`
                       : `No badges yet — fresh slate 🌱`;
    return composeReply({ userText:text, part: answer(line) });
  }
});
