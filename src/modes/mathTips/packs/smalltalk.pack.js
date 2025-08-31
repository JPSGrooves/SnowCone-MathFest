// /src/modes/mathTips/packs/smalltalk.pack.js
import { registerIntent, M } from '../intentEngine.js';
import data from '../qabotDATA.js';
import { composeReply } from '../conversationPolicy.js';

const pick = (a)=>a[Math.floor(Math.random()*a.length)];
const esc  = (s)=>String(s)
  .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
  .replaceAll('"','&quot;').replaceAll("'",'&#39;');
const answer = (html)=>({ kind:'answer', html });

registerIntent({
  key: 'greet',
  tests: [ M.include(['hello','hi','hey','yo','sup','what’s up','howdy','hola']) ],
  base: 0.5,
  handler: ({ text }) => composeReply({ userText: text, part: answer(esc(pick(data.greetings))) })
});

registerIntent({
  key: 'who',
  tests: [ M.include(['who are you','what are you','your name','who r u']) ],
  base: 0.6,
  handler: ({ text }) => composeReply({ userText: text, part: answer(esc(pick(data.who_are_you))) })
});

registerIntent({
  key: 'mood',
  tests: [ M.include(['how are you','vibe check','how’s it going','you good','how you feel']) ],
  base: 0.6,
  handler: ({ text }) => composeReply({ userText: text, part: answer(esc(pick(data.how_are_you))) })
});

registerIntent({
  key: 'joke',
  tests: [ M.include(['joke','funny','laugh']) ],
  base: 0.55,
  handler: ({ text }) => composeReply({ userText: text, part: answer(esc(pick(data.jokes))) })
});

registerIntent({
  key: 'farewell',
  tests: [ M.include(['bye','goodbye','later','see ya','ciao','adios']) ],
  base: 0.55,
  handler: ({ text }) => composeReply({ userText: text, part: answer('Catch you on the flip side, traveler.') })
});
