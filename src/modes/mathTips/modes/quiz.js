// /src/modes/mathTips/modes/quiz.js
import { composeReply } from '../conversationPolicy.js';
import { makeSession, helpCard } from './_kit.js';

const QUIZ_SESS = new Map();                     // per-session state
const S = makeSession({ capMin: 3, capMax: 4 }); // caps # of short sets

/* ───────── math helpers ───────── */
function gcd(a, b) { a = Math.abs(a|0); b = Math.abs(b|0); while (b) [a, b] = [b, a % b]; return a || 1; }
function reduce(num, den) { if (den === 0) return { num, den: 0 }; const g = gcd(num, den); const s = den < 0 ? -1 : 1; return { num: s*(num/g), den: Math.abs(den/g) }; }
function parseFraction(str) {
  const s = String(str || '').trim();
  const m = s.match(/^([+-]?\d+)\s+(\d+)\s*\/\s*(\d+)$/); // mixed
  if (m) { const w = parseInt(m[1],10), n = parseInt(m[2],10), d = parseInt(m[3],10); const sign = w < 0 ? -1 : 1; return reduce(sign*(Math.abs(w)*d + n), d); }
  const f = s.match(/^([+-]?\d+)\s*\/\s*([+-]?\d+)$/);
  if (f) { return reduce(parseInt(f[1],10), parseInt(f[2],10)); }
  return null;
}
function parseNumber(str) { const s = String(str ?? '').trim().replace(/,/g,'').replace(/%$/,''); if (!s) return null; const n = Number(s); return Number.isFinite(n) ? n : null; }
const fracToNumber = (fr) => (!fr || fr.den === 0) ? NaN : fr.num / fr.den;
const close = (a,b,eps=1e-6)=>Math.abs(a-b)<=eps;
const canonFrac = (fr)=>{ const r = reduce(fr.num, fr.den); return `${r.num}/${r.den}`; };

/* ───────── deck factory ───────── */
function makeQs(topic='fractions', count=3) {
  const qs = [];
  for (let i=0;i<count;i++){
    if (topic === 'percent') {
      const p = 5 + 5*i;      // 5%,10%,15%…
      const n = 40 + 10*i;    // 40,50,60…
      qs.push({ prompt: `${p}% of ${n}?`, topic:'percent', p, n, answerNum:(p/100)*n });
    } else {
      const a=i+1, b=i+2, c=i+3, d=i+4;
      const num=a*d + c*b, den=b*d;
      qs.push({ prompt:`${a}/${b} + ${c}/${d}?`, topic:'fractions', a,b,c,d, answerFrac: reduce(num,den) });
    }
  }
  return qs;
}
const normTopic = (s='') => /percent/i.test(s) ? 'percent' : 'fractions';
const clampCount = (n) => Math.max(1, Math.min(5, n|0 || 3));

/* ───────── correctness ───────── */
function isCorrectAnswer(userText, q) {
  const raw = String(userText || '').trim();
  if (q.topic === 'fractions') {
    const asFrac = parseFraction(raw);
    if (asFrac) { const a = reduce(asFrac.num, asFrac.den), b = q.answerFrac; return a.num===b.num && a.den===b.den; }
    const num = parseNumber(raw); if (num!==null) return close(num, fracToNumber(q.answerFrac));
    return false;
  }
  if (q.topic === 'percent') {
    const num = parseNumber(raw); if (num!==null) return close(num, q.answerNum);
    const asFrac = parseFraction(raw); if (asFrac) return close(fracToNumber(asFrac), q.answerNum);
    return false;
  }
  return false;
}
function canonicalAnswerString(q) {
  if (q.topic === 'fractions') return canonFrac(q.answerFrac);
  let s = String(q.answerNum);
  if (Number.isFinite(q.answerNum)) s = q.answerNum.toFixed(10).replace(/\.?0+$/,'');
  return s;
}

/* ───────── UI helpers (plain bubbles) ───────── */
const controlsLine = () =>
  `<p class="mt-dim">controls: <code>hint</code> · <code>skip</code> · <code>again</code> · <code>end quiz</code> · <code>menu</code></p>`;

const menuCard = () => `
  <p><strong>Quiz Menu</strong></p>
  <ul class="mt-menu">
    <li><strong>fractions</strong> — add small fractions</li>
    <li><strong>percent</strong> — percent of a number</li>
  </ul>
  <p class="mt-dim">start: <code>quiz fractions</code> or <code>quiz percent</code></p>
`;
const qCard = (_head, body) => `${body}${controlsLine()}`;
const endCard = (score,total,tail='') => `<p><strong>Quiz complete</strong> — ${score}/${total}.</p>${tail}`;

/* ───────── public API ───────── */
export function start({ topic, count=3, sessionId='default' } = {}) {
  // If no topic (e.g., “quiz booth”) → show menu.
  if (!topic) {
    return composeReply({ part:{ kind:'answer', html: menuCard() }, askAllowed:false, mode:'quiz', noAck:true });
  }
  S.reset();
  const t = normTopic(topic);
  const deck = makeQs(t, clampCount(count));
  QUIZ_SESS.set(sessionId, { topic: t, idx: 0, deck, score: 0 });

  const q1 = deck[0];
  const html = qCard(`Quiz: ${t}`, `
    <p>Q1 of ${deck.length}: <strong>${q1.prompt}</strong></p>
    <p class="mt-dim">type your answer (fractions like <code>5/6</code> or numbers like <code>7.5</code>).</p>
  `);
  return composeReply({ part:{ kind:'answer', html }, askAllowed:false, mode:'quiz', noAck:true });
}

