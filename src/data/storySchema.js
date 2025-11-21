// /src/modes/storyMode/data/storySchema.js

export const SlideRole = {
  ADVANCE:  'advance',
  LOOP:     'loop',
  QUEST:    'quest',
  WEIRD:    'weird',
  CUSTOMER: 'customer',
  ENDINGS:  'endings',   // 👈 new
  EPILOGUE: 'epilogue',  // 👈 new
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

  // 👇 NEW: Dino trade item in Chapter 3
  BEATUP_PHONE: 'beatup_phone',
};


export const ITEM_DISPLAY = Object.freeze({
  [ItemIds.WORK_BADGE]:      { name: 'Work Badge',       emoji: '🪪' },
  [ItemIds.CIRCLE_SHARD]:    { name: 'MoonChain',        emoji: '⚪' },
  [ItemIds.TRIANGLE_SHARD]:  { name: 'Triangle Shard',   emoji: '🔺' },
  [ItemIds.SQUARE_SHARD]:    { name: 'MintSquare',       emoji: '🟩' },
  [ItemIds.MASTER_SIGIL]:    { name: 'Perfect SnowCone', emoji: '🍧' },

  // 🔁 Chapter 2 tokens → tangible objects
  [ItemIds.BANNEKER_TOKEN]:   { name: 'Wooden Time Piece', emoji: '🕰️' },
  [ItemIds.NOETHER_TOKEN]:    { name: 'Flashlight',        emoji: '🔦' },
  [ItemIds.ARCHIMEDES_TOKEN]: { name: 'Bottle of Water',   emoji: '💧' },
  [ItemIds.PACIOLI_TOKEN]:    { name: "Jehnk's Ledger",    emoji: '📒' },

  // 👇 NEW: Dino’s trade item
  [ItemIds.BEATUP_PHONE]:    { name: 'Beat-Up Phone',     emoji: '📱' },
});



export const CURRENCY_NAME = 'Cone Coins'; // TODO: rename to your canon anytime

export const Currency = {
  key: 'scrip',
  label: CURRENCY_NAME,
  // gentle guidance: 25–100 for smalls, 500 for a chapter finish, 2000 threshold used in Ch5 endings
  award: (amount, appState) => { try { appState.addCurrency(amount); } catch {} },
};
