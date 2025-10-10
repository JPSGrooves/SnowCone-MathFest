// /src/modes/mathTips/modes/lessons.js
import { composeReply } from '../conversationPolicy.js';
import { makeSession, readAffirmative, helpCard } from './_kit.js';
import { appState } from '../../../data/appState.js';
import { /* ... */ } from '../qabot.js'; // where setPendingSwitch is exported if needed

// Session still caps “next” advances so we don’t rattle on forever.
const S = makeSession({ capMin: 3, capMax: 4 });

// Gate tracks the current topic & slide index, plus whether we’re waiting for a confirm/choice
let Gate = { waiting: false, topicKey: 'fractions', index: 0, started: false };

/* ───────────── controls (centralized) ───────────── */
const RX = {
  START: /^start\b/i,
  HELP: /^help\b/i,
  MENU: /^menu\b/i,
  AGAIN: /^again\b/i,
  QUIZME: /^(quiz(\s*me)?)\b/i,
  NEXTISH: /^(next|more|another|one\s*more|ok(?:ay)?)\b/i,
};

/* ───────────────── LESSON CONTENT — paragraph slides ───────────────── */
const LESSONS = {
  fractions: [
    `
    <p><strong>Simplifying fractions</strong> means shrinking a fraction without changing its value. 
    Divide the top (numerator) and bottom (denominator) by the same greatest common divisor (GCD).</p> 
    Why it works: you’re multiplying by <code>1</code> in disguise (like <code>6/6</code>), so the size doesn’t change, just the look.</p>
    Example: <code>12/18</code> — both share <code>6</code>, so <code>12÷6 = 2</code>, <code>18÷6 = 3</code>, giving <code>2/3</code>. </p>
    Try one: simplify <code>15/25</code> (hint: divide by <code>5</code>).</p>
    `,
    `
    <p><strong>Adding fractions</strong> is easy with a shared denominator. 
    Same denom? Add or subtract the numerators and keep the denom: <code>3/8 + 2/8 = 5/8</code>.</p> 
    Different denoms? Build a common one first (often the Least Common Multiple).</p> 
    Example: <code>1/2 + 1/3</code> → common denom <code>6</code>, so <code>1/2 = 3/6</code> and <code>1/3 = 2/6</code>; total <code>5/6</code>.</p> 
    Quick check: is <code>3/4 − 1/8</code> equal to <code>5/8</code>?</p>
    `,
    `
    <p><strong>Mixed ↔ improper</strong>: a mixed number has a whole part plus a fraction (like <code>2 1/3</code>).</p>
    To convert mixed → improper, multiply the whole by the denominator and add the numerator: <code>2 1/3 = (2×3 + 1)/3 = 7/3</code>.</p> 
    Improper → mixed? Divide: <code>7 ÷ 3 = 2</code> remainder <code>1</code>, so <code>2 1/3</code>.</p> 
    Use mixed when describing amounts (cookies on a tray); use improper when calculating (easier arithmetic).</p> 
    Practice: write <code>5 2/5</code> as an improper fraction.</p>
    `,
    `
    <p><strong>Comparing fractions</strong> can be done two classic ways.</p> 
    (A) Normalize to a common denominator and compare numerators: <code>3/5</code> vs <code>2/3</code> → <code>9/15</code> vs <code>10/15</code>, so <code>2/3</code> is bigger.</p> 
    (B) Cross-multiply to avoid building the denominator: compare <code>3×3</code> with <code>2×5</code> → <code>9</code> vs <code>10</code>.</p> 
    Tip: if you only need “which is larger,” cross-multiplying is quick; if you’ll add next, normalize once and reuse it.</p> 
    Your turn: which is larger, <code>5/12</code> or <code>4/9</code>? </p> Say 'quiz me' to practice! or 'next' to move on!</p>
    `
  ],

  percent: [
    `
    <p><strong>“Percent of”</strong> turns a percentage into a scale factor. </p>
    Rule: <code>p% of n = (p/100) × n</code>. The percent becomes a decimal multiplier. </p>
    Example: <code>25% of 40 = 0.25 × 40 = 10</code>. </p>
    Mental math tip: <code>10%</code> is “move the decimal once” (<code>10% of 80 = 8</code>), then scale (so <code>20%</code> is double that).</p>
    Try: what’s <code>15% of 60</code>?</p>
    `,
    `
    <p><strong>Percent change</strong> measures <em>relative</em> growth or drop. </p>
    Formula: <code>(new − old)/old × 100%</code>. Direction matters: up from 40→60 is a <em>+50%</em> increase; down 60→40 is a <em>−33.3…%</em> decrease. </p>
    This is why “up 50% then down 50%” doesn’t return you to the start — the bases are different. </p>
    Quick check: old <code>80</code>, new <code>100</code> → change?</p>
    `,
    `
    <p><strong>Tips · tax · discounts</strong> all use the same multiplier idea. </p>
    Add-ons (tip/tax): price × <code>(1 + rate)</code>, e.g., 18% tip on $42 → <code>42 × 1.18</code>. </p>
    Discounts: price × <code>(1 − rate)</code>, e.g., 27% off $60 → <code>60 × 0.73</code>. </p>
    Mental math: <code>15%</code> is “ten percent plus half of that.” </p>
    Try: a shirt is $50 with 8% tax — what’s the total?</p>
    `,
    `
    <p><strong>Reverse percent</strong> works backwards: if a number is a percent of a whole, divide by the percent-as-decimal. </p>
    Example: “10 is 25% of what?” → <code>10 ÷ 0.25 = 40</code>. </p>
    Sale math trick: if the final price already includes a 20% discount, the final is <code>0.80</code> of the original — so original = <code>final ÷ 0.80</code>. </p>
    Try: 36 is 60% of what number? Say 'quiz me' to practice! or 'next' to move on!</p>
    `
  ],

  equations: [
    `
    <p><strong>Slope-intercept form</strong> is <code>y = mx + b</code>. </p>
    The slope <code>m</code> tells you “rise over run” (how fast y changes), and <code>b</code> is where the line crosses the y-axis. </p>
    Example: <code>y = 2x + 3</code> goes up 2 for every 1 right, and hits the axis at <code>(0, 3)</code>. </p>
    Why it’s useful: you can read behavior at a glance and graph with two quick points. </p>
    Challenge: what’s the y-intercept in <code>y = −0.5x + 4</code>?</p>
    `,
    `
    <p><strong>Point-slope form</strong> builds a line fast from a point and a slope: </p>
    <code>y − y₁ = m(x − x₁)</code>. Plug the data in, then simplify if needed. </p>
    Example: slope <code>m=3</code> through <code>(2, −1)</code> → <code>y + 1 = 3(x − 2)</code> → <code>y = 3x − 7</code>. </p>
    Use this when you know a point and the slope (or can compute the slope from data). </p>
    Try forming the equation with <code>m = −2</code> through <code>(−1, 4)</code>.</p>
    `,
    `
    <p><strong>Two points → slope</strong>: when you have <code>(x₁, y₁)</code> and <code>(x₂, y₂)</code>, </p>
    slope is <code>m = (y₂ − y₁)/(x₂ − x₁)</code>. </p>
    Example: points <code>(1, 5)</code> and <code>(4, 2)</code> → slope <code>(2−5)/(4−1) = −3/3 = −1</code>. </p>
    Then use point-slope to write the full equation. </p>
    Quick try: find m for <code>(−2, 3)</code> and <code>(1, 9)</code>.</p>
    `,
    `
    <p><strong>Standard form</strong> is <code>Ax + By = C</code> (often with integer A, B, C). </p>
    You can convert between forms to match the task: standard is nice for intercepts (set <code>x=0</code> or <code>y=0</code>), </p>
    slope-intercept is great for graphing, and point-slope is perfect for building. </p>
    Example: from <code>y = 2x + 6</code> → <code>2x − y = −6</code> (move terms to one side). </p>
    Practice: put <code>y = −3x + 5</code> into standard form. Say 'quiz me' to practice! or 'next' to move on!</p>
    `
  ]
};

