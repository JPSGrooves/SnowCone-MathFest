// Central registry for all MathTips booths.
// Exports named modules (preferred) AND a default for legacy imports.

import * as lessons from './lessons.js';
import * as quiz from './quiz.js';
import * as lore from './lore.js';
import * as recipes from './recipes.js';
import * as calculator from './calculator.js';
import * as status from './status.js';

// Helpful router (not required by everyone)
export function callMode(modeKey, text, ctx = {}) {
  const registry = { lessons, quiz, lore, recipes, calculator, status };
  const mod = registry[modeKey];
  if (!mod) return { text: `<p>${modeKey} booth not found.</p>` };

  // common entry points, first one that exists wins
  const fn =
    (typeof mod.handle === 'function' && mod.handle) ||
    (typeof mod.run === 'function' && mod.run) ||
    (typeof mod.start === 'function' && mod.start);

  if (!fn) return { text: `<p>${modeKey} booth has no handler.</p>` };
  return fn(text, ctx);
}

// Named exports (best for: `import * as MODEx from './modes/index.js'`)
export { lessons, quiz, lore, recipes, calculator, status };

// Default export for older code that did `import MODEx from ...`
export default { lessons, quiz, lore, recipes, calculator, status, callMode };
