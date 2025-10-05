// /src/modes/mathTips/modes/_kit.js
// Purpose: shared helpers for booth loops, cooldowns, caps, and per-session state.
// No globals: each booth creates its own store via makeSession().

const DEFAULTS = {
  capMin: 3,
  capMax: 4,
  cooldownMs: 450,   // blocks accidental double-send taps
};

export function makeSession(opts = {}) {
  const cfg = { ...DEFAULTS, ...opts };
  let turns = 0;
  let lastAt = 0;
  let lastText = '';

  return {
    shouldBlock(text) {
      const now = Date.now();
      if ((now - lastAt) < cfg.cooldownMs) return true;     // debounce
      if (text && lastText && text.trim() === lastText.trim()) return true; // duplicate text
      lastAt = now; lastText = String(text||'');
      return false;
    },
    bump() { turns++; },
    isCapReached() {
      // randomize between min & max to add a little variety
      const cap = cfg.capMax;
      return turns >= cap;
    },
    isNearCap() {
      return turns >= (cfg.capMin - 1);
    },
    reset() { turns = 0; lastAt = 0; lastText = ''; },
    count() { return turns; },
  };
}

// Lightweight “yes/no” read for “want another?”
// returns "yes" | "no" | null
// _kit.js
// /src/modes/mathTips/modes/_kit.js
export function readAffirmative(s = '') {
  const t = String(s).trim().toLowerCase();

  // broader yes slang
  const YES = /\b(yes|yeah|yea|yep|yup|sure|ok|okay|alright|bet|yessir|mhmm|mhm|absolutely|for sure|do it|go|next|whatever|why not|whateva|right on|more)\b/;

  // polite/soft no
  const NO = /\b(no|nope|nah|not now|maybe later|not really|no thanks|pass)\b/;

  if (YES.test(t)) return 'yes';
  if (NO.test(t))  return 'no';
  return null;
}



// A tiny card helper for mode-specific help
export function helpCard(title, bullets = [], foot = '') {
  const items = bullets.map(b => `<li>${b}</li>`).join('');
  return `
    <div class="mt-lecture-card">
      <h3>${title}</h3>
      <ul class="mt-lecture-bullets">${items}</ul>
      ${foot ? `<div class="mt-lecture-foot">${foot}</div>` : ''}
    </div>
  `;
}
