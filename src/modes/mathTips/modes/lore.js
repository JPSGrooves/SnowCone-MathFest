// /src/modes/mathTips/modes/lore.js
// Lore booth — short drops; persists progress in appState; single-card adapter wraps.

import { appState } from '../../../data/appState.js';

function storeFor(sessionId) {
  if (!appState.progress) appState.progress = {};
  if (!appState.progress.mathtips) appState.progress.mathtips = {};
  if (!appState.progress.mathtips.loreSessions) appState.progress.mathtips.loreSessions = {};
  const bucket = appState.progress.mathtips.loreSessions;
  if (!bucket[sessionId]) bucket[sessionId] = { idx: 0, max: 4 };
  return { bucket, s: bucket[sessionId] };
}

const DROPS = [
  `<p>festival lore: when night falls, cones hum at the hypotenuse gate. each solved puzzle makes the glow brighter.</p>`,
  `<p>legend says grampy p once squared a circle — turned out to be a quesadilla. still counts.</p>`,
  `<p>the snowcone sages map constellations to flavor curves: mango is sine, blueberry is cosine, and cherry… chaotic good.</p>`,
  `<p>beneath the village, a tunnel of triangles keeps time. step on the right beat, doors open. step wrong — extra homework.</p>`
];

export function start(opts = {}) {
  const sid = opts.sessionId || 'default';
  const { s } = storeFor(sid);
  s.idx = 0;
  const html = DROPS[s.idx] || `<p>lore’s a bit fuzzy right now.</p>`;
  return { html, askText: 'wanna hear more?', askAllowed: true, noAck: false };
}

export function handle(text = '', ctx = {}) {
  const sid = ctx.sessionId || 'default';
  const { bucket, s } = storeFor(sid);
  const t = String(text || '').toLowerCase().trim();

  // stop / exit path
  if (/\b(no|nah|stop|pause|later|enough|quit|exit)\b/.test(t)) {
    delete bucket[sid];
    const html = `
      <p>cool breeze. that’s a wrap on lore for now.</p>
      <p>pick another booth to keep rolling:</p>
      <ul class="mt-menu">
        <li>lessons booth</li>
        <li>quiz booth</li>
        <li>lore booth</li>
        <li>recipes booth</li>
        <li>calculator booth</li>
      </ul>
      <p class="mt-dim">or just ask a math question.</p>
    `;
    return { html, askAllowed: false, noAck: false, end: true };
  }

  // first touch inside lore (or vague reply) → deliver current drop
  if (s.idx === 0 && t && /(start|begin|talk|story|lore|festival|more|yes|ok|okay|sure)/.test(t) === false) {
    const html = DROPS[s.idx] || `<p>lore’s a bit fuzzy right now.</p>`;
    return { html, askText: 'wanna hear more?', askAllowed: true, noAck: false };
  }

  // yes/blank → next
  const wantsMore = !t || /\b(yes|yep|yeah|more|another|continue|ok|okay|sure|y)\b/.test(t);
  if (wantsMore) {
    s.idx = Math.min(s.idx + 1, DROPS.length);
    if (s.idx >= DROPS.length || s.idx >= (s.max ?? 4)) {
      delete bucket[sid];
      const html = `
        <p>well, that’s all i know about that one!</p>
        <p>pick another booth to keep rolling:</p>
        <ul class="mt-menu">
          <li>lessons booth</li>
          <li>quiz booth</li>
          <li>lore booth</li>
          <li>recipes booth</li>
          <li>calculator booth</li>
        </ul>
        <p class="mt-dim">or just ask a math question.</p>
      `;
      return { html, askAllowed: false, noAck: false, end: true };
    }
    const html = DROPS[s.idx] || `<p>hmm, the rest is still being written.</p>`;
    return { html, askText: 'wanna hear more?', askAllowed: true, noAck: false };
  }

  // fallback inside lore
  return { html: `<p>i’m jammin’ lore right now — say “more” or “stop”.</p>`, askText: 'wanna hear more?', askAllowed: true, noAck: false };
}
