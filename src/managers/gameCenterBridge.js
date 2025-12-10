// 📦 src/managers/gameCenterBridge.js
// SnowCone Game Center bridge – safe on web, live in native.
// We keep this *tiny* so all the real logic lives in achievementsWatcher.

const hasWebkitBridge =
  typeof window !== 'undefined' &&
  window.webkit &&
  window.webkit.messageHandlers &&
  window.webkit.messageHandlers.gameCenterBridge &&
  typeof window.webkit.messageHandlers.gameCenterBridge.postMessage === 'function';

const hasGlobalBridge =
  typeof window !== 'undefined' &&
  window.GameCenterNative &&
  typeof window.GameCenterNative.postMessage === 'function';

// 🧠 Single low-level send – JSON payload out, no assumptions back.
function sendNative(payload) {
  try {
    const msg = JSON.stringify(payload);

    if (hasGlobalBridge) {
      window.GameCenterNative.postMessage(msg);
      return true;
    }

    if (hasWebkitBridge) {
      window.webkit.messageHandlers.gameCenterBridge.postMessage(msg);
      return true;
    }

    // No native bridge? Just log once in dev and bail.
    if (import.meta.env.DEV) {
      console.info('[GameCenterBridge] No native handler, payload:', payload);
    }
    return false;
  } catch (err) {
    console.warn('[GameCenterBridge] Failed to send payload', err, payload);
    return false;
  }
}

// 🎮 Public API
export const GameCenter = {
  /**
   * Report a leaderboard score.
   * @param {Object} opts
   * @param {string} opts.boardId - Game Center leaderboard ID (from App Store Connect).
   * @param {number} opts.value   - Score value (e.g. campingHighScore).
   */
  reportLeaderboardScore({ boardId, value }) {
    const numeric = Number(value) || 0;
    if (!boardId || numeric <= 0) return;

    sendNative({
      type: 'leaderboard',
      boardId,
      value: numeric,
    });
  },

  /**
   * Report an achievement progress update.
   * Default is 100% = completed.
   * @param {Object} opts
   * @param {string} opts.achievementId - Game Center achievement ID.
   * @param {number} [opts.percent=100] - Completion percent (0–100).
   */
  reportAchievement({ achievementId, percent = 100 }) {
    const pct = Math.max(0, Math.min(100, Number(percent) || 0));
    if (!achievementId || pct <= 0) return;

    sendNative({
      type: 'achievement',
      achievementId,
      percent: pct,
    });
  },
};
