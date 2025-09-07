// /src/modes/mathTips/conversationPolicy.js
// Single-bubble composer: ACK ➜ DO (answer or teach) ➜ NUDGE (optional).
// Persona banks + mode guards live here so every reply sounds like Grampy P.

import { appState } from '../../data/appState.js';
import { runInAction } from 'mobx';

// ───────────────────────────────────────────────────────────────────────────────
// 🎭 Persona (gifted 8-year-old vibes, adult brain)
// Use PERSONA.GUARDS + PERSONA.FALLBACKS from anywhere (modes, brain, etc.)
// ───────────────────────────────────────────────────────────────────────────────
export const PERSONA = {
  ACKS:   ["easy now.", "alright, friend.", "cool breeze.", "i hear ya.", "we're here."],
  HEDGES: ["here’s a little riff", "one small groove", "tiny roadmap", "short trail"],
  NUDGES: ["want another little riff?", "one more pass?", "feel like one more?"],
  GUARDS: {
    offTopicAsk: (from,to)=>`i’m riffing in **${from}**. switch to **${to}** and keep going?`,
    switched: (to)=>`rolled into **${to}**.`
  },
  FALLBACKS: [
    "old cat ears missed that. try `help` or `mode lessons`.",
    "i don’t speak that dialect yet. say `help` or `exit` to switch modes.",
    "hmm—i can try if you say it my way. `help` shows the grammar."
  ]
};

// ───────────────────────────────────────────────────────────────────────────────
// 🧠 Tiny bot context helpers (confusion counter)
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

export function noteConfusion() {
  try {
    const bc = ensureCtx();
    runInAction(() => { bc.confusionCount += 1; });
  } catch {}
}

export function resetConfusion() {
  try {
    const bc = ensureCtx();
    runInAction(() => { bc.confusionCount = 0; });
  } catch {}
}

// ───────────────────────────────────────────────────────────────────────────────
// 🧩 Example suggester (used by teach fallback)
// ───────────────────────────────────────────────────────────────────────────────
function examplesFor(topicGuess) {
  switch (topicGuess) {
    case 'percent':    return ["`15% of 80` → 12", "`7.5% of 120` → 9"];
    case 'fractions':  return ["`simplify 12/18` → 2/3", "`1/2 + 1/3` → 5/6"];
    case 'arithmetic': return ["`7*8+12` → 68", "`(30-12)/3` → 6"];
    default:           return ["`15% of 80` → 12", "`simplify 12/18` → 2/3"];
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// 🎸 Style banks (kept for light connective flavor)
// Switch via appState.settings.mtStyle = 'default' | 'jam_sage'
// ───────────────────────────────────────────────────────────────────────────────
const STYLE = (appState?.settings?.mtStyle || 'jam_sage');
const BANKS = {
  default: {
    ACKS:   ["Gotcha.", "Heard.", "Cool.", "Right on.", "I’m with you."],
    HEDGES: ["Looks like this", "One way to see it", "Try this shape", "Quick blueprint", "Tiny map"],
    CONNECT:["So", "Then", "From there", "Next", "After that"],
    NUDGES: ["Want 2 more like that?", "Spin one more?", "Try another?", "Run it back?", "One more rep?"]
  },
  jam_sage: {
    ACKS:   PERSONA.ACKS,
    HEDGES: [...PERSONA.HEDGES, "try this shape"],
    CONNECT:["and then", "from there", "roll on", "next up", "after that"],
    NUDGES: [...PERSONA.NUDGES, "spin one more bar?", "take another lap?"]
  }
};
function BANK(name){ const pack = BANKS[STYLE] || BANKS.default; return pack[name] || []; }
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

// ───────────────────────────────────────────────────────────────────────────────
// 🗣️ Composer
// - part.kind: 'answer' | 'teach'
// - part.html: HTML string
// - part.noAck (optional): true → suppress courtesy opener *and* nudge
// - askAllowed (optional): false → suppress nudge only (keep courtesy opener)
// ───────────────────────────────────────────────────────────────────────────────
export function composeReply({ userText, part, askAllowed = true }) {
  ensureCtx(); // make sure context exists

  const askedQ = /\?\s*$/.test(String(userText||''));
  const noAck  = !!part?.noAck;

  const segs = [];

  // ACK: only when not a question and not explicitly suppressed
  if (!askedQ && !noAck) segs.push(pick(BANK('ACKS')));

  // DO:
  if (part?.kind === 'answer') {
    resetConfusion();
    segs.push(String(part.html || ''));
  } else {
    noteConfusion();
    const hint = pick(BANK('HEDGES'));
    const ex = examplesFor(part?.topicGuess);
    segs.push(`${hint}: ${ex[0]} • ${ex[1]}`);
  }

  // NUDGE: only if allowed, not a question, and not explicitly suppressed
  if (askAllowed && !askedQ && !noAck) {
    segs.push(pick(BANK('NUDGES')));
  }

  // Light connector sprinkle
  const withConnectors = [];
  for (let i=0;i<segs.length;i++){
    const s = segs[i];
    if (i===1 && Math.random()<0.35) withConnectors.push(`${pick(BANK('CONNECT'))} — ${s}`);
    else withConnectors.push(s);
  }

  return withConnectors.join(' ');
}
