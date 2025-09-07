// /src/modes/mathTips/grampyBrainV2.js
// Grampy P — hybrid brain
// Flow: mood/greet/thanks → compound shortcuts → FOOD intercept → normalize-first math → inline sniff → tiles → intents → teach
// MobX-safe memory writes. Handles slash-combos and a few common typos.

import { appState } from '../../data/appState.js';
import { composeReply } from './conversationPolicy.js';
import { fallbackLogger } from './fallbackLogger.js';
import { evaluate, getIntentCount } from './intentEngine.js';
import { tileReply } from './tiles/tileEngine.js';
import { runInAction } from 'mobx';

import {
  SAFE_EXPR,
  evalSafeExpression,
  parseLooseFraction,
  toSimpleString,
  normalizeWordsForMath
} from './mathSafe.js';

// ── MobX-safe botContext ─────────────────────────────────────────────────────
function ensureBotContext() {
  runInAction(() => {
    if (!appState.progress) appState.progress = {};
    if (!appState.progress.mathtips) appState.progress.mathtips = {};
    if (!appState.progress.mathtips.botContext) {
      appState.progress.mathtips.botContext = {
        lastTopic:  null,
        lastIntent: null,
        lastAnswer: null,
        updatedAt:  0
      };
    } else {
      const bc = appState.progress.mathtips.botContext;
      if (!('lastTopic'  in bc)) bc.lastTopic  = null;
      if (!('lastIntent' in bc)) bc.lastIntent = null;
      if (!('lastAnswer' in bc)) bc.lastAnswer = null;
      if (!('updatedAt'  in bc)) bc.updatedAt  = 0;
    }
  });
  return appState.progress.mathtips.botContext;
}

function stripHtml(s=''){ return String(s).replace(/<[^>]*>/g,'').trim(); }
function remember({ topic=null, intent=null, answerHtml=null }){
  const bc = ensureBotContext();
  runInAction(() => {
    if (topic !== null)  bc.lastTopic  = topic;
    if (intent !== null) bc.lastIntent = intent;
    if (answerHtml)      bc.lastAnswer = stripHtml(answerHtml).slice(0,400);
    bc.updatedAt = Date.now();
  });
}
function finish(html, meta = {}) {
  try {
    remember({ topic: meta.topic || null, intent: meta.intent || null, answerHtml: html });
    // lightweight marker for test logs or dev console
    try { globalThis.__lastIntent = meta.intent || null; } catch {}
  } catch {}
  return html;
}

// ── quick typo normalizer (small whitelist) ───────────────────────────────────
function spellishNormalize(text='') {
  return String(text)
    .replace(/\bsqa?u?re\b/gi, 'square')          // sqaure/squre/swaure → square
    .replace(/\bsquareroots?\b/gi, 'square roots')
    .replace(/\bmulitply\b/gi, 'multiply')
    .replace(/\bquesa?dil+as?\b/gi, 'quesadillas') // quesdilla/quesadillas
    .replace(/\bsnow\s*cones?\b/gi, 'snowcone')
    .trim();
}


