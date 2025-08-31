// /src/modes/mathTips/intentEngine.js
// Pluggable intent registry with scored matchers.
// Each intent: { key, tests[], base, handler }
// A test returns number in [0,1] or boolean (true => 0.6). Best score wins.

import Fuse from 'fuse.js';

const REGISTRY = [];

// ---------- Match helpers ----------
export const M = {
  include(phrases) {
    const arr = phrases.map(s => s.toLowerCase());
    return (input) => arr.some(p => input.includes(p)) ? 0.7 : 0;
  },
  regex(re) {
    return (input) => re.test(input) ? 0.8 : 0;
  },
  fuse(phrases, threshold = 0.35) {
    const f = new Fuse(phrases.map(p => ({ phrase: p })), { threshold, keys: ['phrase'] });
    return (input) => (f.search(input).length > 0 ? 0.6 : 0);
  },
  predicate(fn, score = 0.8) {
    return (input) => (fn(input) ? score : 0);
  }
};

// ---------- Register & Evaluate ----------
export function registerIntent({ key, tests = [], base = 0.4, handler }) {
  REGISTRY.push({ key, tests, base, handler });
}

export function evaluate(inputRaw) {
  const input = String(inputRaw || '').trim().toLowerCase();
  let best = { key: 'unknown', score: 0, handler: null };

  for (const it of REGISTRY) {
    let s = it.base;
    for (const t of it.tests) s = Math.max(s, Number(t(input)) || 0);
    if (s > best.score) best = { key: it.key, score: s, handler: it.handler };
  }
  return best;
}
// 🔎 Dev helper
export function getIntentCount() {
  return REGISTRY.length;
}