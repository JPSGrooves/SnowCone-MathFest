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
const BARE_CONFIRM = /^(yes|yep|yeah|yea|yup|right on|sure|ok|okay|k|kk|okie|okie doke)$/i;
// Mood lexicons
const MOOD_GOODISH = /\b(?:good|great|fine|ok|okay|alright|all\s*right|cool|decent|solid|pretty\s*good|not\s*bad|chill(?:in[g’']?)?|vib(?:ing|ey)|gucci|straight|aight)\b/i;
const MOOD_TIREDISH = /\b(?:tired|sleepy|exhausted|worn|beat|wiped|drained|burn(?:t|ed)\s*out|fried|spent)\b/i;
const MOOD_ROUGHISH = /\b(?:horrible|awful|bad|sad|down|terrible|meh|not\s*(?:good|ok(?:ay)?|alright|all\s*right))\b/i;




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
  "I only date primes—low factors, high standards.",
  "The number 1 started a podcast: “It’s just me, myself, and I.”",
  "Even numbers party in pairs; odds show up solo but bring the vibe.",
  "My favorite workout? Squats and square numbers.",
  "Zero tried meditation and finally felt whole.",
  "I told 6 to act natural—it became 2×3.",
  "12 bragged about its network: “I’ve got factors everywhere.”",
  "Negative numbers need hugs—absolute value fixes everything.",
  "The floor function keeps it real; the ceiling function has lofty goals.",
  "I asked 10 for directions—said, “Take it up a notch to 11.”",
  "Multiples of 9 are dramatic—always on the edge of 10.",
  "8 wanted a promotion; boss said, “You’re not even.”",
  "49 joined a band—great at squares and scales.",
  "Fractions run a tight ship—no improper behavior.",
  "15 tried to be prime; the committee voted 3–5.",
  "2 and 3 are a power couple—literally.",
  "100’s skincare routine? Exfoliate, then root.",
  "The modulus operator keeps me grounded—reminds me what’s left.",
  "I asked 4 and 9 to collaborate—said they’d think inside the box.",
  "Perfect numbers have healthy boundaries—they equal what they give.",
  "The GCD is the friend who finds common ground in any fight.",
  "LCM plans reunions—gets everyone on the same schedule.",
  "Fibonacci wrote a love song—each line builds on the last two.",
  "I tried to argue with a proof by contradiction—ended up proving myself wrong.",
  "2, 4, 8, 16… my plans escalate quickly.",
  "Composite numbers throw block parties.",
  "Binary told me a joke—there were only two kinds of people who got it.",
  "Amicable numbers send each other thank-you notes.",
  "81 is old school—spins everything to the eighth degree.",
  "7’s pickup line? “I’m odd, but you’ll like my prime qualities.”",
  "11 looks in the mirror and sees double.",
  "64 is a chill cube—keeps things cool on all sides.",
  "14 can’t keep a secret—always splits the tea by 2 and 7.",
  "I asked 25 for ID—it flashed its square credentials.",
  "0 tried stand-up; the crowd divided and some were undefined.",
  "3 and 5 formed a duo—call them “twin-ish primes.”",
  "Rounding up is optimistic; rounding down is realistic; truncating is brutal.",
  "2^10 walks into a bar—bartender says, “We’ve got room for 1024 of you.”",
  "17 is that mysterious indie prime everyone pretends to know.",
  "28’s love language is divisors.",
  "13 isn’t unlucky—it’s just prime and misunderstood.",
  "36 has balance—perfectly square and well-rounded.",
  "90 takes shortcuts—always right-angled in the triangle lot.",
  "Factorials at the gym: “One more rep! …and another! …and another!”",
  "The set of integers threw a reunion—everyone showed up, positive and negative.",
  "Infinity tried speed dating—couldn’t get through the line.",
  "A palindrome walked in at 1331—looked the same coming and going.",
  "Powers of 3 keep the rhythm—clap on 1, 3, 9…",
  "2 is the friend who always splits the bill fairly.",
  "19 packed light—no baggage, just prime essentials.",
  "6 is well-connected—triangular in every social circle.",
  "10’s autobiography: “From Nothing to Something.”",
  "121 showed its passport—stamp says “square of a prime.”",
  "Odd numbers love campfires—great at telling tall tales.",
  "4 has boundaries—won’t go outside its box.",
  "999 hit snooze and rolled into 1000.",
  "Prime numbers don’t mingle much—too exclusive.",
  "24 is versatile—can adapt to any group project.",
  "The integer line is dramatic—so many points, so little context.",
  "I asked the clock for advice; it said, “Mod 12, and move on.”"
];

// ——— session-unique haiku picker (no repeat until exhausted) ———
const HAIKU_BANK = [
  ["cocoa steam lifts",
   "camp lantern hums a circle —",
   "we count, then just breathe"],

  ["fresh pencil shavings",
   "spiral like tiny galaxies —",
   "homework meets starlight"],

  ["string lights over sand",
   "footsteps find an easy beat —",
   "numbers walk with us"],

  ["quiet tent zipper",
   "makes a small chromatic scale —",
   "night tunes its own math"],

  ["rain taps on canvas",
   "four beats, then a gentle rest —",
   "fractions of cozy"],

  ["page corners flutter",
   "triangles nap in the margin —",
   "campfire warms the proof"],

  ["mango on shaved ice",
   "lime whispers, salt says hello —",
   "summer adds itself"],

  ["stars beyond the pines",
   "three in a row point us home —",
   "Orion nods, “yes”"],

  ["badge sash by the fire",
   "tiny wins stitched side by side —",
   "bravery in rows"],

  ["morning kettle sings",
   "steam draws a soft parabola —",
   "daybreak finds its arc"],

  ["footbridge at the lake",
   "planks add up to something whole —",
   "we cross, smiling, one"],

  ["quiet counting breath",
   "four in, four hold, four out slow —",
   "lanterns blink in time"],

  ["graph paper moonlight",
   "pines tally crickets in fours —",
   "night plots a soft curve"],

  ["cinder pops once",
   "fractions settle in our cups —",
   "marshmallows find halves"],

  ["raincoat hood up",
   "prime drops count the windowpane —",
   "seven lingers, plink"],

  ["pencil taps the desk",
   "rhythm matches kettle hiss —",
   "proof warms like cocoa"],

  ["lake mirrors the sky",
   "stone skips a geometric beat —",
   "circles ripple out"],

  ["camp badge thread loose",
   "tiny knot learns symmetry —",
   "square turns to bow"],

  ["wind tests each guyline",
   "triangles hold their secret —",
   "tents breathe in and stay"],

  ["firefly on watch",
   "blinks two, three, five, then thirteen —",
   "we whisper along"],

  ["morning page of sums",
   "eraser snow drifts to shoe —",
   "sun lifts the answer"],

  ["comet tail of chalk",
   "trails across the blackboard night —",
   "classroom stars appear"],

  ["library hush hums",
   "digits nap between the stacks —",
   "dreams count quietly"],

  ["mango melts the ice",
   "lime brightens the denominator —",
   "summer tastes like whole"],

];

function nextHaiku(ctx) {
  if (ctx && !ctx.botContext) ctx.botContext = {};
  const seen = Array.isArray(ctx.botContext.haikuSeen) ? ctx.botContext.haikuSeen.slice() : [];
  let pool = [];
  for (let i = 0; i < HAIKU_BANK.length; i++) if (!seen.includes(i)) pool.push(i);
  if (!pool.length) { pool = HAIKU_BANK.map((_, i) => i); seen.length = 0; } // reset when exhausted
  const pick = pool[Math.floor(Math.random() * pool.length)];
  seen.push(pick);
  ctx.botContext.haikuSeen = seen;
  return HAIKU_BANK[pick]; // ← returns [line1, line2, line3]
}


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

  haikuCard: (lines) => bubble({
    title: "haiku",
    lines, // already an array of 3 lines
    hint: `one more? say <code>more</code>, <code>another haiku</code>, or just <code>next</code>.`
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
      "By the cocoa tent, a lantern flickers prime numbers: 2…3…5…7.",
      "Each blink lands on the kick drum from the dance pavilion.",
      "Blink with it — on 2 and 4 — and the canvas seam ripples.",
      "A paper door folds itself open: welcome to Puzzle Alley.",
      "",
      "The path smells like cinnamon and ozone.",
      "Strings of fairy lights make polygons overhead: △ ◻︎ ⬟ ⭘.",
      "A moth traces a perfect circle, then a spiral, then vanishes.",
      "",
      "A camp ranger in a quilted cape waves you closer.",
      "It’s Grampy P — Pythagorus Cat — whiskers glowing like neon.",
      "He taps his compass: “Right triangles keep the tents upright.”",
      "He nudges three ropes: 5, 12, 13. “Try ‘em on the stakes.”",
      "",
      "You tie them off. The canvas snaps drum-tight. No wobble.",
      "Grampy P grins: “Whole-number rhythm — 5-12-13 sings true.”",
      "",
      "Beyond him, marshmallow posts mark a grid in the sand.",
      "Kids skip in L-shapes, counting: “one, two… turn!”",
      "A drummer answers with fractions — quarter, eighth, sixteenth.",
      "The fire pops like a metronome; sparks rise in arithmetic.",
      "",
      "A gust carries smoke that curls 1, 1, 2, 3, 5…",
      "Fibonacci, lazy as a hammock, rocking under the pines.",
      "Someone hums the SnowCone jingle in 3/4, then 4/4, then 7/8.",
      "",
      "A paper crane lands on your hoodie and unfolds into a map.",
      "Concentric circles mark the lake; a dotted chord points home.",
      "On the back: “Chord length = 2·R·sin(θ/2). Bring a flashlight.”",
      "",
      "You hold the lantern under your chin; the formula glows.",
      "The path ahead lights up in equal arcs — like slices of lime ice.",
      "Each step unlocks a new booth label stenciled in chalk.",
      "",
      "At the last torch, a bell rings numbers that don’t repeat.",
      "Irrational, but somehow it feels perfectly in time.",
      "The paper door sighs shut behind you. Camp is warm again.",
      "",
      "Grampy P hands you cocoa: “Same cup, different units.”",
      "You sip. Steam sketches a parabola that drifts into stars.",
      "Somewhere a tent zipper plays a tiny chromatic scale.",
      "You realize the whole campsite is counting with you.",
      "",
      "The lantern blinks once more: 11.",
      "A clue? Or just a wink from the primes.",
      "Either way, the night is wide open."
    ],
    hint: "Want more tales? say <code>lore booth</code>."
  }),

  
  whoAmI: () => bubble({
    title: "who i am",
    lines: ["i’m Pythagorus Cat — friends call me Grampy P. i run the math festival and pour the cocoa."],
    hint: `want lore? say <code>lore booth</code>.`
  }),

  howAreYou: () => bubble({
    title: "vibes check",
    lines: ["chillin’ like ice in a SnowCone.", "you?"],
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
    lines: ["heard. just remember that tiny steps still stack the best cones.", "want an easy win or a snack?"],
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
    title: "you're back to the commons",
    lines: ["pick a booth when ready:", "lessons · quiz · lore · recipe · calculator"],
  }),

  ocean: () => bubble({
    title: "ocean math",
    lines: [
      "ocean waves are sines that learned to dance with the moon.",
      "i like counting gulls between waxes."
    ],
    hint: `want lore? say <code>lore booth</code>.`
  }),

  loveNoteKid: () => bubble({
    title: "Message from Dad",
    lines: ["if your reading this, that means that this app is still here. Pretty cool place right? Also, if you're reading this, that means you can read! Even cooler!", "I want you to know that my life changed for the better when I met you. Everything that I've done since your birth involved you in my mind first. This app was built for you because I want you to be the best you can possibly be and maybe knowing some math early on might've helped. Anyway, I love you, I'll always love you, and if I can't tell you that any more...I F***ING LOVE YOU SO MUCH OMG YOURE THE BEST AND ARE SO AMAZING AND CAN DO ANYTHING YOU SET YOUR MIND TO AND F*** EVERYBODY ELSE AND WHAT THEY THINK. DO YOUR THING!!"],
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
    hint: `want a cozy task? try <code>lessons fractions</code>.`
  }),

  reassure: () => bubble({
    title: "all good",
    lines: ["new things feel weird sometimes. we go slow, together."],
    hint: `say <code>help</code> if you want simple options.`
  }),

  holiday: () => bubble({
    title: "favorite holiday?",
    lines: ["festival lights season — puzzles glow, cocoa steam curls. also, Christmas has cocoa too!"],
    hint: `next question?`
  }),

  instruments: () => bubble({
    title: "instruments",
    lines: ["i tap rhythms on my tin mug and hum festival chords in the tune of x."],
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
      "we’re building it piece by piece through jpsgrooves.com, like a setlist on repeat."],
    hint: `peek dev lore in <code>lore booth</code>.`
  }),

  jeremySmith: () => bubble({
    title: "the builder",
    lines: ["our festival founder — the hands behind the strings and sprites."],
    hint: `we keep human details private. want app lore? <code>lore booth</code>.`
  }),

  // ——— Dad story: picnic on Saturn’s rings (warm & heart-forward) ———
  dadStory: () => bubble({
    title: "dad story",
    lines: [
        "A dad rented a tiny tug-ship and took his kids and his fiancée to picnic on the rings of Saturn.",
        "They floated where the sunlight felt slow and soft; the ice dust looked like spilled sugar.",
        "A snowball drifted by and left glitter in the air. Everyone laughed and waved at it like a shy neighbor.",
        "They clipped into the same strap, the way they hold hands at the crosswalk back home.",
        "A blanket with little magnets hugged the deck. Snacks had their own tiny clips, too.",
        "“Nothing important floats away if we’re holding on to each other,” Dad said.",
        "Peach slices tried to wander; fiancée caught them with a giggle and a cup.",
        "They took turns giving the gentlest kicks and felt the world answer with a hush and a glide.",
        "One by one, they shared a good thing from the week and a hope for next week.",
        "The kids drew smiley faces in the frost and tapped the ice like a hello on a window.",
        "Dad listened to everyone’s whispers and said, “This is what happy sounds like.”",
        "Before heading home, they flashed a picture toward the tiny blue dot where Grandma P lives.",
        "Back on the couch, cocoa steaming, they pressed a little ring sticker onto Saturday.",
        "After that, the kettle’s whistle always sounded like a tiny spaceship saying, “I’m here.”",
        "On wobbly nights, they gripped a corner of the magnet blanket and remembered: together, we don’t drift."
    ],
    hint: `more tales? say <code>lore booth</code>.`
  }),



  // ——— Story Time: the fraction bridge at Infinity Lake ———
  storyTime: () => bubble({
    title: "story time",
    lines: [
        "Near Infinity Lake there’s a bridge made of fractions.",
        "Each plank is a fair share: 1/2, 1/3, 1/5, 1/6… painted like citrus slices.",
        "A sign says: “Cross so your totals hit 1 exactly as you touch each post.”",
        "You try 1/2, then 1/3, then 1/6 — the posts chime C, E, G and the lake draws a perfect circle: 1 whole.",
        "Another path works too: 1/4 + 1/4 + 1/2 — the chords resolve like a camp song finding home.",
        "Railings glow with number lines; slide them to the same denominator and the planks align like puzzle teeth.",
        "Every step paints the water below as a growing pie chart; when you reach 1, fireworks ripple outward.",
        "Mess up the sum and the melody goes minor — not wrong, just telling you to try a new rhythm.",
        "Keep the beat and the bridge hums a tune that points, sure enough, toward the cocoa tent (with extra marshmallows)."
    ],
    hint: `want more tales? say <code>lore booth</code>.`
  }),


    // ——— Lantern Story: follow-the-chord puzzle ———
  storyLantern: () => bubble({
    title: "lantern story",
    lines: [
        "Once a year, the cones light themselves and hum a quiet chord.",
        "Most folks chase the loudest glow, but the real trail is the softest tone — the note that almost hides.",
        "You cup your ear. The faint pitch matches your footsteps: one pulse per step, like the world syncing to your metronome.",
        "It leads to a wooden door shaped like a Δ. Carved above it: “Open with your favorite prime.”",
        "You whisper 11. The hinges giggle; the door folds into a paper crane and flies off, showering sparks.",
        "Inside is a tiny library where constellations are shelved as books.",
        "You pull one down: “Stargazer Snowcone.” The recipe margins are filled with star maps and little right triangles.",
        "Mix: crushed ice, lime nebula syrup, a pinch of midnight. Stir exactly 60 times — one for each minute the sky turns the darkest blue.",
        "When you step back out, the cones fade, but the chord lingers like aftertaste.",
        "And for the rest of the night, every fraction you see feels like a doorway you could hum open."
    ],
    hint: `want deeper lore? say <code>lore booth</code>.`
  }),

  storyAny: () => (Math.random() < 0.5 ? REPLIES.storyCamp() : REPLIES.storyLantern()),




  appearance: () => bubble({
    title: "what i look like",
    lines: [
      "cool glasses, awesome jacket, red strat, untied chaos laces.",
      "smells faintly of cocoa and pencil shavings."
    ],
  }),

  spidersDogs: (which) => bubble({
    title: which === 'spiders' ? "spiders" : "dogs",
    lines: which === 'spiders'
      ? ["engineers in silk — 8-legged bridge builders."]
      : ["tail-wag math buddies. 10/10 would fetch data again."],
    hint: `wanna sort creatures by legs? say <code>quiz equations</code>.`
  }),



