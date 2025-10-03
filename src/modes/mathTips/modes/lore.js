// /src/modes/mathTips/modes/lore.js
// Lore booth — topics with short drops. Stays in-booth and returns to Lore Menu
// when a section ends or on ok/stop/menu. Single-card replies, no end:true.

import { composeReply } from '../conversationPolicy.js';

// ───────────────── CONTENT ─────────────────
// Keep your existing flavor; these are your current cards.
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
  xFiles: [
    `<p>type “park the cars” in any booth and the traffic dino waves at you (only once per day).</p>`,
    `<p>there’s a hidden comet snowcone topping — unlock it by hitting a 7-streak at infinity lake.</p>`,
    `<p>the ant commanders argue about vectors. neither one will pivot.</p>`,
    `<p>grampy p’s guitar has a secret capo slot labeled φ — strum it for golden vibes.</p>`
  ]
};

// ───────────────── STATE (per-session) ─────────────────
/** sessionId -> { topic: 'festival'|'origins'|'pcat'|'xFiles'|null, idx: number } */
const SESS = new Map();

function isAffirmative(s) {
  const t = String(s || '').toLowerCase().trim();
  return (
    /\b(y(?:es+|ea|ep|up)?|yeah|yea|yessir|yass+|sure|ok(?:ay)?|alright|all right|bet|roger|10[\s-]?4|indeed|affirmative|please|do it|do this|go|let'?s go|sounds (?:good|great))\b/.test(t)
    || /^\s*[yk]\s*$/i.test(t) // y, k, kk
  );
}


// ───────────────── UTIL ─────────────────
const norm = (s) => String(s || '').trim().toLowerCase();

function pickTopic(input) {
  const k = norm(input);
  if (!k) return null;
  if (/origin|begin|history|start|found/.test(k)) return 'origins';
  if (/(p[-\s]*cat|pcat|pythagoras\s*cat|cat)/.test(k)) return 'pcat';
  if (/egg|secret|xfiles?|hidden|unlock/.test(k)) return 'xFiles';
  if (/fest|village|gate|cone|tunnel|legend|lore/.test(k)) return 'festival';
  if (/^(festival|origins?|pcat|xfiles?)$/.test(k)) {
    return k.startsWith('origin') ? 'origins' : k.startsWith('xfile') ? 'xFiles' : k;
  }
  return null;
}

function ensure(sessionId) {
  if (!sessionId) sessionId = 'default';
  if (!SESS.has(sessionId)) SESS.set(sessionId, { topic: null, idx: 0 });
  return SESS.get(sessionId);
}

function setTopic(sessionId, topic) {
  const st = ensure(sessionId);
  st.topic = topic;
  st.idx = 0;
  return st;
}

function menuHTML() {
  return `
    <p><strong>Lore Menu</strong></p>
    <ul class="mt-menu">
      <li><strong>festival</strong> — gates · cones · tunnels</li>
      <li><strong>origins</strong> — how it all began</li>
      <li><strong>pcat</strong> — yes/no myths</li>
      <li><strong>xFiles</strong> — secrets & unlocks</li>
    </ul>
    <p class="mt-dim">say a topic (“festival”, “origins”, “pcat”, “xFiles”) or <em>more</em> / <em>stop</em> / <em>menu</em>.</p>
  `;
}

function card(html, { askAllowed = true } = {}) {
  return composeReply({
    part: { kind: 'answer', html },
    askAllowed,
    mode: 'lore',
    noAck: true
  });
}

function showMenu() {
  return card(menuHTML(), { askAllowed: false });
}

function showStep(topic, idx) {
  const deck = LORE[topic] || [];
  const i = Math.max(0, Math.min(idx, deck.length - 1));
  const html = `${deck[i]}<p class="mt-dim">say <code>more</code> for another, or <code>menu</code> to pick a topic.</p>`;
  return card(html);
}

function finishToMenu() {
  return showMenu(); // ← important: stay in lore, no end:true
}

// Optional: tiny analytics
function markLoreTouch(sessionId) {
  try {
    const { appState } = require('../../../data/appState.js'); // tolerant require
    appState.progress ??= {};
    appState.progress.mathtips ??= {};
    const p = appState.progress.mathtips;
    p.loreSeen ??= {};
    const st = ensure(sessionId);
    const key = st.topic || 'menu';
    p.loreSeen[key] = (p.loreSeen[key] || 0) + 1;
  } catch {}
}

// ───────────────── PUBLIC API ─────────────────
export function start({ sessionId, topic } = {}) {
  const picked = pickTopic(topic);
  const st = ensure(sessionId);
  if (picked) setTopic(sessionId, picked);
  else { st.topic = null; st.idx = 0; }
  return showMenu();
}

export function handle(text = '', { sessionId } = {}) {
  const t = norm(text);
  const st = ensure(sessionId);

  // router may send 'start'
  if (t.startsWith('start')) return start({ sessionId, topic: st.topic });

  // help/menu → show menu (stay in booth)
  if (t === 'help' || t === 'menu' || t === 'lore') return showMenu();

  // stop/ok/done/exit section → return to menu (no end:true)
  if (/\b(stop|quit|pause|later|enough|exit|done)\b/i.test(t)) {
    st.topic = null; st.idx = 0;
    return showMenu();
  }

  // topic switch/select (emit first drop)
  const maybe = pickTopic(t);
  if (maybe) {
    setTopic(sessionId, maybe);
    markLoreTouch(sessionId);
    return showStep(maybe, 0);
  }

  // flow: yes/more/next/again continue; 'no' = menu
  if (/\b(no|nah|nope|negative|pass)\b/i.test(t)) {
    st.topic = null; st.idx = 0;
    return showMenu();
  }
  // treat empty, "more" words, or ANY affirmative as continue
  const wantsMore =
    !t
    || /\b(more|another|continue|next|again)\b/i.test(t)
    || isAffirmative(t);

  if (wantsMore) {
    if (!st.topic) return showMenu();
    const deck = LORE[st.topic] || [];
    if (st.idx + 1 < deck.length) {
      st.idx += 1;
      markLoreTouch(sessionId);
      return showStep(st.topic, st.idx);
    }
    st.topic = null; st.idx = 0;
    return finishToMenu();
  }

  if (!t || /\b(more|another|continue|next|again|yes|y)\b/.test(t)) {
    if (!st.topic) return showMenu();
    const deck = LORE[st.topic] || [];
    // advance if possible, else finish to menu
    if (st.idx + 1 < deck.length) {
      st.idx += 1;
      markLoreTouch(sessionId);
      return showStep(st.topic, st.idx);
    }
    // finished that topic → back to menu
    st.topic = null; st.idx = 0;
    return finishToMenu();
  }

  // unknown inside lore → gentle nudge with menu
  return card(`<p>ready to jam some lore? say <strong>more</strong>, <strong>stop</strong>, or pick a topic: festival · origins · pcat · xFiles.</p>`, { askAllowed: false });
}

export default { start, handle };