// ── early guards: greet / thanks / mood ───────────────────────────────────────
function greetGuard(text){
  const s = String(text || '').trim().toLowerCase();
  if (!/^(hi|hello|hey|yo|sup|what'?s up|howdy|hola)\b/.test(s)) return null;
  const name = (appState?.profile?.username || 'Friend').trim() || 'Friend';
  const bank = [
    (n)=>`hey ${n}! what’s one tiny thing you want help with?`,
    (n)=>`yo ${n} — pick a lane: % or fractions?`,
    (n)=>`hi ${n}! toss me a mini problem.`
  ];
  return bank[Math.floor(Math.random()*bank.length)](name);
}
function thanksGuard(text){
  const s = String(text || '').trim().toLowerCase();
  if (!/^(thanks|thank you|thx|ty|appreciate\s+it)\b/.test(s)) return null;
  const name = (appState?.profile?.username || 'Friend').trim() || 'Friend';
  const bank = [
    (n)=>`anytime, ${n}. want a quick % or a fraction?`,
    (n)=>`you got it, ${n}. need one more rep?`,
    (n)=>`locked. tiny move next?`
  ];
  return bank[Math.floor(Math.random()*bank.length)](name);
}
// Mood guard (“how are you” variants)
function moodGuard(text){
  const s = String(text || '').trim().toLowerCase();
  if (!/\b(how\s+are\s+you|how\s+ya\s+do(?:in|ing)|how\s*r\s*u|hru|vibe\s*check|how(?:’|')?s\s+it\s+going|you\s+good|how\s+you\s+feel)\b/i.test(s)) return null;
  const name = (appState?.profile?.username || 'Friend').trim() || 'Friend';
  const bank = [
    (n)=>`doing alright, ${n}. got a tiny problem for me?`,
    (n)=>`good vibes. want a quick % or a fraction rep?`,
    (n)=>`charging up. toss me one mini problem.`
  ];
  return bank[Math.floor(Math.random()*bank.length)](name);
}

// ── food helpers (reliable, not dependent on intent engine) ───────────────────
const FOODS = ['quesadillas','spicy mango snowcone','campfire nachos'];
function nextFav(){
  const bc = ensureBotContext();
  let i = Number(bc.foodIndex|0);
  const f = FOODS[i % FOODS.length];
  runInAction(()=>{ bc.foodIndex = (i+1) % FOODS.length; });
  return f;
}
function favLine(f){
  const others = FOODS.filter(x=>x!==f);
  return `mmm, <strong>${f}</strong>. also got love for ${others[0]} and ${others[1]}.`;
}
function canonicalFoodFrom(text){
  const s = String(text).toLowerCase();
  if (/\bquesadillas?\b/.test(s)) return 'quesadillas';
  if (/\b(mango\s+)?snowcone\b/.test(s)) return 'spicy mango snowcone';
  if (/\b(?:campfire\s+)?nachos?\b/.test(s)) return 'campfire nachos';
  return null;
}

// Smalltalk / recipe handler for quesadillas, mango snowcone, campfire nachos.
// Dependencies in scope: composeReply, spellishNormalize, nextFav, favLine, canonicalFoodFrom.
function foodIntercept(text) {
  const raw = String(text || '');
  const s = spellishNormalize(raw).toLowerCase().trim();

  // ── fixed shorthands
  if (/^quesadilla\s+wisdom\??$/.test(s)) {
    return composeReply({
      userText: raw,
      part: { kind: 'answer', html: 'pan medium heat → tortilla → cheese → fold → golden both sides (2–3 min/side). ratio: 1 tortilla : 1/2 cup cheese • add-ins: beans, onion, peppers — small handful.' },
      askAllowed: false
    });
  }
  if (/^mango\s+snowcone\s+mode\??$/.test(s)) {
    return composeReply({
      userText: raw,
      part: { kind: 'answer', html: 'spicy mango snowcone mode: shaved ice → mango syrup → tiny chili dust → lime squeeze. festival fuel secured.' },
      askAllowed: false
    });
  }
  if (/^nacho\s+night\s+energy\??$/.test(s)) {
    return composeReply({
      userText: raw,
      part: { kind: 'answer', html: 'campfire nachos protocol: chips → cheese → beans → repeat layers → foil → low flame till melty; finish with jalapeño + crema.' },
      askAllowed: false
    });
  }

  // ── “tell/teach me about …” / “what do you know about …”
  if (/\b(tell\s+me\s+(?:more\s+)?about|teach\s+me\s+about|what\s+do\s+you\s+know\s+about)\b/.test(s)) {
    if (/\bquesadillas?\b/.test(s)) {
      return composeReply({
        userText: raw,
        part: { kind: 'answer', html: 'pan medium heat → tortilla → cheese → fold → golden both sides (2–3 min/side). ratio: 1 tortilla : 1/2 cup cheese • add-ins: beans, onion, peppers — small handful. want the mathy version? say <code>quesa math</code>.' },
        askAllowed: false
      });
    }
    if (/\bsnowcone\b/.test(s) || /\bsnow\s*cones?\b/.test(s)) {
      return composeReply({
        userText: raw,
        part: { kind: 'answer', html: 'spicy mango snowcone: shaved ice → mango syrup → tiny chili dust → lime squeeze.' },
        askAllowed: false
      });
    }
    if (/\b(?:campfire\s+)?nachos?\b/.test(s)) {
      return composeReply({
        userText: raw,
        part: { kind: 'answer', html: 'campfire nachos: chips → cheese → beans → repeat layers → foil → low flame till melty; finish with jalapeño + crema.' },
        askAllowed: false
      });
    }
  }

  // ── recipe / “how to make …”
  if (/\b(how\s+to|how\s+do\s+you\s+(make|cook)|recipe\s+for)\b/.test(s) &&
      /\b(quesadillas?|snow\s*cones?|snowcone|(?:campfire\s+)?nachos?)\b/.test(s)) {
    let html = '';
    if (/\bquesadillas?\b/.test(s)) {
      html = 'pan medium heat → tortilla → cheese → fold → golden both sides (2–3 min/side). ratio: 1 tortilla : 1/2 cup cheese • add-ins: beans, onion, peppers — small handful.';
    } else if (/\bsnowcone\b/.test(s) || /\bsnow\s*cones?\b/.test(s)) {
      html = 'spicy mango snowcone: shaved ice → mango syrup → tiny chili dust → lime squeeze.';
    } else {
      html = 'campfire nachos: chips → cheese → beans → repeat layers → foil → low flame till melty; finish with jalapeño + crema.';
    }
    return composeReply({ userText: raw, part: { kind: 'answer', html }, askAllowed: false });
  }

  // ── “favorite <food>”
  if (/\bfavou?rite\b/.test(s) &&
      /\b(quesadillas?|snow\s*cones?|snowcone|(?:campfire\s+)?nacho(?:s|es)?)\b/.test(s)) {
    const canon = canonicalFoodFrom(s) || nextFav();
    return composeReply({
      userText: raw,
      part: { kind: 'answer', html: `mmm, <strong>${canon}</strong> all day.` },
      askAllowed: false
    });
  }

  // ── general favorites / what foods do you like
  if (/\bfavou?rite\b.*\b(food|foods|snacks?|meals?)\b/i.test(s) ||
      /\bwhat\s+(?:food|foods)\s+do\s+you\s+like\b/i.test(s) ||
      /\byour\s+(top|favou?rite)\s+(3|three)\s+foods?\b/i.test(s) ||
      /\bwhat\s+do\s+you\s+like\s+(?:to\s+eat|for\s+snacks?)\b/i.test(s)) {
    const f = nextFav();
    const html = `top three, easy: <strong>quesadillas</strong>, <strong>spicy mango snowcone</strong>, <strong>campfire nachos</strong>. right now I’m craving ${f}.`;
    return composeReply({ userText: raw, part: { kind: 'answer', html }, askAllowed: false });
  }

  // ── “do/u/so you/you like … ?”
  const likeM = s.match(/\b(?:do\s+you|u|so\s+you|you)\s+like\b.*\b(quesadillas?|snow\s*cones?|snowcone|(?:campfire\s+)?nacho(?:s|es)?)\b/i);
  if (likeM) {
    const phrase = likeM[1];
    const liked = canonicalFoodFrom(phrase) || nextFav();
    const html = `oh 100% — <strong>${liked}</strong> is a vibe. and ${favLine(nextFav())}`;
    return composeReply({ userText: raw, part: { kind: 'answer', html }, askAllowed: false });
  }

  // “favorite cone?”
  if (/\bfavou?rite\b.*\bcone\b/i.test(s) || /\b(favorite|favourite)\s+snowcone\b/i.test(s)){
    return composeReply({
        userText: raw,
        part: { kind:'answer', html:'mmm, <strong>spicy mango snowcone</strong> all day.' },
        askAllowed: false
    });
  }

   // “what’s your favorite cone?”
  if (/\bwhat'?s\s+your\s+favou?rite\s+cone\b/i.test(s)){
    return composeReply({
        userText: raw,
        part: { kind:'answer', html:'<strong>spicy mango snowcone</strong> — mango syrup + tiny chili + lime.' },
        askAllowed: false
    });
  }


  // ── single keyword pings
  if (/^(?:quesadillas?|snow\s*cones?|snowcone|(?:campfire\s+)?nachos?)\??$/i.test(s)) {
    const canon = canonicalFoodFrom(s) || nextFav();
    return composeReply({ userText: raw, part: { kind: 'answer', html: favLine(canon) }, askAllowed: false });
  }

  return null;
}

function algebraIntercept(text){
  const s = String(text||'').toLowerCase();

  if (/y\s*\+?\s*m\s*x\s*\+\s*b/.test(s) || /y\s*=\s*m\s*x\s*\+\s*b/.test(s)){
    return composeReply({
      userText: text,
      part:{ kind:'answer',
        html:'That’s slope-intercept form: <code>y = mx + b</code>. <em>m</em> is slope, <em>b</em> is y-intercept.'
      },
      noAck:true
    });
  }

  if (/\ba\s*(?:squared|2)\s*\+\s*b\s*(?:squared|2)\s*=\s*c\s*(?:squared|2)\b/.test(s)){
    return composeReply({
      userText: text,
      part:{ kind:'answer',
        html:'Pythagorean theorem: <code>a² + b² = c²</code> for right triangles.'
      },
      noAck:true
    });
  }

  return null;
}


// ── compound shortcuts: support "x / y / z" one-liners ───────────────────────
function compoundShortcuts(text){
  const raw = String(text||'');
  if (!/[\/•,]/.test(raw)) return null;
  const parts = raw.split(/[\/•,]/).map(t=>t.trim()).filter(Boolean);
  const out = [];
  for (const p of parts) {
    const f = foodIntercept(p);
    if (f) out.push(f);
  }
  if (!out.length) return null;
  return out.join('<br>');
}

// ── math normalizer (wordy ops → tokens) ─────────────────────────────────────
const NUM_TOKEN =
  '(\\d+\\s+\\d+\\s*\\/\\s*\\d+|\\d+\\s*\\/\\s*\\d+|-?\\d+(?:\\.\\d+)?%?)';

const OP_WORDS = {
  add: ['plus','add','and','sum'],
  sub: ['minus','subtract','less'],
  mul: ['times','multiplied by','multiply','x','*','×','·','by'],
  div: ['divided by','over','÷','/','divide']
};

function opRegex(words) {
  const w = words.map(s => s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
  return new RegExp(
    `(?:what\\s+is\\s+|calc\\s+|compute\\s+)?${NUM_TOKEN}\\s+(?:${w})\\s+${NUM_TOKEN}`,
    'i'
  );
}
function normalizeWordyOp(text) {
  const T = normalizeWordsForMath(String(text));

  const tryOps = [
    ['+', opRegex(OP_WORDS.add)],
    ['-', opRegex(OP_WORDS.sub)],
    ['*', opRegex(OP_WORDS.mul)],
    ['/', opRegex(OP_WORDS.div)],
  ];

  for (const [sym, re] of tryOps) {
    const m = T.match(re);
    if (!m) continue;
    try {
      const A = parseLooseFraction(m[1]);
      const B = parseLooseFraction(m[2]);
      return `${toSimpleString(A)} ${sym} ${toSimpleString(B)}`;
    } catch {}
  }

  // "X of Y" → multiply (ASCII *)
  const ofRe = new RegExp(`${NUM_TOKEN}\\s+of\\s+${NUM_TOKEN}`, 'i');
  const mo = T.match(ofRe);
  if (mo) {
    try {
      const A = parseLooseFraction(mo[1]);
      const B = parseLooseFraction(mo[2]);
      return `${toSimpleString(A)} * ${toSimpleString(B)}`;
    } catch {}
  }
  return null;
}


// helper (put once near the top of the file)
function gcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

// ── inline calc sniff (digits/ops or √n). Skip wordy ops. ────────────────────
function maybeInlineMath(text) {
  const raw = String(text || '').trim();

  // Allow leading-dot decimals, e.g. ".5" → "0.5"
  const patchedRaw = raw.replace(/(^|\s)\.(\d)/g, '$10.$2');

  // Canonicalize commas
  const cleaned = patchedRaw.replace(/,/g, '');

  // 0) Special case: "a/b / c/d" → rational division with exact result
  const fracOverFrac = cleaned.match(/^\s*(\d+\s*\/\s*\d+)\s*(?:\/|÷)\s*(\d+\s*\/\s*\d+)\s*$/);
  if (fracOverFrac) {
    const [a, b] = fracOverFrac.slice(1);
    const [n1, d1] = a.split('/').map(x => Number(x.trim()));
    const [n2, d2] = b.split('/').map(x => Number(x.trim()));
    if (d1 && d2) {
      const num = n1 * d2;
      const den = d1 * n2;
      const g   = gcd(num, den);
      const dec = num / den;
      // Prefer a clean integer when exact; otherwise show simplified fraction
      const show = Number.isInteger(dec) ? String(dec) : `${num / g}/${den / g}`;
      return `${a.trim()} / ${b.trim()} = <strong>${show}</strong>`;
    }
  }

  // 1) direct root words: "sqrt 169" / "square root of 49"
  const mRoot = cleaned.match(/^(?:sqrt|square\s*root(?:\s*of)?)\s*\(?\s*(-?\d+(?:\.\d+)?)\s*\)?\s*$/i);
  if (mRoot) {
    const x = Number(mRoot[1]);
    if (Number.isFinite(x) && x >= 0) {
      const r = Math.sqrt(x);
      const pretty = Number.isInteger(r) ? r : Number(r.toFixed(6)).toString().replace(/\.?0+$/, '');
      return `${raw} → <strong>${pretty}</strong>`;
    }
    return null; // negative/NaN → let intents teach
  }

  // 2) literal √n
  const rootSym = cleaned.match(/^√\s*\(?\s*(-?\d+(?:\.\d+)?)\s*\)?\s*$/i);
  if (rootSym) {
    const x = Number(rootSym[1]);
    if (Number.isFinite(x) && x >= 0) {
      const r = Math.sqrt(x);
      const pretty = Number.isInteger(r) ? r : Number(r.toFixed(6)).toString().replace(/\.?0+$/, '');
      return `√${rootSym[1]} = <strong>${pretty}</strong>`;
    }
    return null;
  }

  // 3) if wordy ops appear, defer to normalizer/intents (esp. "of")
  if (/\b(plus|minus|times|multiplied|multiply|divided|divide|over|by|of)\b/i.test(cleaned)) {
    return null;
  }

  // 4) expression sniff with sqrt() substitution inside mixed expressions
  //    (e.g., "sqrt 5 * sqrt 7")
  const exprSrc = cleaned.replace(/\bsqrt\s*\(?\s*(\d+(?:\.\d+)?)\s*\)?/gi, (_, n) => `(${Math.sqrt(Number(n))})`);
  const matches = exprSrc.match(/[0-9+\-*/^().\s]+/g);
  if (!matches) return null;

  const expr = matches
    .map(s => s.trim())
    .filter(s => /\d/.test(s))
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


function escapeHTML(s){
  return String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}

// ── Main entry ────────────────────────────────────────────────────────────────
const DEBUG_INTENT_PICK = false;

function preNormalize(s) {
  return String(s)
    .replace(/\bsqrt(\d+)\b/ig, 'sqrt $1')   // "sqrt169" → "sqrt 169"
    .replace(/(^|[^0-9])\.(\d)/g, '$10.$2')  // ".5" → "0.5" (even inside longer strings)
    .replace(/\s+/g, ' ')
    .trim();
}


function nameGuard(text){
  const s = String(text||'').trim().toLowerCase();
  if (!/\b(what'?s|whats)\s+your\s+name(?:\s+though)?\b/.test(s)) return null;
  return 'Grampy P';
}

function helpGuard(text){
  const s = String(text||'').trim().toLowerCase();
  if (!/^help$/.test(s)) return null;
  return composeReply({
    userText: text,
    part: {
      kind: 'answer',
      html: [
        'Keep it tiny — examples:',
        '15% of 80 → 12 • simplify 12/18 → 2/3 • sqrt 169 → 13',
        'Say <code>fractions 2</code> or <code>percent 2</code> for a tiny set.',
        'Say <code>deal 3</code> for 3 multiplication facts.'
      ].join('<br>')
    },
    noAck: true
  });
}

function commandGuard(text){
  const s = String(text||'').trim().toLowerCase();

  // "deal 2|3" → mini multiplication facts
  const deal = s.match(/\bdeal\s*(2|3)\b/);
  if (deal){
    const n = Number(deal[1]);
    const facts = [];
    for (let i=0;i<n;i++){
      const a = 2 + Math.floor(Math.random()*10);
      const b = 2 + Math.floor(Math.random()*10);
      facts.push(`${a} × ${b} → ${a*b}`);
    }
    return composeReply({
      userText: text,
      part: { kind:'answer', html:`mini deck:<br>${facts.join(' • ')}` },
      noAck: true
    });
  }

  // “fractions 2” / “percent 2”
  if (/^fractions?\s*2$/i.test(s)){
    return composeReply({
      userText: text,
      part: { kind:'answer', html:'try these:<br>1/2 + 1/3 → ? • simplify 12/18 → ?' },
      noAck: true
    });
  }
  if (/^percent\s*2$/i.test(s)){
    return composeReply({
      userText: text,
      part: { kind:'answer', html:'try these:<br>15% of 80 → ? • 7.5% of 120 → ?' },
      noAck: true
    });
  }

  // Simple “yes” follow-up — not session-aware, but keeps the flow moving.
  if (/^(y|ya|yes|sure|ok(ay)?)$/.test(s)){
    return composeReply({
      userText: text,
      part: { kind:'answer', html:'cool — say <code>fractions 2</code>, <code>percent 2</code>, or <code>deal 3</code>.' },
      noAck: true
    });
  }

  return null;
}

function likeMathGuard(text){
  const s = String(text||'').trim().toLowerCase();
  if (!/\b(do|you)\s+like\s+math\b/.test(s)) return null;
  return composeReply({
    userText: text,
    part: { kind:'answer', html:'oh yeah — math is just patterns. toss me one: <code>sqrt 169</code> or <code>15% of 80</code>.' },
    noAck: true
  });
}



export function getResponse(userText) {
  const text = preNormalize(spellishNormalize(String(userText || '')));

  // 1) smalltalk guards
  const g = greetGuard(text); if (g) return finish(g, { intent:'greet', topic:'smalltalk' });
  const m = moodGuard(text);  if (m) return finish(m, { intent:'mood',  topic:'smalltalk' });
  const t = thanksGuard(text);if (t) return finish(t, { intent:'thanks',topic:'smalltalk' });

  // 1.5) **new quick guards**
  const nm = nameGuard(text); if (nm) return finish(nm, { intent:'name', topic:'smalltalk' });
  const cg = commandGuard(text); if (cg) return finish(cg, { intent:'command', topic:'ui' });
  const hg = helpGuard(text); if (hg) return finish(hg, { intent:'help', topic:'ui' });
  const lm = likeMathGuard(text); if (lm) return finish(lm, { intent:'smalltalk_math', topic:'smalltalk' });

  // 2) slash-combo shortcuts (food modes)
  const combo = compoundShortcuts(text);
  if (combo) return finish(combo, { intent:'food_combo', topic:'smalltalk' });

  // 3) FOOD intercept
  const food = foodIntercept(text);
  if (food) return finish(food, { intent:'food', topic:'smalltalk' });

  // 3.5) **algebra intercepts**
  const alg = algebraIntercept(text);
  if (alg) return finish(alg, { intent:'algebra', topic:'algebra' });

  // right before normalize-first:
  if (/\btimes\s+fractions?\b/i.test(text)){
    return finish(
        composeReply({
        userText: text,
        part:{ kind:'answer', html:'Multiply tops, multiply bottoms, then simplify. 2/3 × 3/5 → 6/15 = 2/5.' },
        noAck:true
        }),
        { intent:'frac_mul', topic:'fractions' }
    );
  }

  // 4) normalize-first for wordy math → tokens
  try {
    const normalized = normalizeWordyOp(text);
    if (normalized && normalized !== text) {
      // If it’s a plain safe expression and not an "of" phrase, try direct compute first.
      if (SAFE_EXPR.test(normalized) && !/\bof\b/i.test(normalized)) {
        try {
          const v = evalSafeExpression(normalized);
          const clean = Number.isInteger(v) ? v : Number(v.toFixed(6));
          return finish(`${escapeHTML(normalized)} = <strong>${clean}</strong>`, { intent:'wordy_calc', topic:'calc' });
        } catch {}
      }
      // Let intents try (nice fraction formatting, etc.)
      const bestN = evaluate(normalized);
      if (DEBUG_INTENT_PICK) { try{ console.log('🧭 intent pick (normalized) →', bestN?.key, bestN?.score); }catch{} }
      if (bestN && typeof bestN.handler==='function') {
        const htmlN = bestN.handler({ text: normalized });
        const outN  = typeof htmlN==='string' ? htmlN : String(htmlN ?? '');
        return finish(outN, { intent: bestN.key, topic: bestN.topic || null });
      }
      // last-ditch: compute if it's SAFE_EXPR
      if (SAFE_EXPR.test(normalized)) {
        try {
          const v = evalSafeExpression(normalized);
          const clean = Number.isInteger(v) ? v : Number(v.toFixed(6));
          return finish(`${escapeHTML(normalized)} = <strong>${clean}</strong>`, { intent:'wordy_calc', topic:'calc' });
        } catch {}
      }
    }
  } catch(e){ console.warn('normalize-first error:', e); }

  // 5) inline calc sniff
  const sniff = maybeInlineMath(text);
  if (sniff) return finish(sniff, { intent:'inline_calc', topic:'calc' });

  const n = nameGuard(text);
  if (n) return finish(
    composeReply({ userText: text, part: { kind:'answer', html: n }, askAllowed: false }),
    { intent:'bot_name_exact', topic:'smalltalk' }
  );


  // 6) conversational tiles
  try {
    const tRes = tileReply(text);
    if (tRes && tRes.html) return finish(tRes.html, { intent: tRes.meta?.intent, topic: tRes.meta?.topic });
  } catch(e){ console.warn('🧱 tile engine error:', e); }

  // 7) intent engine
  try {
    const best = evaluate(text);
    if (DEBUG_INTENT_PICK) { try{ console.log('🧭 intent pick →', best?.key, best?.score, '(total intents:', getIntentCount?.() ?? 'n/a', ')'); }catch{} }
    const FRACTION_KEYS = new Set(['frac_add','frac_sub','frac_mul','frac_div','frac_of','to_mixed','to_improper','frac_compare','frac_order']);
    if (best && typeof best.handler==='function'){
      if (best.key && FRACTION_KEYS.has(best.key)) {
        const htmlA = best.handler({ text });
        const outA  = typeof htmlA==='string' ? htmlA : String(htmlA ?? '');
        return finish(outA, { intent: best.key, topic: best.topic || null });
      }
      const normalized = normalizeWordyOp(text);
      if (normalized && normalized !== text) {
        const bestN = evaluate(normalized);
        if (bestN && typeof bestN.handler==='function'){
          const htmlN = bestN.handler({ text: normalized });
          const outN  = typeof htmlN==='string' ? htmlN : String(htmlN ?? '');
          return finish(outN, { intent: bestN.key, topic: bestN.topic || null });
        }
      }
      const htmlB = best.handler({ text });
      const outB  = typeof htmlB==='string' ? htmlB : String(htmlB ?? '');
      return finish(outB, { intent: best.key, topic: best.topic || null });
    }
  } catch(e){ console.error('💥 evaluate/handler error:', e); }

// 8) graceful teach fallback (no ACK) + log
try {
  runInAction(() => {
    const bc = ensureBotContext();
    bc.confusionCount = (bc.confusionCount || 0) + 1;
  });
  fallbackLogger.add(String(text).trim().toLowerCase());
} catch {}


}

// (optional helper still around if you need it elsewhere)
const RE_QUESA    = /\bquesa?d(?:i|e)?l{1,2}a?s?\b/i;
const RE_SNOWCONE = /\b(mango\s+)?snow\s*cones?\b/i;
const RE_NACHOS   = /\b(?:campfire\s+)?nachos?\b/i;

function hasFoodCue(text) {
  const s = String(text || '');
  if (RE_QUESA.test(s) || RE_SNOWCONE.test(s) || RE_NACHOS.test(s)) return true;
  if (/\bfavou?rite\b.*\b(food|snack|meal)\b/i.test(s)) return true;
  if (/\bwhat\s+do\s+you\s+like\b.*\b(food|snack|meal|to\s+eat|for\s+snacks?)\b/i.test(s)) return true;
  if (/\bwhat\s+(?:food|foods)\s+do\s+you\s+like\b/i.test(s)) return true;
  if (/\b(?:do\s+you\s+like|so\s+you\s+like|you\s+like|u\s+like)\b/i.test(s)) return true;
  if (/\b(how\s+to|how\s+do\s+you\s+(make|cook)|recipe)\b/i.test(s)) return true;
  return false;
}

export default { getResponse };
