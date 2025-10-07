// /src/modes/mathTips/modes/lore.js
import { composeReply } from '../conversationPolicy.js';
import { makeSession, readAffirmative, helpCard } from './_kit.js';

const S = makeSession({ capMin: 3, capMax: 4 });
let Gate = { topicKey: null, index: 0, started: false, waiting: true };

/* content */
const LORE = {
  origins: {
    title: 'Origins',
    slides: [
      `<p>Before MathFest, the valley was just orchards and fog. During a storm, a traveling teacher rigged a tarp
      between two trucks and started drawing triangles to find where to dig a drainage ditch. Kids came with lanterns.
      Farmers brought thermoses. The ditch worked; the drawings stayed. People came back the next night with questions and pie.</p>`,
      `<p>They learned the first village law: <em>Problems are invitations.</em> Not insults, not verdicts — invitations.
      If a diagram looked wrong, someone would bake it into a pie-tin graph and spin it under a string. If a proof felt mean,
      they’d translate it into cookie steps and see where the tone softened.</p>`,
      `<p>When winter came, they built a shed and hung up every broken tool with a note about what it taught them.
      “This rule snapped when I pulled too hard on a weird edge case,” one card reads. The shed is still there,
      a museum of productive mistakes. Field trips end there, pockets full of questions.</p>`,
      `<p>Years later, visitors swear the valley smells faintly of warm sugar and pencil shavings. “That’s not magic,”
      say the elders. “That’s what curiosity smells like when you keep it fed.”</p>`
    ]
  },
  festival: {
    title: 'Festival Nights',
    slides: [
      `<p>At dusk the spiral pavilion lights one lantern per solved riddle. The path glows like a number line,
      brighter where folks linger. Kids swap conjectures; aunties trade factoring tricks like recipes.</p>`,
      `<p>There’s a quiet bell for “aha” moments. You only hear it if you’re thinking softly. The pavilion claims
      the bell rings itself; nobody argues with a pavilion that tells nice stories.</p>`,
      `<p>Closing glow is simple: everyone writes one thing they still wonder on a paper leaf and clips it to the wind wall.
      The leaves rustle questions at the stars.</p>`
    ]
  },
  sages: {
    title: 'Snowcone Sages',
    slides: [
      `<p><strong>Neon</strong> speaks in gradients: start where it’s bright, move where it’s dim. Says a proof should taste
      like a snowcone — sweet enough to keep you going, sharp enough to wake you up.</p>`,
      `<p><strong>Granita</strong> is patient. She’ll let silence do math for a full minute before she nods. “Listen to the
      diagram. It breathes,” she says, handing you a spoon.</p>`,
      `<p><strong>Crush</strong> looks chaotic, but the scribbles are choreographed. He can erase a whole board with one sleeve
      and still leave the idea standing, waving like a friend at a station.</p>`
    ]
  },
  badges: {
    title: 'Badges',
    slides: [
      `<p><strong>Bridge Builder</strong> is for stitching two ideas into one walkway. People pin it on with string they dyed
      in tea. It looks better after storms.</p>`,
      `<p><strong>Fraction Smith</strong> shines faintly in the dark, like coals. You earn it by showing someone how a messy
      ratio becomes a clean one — then letting them hold the tongs.</p>`,
      `<p><strong>Quiet Torch</strong> isn’t worn. It’s placed on the table near you when the room realizes you’ve been
      lighting it the whole time.</p>`
    ]
  }
};

function pickTopic(t = '') {
  const k = String(t).toLowerCase();
  if (/origin|tarp|ditch|shed/.test(k)) return 'origins';
  if (/festival|night|pavilion|closing/.test(k)) return 'festival';
  if (/sage|neon|granita|crush/.test(k)) return 'sages';
  if (/badge|bridge|smith|torch/.test(k)) return 'badges';
  return Gate.topicKey || 'origins';
}

