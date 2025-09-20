// /src/modes/mathTips/modes/lessons.js
import { composeReply } from '../conversationPolicy.js';
import { makeSession, readAffirmative, helpCard } from './_kit.js';

// Session still caps “next” advances so we don’t rattle on forever.
const S = makeSession({ capMin: 3, capMax: 4 });

// Gate tracks the current topic & slide index, plus whether we’re waiting for a confirm/choice
let Gate = { waiting: false, topicKey: 'fractions', index: 0 };

/* ───────────────── LESSON CONTENT ───────────────── */
const LESSONS = {
  fractions: [
    `<p><strong>Simplify:</strong> divide top/bottom by their GCD. Example: <code>12/18 → 2/3</code>.</p>`,
    `<p><strong>Add:</strong> same denom? add tops. different? common denom first. <code>1/2 + 1/3 = 5/6</code>.</p>`,
    `<p><strong>Mixed to improper:</strong> <code>2 1/3 = 7/3</code>. Improper to mixed? divide and remainder.</p>`,
    `<p><strong>Compare:</strong> cross-multiply or normalize. <code>3/5 vs 2/3 → 9/15 vs 10/15</code>.</p>`
  ],
  percent: [
    `<p><strong>Of:</strong> <code>p% of n = (p/100)*n</code>. Example: <code>25% of 40 = 10</code>.</p>`,
    `<p><strong>Percent change:</strong> <code>(new-old)/old × 100%</code>. Direction matters.</p>`,
    `<p><strong>Tip · tax · discount:</strong> round smart. 10% easy; 15% = 10% + half again.</p>`,
    `<p><strong>Reverse %:</strong> if 10 is 25% of n ➜ <code>n = 10 / 0.25 = 40</code>.</p>`
  ],
  equations: [
    `<p><strong>Slope-intercept:</strong> <code>y = mx + b</code>. m = slope, b = y-intercept.</p>`,
    `<p><strong>Point-slope:</strong> <code>y - y1 = m(x - x1)</code> to build lines fast from a point.</p>`,
    `<p><strong>Two points to slope:</strong> <code>m = (y2 - y1) / (x2 - x1)</code>.</p>`,
    `<p><strong>Standard form:</strong> <code>Ax + By = C</code>. You can convert between forms.</p>`
  ]
};

/* ───────────────── HELPERS ───────────────── */
function pickTopic(t) {
  const k = String(t || '').toLowerCase();
  if (/percent/.test(k)) return 'percent';
  if (/equation|mx\s*\+\s*b|slope|line/.test(k)) return 'equations';
  if (/frac|simplify|numerator|denominator/.test(k)) return 'fractions';
  return Gate.topicKey || 'fractions';
}

// a simple list that renders as a normal chat bubble (no inner card)
function menuCard() {
  return `
    <p><strong>Lessons Menu</strong></p>
    <ul class="mt-menu">
      <li><strong>fractions</strong> — simplify · add · mixed ↔ improper · compare</li>
      <li><strong>percent</strong> — of · change · tip/tax/discount · reverse %</li>
      <li><strong>equations</strong> — y=mx+b · point-slope · two-point slope · standard</li>
    </ul>
    <p class="mt-dim">say a topic (“fractions”, “percent”, “equations”) or <em>next</em> / <em>again</em> / <em>quiz me</em>.</p>
  `;
}

function nudgeCard() {
  return composeReply({
    part: { html: `<p>say <strong>next</strong>, <strong>again</strong>, <strong>quiz me</strong>, or <strong>menu</strong>.</p>` },
    askAllowed: false,
    mode: 'lessons'
  });
}

function chunkFor(key, idx) {
  const arr = LESSONS[key] || LESSONS.fractions;
  const i = Math.max(0, Math.min(idx, arr.length - 1));
  return arr[i];
}

function emitChunk(key, idx) {
  const html = chunkFor(key, idx);
  return composeReply({ part: { kind: 'answer', html }, askAllowed: true, mode: 'lessons' });
}

