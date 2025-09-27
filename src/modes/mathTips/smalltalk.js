// /src/modes/mathTips/smalltalk.js
import { composeReply } from './conversationPolicy.js';

const MIN_COOLDOWN_MS = 2500;
let lastReplyAt = 0;

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const BANK = {
  greet: [
    "Hey hey! Welcome back, {name}.",
    "Yo! Vibes are strong today, {name}.",
    "Howdy, {name}! Cone time?"
  ],
  how_are_you: [
    "Chillin' like ice in a snowcone. You?",
    "Feelin’ prime, not composite. You?",
    "All green lights here. What’s the move?"
  ],
  thanks: ["Anytime! 🍧","Glad to help!","You got it!"],
  compliment: ["Ayy, appreciate the kindness!","You’re too kind. Let’s roll!","Respect! Now, where we headed?"],
  laugh: ["lol same 😂","haha, valid.","we out here."],
  filler: ["Say the word and we’ll hop booths.","I’m here for it. Lessons or quiz?","Wanna try a quick 3-Q quiz?"],
  bye: ["Catch you at the festival gates. 👋","Later! Keep stacking cones. 👋","See ya, {name}! 🍧"],

  // NEW
  hungry: [
    "Snack vibes detected. Mango snowcone or cheesy quesadilla?",
    "We can refuel first. Snowcone or nachos?",
    "Energy up = math up. Pick a snack!"
  ],
  love: [
    "Love’s part of the festival lore, for real.",
    "Aw. The village has stories about that.",
    "Heart math hits different."
  ],

  nudge: [
    "Try <code>quiz fractions</code> for a 3-pack.",
    "Say <code>lessons booth</code> to dive in.",
    "Curious? <code>lore booth</code> is cozy."
  ],
  nudgeHungry: [
    "Say <code>recipes booth</code> and we’ll cook.",
    "Type <code>recipes snowcone</code> to start sweet.",
    "Try <code>recipes quesadilla</code> for quick fuel."
  ],
  nudgeLove: [
    "Say <code>lore booth</code> for festival tales.",
    "Type <code>lore pcat</code> for myths.",
    "Try <code>lore origins</code> for a gentle start."
  ]
};

const RULES = [
  { tag: 'greet',        rx: /\b(hi|hey|yo|hello|sup|what'?s up)\b/i },
  { tag: 'how_are_you',  rx: /\b(how (are|r) (you|u)|hru)\b/i },
  { tag: 'thanks',       rx: /\b(thanks|thx|ty|appreciate it)\b/i },
  { tag: 'compliment',   rx: /\b(nice|cool|awesome|great|love (this|u|you))\b/i },
  { tag: 'laugh',        rx: /\b(lol|lmao|rofl|haha|hehe|😂|🤣)\b/i },
  { tag: 'bye',          rx: /\b(bye|goodbye|gtg|brb|see ya|later)\b/i },
  { tag: 'filler',       rx: /^(ok(ay)?|k|sure|right|alright|bet|word|\.+)$/i },

  // NEW intents
  { tag: 'hungry',       rx: /\b(hungry|starving|snack|eat|food|munch|taco|nacho|snow\s*cone|snowcone)\b/i },
  { tag: 'love',         rx: /\b(love|crush|romance|heartbreak|hearts?)\b/i },
];

export function classifySmallTalk(text) {
  const t = String(text || '').trim();
  if (!t) return null;
  for (const r of RULES) if (r.rx.test(t)) return r.tag;
  return null;
}

function render(html) {
  return composeReply({
    part: { kind: 'answer', html },
    askAllowed: false,
    noAck: true,
    mode: 'smalltalk'
  });
}

export function respondSmallTalk(text, { name = 'friend' } = {}) {
  const tag = classifySmallTalk(text);
  if (!tag) return null;

  const now = Date.now();
  if (now - lastReplyAt < MIN_COOLDOWN_MS) return null;
  lastReplyAt = now;

  const line = pick(BANK[tag]).replace('{name}', name);

  // context-aware nudges
  let nudge = "";
  if (tag === 'hungry' && Math.random() < 0.9) {
    nudge = `<p class="mt-dim">${pick(BANK.nudgeHungry)}</p>`;
  } else if (tag === 'love' && Math.random() < 0.9) {
    nudge = `<p class="mt-dim">${pick(BANK.nudgeLove)}</p>`;
  } else if (Math.random() < 0.25) {
    nudge = `<p class="mt-dim">${pick(BANK.nudge)}</p>`;
  }

  return { html: render(`<p>${line}</p>${nudge}`) };
}
