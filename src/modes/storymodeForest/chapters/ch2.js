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
    text: `Now that you've got the basics, Jehnk disapears and lets you run the truck for a shift.<br><br>
    Four figures hover near the truck: one polishing a wooden timepiece, one tracing quiet symmetries in the air, one rolling a circle charm across his knuckles, and one thumbing a tiny, glowing ledger; each carrying a different kind of math.`,
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
          text: `First up, Banneker sets a wooden timepiece on the counter. Self-taught astronomer, almanac author, and surveyor. “Evening,” he says. “Clock has you right on time.”`,
        },
        lore: {
          img: PRO_IMG('treeline.png'),
          text: 'Out past the lights, Banneker hums at the treeline. “Rhythm is ratio,” he says. “Beats are proportions of time.”<br><br> He taps the wooden timepiece and the second hand ticks like a far-off hi-hat. “Keep track of the stars,” he whispers, “and their beat will keep you informed."',
        },
        puzzle: {
          img: PRO_IMG('scheduleCard.png'),
          prompt: `While vending during a 42 minute Cosmic Phil set, you make 5 cones every 3 minutes...<br><br>How many cones will you serve during the set?`,
          reveal: `<b>70 cones!</b> 42 ÷ 3 = 14 chunks; 14 × 5 = 70.`,
        },
      },
    },
    {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Benjamin Banneker',
      img: PRO_BIG_IMG('bannekerHappy.png'),
      text: `He tastes the SnowCone, eyes glinting like midnight brass. "Set your watch by the heavens; set your word by your watch." He goes on, "If the count feels crooked, look up, breathe, and start the next minute fresh."`,
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
          text: `Next up, a pioneer of abstract algebra and physics—she linked symmetries to conserved quantities: when the world transforms, something stays true.`,
        },
        lore: {
          img: PRO_IMG('coilCables.png'),
          text: `Stage lights sweep the field. “Find what doesn’t change,” she says.<br><br>"Count 1–2–3–4, and the 1 comes back again. Swap colors, add bulbs—the beat still loops. That never-changing part is your invariant. It’s your anchor."`,
        },
        puzzle: {
            img: PRO_IMG('stageLightsCard.png'), // placeholder filename — swap to whatever you export
            prompt: `On stage, the lights flash in a 2:3 pattern—2 blue, then 3 gold—repeating. If the crew runs that pattern 36 times during a song, how many flashes are blue and how many are gold?`,
            reveal: `       <b>72 blue, 108 gold.</b><br>(That's 2/5 and 3/5 of 180)`,
        },
      },
    },
    {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Emmy Noether',
      img: PRO_BIG_IMG('noetherHappy.png'),
      text: `She smiles. “Invariant preserved.” She goes quiet for a few beats. The stage lights sweep and swap, but you notice the pattern now. “Sometimes, stability isn't stillness, and it's okay to get lost in the dance!”`,
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
          text: `Third to roll in, is Geometry’s old lion: levers, circles, and one famous bath. He taps at the truck window like it’s a theorem.`,
        },
        lore: {
            img: PRO_IMG('lanternCircle.png'),
            text: `He pictures a huge gurgling barrel: one filled with pure water and piled with snowcones. He steps in; the SnowCones climb. “Displacement tells the truth,” he grins. “The rise matches my volume, and the lift equals the weight I push aside: man or cone, it's the same law.”`,
        },
        puzzle: {
            img: PRO_IMG('waterBarrel.png'),
            prompt: `At Infinity Lake, Archimedes lowers a giant snowcone into a calibrated test cove. He gives a riddle while he waits: Two cones of the same size, but one is heavier. Which sinks deeper?`,
            reveal: `<b>The heavier one.</b> (Needs more buoyant force → displaces more water)`
        },

      },
    },
    {
        role: SlideRole.ADVANCE,
        mode: 'solo',
        title: 'Archimedes',
        img: PRO_BIG_IMG('archimedesHappy.png'),
        text: `He laughs. “Balanced perfectly!” The ripples settle into neat circles. “Equal weight, equal lift—always.” He taps the cone and pockets it like a solved problem. “Bill me in buoyant units, and don't take things too seriously until you've taken a bath.`,
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
          text: `Fourth customer seems portentous at first...Renaissance popularizer of double-entry bookkeeping—two columns in honest balance.`,
        },
        lore: {
            img: PRO_IMG('ledgerGlow.png'),
            text: `Then he flips a tiny ledger: left = to give, right = to desire. “Debits greet credits,” he winks. He sketches a crisp T and notes ‘Somma = Somma’ in the margin. “What leaves inventory enters the heart—every gift has a reciever.”`,
        },

// swap just this inside Pacioli.customer
        puzzle: {
          img: PRO_IMG('mixCard.png'),
          prompt: `If I pay you <b>$5 cash</b> for 1 cone. In double-entry, what goes on each side so the totals match? (Use plain words.)`,
          reveal: `<b>Debit:</b> Cash $5 · <b>Credit:</b> Sales $5.<br>(Cash went up by $5; you recorded $5 of sales. Debits = Credits.)`,
          requireRevealToAdvance: true,
        },
      },
    },
    {
        role: SlideRole.ADVANCE,
        mode: 'solo',
        title: 'Luca Pacioli',
        img: PRO_IMG('pacioliHappy.png'),
        text: `He nods at your books and your blends. “Balanced.” He sets a tiny glowing ledger in your palm, then lifts two snowcones, one in each hand, level as a scale. The page hums, signs itself, and closes warm against your pocket. “Every gift has a reciever,” he winks, strolling into the lights with twin cones held high.`,
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
      text: `Jehnk whistles. “Four legends, four cones—clean serves, clean math. Keep this up and I might let you run the truck forever!”`,
      soloLabel: 'Chapter 3 ➡️',
      nextChapterId: 'ch3',
    },
  ],
};
