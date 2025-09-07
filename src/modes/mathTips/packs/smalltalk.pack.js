// /src/modes/mathTips/packs/smalltalk.pack.js
import { registerIntent, M } from '../intentEngine.js';
import { composeReply } from '../conversationPolicy.js';
import { appState } from '../../../data/appState.js';
import { runInAction } from 'mobx';

const answer = (html)=>({ kind:'answer', html });
const pick = (a)=>a[Math.floor(Math.random()*a.length)];

const data = {
  greetings: [
    "hey Friend! what’s one tiny thing you want help with?",
    "yo Friend — pick a lane: % or fractions?",
    "hi Friend! toss me a mini problem."
  ],
  who_are_you: [
    "triangle whisperer. snowcone sage. your study cat."
  ],
  how_are_you: [
    "good vibes. want a quick % or a fraction rep?",
    "charging up. toss me one mini problem.",
    "cruising — got a tiny problem for me?"
  ],
  jokes: [
    "parallel lines have so much in common… shame they’ll never meet."
  ],
};

const FOODS = ['quesadillas', 'spicy mango snowcone', 'campfire nachos'];

function nextFav() {
  try {
    runInAction(() => {
      if (!appState.progress) appState.progress = {};
      if (!appState.progress.mathtips) appState.progress.mathtips = {};
      if (!appState.progress.mathtips.botContext) appState.progress.mathtips.botContext = {};
      const bc = appState.progress.mathtips.botContext;
      if (!('foodIndex' in bc)) bc.foodIndex = 0;
      bc.foodIndex = (bc.foodIndex + 1) % FOODS.length;
    });
    const i = appState.progress.mathtips.botContext.foodIndex;
    return FOODS[(i + FOODS.length - 1) % FOODS.length];
  } catch {
    return FOODS[Math.floor(Math.random() * FOODS.length)];
  }
}
function favLine(f) {
  const others = FOODS.filter(x => x !== f);
  return `mmm, <strong>${f}</strong>. also got love for ${others[0]} and ${others[1]}.`;
}
function canonicalFoodFrom(text) {
  const s = String(text).toLowerCase();
  if (/\bquesa?d(?:i|e)?l{1,2}a?s?\b/i.test(s)) return 'quesadillas';
  if (/\b(mango\s+)?snow\s*cones?\b/i.test(s))  return 'spicy mango snowcone';
  if (/\b(?:campfire\s+)?nachos?\b/i.test(s))   return 'campfire nachos';
  return null;
}

