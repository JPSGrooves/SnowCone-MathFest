// /src/modes/mathTips/modes/calculator.js
// Calculator booth — natural-language mini-solves with 1–2 line explanations.
// Covers: percent-of, discount, tip, tax, split, reverse %, fraction→decimal,
// percent change, and plain expressions (with ^ and sqrt).
// Tone & pacing match MathTips booths (single-card replies, light nudge).

import { composeReply } from '../conversationPolicy.js';
import { makeSession, helpCard } from './_kit.js';

const S = makeSession({ capMin: 3, capMax: 4 });

// Single-card wrapper (matches lore/lesson “layered” look)
function layer(inner, tone = 'cyan') {
  const html = String(inner || '').trim();
  return `<div class="mt-layer-card mt-layer--${tone}"><div class="mt-layer-body">${html}</div></div>`;
}

/* ───────── helpers: small formatters ───────── */
const MONEYish = /\$/;

const fmtNum = (x) => {
  if (!Number.isFinite(x)) return String(x);
  // integers plain, decimals up to 6
  return Math.abs(x - Math.round(x)) < 1e-12
    ? String(Math.round(x))
    : Number(x.toFixed(6)).toString();
};
const fmtMoney = (x) => `$${Number(x).toFixed(2)}`;

function pickAsk() {
  const arr = [
    'another calculation?',
    'want one more?',
    'toss me another?',
    'keep it rolling?'
  ];
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ───────── tiny math utils (just what we need) ───────── */
const toNum = (s) => Number(String(s).replace(/[$,]/g, ''));
const pctToUnit = (p) => (p / 100);

/* ───────── pattern solvers (each returns { html, money } or null) ───────── */

// 1) PERCENT OF — “15% of 80”
function solvePercentOf(t) {
  const m = /(-?\d+(?:\.\d+)?)\s*%\s*of\s*(-?\d+(?:\.\d+)?)/i.exec(t);
  if (!m) return null;
  const p = toNum(m[1]), n = toNum(m[2]);
  const ans = pctToUnit(p) * n;
  const money = MONEYish.test(t);
  const shown = money ? fmtMoney(ans) : fmtNum(ans);
  const step = `${p}% of ${money ? fmtMoney(n) : fmtNum(n)} → ${pctToUnit(p)} × ${money ? fmtMoney(n) : fmtNum(n)} = <strong>${shown}</strong>`;
  return { html: `<p>${step}</p>`, money };
}

// 2) DISCOUNT — “27% off $10”, “apply 20% discount to 50”
function solveDiscount(t) {
  const m = /(\d+(?:\.\d+)?)\s*%\s*(?:off|discount)\s*(?:of|on|from|to)?\s*\$?\s*(\d+(?:\.\d+)?)/i.exec(t);
  if (!m) return null;
  const p = toNum(m[1]), base = toNum(m[2]);
  const cut = pctToUnit(p) * base;
  const final = base - cut;
  const step = `${p}% off ${fmtMoney(base)} → ${fmtMoney(base)} − (${p/100}×${fmtMoney(base)}) = <strong>${fmtMoney(final)}</strong> (saved ${fmtMoney(cut)})`;
  return { html: `<p>${step}</p>`, money: true };
}

// 3) TIP — “add 18% tip to $42”, “tip 20% on 50”
function solveTip(t) {
  const m = /(?:add\s*)?(\d+(?:\.\d+)?)\s*%\s*tip\s*(?:to|on)?\s*\$?\s*(\d+(?:\.\d+)?)/i.exec(t)
         || /tip\s*(\d+(?:\.\d+)?)\s*%\s*(?:on|to)?\s*\$?\s*(\d+(?:\.\d+)?)/i.exec(t);
  if (!m) return null;
  const p = toNum(m[1]), base = toNum(m[2]);
  const tipAmt = pctToUnit(p) * base;
  const total  = base + tipAmt;
  const step = `add ${p}% tip to ${fmtMoney(base)} → ${fmtMoney(base)} × (1 + ${p/100}) = <strong>${fmtMoney(total)}</strong> (tip ${fmtMoney(tipAmt)})`;
  return { html: `<p>${step}</p>`, money: true };
}

// 4) TAX — “add 8.25% tax to 100”
function solveTax(t) {
  const m = /(?:add|include)?\s*(\d+(?:\.\d+)?)\s*%\s*tax\s*(?:to|on)?\s*\$?\s*(\d+(?:\.\d+)?)/i.exec(t);
  if (!m) return null;
  const p = toNum(m[1]), base = toNum(m[2]);
  const tax = pctToUnit(p) * base;
  const total = base + tax;
  const step = `add ${p}% tax to ${fmtMoney(base)} → ${fmtMoney(base)} × (1 + ${p/100}) = <strong>${fmtMoney(total)}</strong> (tax ${fmtMoney(tax)})`;
  return { html: `<p>${step}</p>`, money: true };
}

// 5) SPLIT — “split $60 three ways”, “split 90 by 4”, “split $45 seven ways”
const WORD_NUM = new Map(Object.entries({
  one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,
  eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,
  seventeen:17,eighteen:18,nineteen:19,twenty:20
}));
function parseIntOrWord(s) {
  if (!s) return null;
  const n = parseInt(s,10);
  if (Number.isFinite(n)) return n;
  const w = WORD_NUM.get(String(s).toLowerCase());
  return Number.isFinite(w) ? w : null;
}
function solveSplit(t) {
  const m =
    /split\s*\$?\s*(\d+(?:\.\d+)?)\s*(?:dollars?)?\s*(?:by|between|among|into)?\s*(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\s*(?:people|ways|parts)?/i
      .exec(t);
  if (!m) return null;
  const total = toNum(m[1]);
  const n = Math.max(1, parseIntOrWord(m[2]) ?? 1);
  const each = total / n;
  const step = `split ${fmtMoney(total)} ${n} way${n===1?'':'s'} → ${fmtMoney(total)} ÷ ${n} = <strong>${fmtMoney(each)}</strong> each`;
  return { html: `<p>${step}</p>`, money: true };
}

// 6) REVERSE % — “10 is 25% of what”
function solveReversePercent(t) {
  const m = /(-?\d+(?:\.\d+)?)\s+is\s+(\d+(?:\.\d+)?)\s*%\s*of\s*(?:what|which|who)?/i.exec(t);
  if (!m) return null;
  const part = toNum(m[1]), p = toNum(m[2]);
  if (p === 0) return { html: `<p>percent can’t be zero there.</p>` };
  const whole = part / pctToUnit(p);
  const step = `${fmtNum(part)} is ${p}% of what? → ${fmtNum(part)} ÷ ${p/100} = <strong>${fmtNum(whole)}</strong>`;
  return { html: `<p>${step}</p>` };
}

// 7) FRACTION→DECIMAL — “3/8 as decimal”
function solveFractionDecimal(t) {
  const m = /(\d+)\s*\/\s*(\d+)\s*(?:as|to)?\s*decimal/i.exec(t);
  if (!m) return null;
  const a = toNum(m[1]), b = toNum(m[2]);
  if (b === 0) return { html: `<p>division by zero — no bueno.</p>` };
  const val = a / b;
  const step = `${a}/${b} as decimal → ${a} ÷ ${b} = <strong>${fmtNum(val)}</strong>`;
  return { html: `<p>${step}</p>` };
}

// 8) PERCENT CHANGE — “percent change from 50 to 65”
function solvePercentChange(t) {
  const m = /percent\s*change\s*(?:from)?\s*(-?\d+(?:\.\d+)?)\s*(?:to|→)\s*(-?\d+(?:\.\d+)?)/i.exec(t);
  if (!m) return null;
  const oldV = toNum(m[1]), newV = toNum(m[2]);
  if (oldV === 0) return { html: `<p>percent change from 0 is undefined.</p>` };
  const delta = (newV - oldV) / Math.abs(oldV) * 100;
  const dir = delta > 0 ? 'increase' : (delta < 0 ? 'decrease' : 'no change');
  const step = `percent change from ${fmtNum(oldV)} to ${fmtNum(newV)} → (${fmtNum(newV)} − ${fmtNum(oldV)}) ÷ ${fmtNum(oldV)} × 100% = <strong>${fmtNum(delta)}%</strong> ${dir}`;
  return { html: `<p>${step}</p>` };
}

/* ───────── light expression support (caret, sqrt, bare fractions) ───────── */
function normalizeExpr(input) {
  let expr = String(input || '').trim();
  // caret exponent
  expr = expr.replace(/\^/g, '**');
  // sqrt 9 / sqrt(9)
  expr = expr
    .replace(/\bsqrt\s*\(\s*([^)]+)\s*\)/gi, (_m, inside) => `Math.sqrt(${inside})`)
    .replace(/\bsqrt\s+([\-]?\d*\.?\d+)/gi, (_m, n) => `Math.sqrt(${n})`);
  // wrap bare a/b
  expr = expr.replace(/(?<![)\w.])(\d*\.?\d+)\s*\/\s*(\d*\.?\d+)(?![\w.(])/g, '($1/$2)');
  // reject obvious junk identifiers (keep just Math.sqrt)
  const probe = expr.replace(/Math\.sqrt/g, 'S');
  if (/[^0-9+\-*/().\sS]/.test(probe)) throw new Error('weird chars');
  return expr;
}
function evalExpr(expr) {
  // eslint-disable-next-line no-new-func
  const fn = new Function('Math', `"use strict"; return (${expr});`);
  return fn(Math);
}

/* ───────── help card ───────── */
function calcHelpCard() {
  return helpCard(
    'Calculator',
    [
      'percent of: `15% of 80` → 12',
      'discount: `27% off $10` → $7.30 (saved $2.70)',
      'tip/tax: `add 18% tip to $42` · `add 8.25% tax to $100`',
      'split: `split $60 three ways` → $20.00 each',
      'reverse %: `10 is 25% of what` → 40',
      'fraction: `3/8 as decimal` → 0.375',
      'change: `percent change from 50 to 65` → 30%',
      'expressions: `(2+3)^3`, `sqrt 9 + 4`'
    ],
    'tip: say "exit" to leave the calculator.'
  );
}

/* ───────── booth-agnostic quickSolve (for router inline answers) ───────── */
// Quick inline solver used by qabot.js (returns raw HTML string or '')
export function quickSolve(text = '') {
  const raw = String(text || '').trim();
  if (!raw) return '';

  // same solver order as handle()
  const solvers = [
    solveDiscount,
    solveTip,
    solveTax,
    solveSplit,
    solveReversePercent,
    solveFractionDecimal,
    solvePercentChange,
    solvePercentOf
  ];
  for (const f of solvers) {
    const hit = f(raw);
    if (hit && hit.html) return hit.html;
  }

  // expression fallback
  try {
    const expr = normalizeExpr(raw);
    const val  = evalExpr(expr);
    if (!Number.isFinite(val)) return '';
    return `<p>${raw} = <strong>${fmtNum(val)}</strong></p>`;
  } catch {
    return '';
  }
}


/* ───────── public API ───────── */
export function start() {
  S.reset();
  return composeReply({
    part: { html: calcHelpCard() },
    askAllowed: false,
    noAck: true
  });
}

export function handle(text = '') {
  const raw = String(text || '').trim();
  if (!raw || /^help\b/i.test(raw)) {
    return { html: composeReply({ part: { html: calcHelpCard() }, askAllowed: false, noAck: true }) };
  }

  if (S.shouldBlock(raw)) {
    return { html: composeReply({ part: { html: `<p>hang on, i’m crunching.</p>` }, askAllowed: false, noAck: true }) };
  }
  S.bump();

  // ordered by specificity (discount/tip/tax/split) → general %
  const solvers = [
    solveDiscount,
    solveTip,
    solveTax,
    solveSplit,
    solveReversePercent,
    solveFractionDecimal,
    solvePercentChange,
    solvePercentOf
  ];

  for (const f of solvers) {
    const hit = f(raw);
    if (hit) {
      const reply = layer(hit.html);
      if (S.isCapReached()) {
        return {
          html: composeReply({
            part: { html: `${reply}${layer('<p>calculator cool-down. try another booth?</p>')}` },
            askAllowed: false,
            noAck: true
          })
        };
      }
      return {
        html: composeReply({
          part: { html: reply },
          askAllowed: true,
          askText: pickAsk(),
          noAck: true
        })
      };
    }
  }

  // plain expression fallback (supports ^, sqrt, simple fractions)
  try {
    const expr = normalizeExpr(raw);
    const val  = evalExpr(expr);
    if (!Number.isFinite(val)) throw new Error('nf');
    const line = layer(`<p>${raw} = <strong>${fmtNum(val)}</strong></p>`);
    if (S.isCapReached()) {
      return { html: composeReply({ part: { html: `${line}<p>that’s plenty of math here. another booth?</p>` }, askAllowed: false, noAck: true }) };
    }
    return { html: composeReply({ part: { html: line }, askAllowed: true, askText: pickAsk(), noAck: true }) };
  } catch {
    const hint = layer(`<p>couldn’t parse. try <code>27% off $10</code>, <code>add 18% tip to $42</code>, <code>split $60 three ways</code>, or <code>3/8 as decimal</code>.</p>`);
    return { html: composeReply({ part: { html: hint }, askAllowed: true, askText: 'want help instead?', noAck: true }) };
  }
}
