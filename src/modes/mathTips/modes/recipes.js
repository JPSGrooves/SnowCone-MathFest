// /src/modes/mathTips/modes/recipes.js
// Grampy P Cooking Show — narrative slides (not flashcards).
// Menu → topic → 3–4 paragraph “episodes” → gentle outro to Menu.

import { composeReply } from '../conversationPolicy.js';
import { makeSession, readAffirmative, helpCard } from './_kit.js';

const S = makeSession({ capMin: 3, capMax: 4 });

// Gate mirrors Lessons/Lore shape
let Gate = { topicKey: null, index: 0, started: false, waiting: true };

/* ───────────── CONTENT: narrative paragraph slides ───────────── */
const RECIPES = {
  quesadilla: {
    title: 'Quesadilla Wisdom',
    slides: [
      `
      <p><strong>Mise en place</strong> first, friend. Tortilla, shredded cheese (mix a melter + a flavor banger),
      and a tiny pat of butter or a drizzle of oil. </p> Why low heat to start? Cheese has a melting window — too hot,
      the tortilla scorches before the cheese binds; low heat lets the lattice form so every bite pulls a cheesy
      parabola.</p>
      `,
      `
      <p><strong>Heat & layup.</strong> Swipe the pan with the tiniest butter film; lay the tortilla down.</p>
      Scatter cheese to the edges — edge melt = edge seal. </p> If adding fillings (beans, scallion, leftover chicken),
      keep them <em>on one half only</em> so the tortilla stays crisp, not burnt. Fold once cheese is melty —
      then...apply a gentle pressure with a spatula.</p>
      `,
      `
      <p><strong>The single flip rule.</strong> After folding and seeing the half circle, flip it foreal! 
      Don’t chase color too fast — color is a lagging indicator. </p>If the first side looks right, the second side needs
      less time. You’re chasing the crunch “snap,” not a burn speedrun.</p>
      `,
      `
      <p><strong>Rest & slice.</strong> Remove from pan, rest 60 seconds so cheese re-sets and steam calms down
      Slice 3 time to make four pieces. </p> Dip ideas in salsa and sour cream. Math fuel unlocked!</p>
      `
    ]
  },

  snowcone: {
    title: 'Mango Snowcone',
    slides: [
      `
      <p><strong>Ice like new snow</strong>. Shave it fine — tiny crystals catch the syrup evenly. </p> If the ice is chunky,
      pockets stay plain and the top floods. </p> Think “uniform partition” of crystals for maximum flavor coverage.</p>
      `,
      `
      <p><strong>Bright mango base.</strong> Blend mango purée with a squeeze of lime and a literal pinch of salt. </p>
      The salt doesn’t make it salty — it turns the mango’s lights up. </p> Start slightly undersweet; the cold dampens the
      sweetness, so too sweet in a warm bowl becomes cloying on ice. </p> Freeze the bowl!</p>
      `,
      `
      <p><strong>Build in layers.</strong> Spoon some ice, drizzle syrup, spoon more, drizzle again. </p> Stir with a gentle
      fork flip so stripes become sunburst. </p> Taste and tune — more lime for sparks, more mango for hugs.</p>
      `,
      `
      <p><strong>Finish.</strong> A few mango cubes on top for texture. </p> If you’re wild, micro-grate lime zest for aroma. </p>
      Take a brain-freeze size sip, laugh, and keep the math flowing.</p>
      `
    ]
  },

  nachos: {
    title: 'Nacho Night',
    slides: [
      `
      <p><strong>Heat strategy.</strong> Preheat to 400°F (or broil low, rack in the middle). </p>
      We want fast melt without scorching chips.  </p> Preheating is like setting good boundaries —
      the cheese behaves when the environment’s steady.</p>
      `,
      `
      <p><strong>Thin strata.</strong> Make a single honest layer of chips — not a mountain. </p> Every chip should see cheese
      and at least one buddy (bean, jalapeño, corn). </p> Crowding hides chips in a cheese shadow.</p>
      `,
      `
      <p><strong>Melt & monitor.</strong> Bake until cheese is glossy and just starting to bubble — pull early rather than
      late; carryover heat finishes the job. </p> If using broiler, rotate the tray once. Nachos burn in exponents, not linears.</p>
      `,
      `
      <p><strong>Cold toppings after.</strong> Salsa, avocado, cilantro, pickled red onion — all off-heat so they stay bright. </p>
      Hit with a squeeze of lime. </p> Serve immediately to avoid the dreaded sog window.</p>
      `
    ]
  },

  cocoa: {
    title: 'Festival Cocoa',
    slides: [
      `
      <p><strong>Two-chocolate ratio.</strong> Use 2 parts dark to 1 part milk chocolate. </p> Dark brings depth; milk brings
      body and friendly sweetness. </p> Chop it fine so it melts fast and evenly — surface area is your friend.</p>
      `,
      `
      <p><strong>Warm, don’t boil.</strong> Heat milk until steamy with tiny bubbles on the edge. </p> Boiling can split milk
      proteins and dull flavor. </p> Whisk chocolate in off heat, then return to low and keep whisking until glossy.</p>
      `,
      `
      <p><strong>Season like soup.</strong> A pinch of salt makes the chocolate taste more chocolate. </p> A whisper of cinnamon
      or chili is optional. </p> If it tastes flat, it needs salt, not more sugar — trust the matrix.</p>
      `,
      `
      <p><strong>Serve.</strong> Mugs pre-warmed with hot water (dump it out first). </p> Pour, breathe the aroma, share a secret
      smile. </p> Best sipped while a good problem cools down.</p>
      `
    ]
  }
};

