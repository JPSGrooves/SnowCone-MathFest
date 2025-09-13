// /src/modes/mathTips/modes/lessons.js
import { composeReply } from '../conversationPolicy.js';
import { makeSession, readAffirmative, helpCard } from './_kit.js';

const S = makeSession({ capMin: 3, capMax: 4 });

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
    `<p><strong>Tip tax discount:</strong> round smart. 10% easy; 15% = 10% + half again.</p>`,
    `<p><strong>Reverse percent:</strong> if 10 is 25% of n ➜ <code>n = 10 / 0.25 = 40</code>.</p>`
  ],
  equations: [
    `<p><strong>Slope-intercept:</strong> <code>y = mx + b</code>. m = slope, b = y-intercept.</p>`,
    `<p><strong>Point-slope:</strong> <code>y - y1 = m(x - x1)</code> to build lines fast from a point.</p>`,
    `<p><strong>Two points to slope:</strong> <code>m = (y2 - y1) / (x2 - x1)</code>.</p>`,
    `<p><strong>Standard form:</strong> <code>Ax + By = C</code>. You can convert between forms.</p>`
  ]
};

function pickTopic(t) {
  const k = String(t || '').toLowerCase();
  if (/percent/.test(k)) return 'percent';
  if (/equation|mx\s*\+\s*b/.test(k)) return 'equations';
  return 'fractions';
}

export function start({ topic } = {}) {
  S.reset();
  const key = pickTopic(topic);
  const first = LESSONS[key][0];
  return composeReply({ part: { kind:'answer', html: first }, askAllowed: true, mode:'lessons' });
}

export function handle(text = '') {
  // help?
  if (/^help\b/i.test(text)) {
    const card = helpCard(
      'Lessons Help',
      [
        'say: fractions · percent · equations',
        'examples: "simplify 12/18", "25% of 40", "y = mx + b"',
        'type "menu" to see lesson menu again'
      ],
      'tip: say "exit" to leave lessons.'
    );
    return { html: composeReply({ part: { kind:'answer', html: card }, askAllowed: false, mode:'lessons' }) };
  }

  // read intent: want another?
  const yn = readAffirmative(text);
  if (yn === 'no') {
    return {
      html: composeReply({
        part: { html: `<p>cool breeze. stay or switch — lessons, quiz, lore, recipes, calculator.</p>` },
        askAllowed: false
      })
    };
  }

  // pick topic from the user’s text for the next drop
  const key = pickTopic(text);
  if (S.shouldBlock(text)) {
    return { html: composeReply({ part: { html: `<p>one at a time, friend.</p>` }, askAllowed: false }) };
  }

  S.bump();
  const idx = S.count() % LESSONS[key].length;
  const chunk = LESSONS[key][idx];

  if (S.isCapReached()) {
    return { html: composeReply({ part: { kind:'answer', html: `${chunk}<p>that’s most...` }, askAllowed: false, mode:'lessons' }) };
  }

  return { html: composeReply({ part: { kind:'answer', html: chunk }, askAllowed: true, mode:'lessons' }) };
}
