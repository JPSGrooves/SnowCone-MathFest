// /src/modes/mathTips/qabot.js
// Grampy P: tiny rule-based chatbot for Math Tips Village.
// Mode-scoped, predictable, and easy to extend.

// ────────────────────────────────────────────────────────────────────────────────
// Utilities
// ────────────────────────────────────────────────────────────────────────────────
function escapeHTML(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function safeNumber(n, def = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : def;
}

// ────────────────────────────────────────────────────────────────────────────────
// Tiny, safe math helpers
// ────────────────────────────────────────────────────────────────────────────────
// Accept only digits, + - * / ^ . ( ) and spaces; short length guard.
const SAFE_EXPR = /^[\d\s+\-*/^().]+$/;

function evalSafeExpression(expr) {
  const raw = String(expr).trim();
  if (!raw || raw.length > 120) throw new Error('Too long');
  if (!SAFE_EXPR.test(raw)) throw new Error('Unsafe characters');

  // Convert ^ to ** for JS exponent
  const jsExpr = raw.replaceAll('^', '**');

  // Disallow weird consecutive operators (except minus for negatives)
  if (/[*\/+]{2,}/.test(jsExpr)) throw new Error('Bad operator sequence');

  // Final safety: evaluate inside Function; no identifiers allowed because regex forbids letters.
  // eslint-disable-next-line no-new-func
  const fn = new Function(`"use strict"; return (${jsExpr});`);
  const val = fn();
  if (!Number.isFinite(val)) throw new Error('Not finite');
  return val;
}

function tryPercentOf(text) {
  // patterns like "15% of 80" or "what is 7.5% of 120?"
  const m = /(-?\d+(?:\.\d+)?)\s*%\s*of\s*(-?\d+(?:\.\d+)?)/i.exec(text);
  if (!m) return null;
  const p = parseFloat(m[1]);
  const n = parseFloat(m[2]);
  if (!Number.isFinite(p) || !Number.isFinite(n)) return null;
  const ans = (p / 100) * n;
  return { p, n, ans };
}

// ────────────────────────────────────────────────────────────────────────────────
const TIP_BANK = [
  "Write your *own* example right after learning one. Memory sticks when your hand moves.",
  "Big problems? Break into 3 bite-sized steps and do step 1 *badly but now*.",
  "Say the steps out loud. Sound makes sequences stick. 🎤",
  "If you can’t teach it, you don’t know it yet. Explain to your pillow for 60 seconds.",
  "Space your practice: 10–15 minutes now, again tonight, again tomorrow. 📅",
  "When stuck: define every noun in the question. Clarity unlocks moves.",
  "Draw it. Even ugly sketches beat perfect thoughts. ✏️",
  "Estimate first, calculate second. Answers that smell wrong usually are.",
];

const GREETS = ["yo", "hey", "heyy", "hello", "hi", "sup", "howdy", "hola", "what’s up", "wassup"];

// Module-local state (mode-scoped, not global app)
const botState = {
  lastIntent: null,
  tipIndex: 0,
};

// ────────────────────────────────────────────────────────────────────────────────
// Response builders
// ────────────────────────────────────────────────────────────────────────────────
function reply(text) {
  return escapeHTML(text);
}

function greetLine(appStateLike) {
  const name = appStateLike?.player?.name || "friend";
  const lvl  = safeNumber(appStateLike?.player?.level, 1);
  return reply(`Hey ${name}! Grampy P reporting for duty—level ${lvl} vibes only. 🍧`);
}

function statsLine(appStateLike) {
  const xp   = safeNumber(appStateLike?.player?.xp, 0);
  const lvl  = safeNumber(appStateLike?.player?.level, Math.floor(xp / 100) + 1);
  const tips = safeNumber(appStateLike?.progress?.mathtips?.completedTips, 0);
  const total= safeNumber(appStateLike?.progress?.mathtips?.totalTips, Math.max(10, tips));
  return reply(`Stats: Level ${lvl}, XP ${xp}, Tips ${tips}/${total}. Keep scooping! 🍨`);
}

function tipLine() {
  const tip = TIP_BANK[botState.tipIndex % TIP_BANK.length];
  botState.tipIndex++;
  return reply(`Tip: ${tip}`);
}

function helpLines() {
  return [
    reply("Try: `7*8+12`, `15% of 80`, `factor 36`, `gcf 18 24`, `simplify 12/18`."),
    reply("Or say `tip`, `study`, `help`, `stats`. I’m chill, but exact."),
  ];
}

// Quick number helpers
function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}
function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}
function simplifyFractionText(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return "That fraction is undefined, amigo.";
  const g = gcd(a, b);
  const na = a / g, nb = b / g;
  return `${a}/${b} → ${na}/${nb}`;
}