/* ───────────── helpers ───────────── */
function pickTopic(t) {
  const k = String(t || '').toLowerCase();
  if (/percent/.test(k)) return 'percent';
  if (/equation|mx\s*\+\s*b|slope|line/.test(k)) return 'equations';
  if (/frac|simplify|numerator|denominator/.test(k)) return 'fractions';
  return Gate.topicKey || 'fractions';
}

function menuCard() {
  return `
    <p><strong>Lessons Menu</strong></p>
    <ul class="mt-menu">
      <li><strong>fractions</strong> — simplify · add · mixed ↔ improper · compare</li>
      <li><strong>percent</strong> — of · change · tip/tax/discount · reverse %</li>
      <li><strong>equations</strong> — y=mx+b · point-slope · two-point slope · standard</li>
    </ul>
    <p class="mt-dim">say a topic (“fractions”, “percent”, “equations”) or <em>quiz me</em> to practice this topic now.</p>
  `;
}

function nudgeCard() {
  return composeReply({
    part: { html: `<p>when you're ready to start, say <strong>next</strong>, <strong>again</strong>, <strong>quiz me</strong>, or <strong>menu</strong>.</p>` },
    askAllowed: false,
    mode: 'lessons'
  });
}

function chunkFor(key, idx) {
  const arr = LESSONS[key] || LESSONS.fractions;
  const i = Math.max(0, Math.min(idx, arr.length - 1));
  return arr[i];
}

