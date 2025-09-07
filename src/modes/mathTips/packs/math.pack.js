// /src/modes/mathTips/packs/math.pack.js
// Math intents (percent-of, calc, simplify, gcf, lcm, factor)
// - test-gated: intent only wins when regex/guards match
// - single-bubble replies via composeReply
// - bumps daily streak on successful solves (safe-guarded)

import { registerIntent, M } from '../intentEngine.js';
import { composeReply } from '../conversationPolicy.js';
import { SAFE_EXPR, evalSafeExpression, tryPercentOf, simplifyFractionText, gcd, lcm } from '../mathSafe.js';
import { appState } from '../../../data/appState.js';
import {
  parseLooseFraction, simplifyFraction, addFrac, subFrac, mulFrac, divFrac,
  toMixedString, toSimpleString
} from '../mathSafe.js';

const esc = (s)=>String(s)
  .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
  .replaceAll('"','&quot;').replaceAll("'",'&#39;');

const answer = (html)=>({ kind:'answer', html });
const teach  = (topic)=>({ kind:'teach', html:'', topicGuess: topic });

// 🔔 Safe bump: only if the method exists (so dev builds without the patch don’t crash)
function bumpStreak(reason) {
  try {
    if (appState && typeof appState.touchDailyStreak === 'function') {
      appState.touchDailyStreak(reason);
    }
  } catch (_) {}
}

// ────────────────────────────────
// PERCENT-OF
// ────────────────────────────────
registerIntent({
  key: 'percent_of',
  // Strong pattern — only fires when a real "% of" phrase is present
  tests: [ M.regex(/-?\d+(?:\.\d+)?\s*%\s*of\s*-?\d+(?:\.\d+)?/i) ],
  base: 0.0,
  handler: ({ text }) => {
    const p = tryPercentOf(text);
    if (!p) {
      // Defensive: if someone sneaks past the test, teach instead of crashing
      return composeReply({ userText: text, part: teach('percent') });
    }
    const clean = Number.isInteger(p.ans) ? p.ans : Number(p.ans.toFixed(4));
    bumpStreak('percent');
    return composeReply({
      userText: text,
      part: answer(`${p.p}% of ${p.n} = <strong>${clean}</strong>`)
    });
  }
});

// ────────────────────────────────
// CALCULATOR (safe expression)
// ────────────────────────────────
registerIntent({
  key: 'calc',
  tests: [ M.predicate((t)=> SAFE_EXPR.test(t), 0.9) ],
  base: 0.0,
  handler: ({ text }) => {
    try {
      const v = evalSafeExpression(text);
      const clean = Number.isInteger(v) ? v : Number(v.toFixed(6));
      bumpStreak('calc');
      return composeReply({
        userText:text,
        part: answer(`${esc(text)} = <strong>${clean}</strong>`)
      });
    } catch (e) {
      return composeReply({
        userText:text,
        part: answer(`Brain freeze: ${esc(e.message)}.`),
        askAllowed:false
      });
    }
  }
});

// ────────────────────────────────
// SIMPLIFY a/b
// ────────────────────────────────
registerIntent({
  key: 'simplify_fraction',
  tests: [ M.regex(/^simplify\s+(-?\d+)\s*\/\s*(-?\d+)\s*$/i) ],
  base: 0.0,
  handler: ({ text }) => {
    const m = /^simplify\s+(-?\d+)\s*\/\s*(-?\d+)\s*$/i.exec(text);
    if (!m) return composeReply({ userText:text, part: teach('fractions') });
    const a = parseInt(m[1],10), b=parseInt(m[2],10);
    bumpStreak('simplify');
    return composeReply({
      userText:text,
      part: answer(esc(simplifyFractionText(a,b)))
    });
  }
});

// ────────────────────────────────
// GCF a b
// ────────────────────────────────
registerIntent({
  key: 'gcf',
  tests: [ M.regex(/^gcf\s+(-?\d+)\s+(-?\d+)\s*$/i) ],
  base: 0.0,
  handler: ({ text }) => {
    const m=/^gcf\s+(-?\d+)\s+(-?\d+)\s*$/i.exec(text);
    if (!m) return composeReply({ userText:text, part: teach('arithmetic') });
    const a=parseInt(m[1],10), b=parseInt(m[2],10);
    bumpStreak('gcf');
    return composeReply({
      userText:text,
      part: answer(`gcf(${a}, ${b}) = ${gcd(a,b)}`)
    });
  }
});

