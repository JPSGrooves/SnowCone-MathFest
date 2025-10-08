// src/modes/mathTips/qabot.js
import { matcher, matcherAnyMath } from './matcher.js';
import { appState } from '../../data/appState.js';
import { composeReply, PERSONA } from './conversationPolicy.js';
import { getMode, setMode, MODES } from './modeManager.js';
import { interpret } from './phrasebook.js';
import { renderBoothsHelp } from './modes/status.js';

// route directly through the registry we export
import * as MODEx from './modes/index.js'; // ensure this is at top
import { runInAction } from 'mobx';
import * as quiz from './modes/quiz.js';
import { classifySmallTalk, respondSmallTalk } from './smalltalk.js';
import { maybeHandleSmallTalk } from './smalltalk.js';
import { pickRecipeTopic } from './modes/recipes.js';




const getSessionId = (app) =>
  app?.progress?.mathtips?.sessionId   // ✅ use the same id quiz.js uses
  || app?.profile?.id
  || app?.sessionId
  || 'default';



const act = (fn) => { try { runInAction(fn); } catch { fn(); } };

// ── Card detection (treat these as already "layered") ─────────────────
// put this near other tiny helpers in mathTips.js
export function alreadyHasCard(html = '') {
  const s = String(html);
  return /\bmt-(?:response|layer|lecture)-card\b/.test(s)
      || /\bmt-quiz-list\b/.test(s)
      || /\bbooth-card\b/.test(s);
}

// put this helper near other tiny helpers
function clearSmalltalkThread() {
  try { ensureBC().lastSTopic = null; } catch {}
}


// Map user/registry keys to the modeManager key for MODES
function modesKey(k = '') {
  if (/^recipe(s)?$/i.test(k)) return (MODES.recipe ? 'recipe' : 'recipes');
  return k;
}



// Layered booth menu card used by fallbacks/help (no extra "Alright, friend..." ack)
// ⬇️ Replace your boothMenuCard with this
function boothMenuHTML(lead = 'Here’s the map — wanna jump into a booth?') {
  return `
    <p>${html(lead)}</p>
    <ul class="mt-menu">
      <li>lessons booth</li>
      <li>quiz booth</li>
      <li>lore booth</li>
      <li>recipe booth</li>
     <li>status booth</li>
      <li>calculator booth</li>
    </ul>
    <p class="mt-dim">Say one of those and I’ll get you going.</p>
  `;
}



function callMode(modeKey, text, extra = {}) {
  const mod = MODEx[modeKey];
  if (!mod) return { text: `<p>${modeKey} booth not found.</p>` };

  const t = String(text ?? '').trim().toLowerCase();
  const isStartish = !t || t === 'start';

  // If we have real user input (e.g., "yes", "more"), route to handle/run first.
  if (!isStartish) {
    if (typeof mod.handle === 'function') return mod.handle(text, extra);
    if (typeof mod.run    === 'function') return mod.run(text, extra);
  }

  // Fresh boot / explicit start
  if (typeof mod.start === 'function') return mod.start(extra);
  if (typeof mod.run   === 'function') return mod.run(text, extra);
  if (typeof mod.handle=== 'function') return mod.handle(text, extra);

  return { text: `<p>${modeKey} booth has no handler.</p>` };
}



// Response banks
const RESPONSES = {
  greetings: [
    "Howdy! What's the vibe today, traveler?",
    "Bruh... the sine lines led you here. What's good?",
    "Yo, cosmic traveler! Ready to vibe with some math?",
    "Hey there! Time to stack some cones and solve mysteries?",
    "Welcome to MathTips Village! Every cone’s got a story."
  ],
  how_are_you: [
    "Vibin' like a sine wave, traveler!",
    "Feelin’ as crisp as a mango snowcone.",
    "Pythagorus Cat’s always got that cosmic crunch.",
    "Neon’s glowin’, syrup’s flowin’. I’m good!",
    "Powered by quesadillas and math vibes."
  ],
  // before: "Ready to vibe, traveler? Try lessons booth or quiz fractions 3."
  who_are_you: [
    "I’m Pythagorus Cat! But my friends call me Grampy P, cousin of Cheshire Cat.",
    "Pythagorus Cat, Grampy P, keeper of the hypotenuse, lover of melted cheese.",
    "The name's Grampy P. Just a cosmic cat slingin’ math and good vibes."
  ],
  // when you build the reply, use: “…try lessons booth or quiz fractions.” instead of “…3.”

  jokes: [
    "Why’d the obtuse angle skip the party? Never right.",
    "Parallel lines? So much in common, but they’ll never meet.",
    "Six is scared of seven ‘cause seven ate nine. Math humor!",
    "The derivative dumped me — said I was too constant.",
    "I tried mindfulness in calculus and finally found my limit.",
    "My study group is a matrix — great table manners, still no determinant.",
    "Opened a math bakery: sizes are ‘π-ish.’ Customers leave approximately happy.",
    "I packed with vectors — brought direction and magnitude, forgot socks.",
    "Running on complex coffee — enough imaginary shots and I feel real.",
    "Gave my heart to a statistician — sample size of one was ‘inconclusive.’",
    "The probability I share fries approaches zero as you approach me.",
    "Our group project claims it’s commutative — order doesn’t matter, they’re still late.",
    "My dog learned exponents — every walk multiplies his energy.",
    "I named my plant Delta — it thrives on small changes.",
    "Geometry party RSVP: I’ll arrive obtusely late.",
    "Numbers at the gym: just working on our figures.",
    "I keep promises like absolute value — no negatives.",
    "Tutor said ‘show your work,’ so I emailed the git history.",
    "My playlist is arithmetic — steady progression, no drops.",
    "The conference swag was a compass — finally, well-rounded merch.",
    "Trying to be more discrete, but my math keeps getting continuous.",
    "I trust triangles — two friends and a solid base.",
    "Server asked ‘how many slices?’ I said ‘k.’ We both pretended that helped."
  ],
  math_general: [
    "Math’s the rhythm of the cosmos, bruh.",
    "Pure sine wave energy. What’s the next step?",
    "Math turns chaos into cone patterns."
  ],
  math_arithmetic: [
    "Arithmetic’s the base of all math... and good snowcones.",
    "Add, subtract, multiply, divide — stack those cones right."
  ],
  math_algebra: [
    "Algebra’s cone-stacking with variables, yo.",
    "Solve for x or chase those cosmic vibes."
  ],
  math_geometry: [
    "Geometry’s sacred. Circles, triangles, cones.",
    "Triangles? Strongest shape in the cosmos."
  ],
  math_calculus: [
    "Calculus is the math of change, like melting cones.",
    "Derivatives? That’s instant cone speed."
  ],
  math_trigonometry: [
    "Trig’s triangle magic, my dude.",
    "Sine’s the flavor curve, cosine’s the edge."
  ]
};

