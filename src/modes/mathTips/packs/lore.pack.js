// /src/modes/mathTips/packs/lore.pack.js
// 🍧 Lore pack — tiny, punchy one-liners with a nudge.
// Why: keeps real-world lore separate from math so the core math pack stays clean.

import { registerIntent, M } from '../intentEngine.js';
import { composeReply } from '../conversationPolicy.js';
import { appState } from '../../../data/appState.js';

function reply(text, userText) {
  return composeReply({
    userText,
    part: { kind: 'answer', html: text },
    noAck: true
  });
}

// ───────────────────────────────────────────────────────────────────────────────
// Festival
// ───────────────────────────────────────────────────────────────────────────────
registerIntent({
  key: 'lore_festival',
  base: 0.0,
  tests: [
    M.include(['festival', 'mathfest', 'the fest', 'festival story', 'festival history'])
  ],
  handler: ({ text }) => {
    try { appState.touchDailyStreak?.('lore_festival'); } catch {}
    const html = [
      'The Math Festival is part rave, part retreat, all cones.',
      'Music × numbers × neon — learn a trick, earn a badge, grab a cone.'
    ].join(' ');
    return reply(html, text);
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// Cones (general cone lore)
// ───────────────────────────────────────────────────────────────────────────────
registerIntent({
  key: 'lore_cones',
  base: 0.0,
  tests: [
    M.include(['cone', 'cones', 'scoop', 'syrup', 'flavor'])
  ],
  handler: ({ text }) => {
    try { appState.touchDailyStreak?.('lore_cones'); } catch {}
    const html = [
      'Cones are more than dessert — they’re the fractal heart of this place.',
      'Scoop → syrup → crunch. Keep your stacks clean; your mind follows.'
    ].join(' ');
    return reply(html, text);
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// Snowcones (specific)
// ───────────────────────────────────────────────────────────────────────────────
registerIntent({
  key: 'lore_snowcone',
  base: 0.0,
  tests: [
    M.include(['snowcone', 'snowcones'])
  ],
  handler: ({ text }) => {
    try { appState.touchDailyStreak?.('lore_snowcone'); } catch {}
    const html = [
      'Snowcones are the festival’s lifeblood — pure neon syrup energy.',
      'Every cone is a tiny art piece; pick your colorway and vibe.'
    ].join(' ');
    return reply(html, text);
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// Badges / XP
// ───────────────────────────────────────────────────────────────────────────────
registerIntent({
  key: 'lore_badges',
  base: 0.0,
  tests: [
    M.include(['badge', 'badges', 'xp', 'level up', 'achievement', 'achievements'])
  ],
  handler: ({ text }) => {
    try { appState.touchDailyStreak?.('lore_badges'); } catch {}
    const html = [
      'Badges mark the moments you leveled your mind.',
      'Keep practicing; the cones remember.'
    ].join(' ');
    return reply(html, text);
  }
});