// ────────────────────────────────
// LCM a b
// ────────────────────────────────
registerIntent({
  key: 'lcm',
  tests: [ M.regex(/^lcm\s+(-?\d+)\s+(-?\d+)\s*$/i) ],
  base: 0.0,
  handler: ({ text }) => {
    const m=/^lcm\s+(-?\d+)\s+(-?\d+)\s*$/i.exec(text);
    if (!m) return composeReply({ userText:text, part: teach('arithmetic') });
    const a=parseInt(m[1],10), b=parseInt(m[2],10);
    bumpStreak('lcm');
    return composeReply({
      userText:text,
      part: answer(`lcm(${a}, ${b}) = ${lcm(a,b)}`)
    });
  }
});

// ────────────────────────────────
// FACTOR n
// ────────────────────────────────
registerIntent({
  key: 'factor',
  tests: [ M.regex(/^factor\s+(-?\d+)\s*$/i) ],
  base: 0.0,
  handler: ({ text }) => {
    const m=/^factor\s+(-?\d+)\s*$/i.exec(text);
    if (!m) return composeReply({ userText:text, part: teach('arithmetic') });
    const n=Math.abs(parseInt(m[1],10));
    if(n===0) {
      bumpStreak('factor');
      return composeReply({ userText:text, part: answer("Every number divides 0. Kinda wild.") });
    }
    const out=[];
    for(let i=1;i*i<=n;i++){
      if(n%i===0){
        out.push(i);
        if(i!==n/i) out.push(n/i);
      }
    }
    out.sort((a,b)=>a-b);
    bumpStreak('factor');
    return composeReply({
      userText:text,
      part: answer(`Factors of ${n}: ${out.join(', ')}`)
    });
  }
});
// ——— helper: decimal/percent → simplified fraction ———
function decimalToFractionString(numStr) {
  const s = String(numStr).trim();
  const isPercent = /%$/.test(s);
  const core = isPercent ? s.replace(/%$/,'') : s;

  const neg = core.startsWith('-');
  const coreAbs = neg ? core.slice(1) : core;

  // guard
  if (!/^\d+(\.\d+)?$/.test(coreAbs)) throw new Error('Bad number');

  // build numerator/denominator
  let num, den;
  if (coreAbs.includes('.')) {
    const [a,b] = coreAbs.split('.');
    den = 10 ** b.length;
    num = Number(a) * den + Number(b);
  } else {
    num = Number(coreAbs);
    den = 1;
  }

  if (isPercent) { num = num; den = den * 100; }
  if (num === 0) return '0/1';

  // simplify
  const g = gcd(Math.abs(num), den);
  const nSimple = (neg ? -num : num) / g;
  const dSimple = den / g;
  return `${nSimple}/${dSimple}`;
}

// ——— intent: “as/to fraction” ———
registerIntent({
  key: 'to_fraction',
  tests: [
    M.regex(/^(-?\d+(?:\.\d+)?)\s*(?:as|to)\s*fraction\s*$/i),
    M.regex(/^(?:as|to)\s*fraction\s+(-?\d+(?:\.\d+)?)\s*$/i),
    M.regex(/^(-?\d+(?:\.\d+)?)\s*%\s*(?:as|to)\s*fraction\s*$/i),
  ],
  base: 0.0,
  handler: ({ text }) => {
    // pull the number (with optional %) from any of the supported forms
    const m = text.match(/-?\d+(?:\.\d+)?%?/);
    if (!m) return composeReply({ userText:text, part: { kind:'teach', topicGuess: 'fractions' } });

    try {
      const frac = decimalToFractionString(m[0]);
      try { appState.touchDailyStreak('to_fraction'); } catch {}
      return composeReply({
        userText: text,
        part: { kind:'answer', html: `${m[0]} → <strong>${frac}</strong>` }
      });
    } catch (e) {
      return composeReply({
        userText: text,
        part: { kind:'answer', html: `Brain freeze: ${String(e.message)}.` },
        askAllowed: false
      });
    }
  }
});
// ——— helper: parse "a/b" into numbers ———
function parseFractionPair(s) {
  const m = String(s).trim().match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
  if (!m) return null;
  const a = parseInt(m[1], 10);
  const b = parseInt(m[2], 10);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
  return [a, b];
}