function emitCurrent() {
  return composeReply({
    part: { kind: 'answer', html: chunkFor(Gate.topicKey, Gate.index) },
    askAllowed: true,
    mode: 'lessons'
  });
}

function rememberLessonTopic(k) {
  try {
    if (!appState.progress) appState.progress = {};
    if (!appState.progress.mathtips) appState.progress.mathtips = {};
    if (!appState.progress.mathtips.botContext) appState.progress.mathtips.botContext = {};
    appState.progress.mathtips.botContext.lastLessonTopic = k; // 'fractions'|'percent'|'equations'
  } catch {}
}

/* ───────────── ENTRY ───────────── */
export function start({ topic } = {}) {
  S.reset();
  Gate = { waiting: true, topicKey: pickTopic(topic), index: 0, started: false };
  rememberLessonTopic(Gate.topicKey);

  return composeReply({
    part: { kind: 'answer', html: menuCard() },
    askAllowed: false,
    mode: 'lessons',
    noAck: true
  });
}

/* ───────────── LOOP ───────────── */
export function handle(text = '') {
  const msg = String(text || '').trim();

  if (RX.START.test(msg)) return start({ topic: Gate.topicKey });

  if (RX.HELP.test(msg)) {
    const card = helpCard(
      'Lessons Help',
      [
        'say: fractions · percent · equations',
        'controls: next · again · quiz me · menu',
        'examples: "simplify 12/18", "25% of 40", "y = mx + b"'
      ],
      'tip: say "exit" to leave lessons.'
    );
    return { html: composeReply({ part: { kind: 'answer', html: card }, askAllowed: false, mode: 'lessons', noAck: true }) };
  }

  if (RX.MENU.test(msg)) {
    Gate.waiting = true;
    return { html: composeReply({ part: { kind: 'answer', html: menuCard() }, askAllowed: false, mode: 'lessons', noAck: true }) };
  }

  if (RX.AGAIN.test(msg)) {
    Gate.waiting = true;
    return { html: emitCurrent() };
  }

  if (RX.QUIZME.test(msg)) {
    // inside lessons.js where the user says "quiz me"
    setPendingSwitch?.('quiz', 'quiz me');
    return composeReply({ part: { kind: 'confirm', html: `<p>Jump to <b>Quiz</b> for this topic?</p>` }, askAllowed: false });
  }


  if (RX.NEXTISH.test(msg)) {
    const slides = LESSONS[Gate.topicKey] || LESSONS.fractions;
    const lastIdx = slides.length - 1;

    if (S.isCapReached()) {
      Gate.waiting = true;
      return {
        html: composeReply({
            part: { kind: 'answer', html: `<p>nice groove.</p>${menuCard()}` },
            askAllowed: true,
            mode: 'lessons'
        })
      };
    }

    if (!Gate.started) {
      Gate.started = true;
      Gate.waiting = true;
      S.bump();
      return { html: emitCurrent() }; // show slide 0 without advancing index
    }

    if (Gate.index >= lastIdx) {
      Gate.waiting = true;
      return {
        html: composeReply({
            part: { kind: 'answer', html: `<p>that’s the end of <strong>${Gate.topicKey}</strong> for now.</p>${menuCard()}` },
            askAllowed: true,
            mode: 'lessons'
        })
      };
    }

    Gate.index = Math.min(Gate.index + 1, lastIdx);
    Gate.waiting = true;
    S.bump();
    return { html: emitCurrent() };
  }

  // topic switch by natural mention (does not auto-advance)
  {
    const maybeTopic = pickTopic(msg);
    if (maybeTopic !== Gate.topicKey) {
      Gate.topicKey = maybeTopic;
      Gate.index = 0;
      Gate.waiting = true;
      Gate.started = false;
      rememberLessonTopic(Gate.topicKey);
      return { html: emitCurrent() };
    }
  }

  // yes/no confirmation
  {
    const yn = readAffirmative(msg);
    if (yn === 'no') {
      Gate.waiting = false;
      return {
        html: composeReply({
          part: { html: `<p>cool breeze. stay or switch — lessons, quiz, lore, recipe, calculator.</p>` },
          askAllowed: false
        })
      };
    }
    if (yn === 'yes') {
      return handle('next');
    }
  }

  // if user says something else while we are waiting, gently nudge
  if (Gate.waiting) return { html: nudgeCard() };

  // fallback
  return {
    html: composeReply({
      part: { html: `<p>say <strong>fractions</strong>, <strong>percent</strong>, or <strong>equations</strong> — or <em>menu</em>.</p>` },
      askAllowed: true,
      mode: 'lessons'
    })
  };

}