export function handle(text = '', ctx = {}) {
  const msg = String(text || '').trim();
  const sessionId = ctx.sessionId || 'default';

  // help + menu
  if (/^help\b/i.test(msg)) {
    const card = helpCard(
      'Quiz Help',
      [
        'start: "quiz fractions" or "quiz percent"',
        'also works: "fractions", "fractions 4", "percent 5"',
        'controls: hint · skip · again · end quiz · menu'
      ],
      'tip: say "exit" to leave the quiz booth.'
    );
    return { html: composeReply({ part:{ kind:'answer', html: card }, askAllowed:false, mode:'quiz', noAck:true }) };
  }
  if (/^menu\b/i.test(msg)) {
    return { html: composeReply({ part:{ kind:'answer', html: menuCard() }, askAllowed:false, mode:'quiz', noAck:true }) };
  }

  // allow bare topic to start (e.g., "fractions" or "percent [N]")
  const mTopicOnly = msg.match(/^(fractions?|percent)\b(?:\s+(\d+))?$/i);
  if (mTopicOnly) {
    const t = normTopic(mTopicOnly[1]);
    const c = clampCount(parseInt(mTopicOnly[2] || '3', 10));
    return start({ topic: t, count: c, sessionId });
  }

  // still support "quiz fractions [N]" and "start ..."
  const mStart = msg.match(/^quiz\b(?:\s+(fractions?|percent))?(?:\s+(\d+))?$/i)
             || msg.match(/^start\b(?:\s+(fractions?|percent))?(?:\s+(\d+))?$/i);
  if (mStart) {
    const t = normTopic(mStart[1] || 'fractions');
    const c = clampCount(parseInt(mStart[2] || '3', 10));
    return start({ topic: t, count: c, sessionId });
  }

  if (/^end\s+quiz\b/i.test(msg)) {
    QUIZ_SESS.delete(sessionId);
    return { html: composeReply({ part:{ kind:'answer', html: `<p>quiz ended. want another booth?</p>` }, askAllowed:false, mode:'quiz', noAck:true }) };
  }

  const s = QUIZ_SESS.get(sessionId);
  if (!s) {
    // No active deck → show menu until they pick a topic
    return { html: composeReply({ part:{ kind:'answer', html: menuCard() }, askAllowed:false, mode:'quiz', noAck:true }) };
  }

  if (S?.shouldBlock?.(msg)) {
    return { html: composeReply({ part:{ html:`<p>one at a time, friend.</p>` }, askAllowed:false, noAck:true }) };
  }

  const q = s.deck[s.idx];
  if (!q) {
    const html = endCard(s.score, s.deck.length);
    QUIZ_SESS.delete(sessionId);
    return { html: composeReply({ part:{ html }, askAllowed:true, askText:'want another short set?', mode:'quiz', noAck:true }) };
  }

  if (/^again\b/i.test(msg)) {
    const body = `<p>Q${s.idx+1} of ${s.deck.length}: <strong>${q.prompt}</strong></p>`;
    return { html: composeReply({ part:{ html: qCard('Quiz', body) }, askAllowed:false, noAck:true }) };
  }

  // ✅ FIXED: clean, separate paragraphs (no nested <p>)
  if (/^hint\b/i.test(msg)) {
    const tipText = (q.topic === 'fractions')
      ? `common denom: <code>${q.a}/${q.b} + ${q.c}/${q.d} = (${q.a}×${q.d} + ${q.c}×${q.b})/(${q.b}×${q.d})</code>. then simplify.`
      : `formula: <code>p% of n = (p/100) × n</code>. plug in and multiply.`;
    const body = `
      <p><em>hint:</em> ${tipText}</p>
      <p>Q${s.idx+1} of ${s.deck.length}: <strong>${q.prompt}</strong></p>
    `;
    return { html: composeReply({ part:{ html: qCard('Quiz', body) }, askAllowed:false, noAck:true }) };
  }

  if (/^skip\b/i.test(msg)) {
    s.idx++;
    const next = s.deck[s.idx];
    if (!next) {
      const html = endCard(s.score, s.deck.length, '<p class="mt-dim">that was the last one.</p>');
      QUIZ_SESS.delete(sessionId);
      return { html: composeReply({ part:{ html }, askAllowed:true, askText:'another short set?', noAck:true }) };
    }
    const body = `<p><span class="mt-dim">skipped.</span></p><p>Q${s.idx+1} of ${s.deck.length}: <strong>${next.prompt}</strong></p>`;
    return { html: composeReply({ part:{ html: qCard('Quiz', body) }, askAllowed:false, noAck:true }) };
  }

  // grade
  const ok = isCorrectAnswer(msg, q);
  if (ok) s.score++;
  s.idx++;

  const feedback = ok ? '✅ correct.' : `❌ close — answer: <code>${canonicalAnswerString(q)}</code>.`;

  const next = s.deck[s.idx];
  if (!next) {
    const html = endCard(s.score, s.deck.length, `<p>${feedback}</p>`);
    if (S?.isCapReached?.()) {
      QUIZ_SESS.delete(sessionId);
      return { html: composeReply({ part:{ kind:'answer', html: `${html}<p>that’s my stretch today. try another booth?</p>` }, askAllowed:false, mode:'quiz', noAck:true }) };
    }
    S?.bump?.();
    QUIZ_SESS.delete(sessionId);
    return { html: composeReply({ part:{ kind:'answer', html }, askAllowed:true, mode:'quiz', noAck:true }) };
  }

  const html = qCard('Quiz', `
    <p>${feedback}</p>
    <p>Q${s.idx + 1} of ${s.deck.length}: <strong>${next.prompt}</strong></p>
  `);
  return { html: composeReply({ part:{ html }, askAllowed:false, noAck:true }) };
}

/* ───────── expose active state so router can prioritize quiz over calculator ───────── */
export function isActive(sessionId='default') {
  return QUIZ_SESS.has(sessionId);
}
