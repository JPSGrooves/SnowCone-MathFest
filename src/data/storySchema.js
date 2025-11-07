// /src/modes/storyMode/data/storySchema.js

export const SlideRole = {
  ADVANCE: 'advance', // top choice advances to next main slide
  LOOP: 'loop',       // flavor scene, then returns to the same slide hub
  QUEST: 'quest',     // 2–3 micro-steps, awards an item, returns to hub
  WEIRD: 'weird',     // funny tangent, dead end, returns to hub
  CUSTOMER: 'customer', // 👈 NEW: multi-step “customer” runner (Bio → Lore → Puzzle → Serve)
};

export const ItemIds = {
  TRIANGLE_SHARD: 'tri_shard',
  SQUARE_SHARD:   'sq_shard',
  CIRCLE_SHARD:   'cir_shard',
  MASTER_SIGIL:   'master_sigil',
  WORK_BADGE:     'work_badge',

  // NEW: Chapter 2 tokens
  BANNEKER_TOKEN:   'tok_banneker',
  NOETHER_TOKEN:    'tok_noether',
  ARCHIMEDES_TOKEN: 'tok_archimedes',
  PACIOLI_TOKEN:    'tok_pacioli',
};

// keep your existing ITEM_DISPLAY; append friendly names for the new tokens:
export const ITEM_DISPLAY = Object.freeze({
  [ItemIds.WORK_BADGE]:      { name: 'Work Badge',       emoji: '🪪' },
  [ItemIds.CIRCLE_SHARD]:    { name: 'MoonChain',        emoji: '⚪' },
  [ItemIds.TRIANGLE_SHARD]:  { name: 'Triangle Shard',   emoji: '🔺' },
  [ItemIds.SQUARE_SHARD]:    { name: 'MintSquare',       emoji: '🟩' },
  [ItemIds.MASTER_SIGIL]:    { name: 'Perfect SnowCone', emoji: '🍧' },

  // NEW: Chapter 2 tokens
  [ItemIds.BANNEKER_TOKEN]:   { name: 'Banneker Token',   emoji: '🎫' },
  [ItemIds.NOETHER_TOKEN]:    { name: 'Noether Token',    emoji: '🎫' },
  [ItemIds.ARCHIMEDES_TOKEN]: { name: 'Archimedes Token', emoji: '🎫' },
  [ItemIds.PACIOLI_TOKEN]:    { name: 'Pacioli Token',    emoji: '🎫' },
});

export const CURRENCY_NAME = 'Cone Coins'; // TODO: rename to your canon anytime

export const Currency = {
  key: 'scrip',
  label: CURRENCY_NAME,
  // gentle guidance: 25–100 for smalls, 500 for a chapter finish, 2000 threshold used in Ch5 endings
  award: (amount, appState) => { try { appState.addCurrency(amount); } catch {} },
};
