// storySchema.js
export const SlideRole = {
  ADVANCE: 'advance', // top choice advances to next main slide
  LOOP: 'loop',       // flavor scene, then returns to the same slide hub
  QUEST: 'quest',     // 2–3 micro-steps, awards an item, returns to hub
  WEIRD: 'weird',     // funny tangent, dead end, returns to hub
};

export const ItemIds = {
  TRIANGLE_SHARD: 'tri_shard',
  SQUARE_SHARD: 'sq_shard',
  CIRCLE_SHARD: 'cir_shard',
  MASTER_SIGIL: 'master_sigil', // forged on Slide 5 if all 3 shards held
  WORK_BADGE: 'work_badge',
};

export const CURRENCY_NAME = 'Cone Coins'; // TODO: rename to your canon anytime

export const Currency = {
  key: 'scrip',
  label: CURRENCY_NAME,
  // gentle guidance: 25–100 for smalls, 500 for a chapter finish, 2000 threshold used in Ch5 endings
  award: (amount, appState) => { try { appState.addCurrency(amount); } catch {} },
};
