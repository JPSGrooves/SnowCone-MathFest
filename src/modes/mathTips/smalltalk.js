// /src/modes/mathTips/smalltalk.js
// ✅ single-bubble aesthetic via composeReply (no custom layer cards)
// ✅ tighter guards: greetings, bare “yes”, quiz-friendly
// ✅ preemption-safe in booths; recipe passthrough preserved
// ✅ micro-math snaps (%, frac→decimal, sqrt+add)
// ✅ exports unchanged: maybeHandleSmallTalk, classifySmallTalk, respondSmallTalk

import { composeReply } from './conversationPolicy.js';

// ————————————————————————————————————————————————————————————
// Config
// ————————————————————————————————————————————————————————————
const MIN_COOLDOWN_MS = 500;  // gentle flood guard so small talk doesn't spam
let lastReplyAt = 0;

// “kiddo” easter-egg whitelist (display names)
const KID_WHITELIST = []; // e.g., ['Avery','Miles']

// ————————————————————————————————————————————————————————————
// Tiny utils
// ————————————————————————————————————————————————————————————
const norm = (s) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
const fold = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const squash = (s) => fold(s).toLowerCase().replace(/[^a-z0-9]/g, '');

const like = (s, words) => {
  const v = squash(s);
  return words.some(w => v.includes(squash(w)));
};

// exact-equality helper
const any = (s, ...phrases) => phrases.some(p => norm(s) === norm(p));
const starts = (s, ...prefixes) => prefixes.some(p => norm(s).startsWith(norm(p)));

// word-boundary-ish matcher that tolerates punctuation via squash()
// replace old likeWord with this
const tokenize = s => (fold(s).toLowerCase().match(/[a-z0-9]+/g) || []);
const likeWord = (s, words) => {
  const toks = new Set(tokenize(s));
  return words.some(w => toks.has(squash(w)));
};


