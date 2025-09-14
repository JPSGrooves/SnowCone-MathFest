// src/modes/mathTips/qabot.js
import { matcher, matcherAnyMath } from './matcher.js';
import { appState } from '../../data/appState.js';
import { composeReply, PERSONA } from './conversationPolicy.js';
import { getMode, setMode, MODES } from './modeManager.js';
import { interpret } from './phrasebook.js';
import { renderBoothsHelp } from './modes/status.js';

// route directly through the registry we export
import * as MODEx from './modes/index.js'; // ensure this is at top

function callMode(modeKey, text, extra = {}) {
  const mod = MODEx[modeKey];
  if (!mod) return { text: `<p>${modeKey} booth not found.</p>` };
  const fn =
    (typeof mod.handle === 'function' && mod.handle) ||
    (typeof mod.run === 'function' && mod.run) ||
    (typeof mod.start === 'function' && mod.start);
  if (!fn) return { text: `<p>${modeKey} booth has no handler.</p>` };
  return fn(text, extra);
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
  who_are_you: [
    "I’m Pythagorus Cat, triangle sorcerer and snowcone sage.",
    "P-Cat, keeper of the hypotenuse, lover of melted cheese.",
    "Just a cosmic cat slingin’ math and good vibes."
  ],
  jokes: [
    "Why’d the obtuse angle skip the party? Never right.",
    "Parallel lines? So much in common, but they’ll never meet.",
    "Six is scared of seven ‘cause seven ate nine. Math humor!"
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
function n(x, d = 0) { const v = +x; return Number.isFinite(v) ? v : d; }

// Bot-context stash
function ensureBC() {
  if (!appState.progress) appState.progress = {};
  if (!appState.progress.mathtips) appState.progress.mathtips = {};
  if (!appState.progress.mathtips.botContext) appState.progress.mathtips.botContext = {};
  return appState.progress.mathtips.botContext;
}
function setPendingSwitch(toMode, lastText) {
  const bc = ensureBC();
  bc.pendingSwitch = { to: toMode, at: Date.now(), lastText: String(lastText || '') };
}
function consumePendingSwitch() {
  const bc = ensureBC();
  const p = bc.pendingSwitch || null;
  bc.pendingSwitch = null;
  return p;
}
function isAffirmative(s) { return /\b(yes|yep|yeah|sure|ok|okay|do it|go|switch|please|y)\b/i.test(s); }
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

// Intent scoring
function scoreIntent(input) {
  const lower = input.toLowerCase();
  if (/^\/?(help|commands|stats|tip|clear|reset)\b/.test(lower)) return { guess: 'command', score: 0.99, arg: lower.match(/^\/?(\w+)/)?.[1] };
  if (tryPercentOf(lower)) return { guess: 'percent', score: 0.95 };
  if (SAFE_EXPR.test(lower)) return { guess: 'calc', score: 0.9 };
  if (matcher(lower, 'who_are_you') || /\bwhat['’]?s\s*your\s*name\b/i.test(lower)) return { guess: 'who', score: 0.8 };
  if (matcher(lower, 'greetings') || /\b(yo|hey|hi|what['’]?s\s*up|nm\s*man)\b/i.test(lower)) return { guess: 'greet', score: 0.75 };
  if (/\bhow\s*are\s*you\b/i.test(lower)) return { guess: 'how_are_you', score: 0.75 };
  if (/\bmath\b/.test(lower)) return { guess: 'math_general', score: 0.75 };
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
  recipes: [/recipe|cook|food|quesadilla|snack|kitchen/i],
  calculator: [/calc|calculator|compute|evaluate|=|answer/i],
};
function softModeTarget(text) {
  const t = String(text || '');
  for (const [mode, regexes] of Object.entries(SOFT_MODE_HINTS)) {
    if (regexes.some(r => r.test(t))) return mode;
  }
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

  // string → wrap once as a single card
  if (typeof out === 'string') {
    return {
      html: composeReply({
        userText,
        part: { kind: 'answer', html: out },
        askAllowed: true
      }),
      meta: { intent: intentTag }
    };
  }

  // object from a booth: respect fields if present
  if (typeof out === 'object' && 'html' in out) {
    return {
      html: composeReply({
        userText,
        part: { kind: 'answer', html: out.html },
        askAllowed: out.askAllowed !== false,
        askText: out.askText || '',
        noAck: !!out.noAck
      }),
      meta: { intent: intentTag }
    };
  }

  // router-shaped (text/deck)
  const adapted = renderRouterResultToHTML(out, userText);
  if (adapted) {
    adapted.meta = Object.assign({ intent: intentTag }, adapted.meta || {});
    return adapted;
  }

  // last resort
  return {
    html: composeReply({
      userText,
      part: { kind: 'answer', html: String(out) },
      askAllowed: true
    }),
    meta: { intent: intentTag }
  };
}

// Router adapter
function renderRouterResultToHTML(routerRes, userText) {
  if (!routerRes || typeof routerRes !== 'object') return null;
  const lines = [];
  if (routerRes.text) lines.push(html(routerRes.text));
  if (Array.isArray(routerRes.deck) && routerRes.deck.length) {
    const qs = routerRes.deck.map((q, i) => {
      const num = i + 1;
      const prompt = html(q?.prompt ?? '');
      return `<div class="mt-response-item">Q${num}. ${prompt}</div>`;
    }).join('');
    lines.push(`<div class="mt-response-list">${qs}</div>`);
  }
  const merged = lines.join('<br/>');
  if (!merged) return null;
  return {
    html: composeReply({
      userText,
      part: { kind: 'answer', html: merged },
      askAllowed: true
    }),
    meta: { intent: 'router' }
  };
}

function routeUtterance(utterance) {
  const cmd = interpret(utterance);
  if (cmd) {
    if (cmd === 'help') return { text: `<p>Sorry, not on my wave length of understanding...Wanna jump into a booth?<br/>lessons booth<br/>quiz booth<br/>lore booth<br/>recipes booth<br/>calculator booth<br/>or type help to understand me better!<br/>Say one of those and I'll get you going.</p>` };
    if (cmd === 'exit') { setMode(MODES.none); return { text: '<p>👋 Back to the village center. Say help for options.</p>' }; }
    if (cmd === 'quiz fractions 3') { setMode(MODES.quiz); return MODEx.quiz.start({ topic: 'fractions', count: 3 }); }
    if (cmd === 'quiz percent 3') { setMode(MODES.quiz); return MODEx.quiz.start({ topic: 'percent', count: 3 }); }
  }
  const mode = getMode();
  if (mode === MODES.lessons) return callMode('lessons', utterance, {}) || { text: '' };
  if (mode === MODES.quiz) return callMode('quiz', utterance, {}) || { text: '' };
  if (mode === MODES.lore) return callMode('lore', utterance, {}) || { text: '' };
  if (mode === MODES.recipes) return callMode('recipes', utterance, {}) || { text: '' };
  if (mode === MODES.calculator) return callMode('calculator', utterance, {}) || { text: '' };
  return { text: `<p>Sorry, not on my wave length of understanding...Wanna jump into a booth?<br/>lessons booth<br/>quiz booth<br/>lore booth<br/>recipes booth<br/>calculator booth<br/>or type help to understand me better!<br/>Say one of those and I'll get you going.</p>` };
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
  if (!appStateLike?.progress) appStateLike.progress = {};
  if (!appStateLike.progress.mathtips) appStateLike.progress.mathtips = {};
  const SESSION_ID =
    appStateLike.progress.mathtips.sessionId ||
    (appStateLike.progress.mathtips.sessionId =
      `mt-${Date.now()}-${Math.random().toString(36).slice(2,8)}`);


  // 0a) Handle pending booth switch
  const bc0 = ensureBC();
  if (bc0.pendingSwitch) {
    const ans = t.trim();
    if (isAffirmative(ans)) {
      const p = consumePendingSwitch();
      const to = p?.to || 'none';
      setMode(MODES[to] || MODES.none);
      let prompt = '';
      if (to === 'lessons') prompt = `<p>Sweet. In lessons booth — what topic first: fractions, percent, or equations?</p>`;
      else if (to === 'quiz') prompt = `<p>Alright, quiz booth time! Want fractions, percent, or a mix?</p>`;
      else if (to === 'lore') prompt = `<p>Lore booth vibes! Wanna hear about the festival or the snowcone sages?</p>`;
      else if (to === 'recipes') prompt = `<p>Recipes booth, let’s cook! Quesadillas or snowcones today?</p>`;
      else if (to === 'calculator') prompt = `<p>Calculator booth ready! Toss me a math problem like 15% of 80.</p>`;
      else prompt = `<p>Back in the village center. Pick a booth: lessons, quiz, lore, recipes, or calculator.</p>`;

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
        part: {
          kind: 'answer',
          html: `<p>Sorry, not on my wave length of understanding...Wanna jump into a booth?<br/>lessons booth<br/>quiz booth<br/>lore booth<br/>recipes booth<br/>calculator booth<br/>or type help to understand me better!<br/>Say one of those and I'll get you going.</p>`
        },
        askAllowed: false,
        noAck: true
      }),
      meta: { intent: 'help' }
    };
  }

  if (t === 'exit' || t === '/exit') {
    setMode(MODES.none);
    return {
      html: composeReply({
        userText: text,
        part: { kind: 'answer', html: `<p>Back to the village center, ${userName}. Pick a booth: lessons booth, quiz booth, lore booth, recipes booth, or calculator booth.</p>` }
      }),
      meta: { intent: 'exit' }
    };
  }
  const m = t.match(/\b(lessons|quiz|lore|recipes|calculator)\s*booth\b/i);
  if (m) {
    const to = m[1];
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
  const booth1 = t.match(/\b(lessons?|quiz|lore|recipes?|calculator)\s+(?:booth|room|kiosk|station)\b/);
  const booth2 = t.match(/\b(?:go|take me|switch|enter|open|head|send)\s*(?:me)?\s*(?:to|into)?\s*(?:the)?\s*(lessons?|quiz|lore|recipes?|calculator)\s*(?:booth|room|kiosk|station)?\b/);
  const norm = (w) => {
    if (!w) return null;
    if (/calculator/.test(w)) return 'calculator';
    if (/lesson/.test(w)) return 'lessons';
    if (/quiz/.test(w)) return 'quiz';
    if (/lore|story|festival/.test(w)) return 'lore';
    if (/recipe/.test(w)) return 'recipes';
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
  const q = t.match(/\bquiz( me)?( on)?\s*(fractions?|percent)?\s*(\d+)?\b/);
  if (q) {
    const topic = /percent/.test(q[3] || '') ? 'percent' : (/frac/.test(q[3] || '') ? 'fractions' : 'fractions');
    const count = q[4] ? parseInt(q[4], 10) : 3;
    setMode(MODES.quiz);
    return adaptModeOutput(MODEx.quiz.start({ topic, count, userText: text, sessionId: SESSION_ID }), text, 'quiz_start');
  }

  // 0c) Algebra intercepts
  const alg = algebraIntercept(text);
  if (alg) return { html: alg, meta: { intent: 'algebra', topic: 'algebra' } };

  // 1) Active booth with off-topic guard
  // 1) Active booth with off-topic guard
  const currentMode = getMode();
  if (currentMode !== MODES.none) {

    // 🔮 calculator is global: answer percents/expressions without switching
    {
      const pcent = tryPercentOf(t);
      if (pcent) {
        return {
          html: composeReply({
            userText: text,
            part: { kind: 'answer', html: `<p>${pcent.p}% of ${pcent.n} is ${pcent.ans}.</p>` }
          }),
          meta: { intent: 'calc-inline', topic: 'calculator' }
        };
      }
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
        } catch { /* fall through to booth */ }
      }
    }

    const ask = maybeOffTopicRedirect(text, currentMode);
    if (ask) {
      return { html: ask, meta: { intent: 'offTopicAsk', from: currentMode } };
    }

    const out = callMode(currentMode, text, { sessionId: SESSION_ID });
    if (out) {
      const adapted = adaptModeOutput(out, text, `booth:${currentMode}`);
      // if a booth signals it has ended, drop back to the center
      if (adapted) {
        if (adapted?.meta?.end) setMode(MODES.none);
        return adapted;
      }
    }
    // ... keep your existing fallback
  }


  // 🔮 calculator is global: answer percent or safe expressions without switching modes
  {
    const p = tryPercentOf(t);
    if (p) {
      return {
        html: composeReply({
          userText: text,
          part: { kind: 'answer', html: `<p>${p.p}% of ${p.n} is ${p.ans}.</p>` },
        }),
        meta: { intent: 'calc-inline', topic: 'calculator' }
      };
    }
    if (SAFE_EXPR.test(t)) {
      try {
        const result = evalSafeExpression(t);
        return {
          html: composeReply({
            userText: text,
            part: { kind: 'answer', html: `<p>${t} = ${result}</p>` },
          }),
          meta: { intent: 'calc-inline', topic: 'calculator' }
        };
      } catch { /* ignore and continue booth */ }
    }
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
            line = `<p>Fresh slate, ${userName}. Pick a booth: lessons, quiz, lore, recipes, or calculator.</p>`;
            break;
          default:
            line = `<p>Command’s not clicking, ${userName}. Say help for options.</p>`;
        }
        break;
            case 'who': {
        const line = `<p>${pick(RESPONSES.who_are_you)} Ready to vibe, ${userName}? Try lessons booth or quiz fractions 3.</p>`;
        return {
          html: composeReply({
            userText: text,
            part: { kind: 'answer', html: line },
            askAllowed: false, // no nudge
            noAck: true        // no "alright, friend."
          }),
          meta: { intent: guess }
        };
      }

      case 'greet': {
        const line = `<p>${pick(RESPONSES.greetings)} Let’s roll, ${userName} — pick a booth: lessons, quiz, lore, recipes, or calculator.</p>`;
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
        const line = `<p>${pick(RESPONSES.jokes)} More laughs, ${userName}? Try lore booth for festival tales.</p>`;
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
        return adaptModeOutput(MODEx.lessons.handle(text), text, 'booth:lessons');
      case 'quiz_fractions': {
        setMode(MODES.quiz);
        const out = callMode('quiz', 'start fractions 3', { topic: 'fractions', count: 3, userText: text }) || MODEx.quiz?.start?.({ topic: 'fractions', count: 3, userText: text });
        return adaptModeOutput(out, text, 'quiz_start');
      }
      case 'quiz_percent':
        setMode(MODES.quiz);
        return adaptModeOutput(MODEx.quiz.start({ topic: 'percent', count: 3, userText: text }), text, 'quiz_start');
      case 'percent': {
        const p = tryPercentOf(t);
        if (p) {
          setMode(MODES.calculator);
          return {
            html: composeReply({
              userText: text,
              part: { kind: 'answer', html: `<p>${p.p}% of ${p.n} is ${p.ans}. More math in calculator booth, ${userName}?</p>` }
            }),
            meta: { intent: 'percent', topic: 'calculator' }
          };
        }
        break;
      }
      case 'calc': {
        try {
          const result = evalSafeExpression(t);
          setMode(MODES.calculator);
          return {
            html: composeReply({
              userText: text,
              part: { kind: 'answer', html: `<p>${t} = ${result}. Toss another in calculator booth, ${userName}?</p>` }
            }),
            meta: { intent: 'calc', topic: 'calculator' }
          };
        } catch {
          return {
            html: composeReply({
              userText: text,
              part: { kind: 'answer', html: `<p>That math’s a bit wild, ${userName}. Try something like 15% of 80 or jump to calculator booth.</p>` }
            }),
            meta: { intent: 'calc-fail' }
          };
        }
      }
      default:
        line = `<p>Sorry, not on my wave length, ${userName}. Wanna jump into a booth?<br/>lessons booth<br/>quiz booth<br/>lore booth<br/>recipes booth<br/>calculator booth<br/>or type help to understand me better!</p>`;
    }
    return {
      html: composeReply({
        userText: text,
        part: { kind: 'answer', html: line },
        askAllowed: true
      }),
      meta: { intent: guess }
    };
  }

  // 2) Router fallback
  try {
    const routed = routeUtterance(text);
    const adapted = renderRouterResultToHTML(routed, text);
    if (adapted && adapted.html) return adapted;
  } catch (e) {
    console.warn('[router adapter] fell through:', e);
  }

  // 3) Final fallback
  return {
    html: composeReply({
      userText: text,
      part: {
        kind: 'answer',
        html: `<p>Sorry, not on my wave length, ${userName}. Wanna jump into a booth?<br/>lessons booth<br/>quiz booth<br/>lore booth<br/>recipes booth<br/>calculator booth<br/>or type help to understand me better!</p>`
      },
      askAllowed: true
    }),
    meta: { intent: 'fallback' }
  };
}

// Scrolling logic
export function scrollToBottom() {
  if (typeof document === 'undefined') return;
  const chatWindow = document.querySelector('.chat-window');
  if (chatWindow) {
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
}

export function attachAutoScroller(containerId = 'chat-window') {
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return;
  const el = document.getElementById(containerId) || document.querySelector('.chat-window');
  if (!el) return;
  const mo = new MutationObserver(() => scrollToBottom());
  mo.observe(el, { childList: true, subtree: true });
  scrollToBottom();
  return () => mo.disconnect();
}
