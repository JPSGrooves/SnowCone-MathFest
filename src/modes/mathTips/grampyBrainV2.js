// /src/modes/mathTips/grampyBrainV2.js
// Grampy P — hybrid brain (greet guard → math sniff → tiles → intents → teach fallback)
// One-bubble vibe. Returns an HTML STRING.

import { appState } from '../../data/appState.js';
import { composeReply } from './conversationPolicy.js';
import { fallbackLogger } from './fallbackLogger.js';
import { evaluate, getIntentCount } from './intentEngine.js';
import { tileReply } from './tiles/tileEngine.js';
import { evalSafeExpression } from './mathSafe.js'; // ⬅️ for math sniff

// ── memory: remember last topic/intent/answer (soft, per-session) ────────────
function ensureBotContext() {
  const p = (appState.progress ||= {});
  const mt = (p.mathtips ||= {});
  return (mt.botContext ||= { lastTopic: null, lastIntent: null, lastAnswer: null, updatedAt: 0 });
}
function stripHtml(s='') { return String(s).replace(/<[^>]*>/g, '').trim(); }
function remember({ topic=null, intent=null, answerHtml=null }) {
  const bc = ensureBotContext();
  if (topic) bc.lastTopic = topic;
  if (intent) bc.lastIntent = intent;
  if (answerHtml) bc.lastAnswer = stripHtml(answerHtml).slice(0, 400);
  bc.updatedAt = Date.now();
}
function finish(html, meta={}) {
  try { remember({ topic: meta.topic || null, intent: meta.intent || null, answerHtml: html }); } catch {}
  return html;
}


// import packs once to register their intents
import './packs/smalltalk.pack.js';
import './packs/help.pack.js';
import './packs/math.pack.js';
import './packs/gameplay.pack.js';
import './packs/realworld.pack.js';
import './packs/lore.pack.js';

// 🔧 flip to true to see "🧭 intent pick" logs
const DEBUG_INTENT_PICK = false;

/* ────────────────────────────────────────────────────────────────────────────
   hard short-circuit: pure greetings never reach status/stats
──────────────────────────────────────────────────────────────────────────── */
function greetGuard(text) {
  const s = String(text || '').trim().toLowerCase();
  if (!/^(hi|hello|hey|yo|sup|what'?s up|howdy|hola)\b/.test(s)) return null;

  const name = (appState?.profile?.username || 'friend').trim() || 'friend';
  const bank = [
    (n) => `hey ${n}! what’s one tiny thing you want help with?`,
    (n) => `yo ${n} — pick a lane: % or fractions?`,
    (n) => `hi ${n}! toss me a mini problem.`,
  ];
  return bank[Math.floor(Math.random() * bank.length)](name);
}

// add near greetGuard
function thanksGuard(text) {
  const s = String(text || '').trim().toLowerCase();
  if (!/^(thanks|thank you|thx|ty|appreciate\s+it)\b/.test(s)) return null;
  const name = (appState?.profile?.username || 'friend').trim() || 'friend';
  const bank = [
    (n) => `anytime, ${n}. want a quick % or a fraction?`,
    (n) => `you got it, ${n}. need one more rep?`,
    (n) => `locked. tiny move next?`
  ];
  return bank[Math.floor(Math.random() * bank.length)](name);
}


/* ────────────────────────────────────────────────────────────────────────────
   math sniff: pull a mathy chunk out of chatty text like "okay! 2+2!"
   - finds the longest substring of [digits + operators + () . ^]
   - tries to eval safely; if good, returns the answer bubble
──────────────────────────────────────────────────────────────────────────── */
/* ────────────────────────────────────────────────────────────────────────────
   math sniff: pull a mathy chunk out of chatty text like "okay! 2+2!"
   - adds inline √(n) support
   - skips wordy "sqrt"/"square root" so the real intent handles it
──────────────────────────────────────────────────────────────────────────── */
function maybeInlineMath(text) {
  const raw = String(text || '');

  // ✅ inline support: literal root symbol (e.g., "√50", "what about √(144)?")
  const rootM = raw.match(/√\s*\(?\s*(-?\d+(?:\.\d+)?)\s*\)?/);
  if (rootM) {
    const x = Number(rootM[1]);
    if (Number.isFinite(x) && x >= 0) {
      const r = Math.sqrt(x);
      const pretty = Number.isInteger(r)
        ? r
        : Number(r.toFixed(6)).toString().replace(/\.?0+$/, '');
      return `√${rootM[1]} = <strong>${pretty}</strong>`;
    }
  }

  // 🚧 guard: if it smells like sqrt words, let the sqrt intent handle it
  if (/\b(?:sqrt|square\s*root)\b/i.test(raw)) return null;

  // original sniff for arithmetic expressions
  const cleaned = raw.replace(/,/g, ''); // strip grouping commas
  const matches = cleaned.match(/[0-9+\-*/^().\s]+/g);
  if (!matches) return null;

  // pick the longest plausible chunk
  const expr = matches
    .map(s => s.trim())
    .filter(s => /\d/.test(s))         // must include a digit
    .sort((a, b) => b.length - a.length)[0];

  if (!expr || expr.length < 2) return null;

  try {
    const val = evalSafeExpression(expr);
    const clean = Number.isInteger(val) ? val : Number(val.toFixed(6));
    return `${escapeHTML(expr)} = <strong>${clean}</strong>`;
  } catch {
    return null;
  }
}


function escapeHTML(s) {
  return String(s)
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#39;');
}

export function getResponse(userText) {
  const text = String(userText || '');

  // 1) greeting guard (small talk only)
  const g = greetGuard(text);
  if (g) return finish(g, { intent: 'greet', topic: 'smalltalk' });

  // 1.5) gratitude guard (small talk only)
  const t = thanksGuard(text);
  if (t) return finish(t, { intent: 'thanks', topic: 'smalltalk' });

  // 2) math sniff (handles "okay! 2+2!" → 4, etc.)
  const sniff = maybeInlineMath(text);
  if (sniff) return finish(sniff, { intent: 'inline_calc', topic: 'calc' });

  // 3) conversational tiles (non-mathy coaching/teach)
  try {
    const tRes = tileReply(text);
    if (tRes && tRes.html) return finish(tRes.html, { intent: tRes.meta?.intent, topic: tRes.meta?.topic });
  } catch (e) {
    console.warn('🧱 tile engine error:', e);
  }

  // 4) intent engine (math + commands + smalltalk packs)
  try {
    const best = evaluate(text);
    if (DEBUG_INTENT_PICK) {
      try {
        console.log(
          '🧭 intent pick →',
          best?.key,
          best?.score,
          '(total intents:', getIntentCount?.() ?? 'n/a', ')'
        );
      } catch {}
    }
    if (best && typeof best.handler === 'function') {
      const html = best.handler({ text });
      const out = typeof html === 'string' ? html : String(html ?? '');
      // if your intent system exposes best.topic, pass it here; else omit.
      return finish(out, { intent: best.key, topic: best.topic || null });
    }
  } catch (e) {
    console.error('💥 evaluate/handler error:', e);
  }

  // 5) graceful teach-by-example fallback (NO ACK) + log it
  try { fallbackLogger.add(text.trim().toLowerCase()); } catch {}

  const topicGuess = /%/.test(text)
    ? 'percent'
    : /\/|fraction|simplify/.test(text)
    ? 'fractions'
    : 'arithmetic';

  return composeReply({
    userText: text,
    part: { kind: 'teach', html: '', topicGuess },
    noAck: true // ⬅️ kill the “Heard.” vibe
  });
}

export default { getResponse };