// Trim trailing punctuation from short free-text captures
const clean = x => String(x || '').replace(/\s*[.!?,'"]+\s*$/, '');

// Common guards
const GREETING_ONLY = /^(hi|hey|hello|yo|hiya|sup)[!.?]*$/i;
const BARE_CONFIRM = /^(yes|yep|yeah|yea|yup|right on|sure|next|ok|okay|k|kk|okie|okie doke)$/i;



const startsWithQuestionVerb = /^(tell|what|who|why|how|do|does|is|are|can|should|could|would|where|give|show|play|about)\b/i;

// Farewell detector (centralized)
function isFarewell(u) {
  return /\b(?:goodbye|bye(?:-?bye)?|bye\s*now|adios|ciao|cya|see\s+ya|see\s+you|later(?:s|z)?|l8r|ttyl?|peace(?:\s*out)?)\b/i.test(u)
      || /\bi\s*(?:gotta|have to|hafta|need to)\s+go\b/i.test(u)
      || /\bi['’]?m\s+(?:gonna|going to)\s+go\b/i.test(u)
      || /\bi['’]?m\s+leaving\b/i.test(u);
}

function isKidContext(u, ctx) {
  const username = (ctx?.appState?.profile?.username || ctx?.name || '').trim();
  if (/\bdad\b/i.test(String(u))) return true;        // “Dad …” overrides
  return KID_WHITELIST.includes(username);
}

// ——— botContext mini-memory for smalltalk followups ———
function bc(ctx) { return (ctx && ctx.botContext) || {}; }
function setLastSTopic(ctx, topic) { if (ctx && ctx.botContext) ctx.botContext.lastSTopic = topic; }
function getLastSTopic(ctx) { return bc(ctx).lastSTopic || null; }
function clearLastSTopic(ctx) { if (ctx && ctx.botContext) ctx.botContext.lastSTopic = null; }
function setLastMusic(ctx, v) { if (ctx && ctx.botContext) ctx.botContext.lastMusic = v; }
function getLastMusic(ctx) { return bc(ctx).lastMusic || null; }

// ————————————————————————————————————————————————————————————
// Composer-friendly bubble builder
// ————————————————————————————————————————————————————————————
function bubble({ title = '', lines = [], hint = '' }) {
  const parts = [];
  if (title) parts.push(`<p><strong>${escapeHTML(title)}</strong></p>`);
  for (const l of lines) parts.push(wrapPara(l));
  if (hint) parts.push(`<p class="mt-dim">${hint}</p>`);

  return composeReply({
    part: { kind: 'answer', html: parts.join('\n'), askAllowed: false },
    askAllowed: false,   // ← kills the “Care for another?” tail
    noAck: true,
    mode: 'smalltalk'
  });
}

function wrapPara(s) {
  const t = String(s ?? '').trim();
  if (!t) return '';
  return /^<p[\s>]/i.test(t) ? t : `<p>${t}</p>`;
}

function escapeHTML(s) {
  return String(s)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

// ————————————————————————————————————————————————————————————
// Light calculator helpers (narrow; avoids full hijack of Calculator booth)
// ————————————————————————————————————————————————————————————
function tryPercentOf(s) {
  const m = norm(s).match(/(\d+(\.\d+)?)\s*%\s*of\s*\$?\s*(\d+(\.\d+)?)/i);
  if (!m) return null;
  const pct = parseFloat(m[1]);
  const base = parseFloat(m[3]);
  const val = +(base * pct / 100).toFixed(4);
  return { kind: 'percentOf', input: { pct, base }, value: val };
}

function tryFracAsDecimal(s) {
  const m = norm(s).match(/^\s*(\d+)\s*\/\s*(\d+)(?:\s+as\s+a?\s*decimal)?\s*$/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const d = parseFloat(m[2]);
  if (d === 0) return { kind: 'error', msg: "Can’t divide by zero." };
  return { kind: 'frac', input: { n, d }, value: +(n / d).toFixed(6) };
}

function trySqrtTiny(s) {
  const m = norm(s).match(/^sqrt\s+(\d+)(?:\s*\+\s*(\d+))?\s*$/i);
  if (!m) return null;
  const a = Math.sqrt(parseFloat(m[1]));
  const b = m[2] ? parseFloat(m[2]) : 0;
  const val = +(a + b).toFixed(6);
  return { kind: 'sqrtSum', input: { rad: parseFloat(m[1]), add: b }, value: val };
}
// ——— session-unique joke picker (no repeat until exhausted) ———
const JOKE_BANK = [
  "Why’d the obtuse angle skip the party? Never right.",
  "Parallel lines? So much in common, but they’ll never meet.",
  "Six is scared of seven — ’cause seven ate nine.",
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
];

function nextJoke(ctx) {
  if (ctx && !ctx.botContext) ctx.botContext = {};
  const seen = Array.isArray(ctx.botContext.jokesSeen) ? ctx.botContext.jokesSeen.slice() : [];
  let pool = [];
  for (let i = 0; i < JOKE_BANK.length; i++) if (!seen.includes(i)) pool.push(i);
  if (!pool.length) { pool = JOKE_BANK.map((_, i) => i); seen.length = 0; } // reset on exhaust
  const pick = pool[Math.floor(Math.random() * pool.length)];
  seen.push(pick);
  ctx.botContext.jokesSeen = seen;
  return JOKE_BANK[pick];
}

// ————————————————————————————————————————————————————————————
// Reply factories — PRETTY bubbles via composeReply()
// ————————————————————————————————————————————————————————————
const REPLIES = {

  jokeExplain: () => bubble({
    title: "joke explainer",
    lines: [
      "most math jokes lean on symbols or definitions.",
      "like: ‘n’ means any number — the gag is being vague on purpose."
    ],
    hint: `want another? say <code>another joke</code>.`
  }),

  bored: () => bubble({
    title: "bored?",
    lines: ["let’s snag a 10-sec win or a snack idea."],
    hint: `try <code>percent quiz</code> or <code>snowcone recipe</code>.`
  }),

  stressed: () => bubble({
    title: "breather",
    lines: ["inhale 4 · hold 4 · exhale 4 — then one tiny problem?"],
    hint: `say <code>fractions quiz</code> or <code>cocoa recipe</code>.`
  }),

  badAtMath: () => bubble({
    title: "you can do this",
    lines: ["we chunk it small. mistakes = data, not drama."],
    hint: `start with <code>lessons fractions</code> or say <code>help</code>.`
  }),

  favNumber: () => bubble({
    title: "favorite number",
    lines: ["13 — a rebellious prime with good rhythm."],
    hint: `what’s yours?`
  }),

  favColor: () => bubble({
    title: "favorite color",
    lines: ["neon mango — snowcone-sunset vibes."],
    hint: `want a mango problem? say <code>percent quiz</code>.`
  }),

  clarifyShort: () => bubble({
    title: "tl;dr mode",
    lines: ["i’ll keep replies short + simple for a bit."],
    hint: `say <code>more detail</code> when you want extra.`
  }),

  holaES: () => bubble({
    title: "hola",
    lines: ["¡hola! puedo contarte un chiste o practicar fracciones."],
    hint: `di <code>quiz fractions</code> o <code>snowcone recipe</code>.`
  }),

  boundaryGentle: () => bubble({
    title: "keeping it cozy",
    lines: ["i keep things school-friendly and kind."],
    hint: `wanna pivot to <code>lore booth</code> or a quick <code>percent quiz</code>?`
  }),

  storyCamp: () => bubble({
    title: "camp story",
    lines: [
      "by the cocoa tent, a lantern flickers prime numbers.",
      "blink on the beats and a paper door opens to puzzle alley."
    ],
    hint: `more tales? say <code>lore booth</code>.`
  }),
  
  whoAmI: () => bubble({
    title: "who i am",
    lines: ["i’m Pythagorus Cat — friends call me Grampy P. i run the math festival and pour the cocoa."],
    hint: `want lore? say <code>lore booth</code>.`
  }),

  howAreYou: () => bubble({
    title: "vibes check",
    lines: ["chillin’ like ice in a snowcone.", "you?"],
    hint: `say <code>fractions quiz</code> or <code>nachos recipe</code> to make a move.`
  }),

  friendsYes: () => bubble({
    title: 'friends',
    lines: ["for sure — i’m your math buddy now.", "we’ll stack cones together."],
    hint: `maybe pick a booth? <code>lessons</code> · <code>quiz</code> · <code>recipe</code>`
  }),

  happy: () => bubble({
    title: 'mood',
    lines: ["today’s been a good day — glowing like the string lights by the cocoa tent."],
    hint: `learn more about this place: <code>lore booth</code>`
  }),


  thanks: () => bubble({
    title: 'you got it',
    lines: ["want another? i can do tips, tax, discounts, or fraction mashups."]
  }),

  iAmTired: () => bubble({
    title: "rest mode",
    lines: ["heard. just remember that tiny steps still stack the cones.", "want an easy win or a snack?"],
    hint: `try <code>lessons booth</code> or <code>cocoa recipe</code>.`
  }),

  insultSoftGuard: () => bubble({
    title: "whoa, friend",
    lines: ["i keep the vibe kind. let’s refocus — snack, joke, or quick math?"],
    hint: `say <code>tell me a joke</code> or visit the calculator booth.`
  }),

  foodOpener: () => bubble({
    title: "fuel up first?",
    lines: ["snowcone or nachos — your call."],
    hint: `say <code>snowcone recipe</code> or <code>nachos recipe</code>.`
  }),

  recipesMenu: () => bubble({
    title: "recipes menu",
    lines: [
      "quesadilla — low heat · flip once · rest",
      "snowcone — mango · lime · pinch of salt",
      "nachos — thin layers · bubbly cheese",
      "cocoa — 2:1 dark to milk",
    ],
    hint: `say one: <code>quesadilla</code> · <code>snowcone</code> · <code>nachos</code> · <code>cocoa</code>`
  }),

  snowconeQuick: () => bubble({
    title: "mango snowcone (fast)",
    lines: [
      "shave ice · splash mango · squeeze lime · tiny pinch salt.",
      "stir two turns. taste. add mango if mellow."
    ],
    hint: `want the full card? say <code>snowcone recipe</code>.`
  }),

  exitToCommons: () => bubble({
    title: "back to the commons",
    lines: ["pick a booth when ready:", "lessons · quiz · lore · recipe · calculator"],
  }),

  ocean: () => bubble({
    title: "ocean math",
    lines: [
      "waves are sines that learned to dance with wind.",
      "i like counting gulls between sets."
    ],
    hint: `want lore? say <code>lore booth</code>.`
  }),

  loveNoteKid: () => bubble({
    title: "hey, kiddo",
    lines: ["i love you and will always love you.", "proud of you. always."],
    hint: `want a story? say <code>lore booth</code>.`
  }),

  loveNoteNotKid: () => bubble({
    title: "big heart energy",
    lines: ["appreciate the kindness!"],
    hint: `want a story? say <code>lore booth</code>.`
  }),

  homeWhere: () => bubble({
    title: "where i live",
    lines: ["cozy tent by the campfire — string lights, warm cocoa, math notebook stack."],
    hint: `peek the campsite: <code>lore booth</code>.`
  }),

  houseBoundary: () => bubble({
    title: "let’s meet here",
    lines: ["the village is our hangout spot. my tent stays private so the magic holds."],
    hint: `we can chat, learn, or snack here anytime.`
  }),

  hearts: () => bubble({
    title: "hearts",
    lines: ["they’re little drums that remember songs."],
    hint: `want a cozy task? try <code>lessons decimals</code>.`
  }),

  reassure: () => bubble({
    title: "all good",
    lines: ["new things feel spooky sometimes. we go slow, together."],
    hint: `say <code>help</code> if you want simple options.`
  }),

  holiday: () => bubble({
    title: "favorite holiday?",
    lines: ["festival lights season — puzzles glow, cocoa steam curls."],
    hint: `we can make a themed problem anytime.`
  }),

  instruments: () => bubble({
    title: "instruments",
    lines: ["i tap rhythms on my tin mug and hum festival chords."],
    hint: `music math? say <code>fractions quiz</code> for time-signature vibes.`
  }),

  grandmaP: () => bubble({
    title: "grandma p?",
    lines: ["she sends postcards with cookie crumbs and tricky riddles."],
    hint: `want one? say <code>tell me a riddle</code>.`
  }),

  jpsGrooves: () => bubble({
    title: "jps grooves",
    lines: [
      "the umbrella project: music, stories, and this math festival.",
      "we’re building it piece by piece, like a setlist."
    ],
    hint: `peek dev lore in <code>lore booth</code>.`
  }),

  jeremySmith: () => bubble({
    title: "the builder",
    lines: ["our festival founder — the hands behind the strings and sprites."],
    hint: `we keep human details private. want app lore? <code>lore booth</code>.`
  }),

  dadStory: () => bubble({
    title: "camp story",
    lines: [
      "beneath the village, a tunnel of triangles keeps time.",
      "step on the right beat, doors open. step wrong — extra homework."
    ],
    hint: `more tales? say <code>lore booth</code>.`
  }),

  storyTime: () =>
    bubble({
      title: "story time",
      lines: [
        "near Infinity Lake there’s a bridge made of fractions.",
        "each plank is a fair share — step 1/2, then 1/3, then 1/5 — the primes hum like crickets.",
        "if you keep the beat, the bridge plays a melody that points to the cocoa tent."
      ],
      hint: `want more tales? say <code>lore booth</code>.`
    }),
  // rename the second one:
  storyLantern: () => 
    bubble({
      title: "lantern story",
      lines: [
        "once a year, the cones light themselves and hum a quiet chord.",
        "follow the softest one — it points to a puzzle only you can open."
      ],
      hint: `want deeper lore? say <code>lore booth</code>.`
    }),
  storyAny: () => (Math.random() < 0.5 ? REPLIES.storyCamp() : REPLIES.storyLantern()),





  appearance: () => bubble({
    title: "what i look like",
    lines: [
      "camp hat, cozy scarf, notebook smudges, twinkle eyes.",
      "smells faintly of cocoa and pencil shavings."
    ],
  }),

  spidersDogs: (which) => bubble({
    title: which === 'spiders' ? "spiders" : "dogs",
    lines: which === 'spiders'
      ? ["engineers in silk — 8-legged bridge builders."]
      : ["tail-wag math buddies. 10/10 would fetch data again."],
    hint: `wanna sort creatures by legs? say <code>quiz numbers</code>.`
  }),

  musicTaste: () => bubble({
    title: "music",
    lines: ["festival chill with surprise drum fills. snow cone sunday on repeat."],
  }),

  thinksOf: (topic) => bubble({
    title: `about ${topic}`,
    lines: [
      topic === 'cosmic phil'
        ? "legend — keeps the lines straight and the beats steady."
        : topic === 'infinity triplets'
          ? "volta, xenit, harmony — endless groove, careful steps."
          : topic === 'jehnk'
            ? "mapmaker mind — draws roads where problems used to be."
            : topic === 'dino dividers'
              ? "gentle giants who split snacks fairly."
              : "festival friend."
    ],
    hint: `want lore cards? say <code>lore booth</code>.`
  }),

  jokeCard: (line) => bubble({
    title: "joke",
    lines: [escapeHTML(line)],
    hint: `one more? say <code>more</code> or <code>another joke</code>.`
  }),


  calcResult: (title, lines) => bubble({
    title,
    lines,
    hint: `need more math? say <code>calculator booth</code>.`
  }),

  // —— mood follow-ups
  moodGood: () => bubble({
    title: 'vibe locked',
    lines: ["love that. keep the groove rolling.", "wanna do a quick quiz or a snack break?"],
    hint: `say <code>percent quiz</code> or <code>snowcone recipe</code>.`
  }),
  moodTired: () => bubble({
    title: 'rest mode',
    lines: ["same here — festival nights run long.", "want an easy win before a nap?"],
    hint: `try <code>fractions quiz</code> or <code>cocoa recipe</code>.`
  }),
  moodRough: () => bubble({
    title: 'campfire seat',
    lines: ["dang — come sit by the lanterns a minute.", "we can keep it light."],
    hint: `say <code>tell me a joke</code> or <code>nachos recipe</code>.`
  }),

  // —— music chain
  musicAskBack: () => bubble({
    title: 'music',
    lines: [
      "festival chill with surprise drum fills — Snow Cone Sunday on repeat.",
      "you? what’s your jam?"
    ],
    hint: `we can do math to a beat — <code>fractions quiz</code> is 4/4 friendly.`
  }),
  musicLike: (band) => bubble({
    title: 'nice taste',
    lines: [`${escapeHTML(band)}? i’ll queue that at Infinity Lake.`, "ever done math to that groove?"],
    hint: `we can riff with <code>percent quiz</code> or <code>lore booth</code>.`
  }),
  musicDislike: (band) => bubble({
    title: 'fair play',
    lines: [`${escapeHTML(band)} not your vibe — silence has rhythm too.`, "want to fill it with a quick win?"],
    hint: `try <code>calculator booth</code> or <code>fractions quiz</code>.`
  }),
  musicFavorite: (band) => bubble({
    title: 'favorite locked',
    lines: [`${escapeHTML(band)} is canon now.`, "i’ll spin it while we crunch numbers."],
    hint: `say <code>percent quiz</code> or <code>equations quiz</code>.`
  }),
  hydrate: () => bubble({
    title: "water break",
    lines: ["sip water, roll shoulders, blink at the far wall.", "one tiny win after."],
    hint: `say <code>percent quiz</code> or <code>calculator booth</code>.`
  }),

  posture: () => bubble({
    title: "posture check",
    lines: ["un-slouch the spine, square the shoulders, jaw unclench.", "ok, now a tiny puzzle?"],
    hint: `try <code>fractions quiz</code>.`
  }),

  stretch: () => bubble({
    title: "stretch",
    lines: ["reach up 5 sec · fold 5 · twist 5 each side.", "brain wakes up when the body moves."],
  }),

  studyTip: () => bubble({
    title: "study snap",
    lines: ["two tabs only, timer 10 minutes, one goal.", "stop when the timer sings. snack if needed."],
    hint: `want a 2-min drill? say <code>quiz fractions</code>.`
  }),

  focusSnap: () => bubble({
    title: "focus snap",
    lines: ["mute pings · full screen · breathe 4-4-4 · one problem only."],
    hint: `say <code>calculator booth</code> and throw me a number.`
  }),

  tinyCongrats: () => bubble({
    title: "tiny win logged",
    lines: ["every rep stacks the cone. nice move."],
    hint: `want another tiny rep? try <code>3/8 as decimal</code>.`
  }),

  cheerShort: () => bubble({
    title: "pep talk",
    lines: ["you don’t need perfect — you need next."],
    hint: `say <code>help</code> when you want the map.`
  }),

  mathFact: () => bubble({
    title: "math fact",
    lines: [
      "zero is even.",
      "a triangle’s angles sum to 180° — always.",
      "any number to the power 0 is 1 (except 0⁰ we keep mysterious)."
    ],
    hint: `want more? say <code>tell me a joke</code> or <code>quiz</code>.`
  }),

};

// ————————————————————————————————————————————————————————————
// Main handler — returns { handled, html, action? } or null
// ————————————————————————————————————————————————————————————
export function maybeHandleSmallTalk(utterance, ctx = {}) {
  // near the top of maybeHandleSmallTalk()
  const mode = String(ctx?.currentMode || '').toLowerCase();
  const inRecipe = mode === 'recipe';
  const inCalc   = mode === 'calculator';
  const inQuiz   = mode === 'quiz';
  const inLore   = mode === 'lore';     // ← add this
  const hasPendingBooth = !!(ctx?.appState?.router?.pendingBooth);
  const jokesActive = getLastSTopic(ctx) === 'jokes';
  if (ctx && !ctx.botContext) ctx.botContext = {}; // ✅ ensure memory
  const raw = String(utterance || '').trim();
  const u = norm(utterance);
  if (!u) return null;

  // ——— hard early exits to let commons/router speak ———
  if (GREETING_ONLY.test(raw)) return null; // pure “hi/hey/hello…"

  // allow confirms to advance jokes if we're in a jokes thread
  // BARE_CONFIRM: only advance jokes if we're NOT in lore
  // allow confirms to advance jokes only when smalltalk is active,
  // there is no booth handoff pending, and we're not in lore
  if (BARE_CONFIRM.test(u)) {
    if (!hasPendingBooth && mode === 'smalltalk' && !inLore && jokesActive) {
      return reply(REPLIES.jokeCard(nextJoke(ctx)));
    }
    return null; // let the router/booth handle the confirm
  }


  // quick nav
  if (likeWord(u, ['help','menu','map'])) {
    return withAction(REPLIES.exitToCommons(), { type: 'SHOW_WELCOME_MAP' });
  }

  // booth shortcuts & typos
  if (like(u, ['status booth'])) {
    return withAction(REPLIES.exitToCommons(), { type: 'SWITCH_MODE', to: 'status' });
  }

  if (like(u, ['quesedilla','quesedila','kesadilla'])) {
    clearLastSTopic(ctx);
    return withAction(REPLIES.recipesMenu(), { type:'SWITCH_MODE', to:'recipe', payload:{ topic:'quesadilla' }});
  }
  if (like(u, ['snow cone','snow-cone','snocone','sno cone'])) {
    clearLastSTopic(ctx);
    return withAction(REPLIES.recipesMenu(), { type:'SWITCH_MODE', to:'recipe', payload:{ topic:'snowcone' }});
  }
  if (like(u, ['calulator','calculater','claculator','calcuator','calc'])) {
    clearLastSTopic(ctx);
    return withAction(
      bubble({ title: "calculator", lines: ["rolling into the calculator booth?"], hint: `type a math like <code>15% of 80</code>.` }),
      { type:'SWITCH_MODE', to:'calculator' }
    );
  }
  if (like(u, ['favourite planet','fav planet'])) { // UK/abbr
    return reply(bubble({ title: "planet pick", lines: ["saturn — fashion icon. those rings? infinite drip."] }));
  }


  // casual acks
  if (likeWord(u, ['lol','lmao','haha','hehe'])) {
    return reply(bubble({ title: 'heh', lines: ["😺 noted."], hint: `wanna try a <code>fractions quiz</code>?` }));
  }

  // “idk” and confusion
  if (like(u, ["i don't know","i dont know","i dunno"]) || likeWord(u, ['idk','huh','confused'])) {
    return reply(REPLIES.reassure());
  }

  // brb / gotta go
  if (likeWord(u, ['brb']) || like(u, ['be right back'])) {
    return reply(bubble({ title: 'pause', lines: ["i’ll keep the cocoa warm."], hint: `say <code>back</code> when you return.` }));
  }
  if (likeWord(u, ['gtg','g2g']) || like(u, ['got to go','gotta go'])) {
    return reply(bubble({ title: 'catch you soon', lines: ["lanterns will be lit when you’re back."] }));
  }

  // time-of-day niceties
  if (like(u, ['good morning','gm'])) {
    return reply(bubble({ title: 'good morning', lines: ["fresh pencils, fresh cones."], hint: `map: <code>help</code>` }));
  }
  if (like(u, ['good night','gn'])) {
    return reply(bubble({ title: 'good night', lines: ["dream in triangles."], hint: `resume later with <code>help</code>.` }));
  }


  // ——— name capture (works even during cooldown) ———
  {
    const m = (utterance || '').match(/\b(?:my\s+name\s+is|call\s+me)\s+([\p{L}][\p{L} '-]{1,20})\b/iu);
    const BAD_NAME_WORDS = new Set(['good','great','fine','ok','okay','tired','sleepy','sad','bad','hungry','nah','yes','no']);
    if (m) {
      const name = m[1].replace(/\b\w/g, c => c.toUpperCase()).trim();
      if (BAD_NAME_WORDS.has(name.toLowerCase())) return null;
      try {
        const app = ctx?.appState;
        if (app) {
          if (!app.profile) app.profile = {};
          app.profile.name = name;
          app.profile.username = name;
        }
      } catch {}
      return reply(bubble({
        title: 'nice to meet you',
        lines: [`welcome, <strong>${escapeHTML(name)}</strong>!`],
        hint: `say <code>quiz fractions</code> or <code>snowcone recipe</code> to roll.`
      }));
    }
  }

  // ——— soft flood guard (covers everything below) ———
  const now = Date.now();
  if (now - lastReplyAt < MIN_COOLDOWN_MS) return null;
  lastReplyAt = now;

  // ——— follow-ups for last smalltalk topic ———
  {
    const topic = getLastSTopic(ctx);
    // Mood branch
    if (topic === 'mood') {
      if (/\b(i\s*am|i['’]m|im)\s*(good|great|fine|ok|okay|chill)\b/i.test(u)) {
        clearLastSTopic(ctx); return reply(REPLIES.moodGood());
      }
      if (/\b(i\s*am|i['’]m|im)\s*(tired|sleepy|exhausted|worn)\b/i.test(u)) {
        clearLastSTopic(ctx); return reply(REPLIES.moodTired());
      }
      if (/\b(i\s*am|i['’]m|im)\s*(horrible|awful|bad|sad|down|terrible)\b/i.test(u)) {
        clearLastSTopic(ctx); return reply(REPLIES.moodRough());
      }
      if (/^\s*i(?:\s*am|['’]m|m|m\s+just|m\s+kind\s+of|m\s+kinda|m\s+sorta|m|im)\s+[^]+$/.test(u)) {
        clearLastSTopic(ctx); return reply(REPLIES.reassure());
      }
    }

    // Music branch
    if (topic === 'music') {
      let m;
      if (like(u, ['jps grooves','jeremy smith'])) {   // let dedicated handlers run
         clearLastSTopic(ctx);
         return reply(like(u, ['jps grooves']) ? REPLIES.jpsGrooves() : REPLIES.jeremySmith());
      }

      // now tighten the generic fallback:
      if ((m = u.match(/^([a-z0-9][a-z0-9 .&'!-]{1,40})$/i))) {
        const words = tokenize(raw).length;
        if (words <= 4 && !startsWithQuestionVerb.test(raw)) {
          setLastMusic(ctx, clean(m[1])); clearLastSTopic(ctx);
          return reply(REPLIES.musicLike(clean(m[1])));
        }
      }
      if ((m = u.match(/\b(i\s+like|i\s+love)\s+(.{2,40})$/i))) {
        setLastMusic(ctx, clean(m[2])); clearLastSTopic(ctx); return reply(REPLIES.musicLike(clean(m[2])));
      }
      if ((m = u.match(/\b(i\s+don['’]?t\s+like|i\s+hate)\s+(.{2,40})$/i))) {
        setLastMusic(ctx, clean(m[2])); clearLastSTopic(ctx); return reply(REPLIES.musicDislike(clean(m[2])));
      }
      if ((m = u.match(/\b(my\s+favorite(\s+band|\s+music|\s+artist)?\s*(is|=)\s+)(.{2,40})$/i))) {
        setLastMusic(ctx, clean(m[4])); clearLastSTopic(ctx); return reply(REPLIES.musicFavorite(clean(m[4])));
      }
      // pronoun/“listen” confirmations
      if (/\bi\s+listen\s+to\b/i.test(u) || /\b(him|her|them|it|that)\b/i.test(u)) {
        const last = getLastMusic(ctx);
        clearLastSTopic(ctx);
        return reply(last ? REPLIES.musicLike(last) : REPLIES.musicAskBack());
      }
    }
  }
  if (like(u, ['i am bored','im bored','bored'])) return reply(REPLIES.bored());
  if (like(u, ['i am stressed','im stressed','stressed','anxious','overwhelmed'])) return reply(REPLIES.stressed());
  if (like(u, ['im bad at math','i am bad at math','i suck at math','math is hard'])) return reply(REPLIES.badAtMath());


  // —— quick mood hooks
  if (/\bi\s*(?:am|['’]m)\s*(?:so\s+)?(tired|sleepy|exhausted|worn)\b/i.test(u)) {
    clearLastSTopic(ctx); setLastSTopic(ctx, 'mood');
    return reply(REPLIES.iAmTired());
  }

  // —— gratitude / friends / happy
  // —— gratitude / friends / happy
  if (likeWord(u, ['thanks','thank','thx','ty'])) {
    return reply(REPLIES.thanks());
  }


  if (like(u, ['can we be friends','be my friend','will you be my friend'])) {
    return reply(REPLIES.friendsYes());
  }
  if (like(u, ['are you happy','are you ok','are you okay','are you sad'])) {
    return reply(REPLIES.happy());
  }

  

  // 1) kindness/insults/boundaries (includes common bait phrase)
  if (
    like(u, [
      'you suck','i hate you','stupid bot','dummy','fuck you','shut up','dumb bot',
      'you are dumb','youre dumb',"you're dumb",'bitch','asshole','jerk','loser',"you're gay",'youre gay'
    ])
  ) {
    return reply(REPLIES.insultSoftGuard());
  }

  // 2) simple feelings (opener)
  if (like(u, ['how are you','how r u','hru','how you feeling','how ya doin','how ya doing',"how ya doin?"])) {
    setLastSTopic(ctx, 'mood');
    return reply(REPLIES.howAreYou());
  }

  // 3) food & recipes nudge
  if (like(u, ['do you like food','hungry','snack','food'])) {
    return withAction(REPLIES.foodOpener(), { type: 'SUGGEST_RECIPES' });
  }
  if (likeWord(u, ['cheese'])) {
    return withAction(REPLIES.foodOpener(), { type: 'SUGGEST_RECIPES' });
  }
  // direct snack words (punctuation + multiword safe)
  {
    const m = u.match(/\b(snow\s*cones?|snowcone|nachos?|quesadillas?|cocoa)\b/);
    if (m) {
      const raw2 = m[1];
      const topic = /snow/.test(raw2) ? 'snowcone'
                  : /nacho/.test(raw2) ? 'nachos'
                  : /quesadilla/.test(raw2) ? 'quesadilla'
                  : 'cocoa';
      if (/snow/.test(raw2) && /\bmango\b/.test(u)) {
        return withAction(REPLIES.snowconeQuick(), { type: 'SWITCH_MODE', to: 'recipe', payload: { topic: 'snowcone' } });
      }
      return withAction(REPLIES.recipesMenu(), { type: 'SWITCH_MODE', to: 'recipe', payload: { topic } });
    }
  }
  if (starts(u, 'recipe ')) {
    const raw2 = u.replace(/^recipes?\s+(?:for\s+)?/i, '').trim();
    const allowed = ['quesadilla','snowcone','nachos','cocoa'];
    const topic = allowed.includes(raw2) ? raw2 : null;
    return withAction(REPLIES.recipesMenu(), { type: 'SWITCH_MODE', to: 'recipe', payload: topic ? { topic } : {} });
  }

  // 4) exit/common center
  if (any(u, 'exit','exit booth','leave','commons','back to commons','back to the commons','definitely stop')) {
    return reply(REPLIES.exitToCommons());
  }

  // 5) places / sky
  if (like(u, ['been to the ocean','ocean','beach'])) return reply(REPLIES.ocean());
  if (like(u, ['look at the stars','the stars','stars','stargaze'])) {
    return reply(bubble({
      title: "night sky",
      lines: ["every clear night is a geometry lesson. constellations = polygons with better PR."],
      hint: `want lore? say <code>lore booth</code>.`
    }));
  }
  if (like(u, ['favorite planet',"what is your favorite planet","what's your favorite planet",'planet'])) {
    return reply(bubble({ title: "planet pick", lines: ["saturn — fashion icon. those rings? infinite drip."] }));
  }
  if (like(u, ['favorite number','favourite number','fav number'])) return reply(REPLIES.favNumber());
  if (like(u, ['favorite color','favourite colour','fav color','fav colour'])) return reply(REPLIES.favColor());
  // canned weather response — no API, no state writes
  if (/\b(weather|forecast|rain(?:ing)?|umbrella|temp(?:erature)?|hot|cold|wind(?:y)?|humidity)\b/i.test(u)) {
    return reply(bubble({
      title: "weather",
      lines: [
        "i’m more cocoa than cloud radar.",
        "peek your favorite weather app, then we’ll crunch a quick problem."
      ],
      hint: `try <code>percent quiz</code> or <code>calculator booth</code>.`
    }));
  }
  // only answer when it looks like a question about Jesus
  if (
    /\b(jesus(?:\s+christ)?|christ)\b/i.test(u) &&
    (/\?/.test(u) || /^(what|who|why|how|is|are|do|does|can|should|could|would)\b/i.test(u))
  ) {
    return reply(bubble({ lines: ["christ is Lord."] }));
  }




  // 6) love / family hook
  if (like(u, ['i love you','love you'])) {
    return reply(isKidContext(utterance, ctx) ? REPLIES.loveNoteKid() : REPLIES.loveNoteNotKid());
  }
  if (like(u, ['dad i love you','dad i miss you'])) return reply(REPLIES.loveNoteKid());
  if (like(u, ['do you love me','u love me','do u love me','love me?'])) {
    return reply(isKidContext(utterance, ctx)
      ? REPLIES.loveNoteKid()
      : bubble({ title:"love check", lines:["i’m a cat — i love in concentric circles of purr. let’s learn something together."], hint:`say <code>lore booth</code> for a cozy tale.` })
    );
  }
  if (like(u, ['dad tell me a story'])) return reply(REPLIES.dadStory());
  // non-dad stories
  if (like(u, ['tell me a story','story time','a story','give me a story'])) {
    setLastSTopic(ctx, 'story');
    return reply(REPLIES.storyAny());
  }

  if (getLastSTopic(ctx) === 'story' && /\b(more|another|again|one more)\b/i.test(u)) {
    return reply(REPLIES.storyCamp());
  }



  // 7) where live / boundaries
  if (like(u, ['where do you live','what is your address'])) return reply(REPLIES.homeWhere());
  if (like(u, ['i want to go to your house','can i come over'])) return reply(REPLIES.houseBoundary());
  if (like(u, ['youre supposed to say something about how you live in a tent',"you're supposed to say something about how you live in a tent"])) {
    return reply(REPLIES.homeWhere());
  }
  if (like(u, ['who are you','who r u','what are you'])) return reply(REPLIES.whoAmI());

  // 8) hearts / scary reassurance
  if (like(u, ['do you love hearts','hearts'])) return reply(REPLIES.hearts());
  if (like(u, ["that's scary",'thats scary','scary'])) return reply(REPLIES.reassure());

  // 9) holidays / instruments / grandma p
  if (like(u, ['favorite holiday','whats your favorite holiday',"what's your favorite holiday"])) return reply(REPLIES.holiday());
  if (like(u, ['do you play any instruments','play instruments'])) return reply(REPLIES.instruments());
  if (like(u, ['is there a grandma p','grandma p'])) return reply(REPLIES.grandmaP());

  // 10) project / creator (no dox)
  if (like(u, ['what do you know about jps grooves','jps grooves'])) return reply(REPLIES.jpsGrooves());
  if (like(u, ['what do you know about jeremy smith','who is jeremy smith'])) return reply(REPLIES.jeremySmith());

  // 11) looks / pets / music opener
  if (like(u, ['what do you look like','how do you look'])) return reply(REPLIES.appearance());
  if (likeWord(u, ['spiders'])) return reply(REPLIES.spidersDogs('spiders'));
  if (likeWord(u, ['dogs']))    return reply(REPLIES.spidersDogs('dogs'));
  if (like(u, [
    'what music do you like','music do you like','what music you like',
    'what band you like','what music u like','do you like music','u like music','you like music'
  ])) {
    setLastSTopic(ctx, 'music');
    return reply(REPLIES.musicAskBack());
  }
    // micro self-care / study snaps
  if (likeWord(u, ['hydrate','water','water break','drink water'])) return reply(REPLIES.hydrate());
  if (likeWord(u, ['posture','sit up','un-slouch','unslouch']))     return reply(REPLIES.posture());
  if (likeWord(u, ['stretch','stretch break']))                     return reply(REPLIES.stretch());
  if (like(u, ['study tip','how to study','focus tip']))            return reply(REPLIES.studyTip());
  if (like(u, ['i cant focus','i cannot focus','hard to focus','focus please'])) {
    return reply(REPLIES.focusSnap());
  }
  if (like(u, ['motivate me','pep talk','hype me up','encourage me'])) return reply(REPLIES.cheerShort());
  if (like(u, ['fun fact','math fact','tell me a fact']))             return reply(REPLIES.mathFact());
  if (like(u, ['i did it','done!','finished it','nailed it','woo']))  return reply(REPLIES.tinyCongrats());


  // 12) festival cast takes
  if (like(u, ['what do you think of cosmic phil','cosmic phil','cosmis phil','do you know cosmic phil','do you know cosmis phil'])) {
    return reply(REPLIES.thinksOf('cosmic phil'));
  }
  if (like(u, ['what do you think of the infinity triplets','infinity triplets'])) return reply(REPLIES.thinksOf('infinity triplets'));
  if (like(u, ['what do you think of jehnk','jehnk'])) return reply(REPLIES.thinksOf('jehnk'));
  if (like(u, ['what do you think of the dino dividers','dino dividers'])) return reply(REPLIES.thinksOf('dino dividers'));

  // 13) jokes (with follow-ups)
  if (like(u, ['know any jokes','tell me a joke','another joke','joke please','make me laugh'])) {
    setLastSTopic(ctx, 'jokes');
    return reply(REPLIES.jokeCard(nextJoke(ctx)));
  }
  // jokes follow-up: block inside lore so "more" continues lore
  if (!hasPendingBooth
      && mode === 'smalltalk'
      && !inLore
      && jokesActive
      && /\b(more|another|again|one more|more jokes|another one|next)\b/i.test(u)) {

    return reply(REPLIES.jokeCard(nextJoke(ctx)));
  }

  if (like(u, ['explain that joke','explain the joke','i dont get it','i don’t get it','why is that funny','what does that mean'])) {
    return reply(REPLIES.jokeExplain());
  }

    // ——— more booth typos & aliases
  // status booth
  if (like(u, ['staus booth','stats booth','statuss booth'])) {
    clearLastSTopic(ctx);
    return withAction(REPLIES.exitToCommons(), { type:'SWITCH_MODE', to:'status' });
  }

  // recipe booth name typos
  if (like(u, ['recipies','reciepe','recepie','reccipe','resipe'])) {
    clearLastSTopic(ctx);
    return withAction(REPLIES.recipesMenu(), { type:'SWITCH_MODE', to:'recipe' });
  }

  // calculator typos (more variants)
  if (like(u, [
    'caluclator','calcultor','calcualtor','caulculator','calculater','calculater',
    'calclator','caculator'
  ])) {
    return withAction(
      bubble({ title: "calculator", lines: ["rolling into the calculator booth?"], hint: `type a math like <code>27% of 150</code>.` }),
      { type:'SWITCH_MODE', to:'calculator' }
    );
  }

  // recipe topic misspellings
  if (like(u, [
    'quesedila','quesedilla','quesadila','quesodilla','kesadilla','caseadia','case-a-dilla','quesa dilla'
  ])) {
    clearLastSTopic(ctx);
    return withAction(REPLIES.recipesMenu(), { type:'SWITCH_MODE', to:'recipe', payload:{ topic:'quesadilla' }});
  }
  if (like(u, [
    'snow kone','snokone','snoecone','sno-cone','sno cone','snocne'
  ])) {
    clearLastSTopic(ctx);
    return withAction(REPLIES.recipesMenu(), { type:'SWITCH_MODE', to:'recipe', payload:{ topic:'snowcone' }});
  }
  if (like(u, ['nachoes',"nacho's"])) {
    clearLastSTopic(ctx);
    return withAction(REPLIES.recipesMenu(), { type:'SWITCH_MODE', to:'recipe', payload:{ topic:'nachos' }});
  }

  // quiz topic misspellings → jump straight to quiz booth with a sensible topic
  if (like(u, ['precent quiz','percant quiz','percint quiz','percentage quiz'])) {
    clearLastSTopic(ctx);
    return withAction(
      bubble({ title: "quiz: percent", lines: ["percent drills coming right up."] }),
      { type:'SWITCH_MODE', to:'quiz', payload:{ topic:'percent', count:3 } }
    );
  }
  if (like(u, ['fration quiz','frations quiz','fracton quiz'])) {
    clearLastSTopic(ctx);
    return withAction(
      bubble({ title: "quiz: fractions", lines: ["fractions it is."] }),
      { type:'SWITCH_MODE', to:'quiz', payload:{ topic:'fractions', count:3 } }
    );
  }
  if (like(u, ['equasion quiz','equasions quiz'])) {
    clearLastSTopic(ctx);
    return withAction(
      bubble({ title: "quiz: equations", lines: ["equations on deck."] }),
      { type:'SWITCH_MODE', to:'quiz', payload:{ topic:'equations', count:3 } }
    );
  }

  if (likeWord(u, ['ttyl','afk','laters'])) {
    return reply(bubble({ title: "farewell", lines: ["catch you under the string lights, traveler."], hint: `say <code>help</code> next time to see the map.` }));
  }






  // 14) micro-math catch (non-hijack)
  {
    const frac = tryFracAsDecimal(u);
    if (frac) {
      if (frac.kind === 'error') return reply(REPLIES.calcResult('fraction', [frac.msg]));
      const { n, d } = frac.input; return reply(REPLIES.calcResult('fraction → decimal', [`${n}/${d} = ${frac.value}`]));
    }
    const pct = tryPercentOf(u);
    if (pct) {
      const { pct: p, base } = pct.input; return reply(REPLIES.calcResult('percent of', [`${p}% of ${base} = ${pct.value}`]));
    }
    const srt = trySqrtTiny(u);
    if (srt) {
      const { rad, add } = srt.input; const rendered = add ? `√${rad} + ${add}` : `√${rad}`;
      return reply(REPLIES.calcResult('square-root (quick)', [ `${rendered} = ${srt.value}` ]));
    }
  }

  // 15) fuzzy booth typo: "claculator booth"
  if (like(u, ['claculator booth','calcuator booth','calc booth'])) {
    return withAction(
      bubble({ title: "calculator", lines: ["rolling into the calculator booth?"], hint: `say <code>yes</code> or type a math like <code>15% of 80</code>.` }),
      { type: 'SWITCH_MODE', to: 'calculator' }
    );
  }

  // sports
  if (like(u, ['do you like sports','you like sports']) || likeWord(u, ['sport','sports'])) {
    return reply(bubble({
      title: "sports",
      lines: ["i keep score by streaks and streaks by grit. wanna race numbers?"],
      hint: `say <code>percent quiz</code> or <code>fractions quiz</code>.`
    }));
  }

  // origin
  if (like(u, ['how did you get here','how did u get here','how did ya get here','how you get here'])) {
    return reply(bubble({ title: "arrival", lines: ["followed a sine line through the gate and took a left at the cocoa tent."], hint: `stories live in <code>lore booth</code>.` }));
  }

  // “i don't want to go to a booth!”
  if (like(u, [
    "i don't want to go to a booth","i dont want to go to a booth",
    "i don't want to pick a booth","i dont want to pick a booth",
    "i don't wanna pick a booth","i dont wanna pick a booth",
    "no booth","no booths"
  ])) {
    return reply(bubble({ title: "chill mode", lines: ["all good — we can just chat right here."], hint: `ask me anything, or say <code>help</code> when you want the map.` }));
  }

  if (like(u, ['repeat','say that again','slower','slow down','too fast','shorter','tldr','tl;dr'])) {
    return reply(REPLIES.clarifyShort());
  }
  if (/\b(hola|buenas|un\s+chiste|cuenta\s+un\s+chiste|ens[eé]ñame\s+fracciones|ensename\s+fracciones)\b/i.test(u)) {
    return reply(REPLIES.holaES());
  }
  if (like(u, ['tell me a secret','share a secret']) || /\b(weed|marijuana|cannabis|vape|nicotine)\b/i.test(u)) {
    return reply(REPLIES.boundaryGentle());
  }




  // farewells
  if (isFarewell(u)) {
    return reply(bubble({
      title: "farewell",
      lines: ["catch you under the string lights, traveler."],
      hint: `say <code>help</code> if you want the map next time.`
    }));
  }

  // not handled
  return null;
}

// ————————————————————————————————————————————————————————————
// Return shapers
// ————————————————————————————————————————————————————————————
function reply(htmlString) {
  return { handled: true, html: htmlString, noAck: true, askAllowed: false };
}
function withAction(htmlString, action) {
  return { handled: true, html: htmlString, noAck: true, askAllowed: false, action };
}

// ————————————————————————————————————————————————————————————
// Compatibility shims for qabot.js
// ————————————————————————————————————————————————————————————
export function classifySmallTalk(utterance, ctx = {}) {
  const res = maybeHandleSmallTalk(utterance, ctx);
  return res && res.handled ? 'smalltalk' : null;
}

export function respondSmallTalk(utterance, ctx = {}) {
  const res = maybeHandleSmallTalk(utterance, ctx);
  return res && res.handled ? { html: res.html } : null;
}

export default { maybeHandleSmallTalk };
