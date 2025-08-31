// /src/modes/mathTips/qabot.js
import { matcher, matcherAnyMath } from './matcher.js';
import data from './qabotDATA.js';
import { fallbackLogger } from './fallbackLogger.js';
import { appState } from '../../data/appState.js';
import { composeReply } from './conversationPolicy.js';

// ——— Utilities ———
function escapeHTML(s) {
  return String(s)
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#39;');
}
function html(s){ return escapeHTML(s); }
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function n(x,d=0){ const v=+x; return Number.isFinite(v)?v:d; }

// ——— Math safety ———
const SAFE_EXPR = /^[\d\s+\-*/^().]+$/;
function evalSafeExpression(expr){
  const raw=String(expr).trim();
  if(!raw||raw.length>120) throw new Error('Too long');
  if(!SAFE_EXPR.test(raw)) throw new Error('Unsafe chars');
  const jsExpr = raw.replaceAll('^','**');
  if (/[*\/+]{2,}/.test(jsExpr)) throw new Error('Bad operator seq');
  // eslint-disable-next-line no-new-func
  const val = Function(`"use strict"; return (${jsExpr});`)();
  if(!Number.isFinite(val)) throw new Error('Not finite');
  return val;
}
function tryPercentOf(text){
  const m=/(-?\d+(?:\.\d+)?)\s*%\s*of\s*(-?\d+(?:\.\d+)?)/i.exec(text);
  if(!m) return null;
  const p=parseFloat(m[1]); const num=parseFloat(m[2]);
  if(!Number.isFinite(p)||!Number.isFinite(num)) return null;
  return { p, n:num, ans:(p/100)*num };
}
function gcd(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){[a,b]=[b,a%b];} return a||1; }
function lcm(a,b){ return Math.abs(a*b)/gcd(a,b); }
function simplifyFractionText(a,b){
  if(!Number.isFinite(a)||!Number.isFinite(b)||b===0) return "That fraction is undefined, amigo.";
  const g=gcd(a,b); return `${a}/${b} → ${a/g}/${b/g}`;
}

// ——— Confidence scoring ———
function scoreIntent(input) {
  const lower = input.toLowerCase();

  // Strong signals
  if (/^\/?(help|commands|stats|tip|clear|reset)\b/.test(lower)) return { guess:'command', score:0.99, arg:lower.match(/^\/?(\w+)/)?.[1] };

  if (tryPercentOf(lower)) return { guess:'percent', score:0.95 };
  if (SAFE_EXPR.test(lower)) return { guess:'calc', score:0.9 };

  // Matcher buckets
  if (matcher(lower, 'who_are_you')) return { guess:'who', score:0.8 };
  if (matcher(lower, 'greetings'))  return { guess:'greet', score:0.75 };
  if (matcherAnyMath(lower))        return { guess:'math_general', score:0.7 };
  if (matcher(lower, 'jokes'))      return { guess:'joke', score:0.7 };
  if (matcher(lower, 'lore_badges'))return { guess:'badges', score:0.65 };
  if (matcher(lower, 'lore_cones') || matcher(lower,'lore_snowcone') || matcher(lower,'lore_festival'))
    return { guess:'lore', score:0.6 };

  return { guess:'unknown', score:0.2 };
}

// ——— Public API: single-bubble response ———
export function getResponse(userText, appStateLike = appState) {
  const text = String(userText||'');
  const { guess, score, arg } = scoreIntent(text);

  // Commands: still handled, but we render via the composer so it feels natural.
  if (guess === 'command') {
    let line = '';
    switch (arg) {
      case 'help':
      case 'commands':
        line = "Try `15% of 80`, `7*8+12`, `simplify 12/18`, or ask about cones/badges. Keep it tiny.";
        break;
      case 'stats': {
        const xp = n(appStateLike?.profile?.xp);
        const lvl = n(appStateLike?.profile?.level, Math.floor(xp/100)+1);
        const tips = n(appStateLike?.progress?.mathtips?.completedTips);
        const total= n(appStateLike?.progress?.mathtips?.totalTips, Math.max(10,tips));
        line = `Level ${lvl}, XP ${xp}, Tips ${tips}/${total}.`;
        break;
      }
      case 'tip':
        line = pick(data.math_general) || "Write the next step, even if messy.";
        try { if (typeof appStateLike.addXP==='function') appStateLike.addXP(1); } catch {}
        break;
      case 'clear':
        // soft clear handled by UI elsewhere; here we just acknowledge
        line = "Cleared my short-term memory.";
        break;
      case 'reset':
        line = "Fresh slate. Let’s roll.";
        break;
      default:
        line = "Command unknown. Try `/help`.";
    }
    return { html: composeReply({ userText:text, part:{ kind:'answer', html: html(line) }, askAllowed:true }) };
  }

  // High-confidence math
  if (guess === 'percent' || guess === 'calc') {
    try {
      if (guess === 'percent') {
        const p = tryPercentOf(text);
        const clean = Number.isInteger(p.ans) ? p.ans : Number(p.ans.toFixed(4));
        const ans = `${p.p}% of ${p.n} = <strong>${clean}</strong>`;
        return { html: composeReply({ userText:text, part:{ kind:'answer', html: html(ans) }, askAllowed:true }) };
      } else {
        const val = evalSafeExpression(text);
        const clean = Number.isInteger(val) ? val : Number(val.toFixed(6));
        const ans = `${escapeHTML(text)} = <strong>${clean}</strong>`;
        return { html: composeReply({ userText:text, part:{ kind:'answer', html: html(ans) }, askAllowed:true }) };
      }
    } catch (err) {
      const freeze = `Brain freeze: ${escapeHTML(err.message)}.`;
      return { html: composeReply({ userText:text, part:{ kind:'answer', html: html(freeze) }, askAllowed:false }) };
    }
  }

  // Mid-confidence: answer from your banks (no re-intro), short and warm
  if (score >= 0.6) {
    let line = '';
    switch (guess) {
      case 'who':   line = pick(data.who_are_you); break;
      case 'greet': line = pick(data.greetings);   break;
      case 'joke':  line = pick(data.jokes);       break;
      case 'badges':line = pick(data.lore_badges); break;
      case 'lore':  line = pick([...data.lore_cones, ...data.lore_snowcone, ...data.lore_festival]); break;
      case 'math_general':
        line = pick([
          ...data.math_general,
          ...data.math_arithmetic,
          ...data.math_algebra,
          ...data.math_geometry,
          ...data.math_trigonometry,
          ...data.math_calculus
        ]);
        break;
      default:
        line = "Let’s keep it tiny — what’s the goal?";
    }
    return { html: composeReply({ userText:text, part:{ kind:'answer', html: html(line) }, askAllowed:true }) };
  }

  // Low-confidence: TEACH by 2 examples, not a manual
  try { fallbackLogger.add(text); } catch {}
  const topicGuess = /%/.test(text) ? 'percent'
                    : /\/|simplify|fraction/.test(text) ? 'fractions'
                    : 'arithmetic';
  return { html: composeReply({ userText:text, part:{ kind:'teach', html:'', topicGuess }, askAllowed:true }) };
}
