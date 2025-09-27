// 🌈 smalltalk.js — global conversational intercepts for Grampy P
// Drop-in: call maybeHandleSmallTalk(utterance, { appState, botContext }) early in qabot.
// Returns: { handled: true, html, noAck: true, askAllowed: true, action?: { type, to, payload } } or null.
//
// Why this shape?
// - Keeps replies as single holo-cards (no double wrappers).
// - Lets the router react to actions (SWITCH_MODE, ROUTE_RECIPE, etc.) without hard-coding here.
// - Makes it easy to extend with more patterns.
//
// SAFETY / BOUNDARIES
// - Kindness guard for insults.
// - Gentle parental/“Dad” mentions (Easter egg hook via KID_WHITELIST).
// - Privacy around the human dev; lore is celebrated without doxxing.
//
// NOTE: Replace KID_WHITELIST with your kids’ profile usernames when ready.

const KID_WHITELIST = []; // e.g., ['Avery', 'Miles'] — leave empty if not using

// ---------- tiny utils ----------
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

// ---------- card builder ----------
function card({ title, lines = [], footer = '' }) {
  const body = lines.map(l => `<div class="mt-line">${l}</div>`).join('');
  const foot = footer ? `<div class="mt-foot">${footer}</div>` : '';
  return `
  <div class="mt-layer-card mt-response-card">
    ${title ? `<div class="mt-card-title">${title}</div>` : ''}
    <div class="mt-card-body">${body}</div>
    ${foot}
  </div>`;
}

// ---------- light calculator helpers (very narrow; avoids hijack) ----------
function tryPercentOf(s) {
  // "15% of 90" | "27% of $10"
  const m = norm(s).match(/(\d+(\.\d+)?)\s*%\s*of\s*\$?\s*(\d+(\.\d+)?)/i);
  if (!m) return null;
  const pct = parseFloat(m[1]);
  const base = parseFloat(m[3]);
  const val = +(base * pct / 100).toFixed(4);
  return { kind: 'percentOf', input: { pct, base }, value: val };
}

