// /src/modes/mathTips/tiles/tileEngine.js
// Lightweight tile matcher with cooldown + clean HTML joiner.

import bank from './tiles.core.js';
import { appState } from '../../../data/appState.js';
import { runInAction } from 'mobx';

const THRESH = bank.threshold ?? 0.55;

function ensureCooldowns() {
  runInAction(() => {
    if (!appState.progress) appState.progress = {};
    if (!appState.progress.mathtips) appState.progress.mathtips = {};
    if (!appState.progress.mathtips.cooldowns) appState.progress.mathtips.cooldowns = {};
  });
  return appState.progress.mathtips.cooldowns;
}

function tickCooldowns() {
  const cd = ensureCooldowns();
  runInAction(() => {
    for (const k of Object.keys(cd)) {
      const v = Math.max(0, (cd[k] | 0) - 1);
      if (v <= 0) delete cd[k];
      else cd[k] = v;
    }
  });
}

function setCooldown(key, turns = 2) {
  const cd = ensureCooldowns();
  runInAction(() => { cd[key] = Math.max(1, turns | 0); });
}

function matchTrigger(tr, textLower) {
  if (!tr) return false;
  if (typeof tr === 'string') return textLower.includes(tr.toLowerCase());
  if (tr instanceof RegExp) return tr.test(textLower);
  return false;
}

function scoreTile(tile, textLower) {
  let hits = 0;
  for (const tr of (tile.triggers || [])) {
    if (matchTrigger(tr, textLower)) hits += 1;
  }
  if (!hits) return 0;
  const w = tile.weight ?? 1;
  return hits * w;
}

function code(x) { return `<code>${x}</code>`; }
function bold(x) { return `<strong>${x}</strong>`; }

function examplesToLine(examples = []) {
  if (!examples.length) return '';
  const parts = examples.map(({ in: inp, out }) => {
    if (out === null || typeof out === 'undefined') return code(inp);
    const pretty = typeof out === 'number' ? bold(out) : bold(String(out));
    return `${code(inp)} → ${pretty}`;
  });
  return parts.join(' • ');
}

function buildHtml(tile) {
  const insight = tile.teach?.insight ? String(tile.teach.insight) : '';
  const exLine  = examplesToLine(tile.teach?.examples || []);
  const flavor  = Array.isArray(tile.flavor) ? tile.flavor[0] : (tile.flavor || '');
  const invite  = Array.isArray(tile.invite) ? tile.invite[0] : (tile.invite || '');

  const lines = [];
  if (flavor) lines.push(flavor.replace(/\s+$/,''));
  if (insight) lines.push(insight);
  if (exLine) lines.push(exLine);
  if (invite) lines.push(invite);

  return lines.filter(Boolean).join('<br>');
}

export function tileReply(textRaw) {
  const textLower = String(textRaw || '').toLowerCase().trim();
  if (!textLower) return null;

  tickCooldowns();
  const cd = ensureCooldowns();

  const all = ([]).concat(bank.predictive || [], bank.eggs || []);
  let best = null, bestScore = 0;

  for (const t of all) {
    if (cd[t.key] > 0) continue;
    const sc = scoreTile(t, textLower);
    if (sc >= THRESH && sc > bestScore) {
      best = t; bestScore = sc;
    }
  }

  if (!best) return null;

  const html = buildHtml(best);
  setCooldown(best.key, best.cooldownTurns ?? 2);

  return { html, meta: { intent: best.key, topic: best.topic || 'teach' } };
}

export default { tileReply };
