// /src/modes/mathTips/smalltalk.js
// ✅ Uses composeReply for the nice, single-bubble aesthetic (no manual .mt-layer-card).
// ✅ Keeps the beefed-up logic: actions, guards, micro-math catches, typos.
// ✅ Exports classifySmallTalk/respondSmallTalk shims for qabot.js compatibility.

import { composeReply } from './conversationPolicy.js';

// ————————————————————————————————————————————————————————————
// Config
// ————————————————————————————————————————————————————————————
const MIN_COOLDOWN_MS = 500;  // gentle flood guard so small talk doesn't spam
let lastReplyAt = 0;

// If you want “kiddo” easter-egg for love notes, add usernames here:
const KID_WHITELIST = []; // e.g., ['Avery', 'Miles']

// ————————————————————————————————————————————————————————————
// Tiny utils
// ————————————————————————————————————————————————————————————
const norm = (s) =>
  (s || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const squash = (s) =>
  (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const like = (s, words) => {
  const v = squash(s);
  return words.some(w => v.includes(squash(w)));
};

const any = (s, ...phrases) => phrases.some(p => norm(s) === norm(p));
const starts = (s, ...prefixes) => prefixes.some(p => norm(s).startsWith(norm(p)));

// ————————————————————————————————————————————————————————————
// Composer-friendly bubble builder
//   We give the composer plain HTML (p/strong + optional .mt-dim hint).
//   No custom card classes — let composeReply paint the pretty.
// ————————————————————————————————————————————————————————————
function bubble({ title = '', lines = [], hint = '' }) {
  const parts = [];
  if (title) parts.push(`<p><strong>${escapeHTML(title)}</strong></p>`);
  for (const l of lines) parts.push(wrapPara(l));
  if (hint) parts.push(`<p class="mt-dim">${hint}</p>`);

  return composeReply({
    part: { kind: 'answer', html: parts.join('') },
    askAllowed: false,
    noAck: true,
    mode: 'smalltalk'
  });
}

function wrapPara(s) {
  const t = String(s ?? '').trim();
  if (!t) return '';
  // allow dev to pass small bits of markup like <code>..</code> or bolds
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

// ————————————————————————————————————————————————————————————
// Reply factories — return PRETTY COMPOSED bubbles via composeReply()
// ————————————————————————————————————————————————————————————
const REPLIES = {
  howAreYou: () =>
    bubble({
      title: "vibes check",
      lines: ["chillin’ like ice in a snowcone.", "you?"],
      hint: `say <code>quiz fractions</code> or <code>recipes nachos</code> to move.`
    }),

  iAmTired: () =>
    bubble({
      title: "rest mode",
      lines: ["heard. tiny steps still stack cones.", "want an easy win or a snack?"],
      hint: `try <code>lessons booth</code> or <code>recipes cocoa</code>.`
    }),

  insultSoftGuard: () =>
    bubble({
      title: "whoa, friend",
      lines: ["i keep the vibe kind. let’s refocus — snack, joke, or quick math?"],
      hint: `say <code>tell me a joke</code> or ask any math.`
    }),

  foodOpener: () =>
    bubble({
      title: "fuel up first?",
      lines: ["snowcone or nachos — your call."],
      hint: `say <code>recipes snowcone</code> or <code>recipes nachos</code>.`
    }),

  recipesMenu: () =>
    bubble({
      title: "recipes menu",
      lines: [
        "quesadilla — low heat · flip once · rest",
        "snowcone — mango · lime · pinch of salt",
        "nachos — thin layers · bubbly cheese",
        "cocoa — 2:1 dark to milk",
      ],
      hint: `say one: <code>quesadilla</code> · <code>snowcone</code> · <code>nachos</code> · <code>cocoa</code>`
    }),

  snowconeQuick: () =>
    bubble({
      title: "mango snowcone (fast)",
      lines: [
        "shave ice · splash mango · squeeze lime · tiny pinch salt.",
        "stir two turns. taste. add mango if mellow."
      ],
      hint: `want the full card? say <code>recipes snowcone</code>.`
    }),

  exitToCommons: () =>
    bubble({
      title: "back to the commons",
      lines: ["pick a booth when ready:", "lessons · quiz · lore · recipes · calculator"],
    }),

  ocean: () =>
    bubble({
      title: "ocean math",
      lines: [
        "waves are sines that learned to dance with wind.",
        "i like counting gulls between sets."
      ],
      hint: `want lore? say <code>lore booth</code>.`
    }),

  loveNote: (isKid) =>
    bubble({
      title: isKid ? "hey, kiddo" : "big heart energy",
      lines: isKid
        ? ["i love you and will always love you.", "proud of you. always."]
        : ["appreciate the kindness!"],
      hint: `want a story? say <code>lore booth</code>.`
    }),

  homeWhere: () =>
    bubble({
      title: "where i live",
      lines: ["cozy tent by the campfire — string lights, warm cocoa, math notebook stack."],
      hint: `peek the campsite: <code>lore booth</code>.`
    }),

  houseBoundary: () =>
    bubble({
      title: "let’s meet here",
      lines: ["the village is our hangout spot. my tent stays private so the magic holds."],
      hint: `we can chat, learn, or snack here anytime.`
    }),

  hearts: () =>
    bubble({
      title: "hearts",
      lines: ["they’re little drums that remember songs."],
      hint: `want a cozy task? try <code>lessons decimals</code>.`
    }),

  reassure: () =>
    bubble({
      title: "all good",
      lines: ["new things feel spooky sometimes. we go slow, together."],
      hint: `say <code>help</code> if you want simple options.`
    }),

  holiday: () =>
    bubble({
      title: "favorite holiday?",
      lines: ["festival lights season — puzzles glow, cocoa steam curls."],
      hint: `we can make a themed problem anytime.`
    }),

  instruments: () =>
    bubble({
      title: "instruments",
      lines: ["i tap rhythms on my tin mug and hum festival chords."],
      hint: `music math? say <code>quiz fractions</code> for time-signature vibes.`
    }),

  grandmaP: () =>
    bubble({
      title: "grandma p?",
      lines: ["she sends postcards with cookie crumbs and tricky riddles."],
      hint: `want one? say <code>tell me a riddle</code>.`
    }),

  jpsGrooves: () =>
    bubble({
      title: "jps grooves",
      lines: [
        "the umbrella project: music, stories, and this math festival.",
        "we’re building it piece by piece, like a setlist."
      ],
      hint: `peek dev lore in <code>lore booth</code>.`
    }),

  jeremySmith: () =>
    bubble({
      title: "the builder",
      lines: [
        "our festival founder — the hands behind the strings and sprites."
      ],
      hint: `we keep human details private. want app lore? <code>lore booth</code>.`
    }),

  dadStory: () =>
    bubble({
      title: "camp story",
      lines: [
        "beneath the village, a tunnel of triangles keeps time.",
        "step on the right beat, doors open. step wrong — extra homework."
      ],
      hint: `more tales? say <code>lore booth</code>.`
    }),

  appearance: () =>
    bubble({
      title: "what i look like",
      lines: [
        "camp hat, cozy scarf, notebook smudges, twinkle eyes.",
        "smells faintly of cocoa and pencil shavings."
      ],
    }),

  spidersDogs: (which) =>
    bubble({
      title: which === 'spiders' ? "spiders" : "dogs",
      lines: which === 'spiders'
        ? ["engineers in silk — 8-legged bridge builders."]
        : ["tail-wag math buddies. 10/10 would fetch data again."],
      hint: `wanna sort creatures by legs? say <code>quiz numbers</code>.`
    }),

  musicTaste: () =>
    bubble({
      title: "music",
      lines: ["festival chill with surprise drum fills. snow cone sunday on repeat."],
    }),

  thinksOf: (topic) =>
    bubble({
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

  jokeOne: () =>
    bubble({
      title: "joke",
      lines: ["six is scared of seven — ’cause seven ate nine."],
      hint: `another? say <code>tell me a joke</code>.`
    }),

  jokeAnother: () =>
    bubble({
      title: "joke",
      lines: ["parallel lines have so much in common… it’s a shame they’ll never meet."],
      hint: `one more? <code>another joke</code>.`
    }),

  calcResult: (title, lines) =>
    bubble({
      title,
      lines,
      hint: `need more math? say <code>calculator booth</code>.`
    }),
};

// ————————————————————————————————————————————————————————————
// Main handler — returns { handled, html, action? } or null
// ————————————————————————————————————————————————————————————
export function maybeHandleSmallTalk(utterance, ctx = {}) {
  const u = norm(utterance);
  if (!u) return null;

  // soft flood guard
  const now = Date.now();
  if (now - lastReplyAt < MIN_COOLDOWN_MS) return null;
  lastReplyAt = now;

  // 1) kindness/insult guard
  if (like(u, ['you suck', 'i hate you', 'stupid bot', 'dummy'])) {
    return reply(REPLIES.insultSoftGuard());
  }

  // 2) simple feelings
  if (like(u, ['how are you', 'how r u', 'hru', 'how you feeling'])) {
    return reply(REPLIES.howAreYou());
  }
  if (like(u, ['i am tired', "i’m tired", "im tired", "man i am tired", "man i'm tired", "man im tired"])) {
    return reply(REPLIES.iAmTired());
  }

  // 3) food & recipes nudge
  if (like(u, ['do you like food', 'hungry', 'snack', 'food'])) {
    return withAction(REPLIES.foodOpener(), { type: 'SUGGEST_RECIPES' });
  }
  // direct snack words
  if (any(u, 'nachos', 'quesadilla', 'snowcone', 'cocoa', 'mango snowcone')) {
    if (u.includes('mango') || u === 'snowcone') {
      return withAction(REPLIES.snowconeQuick(), { type: 'SWITCH_MODE', to: 'recipes', payload: { topic: 'snowcone' } });
    }
    const topic = u.split(' ')[0];
    return withAction(REPLIES.recipesMenu(), { type: 'SWITCH_MODE', to: 'recipes', payload: { topic } });
  }
  if (starts(u, 'recipes ')) {
    const topic = u.replace(/^recipes\s+/i, '').trim() || null;
    return withAction(REPLIES.recipesMenu(), { type: 'SWITCH_MODE', to: 'recipes', payload: topic ? { topic } : {} });
  }

  // 4) exit/common center
  if (any(u, 'exit', 'stop', 'back to commons', 'back to the commons', 'definitely stop')) {
    return reply(REPLIES.exitToCommons());
  }

  // 5) ocean / places
  if (like(u, ['been to the ocean', 'ocean', 'beach'])) {
    return reply(REPLIES.ocean());
  }

  // 6) love / family easter hook
  if (like(u, ['i love you', 'love you'])) {
    const name = ctx?.appState?.profile?.username || '';
    const isKid = KID_WHITELIST.includes(name);
    return reply(REPLIES.loveNote(isKid));
  }
  if (like(u, ['dad i love you', 'dad i miss you'])) {
    const name = ctx?.appState?.profile?.username || '';
    const isKid = KID_WHITELIST.includes(name);
    return reply(REPLIES.loveNote(isKid));
  }
  if (like(u, ['dad tell me a story'])) {
    return reply(REPLIES.dadStory());
  }

  // 7) where live / boundaries
  if (like(u, ['where do you live', 'what is your address'])) {
    return reply(REPLIES.homeWhere());
  }
  if (like(u, ['i want to go to your house', 'can i come over'])) {
    return reply(REPLIES.houseBoundary());
  }
  if (like(u, ['youre supposed to say something about how you live in a tent', "you're supposed to say something about how you live in a tent"])) {
    return reply(REPLIES.homeWhere());
  }

  // 8) hearts / scary reassurance
  if (like(u, ['do you love hearts', 'hearts'])) {
    return reply(REPLIES.hearts());
  }
  if (like(u, ["that's scary", 'thats scary', 'scary'])) {
    return reply(REPLIES.reassure());
  }

  // 9) holidays / instruments / grandma p
  if (like(u, ['favorite holiday', 'whats your favorite holiday', "what's your favorite holiday"])) {
    return reply(REPLIES.holiday());
  }
  if (like(u, ['do you play any instruments', 'play instruments'])) {
    return reply(REPLIES.instruments());
  }
  if (like(u, ['is there a grandma p', 'grandma p'])) {
    return reply(REPLIES.grandmaP());
  }

  // 10) about the project / creator (no dox)
  if (like(u, ['what do you know about jps grooves', 'jps grooves'])) {
    return reply(REPLIES.jpsGrooves());
  }
  if (like(u, ['what do you know about jeremy smith', 'who is jeremy smith'])) {
    return reply(REPLIES.jeremySmith());
  }

  // 11) looks / pets / creatures / music
  if (like(u, ['what do you look like', 'how do you look'])) {
    return reply(REPLIES.appearance());
  }
  if (like(u, ['do you like spiders', 'spiders'])) {
    return reply(REPLIES.spidersDogs('spiders'));
  }
  if (like(u, ['do you like dogs', 'dogs'])) {
    return reply(REPLIES.spidersDogs('dogs'));
  }
  if (like(u, ['what music do you like', 'music do you like'])) {
    return reply(REPLIES.musicTaste());
  }

  // 12) festival cast takes
  if (like(u, ['what do you think of cosmic phil', 'cosmic phil'])) {
    return reply(REPLIES.thinksOf('cosmic phil'));
  }
  if (like(u, ['what do you think of the infinity triplets', 'infinity triplets'])) {
    return reply(REPLIES.thinksOf('infinity triplets'));
  }
  if (like(u, ['what do you think of jehnk', 'jehnk'])) {
    return reply(REPLIES.thinksOf('jehnk'));
  }
  if (like(u, ['what do you think of the dino dividers', 'dino dividers'])) {
    return reply(REPLIES.thinksOf('dino dividers'));
  }

  // 13) jokes
  if (like(u, ['know any jokes', 'tell me a joke', 'another joke'])) {
    const used = ctx?.botContext?.jokesUsed || 0;
    if (ctx?.botContext) ctx.botContext.jokesUsed = used + 1;
    return reply(used % 2 ? REPLIES.jokeAnother() : REPLIES.jokeOne());
  }

  // 14) micro-math catch (non-hijack)
  const frac = tryFracAsDecimal(u);
  if (frac) {
    if (frac.kind === 'error') return reply(REPLIES.calcResult('fraction', [frac.msg]));
    const { n, d } = frac.input;
    return reply(REPLIES.calcResult('fraction → decimal', [`${n}/${d} = ${frac.value}`]));
  }

  const pct = tryPercentOf(u);
  if (pct) {
    const { pct: p, base } = pct.input;
    return reply(REPLIES.calcResult('percent of', [`${p}% of ${base} = ${pct.value}`]));
  }

  const srt = trySqrtTiny(u);
  if (srt) {
    const { rad, add } = srt.input;
    const rendered = add ? `√${rad} + ${add}` : `√${rad}`;
    return reply(REPLIES.calcResult('square-root (quick)', [`${rendered} = ${srt.value}`]));
  }

  // 15) fuzzy booth typo: "claculator booth"
  if (like(u, ['claculator booth', 'calcuator booth', 'calc booth'])) {
    return withAction(
      bubble({
        title: "calculator",
        lines: ["rolling into the calculator booth?"],
        hint: `say <code>yes</code> or type a math like <code>15% of 80</code>.`
      }),
      { type: 'SWITCH_MODE', to: 'calculator' }
    );
  }

  // not handled
  return null;
}

// ————————————————————————————————————————————————————————————
// Return shapers
// ————————————————————————————————————————————————————————————
function reply(htmlString) {
  return { handled: true, html: htmlString, noAck: true, askAllowed: true };
}
function withAction(htmlString, action) {
  return { handled: true, html: htmlString, noAck: true, askAllowed: true, action };
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
