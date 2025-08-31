// /src/modes/mathTips/mathtipsContext.js
import { runInAction } from 'mobx';
import { appState } from '../../data/appState.js';

export function ensureMTNode() {
  if (!appState.progress) runInAction(() => { appState.progress = {}; });
  if (!appState.progress.mathtips) {
    runInAction(() => {
      appState.progress.mathtips = {
        botContext: { lastIntent: null, lastTopic: null, lastAnswer: null },
        completedTips: 0,
        totalTips: 10
      };
    });
  }
}

export function getBotCtx() {
  ensureMTNode();
  return appState.progress.mathtips.botContext;
}

export function saveBotCtx(patch) {
  ensureMTNode();
  runInAction(() => {
    Object.assign(appState.progress.mathtips.botContext, patch || {});
    const mt = appState.progress.mathtips;
    mt.totalTips = Math.max(10, mt.totalTips || 10); // keep sane defaults
  });
}
