// src/modes/mathTips/phrasebook.js
// Normalize a few commands the router expects.
// Returns: 'help' | 'exit' | `quiz fractions 3` | `quiz percent 3` | null
export function interpret(input) {
  const t = String(input || '').trim().toLowerCase();

  // basic commands
  if (/^\/?help\b/.test(t)) return 'help';
  if (/^\/?(exit|leave|quit)\b/.test(t)) return 'exit';

  // quiz commands: "quiz", "quiz fractions 3", "quiz percent 5", etc.
  const m = /^\/?\s*quiz(?:\s+me|\s+on)?\s*(fractions?|percent)?\s*(\d+)?\s*$/.exec(t);
  if (m) {
    const topic = /percent/.test(m[1] || '') ? 'percent' : 'fractions';
    const count = m[2] ? parseInt(m[2], 10) : 3;
    return `quiz ${topic} ${count}`;
  }

  return null;
}

// (optional) default export if you ever want to import it that way
export default { interpret };
