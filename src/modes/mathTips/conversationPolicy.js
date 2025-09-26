// /src/modes/mathTips/conversationPolicy.js
// Purpose: one place to shape Grampy P's voice + single-card reply framing
// so CSS stays aligned and all booths share the same soft follow-up rhythm.

import { appState } from '../../data/appState.js';
import { runInAction } from 'mobx';

// ───────────────────────────────────────────────────────────────────────────────
// 🎭 Persona (gifted 8-year-old vibes, adult brain)
// ───────────────────────────────────────────────────────────────────────────────
export const PERSONA = {
  ACKS: [
    "Roger that...",
    "Alright, ${userName}...",
    "Like a cool breeze...",
    "I'm here for it....",
    "Vaminos...",
    "You got it...",
    "Right on...",
    "Cool vibes...",
    "Sounds good...",
    "On it..."
  ],
  HEDGES: [
    "Here’s a little riff I know,",
    "One small groove I'll play",
    "I got the tiny roadmap in my mind...",
    "So here's a short path...",
    "Here's a quick little something...",
    "Let me drop a quick beat...",
    "Here's a popcorn-size nugget...",
    "Here's a small piece..."
  ],
  NUDGES: [
    "Wanna hear the next one?",
    "One more rotation?",
    "Feel like one more?",
    "Want another?",
    "Care for another?",
    "Another round?",
    "One more time?",
    "How about one more?",
    "You down for another?",
    "Another quick one?",
    "Want to keep going?"
  ],
  GUARDS: {
    offTopicAsk: (from, to) => `I’m cooking in **${from}**. you wanna switch to **${to}** and keep going?`,
    switched: (to) => `rolled into **${to}**.`
  },
  FALLBACKS: [
    "My old cat ears missed that. try `help` or `lore booth`.",
    "I don’t speak that dialect yet. say `help` or `exit` to switch booths.",
    "Hmm—I can try if you say it my way. `help` shows the grammar."
  ]
};

// ───────────────────────────────────────────────────────────────────────────────
// 🧠 tiny bot context (optional: confusion counter used by other modules)
// ───────────────────────────────────────────────────────────────────────────────
function ensureCtx() {
  runInAction(() => {
    if (!appState.progress) appState.progress = {};
    if (!appState.progress.mathtips) appState.progress.mathtips = { botContext: {} };
    if (!appState.progress.mathtips.botContext) appState.progress.mathtips.botContext = {};
    const bc = appState.progress.mathtips.botContext;
    if (!('confusionCount' in bc)) bc.confusionCount = 0;
  });
  return appState.progress.mathtips.botContext;
}
export function noteConfusion() { try { ensureCtx().confusionCount++; } catch {} }
export function resetConfusion() { try { ensureCtx().confusionCount = 0; } catch {} }

// ───────────────────────────────────────────────────────────────────────────────
// 🔧 utils (ensure these are declared ONCE in this file)
// ───────────────────────────────────────────────────────────────────────────────
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function formatStr(s, vars) { return String(s).replace(/\$\{(\w+)\}/g, (_, k) => (vars?.[k] ?? '')); }
function safe(s) { return String(s ?? ''); }
function resolveHtml(part) {
  if (typeof part === 'string') return part;
  if (part && typeof part === 'object' && 'html' in part) return String(part.html ?? '');
  return '';
}

// NEW: detect if the HTML already brings its own card chrome
function alreadyHasCard(html = '') {
  // any of our “full chrome” cards should bypass wrapping + ack/nudge
  return /mt-(response|lecture|layer)-card/.test(html);
}

// ───────────────────────────────────────────────────────────────────────────────
// 🗣️ Single-card composer (SMART WRAP)
// - If part.html already has a card, don't wrap and suppress ACK/NUDGE.
// - Otherwise, wrap in .mt-response-card and (optionally) add ACK/NUDGE.
// Options:
//   part.html    → inner HTML for the body (string or {html})
//   askAllowed   → show the nudge footer line (only when we wrap)
//   askText      → override default nudge
//   noAck        → force-hide the courtesy opener even when we wrap
//   vars.userName→ allows ${userName} templating in ACK/NUDGE (defaults from appState)
// ───────────────────────────────────────────────────────────────────────────────
export function composeReply({
  userText = '',
  part = {},
  askAllowed = true,
  askText = '',
  noAck = false,
  vars = {}
}) {
  const userName =
    vars.userName ||
    appState?.profile?.username ||
    appState?.profile?.name ||
    'friend';

  const bodyRaw = resolveHtml(part);
  const body = safe(bodyRaw);
  const hasCard = alreadyHasCard(body);

  // If content is a full card, return it raw (no ack/nudge wrappers).
  if (hasCard) {
    return body;
  }

  // Otherwise produce a single, cozy response card with optional ack + nudge.
  const ack = noAck ? '' : formatStr(pick(PERSONA.ACKS), { userName });
  const nudge = askAllowed ? formatStr(askText || pick(PERSONA.NUDGES), { userName }) : '';

  return `
    <div class="mt-response-card">
      ${ack ? `<p>${ack}</p>` : ''}
      ${body}
      ${nudge ? `<p class="mt-dim">${nudge}</p>` : ''}
    </div>
  `;
}