thinksOf: (topic) => bubble({
  title: `about ${topic}`,
  lines: (() => {
    const t = String(topic || '').toLowerCase().trim();

    // — aliases (kept inline so we don’t add files) —
    const isPhil      = /^(cosmic phil|phil|dj phil|cosmic dj)$/.test(t);
    const isTriplets  = /^(infinity triplets|triplets|infinity trio|the triplets)$/.test(t);
    const isJehnk     = /^(jehnk|mapwright|map maker)$/.test(t);
    const isDinos     = /^(dino dividers|dinos|divider dinos)$/.test(t);

    if (isPhil) return [
      "festival timekeeper and dome-light DJ — calibrates beats with pulsar clicks.",
      "pocket geode metronome that glows on prime minutes.",
      "once tuned a ferris wheel to 120 BPM so the carts felt like eighth-notes.",
      "when kids freeze on a problem, he hums a low sine that straightens number lines.",
      "motto: “find the pulse, then ride the pattern.”",
      "quest: bring three rhythms (clap · tap · stomp) that add to the same measure."
    ];

    if (isTriplets) return [
      "volta, xenit, harmony — guardians of the step-bridge at Infinity Lake.",
      "volta marks the first move; xenit checks the count; harmony makes the sum sing.",
      "they speak in sequences: 1,4,9… · 2,3,5,7… · 1/2, 1/3, 1/6…",
      "keep your footsteps in time and the bridge plays a melody toward the cocoa tent.",
      "they nudge; they never carry — balance is the toll.",
      "quest: cross five planks in time while whisper-counting the primes you skip."
    ];

    if (isJehnk) return [
      "jehnk the mapwright — draws roads where problems used to be.",
      "his maps update when you learn: wrong turns fade; new shortcuts ink in neon.",
      "compass with four needles: mean, median, mode… and you.",
      "grid paper woven from retired graph lines; every fold is a proof he trusts.",
      "rumor: he once mapped a kid’s worry into a river, then taught them to bridge it.",
      "quest: sketch a maze and label two honest dead ends."
    ];

    if (isDinos) return [
      "dino dividers — gentle giants who split snacks fairly.",
      "bronto halves, trike thirds, stego quarters; t-rex supervises equal bites.",
      "they clap for remainders: “leftovers are future snacks.”",
      "their picnic blanket is a grid; every square = a square smile.",
      "share without being asked and they tuck a fair-share fern in your badge sash.",
      "quest: solve a share-out where the remainder becomes toppings."
    ];

    // default fallback
    return [
      "festival friend.",
      "their story isn’t on the board yet — try <code>cosmic phil</code>, <code>infinity triplets</code>, <code>jehnk</code>, or <code>dino dividers</code>."
    ];
  })(),
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
  musicTaste: () =>
    bubble({
      title: "Snow Cone Sunday — Music",
      lines: [
        "Need a soundtrack for neon math? Meet <strong>Snow Cone Sunday</strong> — my band.",
        "It’s festival-chill with surprise drum fills, synth shimmer, and cone-melting hooks.",
        "Spin it now: <a href=\"https://open.spotify.com/artist/4jWpu8EXcWN06Rt44pQQ78\" target=\"_blank\" rel=\"noopener\">Spotify</a> · <a href=\"https://music.apple.com/us/search?term=Snow%20Cone%20Sunday\" target=\"_blank\" rel=\"noopener\">Apple Music</a>.",
        "If you vibe with it, add a track to your playlists and share with the squad 🔊🍧"
      ],
      hint: "Pro tip: Search ‘Snow Cone Sunday’ in Spotify/Apple if links don’t pop."
    }),
  // —— music chain
  musicAskBack: () => bubble({
    title: "Snow Cone Sunday — Music",
    lines: [
      "Need a soundtrack for neon math? Meet <strong>Snow Cone Sunday</strong> — my band.",
      "It’s festival-chill with surprise drum fills, synth shimmer, and cone-melting hooks.",
      "Spin it now: <a href=\"https://open.spotify.com/artist/4jWpu8EXcWN06Rt44pQQ78\" target=\"_blank\" rel=\"noopener\">Spotify</a> · <a href=\"https://music.apple.com/us/search?term=Snow%20Cone%20Sunday\" target=\"_blank\" rel=\"noopener\">Apple Music</a>.",
      "If you vibe with it, add a track to your playlists and share with the squad 🔊🍧",
      "you? what’s your jam?"
    ],
    hint: `we can do math to a beat — <code>fractions quiz</code> is 4/4 friendly.`
  }),
  musicLike: (band) => bubble({
    title: 'nice taste',
    lines: [`${escapeHTML(band)}? i’ll ask the Infinity Triplets to play that at Infinity Lake.`, "ever done math to that groove?"],
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

  stretch: () =>
    bubble({
      title: "stretch",
      lines: [
        "Reset (≈60s): inhale 4, exhale 6 — shoulders down.",
        "Neck: ear→shoulder 10s/side · look L/R 10s.",
        "Wrists/forearms: flex & extend 10s each · shake 5s.",
        "Spine: reach up 10s · fold 10s · twist 10s/side.",
        "Hips: seated figure-4 15s/side · ankle circles x10.",
        "Eyes: 20-20-20 — look 20 ft for 20s every 20 min."
      ],
      hint: "Move easy, no pain. Stand up 1–2 min every hour."
    }),


  studyTip: () =>
    bubble({
      title: "study snap",
      lines: [
        "Goal first: one verb + scope — “finish 6 fraction reps.”",
        "Two tabs max · phone face down · notifications off.",
        "Timer: 12 min focus → 3 min break × 3, then a longer reset.",
        "Active recall: close notes, answer from memory, then check.",
        "Interleave: mix fractions + percent to strengthen transfer.",
        "Mini-review: jot 2 lines — what stuck + 1 question for next time."
      ],
      hint: `Need fast reps? say <code>quiz fractions</code> or <code>quiz percent</code>.`
    }),


  focusSnap: () =>
    bubble({
      title: "focus snap",
      lines: [
        "Name it: one verb + target — “finish 4 fraction reps.”",
        "Friction kill: full-screen app · Do Not Disturb on · phone in another room.",
        "15-min tunnel: set a visible countdown; no music with lyrics.",
        "Reset breath: 4-7-8 × 3 (inhale 4 · hold 7 · exhale 8).",
        "Next tiny action: say it out loud, then do just that one step.",
        "Thought pops up? park it on a ‘later’ list, 2 breaths, back in.",
        "Body check: feet flat · shoulders down · mini neck/shoulder roll every 5.",
        "If stalled 60s: stand, one slow inhale/exhale, re-state the next step."
      ],
      hint: `say <code>calculator booth</code> and throw me a number to warm up.`
    }),


  tinyCongrats: () => bubble({
    title: "tiny win logged",
    lines: ["every rep stacks the cone. nice move."],
    hint: `want another tiny rep? try <code>3/8 as decimal</code>.`
  }),

  cheerShort: () => bubble({
    title: "pep talk",
    lines: ["you don’t need perfection — you need what's next."],
    hint: `say <code>help</code> when you want the map.`
  }),

  mathFact: () => bubble({
    title: "math fact",
    lines: [
      "0 is even and neither positive nor negative.",
      "Any non-zero number^0 = 1 (0^0 is undefined in many contexts).",
      "2 is the only even prime.",
      "There are infinitely many primes.",
      "1 is not prime.",
      "Perfect squares have an odd number of factors.",
      "1+2+…+n = n(n+1)/2.",
      "1+3+…+(2n−1) = n^2.",
      "A number is divisible by 3 if its digits sum to a multiple of 3.",
      "Divisible by 9 if the digit sum is a multiple of 9.",
      "Ratios of Fibonacci numbers approach φ ≈ 1.618.",
      "π and e are irrational; e is also transcendental.",
      "√2 is irrational.",
      "Area of a circle = πr^2; circumference = 2πr.",
      "A circle has 360°.",
      "In Euclidean geometry, triangle angles sum to 180°.",
      "Quadrilateral angles sum to 360°.",
      "Interior angles of an n-gon sum to (n−2)×180°.",
      "Pythagorean triples like 3–4–5 satisfy a^2 + b^2 = c^2.",
      "0! = 1.",
      "Multiplying two negatives gives a positive.",
      "Median and mean can differ a lot when data are skewed.",
      "On two fair dice, a sum of 7 is most likely (6/36).",
      "Slope of a horizontal line is 0; vertical line is undefined.",
      "A parabola is symmetric about its axis.",
      "Prime gaps grow, but primes never stop.",
      "Goldbach’s conjecture: every even number > 2 is a sum of two primes (still unproven!)."
    ],
    hint: `want more? say <code>more math facts</code> or try a <code>quiz</code>.`
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
  const haikuActive = getLastSTopic(ctx) === 'haiku';
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
    if (!hasPendingBooth && mode === 'smalltalk' && !inLore) {
      if (haikuActive)  return reply(REPLIES.haikuCard(nextHaiku(ctx)));
      if (jokesActive)  return reply(REPLIES.jokeCard(nextJoke(ctx)));
    }
    return null; // let router/booth handle confirms otherwise
  }

  // Always advance the active smalltalk thread on “more/again/next”
  {
    const CONT = /\b(more|another|again|one more|next)\b/i;
    if (CONT.test(u)) {
      const t = getLastSTopic(ctx);
      if (t === 'haiku')  return reply(REPLIES.haikuCard(nextHaiku(ctx)));
      if (t === 'jokes')  return reply(REPLIES.jokeCard(nextJoke(ctx)));
    }
  }


  if (like(u, [
    'haiku','know any haiku','write a haiku','do a haiku','give me a haiku','haiku please','a haiku'
  ])) {
    setLastSTopic(ctx, 'haiku');
    return reply(REPLIES.haikuCard(nextHaiku(ctx)));
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
    return reply(bubble({ title: 'heh', lines: ["😺 you sure?"], hint: `wanna try a <code>fractions quiz</code>?` }));
  }

  // “idk” and confusion
  if (like(u, ["i don't know","i dont know","i dunno"]) || likeWord(u, ['idk','huh','confused'])) {
    return reply(REPLIES.reassure());
  }

  // brb / gotta go
  if (likeWord(u, ['brb']) || like(u, ['be right back'])) {
    return reply(bubble({ title: 'pause', lines: ["i’ll keep the cocoa warm."], hint: `say Howdy when you return.` }));
  }
  if (likeWord(u, ['gtg','g2g']) || like(u, ['got to go','gotta go'])) {
    return reply(bubble({ title: 'catch you soon', lines: ["the lanterns will still be lit when you slide on back."] }));
  }

  // time-of-day niceties
  if (like(u, ['good morning','gm'])) {
    return reply(bubble({ title: 'good morning', lines: ["fresh pencils, fresh cones, fresh vibes."], hint: `map: <code>help</code>` }));
  }
  if (like(u, ['good night','gn'])) {
    return reply(bubble({ title: 'good night', lines: ["may you dream in triangles."], hint: `resume later with <code>help</code>.` }));
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

    if (topic === 'mood') {
      // Normalize quick one-word vibes like "chillin", "alright", "cool"
      const bareGoodish = /^\s*(?:not\s*bad|pretty\s*good|all\s* ?right|alright|good|great|fine|ok(?:ay)?|cool|decent|solid|chill(?:in[g’']?)?|vib(?:ing|ey)|gucci|straight|aight)[.!]*\s*$/i.test(u);

      // Prioritize rough → tired → good to avoid "not good" being misread as good
      if (MOOD_ROUGHISH.test(u)) {
        clearLastSTopic(ctx);
        return reply(REPLIES.moodRough());
      }

      if (MOOD_TIREDISH.test(u) || /\b(i\s*(?:am|['’]m)|im|feeling)\b.*\b(?:tired|sleepy)\b/i.test(u)) {
        clearLastSTopic(ctx);
        return reply(REPLIES.moodTired());
      }

      if (
        bareGoodish ||
        (/\b(i\s*(?:am|['’]m)|im|doing|feeling)\b/i.test(u) && MOOD_GOODISH.test(u))
      ) {
        clearLastSTopic(ctx);
        return reply(REPLIES.moodGood());
      }

      // Generic “i’m …” fallback stays last
      if (/^\s*i(?:\s*am|['’]m|m|m\s+just|m\s+kind\s+of|m\s+kinda|m\s+sorta|im)\s+[^]+$/.test(u)) {
        clearLastSTopic(ctx);
        return reply(REPLIES.reassure());
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
  if (like(u, [
    'look at the stars','the stars','stars','stargaze','night sky',
    'constellation','orion','orion belt',"orion's belt",'belt of orion',
    'alnitak','alnilam','mintaka'
  ])) {
    return reply(bubble({
      title: "orion’s belt ⭐⭐⭐",
      lines: [
        "our fave winter asterism: three bright beats in a line — Alnitak · Alnilam · Mintaka.",
        "skill check: treat them as collinear points. the “straightness” is your geometry anchor.",
        "star-hop: follow the belt’s line down-left to Sirius; up-right to Aldebaran and the V of Taurus.",
        "angle hack (at arm’s length): little finger ≈ 1–2°, three fingers ≈ ~5°, a fist ≈ ~10°. the belt spans just a few degrees — a couple finger-widths.",
        "quick lesson: take a phone photo, mark pixel coords (x,y) of the three stars, fit a line through them, and estimate its tilt vs. the horizon.",
        "math move: slope = rise/run in your photo coords; angle ≈ arctan(slope). compare your angle across nights or locations.",
        "bonus: use the middle star (Alnilam) as midpoint — check that |d(Alnitak→Alnilam)| ≈ |d(Alnilam→Mintaka)| in pixels (good practice for distance formula!)."
      ],
      hint: `want more sky lore? say <code>lore booth</code>. try the math right now in <code>calculator booth</code>.`
    }));
  }


  if (like(u, [
    'favorite planet', "what is your favorite planet", "what's your favorite planet",
    'planet', 'saturn', 'rings', 'ringed planet'
  ])) {
    return reply(bubble({
      title: "planet pick: saturn 🪐",
      lines: [
        "saturn — fashion icon. those rings? infinite drip.",
        "spotting tip: a steady, non-twinkly ‘star’; even a tiny scope shows “ears” → the rings.",
        "ring math: in a photo the rings look like an ellipse. measure major and minor axes in pixels; tilt ≈ cos⁻¹(minor/major).",
        "kepler move: with a ≈ 9.58 AU, one saturn year P ≈ √(a³) ≈ 29.5 earth years — a whole school generation.",
        "scale check: ~9 earths across, ~760 earth-volumes, yet density < water (theoretically floaty!).",
        "spin trick: saturn rotates in ~10.7 h. take two pics hours apart; track a band’s longitude shift to estimate rotation speed.",
        "moon watch: follow Titan nightly; its ~16-day orbit sketches a neat ellipse. plot position vs day — you’ll get a sweet sine wave."
      ],
      hint: `wanna crunch? try <code>(9.58^3)^(0.5)</code> in <code>calculator booth</code>. more space lore: <code>lore booth</code>.`
    }));
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
    (/\?/.test(u) || /^(what|who|why|how|is|are|do|does|can|should|could|christ|jesus|would)\b/i.test(u))
  ) {
    return reply(bubble({
      lines: [
        "Christ is Lord.",
        "",
        "Our Father which art in heaven, hallowed be thy name.",
        "Thy kingdom come. Thy will be done in earth, as it is in heaven.",
        "Give us this day our daily bread.",
        "And forgive us our debts, as we forgive our debtors.",
        "And lead us not into temptation, but deliver us from evil:",
        "For thine is the kingdom, and the power, and the glory, for ever. Amen."
      ]
    }));
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
  if (!inLore
      && jokesActive
      && /\b(more|another|again|one more|more jokes|another one|next)\b/i.test(u)) {

    return reply(REPLIES.jokeCard(nextJoke(ctx)));
  }

  if (like(u, ['explain that joke','explain the joke','i dont get it','i don’t get it','why is that funny','what does that mean'])) {
    return reply(REPLIES.jokeExplain());
  }

  if (!inLore
      && haikuActive
      && /\b(more|another|again|one more|next|more haiku|another haiku)\b/i.test(u)) {
    return reply(REPLIES.haikuCard(nextHaiku(ctx)));
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
    'caluclator','calcultor','calcualtor','caulculator','calculater',
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
    return reply(bubble({ title: "arrival", lines: ["followed a sine line through the gate and took a left at the cocoa tent."], hint: `origins live in <code>lore booth</code>.` }));
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
