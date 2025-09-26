// /src/modes/mathTips/modes/recipes.js
// Recipes booth — short, cozy breaks between math beats.
// Menu → topic steps (3–4) → gentle outro. Mirrors Lessons/Lore pacing.

import { composeReply } from '../conversationPolicy.js';
import { makeSession, readAffirmative, helpCard } from './_kit.js';

const S = makeSession({ capMin: 3, capMax: 4 });

let Gate = { topicKey: null, index: 0 };

// ───────────────── CONTENT ─────────────────
const RECIPES = {
  quesadilla: {
    title: 'Quesadilla Wisdom',
    steps: [
      `low heat first — patience makes the crunch.`,
      `cheese to the edges; add a tiny butter swipe for browning.`,
      `flip once; let the other side kiss the pan.`,
      `rest 60 seconds before slicing. math fuel unlocked.`
    ]
  },
  snowcone: {
    title: 'Mango Snowcone',
    steps: [
      `shave ice fine — like new snow at infinity lake.`,
      `mix mango purée + squeeze of lime + tiny pinch of salt.`,
      `pour, stir gently, taste; adjust lime/salt to brightness.`,
      `optional sparkle: a few mango cubes on top.`
    ]
  },
  nachos: {
    title: 'Nacho Night',
    steps: [
      `preheat 400°F (or broil low).`,
      `layer chips in thin strata so every chip sees cheese.`,
      `add cheese + beans/jalapeño; back to heat till bubbly.`,
      `finish with cool stuff: salsa, avocado, cilantro.`
    ]
  },
  cocoa: {
    title: 'Festival Cocoa',
    steps: [
      `ratio: 2 parts dark chocolate : 1 part milk chocolate.`,
      `warm milk (don’t boil); whisk chocolate in to melt.`,
      `dash cinnamon; pinch of salt; keep whisking smooth.`,
      `serve with a secret smile.`
    ]
  }
};

function pickTopic(t = '') {
  const k = String(t).toLowerCase();
  if (/quesa|quesa?dilla|cheese/.test(k)) return 'quesadilla';
  if (/snow\s*cone|mango|shave/.test(k)) return 'snowcone';
  if (/nacho|chips/.test(k)) return 'nachos';
  if (/cocoa|cacao|hot\s*choc/.test(k)) return 'cocoa';
  return Gate.topicKey || 'quesadilla';
}

function menuCard() {
  return `
    <p><strong>Recipes Menu</strong></p>
    <ul class="mt-menu">
      <li><strong>quesadilla</strong> — low heat · flip once · rest</li>
      <li><strong>snowcone</strong> — mango · lime · pinch of salt</li>
      <li><strong>nachos</strong> — thin layers · bubbly cheese</li>
      <li><strong>cocoa</strong> — 2:1 dark to milk</li>
    </ul>
    <p class="mt-dim">say a topic (“quesadilla”, “snowcone”, “nachos”, “cocoa”) or <em>more</em> / <em>stop</em>.</p>
  `;
}

function stepHtml(topicKey, idx) {
  const r = RECIPES[topicKey] || RECIPES.quesadilla;
  const i = Math.max(0, Math.min(idx, r.steps.length - 1));
  const total = r.steps.length;
  return `
    <p><strong>${r.title}</strong> — ${i + 1} of ${total}</p>
    <div class="mt-response-list">
      <div class="mt-response-item">${r.steps[i]}</div>
    </div>
  `;
}

function endHtml() {
  return `
    <p>that’s the snack break for now.</p>
    <ul class="mt-response-list">
      <li class="mt-response-item">lessons booth</li>
      <li class="mt-response-item">quiz booth</li>
      <li class="mt-response-item">lore booth</li>
      <li class="mt-response-item">recipes booth</li>
      <li class="mt-response-item">calculator booth</li>
    </ul>
    <p class="mt-dim">or just ask a math question.</p>
  `;
}

// ───────── ENTRY ─────────
export function start({ topic } = {}) {
  S.reset();
  Gate = { topicKey: pickTopic(topic), index: 0 };
  // clean single bubble: plain menu (no inner card chrome)
  return composeReply({
    part: { kind: 'answer', html: menuCard() },
    askAllowed: false,
    noAck: true,
    mode: 'recipes'
  });
}

// ───────── LOOP ─────────
export function handle(text = '') {
  const msg = String(text || '').trim();

  // router sometimes calls "start"
  if (/^start\b/i.test(msg)) return start({ topic: Gate.topicKey });

  // help
  if (/^help\b/i.test(msg)) {
    const card = helpCard(
      'Recipes Help',
      [
        'say: quesadilla · snowcone · nachos · cocoa',
        'controls: more · stop · menu',
        'tip: short breaks keep the math groove fresh'
      ],
      'say "exit" to leave recipes.'
    );
    return { html: composeReply({ part: { html: card }, askAllowed: false, noAck: true, mode: 'recipes' }) };
  }

  // stop / exit
  if (/\b(stop|quit|pause|later|enough|exit)\b/i.test(msg)) {
    return { html: composeReply({ part: { html: endHtml() }, askAllowed: false, noAck: true, mode: 'recipes' }), end: true };
  }

  // explicit menu
  if (/^menu\b/i.test(msg)) {
    return composeReply({ part: { html: menuCard() }, askAllowed: false, noAck: true, mode: 'recipes' });
  }

  // topic switch (emit first step right away)
  const maybeTopic = pickTopic(msg);
  if (maybeTopic !== Gate.topicKey) {
    Gate.topicKey = maybeTopic;
    Gate.index = 0;
    S.reset();
    const html = stepHtml(Gate.topicKey, Gate.index);
    return { html: composeReply({ part: { html }, askAllowed: true, askText: 'want another step?', noAck: true, mode: 'recipes' }) };
  }

  // yes/no semantics
  const yn = readAffirmative(msg);
  if (yn === 'no') {
    return { html: composeReply({ part: { html: `<p>gotcha. want another booth?</p>` }, askAllowed: false, noAck: true, mode: 'recipes' }) };
  }
  const wantsMore = yn === 'yes' || !msg || /\b(more|next|again|continue|y)\b/i.test(msg);

  // rate-limit
  if (S.shouldBlock?.(msg)) {
    return { html: composeReply({ part: { html: `<p>one snack at a time, legend.</p>` }, askAllowed: false, noAck: true, mode: 'recipes' }) };
  }

  // progress step
  if (wantsMore) {
    const r = RECIPES[Gate.topicKey] || RECIPES.quesadilla;
    if (S.isCapReached() || Gate.index >= r.steps.length - 1) {
      return { html: composeReply({ part: { html: endHtml() }, askAllowed: false, noAck: true, mode: 'recipes' }), end: true };
    }
    S.bump?.();
    Gate.index = Math.min(Gate.index + 1, r.steps.length - 1);
    const html = stepHtml(Gate.topicKey, Gate.index);
    return { html: composeReply({ part: { html }, askAllowed: true, askText: 'want another step?', noAck: true, mode: 'recipes' }) };
  }

  // gentle nudge
  return {
    html: composeReply({
      part: { html: `<p>recipes vibe — say <strong>more</strong>, <strong>stop</strong>, or pick: <em>quesadilla · snowcone · nachos · cocoa</em>.</p>` },
      askAllowed: false,
      noAck: true,
      mode: 'recipes'
    })
  };
}