// Utilities
function escapeHTML(s) {
  return String(s)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}
function html(s) { return escapeHTML(s); }
function pick(arr) {
  if (!arr?.length) return '💀 Yo... my brain froze.';
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---- session-unique picker -----------------------------------------------

function ensureBankSeen(sessionId) {
  const bc = ensureBC(); // uses your act() under the hood
  act(() => {
    if (!bc.seen) bc.seen = {};
    if (!bc.seen[sessionId]) bc.seen[sessionId] = {};
  });
  return bc.seen[sessionId];
}

/**
 * Pick a non-repeating item from an array for this session.
 * Resets automatically after exhausting the bank.
 */
function pickUnique(bankKey, arr, sessionId = getSessionId(appState)) {
  const items = Array.isArray(arr) ? arr : [];
  const total = items.length;
  if (!total) return '💀 Yo... my brain froze.';

  const seenBySession = ensureBankSeen(sessionId);
  const used = Array.isArray(seenBySession[bankKey]) ? seenBySession[bankKey] : [];
  const usedSet = new Set(used);

  // reset once exhausted
  if (usedSet.size >= total) {
    act(() => { seenBySession[bankKey] = []; });
    usedSet.clear();
  }

  // choose from remaining indices
  const remaining = [];
  for (let i = 0; i < total; i++) if (!usedSet.has(i)) remaining.push(i);
  const idx = remaining[Math.floor(Math.random() * remaining.length)];

  // persist
  act(() => {
    const next = Array.isArray(seenBySession[bankKey]) ? seenBySession[bankKey].slice(0) : [];
    next.push(idx);
    // keep bounded (not strictly necessary, but tidy)
    if (next.length > total) next.splice(0, next.length - total);
    seenBySession[bankKey] = next;
  });

  return items[idx];
}

/** Optional: clear seen history for a bank (or all) this session */
function clearSeen(bankKey = null, sessionId = getSessionId(appState)) {
  const seen = ensureBankSeen(sessionId);
  act(() => {
    if (bankKey) seen[bankKey] = [];
    else seen[sessionId] = {}; // nuke all banks for this session
  });
}

function n(x, d = 0) { const v = +x; return Number.isFinite(v) ? v : d; }

// Bot-context stash
function ensureProgressRoot(app = appState) {
  // read fast path
  const have = app?.progress?.mathtips?.botContext;
  if (have) return have;

  // create missing branches inside an action
  runInAction(() => {
    if (!app.progress) app.progress = {};
    if (!app.progress.mathtips) app.progress.mathtips = {};
    if (!app.progress.mathtips.botContext) app.progress.mathtips.botContext = {};
  });
  return app.progress.mathtips.botContext;
}

function ensureBC() {
  act(() => {
    if (!appState.progress) appState.progress = {};
    if (!appState.progress.mathtips) appState.progress.mathtips = {};
    if (!appState.progress.mathtips.botContext) appState.progress.mathtips.botContext = {};
  });
  return appState.progress.mathtips.botContext;
}

// put near ensureBC()
function clearBoothContext() {
  const bc = ensureBC();
  act(() => {
    bc.lastBooth = null;
    bc.pendingSwitch = null;
  });
}

// place near other tiny helpers
function lastLessonTopicOrDefault() {
  try { return appState?.progress?.mathtips?.botContext?.lastLessonTopic || 'fractions'; }
  catch { return 'fractions'; }
}


function setPendingSwitch(toMode, lastText) {
  const bc = ensureBC();
  act(() => { bc.pendingSwitch = { to: toMode, at: Date.now(), lastText: String(lastText || '') }; });
}

function consumePendingSwitch() {
  const bc = ensureBC();
  const p = bc.pendingSwitch || null;
  act(() => { bc.pendingSwitch = null; });
  return p;
}


function isAffirmative(s) {
  const t = String(s).toLowerCase();
  return (
    /\b(y(?:es+|ea|ep|up)|yeah|yea|yessir|sure|ok(?:ay)?|alright|bet|roger|10 4|indeed|right on|affirmative)\b/.test(t) ||
    /\b(let'?s\s+go|sounds\s+good|do\s+it|go|switch|please)\b/.test(t) ||
    /^\s*y\s*$/.test(t)
  );
}
function isNegative(s) { return /\b(no|nah|nope|stay|hold|not now|keep|later|n)\b/i.test(s); }

// Math safety
const SAFE_EXPR = /^[\d\s+\-*/^().]+$/;
function evalSafeExpression(expr) {
  const raw = String(expr).trim();
  if (!raw || raw.length > 120) throw new Error('Too long');
  if (!SAFE_EXPR.test(raw)) throw new Error('Unsafe chars');
  const js = raw.replaceAll('^', '**');
  if (/[*\/+]{2,}/.test(js)) throw new Error('Bad operator seq');
  const val = Function(`"use strict"; return (${js});`)();
  if (!Number.isFinite(val)) throw new Error('Not finite');
  return val;
}
function tryPercentOf(text) {
  const m = /(-?\d+(?:\.\d+)?)\s*%\s*of\s*(-?\d+(?:\.\d+)?)/i.exec(text);
  if (!m) return null;
  const p = parseFloat(m[1]); const num = parseFloat(m[2]);
  if (!Number.isFinite(p) || !Number.isFinite(num)) return null;
  return { p, n: num, ans: (p / 100) * num };
}
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; }
function simplifyFractionText(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return "That fraction’s undefined, amigo.";
  const g = gcd(a, b); return `${a}/${b} → ${a/g}/${b/g}`;
}

// ========== Layered card helpers (clone lore look for other booths) ==========
function isAlreadyLayered(s) {
  const str = String(s || '');
  // don't double-wrap if a booth already emits a formatted block
  return /class="(?:mt-layer-card|mt-lecture-card|mt-response-card)\b/.test(str);
}
function isBlockyHtml(s) {
  return /^<(div|ul|ol|section|article|aside)\b/i.test(String(s || '').trim());
}
function paraWrap(s) {
  const t = String(s || '').trim();
  if (!t) return '';
  if (isBlockyHtml(t)) return t;
  if (/^<p[\s>]/i.test(t) && /<\/p>\s*$/.test(t)) return t;
  return `<p>${t}</p>`;
}
function wrapLayerCard(inner, { tone = 'cyan', title = '' } = {}) {
  const head = title ? `<div class="mt-layer-head">${html(title)}</div>` : '';
  return `<div class="mt-layer-card mt-layer--${tone}"><div class="mt-layer-body">${head}${paraWrap(inner)}</div></div>`;
}
function shouldBypassLayer(intentTag) {
  // leave lore completely alone; it already has its perfected presentation
  return typeof intentTag === 'string' && /(^|:)lore\b/.test(intentTag);
}


// Intent scoring
function scoreIntent(input) {
  const lower = input.toLowerCase();
  if (input.trim().length <= 3 && !/^\d+$/.test(input.trim())) {
    return { guess: 'unknown', score: 0.0 };
  }
  if (/^\/?(help|commands|stats|tip|clear|reset)\b/.test(lower)) return { guess: 'command', score: 0.99, arg: lower.match(/^\/?(\w+)/)?.[1] };
  if (tryPercentOf(lower)) return { guess: 'percent', score: 0.95 };
  if (SAFE_EXPR.test(lower)) return { guess: 'calc', score: 0.9 };
  if (matcher(lower, 'who_are_you') || /\bwhat['’]?s\s*your\s*name\b/i.test(lower)) return { guess: 'who', score: 0.8 };
  if (matcher(lower, 'greetings') || /\b(yo|hey|hi|what['’]?s\s*up|nm\s*man)\b/i.test(lower)) return { guess: 'greet', score: 0.75 };
  if (/\bhow\s*are\s*you\b/i.test(lower)) return { guess: 'how_are_you', score: 0.75 };
  if (/\bmath\b/.test(lower)) return { guess: 'math_general', score: 0.75 };
  if (/\bfraction(s)?\s+quiz\b/i.test(lower) || /\bpercent(s)?\s+quiz\b/i.test(lower)) return { guess: 'quiz_fractions', score: 0.7 };
  if (/\bfractions?\b/.test(lower)) return { guess: 'quiz_fractions', score: 0.7 };
  if (/\bpercent\b/.test(lower)) return { guess: 'quiz_percent', score: 0.7 };
  if (matcher(lower, 'jokes')) return { guess: 'joke', score: 0.7 };
  if (matcher(lower, 'lore_badges')) return { guess: 'badges', score: 0.65 };
  if (matcher(lower, 'lore_cones') || matcher(lower, 'lore_snowcone') || matcher(lower, 'lore_festival')) return { guess: 'lore', score: 0.6 };
  return { guess: 'unknown', score: 0.2 };
}

// Soft off-topic hinting
const SOFT_MODE_HINTS = {
  lessons: [/teach|lesson|show me|explain|how to/i],
  quiz: [/quiz|deal|question|practice|test me|drill/i],
  lore: [/lore|story|festival|characters?|backstory|canon/i],
  recipe: [/recipe|recipes|cook|food|quesadilla|snack|kitchen/i], // ← add “recipes”
  calculator: [/calc|calculator|compute|evaluate|=|answer/i],
};

function softModeTarget(text) {
  const t = String(text || '').toLowerCase();

  // 1) hard hints — if any recipe-y word appears, choose recipe first
  if (/(?:\brecipe(?:s)?\b|quesadilla|snow\s*cone|snowcone|nachos|cocoa|cook|kitchen|snack|food)/i.test(t)) {
    return 'recipe';
  }

  // 2) other booths, in sensible order
  if (/(quiz|question|practice|test me|drill)/i.test(t)) return 'quiz';
  if (/(lore|story|festival|characters?|backstory|canon)/i.test(t)) return 'lore';
  if (/(calc|calculator|compute|evaluate|=|answer)/i.test(t)) return 'calculator';

  // 3) lessons last — let "show me" live here only if it didn't contain recipe words
  if (/(teach|lesson|lessons|explain|how to|show me)/i.test(t)) return 'lessons';

  return null;
}


function maybeOffTopicRedirect(userText, currentMode) {
  const t = String(userText || '').toLowerCase().trim();
  const softTo = softModeTarget(t);
  if (softTo && softTo !== currentMode) {
    setPendingSwitch(softTo, userText);
    return composeReply({
      userText,
      part: { kind: 'confirm', html: `Ready to roll into ${softTo} booth?` },
      askAllowed: false,
      noAck: true
    });
  }
  return null;
}



function adaptModeOutput(out, userText, intentTag) {
  if (!out) return null;

  const ended = !!(out && typeof out === 'object' && out.end === true);

  // case: booth returned a raw string
  if (typeof out === 'string') {
    if (alreadyHasCard(out)) {
      return { html: out, meta: { intent: intentTag, layered: true, end: ended } };
    }
    return {
      html: composeReply({
        userText,
        part: { kind: 'answer', html: out },
        askAllowed: true
      }),
      meta: { intent: intentTag, end: ended }
    };
  }

  // case: booth returned an object { html, [end] }
  if (out && typeof out.html === 'string') {
    if (alreadyHasCard(out.html)) {
      return { html: out.html, meta: { intent: intentTag, layered: true, end: ended } };
    }
    return {
      html: composeReply({
        userText,
        part: { kind: 'answer', html: out.html },
        askAllowed: true
      }),
      meta: { intent: intentTag, end: ended }
    };
  }

  // fallback stringification
  const raw = String(out);
  if (alreadyHasCard(raw)) {
    return { html: raw, meta: { intent: intentTag, layered: true, end: ended } };
  }
  return {
    html: composeReply({
      userText,
      part: { kind: 'answer', html: raw },
      askAllowed: true
    }),
    meta: { intent: intentTag, end: ended }
  };
}

function replyCard(html) {
  return composeReply({ part: { html }, askAllowed: false, noAck: true });
}



// Router adapter
function renderRouterResultToHTML(routerRes, userText) {
  if (!routerRes || typeof routerRes !== 'object') return null;

  // NEW: if a booth already produced HTML (layered card, etc.), just pass it through.
  if (typeof routerRes.html === 'string' && routerRes.html.trim()) {
    return {
      html: routerRes.html,
      meta: { intent: 'router' }
    };
  }

  const pieces = [];
  if (routerRes.text) pieces.push(paraWrap(html(routerRes.text)));

  if (Array.isArray(routerRes.deck) && routerRes.deck.length) {
    const quizish = /quiz|fraction|percent|practice/i.test(routerRes.text || '');
    const cls = quizish ? 'mt-quiz-list' : 'mt-response-list';
    const rows = routerRes.deck.map((q, i) => {
      const num = i + 1;
      const txt = html(q?.prompt ?? q?.text ?? q ?? '');
      return `<div class="${quizish ? 'mt-quiz-item' : 'mt-response-item'}">Q${num}. ${txt}</div>`;
    }).join('');
    pieces.push(`<div class="${cls}">${rows}</div>`);
  }

  if (!pieces.length) return null;

  const merged = pieces.join('');
  const finalHtml = wrapLayerCard(merged, { tone: 'cyan' });

  return {
    html: composeReply({
      userText,
      part: { kind: 'answer', html: finalHtml },
      askAllowed: true
    }),
    meta: { intent: 'router' }
  };
}
// ——— inline Calculator helper (reuse the booth's solvers) ———
function inlineCalcHTML(text) {
  try {
    const html = MODEx?.calculator?.quickSolve?.(text);
    return (typeof html === 'string' && html.trim()) ? html : null;
  } catch { 
    return null; 
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// routeUtterance — lean router for explicit commands / booth intents only
// Notes:
// • Small-talk is handled earlier in getResponse() — we do NOT call it here.
// • We respect quiz precedence elsewhere (getResponse checks quiz.isActive()).
// • We avoid double cards by emitting either an already-layered card string,
//   or a plain {text/deck} that renderRouterResultToHTML will wrap once.
// ─────────────────────────────────────────────────────────────────────────────
function routeUtterance(utterance) {
  const raw = String(utterance ?? '');
  const text = raw.trim();
  const t = text.toLowerCase();

  // 0) fast commands (help/exit/explicit quiz starts)
  if (t === 'help' || t === '/help') {
    return {
      html: composeReply({
        userText: text,
        part: { kind: 'answer', html: boothMenuHTML("Here’s the map — wanna jump into a booth?") },
        askAllowed: false,
        noAck: true
      })
    };
  }
  if (t === 'exit' || t === '/exit') {
    setMode(MODES.none);
    clearBoothContext(); // ← important
    return {
      html: composeReply({
        userText: text,
        part: { kind: 'answer', html: `<p>👋 Back to the village center. Say <b>help</b> for options.</p>` }
      })
    };
  }


  // 1) explicit quiz start: "quiz fractions 3" | "quiz percent 3"
  // 1) explicit quiz start: "quiz …" (topic optional)
  {
    const mQuizStart = t.match(/^quiz\b(?:\s+(fractions?|percent|equations?))?(?:\s+(\d+))?$/i);
    if (mQuizStart) {
      const raw = mQuizStart[1];
      const topic = raw
        ? (/perc/i.test(raw) ? 'percent' : /equation/i.test(raw) ? 'equations' : 'fractions')
        : lastLessonTopicOrDefault();                // ✅ respect lessons topic
      const count = mQuizStart[2] ? Math.max(1, Math.min(5, parseInt(mQuizStart[2], 10))) : 3;

      setMode(MODES.quiz);
      const out = MODEx.quiz.start({ topic, count });
      return adaptModeOutput(out, text, 'quiz_start') || { html: '' };
    }
  }


  // 2) “<booth> booth” (with typo forgiveness for calculator)
  {
    // normalize “claculator booth”, “calc booth”, etc.
    const mBooth = t.match(/\b(lessons|quiz|lore|recipe|recipes|status|staus|calculator|claculator|calcuator|calc)\s*booth\b/);
    if (mBooth) {
      let b = normalizeBoothKey(mBooth[1]); // returns "recipes" for any recipe*
      if (/^clac|^calcu|^calc/.test(b)) b = 'calculator';
      if (/^staus$/i.test(b)) b = 'status';
      if (/^recipe/.test(b)) b = 'recipe';   // registry key for MODEx

        const cur = getMode();
        const mkey = modesKey(b);
        if (MODES[mkey] && cur === MODES[mkey]) {
        // already there — re-emit current step (prevents confirm spam & double cards)
        if (b === 'quiz' && MODEx.quiz?.handle) {
          return adaptModeOutput(MODEx.quiz.handle('again', {}), text, 'booth:quiz') || { html: '' };
        }
        const out = callMode(b, 'start', {});
        return adaptModeOutput(out, text, `booth:${b}`) || { html: '' };
      }

      setPendingSwitch(b, text);
      return {
        html: composeReply({
          userText: text,
          part: { kind: 'confirm', html: `Ready to roll into ${b} booth?` },
          askAllowed: false,
          noAck: true
        })
      };
    }
  }

  // 3) “go to <booth>”, “open <booth>”, etc. (room/kiosk/station synonyms)
  {
    const m = t.match(/\b(?:go|take me|switch|enter|open|head|send)\s*(?:me)?\s*(?:to|into)?\s*(?:the)?\s*(lessons?|quiz|lore|recipe?|status|calculator|claculator|calcuator|calc)\b/);
    if (m) {
      let key = m[1];
      if (/lesson/.test(key)) key = 'lessons';
      if (/recipe/.test(key)) key = 'recipe';
      if (/^clac|^calcu|^calc/.test(key)) key = 'calculator';
      setPendingSwitch(normalizeBoothKey(key), text);
      return {
        html: composeReply({
          userText: text,
          part: { kind: 'confirm', html: `Ready to roll into ${key} booth?` },
          askAllowed: false,
          noAck: true
        })
      };
    }
  }

  // 4) “recipes <topic>” and topic shorthands (“snowcone”, “nachos”, “quesadilla”, “cocoa”)
  {
    // 4) “<topic> recipe” and “recipe <topic>”
    const topicCmd1 = t.match(/^(snowcone|nachos|quesadilla|cocoa)\s+recipe\b/);
    const topicCmd2 = t.match(/^recipe\s+(snowcone|nachos|quesadilla|cocoa)\b/);

    const topic = (topicCmd1 && topicCmd1[1]) || (topicCmd2 && topicCmd2[1]);
    if (topic) {
      setMode(MODES[modesKey('recipe')]);
      const payload = { topic };
      const mod = MODEx.recipe;
      let out = null;

      if (typeof mod?.start === 'function') out = mod.start(payload);
      else if (typeof mod?.handle === 'function') out = mod.handle(payload.topic, payload);

      return adaptModeOutput(out, text, 'booth:recipe') || {
        html: composeReply({
          userText: text,
          part: { kind: 'answer', html: `<p>Recipe booth warming up. Pick: <b>snowcone</b>, <b>nachos</b>, <b>quesadilla</b>, or <b>cocoa</b>.</p>` }
        })
      };
    }
  }
  // 4b) raw topic only: "snowcone" | "nachos" | "quesadilla" | "cocoa"
  {
    const rawTopic = t.match(/^(snow\s*cone|snowcone|nachos|quesadilla|cocoa)\b/);
    if (rawTopic) {
      setMode(MODES[modesKey('recipe')]);
      const topic = pickRecipeTopic(rawTopic[1]);
      return adaptModeOutput(MODEx.recipe.start({ topic }), text, 'booth:recipe');
    }
  }

  // Shorthand openers: "show me a recipe", "show me some recipes", "see recipes"
  {
    if (/\b(show|see|view|open|display|gimme|give me|bring)\b.*\brecipes?\b/i.test(t)) {
      setMode(MODES[modesKey('recipe')]);
      return adaptModeOutput(MODEx.recipe.start({}), text, 'booth:recipe');
    }
    // bare "recipe" / "recipes" as a quick alias
    if (/^\s*recipes?\s*$/i.test(t)) {
      setMode(MODES[modesKey('recipe')]);
      return adaptModeOutput(MODEx.recipe.start({}), text, 'booth:recipe');
    }
  }


  // 5) Algebra quick intercepts (kept here so standalone callers get it)
  {
    const alg = algebraIntercept(text);
    if (alg) return { html: alg };
  }

  // 6) direct calculator expressions? — defer to higher layer (getResponse handles inline calc)
  //    we keep routeUtterance pure for command routing.

  // 7) default → booth menu (single clean card, no extra ack)
  return {
    html: composeReply({
      userText: text,
      part: { kind: 'answer', html: boothMenuHTML("Here’s the map — wanna jump into a booth?") },
      askAllowed: false,
      noAck: true
    })
  };
}





// Algebra intercepts
function algebraIntercept(text) {
  const t = String(text || '').toLowerCase().trim();
  if (/y\s*\+?\s*m\s*x\s*\+\s*b/.test(t) || /y\s*=\s*m\s*x\s*\+\s*b/.test(t)) {
    return composeReply({
      userText: text,
      part: { kind: 'answer', html: '<p>That’s slope-intercept form: y = mx + b. m is slope, b is y-intercept. Wanna dive deeper into equations?</p>' },
      noAck: true
    });
  }
  if (/\ba\s*(?:squared|2)\s*\+\s*b\s*(?:squared|2)\s*=\s*c\s*(?:squared|2)\b/.test(t)) {
    return composeReply({
      userText: text,
      part: { kind: 'answer', html: '<p>Pythagorean theorem: a² + b² = c² for right triangles. Want to explore more geometry?</p>' },
      noAck: true
    });
  }
  return null;
}

// Public API
export function getResponse(userText, appStateLike = appState) {
  const text = String(userText || '');
  const t = text.toLowerCase().trim();
  const userName = appStateLike?.profile?.name || 'traveler';
  // 🔑 stable per-chat id; persists in appState to keep booth state
  // stable per-chat id
  act(() => {
    if (!appStateLike.progress) appStateLike.progress = {};
    if (!appStateLike.progress.mathtips) appStateLike.progress.mathtips = {};
    if (!appStateLike.progress.mathtips.sessionId) {
      appStateLike.progress.mathtips.sessionId =
        `mt-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    }
  });
  const SESSION_ID = appStateLike.progress.mathtips.sessionId;

  // ✅ Affirmative continuation from Lessons → kick off a default quiz
  // Covers cases like: Lessons said “rolling to Quiz…”, user says “ok/yes/sure”
  if (isAffirmative(t) && getMode() === MODES.lessons && !quiz.isActive?.(SESSION_ID)) {
    setMode(MODES.quiz);
    clearSmalltalkThread?.();
    const topic = lastLessonTopicOrDefault();
    return adaptModeOutput(
      MODEx.quiz.start({ topic, count: 3, userText: text, sessionId: SESSION_ID }),
      text,
      'quiz_start'
    );
  }


  // 🔌 global exit/leave synonyms — run before smalltalk & fast paths
  if (/\b(leave|leave\s+mode|exit|quit|out|back(?:\s+to)?\s+(?:commons?|center|village)|go\s*home|return|main\s*menu)\b/i.test(t)) {
    try { quiz.end?.(SESSION_ID); } catch {}     // ← NEW: kill any active quiz deck
    setMode(MODES.none);
    clearBoothContext();
    return {
      html: composeReply({
        userText: text,
        part: { kind: 'answer', html: `<p>👋 Back to the village center. Say <b>help</b> for options.</p>` }
      })
    };
  }



  // 🔒 Quiz takes precedence over everything (prevents Calculator hijack)
  if (quiz.isActive?.(SESSION_ID)) {
    // if user tries a booth switch while quizzing, end quiz and let router handle it
    if (/\b(lessons|quiz|lore|recipe|status|calculator)\s*booth\b/i.test(t)
        || /\b(go|take me|switch|enter|open|head|send)\b/i.test(t)) {
      try { quiz.end?.(SESSION_ID); } catch {}
      // fall through to normal routing (don’t return here)
    } else {
      return quiz.handle(text, { sessionId: SESSION_ID });
    }
  }
  // 🍳 Fast path: explicit recipe topics → jump straight in
  if (/\b(quesadilla|snow\s*cone|snowcone|nachos|cocoa)\b/i.test(t)) {
    setMode(MODES.recipe);
    clearSmalltalkThread();
    return adaptModeOutput(MODEx.recipe.start({ topic: pickRecipeTopic(t) }), text, 'booth:recipe');
  }
  // Bare “recipe(s)” → open the menu, not the previous topic
  if (/\brecipes?\b/i.test(t)) {
    setMode(MODES.recipe);
    return adaptModeOutput(MODEx.recipe.start({}), text, 'booth:recipe');
  }

  // 🔎 Quick Status intent: "status", "my status", "what's my status?"
  {
    const isStatusQuick = /^\s*(?:what(?:'s|\s+is)\s+my\s+status|my\s+status|status)\s*\??\s*$/i.test(t);
    if (isStatusQuick) {
      setMode(MODES.status);
      clearSmalltalkThread();
      return adaptModeOutput(
        MODEx.status.start({ sessionId: SESSION_ID }),
        text,
        'booth:status'
      );
    }
  }



  // 🔸 Small-talk intercept (lightweight, non-modal)
  // allow small-talk unless a quiz is live
  {
    const allowSmall = !(quiz.isActive?.(SESSION_ID));
    if (allowSmall) {
      const st = maybeHandleSmallTalk(userText, {
        name: appStateLike?.profile?.name || 'traveler',
        appState: appStateLike,
        botContext: ensureBC(),
        currentMode: getMode()
      });

      if (st && st.handled) {
        const stAction = st.action || {};
        if (stAction.type === 'SWITCH_MODE') {
          const keyRaw = stAction.to || stAction.modeKey || '';
          const key = normalizeBoothKey(keyRaw);
          if (key && MODEx[key]) {
            setMode(MODES[key] || MODES.none);
            const out = (typeof MODEx[key]?.start === 'function')
              ? MODEx[key].start(stAction.payload || {})
              : MODEx[key]?.handle?.('start', stAction.payload || {}) || '';
            const adapted = adaptModeOutput(out, userText, `switch:${key}`);
            if (adapted) return adapted;
          }
        }
        // handled, no switch requested → just use the bubble
        return { html: st.html, meta: { intent: 'smalltalk' } };
      }
    }
  }
  // 🔎 Quick Lessons intent: "lesson", "lessons", "i want a lesson", "teach me a lesson"
  {
    const t = String(userText || '').trim().toLowerCase();
    if (/\b(lesson|lessons)\b/.test(t) || /\b(i\s+want\s+a\s+lesson|teach\s+me\s+a?\s*lesson)\b/.test(t)) {
      setMode(MODES.lessons);
      clearSmalltalkThread?.();
      return adaptModeOutput(
        MODEx.lessons.start({}),
        userText,
        'booth:lessons'
      );
    }
  }



  // 0a) Handle pending booth switch
  const bc0 = ensureBC();
  if (bc0.pendingSwitch) {
    const ans = t.trim();
    if (isAffirmative(ans)) {
      const p = consumePendingSwitch();
      const to = p?.to || 'none';
      setMode(MODES[modesKey(to)] || MODES.none);
      clearSmalltalkThread();
      let prompt = '';
      if (to === 'lessons') prompt = `<p>Sweet. In lessons booth — what topic first: fractions, percent, or equations?</p>`;
      else if (to === 'quiz') prompt = `<p>Alright, quiz booth time! Want fractions, percent, or a mix?</p>`;
      else if (to === 'lore') prompt = `<p>Lore booth vibes! Wanna hear about the festival or the snowcone sages?</p>`;
      else if (to === 'recipe') prompt = `<p>Recipe booth, let’s cook! Quesadillas or snowcones today?</p>`;
      else if (to === 'calculator') prompt = `<p>Calculator booth ready! Toss me a math problem like 15% of 80.</p>`;
      else prompt = `<p>Back in the village center. Pick a booth: lessons, quiz, lore, recipe, or calculator.</p>`;

      if (p?.lastText) {
        const mod = MODEx[to];
        // start the booth instead of re-parsing the last command
        if (mod?.start) {
          const replay = adaptModeOutput(mod.start({ userText, sessionId: SESSION_ID }), userText, `booth:${to}`);
          if (replay) return replay;
        } else if (mod?.handle) {
          const replay = adaptModeOutput(mod.handle('start', { userText, sessionId: SESSION_ID }), userText, `booth:${to}`);
          if (replay) return replay;
        }
      }


      return {
        html: composeReply({
          userText,
          part: { kind: 'answer', html: `<p>Jumped into the ${to} booth!</p>${prompt}` }
        }),
        meta: { intent: 'booth-switch-confirm', to }
      };
    }
    if (isNegative(ans)) {
      consumePendingSwitch();
      return {
        html: composeReply({
          userText,
          part: { kind: 'answer', html: '<p>Cool breeze, staying put. What’s next?</p>' }
        }),
        meta: { intent: 'booth-switch-decline' }
      };
    }
    // NEW: explain the target if user asks "what is it/what's that"
    if (/\b(what(?:'s|\s+is)\s+(?:it|that))\b/i.test(ans)) {
      const to = bc0.pendingSwitch?.to || 'lessons';
      const oneLiners = {
        lessons:    'Lessons booth gives short, guided mini-lessons with examples.',
        quiz:       'Quiz booth drills bite-size questions — fast reps, instant feedback.',
        lore:       'Lore booth drops short festival stories and worldbuilding cards.',
        recipe:     'Recipe booth serves cozy snack cards like snowcones and quesadillas.',
        calculator: 'Calculator booth answers quick math like 15% of 80.',
        status:     'Status booth shows your level, streak, badges, and what to do next.'
      };
      const desc = oneLiners[to] || 'A handy booth to keep you moving.';
      return {
        html: composeReply({
          userText: text,
          part: { kind: 'confirm', html: `<p>${desc}</p><p>Jump into <b>${to}</b> booth?</p>` },
          askAllowed: false,
          noAck: true
        }),
        meta: { intent: 'booth-switch-explain', to }
      };
    }


    return {
      html: composeReply({
        userText,
        part: { kind: 'confirm', html: `<p>Yo ${userName}, quick yes or no to jump into that booth?</p>` },
        askAllowed: false,
        noAck: true
      }),
      meta: { intent: 'booth-switch-clarify' }
    };
  }

  // 0b) Global intercepts
  if (t === 'help' || t === '/help') {
    return {
      html: composeReply({
        userText: text,
        part: { kind: 'answer', html: boothMenuHTML() },
        askAllowed: false,
        noAck: true
      }),
      meta: { intent: 'help' }
    };
  }


  if (t === 'exit' || t === '/exit') {
    setMode(MODES.none);
    clearBoothContext(); // ← add this
    return {
     html: composeReply({
       userText: text,
       part: { kind: 'answer', html: `<p>👋 Back to the village center. Say <b>help</b> for options.</p>` },
       askAllowed: false,
       noAck: true
     }),
      meta: { intent: 'exit' }
    };
  }

  // B) booth phrase guard: if already in that booth, don’t confirm/restart
  const mBooth = t.match(/\b(lessons|quiz|lore|recipe|calculator|status)\s*booth\b/i);
  if (mBooth) {
    const to = mBooth[1];
    const cur = getMode();

    if (MODES[to] && cur === MODES[to]) {
      // already here — re-emit current step instead of confirming
      if (to === 'quiz' && MODEx.quiz?.handle) {
        return adaptModeOutput(MODEx.quiz.handle('again', { sessionId: SESSION_ID }), text, 'booth:quiz');
      }
      const out = callMode(to, 'start', { sessionId: SESSION_ID });
      return adaptModeOutput(out, text, `booth:${to}`);
    }

    setPendingSwitch(to, text);
    return {
      html: composeReply({
        userText: text,
        part: { kind: 'confirm', html: `Ready to roll into ${to} booth?` },
        askAllowed: false,
        noAck: true
      }),
      meta: { intent: 'booth-switch', to }
    };
  }

  const booth1 = t.match(/\b(lessons?|quiz|lore|recipe?|calculator|status)\s+(?:booth|room|kiosk|station)\b/);
  const booth2 = t.match(/\b(?:go|take me|switch|enter|open|head|send)\s*(?:me)?\s*(?:to|into)?\s*(?:the)?\s*(lessons?|quiz|lore|recipe?|calculator|status)\s*(?:booth|room|kiosk|station)?\b/);
  const norm = (w) => {
    if (!w) return null;
    if (/calculator/.test(w)) return 'calculator';
    if (/lesson/.test(w)) return 'lessons';
    if (/quiz/.test(w)) return 'quiz';
    if (/lore|story|festival/.test(w)) return 'lore';
    if (/recipe/.test(w)) return 'recipe';
    if (/status/.test(w)) return 'status';
    return null;
  };

  const toBooth = norm((booth1 && booth1[1]) || (booth2 && booth2[1]));
  if (toBooth) {
    setPendingSwitch(toBooth, text);
    return {
      html: composeReply({
        userText: text,
        part: { kind: 'confirm', html: `Ready to roll into ${toBooth} booth?` },
        askAllowed: false,
        noAck: true
      }),
      meta: { intent: 'booth-switch', to: toBooth }
    };
  }
  // A) direct start: supports both orders
  //    "quiz fractions 3" | "quiz percent" | "fraction quiz 4" | "percent quiz"
  //    plurals optional; count optional (1..5, default 3)
  // A) direct start: supports "quiz …" and "<topic> quiz"
  {
    const mA = t.match(/^quiz(?:\s+(fractions?|fraction|percents?|percent|equations?))?(?:\s+(\d+))?$/i);
    const mB = t.match(/^(fractions?|fraction|percents?|percent|equations?)\s+quiz(?:\s+(\d+))?$/i);

    let topic = null, count = null;

    if (mA) {
      const raw = mA[1];
      topic = raw
        ? (/perc/i.test(raw) ? 'percent' : /equation/i.test(raw) ? 'equations' : 'fractions')
        : lastLessonTopicOrDefault();                // ✅ respect lessons topic
      count = mA[2];
    } else if (mB) {
      const raw = mB[1];
      topic = /perc/i.test(raw) ? 'percent' : /equation/i.test(raw) ? 'equations' : 'fractions';
      count = mB[2];
    }

    if (topic) {
      const n = count ? Math.max(1, Math.min(5, parseInt(count, 10))) : 3;
      setMode(MODES.quiz);
      clearSmalltalkThread();
      return adaptModeOutput(
        MODEx.quiz.start({ topic, count: n, userText: text, sessionId: SESSION_ID }),
        text,
        'quiz_start'
      );
    }
  }



  // 0c) Algebra intercepts
  const alg = algebraIntercept(text);
  if (alg) return { html: alg, meta: { intent: 'algebra', topic: 'algebra' } };

  // 1) Active booth with off-topic guard
  // 1) Active booth with off-topic guard
  // 1) Active booth with off-topic guard
  const currentMode = getMode();
  const regKey = (/recipe/i.test(String(currentMode)) ? 'recipe' : currentMode);

  if (currentMode !== MODES.none) {
    // 🔮 calculator is global: quick calcs (discount/tip/tax/split/change/…) win early
    if (!quiz.isActive?.(SESSION_ID)) {
      const calcHtml = inlineCalcHTML(t);
      if (calcHtml) {
        return {
          html: composeReply({ userText: text, part: { kind:'answer', html: calcHtml } }),
          meta: { intent:'calc-inline', topic:'calculator' }
        };
      }
    }

    // plain safe expression (e.g., "2+3*8")
    if (SAFE_EXPR.test(t)) {
      try {
        const result = evalSafeExpression(t);
        return {
          html: composeReply({
            userText: text,
            part: { kind: 'answer', html: `<p>${t} = ${result}</p>` }
          }),
          meta: { intent: 'calc-inline', topic: 'calculator' }
        };
      } catch {/* fall through */}
    }


    // hand off to the active booth
    const mod = MODEx[regKey];
    const out = (mod?.handle)
      ? mod.handle(text, { sessionId: SESSION_ID })
      : callMode(regKey, text, { sessionId: SESSION_ID });

    if (out) {
      const adapted = adaptModeOutput(out, text, `booth:${currentMode}`);
      if (adapted) {
        // NEW — trust the booth's end card (it can show its own menu)
        if (adapted?.meta?.end) {
          setMode(MODES.none);
          clearBoothContext();
          // Pass through exactly what the booth emitted (often includes its menu)
          return adapted;
        }

        return adapted;
      }
    }
    // ... fall through; global inline-calc check below still runs
  }



  // 🔮 calculator is global: catch quick calcs *before* percent→quiz intent
  if (!quiz.isActive?.(SESSION_ID)) {
    const calcHtml = inlineCalcHTML(t);
    if (calcHtml) {
      return {
        html: composeReply({ userText: text, part:{ kind:'answer', html: calcHtml } }),
        meta: { intent:'calc-inline', topic:'calculator' }
      };
    }
  }
  // bare "lesson" / "lessons" opens Lessons booth
  if (/^\s*lessons?\s*$/.test(t)) {
    setMode(MODES.lessons);
    const out = MODEx.lessons.start({});
    return adaptModeOutput(out, text, 'booth:lessons') || { html: '' };
  }
  // If we're in Lessons and the user says "menu", defer to Lessons.handle so it shows the Lessons menu card
  if (currentMode === MODES.lessons && /^\s*menu\s*$/i.test(t)) {
    const out = MODEx.lessons.handle('menu', { sessionId: SESSION_ID });
    const adapted = adaptModeOutput(out, userText, 'booth:lessons');
    if (adapted) return adapted;
  }



  // 1b) Idle mode: handle specific intents
  const { guess, score, arg } = scoreIntent(text);
  if (score >= 0.6) {
    let line = '';
    switch (guess) {
      case 'command':
        switch (arg) {
          case 'stats': {
            const xp = n(appStateLike?.profile?.xp);
            const lvl = n(appStateLike?.profile?.level, Math.floor(xp / 100) + 1);
            const tips = n(appStateLike?.progress?.mathtips?.completedTips);
            const total = n(appStateLike?.progress?.mathtips?.totalTips, Math.max(10, tips));
            line = `<p>Level ${lvl}, XP ${xp}, Tips ${tips}/${total}. Jump into status booth for more!</p>`;
            break;
          }
          case 'tip':
            line = `<p>${pick(RESPONSES.math_general)} Try lessons booth for deeper dives.</p>`;
            try { if (typeof appStateLike.addXP === 'function') appStateLike.addXP(1); } catch {}
            break;
          case 'clear':
            line = `<p>Cleared my short-term memory, ${userName}. Ready for quiz booth?</p>`;
            break;
          case 'reset':
            line = `<p>Fresh slate, ${userName}. Pick a booth: lessons, quiz, lore, recipe, or calculator.</p>`;
            break;
          default:
            line = `<p>Command’s not clicking, ${userName}. Say help for options.</p>`;
        }
        break;
            case 'who': {
              const line = `<p>${pick(RESPONSES.who_are_you)}</p>`;
              return {
                html: composeReply({
                  userText: text,
                  part: { kind: 'answer', html: line },
                  askAllowed: false, // no follow-up nudge
                  noAck: true        // no “Alright...” preface
                }),
                meta: { intent: guess }
              };
            }


      case 'greet': {
        const line = `<p>${pick(RESPONSES.greetings)} Let’s roll, ${userName} — pick a booth: lessons, quiz, lore, recipe, status, or calculator.</p>`;
        return {
          html: composeReply({
            userText: text,
            part: { kind: 'answer', html: line },
            askAllowed: false,
            noAck: true
          }),
          meta: { intent: guess }
        };
      }

      case 'how_are_you': {
        const line = `<p>${pick(RESPONSES.how_are_you)} What’s next, ${userName}? Lessons booth, quiz booth, or something else?</p>`;
        return {
          html: composeReply({
            userText: text,
            part: { kind: 'answer', html: line },
            askAllowed: false,
            noAck: true
          }),
          meta: { intent: guess }
        };
      }

      case 'joke': {
        const sm = respondSmallTalk('tell me a joke', {
          name: userName,
          appState: appStateLike,
          botContext: ensureBC(),
          currentMode: getMode()
        });
        if (sm && sm.html) {
          return {
            html: sm.html,
            meta: { intent: guess }
          };
        }
        // fallback if smalltalk didn’t handle (unlikely)
        const line = `<p>${pickUnique('jokes', RESPONSES.jokes, getSessionId(appStateLike))} More laughs, ${userName}? Try lore booth for festival tales.</p>`;
        return {
          html: composeReply({ userText: text, part: { kind: 'answer', html: line }, askAllowed: false, noAck: true }),
          meta: { intent: guess }
        };
      }



      case 'badges': {
        const line = `<p>Badges mark your math and snowcone swagger, ${userName}. Check status booth for yours!</p>`;
        return {
          html: composeReply({
            userText: text,
            part: { kind: 'answer', html: line },
            askAllowed: false,
            noAck: true
          }),
          meta: { intent: guess }
        };
      }


      case 'lore':
        setMode(MODES.lore);
        clearSmalltalkThread();
        {
          const out = callMode('lore', text, { sessionId: SESSION_ID });
          if (out) return adaptModeOutput(out, text, 'booth:lore');
          return {
            html: composeReply({
              userText: text,
              part: { kind: 'answer', html: `<p>Lore booth’s warming up, ${userName}. Wanna hear about the festival or snowcone sages?</p>` },
              askAllowed: true
            }),
            meta: { intent: 'booth:lore' }
          };
        }
      case 'math_general':
        setMode(MODES.lessons);
        clearSmalltalkThread();
        return adaptModeOutput(MODEx.lessons.start({ userText: text }), text, 'booth:lessons');
      case 'quiz_fractions': {
        setMode(MODES.quiz);
        const out = callMode('quiz', 'start fractions 3', { topic: 'fractions', count: 3, userText: text }) || MODEx.quiz?.start?.({ topic: 'fractions', count: 3, userText: text });
        return adaptModeOutput(out, text, 'quiz_start');
      }
      case 'quiz_percent':
        setMode(MODES.quiz);
        return adaptModeOutput(MODEx.quiz.start({ topic: 'percent', count: 3, userText: text }), text, 'quiz_start');
      case 'percent': {
        const raw = MODEx.calculator?.quickSolve?.(text) || '';
        if (raw) {
          setMode(MODES.calculator);
          clearSmalltalkThread();
          return {
            html: composeReply({
              userText: text,
              part: { kind: 'answer', html: wrapLayerCard(raw) }
            }),
            meta: { intent: 'calc-inline', topic: 'calculator' }
          };
        }
        break;
      }
      case 'calc': {
        const raw = MODEx.calculator?.quickSolve?.(text) || '';
        if (raw) {
          setMode(MODES.calculator);
          return {
            html: composeReply({
              userText: text,
              part: { kind: 'answer', html: wrapLayerCard(raw) }
            }),
            meta: { intent: 'calc-inline', topic: 'calculator' }
          };
        }
        // pretty fail, but still a single card
        return {
          html: composeReply({
            userText: text,
            part: { kind: 'answer', html: wrapLayerCard(`<p>couldn’t parse that one. try <code>27% off $10</code> or <code>3/8 as decimal</code>.</p>`) }
          }),
          meta: { intent: 'calc-fail' }
        };
      }

      default: {
        const htmlBlock = boothMenuHTML(`Wanna jump into a booth, ${userName}?`);
        return {
          html: composeReply({
            userText: text,
            part: { kind: 'answer', html: htmlBlock },
            askAllowed: true
          }),
          meta: { intent: 'fallback' }
        };
      }
    };
  }


  // 2) Router fallback
  try {
    const routed = routeUtterance(text);

    // ⬇️ If routeUtterance already returned a composed bubble, just use it.
    if (routed && typeof routed.html === 'string' && routed.html) {
      return { html: routed.html, meta: { intent: 'router' } };
    }

    const adapted = renderRouterResultToHTML(routed, text);
    if (adapted && adapted.html) return adapted;
  } catch (e) {
    console.warn('[router adapter] fell through:', e);
  }


  // 3) Final fallback — no unsolicited map
  return {
    html: composeReply({
      userText: text,
      part: { kind: 'answer', html: `<p>we can chill here. ask me anything, or say <b>help</b> for the map.</p>` },
      askAllowed: false,
      noAck: true
    }),
    meta: { intent: 'fallback' }
  };



}

// qabot.js

// qabot.js

function _isPinned(el, pad = 8) {
  const gap = el.scrollHeight - (el.scrollTop + el.clientHeight);
  return gap <= pad;
}

// Only export scrollToBottom for one-off jumps.
export function scrollToBottom() {
  const el = (typeof document !== 'undefined')
    ? (document.querySelector('.chat-window') || document.getElementById('chat-window'))
    : null;
  if (!el) return;
  el.scrollTop = el.scrollHeight;
}

// Sticky auto-scroller that respects user scroll and layout reflows
export function attachAutoScroller(containerId = 'chat-window') {
  if (typeof document === 'undefined') return;

  const el = document.getElementById(containerId) || document.querySelector('.chat-window');
  if (!el) return;

  // must be a normal top→bottom scroller
  el.style.scrollBehavior = 'auto';

  let pinned = true;
  const onScroll = () => { pinned = _isPinned(el); };
  el.addEventListener('scroll', onScroll, { passive: true });

  const snap = () => { if (pinned) el.scrollTop = el.scrollHeight; };

  // New: also react to size changes (images, fonts, async HTML)
  const ro = (typeof ResizeObserver !== 'undefined') ? new ResizeObserver(snap) : null;
  if (ro) ro.observe(el);

  const mo = new MutationObserver(snap);
  mo.observe(el, { childList: true, subtree: true });

  // initial pin on mount
  snap();

  // cleanup
  return () => {
    try { el.removeEventListener('scroll', onScroll); } catch {}
    try { mo.disconnect(); } catch {}
    try { ro && ro.disconnect(); } catch {}
  };
}


// Treat these as "booth-style" responses that should render as a single card (no global ack)
function isBoothIntent(tag = '') {
  return /^booth:/.test(tag)            // booth:lessons, booth:quiz, booth:lore, booth:recipe, booth:calculator
      || tag === 'quiz_start'           // initial quiz deck
      || tag === 'calc-inline'          // inline calc while inside a booth
      || tag === 'percent'              // percent inline while inside a booth
      || tag === 'router';              // router/deck blocks we render as a card
}
function normalizeBoothKey(k = '') {
  if (/^recipe(s)?$/i.test(k)) return 'recipe';
  if (/^staus$/i.test(k))      return 'status';
  return k;
}



