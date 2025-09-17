// /src/modes/mathTips/modes/calc.js
// Minimal calc “room” handler with friendly replies.
// Exposes a named export `handleCalc` so the router can import it.
//
// Notes:
// - wraps simple fractions like `1/2` so `1/2 / 1/2` → (1/2)/(1/2) = 1
// - supports `sqrt 5 * sqrt 7` → uses Math.sqrt()
// - shows a small, friendly line with the computed result

import { composeReply } from '../conversationPolicy.js';

/** Short usage blurb shown when we can't parse the input. */
export function help() {
  return (
    'calculator takes straight math: `7*8+12` → 68 • `(30-12)/3` → 6 • ' +
    '`.5 * 1/7` → 0.071428… roots work too: `sqrt 5 * sqrt 7` ' +
    'say `exit` to leave.'
  );
}

/** Random tiny phrase to keep things breezy. */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Format a number for display (trim long decimals, add ellipsis if lengthy). */
function formatNumber(x) {
  if (!isFinite(x)) return String(x);

  // If it's an integer, just show it.
  if (Math.abs(x - Math.round(x)) < 1e-12) return String(Math.round(x));

  // Prefer a plain decimal when possible.
  let s = String(x);

  // Handle scientific notation by rounding to 6 sig figs.
  if (/e/i.test(s)) {
    return Number(x.toPrecision(6)).toString();
  }

  const [intPart, frac = ''] = s.split('.');
  if (frac.length > 6) {
    return `${intPart}.${frac.slice(0, 6)}…`;
  }
  // Otherwise round to 6 decimals and trim trailing zeros.
  const rounded = Number(x.toFixed(6)).toString();
  return rounded;
}

/** Turn friendly text like "sqrt 5 * sqrt 7" into safe JS we can eval. */
function normalizeExpression(input) {
  let expr = String(input || '').trim();

  // caret to exponent
  expr = expr.replace(/\^/g, '**');

  // Support "sqrt 9" or "sqrt(9)" → Math.sqrt(9)
  expr = expr.replace(/sqrt\s*\(?\s*([0-9]*\.?[0-9]+)\s*\)?/gi, (_m, n) => `Math.sqrt(${n})`);

  // Wrap simple standalone fractions a/b as (a/b) so "1/2 / 1/2" → (1/2)/(1/2)
  // We avoid touching things like "1/2a" or "a1/2".
  expr = expr.replace(
    /(?<![\w.)])(\d*\.?\d+)\s*\/\s*(\d*\.?\d+)(?![\w.(])/g,
    '($1/$2)'
  );

  // Remove any characters that aren't part of a math expression we recognize.
  // (This is a light sanity check; real security boundary is your app environment.)
  if (/[^0-9.+\-*/()%\sMacthriSQO\[\]\.^]/i.test(expr)) {
    // fall back to help if weird stuff appears
    throw new Error('unsupported chars');
  }

  return expr;
}

/** Evaluate using a tiny, Math-only sandbox. */
function safeEval(expr) {
  // Only expose Math to the expression.
  // eslint-disable-next-line no-new-func
  const fn = new Function('Math', `return (${expr});`);
  return fn(Math);
}

/** Main handler */
export function handle(input, ctx = {}) {
  try {
    const normalized = normalizeExpression(input);
    const value = safeEval(normalized);

    if (!isFinite(value)) throw new Error('NaN');

    const shown = formatNumber(value);
    const left = String(input || '').replace(/\s+/g, ' ').trim();

    const pre = pick(['alright, friend.', 'cool breeze.', "we’re here. roll on —", 'i hear ya.']);
    const post = pick(['feel like one more?…', 'one more pass?…', 'take another lap?…']);

    // Keep the simple "= <strong>…</strong>" pattern for tests and UI
    const line = `${left} = <strong>${shown}</strong>`;
    return composeReply(`${pre} ${line} ${post}`);
  } catch {
    return composeReply(help());
  }
}


// (optional) default, in case someone imports the whole module directly
export default handle;
// /src/modes/mathTips/modes/calc.js
// Single, eager handler: if the text looks even vaguely like math, compute it.

function calcHelp() {
  return "calculator takes straight math: `7*8+12` → 68 • `(30-12)/3` → 6 • `.5 * 1/7` → 0.071428… roots work too: `sqrt 5 * sqrt 7` say `exit` to leave.";
}

export function handleCalc(input, app) {
  const raw = String(input ?? "").trim();

  // Help / empty → show quick help
  if (!raw || /^help$|^menu$|^calc$/i.test(raw)) {
    return app.reply(calcHelp());
  }

  // If it looks like math at all, try to evaluate.
  if (!/[0-9]|sqrt|[%()+\-*/]/i.test(raw)) {
    return app.reply(calcHelp());
  }

  // Build an evaluable JS expression safely.
  let expr = raw;

  // percent-of: "15% of 80" → "(15/100)*80"
  expr = expr.replace(
    /(\d+(?:\.\d+)?)\s*%\s*(?:of|×|x|\*)\s*(\d+(?:\.\d+)?)/gi,
    "($1/100)*$2"
  );

  // sqrt forms: "sqrt 5", "sqrt(5)" → "Math.sqrt(5)"
  expr = expr
    .replace(/\bsqrt\s*\(\s*([^)]+)\s*\)/gi, "Math.sqrt($1)")
    .replace(/\bsqrt\s+([\-.\d]+)/gi, "Math.sqrt($1)");

  // Wrap bare fractions a/b in parentheses to preserve precedence.
  // Avoid already-wrapped or function args: do not match "...)/..."
  expr = expr.replace(
    /(?<![)\d])(\d+)\s*\/\s*(\d+)(?!\s*[\d/])/g,
    "($1/$2)"
  );

  // Disallow any identifiers other than Math.
  const letters = expr.replace(/Math\./g, "");
  if (/[A-Za-z_$]/.test(letters)) {
    return app.reply(calcHelp());
  }

  let value;
  try {
    // eslint-disable-next-line no-new-func
    value = Function(`"use strict"; return (${expr});`)();
  } catch {
    return app.reply(calcHelp());
  }
  if (typeof value !== "number" || !isFinite(value)) {
    return app.reply(calcHelp());
  }

  const pretty = Number.isInteger(value)
    ? String(value)
    : Number(value.toFixed(6))
        .toString();

  // Expected by tests: show the original and a bold/strong result.
  return app.reply(`${raw} = <strong>${pretty}</strong>`);
}
