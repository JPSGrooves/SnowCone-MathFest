// /src/modes/mathTips/modes/recipes.js
import { composeReply } from '../conversationPolicy.js';
import { makeSession, readAffirmative, helpCard } from './_kit.js';

const S = makeSession({ capMin: 3, capMax: 4 });

const TIPS = [
  `<p>quesadilla wisdom: low heat, patience, flip once, rest 60s. math fuel.</p>`,
  `<p>mango snowcone: fine shave, mango puree + tiny lime + pinch of salt. stir, vibe.</p>`,
  `<p>nacho night: layer chips in <em>thin</em> strata so every chip sees cheese.</p>`,
  `<p>festival cocoa: 2:1 dark to milk, whisk with a dash of cinnamon and a secret smile.</p>`
];

export function start() {
  S.reset();
  return composeReply({ part: { html: TIPS[0] }, askAllowed: true });
}

export function handle(text='') {
  if (/^help\b/i.test(text)) {
    const card = helpCard(
      'Recipes Help',
      [
        'say: "quesadilla wisdom", "mango snowcone", "nacho night"',
        'ask for "more" for another tip',
        'say "exit" to leave recipes'
      ],
      'tip: these are for vibes and break time between problems.'
    );
    return { html: composeReply({ part: { html: card }, askAllowed: false }) };
  }

  const yn = readAffirmative(text);
  if (yn === 'no') {
    return { html: composeReply({ part: { html: `<p>gotcha. want another booth?</p>` }, askAllowed: false }) };
  }

  if (S.shouldBlock(text)) {
    return { html: composeReply({ part: { html: `<p>one snack at a time, legend.</p>` }, askAllowed: false }) };
  }
  S.bump();

  const idx = S.count() % TIPS.length;
  const html = TIPS[idx];

  if (S.isCapReached()) {
    return { html: composeReply({ part: { html: `${html}<p>kitchen’s closed for now. try another booth?</p>` }, askAllowed: false }) };
  }

  return { html: composeReply({ part: { html }, askAllowed: true, askText: 'want another kitchen groove?' }) };
}
