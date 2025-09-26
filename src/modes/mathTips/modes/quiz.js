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

/* ───────── UI helpers ───────── */
const controlsLine = () =>
  `<p class="mt-dim">controls: <code>hint</code> · <code>skip</code> · <code>again</code> · <code>end quiz</code> · <code>menu</code></p>`;

const menuCard = () => `
  <div class="mt-layer-card mt-layer--cyan">
    <div class="mt-layer-head">Quiz Menu</div>
    <div class="mt-layer-body">
      <ul class="mt-response-list">
        <li class="mt-response-item"><strong>fractions</strong> — add small fractions</li>
        <li class="mt-response-item"><strong>percent</strong> — percent of a number</li>
      </ul>
      <p class="mt-dim">start: <code>quiz fractions</code> or <code>quiz percent</code></p>
    </div>
  </div>
`;
const qCard = (head, body) => `
  <div class="mt-layer-card mt-layer--cyan">
    <div class="mt-layer-head">${head}</div>
    <div class="mt-layer-body">${body}${controlsLine()}</div>
  </div>
`;
const endCard = (score,total,tail='') => `
  <div class="mt-layer-card mt-layer--gold">
    <div class="mt-layer-head">Quiz complete</div>
    <div class="mt-layer-body"><p>Score ${score}/${total}.</p>${tail}</div>
  </div>
`;

/* ───────── public API ───────── */
export function start({ topic, count=3, sessionId='default' } = {}) {
  // If no topic (e.g., “quiz booth”) → show menu.
  if (!topic) {
    return composeReply({ part:{ kind:'answer', html: menuCard() }, askAllowed:false, mode:'quiz', noAck:true });
  }
  S.reset();
  const t = normTopic(topic);
  const deck = makeQs(t, Math.max(1, Math.min(5, count|0)));
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

  if (/^help\b/i.test(msg)) {
    const card = helpCard(
      'Quiz Help',
      [
        'start: "quiz fractions" or "quiz percent"',
        'controls: hint · skip · again · end quiz · menu',
        'answers: fractions (e.g., 5/6) or numbers (e.g., 7.5)'
      ],
      'tip: say "exit" to leave the quiz booth.'
    );
    return { html: composeReply({ part:{ kind:'answer', html: card }, askAllowed:false, mode:'quiz', noAck:true }) };
  }
  if (/^menu\b/i.test(msg)) {
    return { html: composeReply({ part:{ kind:'answer', html: menuCard() }, askAllowed:false, mode:'quiz', noAck:true }) };
  }
  // allow restarting inside quiz: “quiz percent [N]”
  const mStart = msg.match(/^quiz\b(?:\s+(fractions?|percent))?(?:\s+(\d+))?$/i);
  if (mStart) {
    const t = normTopic(mStart[1] || 'fractions');
    const c = mStart[2] ? Math.max(1, Math.min(5, parseInt(mStart[2],10))) : 3;
    return start({ topic: t, count: c, sessionId });
  }
  if (/^end\s+quiz\b/i.test(msg)) {
    QUIZ_SESS.delete(sessionId);
    return { html: composeReply({ part:{ kind:'answer', html: `<p>quiz ended. want another booth?</p>` }, askAllowed:false, mode:'quiz', noAck:true }) };
  }

  const s = QUIZ_SESS.get(sessionId);
  if (!s) return { html: composeReply({ part:{ kind:'answer', html: menuCard() }, askAllowed:false, mode:'quiz', noAck:true }) };

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
    const head = `Quiz: ${s.topic}`;
    const body = `<p>Q${s.idx+1} of ${s.deck.length}: <strong>${q.prompt}</strong></p>`;
    return { html: composeReply({ part:{ html: qCard(head, body) }, askAllowed:false, noAck:true }) };
  }
  if (/^hint\b/i.test(msg)) {
    const tip = (q.topic === 'fractions')
      ? `<p>common denom: <code>${q.a}/${q.b} + ${q.c}/${q.d} = (${q.a}×${q.d} + ${q.c}×${q.b})/(${q.b}×${q.d})</code>. then simplify.</p>`
      : `<p>formula: <code>p% of n = (p/100) × n</code>. plug in and multiply.</p>`;
    const head = `Quiz: ${s.topic}`;
    const body = `<p><em>hint:</em> ${tip}</p><p>Q${s.idx+1} of ${s.deck.length}: <strong>${q.prompt}</strong></p>`;
    return { html: composeReply({ part:{ html: qCard(head, body) }, askAllowed:false, noAck:true }) };
  }
  if (/^skip\b/i.test(msg)) {
    s.idx++;
    const next = s.deck[s.idx];
    if (!next) {
      const html = endCard(s.score, s.deck.length, '<p class="mt-dim">that was the last one.</p>');
      QUIZ_SESS.delete(sessionId);
      return { html: composeReply({ part:{ html }, askAllowed:true, askText:'another short set?', noAck:true }) };
    }
    const head = `Quiz: ${s.topic}`;
    const body = `<p><span class="mt-dim">skipped.</span></p><p>Q${s.idx+1} of ${s.deck.length}: <strong>${next.prompt}</strong></p>`;
    return { html: composeReply({ part:{ html: qCard(head, body) }, askAllowed:false, noAck:true }) };
  }

  // grade
  const ok = isCorrectAnswer(msg, q);
  if (ok) s.score++;
  s.idx++;

  const feedback = ok ? '✅ correct.' : `❌ close. answer was <code>${canonicalAnswerString(q)}</code>.`;
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

  const html = qCard('Quiz: ' + s.topic, `
    <p>${feedback}</p>
    <p>Q${s.idx + 1} of ${s.deck.length}: <strong>${next.prompt}</strong></p>
  `);
  return { html: composeReply({ part:{ html }, askAllowed:false, noAck:true }) };
}
