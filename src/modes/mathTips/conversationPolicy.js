// /src/modes/mathTips/conversationPolicy.js
// Single-bubble composer: ACK ➜ DO (answer or teach) ➜ NUDGE (optional).
// Small randomized tone banks keep it human, not robotic.

import { appState } from '../../data/appState.js';

// ——— Tiny tone banks ———
const ACKS = [
  "Gotcha.",
  "Heard.",
  "Cool.",
  "Right on.",
  "I’m with you."
];

const HEDGES = [
  "Looks like this",
  "One way to see it",
  "Try this shape",
  "Quick blueprint",
  "Tiny map"
];

const CONNECT = [
  "So",
  "Then",
  "From there",
  "Next",
  "After that"
];

const NUDGES = [
  "Want 2 more like that?",
  "Spin one more?",
  "Try another?",
  "Run it back?",
  "One more rep?"
];

function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

// ——— Tiny helpers ———
export function noteConfusion(delta=1) {
  const mt = ensureCtx();
  mt.confusionCount = (mt.confusionCount || 0) + delta;
}

export function resetConfusion() {
  const mt = ensureCtx();
  mt.confusionCount = 0;
}

function ensureCtx() {
  if (!appState.progress) appState.progress = {};
  if (!appState.progress.mathtips) appState.progress.mathtips = { botContext:{} };
  if (!appState.progress.mathtips.botContext) appState.progress.mathtips.botContext = {};
  return appState.progress.mathtips.botContext;
}

// ——— Example suggester (teaches by doing) ———
function examplesFor(topicGuess) {
  switch (topicGuess) {
    case 'percent':
      return [
        "`15% of 80` → 12",
        "`7.5% of 120` → 9"
      ];
    case 'fractions':
      return [
        "`simplify 12/18` → 2/3",
        "`1/2 + 1/3` → 5/6"
      ];
    case 'arithmetic':
      return [
        "`7*8+12` → 68",
        "`(30-12)/3` → 6"
      ];
    default:
      return [
        "`15% of 80` → 12",
        "`simplify 12/18` → 2/3"
      ];
  }
}

// ——— Composer ———
// input:
//   - userText: raw user string
//   - part: { kind: 'answer'|'teach', html: string, topicGuess?: string }
//   - opts: { askAllowed: boolean }
// returns final HTML string
export function composeReply({ userText, part, askAllowed = true }) {
  const ctx = ensureCtx();

  // ACK: only if the user didn’t ask a direct question and the content isn’t purely numeric
  const askedQ = /\?\s*$/.test(userText);
  const needsAck = !askedQ;

  const segs = [];
  if (needsAck) segs.push(pick(ACKS));

  // DO:
  if (part.kind === 'answer') {
    resetConfusion();
    segs.push(part.html);
  } else {
    noteConfusion(1);
    const hint = pick(HEDGES);
    const ex = examplesFor(part.topicGuess);
    // one-line teach: no dumping commands, just 2 examples
    segs.push(`${hint}: ${ex[0]} • ${ex[1]}`);
  }

  // NUDGE: exactly one, only if allowed and user didn’t already ask
  if (askAllowed && !askedQ) {
    segs.push(pick(NUDGES));
  }

  // Join with natural connectors (light touch)
  // We avoid repetitive “So,” noise by only sprinkling one connector sometimes.
  const withConnectors = [];
  for (let i=0;i<segs.length;i++){
    const s = segs[i];
    if (i===1 && Math.random()<0.35) withConnectors.push(`${pick(CONNECT)} — ${s}`);
    else withConnectors.push(s);
  }

  // Final single bubble
  return withConnectors.join(' ');
}
