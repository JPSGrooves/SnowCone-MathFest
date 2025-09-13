// /src/modes/mathTips/modes/quiz.js
import { composeReply } from '../conversationPolicy.js';
import { makeSession, readAffirmative, helpCard } from './_kit.js';

const QUIZ_SESS = new Map();          // per session deck
const S = makeSession({ capMin: 3, capMax: 4 });

function makeQs(topic = 'fractions', count = 3) {
  const qs = [];
  for (let i = 0; i < count; i++) {
    if (topic === 'percent') {
      const a = 5 + 5 * i;
      const b = 40 + 10 * i;
      qs.push({ prompt: `${a}% of ${b}?`, answer: ((a / 100) * b).toString() });
    } else {
      const a = i + 1, b = i + 2, c = i + 3, d = i + 4;
      const num = a*d + c*b;
      const den = b*d;
      qs.push({ prompt: `${a}/${b} + ${c}/${d}?`, answer: `${num}/${den}` });
    }
  }
  return qs;
}

function normTopic(s='') {
  return /percent/.test(s) ? 'percent' : 'fractions';
}

export function start({ topic='fractions', count=3, sessionId='default' } = {}) {
  S.reset();
  const deck = makeQs(normTopic(topic), Math.max(1, Math.min(5, count)));
  QUIZ_SESS.set(sessionId, { topic: normTopic(topic), idx: 0, deck, score: 0 });
  const bubbles = deck.map((q,i)=>`<div class="mt-response-item">Q${i+1}. ${q.prompt}</div>`).join('');
  const html = `
    <p>quiz time: ${normTopic(topic)}. answer in chat.</p>
    <div class="mt-response-list">${bubbles}</div>
  `;
  return composeReply({ part: { kind:'answer', html }, askAllowed: false, mode:'quiz' });
}

export function handle(text = '', ctx = {}) {
  // help?
  if (/^help\b/i.test(text)) {
    const card = helpCard(
      'Quiz Help',
      [
        'say: "quiz fractions 3" or "quiz percent 3"',
        'answer by typing the result (e.g. "5/6" or "10")',
        'say "end quiz" to stop'
      ],
      'tip: say "exit" to leave the quiz booth.'
    );
    return { html: composeReply({ part: { kind:'answer', html: card }, askAllowed: false, mode:'quiz' }) };
  }

  if (/^end\s+quiz\b/i.test(text)) {
    QUIZ_SESS.clear();
    return { html: composeReply({ part: { kind:'answer', html: `<p>quiz ended. want another booth?</p>` }, askAllowed: false, mode:'quiz' }) };
  }

  const sessionId = ctx.sessionId || 'default';
  const s = QUIZ_SESS.get(sessionId);
  if (!s) {
    return { html: composeReply({ part: { kind:'answer', html: `<p>no active quiz. try <code>quiz fractions 3</code> or <code>quiz percent 3</code>.` }, askAllowed: true, mode:'quiz' }) };
  }

  if (S.shouldBlock(text)) {
    return { html: composeReply({ part: { html: `<p>one at a time, friend.</p>` }, askAllowed: false }) };
  }

  const q = s.deck[s.idx];
  if (!q) {
    const html = `<p>quiz complete — Score ${s.score}/${s.deck.length}.</p>`;
    // after a set, ask if they want another — enforce cap
    if (S.isNearCap()) {
      QUIZ_SESS.delete(sessionId);
      return { html: composeReply({ part: { html: `${html}<p>that’s enough drilling for now. want another booth?</p>` }, askAllowed: false }) };
    } else {
      S.bump();
      QUIZ_SESS.delete(sessionId);
      return { html: composeReply({ part: { html }, askAllowed: true, askText: 'want another short set?' }) };
    }
  }

  const ok = String(text).replace(/\s/g,'').toLowerCase() === q.answer.replace(/\s/g,'').toLowerCase();
  if (ok) s.score++;
  s.idx++;

  const next = s.deck[s.idx];
  if (!next) {
    const html = `<p>${ok ? '✅ correct.' : `❌ close. answer was <code>${q.answer}</code>.`}</p><p>quiz complete — Score ${s.score}/${s.deck.length}.</p>`;
    if (S.isCapReached()) {
      QUIZ_SESS.delete(sessionId);
      return { html: composeReply({ part: { kind:'answer', html: `${html}<p>that’s my stretch today. try another booth?</p>` }, askAllowed: false, mode:'quiz' }) };
    }
    S.bump();
    QUIZ_SESS.delete(sessionId);
    return { html: composeReply({ part: { kind:'answer', html }, askAllowed: true, mode:'quiz' }) };
  }

  return {
    html: composeReply({
      part: { html: `${ok ? '✅ correct!' : `❌ not quite. <code>${q.answer}</code>.`}<p>Next: ${next.prompt}</p>` },
      askAllowed: false
    })
  };
}
