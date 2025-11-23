// /src/modes/storyMode/chapters/ch2.js
import { SlideRole, ItemIds, ITEM_DISPLAY } from '../../../data/storySchema.js'; // 👈 add ITEM_DISPLAY
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
      text: `He tastes the SnowCone and his eyes glint like midnight brass. <span style="color: rgb(20, 161, 255);">"Sometimes, it's just the littlest bit of happiness that comes from a SnowCone."</span> He goes on, <span style="color: rgb(20, 161, 255);">"Set your clock by it, and let it inspire your next exciting move!"</span>`,
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
          text: `Next up is Emmy Noether, a pioneer of abstract algebra and physics—she linked symmetries to conserved quantities: when the world changes, something stays true.`,
        },
        lore: {
          img: PRO_IMG('coilCables.png'),
          text: `Stage lights sweep the field. <span style="color: rgb(20, 161, 255);">"Find what doesn’t change,”</span> she says.<br><br><span style="color: rgb(20, 161, 255);">"Count 1–2–3–4, and the 1 comes back again. Swap colors, add bulbs—the beat still loops back to 1. That never-changing part is your invariant. It’s the anchor."</span>`,
        },
        puzzle: {
            img: PRO_IMG('stageLightsCard.png'), // placeholder filename — swap to whatever you export
            prompt: `<span style="color: rgb(20, 161, 255);">On stage, the lights flash in a 2:3 pattern—2 blue, then 3 gold—repeating. If the crew runs that pattern 36 times during a song, how many flashes are blue and how many are gold?</span>`,
            reveal: `       <b>72 blue, 108 gold.</b><br>(That's 2/5 and 3/5 of 180)`,
        },
      },
    },
    {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Emmy Noether',
      img: PRO_BIG_IMG('noetherHappy.png'),
      text: `She smiles. <span style="color: rgb(20, 161, 255);">"Our anchor, the invariant, is preserved!”</span> She goes quiet to analyze the eventual repetition in the light show; you also notice the pattern now. <span style="color: rgb(20, 161, 255);">"Sometimes, stability isn't stillness. It's also okay to just get lost in the show!”</span>`,
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
          text: `Third to roll in, is Geometry’s old lion: Archimedes. Levers, circles, and a very famous bath. He knocks on the truck window like it’s a theorem.`,
        },
        lore: {
            img: PRO_IMG('lanternCircle.png'),
            text: `He pictures a huge gurgling barrel: one filled with pure water and piled with snowcones. He steps in; the SnowCones climb. <span style="color: rgb(20, 161, 255);">“Displacement tells the truth,”</span> he grins. <span style="color: rgb(20, 161, 255);">“The rise matches my volume, and the lift equals the weight I push aside: man or cone, it's the same law.”</span>`,
        },
        puzzle: {
            img: PRO_IMG('waterBarrel.png'),
            prompt: `At Infinity Lake, Archimedes lowers a giant snowcone into a calibrated test cove. He gives a riddle while he waits: Two cones of the same size, but one is heavier. <span style="color: rgb(20, 161, 255);">“Which sinks deeper?</span>`,
            reveal: `<b>The heavier one...</b> (Needs more buoyant force → displaces more water)`
        },

      },
    },
    {
        role: SlideRole.ADVANCE,
        mode: 'solo',
        title: 'Archimedes',
        img: PRO_IMG('archimedesHappy.png'),
        text: `He laughs. <span style="color: rgb(20, 161, 255);">“Balanced perfectly!”</span> The ripples settle into neat circles. <span style="color: rgb(20, 161, 255);">“Equal weight means equal lift...always.”</span> He looks at the cone and devours it like a solved equation. <span style="color: rgb(20, 161, 255);">“Bill me in buoyant units, please. And maybe don't take things too seriously...until you've tested the wieght of the problem in a bath."</span>`,
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
            text: `Then he flips open a tiny ledger: <span style="color: rgb(20, 161, 255);">“Left = to give, right = to desire. Debits greet credits,”</span> he winks, then sketches a crisp T and notes ‘Somma = Somma’ in the margin. <span style="color: rgb(20, 161, 255);">“What leaves the inventory enters the heart—when we serve we can find a home.”</span>`,
        },

// swap just this inside Pacioli.customer
        puzzle: {
        img: PRO_IMG('mixCard.png'),
        prompt: `<span style="color: rgb(20, 161, 255);">A 15-minute DJ set sells <b>12 cones</b> at <b>$5.50</b> each. How much money should you add to your Cone Coin wallet?</span>`,
        reveal: `<b>$66.</b> (12 cones × $5.50 each = $66 to drop into the wallet.)`,
        requireRevealToAdvance: true,
        },
      },
    },
    {
        role: SlideRole.ADVANCE,
        mode: 'solo',
        title: 'Luca Pacioli',
        img: PRO_IMG('pacioliHappy.png'),
        text: `He nods at your books as the syrup blends. <span style="color: rgb(20, 161, 255);">“Balanced.”</span> He sets a tiny glowing ledger in your palm, then lifts two snowcones, one in each hand, level as a scale. <span style="color: rgb(20, 161, 255);">“That's Jehnk's Ledger...you can learn a lot about a person by examining their books.”</span> He nods and strolls happily into the lights with twin cones held high.`,
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
      text: `Jehnk whistles. <span style="color: rgb(247, 255, 105);">“That's four legends and four cones. Clean serves and clean math seems to be the name of your game! Keep this up and I might let you run the truck forever!”</span>`,
      soloLabel: 'Chapter 3 ➡️',
      nextChapterId: 'ch3',
    },
  ],
};
