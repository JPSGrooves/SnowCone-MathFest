// /src/modes/mathTips/modes/recipes.js
// Recipe booth — short, cozy breaks between math beats.
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

export function pickRecipeTopic(t = '') {
  const k = String(t).toLowerCase();
  if (/quesa|quesa?dilla|cheese/.test(k)) return 'quesadilla';
  if (/snow\s*cone|mango|shave/.test(k)) return 'snowcone';
  if (/nacho|chips/.test(k)) return 'nachos';
  if (/cocoa|cacao|hot\s*choc/.test(k)) return 'cocoa';
  // if nothing matched, just return the existing topic (if any), else null
  return Gate.topicKey ? Gate.topicKey : null;
}



function menuCard() {
  return `
    <p><strong>Recipe Menu</strong></p>
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

// replace your current endHtml() with this:
function endToMenuHtml() {
  return `
    <p>that’s the snack break for now — pick another recipe?</p>
    ${menuCard()}
  `;
}


// ───────── ENTRY ─────────
export function start({ topic } = {}) {
  S.reset();
  const picked = topic ? pickRecipeTopic(topic) : null;
  Gate = { topicKey: picked, index: 0 };

  if (picked) {
    // user came in with a specific recipe
    const html = stepHtml(picked, 0);
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

  // otherwise, plain menu
  return {
    html: composeReply({
      part: { kind: 'answer', html: menuCard() },
      askAllowed: false,
      noAck: true,
      mode: 'recipe'
    })
  };
}


// ───────── LOOP ─────────
// ───────── LOOP ─────────
export function handle(text = '') {
  const msg = String(text || '').trim();

  // router sometimes calls "start"
  if (/^start\b/i.test(msg)) return start({});

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
    return { html: composeReply({ part: { html: card }, askAllowed: false, noAck: true, mode: 'recipe' }) };
  }

  // ─── TOPIC PICK ALWAYS WINS ────────────────────────────────────────────────
  const maybeTopic = pickRecipeTopic(msg);
  if (maybeTopic && maybeTopic !== Gate.topicKey) {
    Gate.topicKey = maybeTopic;
    Gate.index = 0;
    S.reset?.();
    const html = stepHtml(Gate.topicKey, Gate.index);
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

  // stop / exit
  if (/\b(exit|quit|leave)\b/i.test(msg)) {
    // ✅ use endToMenuHtml, do NOT call the old endHtml()
    return {
      html: composeReply({ part: { html: endToMenuHtml() }, askAllowed: false, noAck: true, mode: 'recipe' }),
      end: true
    };
  }

  if (/\b(stop|pause|later|enough)\b/i.test(msg) || /\b(no thanks|not really)\b/i.test(msg)) {
    S.reset?.();
    Gate.index = 0;
    // optional: keep topic or clear it; clearing avoids accidental “more” repeat
    Gate.topicKey = null;
    return { html: composeReply({ part: { html: menuCard() }, askAllowed: false, noAck: true, mode: 'recipe' }) };
  }

  // explicit menu
  if (/^menu\b/i.test(msg)) {
    return { html: composeReply({ part: { html: menuCard() }, askAllowed: false, noAck: true, mode: 'recipe' }) };
  }

  // yes/more BEFORE any other fallbacks
  const yn = readAffirmative(msg);
  const wantsMore = yn === 'yes' || /\b(more|next|again|continue|step|go|gimme|another)\b/i.test(msg);

  if (wantsMore) {
    // no active topic? show menu instead of faking progress
    if (!Gate.topicKey) {
      S.reset?.();
      Gate.index = 0;
      return { html: composeReply({ part: { html: menuCard() }, askAllowed: false, noAck: true, mode: 'recipe' }) };
    }



    const r = RECIPES[Gate.topicKey] || RECIPES.quesadilla;

    // last step reached? bounce to the menu but STAY IN BOOTH (no end:true)
    if (S.isCapReached() || Gate.index >= r.steps.length - 1) {
      S.reset?.();
      Gate.index = 0;
      Gate.topicKey = null;
      return { html: composeReply({ part: { html: endToMenuHtml() }, askAllowed: false, noAck: true, mode: 'recipe' }) };
    }

    // advance normally
    S.bump?.();
    Gate.index = Math.min(Gate.index + 1, r.steps.length - 1);
    const html = stepHtml(Gate.topicKey, Gate.index);
    return { html: composeReply({ part: { html }, askAllowed: true, askText: 'want another step?', noAck: true, mode: 'recipe' }) };
  }

  if (yn === 'no') {
    S.reset?.();
    Gate.index = 0;
    Gate.topicKey = null;
    return { html: composeReply({ part: { html: menuCard() }, askAllowed: false, noAck: true, mode: 'recipe' }) };
  }

  // gentle nudge
  return {
    html: composeReply({
      part: { html: `<p>recipes vibe — say <strong>more</strong>, <strong>stop</strong>, or pick: <em>quesadilla · snowcone · nachos · cocoa</em>.</p>` },
      askAllowed: false,
      noAck: true,
      mode: 'recipe'
    })
  };
}
