// /src/modes/mathTips/modes/lore.js
// Lore booth — short drops with “wanna hear more?” rhythm.

import { composeReply } from '../conversationPolicy.js';

// ───────────────────────────────────────────────────────────────────────────────
// Tiny in-memory session so we can do 3–4 lore beats per visit
// ───────────────────────────────────────────────────────────────────────────────
const SESS = new Map(); // key: sessionId, value: { idx: number, max: number }

function getSessionId(ctx) {
  return ctx?.sessionId || 'default';
}

function ensure(ctx, max = 4) {
  const id = getSessionId(ctx);
  if (!SESS.has(id)) SESS.set(id, { idx: 0, max });
  return SESS.get(id);
}

// ───────────────────────────────────────────────────────────────────────────────
// Lore drops (HTML snippets; keep them short, card-friendly)
// ───────────────────────────────────────────────────────────────────────────────
const DROPS = [
  `<p>festival lore: when night falls, cones hum at the hypotenuse gate. each solved puzzle makes the glow brighter.</p>`,
  `<p>legend says grampy p once squared a circle — turned out to be a quesadilla. still counts.</p>`,
  `<p>the snowcone sages map constellations to flavor curves: mango is sine, blueberry is cosine, and cherry… chaotic good.</p>`,
  `<p>beneath the village, a tunnel of triangles keeps time. step on the right beat, doors open. step wrong — extra homework.</p>`
];

// ───────────────────────────────────────────────────────────────────────────────
// Public API
// ───────────────────────────────────────────────────────────────────────────────
export function start(opts = {}) {
  const ctx = opts || {};
  const s = ensure(ctx, 4);
  s.idx = 0;

  const html = DROPS[s.idx] || `<p>lore’s a bit fuzzy right now.</p>`;

  // single card; composer adds the mode-specific nudge “wanna hear more?”
  return composeReply({
    userText: opts.userText || '',
    part: { kind: 'answer', html },
    askAllowed: true,
    mode: 'lore'
  });
}

export function handle(text = '', ctx = {}) {
  const s = ensure(ctx, 4);
  const t = String(text).toLowerCase().trim();

  // First contact in lore without prior drop → start
  if (s.idx === 0 && t && /(start|begin|talk|story|lore|festival|more)/.test(t) === false) {
    // If they just switched into lore, we still give the first drop:
    const html = DROPS[s.idx] || `<p>lore’s a bit fuzzy right now.</p>`;
    return {
      html: composeReply({
        userText: text,
        part: { kind: 'answer', html },
        askAllowed: true,
        mode: 'lore'
      })
    };
  }

  // If the player says no/stop
  if (/\b(no|nah|stop|pause|later|enough)\b/.test(t)) {
    return {
      html: composeReply({
        userText: text,
        part: { kind: 'answer', html: `<p>cool breeze. that’s a wrap on lore for now — want another booth?</p>` },
        askAllowed: false,
        mode: 'lore'
      })
    };
  }

  // Advance on yes/more/continue/blank smalltalk
  const wantsMore = !t || /\b(yes|yep|yeah|more|another|continue|ok|okay|sure)\b/.test(t);
  if (wantsMore) {
    // move to next drop
    s.idx = Math.min(s.idx + 1, DROPS.length); // allow “end” path when idx === DROPS.length

    if (s.idx >= DROPS.length || s.idx >= s.max) {
      // end of lore for this run
      SESS.delete(getSessionId(ctx));
      const ending =
        `<p>well, that’s all i know about that one!</p><p>would you like to try another booth?</p>`;
      return {
        html: composeReply({
          userText: text,
          part: { kind: 'answer', html: ending },
          askAllowed: false,
          mode: 'lore'
        })
      };
    }

    const html = DROPS[s.idx] || `<p>hmm, the rest is still being written.</p>`;
    // keep the “wanna hear more?” nudge by leaving askAllowed true
    return {
      html: composeReply({
        userText: text,
        part: { kind: 'answer', html },
        askAllowed: true,
        mode: 'lore'
      })
    };
  }

  // Fallback inside lore booth — keep them in rhythm
  return {
    html: composeReply({
      userText: text,
      part: { kind: 'answer', html: `<p>i’m jammin’ lore right now — say “more” or “stop”.</p>` },
      askAllowed: true,
      mode: 'lore'
    })
  };
}
