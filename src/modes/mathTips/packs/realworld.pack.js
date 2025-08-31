// /src/modes/mathTips/packs/realworld.pack.js
import { registerIntent, M } from '../intentEngine.js';
import { composeReply } from '../conversationPolicy.js';
import { appState } from '../../../data/appState.js';

// ── helpers for quesadilla scaling ─────────────────────────────────────────
function roundToQuarter(x) { return Math.round(x * 4) / 4; }
function cupsToPretty(cups) {
  const q = roundToQuarter(cups);
  const whole = Math.floor(q);
  const frac = q - whole;
  const map = { 0: '', 0.25: '1/4', 0.5: '1/2', 0.75: '3/4' };
  const f = map[frac] || '';
  if (whole === 0 && f) return f + ' cup';
  if (whole > 0 && !f)  return `${whole} ${whole === 1 ? 'cup' : 'cups'}`;
  return `${whole} ${whole === 1 ? 'cup' : 'cups'} ${f}`.trim().replace(/\s+$/, '');
}
function gramsCheese(servings) { return Math.round(servings * 56); } // ~56 g per 1/2 cup
function tortillas(servings) { return Math.max(1, Math.round(servings)); }
function scaleQuesa(servings) {
  const n = Math.max(1, Math.round(Number(servings) || 1));
  const tor = tortillas(n);
  const cups = n * 0.5;
  const grams = gramsCheese(n);
  const pretty = cupsToPretty(cups);
  return { n, tor, cups: pretty, grams };
}

// ── intent: "quesadilla 3" / "scale quesadilla 5" / "quesa 4" ───────────────
registerIntent({
  key: 'quesadilla_scale',
  tests: [
    M.regex(/^quesa(?:dilla)?\s+(\d+)\s*(?:people|servings?)?$/i),
    M.regex(/^scale\s+quesa(?:dilla)?\s+(\d+)\s*(?:people|servings?)?$/i),
  ],
  base: 0.0,
  handler: ({ text }) => {
    const m = text.match(/(\d+)/);
    const k = m ? Number(m[1]) : 1;
    const { n, tor, cups, grams } = scaleQuesa(k);

    try { appState.touchDailyStreak?.('quesadilla_scale'); } catch {}

    const html = [
      `<strong>quesadilla x${n}</strong>`,
      `${tor} ${tor === 1 ? 'tortilla' : 'tortillas'}`,
      `${cups} cheese (~${grams} g)`,
      `<em>tip:</em> cook 2–3 min/side; add beans/onion small handful.`
    ].join('<br>');

    return composeReply({
      userText: text,
      part: { kind: 'answer', html },
      noAck: true
    });
  }
});
// ── tiny helpers to read botContext safely ────────────────────────────────────
function getBotContext() {
  const p = appState.progress || {};
  const mt = p.mathtips || {};
  return mt.botContext || {};
}

// ── intent: topic-aware favorite (“is that your favorite?” / “u like … ?”) ───
registerIntent({
  key: 'favorite_followup',
  base: 0.0,
  tests: [
    M.include(['favorite','favourite']),
    M.include(['do you like','you like']),              // formal phrasing
    M.regex(/\b(u|you)\s+like\b/i),                      // slang: "u like"
    M.regex(/is\s+that\s+your\s+fav/i),
    M.regex(/what(?:'s| is)\s+your\s+favorite/i)
  ],
  handler: ({ text }) => {
    const bc = getBotContext();
    const topic = (bc.lastTopic || '').toLowerCase();
    const mentionsQuesa = /\bquesa(?:dilla)?s?\b/i.test(text);

    if (topic === 'quesadilla' || mentionsQuesa) {
      const html = [
        'low-key fave: cheddar + caramelized onion + a few poblano strips.',
        'medium heat, 2–3 min/side; rest 60 sec so the cheese sets.'
      ].join(' ');
      try { appState.touchDailyStreak?.('favorite_quesa'); } catch {}
      return composeReply({ userText: text, part: { kind: 'answer', html }, noAck: true });
    }

    const html = "i’m a math cat — no taste buds — but if i had some, i’d chase neon cheddar vibes.";
    return composeReply({ userText: text, part: { kind: 'answer', html }, noAck: true });
  }
});

// ── intent: “i like them with …” while on quesadilla topic ───────────────────
registerIntent({
  key: 'quesadilla_affirmation',
  base: 0.0,
  tests: [
    // “i like them with chicken”, “i love …”, “with mushrooms” etc.
    M.regex(/\bi\s+(?:like|love)\s+(?:them|it)?\s*(?:with\s+([a-z\s]+))?/i),
    M.regex(/\bwith\s+[a-z\s]+/i)
  ],
  handler: ({ text }) => {
    const bc = getBotContext();
    const topic = (bc.lastTopic || '').toLowerCase();
    if (topic !== 'quesadilla') {
      // not in quesadilla context → keep it chill
      return composeReply({
        userText: text,
        part: { kind: 'answer', html: 'right on. want a tiny math rep or a study tip?' },
        noAck: true
      });
    }

    const m = text.match(/\bwith\s+([a-z\s]+)$/i);
    const filling = (m && m[1]) ? m[1].trim() : 'your pick';

    const html = [
      `nice — ${filling} works.`,
      'pro tip: pre-cook add-ins; go ~1/4 cup filling per tortilla so it still seals.'
    ].join(' ');
    try { appState.touchDailyStreak?.('quesa_affirm'); } catch {}
    return composeReply({ userText: text, part: { kind: 'answer', html }, noAck: true });
  }
});
