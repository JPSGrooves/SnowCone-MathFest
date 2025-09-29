// /src/modes/mathTips/modes/lore.js
// Lore booth — multi-tier (topics) with short, capped drops per session.
// Mirrors Lessons’ session/cap/nudge patterns and keeps single-card replies.

import { composeReply } from '../conversationPolicy.js';
import { makeSession, readAffirmative, helpCard } from './_kit.js';
import { appState } from '../../../data/appState.js';

// Session caps this many "next/more" advances before we wrap the arc.
const S = makeSession({ capMin: 3, capMax: 4 });

// Tracks topic + index, nothing fancy.
let Gate = { topicKey: 'festival', index: 0 };

// ───────────────── CONTENT (add freely without touching the loop) ─────────────
const LORE = {
  festival: [
    `<p>when night falls, cones hum at the hypotenuse gate. each solved puzzle makes the glow brighter.</p>`,
    `<p>legend says grampy p once squared a circle — turned out to be a quesadilla. still counts.</p>`,
    `<p>the sages map constellations to flavor curves: mango is sine, blueberry is cosine, cherry is chaotic good.</p>`,
    `<p>beneath the village, a tunnel of triangles keeps time. step on the right beat, doors open. step wrong — extra homework.</p>`
  ],
  origins: [
    `<p>first gate was drawn in chalk, then struck by lightning — the outline never washed away.</p>`,
    `<p>old timers say the festival grew from a single proof whispered to a snow cloud.</p>`,
    `<p>a cartographer measured joy in radians and found full circle at the shaved-ice tent.</p>`,
    `<p>some claim the parking dino learned to honk before it learned to roar.</p>`
  ],
  pcat: [
    `<p>pythagoras cat answers only yes/no, but blinks in prime numbers when it’s excited.</p>`,
    `<p>pcat naps on the diagonal of every rectangle rug — efficiency matters.</p>`,
    `<p>if you ask for hints thrice, it leaves a pawprint that points the shortest way.</p>`,
    `<p>legend: pcat once factored a polynomial by batting the terms into place.</p>`
  ],
  easter: [
    `<p>type “park the cars” in any booth and the traffic dino waves at you (only once per day).</p>`,
    `<p>there’s a hidden comet snowcone topping — unlock it by hitting a 7-streak at infinity lake.</p>`,
    `<p>the ant commanders argue about vectors. neither one will pivot.</p>`,
    `<p>grampy p’s guitar has a secret capo slot labeled φ — strum it for golden vibes.</p>`
  ]
};

// ───────────────── HELPERS ─────────────────
function pickTopic(t) {
  const k = String(t || '').toLowerCase();
  if (/origin|begin|history|start|found/.test(k)) return 'origins';
  if (/(p[-\s]*cat|pcat|pythagoras\s*cat|cat)/.test(k)) return 'pcat';
  if (/egg|secret|easter|hidden|unlock/.test(k)) return 'easter';
  if (/fest|village|gate|cone|tunnel|legend|lore/.test(k)) return 'festival';
  return Gate.topicKey || 'festival';
}

function menuCard() {
   return `
     <p><strong>Lore Menu</strong></p>
     <ul class="mt-menu">
       <li><strong>festival</strong> — gates · cones · tunnels</li>
       <li><strong>origins</strong> — how it all began</li>
       <li><strong>pcat</strong> — yes/no myths</li>
       <li><strong>easter</strong> — secrets & unlocks</li>
     </ul>
     <p class="mt-dim">say a topic (“festival”, “origins”, “pcat”, “easter”) or <em>more</em> / <em>stop</em>.</p>
   `;
 }

function currentList() {
  return LORE[Gate.topicKey] || LORE.festival;
}

function emitDrop(idx) {
  const arr = currentList();
  const i = Math.max(0, Math.min(idx, arr.length - 1));
  const html = `${arr[i]}`; // already <p>…</p> in content
  return composeReply({ part: { kind: 'answer', html }, askAllowed: true, mode: 'lore', noAck: true });
}

