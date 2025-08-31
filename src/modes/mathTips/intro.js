// /src/modes/mathTips/intro.js
// New, trimmed intro block for Math Tips mode: Streak • Completion • XP • Badges.

import { allBadges } from '../../data/badges.js';

function safeNumber(n, def = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : def;
}
function pad(num, width = 4) {
  const s = String(safeNumber(num, 0));
  return s.padStart(width, '0');
}
function fmtPct(n) {
  const x = safeNumber(n, 0);
  return `${Math.round(Math.max(0, Math.min(100, x)))}%`;
}
function plural(n, one, many) {
  return n === 1 ? one : many;
}

export function getIntroMessage(appStateLike) {
  const profile = appStateLike?.profile ?? {};
  const xp      = safeNumber(profile.xp, 0);
  const lvl     = safeNumber(profile.level, Math.floor(xp / 100) + 1); // unused but future-safe
  const streak  = safeNumber(profile.streakDays, 0);

  // Game completion: reuse your existing XP-based mood engine if present
  const completionPct =
    typeof appStateLike?.getCompletionPercent === 'function'
      ? fmtPct(appStateLike.getCompletionPercent())
      : fmtPct((xp / 500) * 100);

  const earnedBadges = Array.isArray(profile.badges) ? profile.badges.length : 0;
  const totalBadges  = allBadges ? Object.keys(allBadges).length : 21; // dynamic, falls back to 21

  const lines = [
    `<strong style="color:#00ffee;">Welcome back to Math Tips Village!</strong>`,
    `Daily Streak: <strong>${streak}</strong> ${plural(streak, 'day', 'days')}`,
    `Game Completion: <strong>${completionPct}</strong>`,
    `Total XP: <strong>${pad(xp, 4)}</strong>`,
    `Badge Count: <strong>${earnedBadges}/${totalBadges}</strong>`,
    `<em style="color:#8ef;">Step on into MathTips Village and find your MathVibes with Grampy P!</em>`
  ];

  return `
    <div class="mt-intro-message allow-select">
      ${lines.map(l => `<div class="mt-line">${l}</div>`).join('')}
    </div>
  `;
}
