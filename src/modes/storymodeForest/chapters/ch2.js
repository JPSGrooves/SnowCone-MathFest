// /src/modes/storyMode/chapters/ch2.js
import { SlideRole, ItemIds } from '../../../data/storySchema.js';
const BASE = import.meta.env.BASE_URL;
const PRO_IMG     = (n) => `${BASE}assets/img/characters/storyMode/${n}`;
const PRO_BIG_IMG = (n) => `${BASE}assets/img/characters/storyMode/${n}?lg=1`;   // 👈 new
const SCN_IMG     = (n) => `${BASE}assets/img/modes/storymodeForest/${n}`;
const SCN_BIG_IMG = (n) => `${BASE}assets/img/modes/storymodeForest/${n}?lg=1`; // 👈 new


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
    text: `Now that you've got the basics, Jehnk dissapears and lets you run the truck for a shift.<br><br>
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
          text: `First in line, Banneker sets a wooden timepiece on the counter. Self-taught astronomer, almanac author, and surveyor—he reads the cones like a ledger.`,
        },
        lore: {
          img: PRO_IMG('treeline.png'),
          text: 'Out past the lights, Banneker hums at the treeline. “Rhythm is ratio,” he says. “Cones are minutes; minutes are song.”<br><br> He taps the wooden timepiece and the second hand ticks like a far-off hi-hat. “Keep count,” he whispers, “and the night will keep you.” The crickets answer in syncopation, a ledger of stars marking every measure.',
        },
        puzzle: {
          img: PRO_IMG('scheduleCard.png'),
          prompt: `The band plays one set that lasts 42 minutes. You make SnowCones at a steady speed: 5 cones every 3 minutes.<br><br>How many cones is that for the whole set?`,
          reveal: `<b>70 cones!</b> 42 ÷ 3 = 14 chunks; 14 × 5 = 70.`,
        },
      },
    },
    {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Benjamin Banneker',
      img: PRO_BIG_IMG('bannekerHappy.png'),
      text: `He tastes the cone, eyes glinting like midnight brass. "Keep your time and the night will reward you." He goes on, "When the count feels crooked, look up, breathe, and start the next minute true."`,
      soloLabel: 'Next Customer ➡️',
      grants: [{ item: ItemIds.BANNEKER_TOKEN }],
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
          text: `Stage lights loop. "Find your invariant," she says. "The ratio that survives any total." The colors wheel—blue, gold, violet—but the pulse repeats. Four counts pass; the bright hit comes back on five. Add bulbs, swap their order, fade one low, push one high—the share of light to dark stays fixed. That's your anchor. When everything shifts, symmetry keeps time.`,
        },
        puzzle: {
            img: PRO_IMG('stageLightsCard.png'), // placeholder filename — swap to whatever you export
            prompt: `On stage, the lights loop in a 2:3 pattern: 2 blue beams, then 3 gold beams, repeating. If the crew runs 180 beams this chorus, how many are blue and how many are gold?`,
            reveal: `<b>72 blue, 108 gold.</b> (That's 2/5 and 3/5 of 180)`,
        },
      },
    },
    {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Emmy Noether',
      img: PRO_BIG_IMG('noetherHappy.png'),
      text: `She smiles. “Invariant preserved.” The Ghost goes quiet for a beat. The stage lights sweep and swap, but the pattern holds. “When something stays fixed, you can dance around it.”`,
      soloLabel: 'Next Customer ➡️',
      grants: [{ item: ItemIds.NOETHER_TOKEN }],
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
          text: `Third to roll in is Geometry’s old lion—levers, circles, and one famous bath. He taps the dunk-tank like it’s a theorem.`,
        },
        lore: {
            img: PRO_IMG('lanternCircle.png'),
            text: `The barrel gurgles. He pictures two huge tubs—one pure water, one piled with snowcones. He steps in; both surfaces climb. “Displacement tells the truth,” he grins. “The rise matches my volume, and the lift equals the weight I push aside—cone or water, same law.”`,
        },
        puzzle: {
            img: PRO_IMG('waterBarrel.png'),
            prompt: `At Infinity Lake, Archimedes lowers a giant snowcone into the calibrated test cove. The level mark jumps by 3.0 L. What’s the snowcone’s submerged volume?`,
            reveal: `<b>3000 cm³.</b> (1 L = 1000 cm³; and 1 mL ≈ 1 cm³, so 3.0 L = 3000 cm³)`,
        },

      },
    },
    {
        role: SlideRole.ADVANCE,
        mode: 'solo',
        title: 'Archimedes',
        img: PRO_BIG_IMG('archimedesHappy.png'),
        text: `He laughs. “Balanced perfectly!” The ripples settle into neat circles. “Equal weight, equal lift—always.” He taps the cone like a theorem, pockets it like a solved problem, and tips you a wink. “Bill me in buoyant units,” he says, leaving a faint ring of dew on the counter as his token warms your jar.`,
        soloLabel: 'Next Customer ➡️',
        grants: [{ item: ItemIds.ARCHIMEDES_TOKEN }],
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
          text: `Fourth customer is portentous at first. Renaissance popularizer of double-entry bookkeeping—two columns in honest balance.`,
        },
        lore: {
            img: PRO_IMG('ledgerGlow.png'),
            text: `He flips a tiny ledger: left syrup, right cones. “Debits greet credits,” he winks. He sketches a crisp T and notes ‘Somma = Somma’ in the margin. “What leaves inventory enters the mix—every pour has its pair.”`,
        },

        puzzle: {
            img: PRO_IMG('mixCard.png'),
            prompt: `Tap-to-pay: 1 cone costs $5, paid entirely with Cone Coins (from a prior top-up). Customer also leaves a $1 cash tip. Vendor double-entry: list the Debits and Credits.`,
            reveal: `<b>Debits:</b> Unearned Cone Coins $5; Cash $1 · <b>Credits:</b> Sales Revenue $5; Tips Payable $1.`,
        },




      },
    },
    {
        role: SlideRole.ADVANCE,
        mode: 'solo',
        title: 'Luca Pacioli',
        img: PRO_IMG('pacioliHappy.png'),
        text: `He nods at your books and your blend. “Balanced.” He sets a tiny glowing ledger in your palm—left Syrup, right Cones, Somma = Somma—then lifts two snowcones, one in each hand, level as a scale. The page hums, signs itself, and closes warm against your pocket. “Every pour has its pair,” he winks, strolling into the lights with twin cones held high.`,
        soloLabel: 'Jehnk Jumps In ➡️',
        grants: [{ item: ItemIds.PACIOLI_TOKEN }],
    },

    // Wrap — Jehnk pep talk → Chapter 3
    {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Shift Complete',
      img: PRO_IMG('jehnk2Cones.png'),
      text: `Jehnk whistles. “Four legends, four cones—clean pours, clean math. Keep this up and I might let you run the truck forever.”`,
      soloLabel: 'Chapter 3 ➡️',
      nextChapterId: 'ch3',
    },
  ],
};