// ——— intent: “as/to decimal” ———
registerIntent({
  key: 'to_decimal',
  tests: [
    // "3/8 as decimal", "30% as decimal", "1.25 as decimal"
    M.regex(/^(-?\d+(?:\.\d+)?%?|\d+\s*\/\s*\d+)\s*(?:as|to)\s*decimal\s*$/i),
    // "as decimal 3/8", "as decimal 30%"
    M.regex(/^(?:as|to)\s*decimal\s+(-?\d+(?:\.\d+)?%?|\d+\s*\/\s*\d+)\s*$/i),
  ],
  base: 0.0,
  handler: ({ text }) => {
    const raw = String(text).trim();
    const m = raw.match(/(-?\d+(?:\.\d+)?%?|\d+\s*\/\s*\d+)/);
    if (!m) {
      return composeReply({ userText: text, part: { kind: 'teach', topicGuess: 'fractions' }, noAck: true });
    }

    const token = m[1].replace(/\s+/g, '');
    let dec = null;

    // fraction "a/b"
    const frac = parseFractionPair(token);
    if (frac) {
      dec = frac[0] / frac[1];
    } else if (/^-?\d+(\.\d+)?%$/.test(token)) {
      // percent "x%"
      const p = parseFloat(token.replace('%', ''));
      dec = p / 100;
    } else if (/^-?\d+(\.\d+)?$/.test(token)) {
      // already a decimal number
      dec = parseFloat(token);
    } else {
      return composeReply({ userText: text, part: { kind: 'teach', topicGuess: 'fractions' }, noAck: true });
    }

    const out = fmt6(dec, 6);
    try { appState.touchDailyStreak('to_decimal'); } catch {}

    return composeReply({
      userText: text,
      part: { kind: 'answer', html: `${esc(token)} → <strong>${out}</strong>` },
      noAck: true
    });
  }
});
// ── helpers: sqrt compute + formatting ───────────────────────────────────────

// ⬆️ near the top of math.pack.js, after imports:

// one formatter to rule them all
function fmt6(x, places = 6) {
  if (!Number.isFinite(x)) return String(x);
  const s = x.toFixed(places);
  return s.replace(/\.?0+$/, '');
}


function sqrtAnswer(n) {
  const x = Number(n);
  if (!Number.isFinite(x) || x < 0) throw new Error('Non-negative only here.');
  const r = Math.sqrt(x);
  const k = Math.round(r);
  return (k * k === x) ? String(k) : `≈ ${fmt6(r, 6)}`;
}

// ── intent: sqrt / square root / √ ───────────────────────────────────────────
registerIntent({
  key: 'sqrt_compute',
  base: 0.0,
  tests: [
    M.regex(/^sqrt\s+(-?\d+(?:\.\d+)?)\s*$/i),
    M.regex(/^square\s*root\s*(?:of\s*)?(-?\d+(?:\.\d+)?)\s*$/i),
    M.regex(/^√\s*(-?\d+(?:\.\d+)?)\s*$/) // literal root symbol
  ],
  handler: ({ text }) => {
    const m = text.match(/(-?\d+(?:\.\d+)?)/);
    if (!m) {
      return composeReply({
        userText: text,
        part: { kind: 'teach', topicGuess: 'roots' },
        noAck: true
      });
    }
    try {
      const out = sqrtAnswer(m[1]);
      try { appState.touchDailyStreak?.('sqrt'); } catch {}
      return composeReply({
        userText: text,
        part: { kind: 'answer', html: `√${m[1]} = <strong>${out}</strong>` },
        noAck: true
      });
    } catch (e) {
      return composeReply({
        userText: text,
        part: { kind: 'answer', html: `brain freeze: ${String(e.message)}` },
        noAck: true
      });
    }
  }
});
// Pretty formatter: show both improper and mixed (when meaningful)
function prettyFracBoth(fr) {
  const imp = toSimpleString(fr);
  const mixed = toMixedString(fr);
  return (imp === mixed) ? `<strong>${imp}</strong>` : `<strong>${imp}</strong> (<em>${mixed}</em>)`;
}

// ---- Phrase maps for ops -----------------------------------------------------
const PLUS_WORDS  = ['plus','add','and','sum'];
const MINUS_WORDS = ['minus','subtract','less'];
const TIMES_WORDS = ['times','multiplied by','multiply','x','*'];
const DIV_WORDS   = ['divided by','over','÷','/','divide'];

