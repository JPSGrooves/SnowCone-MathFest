// /src/modes/mathTips/modes/index.js
// Central registry for all MathTips booths.
// Exports named modules (preferred) AND a default for legacy imports.

import * as lessons from './lessons.js';
import * as quiz from './quiz.js';
import * as lore from './lore.js';
import * as recipes from './recipes.js';
import * as calculator from './calculator.js';
import * as status from './status.js';

// Local registry
const registry = { lessons, quiz, lore, recipes, calculator, status };

/** Map fuzzy/legacy keys to canonical mode ids. */
function canonicalModeKey(k) {
  const t = String(k ?? '').trim().toLowerCase();
  if (!t) return t;

  // already canonical
  if (t in registry) return t;

  // gentle aliases (explicit, no “soft interpreter” creep)
  if (/^lessons(\s+booth)?$/.test(t)) return 'lessons';
  if (/^quiz(\s+booth)?$/.test(t)) return 'quiz';
  if (/^lore(\s+booth)?$/.test(t)) return 'lore';
  if (/^recipes?(\s+booth)?$/.test(t)) return 'recipes';
  if (/^status(\s+booth)?$/.test(t)) return 'status';
  if (/^(calc|calculator)(\s+booth)?$/.test(t)) return 'calculator';

  return t; // unknown stays unknown; caller will get “booth not found”
}

/** Normalize any booth return into `{ html }` for consistent adapters. */
function normalizeResult(res) {
  if (res == null) return { html: '' };
  if (typeof res === 'string') return { html: res };
  if (typeof res === 'object') {
    if ('html' in res) return res;
    if ('text' in res) return { html: String(res.text) };
    if ('body' in res) return { html: String(res.body) };
    try { return { html: String(res) }; } catch { return { html: '' }; }
  }
  return { html: String(res) };
}

// add below normalizeResult(...) in /src/modes/mathTips/modes/index.js

/** Resolve a raw phrase like "status booth" → boot that booth right away.
 *  Returns `{ html }` or `null` if it doesn't match any booth.
 *  Safe: no soft interpreters, just exact booth names + "… booth" aliases.
 */
export function resolveBoothFromPhrase(phrase, ctx = {}) {
  const key = canonicalModeKey(phrase);
  const mod = registry[key];
  if (!mod) return null;

  // Prefer a clean boot (start) so "status booth" doesn't get echoed into handle().
  if (typeof mod.start === 'function') return normalizeResult(mod.start());
  if (typeof mod.handle === 'function') return normalizeResult(mod.handle('', ctx));
  if (typeof mod.run === 'function')    return normalizeResult(mod.run('', ctx));
  return null;
}


/**
 * Helpful router (not required by everyone).
 * Behavior:
 *  - Canonicalize the mode key (accepts “status booth”, etc.).
 *  - If user supplied `text` and booth has `handle()`, call `handle(text, ctx)`.
 *  - Else prefer `start()` (no args) to avoid destructuring hazards.
 *  - Else `run(text, ctx)` → fallback `handle('', ctx)`.
 *  - Always return `{ html }`.
 */
export function callMode(modeKey, text = '', ctx = {}) {
  const key = canonicalModeKey(modeKey);
  const mod = registry[key];
  if (!mod) return { html: `<p>${modeKey} booth not found.</p>` };

  const hasText = typeof text === 'string' ? text.trim().length > 0 : !!text;

  if (hasText && typeof mod.handle === 'function') {
    return normalizeResult(mod.handle(text, ctx));
  }
  if (typeof mod.start === 'function') {
    return normalizeResult(mod.start());
  }
  if (typeof mod.run === 'function') {
    return normalizeResult(mod.run(text, ctx));
  }
  if (typeof mod.handle === 'function') {
    return normalizeResult(mod.handle('', ctx));
  }
  return { html: `<p>${key} booth has no handler.</p>` };
}

// Named exports (best for: `import * as MODEx from './modes/index.js'`)
export { lessons, quiz, lore, recipes, calculator, status };

// Default export for older code that did `import MODEx from ...`
export default { lessons, quiz, lore, recipes, calculator, status, callMode };