function menuCard() {
  return `
    <p><strong>Lore Menu</strong></p>
    <ul class="mt-menu">
      <li><strong>festival</strong> — nights, spiral pavilion, closing glow</li>
      <li><strong>sages</strong> — Neon · Granita · Crush</li>
      <li><strong>badges</strong> — bridge builder · fraction smith · quiet torch</li>
      <li><strong>origins</strong> — the tarp · the ditch · the shed</li>
    </ul>
    <p class="mt-dim">say a topic (“festival”, “sages”, “badges”, “origins”) or say <em>next</em>/<em>more</em> to begin.</p>
  `;
}
const slideHtml = (k,i)=>{const r=LORE[k]||LORE.origins;const j=Math.max(0,Math.min(i,r.slides.length-1));return `<p><strong>${r.title}</strong> — ${j+1} of ${r.slides.length}</p>${r.slides[j]}`;};
const endToMenuHtml = () => `<p>stories topped off — wanna pick another lore thread?</p>${menuCard()}`;

export function start({ topic } = {}) {
  S.reset();
  Gate = { topicKey: pickTopic(topic), index: 0, started: false, waiting: true };
  return composeReply({ part: { kind:'answer', html: menuCard() }, askAllowed:false, noAck:true, mode:'lore' });
}

export function handle(text = '') {
  const msg = String(text || '').trim();
  if (/^start\b/i.test(msg)) return start({ topic: Gate.topicKey });

  if (/^help\b/i.test(msg)) {
    const card = helpCard(
      'Lore Help',
      ['say: festival · sages · badges · origins','controls: next · more · again · menu','tip: short paragraphs — not flashcards'],
      'say "exit" to leave lore.'
    );
    return { html: composeReply({ part:{ html: card }, askAllowed:false, noAck:true, mode:'lore' }) };
  }

  if (/^menu\b/i.test(msg)) {
    Gate.waiting = true;
    return { html: composeReply({ part:{ html: menuCard() }, askAllowed:false, noAck:true, mode:'lore' }) };
  }

  // topic
  {
    const maybe = pickTopic(msg);
    if (maybe && maybe !== Gate.topicKey) {
      Gate = { ...Gate, topicKey: maybe, index: 0, started: false, waiting: true };
      S.reset?.();
      return { html: composeReply({ part:{ html: slideHtml(Gate.topicKey, Gate.index) }, askAllowed:true, askText:'want another?', noAck:true, mode:'lore' }) };
    }
  }

  if (/^again\b/i.test(msg)) {
    if (!Gate.topicKey) return { html: composeReply({ part:{ html: menuCard() }, askAllowed:false, noAck:true, mode:'lore' }) };
    return { html: composeReply({ part:{ html: slideHtml(Gate.topicKey, Gate.index) }, askAllowed:true, askText:'one more?', noAck:true, mode:'lore' }) };
  }

  if (/\b(exit|quit|leave|stop|pause|enough)\b/i.test(msg)) {
    S.reset?.();
    Gate = { topicKey: null, index: 0, started: false, waiting: true };
    return { html: composeReply({ part:{ html: endToMenuHtml() }, askAllowed:false, noAck:true, mode:'lore' }), end: true };
  }

  const isNextish = /^(next|more|another|one\s*more|ok(?:ay)?)\b/i.test(msg) || readAffirmative(msg) === 'yes';
  if (isNextish) {
    if (!Gate.started) { Gate.started = true; S.bump(); return { html: composeReply({ part:{ html: slideHtml(Gate.topicKey, Gate.index) }, askAllowed:true, askText:'want another?', noAck:true, mode:'lore' }) }; }
    const slides = LORE[Gate.topicKey].slides, last = slides.length - 1;

    if (S.isCapReached() || Gate.index >= last) {
      return { html: composeReply({ part:{ kind:'answer', html: endToMenuHtml() }, askAllowed:true, mode:'lore' }) };
    }

    Gate.index = Math.min(Gate.index + 1, last); S.bump();
    return { html: composeReply({ part:{ html: slideHtml(Gate.topicKey, Gate.index) }, askAllowed:true, askText:'want another?', noAck:true, mode:'lore' }) };
  }

  if (Gate.waiting) {
    return { html: composeReply({ part:{ html:`<p>lore time — say <strong>next</strong>/<strong>more</strong>, <strong>again</strong>, or pick: <em>festival · sages · badges · origins</em>.</p>` }, askAllowed:false, noAck:true, mode:'lore' }) };
  }

  return { html: composeReply({ part:{ html:`<p>pick a thread: <strong>festival</strong>, <strong>sages</strong>, <strong>badges</strong>, or <strong>origins</strong> — or <em>menu</em>.</p>` }, askAllowed:true, mode:'lore' }) };
}
