// /src/modes/mathTips/intro.js
// Explicit, readable intro composer for Math Tips mode.
// Feeds on appState but NEVER crashes if fields are missing.

function safeNumber(n, def = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : def;
}

function pluralize(n, one, many) {
  return n === 1 ? one : many;
}

function fmtPct(num, den) {
  num = safeNumber(num, 0);
  den = safeNumber(den, 0);
  if (den <= 0) return '0%';
  const pct = Math.round((num / den) * 100);
  return `${pct}%`;
}

function summarizeBadges(badges) {
  if (!Array.isArray(badges) || badges.length === 0) return 'No badges yet—fresh slate 🌱';
  const maxShow = 6;
  const shown = badges.slice(0, maxShow).map(b => (b?.name || b)).join(' • ');
  const extra = badges.length > maxShow ? ` +${badges.length - maxShow} more` : '';
  return `${shown}${extra}`;
}

/**
 * Build a clean, HTML-safe intro message.
 * All strings here are our own literals except badge names.
 * If your badge names can include user text, sanitize them first.
 */
export function getIntroMessage(appStateLike) {
  // ---- Pull data safely with defaults
  const player = appStateLike?.player ?? {};
  const progress = appStateLike?.progress ?? {};
  const mt = progress?.mathtips ?? {};

  const xp = safeNumber(player?.xp, 0);
  const lvl = safeNumber(player?.level, Math.floor(xp / 100) + 1); // fallback level calc
  const badges = Array.isArray(player?.badges) ? player.badges : [];

  const tipsDone = safeNumber(mt?.completedTips, 0);
  const tipsTotal = safeNumber(mt?.totalTips, Math.max(10, tipsDone)); // avoid divide-by-zero
  const tipsPct = fmtPct(tipsDone, tipsTotal);

  const storyDone = safeNumber(progress?.story?.chaptersDone, 0);
  const storyTotal = safeNumber(progress?.story?.chaptersTotal, Math.max(1, storyDone));
  const storyPct = fmtPct(storyDone, storyTotal);

  // Optional streaks or daily goals
  const streak = safeNumber(player?.streakDays, 0);

  // ---- Compose lines (super explicit)
  const lines = [
    `<strong style="color:#00ffee;">Welcome back to Math Tips Village!</strong>`,
    `Level <strong>${lvl}</strong> • <strong>${xp}</strong> XP • ${streak} ${pluralize(streak,'day','days')} streak 🔥`,
    `Badges: <span style="color:#ffdd55;">${summarizeBadges(badges)}</span>`,
    `Tips progress: <strong>${tipsDone}/${tipsTotal}</strong> (${tipsPct})`,
    `Story progress: <strong>${storyDone}/${storyTotal}</strong> (${storyPct})`,
    `<em style="color:#8ef;">Ask anything mathy or practical—Grampy P serves wisdom with sprinkles.</em>`,
  ];

  // ---- Return one tidy HTML block
  return `
    <div class="mt-intro-message allow-select">
      ${lines.map(l => `<div class="mt-line">${l}</div>`).join('')}
    </div>
  `;
}
