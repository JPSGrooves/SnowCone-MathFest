// src/managers/rankManager.js
// Watches the player's rank in the background and shows a small banner
// when they climb to a higher SnowCone rank.
// This does not change progression math. It only reacts to the shared rank model.

import { autorun } from 'mobx';
import { getRankModelForAppState, getRankOrder } from '../data/rankModel.js';

const LAST_KNOWN_RANK_FLAG = 'lastKnownRankId';

let disposeRankAutorun = null;

function getStoredRankId(appState) {
  try {
    if (typeof appState?.getFlag === 'function') {
      return appState.getFlag(LAST_KNOWN_RANK_FLAG, null);
    }

    return appState?.flags?.[LAST_KNOWN_RANK_FLAG] || null;
  } catch {
    return null;
  }
}

function setStoredRankId(appState, rankId) {
  if (!rankId) return;

  try {
    if (typeof appState?.setFlag === 'function') {
      appState.setFlag(LAST_KNOWN_RANK_FLAG, rankId);
    } else {
      appState.flags = appState.flags || {};
      appState.flags[LAST_KNOWN_RANK_FLAG] = rankId;
    }

    appState?.saveToStorage?.();
  } catch (err) {
    console.warn('[rankManager] failed to store rank id', err);
  }
}

function showRankBanner(rank) {
  if (!rank?.shortTitle) return;

  try {
    const banner = document.createElement('div');

    // Reuse badge-banner styling so we do not invent a whole new toast system yet.
    banner.className = 'badge-banner rank-banner';
    banner.textContent = `🍧 Rank achieved: ${rank.shortTitle}! ✨`;
    banner.style.pointerEvents = 'none';
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-live', 'polite');

    document.body.appendChild(banner);

    setTimeout(() => {
      banner.remove();
    }, 5000);
  } catch (err) {
    console.warn('[rankManager] failed to show rank banner', err);
  }
}

export function initRankManager(appState) {
  if (disposeRankAutorun) {
    return disposeRankAutorun;
  }

  console.log('[rankManager] wired');

  disposeRankAutorun = autorun(() => {
    const rank = getRankModelForAppState(appState);

    if (!rank?.id) {
      return;
    }

    const currentRankId = rank.id;
    const previousRankId = getStoredRankId(appState);

    // First launch after adding this system:
    // store the current rank silently so existing players do not get spammed.
    if (!previousRankId) {
      setStoredRankId(appState, currentRankId);
      return;
    }

    if (previousRankId === currentRankId) {
      return;
    }

    const previousOrder = getRankOrder(previousRankId);
    const currentOrder = getRankOrder(currentRankId);

    setStoredRankId(appState, currentRankId);

    // Only celebrate upward movement.
    // Importing/resetting to lower progress should not throw a weird rank toast.
    if (currentOrder > previousOrder) {
    console.log('[rankManager] rank upgraded; banner scheduled', {
        from: previousRankId,
        to: currentRankId,
        delayMs: 5600,
    });

    setTimeout(() => {
        console.log('[rankManager] showing rank banner', {
        rankId: rank.id,
        shortTitle: rank.shortTitle,
        });

        showRankBanner(rank);
    }, 5600);
    }
  });

  return disposeRankAutorun;
}

export function stopRankManager() {
  if (disposeRankAutorun) {
    disposeRankAutorun();
    disposeRankAutorun = null;
  }
}