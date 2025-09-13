// Ultra-light quiz booth. Keeps state in a module-local map keyed by ctx.sessionId (if provided).

const SESSIONS = new Map();

function makeQs(topic = 'fractions', count = 3) {
  const qs = [];
  for (let i = 0; i < count; i++) {
    if (topic === 'percent') {
      const a = 5 + 5 * i;
      const b = 40 + 10 * i;
      qs.push({ prompt: `${a}% of ${b}?`, answer: ((a / 100) * b).toString() });
    } else {
      // fractions add
      const a = i + 1, b = i + 2, c = i + 3, d = i + 4;
      qs.push({ prompt: `${a}/${b} + ${c}/${d}?`, answer: ((a*d + c*b) + '/' + (b*d)) });
    }
  }
  return qs;
}

export function start(opts = {}) {
  const topic = opts.topic || 'fractions';
  const count = Math.max(1, Math.min(5, opts.count || 3));
  const sessionId = opts.sessionId || 'default';

  const deck = makeQs(topic, count);
  SESSIONS.set(sessionId, { topic, idx: 0, deck, score: 0 });

  return {
    text: `Quiz started: ${topic}. Answer in chat!`,
    deck
  };
}

export function handle(text = '', ctx = {}) {
  const sessionId = ctx.sessionId || 'default';
  const s = SESSIONS.get(sessionId);
  if (!s) return { html: `<p>No active quiz. Try <code>quiz fractions 3</code> or <code>quiz percent 3</code>.</p>` };

  const q = s.deck[s.idx];
  if (!q) return { html: `<p>Quiz done! Score ${s.score}/${s.deck.length}. Say <code>quiz percent 3</code> for another.</p>` };

  const ok = String(text).replace(/\s/g, '').toLowerCase() === q.answer.replace(/\s/g, '').toLowerCase();
  if (ok) s.score++;

  s.idx++;
  const next = s.deck[s.idx];
  if (!next) {
    const score = s.score; const total = s.deck.length;
    SESSIONS.delete(sessionId);
    return { html: `<p>✅ ${ok ? 'Correct' : 'Not quite'}.</p><p>Quiz complete — Score ${score}/${total}.</p>` };
  }
  return { html: `<p>${ok ? '✅ Correct!' : `❌ Not quite. Answer was <code>${q.answer}</code>.`}</p><p>Next: ${next.prompt}</p>` };
}