// ────────────────────────────────────────────────────────────────────────────────
// Intent router
// ────────────────────────────────────────────────────────────────────────────────
function routeIntent(userTextRaw) {
  const t = String(userTextRaw).trim();
  const lower = t.toLowerCase();

  // greetings
  if (GREETS.some(g => lower === g || lower.startsWith(g + ' '))) return 'greet';

  // commands
  if (/^\/?(help|commands)\b/.test(lower)) return 'help';
  if (/^\/?(stats)\b/.test(lower)) return 'stats';
  if (/^\/?(tip|study)\b/.test(lower)) return 'tip';

  // mathy
  if (tryPercentOf(lower)) return 'percent-of';
  if (SAFE_EXPR.test(lower)) return 'calc';

  // factor / gcf / lcm / simplify
  if (/^factor\s+(-?\d+)\s*$/i.test(lower)) return 'factor';
  if (/^gcf\s+(-?\d+)\s+(-?\d+)\s*$/i.test(lower)) return 'gcf';
  if (/^lcm\s+(-?\d+)\s+(-?\d+)\s*$/i.test(lower)) return 'lcm';
  if (/^simplify\s+(-?\d+)\s*\/\s*(-?\d+)\s*$/i.test(lower)) return 'simplify';

  // encouragement / stuck
  if (/(stuck|lost|confused|idk|don'?t know)/i.test(lower)) return 'encourage';

  // default
  return 'fallback';
}

// ────────────────────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────────────────────
export function getResponse(userText, appStateLike) {
  const text = String(userText || '');
  const intent = routeIntent(text);
  botState.lastIntent = intent;

  try {
    switch (intent) {
      case 'greet':
        return `${greetLine(appStateLike)}<br>${tipLine()}`;

      case 'help':
        return helpLines().join('<br>');

      case 'stats':
        return statsLine(appStateLike);

      case 'tip':
        // Optional: tiny XP bump for engaging with tips (defensive guard)
        if (appStateLike && typeof appStateLike.incrementXP === 'function') {
          try { appStateLike.incrementXP(1); } catch (_) {}
        }
        return tipLine();

      case 'percent-of': {
        const p = tryPercentOf(text);
        const ans = p.ans;
        const clean = Number.isInteger(ans) ? ans : Number(ans.toFixed(4));
        return reply(`${p.p}% of ${p.n} = <strong>${clean}</strong>`);
      }

      case 'calc': {
        const val = evalSafeExpression(text);
        const clean = Number.isInteger(val) ? val : Number(val.toFixed(6));
        return reply(`${escapeHTML(text)} = <strong>${clean}</strong>`);
      }

      case 'factor': {
        const m = /^factor\s+(-?\d+)\s*$/i.exec(text);
        const n = Math.abs(parseInt(m[1], 10));
        if (n === 0) return reply("Every number divides 0. Kinda wild.");
        const facts = [];
        for (let i = 1; i * i <= n; i++) {
          if (n % i === 0) {
            facts.push(i);
            if (i !== n / i) facts.push(n / i);
          }
        }
        facts.sort((a, b) => a - b);
        return reply(`Factors of ${n}: ${facts.join(', ')}`);
      }

      case 'gcf': {
        const m = /^gcf\s+(-?\d+)\s+(-?\d+)\s*$/i.exec(text);
        const a = parseInt(m[1], 10), b = parseInt(m[2], 10);
        return reply(`gcf(${a}, ${b}) = ${gcd(a, b)}`);
      }

      case 'lcm': {
        const m = /^lcm\s+(-?\d+)\s+(-?\d+)\s*$/i.exec(text);
        const a = parseInt(m[1], 10), b = parseInt(m[2], 10);
        return reply(`lcm(${a}, ${b}) = ${lcm(a, b)}`);
      }

      case 'simplify': {
        const m = /^simplify\s+(-?\d+)\s*\/\s*(-?\d+)\s*$/i.exec(text);
        const a = parseInt(m[1], 10), b = parseInt(m[2], 10);
        return reply(simplifyFractionText(a, b));
      }

      case 'encourage':
        return reply("You’re not stuck—you’re pre-moving. Define every noun, draw a 10-second sketch, then try one tiny move. I’m here. 🍧");

      case 'fallback':
      default:
        return [
          reply("I felt that. Try a thing like:"),
          reply("• `15% of 80`  • `7*8+12`  • `simplify 12/18`  • `gcf 18 24`"),
          reply("or say `tip` for a study booster."),
        ].join('<br>');
    }
  } catch (err) {
    return reply(`My brain had a brain freeze 🥶: ${escapeHTML(err.message)}. Try \`help\`.`);
  }
}
