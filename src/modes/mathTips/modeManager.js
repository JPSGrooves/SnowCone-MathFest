// src/modes/mathTips/modeManager.js
// Defines mode constants and manages current mode state.
// Merged: ensureMTNode from mathtipsContext.js.

import { runInAction } from 'mobx';
import { appState } from '../../data/appState.js';

export const MODES = Object.freeze({
  none: 'none',
  lessons: 'lessons',
  quiz: 'quiz',
  lore: 'lore',
  recipes: 'recipes',
  status: 'status',
  calc: 'calc',
});

export function getMode() {
  return appState?.progress?.mathtips?.botContext?.mode || MODES.none;
}

export function setMode(mode) {
  runInAction(() => {
    if (!appState.progress) appState.progress = {};
    if (!appState.progress.mathtips) appState.progress.mathtips = {};
    if (!appState.progress.mathtips.botContext) appState.progress.mathtips.botContext = {};
    appState.progress.mathtips.botContext.mode = mode;
  });
}

export function ensureMTNode() {
  runInAction(() => {
    if (!appState.progress) appState.progress = {};
    if (!appState.progress.mathtips) {
      appState.progress.mathtips = {
        botContext: { lastIntent: null, lastTopic: null, lastAnswer: null },
        completedTips: 0,
        totalTips: 10
      };
    }
  });
}
