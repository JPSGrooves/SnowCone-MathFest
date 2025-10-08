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
      `<p>Before SnowCone MathFest, the valley was just orchards, lines,and fog. During a storm, a traveling teacher rigged a tarp
      between two trucks and started drawing triangles to find where to dig a drainage ditch. Kids came with lanterns.
      Farmers brought a market. The ditch worked; the triangle stayed. People have come back ever since, with questions and pie.</p>`,
      `<p>They quickly learned the first SnowCone law: <em>Problems are invitations.</em> Never insults, no verdicts — invitations.
      If a diagram looked wrong, someone would bake it into a cookie graph and spin it under a string. If a proof felt mean,
      they’d translate it into brownie pieces and see where the tone softened.</p>`,
      `<p>When winter came, they built a shed and hung up every broken tool with a note about what it taught them.
      “This rule snapped when I pushed too hard on a weird edge case,” one card reads. The shed is still there,
      a museum of productive mistakes. Field trips end there, with pockets full of questions.</p>`,
      `<p>To this day, visitors swear the valley smells faintly of warm sugar and pencil shavings. “That’s not magic,”
      say the elders. “That’s what curiosity smells like when you keep it fed.”</p>`
    ]
  },
  festival: {
    title: 'Festival Nights',
    slides: [
      `<p>At dusk the QuickServe Pavilion lights up the night like it always has. The path there glows like a number line,
      brighter where folks linger. Cosmic Phil swaps conjectures; the audience trades factoring tricks like recipes.</p>`,
      `<p>Down by the lake, there’s a quiet bell for “infinite” moments. You only hear it if you’re thinking softly. The Infinity Triplets claim
      the bell rings itself; nobody argues with them as they sling the beats until sunrise.</p>`,
      `<p>Camping is simple: everyone writes little thank you notes on leaves and feeds them to the closest Dino Divider.
      They speak to us, and the leaves crunch towards the direction of the stars.</p>`
    ]
  },
  sages: {
    title: 'Snowcone Sages',
    slides: [
      `<p><strong>Neon</strong> speaks in gradients: starting where it’s bright, moving where it’s dim. He explains that an equation should taste
      like a snowcone — sweet enough to keep you going, yet sharp enough to wake you up.</p>`,
      `<p><strong>Granita</strong> is patient. She’ll let silence do the math for a full minute before she nods. “Listen to the
      diagram. It breathes,” she says, handing you a spoon with an eraser.</p>`,
      `<p><strong>Crush</strong> looks chaotic, but the scribbles are choreographed. He can erase a whole board with one swipe
      and still leave the idea standing; remaining like an afterimage of the sun in your eyes.</p>`
    ]
  },
  badges: {
    title: 'Badges',
    slides: [
      `<p><strong>Bridge Builder.</strong> When you visit in real life, this one doesn’t come as a pin. It happens on the footbridge by Ininfity Lake. Two folks stop midway, stuck on an idea. You show them a way to meet in their inner-most quarks, share steps, and breathe. </p>`,
      `<p><strong>Fraction Smith.</strong> Night tent, coals glowing. Somebody’s trying to split a pizza for too many denominations. You sketch clean pieces on the box, swap 3/6 for 1/2 so nobody fights, and let them hold the slicer. The coals flare—little orange math. </p>`,
      `<p><strong>Quiet Torch.</strong> You won’t hold this one. It appears on the table near you the first time you lean back, lower your voice, and make room for somebody else’s spark. The lantern beside us brightens a notch; I hear the soft bell the triplets like to ring for call to infinity.</p>`
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
      <li><strong>festival</strong> — nights, lights, dinosaur glow</li>
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
      ['say: festival · sages · badges · origins','controls: next · more · again · menu'],
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
      // start fresh thread and count the first slide now so the next "yes" advances
      Gate = { ...Gate, topicKey: maybe, index: 0, started: true, waiting: false };
      S.reset?.();
      S.bump?.(); // count slide 1 now
      return {
        html: composeReply({
          part: { html: slideHtml(Gate.topicKey, Gate.index) },
          askAllowed: true, askText: 'want another?', noAck: true, mode: 'lore'
        })
      };
    }
  }

  if (/^again\b/i.test(msg)) {
    if (!Gate.topicKey) return { html: composeReply({ part:{ html: menuCard() }, askAllowed:false, noAck:true, mode:'lore' }) };
    Gate.waiting = false;
    return {
      html: composeReply({
        part: { html: slideHtml(Gate.topicKey, Gate.index) },
        askAllowed: true, askText: 'one more?', noAck: true, mode: 'lore'
      })
    };
  }

  if (/\b(exit|quit|leave|stop|pause|enough)\b/i.test(msg)) {
    S.reset?.();
    Gate = { topicKey: null, index: 0, started: false, waiting: true };
    return { html: composeReply({ part:{ html: endToMenuHtml() }, askAllowed:false, noAck:true, mode:'lore' }), end: true };
  }

  const isNextish = /^(next|more|another|one\s*more|ok(?:ay)?)\b/i.test(msg) || readAffirmative(msg) === 'yes';
  if (isNextish) {
    if (!Gate.started) {
      Gate.started = true;
      Gate.waiting = false;
      S.bump();
      return {
        html: composeReply({
          part: { html: slideHtml(Gate.topicKey, Gate.index) },
          askAllowed: true, askText: 'want another?', noAck: true, mode: 'lore'
        })
      };
    }
    const slides = LORE[Gate.topicKey].slides, last = slides.length - 1;

    if (S.isCapReached() || Gate.index >= last) {
    return {
      html: composeReply({
        part: { kind: 'answer', html: endToMenuHtml() },
        askAllowed: false, noAck: true, mode: 'lore'
      })
    };
    }

    Gate.index = Math.min(Gate.index + 1, last); S.bump();
      Gate.waiting = false;
      return {
        html: composeReply({
          part: { html: slideHtml(Gate.topicKey, Gate.index) },
          askAllowed: true, askText: 'want another?', noAck: true, mode: 'lore'
        })
      };
  }

  if (Gate.waiting) {
    return { html: composeReply({ part:{ html:`<p>lore time — say <strong>next</strong>/<strong>more</strong>, <strong>again</strong>, or pick: <em>festival · sages · badges · origins</em>.</p>` }, askAllowed:false, noAck:true, mode:'lore' }) };
  }

  return { html: composeReply({ part:{ html:`<p>pick a thread: <strong>festival</strong>, <strong>sages</strong>, <strong>badges</strong>, or <strong>origins</strong> — or <em>menu</em>.</p>` }, askAllowed:true, mode:'lore' }) };
}