function endCard() {
  const html = `
    <p>that’s the tale… for now.</p>
    <ul class="mt-response-list">
      <li class="mt-response-item">lessons booth</li>
      <li class="mt-response-item">quiz booth</li>
      <li class="mt-response-item">lore booth</li>
      <li class="mt-response-item">recipe booth</li>
      <li class="mt-response-item">calculator booth</li>
    </ul>
    <p class="mt-dim">or just ask a math question.</p>
  `;
  return composeReply({ part: { kind: 'answer', html }, askAllowed: false, mode: 'lore', noAck: true });
}

// optional: jot that the user touched lore this session (kept tiny)
function markLoreTouch(topic) {
  try {
    appState.progress ??= {};
    appState.progress.mathtips ??= {};
    const p = appState.progress.mathtips;
    p.loreSeen ??= {};
    p.loreSeen[topic] = (p.loreSeen[topic] || 0) + 1;
  } catch (_) {/* non-fatal */}
}

// ───────────────── ENTRY ─────────────────
export function start({ topic } = {}) {
  S.reset();
  Gate = { topicKey: pickTopic(topic || Gate.topicKey), index: 0 };

  // single bubble: menu only
  return composeReply({
    part: { kind: 'answer', html: menuCard() },
    askAllowed: false,
    mode: 'lore',
    noAck: true
  });
}

// ───────────────── LOOP ─────────────────
export function handle(text = '') {
  const msg = String(text || '').trim();

  // router may call "start" as a message
  if (/^start\b/i.test(msg)) return start({ topic: Gate.topicKey });

  // help card
  if (/^help\b/i.test(msg)) {
    const card = helpCard(
      'Lore Help',
      [
        'say: festival · origins · pcat · easter',
        'controls: more · stop',
        'tip: you can switch topics mid-story'
      ],
      'say "exit" to leave lore.'
    );
    return { html: composeReply({ part: { kind: 'answer', html: card }, askAllowed: false, mode: 'lore', noAck: true }) };
  }

  // explicit menu
  if (/^menu\b/i.test(msg)) {
    return composeReply({ part: { kind: 'answer', html: menuCard() }, askAllowed: false, mode: 'lore', noAck: true });
  }

  // explicit stop/exit
  if (/\b(stop|quit|pause|later|enough|exit)\b/i.test(msg)) {
    return { html: endCard(), askAllowed: false, noAck: true, end: true };
  }

  // topic switch (does not auto-advance; emits first drop for snappier feel)
  const maybeTopic = pickTopic(msg);
  const switched = maybeTopic !== Gate.topicKey;
  if (switched) {
    Gate.topicKey = maybeTopic;
    Gate.index = 0;
    S.reset();
    markLoreTouch(Gate.topicKey);
    return { html: emitDrop(Gate.index) };
  }

  // yes/no semantics: yes → more; no → stop
  const yn = readAffirmative(msg);
  if (yn === 'no') return { html: endCard(), askAllowed: false, noAck: true, end: true };
  const wantsMore = yn === 'yes' || !msg || /\b(more|another|continue|next|again|ok|okay|sure|y)\b/i.test(msg);

  if (wantsMore) {
    if (S.isCapReached() || Gate.index >= currentList().length - 1) {
      return { html: endCard(), askAllowed: false, noAck: true, end: true };
    }
    S.bump();
    Gate.index = Math.min(Gate.index + 1, currentList().length - 1);
    markLoreTouch(Gate.topicKey);
    return { html: emitDrop(Gate.index) };
  }

  // fallback inside lore: gentle nudge, no new card spam
  const hint = composeReply({
    part: { html: `<p>jammin’ lore — say <strong>more</strong>, <strong>stop</strong>, or pick a topic: festival · origins · pcat · easter.</p>` },
    askAllowed: false,
    mode: 'lore',
    noAck: true
  });
  return { html: hint };
}
