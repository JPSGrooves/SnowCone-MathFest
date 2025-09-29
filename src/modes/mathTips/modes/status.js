// /src/modes/mathTips/modes/status.js
// Mode-scoped status booth: quick profile pulse + mode-specific help.
// Mood tiers are driven *only* by completion %.
// Also exports renderBoothsHelp() because qabot.js imports it.

import { composeReply } from '../conversationPolicy.js';
import { helpCard } from './_kit.js';
import { appState } from '../../../data/appState.js';

// ───────────────────────────────────────────────────────────────────────────────
// Exported helper used by qabot.js (keep signature + markup stable)
// ───────────────────────────────────────────────────────────────────────────────
export function renderBoothsHelp() {
  return `
    <ul class="mt-menu">
      <li>lessons booth</li>
      <li>quiz booth</li>
      <li>lore booth</li>
      <li>recipe booth</li>
      <li>status booth</li>
      <li>calculator booth</li>
    </ul>
  `;
}

// ───────────────────────────────────────────────────────────────────────────────
// Mood tiers — only completion% matters
// ───────────────────────────────────────────────────────────────────────────────
const MOOD_TIERS = [
  { min:   0, key: 'dusty',   title: 'Dusty Cone',     icon: '🫧',
    line: 'day-one vibes — tiny steps stack cones.',
    nudge: 'try <code>lessons booth</code> or <code>quiz fractions 3</code>.' },
  { min:  25, key: 'warming', title: 'Warming Up',     icon: '🔥',
    line: 'sparks are flying. a little practice goes far.',
    nudge: 'do <code>quiz percent 3</code> or a short lesson.' },
  { min:  50, key: 'rolling', title: 'Rolling',        icon: '🛼',
    line: 'momentum unlocked. keep the rhythm steady.',
    nudge: 'hit a mixed set: <code>quiz fractions 3</code>.' },
  { min:  75, key: 'glow',    title: 'Festival Glow',  icon: '✨',
    line: 'lights are up, puzzles hum. almost badge time.',
    nudge: 'finish one topic to bag that badge.' },
  { min: 100, key: 'parade',  title: 'Badge Parade',   icon: '🏅',
    line: 'max vibes achieved. share the glow, teach a friend.',
    nudge: 'speed-run a quiz or explore <code>lore booth</code>.' },
];

// clamp 0–100 & pick tier by floor thresholds
function completionPct() {
 // Single source of truth — match Profile tab:
 // appState.getCompletionPercent() returns an integer 0–100.
 try {
   const fn = appState?.getCompletionPercent;
   const pct = (typeof fn === 'function') ? Number(fn.call(appState)) : 0;
   return Math.max(0, Math.min(100, Math.floor(pct)));
 } catch {
   return 0;
 }
}
function moodTierFromCompletion(pct) {
  let tier = MOOD_TIERS[0];
  for (const t of MOOD_TIERS) if (pct >= t.min) tier = t;
  return tier;
}

// ───────────────────────────────────────────────────────────────────────────────
// Internal utils (plain HTML — avoid inner card double-wrap)
// ───────────────────────────────────────────────────────────────────────────────
function statHTML() {
  const xp = Number(appState?.profile?.xp ?? 0);
  const lvl = Number(appState?.profile?.level ?? (Math.floor(xp / 100) + 1));
  const streak = Number(appState?.profile?.streakDays ?? 0);
  const badges = Array.isArray(appState?.profile?.badges) ? appState.profile.badges.length : 0;

  return `
    <p><strong>level:</strong> ${lvl}</p>
    <p><strong>xp:</strong> ${xp}</p>
    <p><strong>streak:</strong> ${streak}</p>
    <p><strong>badges:</strong> ${badges}</p>
  `;
}

function badgesHTML() {
  const list = Array.isArray(appState?.profile?.badges) ? appState.profile.badges : [];
  if (!list.length) return `<p>no badges yet — go chat in math tips or play modes.</p>`;
  return `<ul class="mt-lecture-bullets">${list.map(id => `<li>${id}</li>`).join('')}</ul>`;
}

function statusHelp() {
  return helpCard(
    'Status Booth',
    [
      'say: "my badges", "streak", "level", "what should i study?"',
      'switch booths: "lessons booth", "quiz booth", "lore booth", "recipe booth", "calculator booth"'
    ],
    'tip: status is read-only and instant.'
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Public API
// ───────────────────────────────────────────────────────────────────────────────
export function start() {
  const pct = completionPct();
  const tier = moodTierFromCompletion(pct);

  const html = `
    <p><strong>${tier.icon} ${tier.title}</strong></p>
    <p>${tier.line}</p>
    <p class="mt-dim">${tier.nudge}</p>
    <p><em>completion:</em> <b>${pct}%</b></p>
    ${statHTML()}
    ${statusHelp()}
  `;

  // single cozy bubble; mute the courtesy opener inside this booth
  return composeReply({
    part: { html },
    askAllowed: true,
    askText: 'want suggestions or switch booths?',
    noAck: true
  });
}

export function handle(text = '') {
  const t = String(text || '').toLowerCase().trim();

  // help → same as start() (keeps card count tight)
  if (/^help\b/.test(t)) return { html: start() };

  // badges
  if (/badges?/.test(t)) {
    return {
      html: composeReply({
        part: { html: `<p><strong>your badges</strong></p>${badgesHTML()}` },
        askAllowed: true,
        askText: 'want another booth?',
        noAck: true
      })
    };
  }

  // streak
  if (/streak|days\s+in\s+a\s+row/.test(t)) {
    const streak = Number(appState?.profile?.streak ?? 0);
    return {
      html: composeReply({
        part: { html: `<p>you’ve visited ${streak} day${streak === 1 ? '' : 's'} in a row.</p>` },
        askAllowed: true,
        askText: 'peek badges or level?',
        noAck: true
      })
    };
  }

  // level / xp
  if (/level|xp/.test(t)) {
    const xp = Number(appState?.profile?.xp ?? 0);
    const lvl = Number(appState?.profile?.level ?? (Math.floor(xp / 100) + 1));
    return {
      html: composeReply({
        part: { html: `<p>level ${lvl}, xp ${xp}. keep cruising.</p>` },
        askAllowed: true,
        askText: 'want a quick quiz or a lesson?',
        noAck: true
      })
    };
  }

  // mood / what next — show ONLY completion%-based mood
  if (/mood|study|recommend|what.*next/.test(t)) {
    const pct = completionPct();
    const tier = moodTierFromCompletion(pct);
    const html = `
      <p><strong>${tier.icon} ${tier.title}</strong></p>
      <p>${tier.line}</p>
      <p class="mt-dim">${tier.nudge}</p>
      <p><em>completion:</em> <b>${pct}%</b></p>
    `;
    return {
      html: composeReply({
        part: { html },
        askAllowed: true,
        askText: 'switch to a booth now?',
        noAck: true
      })
    };
  }

  // default: show quick stats again (single bubble)
  return {
    html: composeReply({
      part: { html: `${statHTML()}` },
      askAllowed: true,
      askText: 'need help or switch booths?',
      noAck: true
    })
  };
}

export default { start, handle, renderBoothsHelp };
