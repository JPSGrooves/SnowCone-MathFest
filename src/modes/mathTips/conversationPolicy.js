// /src/modes/mathTips/conversationPolicy.js
// Purpose: one place to shape Grampy P's voice + single-card reply framing
// so CSS stays aligned and all booths share the same soft follow-up rhythm.

import { appState } from '../../data/appState.js';
import { runInAction } from 'mobx';

// ───────────────────────────────────────────────────────────────────────────────
// 🎭 Persona (gifted 8-year-old vibes, adult brain)
// ───────────────────────────────────────────────────────────────────────────────
export const PERSONA = {
  ACKS:   ["Roger that...", "Alright, ${userName}...", "Like a cool breeze...", "I'm here for it....", "Vaminos...", "You got it...", "Right on...", "Cool vibes...", "Sounds good...", "On it..."],
  HEDGES: ["Here’s a little riff I know,", "One small groove I'll play", "I got the tiny roadmap in my mind...", "So here's a short path...", "Here's a quick little something...", "Let me drop a quick beat...", "Here's a popcorn-size nugget...", "Here's a small piece..."],
  NUDGES: ["Wanna here the next one?", "One more rotation?", "Feel like one more?", "Want another?", "Care for another?", "Another round?", "One more time?", "How about one more?", "You down for another?", "Another quick one?", "Want to keep going?"], 
  GUARDS: {
    offTopicAsk: (from,to)=>`I’m cooking in **${from}**. you wanna switch to **${to}** and keep going?`,
    switched: (to)=>`rolled into **${to}**.`
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
    if (!appState.progress.mathtips) appState.progress.mathtips = { botContext:{} };
    if (!appState.progress.mathtips.botContext) appState.progress.mathtips.botContext = {};
    const bc = appState.progress.mathtips.botContext;
    if (!('confusionCount' in bc)) bc.confusionCount = 0;
  });
  return appState.progress.mathtips.botContext;
}
export function noteConfusion(){ try { ensureCtx().confusionCount++; } catch {} }
export function resetConfusion(){ try { ensureCtx().confusionCount = 0; } catch {} }

// ───────────────────────────────────────────────────────────────────────────────
// 🔧 utils (ensure these are declared ONCE in this file)
// ───────────────────────────────────────────────────────────────────────────────
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)] }
function formatStr(s, vars) {
  return String(s).replace(/\$\{(\w+)\}/g, (_, k) => (vars?.[k] ?? ''));
}
function safe(s) { return String(s ?? ''); }

// ───────────────────────────────────────────────────────────────────────────────
// 🗣️ Single-card composer
// - Always returns ONE .mt-response-card containing ack (optional), body, and nudge (optional)
// - Options:
//   part.html    → inner HTML for the body (required for answers)
//   askAllowed   → show the nudge footer line in same card
//   askText      → override default nudge (persona-based if omitted)
//   noAck        → hide the courtesy opener
//   vars.userName→ allows ${userName} templating in ACK/NUDGE (defaults from appState)
// ───────────────────────────────────────────────────────────────────────────────
export function composeReply({ userText = '', part = {}, askAllowed = true, askText = '', noAck = false, vars = {} }) {
  // pull name from vars or appState
  const userName = vars.userName || appState?.profile?.name || 'friend';

  // courtesy opener
  const ack = noAck ? '' : formatStr(pick(PERSONA.ACKS), { userName });

  // core HTML (already styled by caller when needed)
  const body = safe(part?.html);

  // soft follow-up
  const nudge = askAllowed ? formatStr(askText || pick(PERSONA.NUDGES), { userName }) : '';

  // single card with optional lines
  return `
    <div class="mt-response-card">
      ${ack ? `<p>${ack}</p>` : ''}
      ${body}
      ${nudge ? `<p class="mt-dim">${nudge}</p>` : ''}
    </div>
  `;
}
