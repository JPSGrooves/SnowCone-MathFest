// /src/modes/storyMode/data/storySchema.js

export const SlideRole = {
  ADVANCE: 'advance', // top choice advances to next main slide
  LOOP: 'loop',       // flavor scene, then returns to the same slide hub
  QUEST: 'quest',     // 2–3 micro-steps, awards an item, returns to hub
  WEIRD: 'weird',     // funny tangent, dead end, returns to hub
  CUSTOMER: 'customer', // 👈 NEW: multi-step “customer” runner (Bio → Lore → Puzzle → Serve)
};

// /src/modes/storyMode/data/storySchema.js

export const ItemIds = {
  TRIANGLE_SHARD: 'tri_shard',
  SQUARE_SHARD:   'sq_shard',
  CIRCLE_SHARD:   'cir_shard',
  MASTER_SIGIL:   'master_sigil',
  WORK_BADGE:     'work_badge',

  // Chapter 2 tokens
  BANNEKER_TOKEN:   'tok_banneker',
  NOETHER_TOKEN:    'tok_noether',
  ARCHIMEDES_TOKEN: 'tok_archimedes',
  PACIOLI_TOKEN:    'tok_pacioli',
};

// keep existing entries; replace just the Chapter 2 section in ITEM_DISPLAY:
export const ITEM_DISPLAY = Object.freeze({
  [ItemIds.WORK_BADGE]:      { name: 'Work Badge',       emoji: '🪪' },
  [ItemIds.CIRCLE_SHARD]:    { name: 'MoonChain',        emoji: '⚪' },
  [ItemIds.TRIANGLE_SHARD]:  { name: 'Triangle Shard',   emoji: '🔺' },
  [ItemIds.SQUARE_SHARD]:    { name: 'MintSquare',       emoji: '🟩' },
  [ItemIds.MASTER_SIGIL]:    { name: 'Perfect SnowCone', emoji: '🍧' },

  // 🔁 REDONE: Chapter 2 tokens → tangible objects
  [ItemIds.BANNEKER_TOKEN]:   { name: 'Wooden Time Piece', emoji: '🕰️' },
  [ItemIds.NOETHER_TOKEN]:    { name: 'Flashlight',        emoji: '🔦' },
  [ItemIds.ARCHIMEDES_TOKEN]: { name: 'Bottle of Water',   emoji: '💧' },
  [ItemIds.PACIOLI_TOKEN]:    { name: "Jehnk's Ledger",    emoji: '📒' },
});


export const CURRENCY_NAME = 'Cone Coins'; // TODO: rename to your canon anytime

export const Currency = {
  key: 'scrip',
  label: CURRENCY_NAME,
  // gentle guidance: 25–100 for smalls, 500 for a chapter finish, 2000 threshold used in Ch5 endings
  award: (amount, appState) => { try { appState.addCurrency(amount); } catch {} },
};
