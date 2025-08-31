// /src/modes/mathTips/packs/help.pack.js
import { registerIntent, M } from '../intentEngine.js';
import { composeReply } from '../conversationPolicy.js';

const answer = (html)=>({ kind:'answer', html });
const teach  = (topicGuess)=>({ kind:'teach', html:'', topicGuess });

registerIntent({
  key: 'how_to_use',
  tests: [ M.include(['how do i use you','what can you do','help me','help','commands']) ],
  base: 0.7,
  handler: ({ text }) => composeReply({
    userText: text,
    part: answer(
      `Keep it tiny: try <code>15% of 80</code> or <code>simplify 12/18</code>. ` +
      `Ask stats like “how am I doing?”. Say “motivate me” for a pep line.`
    )
  })
});

registerIntent({
  key: 'study_plan',
  tests: [ M.include(['what should i study','study plan','what to study']) ],
  base: 0.65,
  handler: ({ text }) => composeReply({
    userText: text,
    part: answer(`Pick one lane: <strong>fractions</strong>, <strong>%</strong>, or <strong>linear</strong>. Say “fractions 3” for 3 quick reps.`)
  })
});

registerIntent({
  key: 'teach_unknown',
  tests: [ M.fuse(['i don’t get it','confused','stuck','idk','what do i do']) ],
  base: 0.55,
  handler: ({ text }) => composeReply({ userText: text, part: teach('arithmetic') })
});