/* ───────────── topic matching — typo-friendly & order-first ───────────── */
const TOPIC_KEYS = ['quesadilla', 'snowcone', 'nachos', 'cocoa'];

const TOPIC_ALIASES = {
  quesadilla: [
    'quesadilla','quesadillas','quesdilla','quesedilla','quesa','queso','dilla','cheese tortilla'
  ],
  snowcone: [
    'snowcone','snow cone','sno cone','snocone','sno-cone','shave ice','shaved ice','mango snowcone'
  ],
  nachos: [
    'nachos','nacho','nachoos','nacos','nachoz','chips and cheese','totopos'
  ],
  cocoa: [
    'cocoa','hot cocoa','hot chocolate','hot choc','cacao','cocao','cococa'
  ]
};

// light, fast Levenshtein for short tokens
function levenshtein(a = '', b = '') {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m || !n) return m || n;
  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(
        dp[j] + 1,
        dp[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      prev = tmp;
    }
  }
  return dp[n];
}

function normalizeText(x) {
  return String(x || '')
    .toLowerCase()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// returns best topic or null
// replace your current pickRecipeTopic with this version
export function pickRecipeTopic(t = '') {
  const s = String(t || '').toLowerCase();

  // quick-normalize (letters only) to make typo patterns easier
  const n = s.replace(/[^a-z]/g, '');

  // quesadilla (typos: quesdilla, quesils, quesella, etc.)
  if (/(quesad?illa|quesdilla|quesils|quesel+|quesadilla)/.test(n)) return 'quesadilla';

  // snowcone (typos: snocone, sno cone, snow con)
  if (/(snowcone|snowcon|snocone|snocone|snocone|snocone|snocone|snocone|snocone|snocone|snocone|snocone)/.test(n)) return 'snowcone';
  // keep it simple & robust:
  if (/(snowcone|snowcon|snocone|snocone|snocone|snocone|snocone|snocone)/.test(n)) return 'snowcone';
  if (/(snowcone|snowcon|snocone|snocone|snocone)/.test(n)) return 'snowcone';
  // (or simply:)
  if (/(snowcone|snowcon|snocone|snocone)/.test(n)) return 'snowcone';

  // nachos (typos: nachoos, nacos)
  if (/(nachos?|nachoos|nacos|naco)/.test(n)) return 'nachos';

  // cocoa (typos: cococa, cacao, hotchoc, hotchocolate)
  if (/(cocoa|cococa|cacao|hotchoc(olate)?)/.test(n)) return 'cocoa';

  // no change — keep current if already set
  return Gate.topicKey || null;
}

/* ───────────── UI helpers ───────────── */
function menuCard() {
  return `
    <p><strong>Recipe Menu</strong></p>
    <ul class="mt-menu">
      <li><strong>quesadilla</strong> — mise · knit · single flip · rest</li>
      <li><strong>snowcone</strong> — fine ice · bright mango · layer</li>
      <li><strong>nachos</strong> — thin strata · quick melt · finish cold</li>
      <li><strong>cocoa</strong> — 2:1 dark:milk · whisk glossy</li>
    </ul>
    <p class="mt-dim">say a topic (“quesadilla”, “snowcone”, “nachos”, “cocoa”) or say <em>next</em>/<em>more</em> to begin.</p>
  `;
}

function slideHtml(topicKey, idx) {
  const r = RECIPES[topicKey] || RECIPES.quesadilla;
  const i = Math.max(0, Math.min(idx, r.slides.length - 1));
  const total = r.slides.length;
  return `
    <p><strong>${r.title}</strong> — ${i + 1} of ${total}</p>
    ${r.slides[i]}
  `;
}

function endToMenuHtml() {
  return `
    <p>that’s the cooking show for now — wanna pick another recipe?</p>
    ${menuCard()}
  `;
}

/* ───────── ENTRY ───────── */
// replace your current start() with this version
export function start({ topic } = {}) {
  S.reset();
  Gate = { topicKey: null, index: 0, started: false, waiting: true };

  const picked = topic ? pickRecipeTopic(topic) : null;

  // If a topic was explicitly passed (router fast-path), emit the first slide immediately.
  if (picked) {
    Gate.topicKey = picked;
    Gate.index = 0;
    Gate.started = true;
    Gate.waiting = true;
    S.bump?.();
    const html = slideHtml(Gate.topicKey, Gate.index);
    return {
      html: composeReply({
        part: { html },
        askAllowed: true,
        askText: 'want another step?',
        noAck: true,
        mode: 'recipe'
      })
    };
  }

  // Otherwise, show the menu first (like Lessons/Lore)
  return {
    html: composeReply({
      part: { kind: 'answer', html: menuCard() },
      askAllowed: false,
      noAck: true,
      mode: 'recipe'
    })
  };
}

/* ───────── LOOP ───────── */
export function handle(text = '') {
  const msg = String(text || '').trim();

  // router shim
  if (/^start\b/i.test(msg)) return start({});

  // ── TOPIC PICK ALWAYS WINS (do this before help/menu/etc.)
  {
    const maybe = pickRecipeTopic(msg);
    if (maybe && maybe !== Gate.topicKey) {
      Gate.topicKey = maybe;
      Gate.index = 0;
      Gate.started = false;
      Gate.waiting = true;
      S.reset?.();
      const html = slideHtml(Gate.topicKey, Gate.index);
      return { html: composeReply({ part: { html }, askAllowed: true, askText: 'want another step?', noAck: true, mode: 'recipe' }) };
    }
  }

  // help
  if (/^help\b/i.test(msg)) {
    const card = helpCard(
      'Recipes Help',
      [
        'say: quesadilla · snowcone · nachos · cocoa',
        'controls: next · more · again · menu',
        'tip: short paragraphs — not flashcards'
      ],
      'say "exit" to leave recipes.'
    );
    return { html: composeReply({ part: { html: card }, askAllowed: false, noAck: true, mode: 'recipe' }) };
  }

  // explicit menu
  if (/^menu\b/i.test(msg)) {
    Gate.waiting = true;
    return { html: composeReply({ part: { html: menuCard() }, askAllowed: false, noAck: true, mode: 'recipe' }) };
  }

  // again = repeat current slide
  if (/^again\b/i.test(msg)) {
    if (!Gate.topicKey) {
      return { html: composeReply({ part: { html: menuCard() }, askAllowed: false, noAck: true, mode: 'recipe' }) };
    }
    Gate.waiting = true;
    return { html: composeReply({ part: { html: slideHtml(Gate.topicKey, Gate.index) }, askAllowed: true, askText: 'want another step?', noAck: true, mode: 'recipe' }) };
  }

  // stop/exit
  if (/\b(exit|quit|leave|stop|pause|enough)\b/i.test(msg) || /\b(no thanks|not really)\b/i.test(msg)) {
    S.reset?.();
    Gate.index = 0;
    Gate.topicKey = null;
    Gate.started = false;
    return { html: composeReply({ part: { html: endToMenuHtml() }, askAllowed: false, noAck: true, mode: 'recipe' }), end: true };
  }

  // more/next aliases
  const isNextish = /^(next|more|another|one\s*more|ok(?:ay)?)\b/i.test(msg) || readAffirmative(msg) === 'yes';

  if (isNextish) {
    // if no topic selected yet, keep the menu up
    if (!Gate.topicKey) {
      Gate.waiting = true;
      return { html: composeReply({ part: { html: menuCard() }, askAllowed: false, noAck: true, mode: 'recipe' }) };
    }

    const slides = RECIPES[Gate.topicKey].slides;
    const lastIdx = slides.length - 1;

    // session cap guard → end with booth menu
    if (S.isCapReached()) {
      Gate.waiting = true;
      return {
        html: composeReply({
          part: { kind: 'answer', html: `<p>plates are stacked.</p>${menuCard()}` },
          askAllowed: true,
          mode: 'recipe'
        })
      };
    }

    // first emit: show index 0 and mark started
    if (!Gate.started) {
      Gate.started = true;
      Gate.waiting = true;
      S.bump();
      return { html: composeReply({ part: { html: slideHtml(Gate.topicKey, Gate.index) }, askAllowed: true, askText: 'want another step?', noAck: true, mode: 'recipe' }) };
    }

    // end guard: no repeats, show menu right away
    // in handle(), replace the "end guard: no repeats" block with this:
    if (Gate.index >= lastIdx) {
    Gate.waiting = true;
    // Show the menu card so the user can pick a new recipe immediately
    return {
        html: composeReply({
        part: { kind: 'answer', html: endToMenuHtml() },
        askAllowed: false,
        mode: 'recipe',
        noAck: true
        })
    };
    }


    // advance
    Gate.index = Math.min(Gate.index + 1, lastIdx);
    Gate.waiting = true;
    S.bump();
    return { html: composeReply({ part: { html: slideHtml(Gate.topicKey, Gate.index) }, askAllowed: true, askText: 'want another step?', noAck: true, mode: 'recipe' }) };
  }

  // polite nudge while waiting
  if (Gate.waiting) {
    return {
      html: composeReply({
        part: { html: `<p>cooking show vibe — say <strong>next</strong>/<strong>more</strong>, <strong>again</strong>, or pick: <em>quesadilla · snowcone · nachos · cocoa</em>.</p>` },
        askAllowed: false,
        noAck: true,
        mode: 'recipe'
      })
    };
  }

  // fallback
  return {
    html: composeReply({
      part: { html: `<p>pick a recipe: <strong>quesadilla</strong>, <strong>snowcone</strong>, <strong>nachos</strong>, or <strong>cocoa</strong> — or <em>menu</em>.</p>` },
      askAllowed: true,
      mode: 'recipe'
    })
  };
}


