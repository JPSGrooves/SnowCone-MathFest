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
      <li>calculator booth</li>
    </ul>
  `;
}

// ───────────────────────────────────────────────────────────────────────────────
// Internal utils
// ───────────────────────────────────────────────────────────────────────────────
function statHTML() {
  const xp = Number(appState?.profile?.xp ?? 0);
  const lvl = Number(appState?.profile?.level ?? (Math.floor(xp / 100) + 1));
  const streak = Number(appState?.profile?.streak ?? 0);
  const badges = Array.isArray(appState?.profile?.badges) ? appState.profile.badges.length : 0;

  return `
    <div class="mt-response-card">
      <p><strong>level:</strong> ${lvl}</p>
      <p><strong>xp:</strong> ${xp}</p>
      <p><strong>streak:</strong> ${streak}</p>
      <p><strong>badges:</strong> ${badges}</p>
    </div>
  `;
}

// ───────────────────────────────────────────────────────────────────────────────
// Public API
// ───────────────────────────────────────────────────────────────────────────────
export function start() {
  const help = helpCard(
    'Status Booth',
    [
      'say: "my badges", "streak", "level", "what should i study?"',
      'switch booths: "lessons booth", "quiz booth", "lore booth", "recipes booth", "calculator booth"'
    ],
    'tip: status is read-only and instant.'
  );

  return composeReply({
    part: { html: `${statHTML()}${help}` },
    askAllowed: true,
    askText: 'want suggestions on what to study next?'
  });
}

export function handle(text = '') {
  const t = text.toLowerCase();

  if (/^help\b/.test(t)) {
    return { html: start() };
  }

  if (/badges?/.test(t)) {
    const list = Array.isArray(appState?.profile?.badges) ? appState.profile.badges : [];
    const items = list.length
      ? `<ul class="mt-lecture-bullets">${list.map(id => `<li>${id}</li>`).join('')}</ul>`
      : `<p>no badges yet — go chat in math tips or play modes.</p>`;

    return {
      html: composeReply({
        part: { html: `<div class="mt-response-card"><p><strong>your badges</strong></p>${items}</div>` },
        askAllowed: true,
        askText: 'want another booth?'
      })
    };
  }

  if (/streak|days in a row/.test(t)) {
    const streak = Number(appState?.profile?.streak ?? 0);
    return {
      html: composeReply({
        part: { html: `<p>you’ve visited ${streak} day${streak === 1 ? '' : 's'} in a row.</p>` },
        askAllowed: true
      })
    };
  }

  if (/level|xp/.test(t)) {
    const xp = Number(appState?.profile?.xp ?? 0);
    const lvl = Number(appState?.profile?.level ?? (Math.floor(xp / 100) + 1));
    return {
      html: composeReply({
        part: { html: `<p>level ${lvl}, xp ${xp}. keep cruising.</p>` },
        askAllowed: true
      })
    };
  }

  if (/study|recommend|what.*next/.test(t)) {
    const xp = Number(appState?.profile?.xp ?? 0);
    const hint = xp < 200 ? 'start with lessons: fractions and percent.' : 'hit a short quiz set to sharpen.';
    return {
      html: composeReply({
        part: { html: `<p>${hint}</p>` },
        askAllowed: true,
        askText: 'switch to a booth now?'
      })
    };
  }

  // default: show stats again
  return {
    html: composeReply({
      part: { html: `${statHTML()}` },
      askAllowed: true,
      askText: 'need help or switch booths?'
    })
  };
}