// ── core smalltalk ───────────────────────────────────────────────────────────
registerIntent({
  key: 'greet',
  tests: [ M.include(['hello','hi','hey','yo','sup','what’s up','howdy','hola']) ],
  base: 0.5,
  handler: ({ text }) => composeReply({ userText: text, part: answer(pick(data.greetings)) })
});
registerIntent({
  key: 'name_only',
  tests: [
    M.regex(/\bwhat'?s\s+your\s+name\??/i),
    M.include(['whats your name','your name'])
  ],
  base: 1.1, // slightly above 'who'
  handler: ({ text }) => composeReply({
    userText: text,
    part: { kind: 'answer', html: 'Grampy P' },
    askAllowed: false
  })
});

registerIntent({
  key: 'who',
  tests: [ M.include(['who are you','what are you','your name','who r u']) ],
  base: 0.6,
  handler: ({ text }) => composeReply({ userText: text, part: answer(pick(data.who_are_you)) })
});
registerIntent({
  key: 'mood',
  tests: [ M.include(['how are you','vibe check','how’s it going','you good','how you feel']) ],
  base: 0.85,
  handler: ({ text }) => composeReply({ userText: text, part: answer(pick(data.how_are_you)), noAck: true })
});
registerIntent({
  key: 'joke',
  tests: [ M.include(['joke','funny','laugh']) ],
  base: 0.55,
  handler: ({ text }) => composeReply({ userText: text, part: answer(pick(data.jokes)) })
});
registerIntent({
  key: 'farewell',
  tests: [ M.include(['bye','goodbye','later','see ya','ciao','adios']) ],
  base: 0.55,
  handler: ({ text }) => composeReply({ userText: text, part: answer('Catch you on the flip side, traveler.') })
});

// ── preferences / color / “what can I ask?” ──────────────────────────────────
registerIntent({
  key: 'favorite_color',
  tests: [
    M.regex(/\b(favou?rite|favorite)\s+colou?r\b/i),
    M.regex(/\bwhat\s+is\s+your\s+favorite\s+colou?r\b/i)
  ],
  base: 0.9,
  handler: ({ text }) => composeReply({
    userText: text,
    part: answer('neon math green with a splash of mango. pairs well with fresh fractions.'),
    noAck: true
  })
});

registerIntent({
  key: 'ask_capabilities',
  tests: [
    M.regex(/\bwhat\s+can\s+i\s+ask(?:\s+you)?\??$/i),
    M.regex(/\bhow\s+do\s+i\s+use\s+you\b/i),
    M.include(['what can you do','help me use','teach me to use'])
  ],
  base: 0.95,
  handler: ({ text }) => composeReply({
    userText: text,
    part: answer('Keep it tiny. Ask, calculate, or practice 2 reps.<br><code>15% of 80</code> → <strong>12</strong> • <code>gcf 18 24</code> → <strong>6</strong><br>or say <code>help</code> for options.'),
    noAck: true
  })
});

// ── food: favorites / recipes / affinity / combos ────────────────────────────
registerIntent({
  key: 'favorite_food',
  tests: [
    M.regex(/\b(favou?rite|favorite)\s+(food|snack|meal)\b/i),
    M.regex(/\bwhat\s+do\s+you\s+like\s+(to\s+eat|for\s+snacks?)\b/i),
    M.regex(/\byour\s+(top|favou?rite)\s+(3|three)\s+foods?\b/i)
  ],
  base: 1.0,
  handler: ({ text }) => {
    const f = nextFav();
    const tag = ['quesadilla wisdom','mango snowcone mode','nacho night energy'][Math.floor(Math.random()*3)];
    return composeReply({ userText: text, part: answer(`${favLine(f)} (${tag})`), noAck: true });
  }
});
registerIntent({
  key: 'favorite_food_multi',
  tests: [
    M.regex(/\bwhat\s+are\s+your\s+favou?rite\s+foods?\b/i),
    M.regex(/\bwhat\s+foods?\s+do\s+you\s+like\b/i)
  ],
  base: 1.0,
  handler: ({ text }) => composeReply({
    userText: text,
    part: answer(`top three, easy: <strong>${FOODS[0]}</strong>, <strong>${FOODS[1]}</strong>, <strong>${FOODS[2]}</strong>. right now I’m craving ${nextFav()}.`),
    noAck: true
  })
});
registerIntent({
  key: 'favorite_cone',
  tests: [
    M.regex(/\b(favou?rite|favorite)\s+(snow\s*cone|snowcone|cone)\b/i),
    M.regex(/\bwhat\s+is\s+your\s+favorite\s+(snow\s*cone|snowcone|cone)\b/i)
  ],
  base: 1.1,
  handler: ({ text }) => composeReply({
    userText: text,
    part: answer('spicy mango snowcone all day — shaved ice → mango syrup → tiny chili dust → lime squeeze.'),
    noAck: true
  })
});
registerIntent({
  key: 'food_affinity',
  tests: [
    M.regex(/\b(?:do\s+you\s+like|so\s+you\s+like|you\s+like|u\s+like)\b.*\b(quesa(?:dillas?)?|mango\s+snow\s*cones?|snow\s*cones?|campfire\s+nachos?)\b/i)
  ],
  base: 1.05,
  handler: ({ text }) => {
    const pickCanon = canonicalFoodFrom(text) || nextFav();
    return composeReply({ userText: text, part: answer(`oh 100% — <strong>${pickCanon}</strong> is a vibe. and ${favLine(nextFav())}`), noAck: true });
  }
});
registerIntent({
  key: 'food_keyword',
  tests: [
    M.regex(/^(?:mango\s+)?snow\s*cones?\??$/i),
    M.regex(/^quesa(?:dillas?)?\??$/i),
    M.regex(/^nachos?\??$/i),
    M.regex(/^mango\s+snowcone\s+mode\??$/i),
    M.regex(/^nacho\s+night\s+energy\??$/i),
    M.regex(/^quesadilla\s+wisdom\??$/i),
  ],
  base: 0.97,
  handler: ({ text }) => {
    const lower = String(text).toLowerCase();
    if (/^quesadilla\s+wisdom\??$/i.test(lower)) {
      return composeReply({ userText: text, part: answer('pan medium heat → tortilla → cheese → fold → golden both sides (2–3 min/side). ratio: 1 tortilla : 1/2 cup cheese • add-ins: beans, onion, peppers — small handful.'), noAck: true });
    }
    if (/^mango\s+snowcone\s+mode\??$/i.test(lower)) {
      return composeReply({ userText: text, part: answer('spicy mango snowcone mode: shaved ice → mango syrup → tiny chili dust → lime squeeze. festival fuel secured.'), noAck: true });
    }
    if (/^nacho\s+night\s+energy\??$/i.test(lower)) {
      return composeReply({ userText: text, part: answer('campfire nachos protocol: chips → cheese → beans → repeat layers → foil → low flame till melty; finish with jalapeño + crema.'), noAck: true });
    }
    const canon = canonicalFoodFrom(text) || nextFav();
    return composeReply({ userText: text, part: answer(favLine(canon)), noAck: true });
  }
});
registerIntent({
  key: 'food_combo_triggers',
  tests: [ M.regex(/(mango\s+snowcone\s+mode|nacho\s+night\s+energy|quesadilla\s+wisdom)(\s*\/\s*(?:mango\s+snowcone\s+mode|nacho\s+night\s+energy|quesadilla\s+wisdom))+/i) ],
  base: 1.0,
  handler: ({ text }) => {
    const lower = String(text).toLowerCase();
    const blocks = [];
    if (lower.includes('quesadilla wisdom')) blocks.push('pan medium heat → tortilla → cheese → fold → golden both sides (2–3 min/side). ratio: 1 tortilla : 1/2 cup cheese • add-ins: beans, onion, peppers — small handful.');
    if (lower.includes('mango snowcone mode')) blocks.push('spicy mango snowcone mode: shaved ice → mango syrup → tiny chili dust → lime squeeze. festival fuel secured.');
    if (lower.includes('nacho night energy')) blocks.push('campfire nachos protocol: chips → cheese → beans → repeat layers → foil → low flame till melty; finish with jalapeño + crema.');
    return composeReply({ userText: text, part: answer(blocks.join('<br>')), noAck: true });
  }
});
registerIntent({
  key: 'food_recipe',
  tests: [
    M.regex(/\b(tell\s+me\s+(?:more\s+)?about|teach\s+me\s+about|what\s+do\s+you\s+know\s+about)\s+(?:.*\s)?(quesa?d(?:i|e)?l{1,2}a?s?|(?:mango\s+)?snow\s*cones?|(?:campfire\s+)?nachos?)\b/i),
    M.regex(/\b(how\s+to|how\s+do\s+you\s+(?:make|cook)|recipe\s+for)\b.*\b(quesa?d(?:i|e)?l{1,2}a?s?|(?:mango\s+)?snow\s*cones?|(?:campfire\s+)?nachos?)\b/i),
    M.regex(/\b(quesa?d(?:i|e)?l{1,2}a?s?|(?:mango\s+)?snow\s*cones?|(?:campfire\s+)?nachos?)\b.*\b(recipe|how\s+to|cook|make)\b/i),
  ],
  base: 1.05,
  handler: ({ text }) => {
    const s = String(text).toLowerCase();
    let html = '';
    if (/\bquesa?d(?:i|e)?l{1,2}a?s?\b/i.test(s)) {
      html = 'pan medium heat → tortilla → cheese → fold → golden both sides (2–3 min/side). ratio: 1 tortilla : 1/2 cup cheese • add-ins: beans, onion, peppers — small handful. want the mathy version? say <code>quesa math</code>.';
    } else if (/\b(mango\s+)?snow\s*cones?\b/i.test(s)) {
      html = 'spicy mango snowcone: shaved ice → mango syrup → tiny chili dust → lime squeeze.';
    } else if (/\b(?:campfire\s+)?nachos?\b/i.test(s)) {
      html = 'campfire nachos: chips → cheese → beans → repeat layers → foil → low flame till melty; finish with jalapeño + crema.';
    } else {
      html = favLine(nextFav());
    }
    return composeReply({ userText: text, part: answer(html), noAck: true });
  }
});

// ── practice lanes: “fractions 2”, “percent 3”, “deal 2” ─────────────────────
function randFrom(a){ return a[Math.floor(Math.random()*a.length)]; }
function makeFractions(n){
  const pool = ['1/2 + 1/3','3/4 − 1/8','2/3 × 3/5','5/6 ÷ 2/3','simplify 12/18','to mixed 11/4'];
  return Array.from({length:n},()=>randFrom(pool));
}
function makePercents(n){
  const pool = ['15% of 80','25% of 40','7.5% of 120','30% of 90','18% of 50'];
  return Array.from({length:n},()=>randFrom(pool));
}
function listToLine(xs){
  return xs.map(x=>`<code>${x}</code>`).join(' • ');
}

registerIntent({
  key: 'fractions_n',
  tests: [ M.regex(/^fractions?\s+(\d+)\b/i) ],
  base: 0.95,
  handler: ({ text }) => {
    const m = text.match(/^fractions?\s+(\d+)\b/i);
    const n = Math.max(1, Math.min(10, parseInt(m?.[1]||'2',10)));
    const qs = makeFractions(n);
    return composeReply({ userText: text, part: answer(`mini set (${n}): ${listToLine(qs)}`), noAck: true });
  }
});
registerIntent({
  key: 'percent_n',
  tests: [ M.regex(/^percents?\s+(\d+)\b/i), M.regex(/^percent\s+(\d+)\b/i) ],
  base: 0.95,
  handler: ({ text }) => {
    const m = text.match(/^(?:percents?|percent)\s+(\d+)\b/i);
    const n = Math.max(1, Math.min(10, parseInt(m?.[1]||'2',10)));
    const qs = makePercents(n);
    return composeReply({ userText: text, part: answer(`mini set (${n}): ${listToLine(qs)}`), noAck: true });
  }
});
registerIntent({
  key: 'deal_n',
  tests: [ M.regex(/^deal\s+(\d+)\b/i) ],
  base: 0.9,
  handler: ({ text }) => {
    const m = text.match(/^deal\s+(\d+)\b/i);
    const n = Math.max(1, Math.min(10, parseInt(m?.[1]||'2',10)));
    const half = Math.ceil(n/2);
    const qs = makeFractions(n - half).concat(makePercents(half));
    return composeReply({ userText: text, part: answer(`mini set (${n}): ${listToLine(qs)}`), noAck: true });
  }
});
registerIntent({
  key: 'yes_followup',
  tests: [ M.regex(/^\s*(yes|yep|sure|ok|okay)\s*$/i) ],
  base: 0.95,
  handler: ({ text }) => {
    const bc = appState?.progress?.mathtips?.botContext || {};
    const last = (bc.lastAnswer || '').toLowerCase();
    if (last.includes('fractions 2') || last.includes('percent 2') || last.includes('deal 2')) {
      return composeReply({ userText: text, part: { kind:'answer', html: 'deal 2: 1) 15% of 140 → ?  2) simplify 18/42 → ?', noAck:true }});
    }
    return composeReply({ userText: text, part: { kind:'answer', html: 'gotcha. toss me one or say `deal 2`.', noAck:true }});
  }
});

registerIntent({
  key: 'name',
  tests: [ M.regex(/\bwhat'?s\s+your\s+name\??/i) ],
  base: 0.8,
  handler: ({ text }) => composeReply({ userText: text, part: answer('I’m Grampy P. triangle whisperer. snowcone sage. your study cat.') })
});
registerIntent({
  key: 'bot_name_exact',
  tests: [
    M.include(["what's your name", "whats your name"]),
    M.include(["what is your name", "your name?"])
  ],
  base: 1.2, // higher than generic "who are you"
  handler: ({ text }) => composeReply({
    userText: text,
    part: { kind: 'answer', html: 'Grampy P' },
    askAllowed: false // no nudge
  })
});
