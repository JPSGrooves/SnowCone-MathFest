// /src/modes/storyMode/chapters/ch2.js
import { SlideRole, ItemIds, ITEM_DISPLAY } from '../../../data/storySchema.js'; // 👈 add ITEM_DISPLAY
import { awardBadge } from '../../../managers/badgeManager.js';

const BASE = import.meta.env.BASE_URL;
const PRO_IMG     = (n) => `${BASE}assets/img/characters/storyMode/${n}`;
const PRO_BIG_IMG = (n) => `${BASE}assets/img/characters/storyMode/${n}?lg=1`;   // 👈 new
const SCN_IMG     = (n) => `${BASE}assets/img/modes/storymodeForest/${n}`;
const SCN_BIG_IMG = (n) => `${BASE}assets/img/modes/storymodeForest/${n}?lg=1`; // 👈 new

const payloadFor = (id) => {
  const d = ITEM_DISPLAY[id] || {};
  return { name: typeof d.name === 'string' ? d.name : String(id), meta: { emoji: d.emoji || '' } };
};

export const Chapter2 = {
  id: 'ch2',
  title: 'Shift: Four Customers',
  slides: [
    // Intro
    {
    role: SlideRole.ADVANCE,
    mode: 'solo',
    title: 'The First Shift',
    img: PRO_IMG('insideTruck.png'),
    text: `Now that you've made <span style="color: rgb(247, 255, 105);">The Perfect SnowCone</span>, Jehnk disappears and lets you run the truck for a shift.<br><br>
    Four figures line up near the truck: one polishing a wooden timepiece, one tracing quiet symmetries in the air, another rolling a circle charm across his knuckles, and the last one reading a tiny, glowing ledger; each looking for a different flavor 🍧.`,
    soloLabel: 'Open the Window ➡️',
    },

    // ───────────────────────────────────
    // 1) Benjamin Banneker — item on happy slide
    // ───────────────────────────────────
    {
      role: SlideRole.CUSTOMER,
      title: 'Benjamin Banneker',
      customer: {
        name: 'Benjamin Banneker',
        bio: {
          img: PRO_BIG_IMG('banneker.png'),
          text: `First up, Banneker sets a wooden timepiece on the counter. Self-taught astronomer, almanac author, and surveyor. <span style='color: rgb(20, 161, 255);'>\“Evening,\"</span> he says. <span style='color: rgb(20, 161, 255);'>\“Clock has you right on time.\"</span>`,
        },
        lore: {
            img: PRO_IMG('treeline.png'),
            text: `Out past the lights, Banneker hums at the treeline. <span style="color: rgb(20, 161, 255);">"The music pulses,"</span> he says. <span style="color: rgb(20, 161, 255);">"always on time."</span><br><br>He taps his wooden clock and the second hand ticks like a far-off hi-hat. <span style="color: rgb(20, 161, 255);">"It must be the Infinity Triplets,"</span> he whispers. <span style="color: rgb(20, 161, 255);">"That means we'll be dancing past sunrise."</span>`,
        },
        puzzle: {
          img: PRO_IMG('scheduleCard.png'),
          prompt: `<span style="color: rgb(20, 161, 255);">While selling SnowCones during a 42 minute Cosmic Phil set, you make 5 cones every 3 minutes...<br><br>How many cones will you serve during the set??</span>`,
          reveal: `<b>70 cones!</b> 42 ÷ 3 = 14 chunks; 14 × 5 = 70.`,
        },
      },
    },
    {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Benjamin Banneker',
      img: PRO_BIG_IMG('bannekerHappy.png'),
      text: `He tastes the SnowCone and his eyes light up like midnight brass. <span style="color: rgb(20, 161, 255);">"Sometimes, we just need that littlest bit of happiness that comes from a SnowCone."</span> He goes on, <span style="color: rgb(20, 161, 255);">"Set your clock by what helps you grow, and let it inspire your next exciting move!"</span>`,
      soloLabel: 'Next Customer ➡️',
      grants: [{ item: ItemIds.BANNEKER_TOKEN, payload: payloadFor(ItemIds.BANNEKER_TOKEN) }],
    },

    // ───────────────────────────────────
    // 2) Emmy Noether — item on happy slide
    // ───────────────────────────────────
    {
      role: SlideRole.CUSTOMER,
      title: 'Emmy Noether',
      customer: {
        name: 'Emmy Noether',
        bio: {
          img: PRO_BIG_IMG('noether.png'),
          text: `Next up is Emmy Noether, a pioneer of abstract algebra and physics—she linked symmetries to conserved quantities: <span style="color: rgb(20, 161, 255);">"When the world changes, something stays true.</span>`,
        },
        lore: {
          img: PRO_IMG('coilCables.png'),
          text: `Stage lights sweep across the crowd. <span style="color: rgb(20, 161, 255);">"I'm looking for what doesn’t change,”</span> she says.<br><br><span style="color: rgb(20, 161, 255);">"I count 1–2–3–4, and the 1 always comes back again. The bulbs and colors always follow the beat back to 1. That never-changing part is the invariant. It’s the anchor."</span>`,
        },
        puzzle: {
            img: PRO_IMG('stageLightsCard.png'), // placeholder filename — swap to whatever you export
            prompt: `<span style="color: rgb(20, 161, 255);">"On stage, the lights flash in a 2:3 pattern—2 blue, then 3 gold—repeating. If the crew runs that pattern 36 times during a song, how many flashes are blue and how many are gold?"</span>`,
            reveal: `       <b>72 blue, 108 gold.</b><br>(That's 2/5 and 3/5 of 180)`,
        },
      },
    },
    {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Emmy Noether',
      img: PRO_BIG_IMG('noetherHappy.png'),
      text: `She smiles. <span style="color: rgb(20, 161, 255);">"The anchor, our invariant, is found!”</span> She goes quiet to analyze the eventual repetition in the light show; you also notice the pattern. <span style="color: rgb(20, 161, 255);">"Remember the anchor; know that stability isn't stillness. Then it'll be okay to lose yourself in the lights!”</span>`,
      soloLabel: 'Next Customer ➡️',
      // NOETHER happy slide
      grants: [{ item: ItemIds.NOETHER_TOKEN, payload: payloadFor(ItemIds.NOETHER_TOKEN) }],
    },

    // ───────────────────────────────────
    // 3) Archimedes — item on happy slide
    // ───────────────────────────────────
    {
      role: SlideRole.CUSTOMER,
      title: 'Archimedes',
      customer: {
        name: 'Archimedes',
        bio: {
          img: PRO_BIG_IMG('archimedes.png'),
          text: `Third to roll in, is Geometry’s old lion: Archimedes. Levers, circles, and a very famous bath, his legend precedes him as he steps up to the truck.`,
        },
        lore: {
            img: PRO_IMG('lanternCircle.png'),
            text: `He tells the story a huge barrel of his: one he filled with pure water and then piled with snowcones. <span style="color: rgb(20, 161, 255);">“As I stepped in; the SnowCones rose with me. Displacement tells the truth,”</span> he grins. <span style="color: rgb(20, 161, 255);">“The rise matched my volume, and the lift equaled the weight I push aside: man or cone, it's the same law.”</span>`,
        },
        puzzle: {
            img: PRO_IMG('waterBarrel.png'),
            prompt: `At Infinity Lake, Archimedes lowers a giant snowcone into a calibrated test cove. He gives a riddle while he waits: <span style="color: rgb(20, 161, 255);">“Two cones of the same size, but one is heavier. Which sinks deeper?</span>`,
            reveal: `<span style="color: rgb(20, 161, 255);">“<b>The heavier one...</b> It needs more buoyant force → displaces more water)</span>`
        },

      },
    },
    {
        role: SlideRole.ADVANCE,
        mode: 'solo',
        title: 'Archimedes',
        img: PRO_IMG('archimedesHappy.png'),
        text: `He laughs. <span style="color: rgb(20, 161, 255);">“We balanced it perfectly!”</span> Even tiny cones, when they are tossed in the lake, create large ripples. <span style="color: rgb(20, 161, 255);">“Equal weight means equal ripples...unless,”</span> He looks at the cone, trying to solve it like an equation. <span style="color: rgb(20, 161, 255);">“...unless you can't control the force. Don't stress on the uncontrollable forces of the universe; don't take them too seriously. This allows you to go BEYOND the math and use the part of your brain the taps into infinity."</span>`,
        soloLabel: 'Next Customer ➡️',
        // NOETHER happy slide
        // ARCHIMEDES happy slide
        grants: [{ item: ItemIds.ARCHIMEDES_TOKEN, payload: payloadFor(ItemIds.ARCHIMEDES_TOKEN) }],

    },

    // ───────────────────────────────────
    // 4) Luca Pacioli — item on happy slide; Jehnk jumps in next
    // ───────────────────────────────────
    {
      role: SlideRole.CUSTOMER,
      title: 'Luca Pacioli',
      customer: {
        name: 'Luca Pacioli',
        bio: {
          img: PRO_BIG_IMG('pacioli.png'),
          text: `The fourth customer, Luca Pacioli, seems portentous at first...Renaissance popularizer of double-entry bookkeeping. He's looking for the honest balance.`,
        },
        lore: {
            img: PRO_IMG('ledgerGlow.png'),
            text: `Then he helpfully flips open a tiny ledger: <span style="color: rgb(20, 161, 255);">“Left Side = to give, Right Side = to desire. A transaction involves a debit and credit,”</span> he winks, then sketches a crisp T and notes ‘Somma = Somma’ in the margin. <span style="color: rgb(20, 161, 255);">“The debits must equal the credits: we must give what we desire.”</span>`,
        },

// swap just this inside Pacioli.customer
        puzzle: {
        img: PRO_IMG('mixCard.png'),
        prompt: `<span style="color: rgb(20, 161, 255);">During a 15-minute DJ set you're giving out <b>12 cones</b> for <b>FREE</b>. How many people do you want to have them?</span>`,
        reveal: `<span style="color: rgb(20, 161, 255);"><b>12!</b> (12 free cones = 12 positive reviews!)</span>`,
        requireRevealToAdvance: true,
        },
      },
    },
    {
        role: SlideRole.ADVANCE,
        mode: 'solo',
        title: 'Luca Pacioli',
        img: PRO_IMG('pacioliHappy.png'),
        text: `He checks the book one last time, as you blend syrup into the icy SnowCone. <span style="color: rgb(20, 161, 255);">“Balanced.”</span> Setting the tiny glowing ledger in your palm, he grabs the two snowcones, holding them level as a scale in each hand. <span style="color: rgb(20, 161, 255);">“That's Jehnk's Ledger...you can learn a lot about a person by examining their books.”</span> He winks and strolls happily into the mist with the twin cones held high.`,
        soloLabel: 'Jehnk Jumps In ➡️',
        // PACIOLI happy slide
        grants: [{ item: ItemIds.PACIOLI_TOKEN, payload: payloadFor(ItemIds.PACIOLI_TOKEN) }],
    },

    // Wrap — Jehnk pep talk → Chapter 3
    {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Shift Complete',
      img: PRO_BIG_IMG('jehnkNod.png'),
      text: `Jehnk whistles. <span style="color: rgb(247, 255, 105);">“That's four legends and four cones served. Clean math is clearly what your all about!<br><br>Keep it up and I might let you run the truck forever!”</span>`,
      soloLabel: 'Chapter 3 ➡️',
      nextChapterId: 'ch3',
    },
  ],
    onFinish: ({ appState }) => {
    try {
      awardBadge('story_ch2');
      appState.saveToStorage?.();
    } catch (e) {
      console.warn('[ch2] onFinish failed', e);
    }
  },

};