// Build loose regex for “a/b <word> c/d” and natural text like “what is ...”
function opRegex(words){
  const w = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
  // capture any number-ish token (mixed, fraction, decimal, percent)
  const NUM = '([\\d\\s]+\\/[\\d\\s]+|\\d+\\s+\\d+\\s*\\/\\s*\\d+|-?\\d+(?:\\.\\d+)?%?)';
  return new RegExp(`(?:what\\s+is\\s+|calc\\s+|compute\\s+)?${NUM}\\s+(?:${w})\\s+${NUM}`, 'i');
}

// Unified handler factory
function handleOpFactory(kind) {
  const re = kind === 'add'    ? opRegex(PLUS_WORDS)
          : kind === 'sub'    ? opRegex(MINUS_WORDS)
          : kind === 'mul'    ? opRegex(TIMES_WORDS)
          :                       opRegex(DIV_WORDS);

  const op = kind === 'add' ? addFrac
          : kind === 'sub' ? subFrac
          : kind === 'mul' ? mulFrac
          :                  divFrac;

  return ({ text }) => {
    const m = text.match(re);
    if (!m) return composeReply({ userText: text, part: teach('fractions') });
    try {
      const a = parseLooseFraction(m[1]);
      const b = parseLooseFraction(m[2]);
      const out = op(a, b);
      const lhs = `${toSimpleString(a)} ${kind==='add'?'+':kind==='sub'?'-':kind==='mul'?'×':'÷'} ${toSimpleString(b)}`;
      return composeReply({
        userText: text,
        part: answer(`${lhs} = ${prettyFracBoth(out)}`)
      });
    } catch (e) {
      return composeReply({ userText: text, part: answer(`Brain freeze: ${String(e.message)}.`), askAllowed:false });
    }
  };
}

// Register four ops with loose language
registerIntent({ key: 'frac_add', tests: [ M.predicate(t=>opRegex(PLUS_WORDS).test(t), 0.9) ], base: 0.0, handler: handleOpFactory('add') });
registerIntent({ key: 'frac_sub',  tests: [ M.predicate(t=>opRegex(MINUS_WORDS).test(t),0.9) ], base: 0.0, handler: handleOpFactory('sub') });
registerIntent({ key: 'frac_mul',  tests: [ M.predicate(t=>opRegex(TIMES_WORDS).test(t),0.9) ], base: 0.0, handler: handleOpFactory('mul') });
registerIntent({ key: 'frac_div',  tests: [ M.predicate(t=>opRegex(DIV_WORDS).test(t), 0.9) ], base: 0.0, handler: handleOpFactory('div') });

// ---- “X of Y” (scaling/portion) e.g., "1/2 of 2/3 cup" ----------------------
registerIntent({
  key: 'frac_of',
  tests: [ M.regex(/(-?\d+(?:\.\d+)?%?|\d+\s+\d+\s*\/\s*\d+|\d+\s*\/\s*\d+)\s+of\s+(-?\d+(?:\.\d+)?%?|\d+\s+\d+\s*\/\s*\d+|\d+\s*\/\s*\d+)(?:\s+([a-z]+))?/i) ],
  base: 0.0,
  handler: ({ text }) => {
    const m = text.match(/(-?\d+(?:\.\d+)?%?|\d+\s+\d+\s*\/\s*\d+|\d+\s*\/\s*\d+)\s+of\s+(-?\d+(?:\.\d+)?%?|\d+\s+\d+\s*\/\s*\d+|\d+\s*\/\s*\d+)(?:\s+([a-z]+))?/i);
    if (!m) return composeReply({ userText:text, part: teach('fractions') });
    try {
      const a = parseLooseFraction(m[1]); // portion
      const b = parseLooseFraction(m[2]); // base
      const unit = (m[3] || '').trim();
      const out = mulFrac(a, b);
      const lhs = `${toSimpleString(a)} of ${toSimpleString(b)}${unit ? ' '+unit : ''}`;
      return composeReply({ userText:text, part: answer(`${lhs} = ${prettyFracBoth(out)}${unit ? ' '+unit : ''}`) });
    } catch(e) {
      return composeReply({ userText:text, part: answer(`Brain freeze: ${String(e.message)}.`), askAllowed:false });
    }
  }
});