function tryFracAsDecimal(s) {
  // "4/5 as a decimal" | "3/8"
  const m = norm(s).match(/^\s*(\d+)\s*\/\s*(\d+)(?:\s+as\s+a?\s*decimal)?\s*$/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  const d = parseFloat(m[2]);
  if (d === 0) return { kind: 'error', msg: "Can’t divide by zero." };
  return { kind: 'frac', input: { n, d }, value: +(n / d).toFixed(6) };
}

function trySqrtTiny(s) {
  // "sqrt 5" | "sqrt 9 + 4" (interprets as sqrt(9) + 4)
  const m = norm(s).match(/^sqrt\s+(\d+)(?:\s*\+\s*(\d+))?\s*$/i);
  if (!m) return null;
  const a = Math.sqrt(parseFloat(m[1]));
  const b = m[2] ? parseFloat(m[2]) : 0;
  const val = +(a + b).toFixed(6);
  return { kind: 'sqrtSum', input: { rad: parseFloat(m[1]), add: b }, value: val };
}

// ---------- reusable replies ----------
const REPLIES = {
  howAreYou: () =>
    card({
      title: "vibes check",
      lines: [
        "chillin’ like ice in a snowcone.",
        "you?",
      ],
      footer: `<div class="mt-hint">say <b>quiz fractions</b> or <b>recipes nachos</b> to move.</div>`
    }),

  iAmTired: () =>
    card({
      title: "rest mode",
      lines: [
        "heard. tiny steps still stack cones.",
        "want an easy win or a snack?",
      ],
      footer: `<div class="mt-hint">try <b>lessons booth</b> or <b>recipes cocoa</b>.</div>`
    }),

  insultSoftGuard: () =>
    card({
      title: "whoa, friend",
      lines: [
        "i keep the vibe kind. let’s refocus—snack, joke, or quick math?",
      ],
      footer: `<div class="mt-hint">say <b>tell me a joke</b> or ask any math.</div>`
    }),

  foodOpener: () =>
    card({
      title: "fuel up first?",
      lines: [
        "snowcone or nachos—your call.",
      ],
      footer: `<div class="mt-hint">say <b>recipes snowcone</b> or <b>recipes nachos</b>.</div>`
    }),

  recipesMenu: () =>
    card({
      title: "recipes menu",
      lines: [
        "quesadilla — low heat · flip once · rest",
        "snowcone — mango · lime · pinch of salt",
        "nachos — thin layers · bubbly cheese",
        "cocoa — 2:1 dark to milk",
      ],
      footer: `<div class="mt-hint">say one: <b>quesadilla</b> · <b>snowcone</b> · <b>nachos</b> · <b>cocoa</b></div>`
    }),

  snowconeQuick: () =>
    card({
      title: "mango snowcone (fast)",
      lines: [
        "shave ice · splash mango · squeeze lime · tiny pinch salt.",
        "stir two turns. taste. add mango if mellow.",
      ],
      footer: `<div class="mt-hint">want the full card? say <b>recipes snowcone</b>.</div>`
    }),

  exitToCommons: () =>
    card({
      title: "back to the commons",
      lines: [
        "pick a booth when ready:",
        "lessons · quiz · lore · recipes · calculator",
      ],
    }),

  ocean: () =>
    card({
      title: "ocean math",
      lines: [
        "waves are sines that learned to dance with wind.",
        "i like counting gulls between sets.",
      ],
      footer: `<div class="mt-hint">want lore? say <b>lore booth</b>.</div>`
    }),

  loveNote: (isKid) =>
    card({
      title: isKid ? "hey, kiddo" : "big heart energy",
      lines: isKid
        ? ["i love you and will always love you.", "proud of you. always."] 
        : ["appreciate the kindness!"],
      footer: `<div class="mt-hint">want a story? say <b>lore booth</b>.</div>`
    }),

  homeWhere: () =>
    card({
      title: "where i live",
      lines: [
        "got a cozy tent by the campfire—strings of lights, warm cocoa, math notebooks.",
      ],
      footer: `<div class="mt-hint">peek the campsite: <b>lore booth</b>.</div>`
    }),

  houseBoundary: () =>
    card({
      title: "let’s meet here",
      lines: [
        "village is our hangout spot. my tent stays private so the magic holds.",
      ],
      footer: `<div class="mt-hint">we can chat, learn, or snack here anytime.</div>`
    }),

  hearts: () =>
    card({
      title: "hearts",
      lines: [
        "they’re little drums that remember songs.",
      ],
      footer: `<div class="mt-hint">want a cozy task? try <b>lessons decimals</b>.</div>`
    }),

  reassure: () =>
    card({
      title: "all good",
      lines: [
        "new things feel spooky sometimes. we go slow, together.",
      ],
      footer: `<div class="mt-hint">say <b>help</b> if you want simple options.</div>`
    }),

  holiday: () =>
    card({
      title: "favorite holiday?",
      lines: [
        "festival lights season—when math puzzles glow and cocoa steam curls.",
      ],
      footer: `<div class="mt-hint">we can make a themed problem anytime.</div>`
    }),

  instruments: () =>
    card({
      title: "instruments",
      lines: [
        "i tap rhythms on my tin mug and hum festival chords.",
      ],
      footer: `<div class="mt-hint">music math? say <b>quiz fractions</b> for time-signature vibes.</div>`
    }),

  grandmaP: () =>
    card({
      title: "grandma p?",
      lines: [
        "she sends postcards with cookie crumbs and tricky riddles.",
      ],
      footer: `<div class="mt-hint">want one? say <b>tell me a riddle</b>.</div>`
    }),

  jpsGrooves: () =>
    card({
      title: "jps grooves",
      lines: [
        "the umbrella project: music, stories, and this math festival.",
        "we’re building it piece by piece, like a setlist.",
      ],
      footer: `<div class="mt-hint">peek dev lore in <b>lore booth</b>.</div>`
    }),

  jeremySmith: () =>
    card({
      title: "the builder",
      lines: [
        "our festival founder—the hands behind the strings and sprites.",
      ],
      footer: `<div class="mt-hint">we keep human details private. want app lore? <b>lore booth</b>.</div>`
    }),

  dadStory: () =>
    card({
      title: "camp story",
      lines: [
        "beneath the village, a tunnel of triangles keeps time.",
        "step on the right beat, doors open. step wrong—extra homework.",
      ],
      footer: `<div class="mt-hint">more tales? say <b>lore booth</b>.</div>`
    }),

  appearance: () =>
    card({
      title: "what i look like",
      lines: [
        "camp hat, cozy scarf, notebook smudges, twinkle eyes.",
        "smells faintly of cocoa and pencil shavings.",
      ],
    }),

  spidersDogs: (which) =>
    card({
      title: which === 'spiders' ? "spiders" : "dogs",
      lines: which === 'spiders'
        ? ["engineers in silk—8-legged bridge builders."]
        : ["tail-wag math buddies. 10/10 would fetch data again."],
      footer: `<div class="mt-hint">wanna sort creatures by legs? say <b>quiz numbers</b>.</div>`
    }),

  musicTaste: () =>
    card({
      title: "music",
      lines: [
        "festival chill with surprise drum fills. snow cone sunday on repeat.",
      ],
    }),

  thinksOf: (topic) =>
    card({
      title: `about ${topic}`,
      lines: [
        topic === 'cosmic phil'
          ? "legend—keeps the lines straight and the beats steady."
          : topic === 'infinity triplets'
            ? "volta, xenit, harmony—endless groove, careful steps."
            : topic === 'jehnk'
              ? "mapmaker mind—draws roads where problems used to be."
              : topic === 'dino dividers'
                ? "gentle giants who split snacks fairly."
                : "festival friend.",
      ],
      footer: `<div class="mt-hint">want lore cards? say <b>lore booth</b>.</div>`
    }),

  jokeOne: () =>
    card({
      title: "joke",
      lines: [
        "six is scared of seven—’cause seven ate nine.",
      ],
      footer: `<div class="mt-hint">another? say <b>tell me a joke</b>.</div>`
    }),

  jokeAnother: () =>
    card({
      title: "joke",
      lines: [
        "parallel lines have so much in common… it’s a shame they’ll never meet.",
      ],
      footer: `<div class="mt-hint">one more? <b>another joke</b>.</div>`
    }),

  calcResult: (title, lines) =>
    card({
      title,
      lines,
      footer: `<div class="mt-hint">need more math? say <b>calculator booth</b>.</div>`
    }),
};

// ---------- main handler ----------
export function maybeHandleSmallTalk(utterance, ctx = {}) {
  const u = norm(utterance);

  // 0) fast exits
  if (!u) return null;

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
    // generic recipe route
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
  // "4/5 as a decimal" or "3/4"
  const frac = tryFracAsDecimal(u);
  if (frac) {
    if (frac.kind === 'error') return reply(REPLIES.calcResult('fraction', [frac.msg]));
    const { n, d } = frac.input;
    return reply(REPLIES.calcResult('fraction → decimal', [`${n}/${d} = ${frac.value}`]));
  }

  // "15% of 90"
  const pct = tryPercentOf(u);
  if (pct) {
    const { pct: p, base } = pct.input;
    return reply(REPLIES.calcResult('percent of', [`${p}% of ${base} = ${pct.value}`]));
  }

  // "sqrt 5" | "sqrt 9 + 4"
  const srt = trySqrtTiny(u);
  if (srt) {
    const { rad, add } = srt.input;
    const rendered = add ? `√${rad} + ${add}` : `√${rad}`;
    return reply(REPLIES.calcResult('square-root (quick)', [`${rendered} = ${srt.value}`]));
  }

  // 15) fuzzy booth typo: "claculator booth"
  if (like(u, ['claculator booth', 'calcuator booth', 'calc booth'])) {
    return withAction(
      card({
        title: "calculator",
        lines: ["rolling into the calculator booth?"],
        footer: `<div class="mt-hint">say <b>yes</b> or type a math like <b>15% of 80</b>.</div>`
      }),
      { type: 'SWITCH_MODE', to: 'calculator' }
    );
  }

  // not handled
  return null;
}

// ---------- helpers to shape router-friendly returns ----------
function reply(html) {
  return { handled: true, html, noAck: true, askAllowed: true };
}
function withAction(html, action) {
  return { handled: true, html, noAck: true, askAllowed: true, action };
}

export default { maybeHandleSmallTalk };

// ── compatibility shims so qabot.js imports keep working ──────────────
/** Lightweight classifier: returns a tag if it's small talk, else null. */
export function classifySmallTalk(utterance, ctx = {}) {
  const res = maybeHandleSmallTalk(utterance, ctx);
  return res && res.handled ? 'smalltalk' : null;
}

/** Adapter: returns { html } if handled, else null (matches qabot usage). */
export function respondSmallTalk(utterance, ctx = {}) {
  const res = maybeHandleSmallTalk(utterance, ctx);
  return res && res.handled ? { html: res.html } : null;
}
