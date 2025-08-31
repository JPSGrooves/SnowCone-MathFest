// /src/modes/mathTips/packs/math.pack.js
// Math intents (percent-of, calc, simplify, gcf, lcm, factor)
// - test-gated: intent only wins when regex/guards match
// - single-bubble replies via composeReply
// - bumps daily streak on successful solves (safe-guarded)

import { registerIntent, M } from '../intentEngine.js';
import { composeReply } from '../conversationPolicy.js';
import { SAFE_EXPR, evalSafeExpression, tryPercentOf, simplifyFractionText, gcd, lcm } from '../mathSafe.js';
import { appState } from '../../../data/appState.js';

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