// ---- Improper ↔ Mixed --------------------------------------------------------
registerIntent({
  key: 'to_mixed',
  tests: [
    M.regex(/(?:to|as)\s+mixed\s+(-?\d+\s*\/\s*\d+)\s*$/i),
    M.regex(/^mixed\s+(-?\d+\s*\/\s*\d+)\s*$/i)
  ],
  base: 0.0,
  handler: ({ text }) => {
    const m = text.match(/-?\d+\s*\/\s*\d+/);
    if (!m) return composeReply({ userText:text, part: teach('fractions') });
    try {
      const f = parseLooseFraction(m[0]);
      return composeReply({ userText:text, part: answer(`${toSimpleString(f)} → <strong>${toMixedString(f)}</strong>`) });
    } catch(e) {
      return composeReply({ userText:text, part: answer(`Brain freeze: ${String(e.message)}.`), askAllowed:false });
    }
  }
});

registerIntent({
  key: 'to_improper',
  tests: [
    // "to improper 2 3/4", "improper of 1 1/2"
    M.regex(/(?:to|as)\s+improper\s+(-?\d+\s+\d+\s*\/\s*\d+)\s*$/i),
    M.regex(/^improper\s+(?:of\s+)?(-?\d+\s+\d+\s*\/\s*\d+)\s*$/i)
  ],
  base: 0.0,
  handler: ({ text }) => {
    const m = text.match(/-?\d+\s+\d+\s*\/\s*\d+/);
    if (!m) return composeReply({ userText:text, part: teach('fractions') });
    try {
      const f = parseLooseFraction(m[0]); // parser already returns improper form internally
      return composeReply({ userText:text, part: answer(`${m[0]} → <strong>${toSimpleString(f)}</strong>`) });
    } catch(e) {
      return composeReply({ userText:text, part: answer(`Brain freeze: ${String(e.message)}.`), askAllowed:false });
    }
  }
});

// ---- Compare & Order ---------------------------------------------------------
registerIntent({
  key: 'frac_compare',
  tests: [
    M.regex(/(which|what)\s+(?:is|one\s+is)\s+(?:bigger|greater|larger)\b/i),
    M.regex(/compare\s+[-\s\d/%.,]+/i)
  ],
  base: 0.0,
  handler: ({ text }) => {
    // pull two tokens (fractions/decimals/percents/integers)
    const nums = Array.from(text.matchAll(/-?\d+(?:\.\d+)?%?|\d+\s+\d+\s*\/\s*\d+|\d+\s*\/\s*\d+/g)).map(m=>m[0]);
    if (nums.length < 2) return composeReply({ userText:text, part: teach('fractions') });
    try {
      const a = parseLooseFraction(nums[0]);
      const b = parseLooseFraction(nums[1]);
      const cmp = a.n * b.d - b.n * a.d;
      const A = toSimpleString(a), B = toSimpleString(b);
      const msg = cmp === 0 ? `${A} = ${B}` : (cmp > 0 ? `${A} > ${B}` : `${A} < ${B}`);
      return composeReply({ userText:text, part: answer(`<strong>${msg}</strong>`) });
    } catch(e) {
      return composeReply({ userText:text, part: answer(`Brain freeze: ${String(e.message)}.`), askAllowed:false });
    }
  }
});

registerIntent({
  key: 'frac_order',
  tests: [ M.regex(/^order\s+(.+)$/i), M.regex(/sort\s+these\s+(.+)$/i) ],
  base: 0.0,
  handler: ({ text }) => {
    // collect all number-ish tokens
    const tokens = Array.from(text.matchAll(/-?\d+(?:\.\d+)?%?|\d+\s+\d+\s*\/\s*\d+|\d+\s*\/\s*\d+/g)).map(m=>m[0]);
    if (tokens.length < 2) return composeReply({ userText:text, part: teach('fractions') });
    try {
      const frs = tokens.map(t => ({ t, f: parseLooseFraction(t) }));
      frs.sort((A,B) => (A.f.n * B.f.d) - (B.f.n * A.f.d));
      const out = frs.map(({f}) => toSimpleString(f)).join(' < ');
      return composeReply({ userText:text, part: answer(`<strong>${out}</strong>`) });
    } catch(e) {
      return composeReply({ userText:text, part: answer(`Brain freeze: ${String(e.message)}.`), askAllowed:false });
    }
  }
});