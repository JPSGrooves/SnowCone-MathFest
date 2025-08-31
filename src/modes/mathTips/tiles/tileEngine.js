// /src/modes/mathTips/tiles/tileEngine.js
// 🌌 Tiny tile engine: score → pick → render (one bubble).
// Intent packs still handle math; tiles handle small coaching/teach vibes.

import tiles from './tiles.core.js';

// ephemeral state (per reload). If you want persistence later, we can MobX it.
const tileState = {
  turn: 0,
  cooldowns: new Map() // key -> remaining turns
};

function decCooldowns() {
  for (const [k, v] of tileState.cooldowns) {
    const nv = Math.max(0, (v || 0) - 1);
    if (nv === 0) tileState.cooldowns.delete(k);
    else tileState.cooldowns.set(k, nv);
  }
}

function onPicked(key, cd = 2) {
  if (cd > 0) tileState.cooldowns.set(key, cd);
}

function isMathyLine(text) {
  const t = String(text || '').trim();
  if (!t) return false;
  const SAFE_EXPR = /^[\d\s+\-*/^().]+$/;
  if (SAFE_EXPR.test(t)) return true;
  if (/^simplify\s+(-?\d+)\s*\/\s*(-?\d+)/i.test(t)) return true;
  if (/^(gcf|lcm|factor)\b/i.test(t)) return true;
  if (/-?\d+(?:\.\d+)?\s*%\s*of\s*-?\d+(?:\.\d+)?/i.test(t)) return true;
  return false;
}

function testTriggers(tile, lower) {
  let best = 0;
  for (const trig of tile.triggers) {
    if (typeof trig === 'string') {
      if (lower.includes(trig)) best = Math.max(best, 0.8);
    } else if (trig instanceof RegExp) {
      if (trig.test(lower)) best = Math.max(best, 1.0);
    } else if (typeof trig === 'function') {
      best = Math.max(best, Number(trig(lower)) || 0);
    }
  }
  return best;
}

function scoreTile(tile, lower) {
  if (tileState.cooldowns.has(tile.key)) return -1;
  const match = testTriggers(tile, lower);
  if (match <= 0) return 0;
  const qBoost = (/\?\s*$/.test(lower) && tile.qOK) ? 0.1 : 0;
  const weight = tile.weight ?? 1;
  return (match + qBoost) * weight;
}

function pick(arr, seed) {
  if (Array.isArray(arr) && arr.length) {
    if (typeof seed === 'number') return arr[seed % arr.length];
    return arr[Math.floor(Math.random() * arr.length)];
  }
  return '';
}

function renderTile(tile, seed = 0) {
  const lines = [];
  const askedQ = !!tile._askedQ;

  if (!askedQ && tile.flavor?.length) lines.push(pick(tile.flavor, seed));

  if (tile.teach?.insight) lines.push(tile.teach.insight);

  if (tile.teach?.examples?.length) {
    const ex = tile.teach.examples.map(e => {
      const lhs = `<code>${e.in}</code>`;
      const rhs = e.out != null ? ` → <strong>${e.out}</strong>` : '';
      return `${lhs}${rhs}`;
    }).join(' • ');
    lines.push(ex);
  }

  if (tile.invite?.length) lines.push(pick(tile.invite, seed + 1));

  return lines.filter(Boolean).join('<br>');
}

// Public: returns { html, meta } or null
export function tileReply(userText) {
  const text = String(userText || '');
  const lower = text.trim().toLowerCase();
  if (!lower) return null;
  if (isMathyLine(lower)) return null; // let math packs handle

  decCooldowns();
  let best = { tile: null, score: 0 };

  for (const t of tiles.predictive) {
    const s = scoreTile(t, lower);
    if (s > best.score) best = { tile: t, score: s };
  }
  if (!best.tile || best.score < 0.6) {
    for (const t of tiles.eggs) {
      const s = scoreTile(t, lower);
      if (s > best.score) best = { tile: t, score: s };
    }
  }

  if (!best.tile || best.score < (tiles.threshold ?? 0.55)) {
    return null;
  }

  const askedQ = /\?\s*$/.test(lower);
  const seed = ++tileState.turn;
  best.tile._askedQ = askedQ;
  const html = renderTile(best.tile, seed);
  onPicked(best.tile.key, best.tile.cooldownTurns ?? 2);

  return { html, meta: { intent: `tile:${best.tile.key}`, topic: best.tile.topic || null, score: best.score } };
}

export default { tileReply };