/* ───────────────── ENTRY ───────────────── */
/**
 * Start now shows the menu first (single bubble), then waits for the user
 * to pick a topic or say “next” to begin.
 */
export function start({ topic } = {}) {
  S.reset();
  Gate = { waiting: true, topicKey: pickTopic(topic), index: 0 };

  // show only one bubble: the menu itself
  return composeReply({
    part: { kind: 'answer', html: menuCard() },
    askAllowed: false, // no trailing “alright, friend…” nudge
    mode: 'lessons',
    noAck: true
  });
}

/* ───────────────── LOOP ───────────────── */
export function handle(text = '') {
  const msg = String(text || '').trim();

  // treat a raw "start" from the router just like start()
  if (/^start\b/i.test(msg)) return start({ topic: Gate.topicKey });

  // help
  if (/^help\b/i.test(msg)) {
    const card = helpCard(
      'Lessons Help',
      [
        'say: fractions · percent · equations',
        'controls: next · again · quiz me · menu',
        'examples: "simplify 12/18", "25% of 40", "y = mx + b"'
      ],
      'tip: say "exit" to leave lessons.'
    );
    return { html: composeReply({ part: { kind: 'answer', html: card }, askAllowed: false, mode: 'lessons' }) };
  }

  // menu
  if (/^menu\b/i.test(msg)) {
    Gate.waiting = true;
    return { html: composeReply({ part: { kind: 'answer', html: menuCard() }, askAllowed: false, mode: 'lessons', noAck: true }) };
  }

  // explicit controls
  if (/^again\b/i.test(msg)) {
    Gate.waiting = true;
    return { html: emitChunk(Gate.topicKey, Gate.index) };
  }

  if (/^(quiz(\s*me)?)\b/i.test(msg)) {
    Gate.waiting = false;
    return {
      html: composeReply({
        part: { html: `<p>cool breeze — rolling to <strong>Quiz</strong> for <em>${Gate.topicKey}</em>.</p>` },
        askAllowed: false
      })
    };
  }

  if (/^next\b/i.test(msg)) {
    if (S.isCapReached()) {
      Gate.waiting = true;
      return {
        html: composeReply({
          part: { kind: 'answer', html: `<p>nice groove. ready for <strong>quiz</strong> or peek the <strong>menu</strong>?</p>` },
          askAllowed: true,
          mode: 'lessons'
        })
      };
    }
    // first “next” after menu will emit the first chunk for the current topic
    S.bump();
    Gate.index = Math.min(Gate.index + 1, (LESSONS[Gate.topicKey] || []).length - 1);
    // ^ if we haven’t started yet (index 0), keep 0; otherwise advance
    //   (so users can say next immediately from the menu to begin at slide 0)
    Gate.waiting = true;
    return { html: emitChunk(Gate.topicKey, Gate.index) };
  }

  // topic switch by natural mention (does not auto-advance)
  const maybeTopic = pickTopic(msg);
  if (maybeTopic !== Gate.topicKey) {
    Gate.topicKey = maybeTopic;
    Gate.index = 0;
    Gate.waiting = true;
    // emit first slide of the chosen topic right away (feels snappier than re-showing menu)
    return { html: emitChunk(Gate.topicKey, Gate.index) };
  }

  // yes/no confirmation
  const yn = readAffirmative(msg);
  if (yn === 'no') {
    Gate.waiting = false;
    return {
      html: composeReply({
        part: { html: `<p>cool breeze. stay or switch — lessons, quiz, lore, recipes, calculator.</p>` },
        askAllowed: false
      })
    };
  }
  if (yn === 'yes') {
    // “yes” acts like next (respect cap)
    return handle('next');
  }

  // if user says something else while we are waiting, gently nudge
  if (Gate.waiting) {
    return { html: nudgeCard() };
  }

  // fallback
  return {
    html: composeReply({
      part: { html: `<p>say <strong>fractions</strong>, <strong>percent</strong>, or <strong>equations</strong> — or <em>menu</em>.</p>` },
      askAllowed: true,
      mode: 'lessons'
    })
  };
}
