// /src/modes/mathTips/modes/status.js
// Mode-scoped status booth: quick profile pulse + mode-specific help.
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
      <li>recipes booth</li>
      <li>status booth</li>
      <li>calculator booth</li>
    </ul>
  `;
}

// ───────────────────────────────────────────────────────────────────────────────
// Internal utils (plain HTML — avoid inner card double-wrap)
// ───────────────────────────────────────────────────────────────────────────────
function statHTML() {
  const xp = Number(appState?.profile?.xp ?? 0);
  const lvl = Number(appState?.profile?.level ?? (Math.floor(xp / 100) + 1));
  const streak = Number(appState?.profile?.streak ?? 0);
  const badges = Array.isArray(appState?.profile?.badges) ? appState.profile.badges.length : 0;

  return `
    <p><strong>level:</strong> ${lvl}</p>
    <p><strong>xp:</strong> ${xp}</p>
    <p><strong>streak:</strong> ${streak}</p>
    <p><strong>badges:</strong> ${badges}</p>
  `;
}

function completionPct() {
  // Prefer explicit completion from progress; otherwise derive softly.
  const pct =
    Number(appState?.progress?.mathtips?.completionPct) ||
    0;
  // clamp 0–100
  return Math.max(0, Math.min(100, Math.floor(pct)));
}

function moodLine(pct) {
  if (pct >= 100) return `Legendary — cones at max glow. Loop mastery or chase seasonal badges.`;
  if (pct >= 75)  return `So close — finish a missing badge for the glow!`;
  if (pct >= 50)  return `Cruising — double up: one quiz, one lesson.`;
  if (pct >= 25)  return `Warming up — grab a new badge today.`;
  return `Day one vibes — tiny steps stack cones. Try Lessons/Fractions 1?`;
}

function studyHintByXP() {
  const xp = Number(appState?.profile?.xp ?? 0);
  return xp < 200
    ? 'start with lessons: fractions and percent.'
    : 'hit a short quiz set to sharpen.';
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
      'switch booths: "lessons booth", "quiz booth", "lore booth", "recipes booth", "calculator booth"'
    ],
    'tip: status is read-only and instant.'
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Public API
// ───────────────────────────────────────────────────────────────────────────────
export function start() {
  const pct = completionPct();
  const html = `
    ${statHTML()}
    <p class="mt-dim">${moodLine(pct)}</p>
    ${statusHelp()}
  `;
  // single cozy bubble; mute the courtesy opener inside this booth
  return composeReply({
    part: { html },
    askAllowed: true,
    askText: 'want suggestions on what to study next?',
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

  // mood / what next
  if (/mood|study|recommend|what.*next/.test(t)) {
    const pct = completionPct();
    const html = `
      <p>${moodLine(pct)}</p>
      <p>${studyHintByXP()}</p>
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

  // default: show stats again (single bubble)
  return {
    html: composeReply({
      part: { html: `${statHTML()}` },
      askAllowed: true,
      askText: 'need help or switch booths?',
      noAck: true
    })
  };
}
