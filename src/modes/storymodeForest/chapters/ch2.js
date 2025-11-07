// /src/modes/storyMode/chapters/ch2.js
import { SlideRole, ItemIds } from '../../../data/storySchema.js';
const BASE = import.meta.env.BASE_URL;
const PRO_IMG = (n) => `${BASE}assets/img/characters/storyMode/${n}`;
const SCN_IMG = (n) => `${BASE}assets/img/modes/storymodeForest/${n}`;

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
    text: `Now that you've got the basics, Jehnk is letting you run the truck for a shift.<br><br>
    Dew beads on the window as neon leaks through the mist, the Pavilion bass keeping slow time.<br><br>
    Four shapes hover at the rope—one polishing a wooden timepiece, one tracing quiet symmetries in the air, one rolling a circle charm across their knuckles, one thumbing a tiny ledger that glows; each carrying a different kind of math.`,
    soloLabel: 'Open the Window ➡️',
    },

    // ───────────────────────────────────
    // 1) Benjamin Banneker — item on happy slide
    // ───────────────────────────────────
    {
      role: SlideRole.CUSTOMER,
      title: 'Customer • Benjamin Banneker',
      customer: {
        name: 'Benjamin Banneker',
        bio: {
          img: PRO_IMG('banneker.png'),
          text: `He sets a wooden timepiece on the counter. Self-taught astronomer, almanac author, and surveyor—he read the sky like a ledger.`,
        },
        lore: {
          img: PRO_IMG('treeline.png'),
          text: `Out past the lights, the Math Ghost hums at the treeline. “Rhythm is ratio,” he says. “Cones per minute; minutes per song.”`,
        },
        puzzle: {
          img: PRO_IMG('scheduleCard.png'),
          prompt: `A set lasts 42 minutes. Your pace is 5 cones every 3 minutes. How many cones per set?`,
          reveal: `<b>70 cones.</b> 42 ÷ 3 = 14 chunks; 14 × 5 = 70.`,
        },
      },
    },
    {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Happy • Benjamin Banneker',
      img: PRO_IMG('bannekerHappy.png'),
      text: `He tastes the cone, eyes glinting like midnight brass. “Keep your time; the night will keep you.”`,
      soloLabel: 'Next Customer ➡️',
      grants: [{ item: ItemIds.BANNEKER_TOKEN }],
    },

    // ───────────────────────────────────
    // 2) Emmy Noether — item on happy slide
    // ───────────────────────────────────
    {
      role: SlideRole.CUSTOMER,
      title: 'Customer • Emmy Noether',
      customer: {
        name: 'Emmy Noether',
        bio: {
          img: PRO_IMG('noether.png'),
          text: `A pioneer of abstract algebra and physics—she linked symmetries to conserved quantities: when the world transforms, something stays true.`,
        },
        lore: {
          img: SCN_IMG('coilCables.png'),
          text: `Stage lights loop. “Find your invariant,” she says. “The ratio that survives any total.”`,
        },
        puzzle: {
          img: SCN_IMG('ratioCard.png'),
          prompt: `Invariant recipe: 2:3 mint:lime. For 180 mL total, how many mL of each?`,
          reveal: `<b>72 mL mint, 108 mL lime.</b> (2/5, 3/5 of 180)`,
        },
      },
    },
    {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Happy • Emmy Noether',
      img: PRO_IMG('noetherHappy.png'),
      text: `She smiles. “Invariant preserved.” The Ghost goes quiet for a beat.`,
      soloLabel: 'Next Customer ➡️',
      grants: [{ item: ItemIds.NOETHER_TOKEN }],
    },

    // ───────────────────────────────────
    // 3) Archimedes — item on happy slide
    // ───────────────────────────────────
    {
      role: SlideRole.CUSTOMER,
      title: 'Customer • Archimedes',
      customer: {
        name: 'Archimedes',
        bio: {
          img: PRO_IMG('archimedes.png'),
          text: `Geometry’s old lion—levers, circles, and one famous bath. He taps the dunk-tank like it’s a theorem.`,
        },
        lore: {
          img: SCN_IMG('lanternCircle.png'),
          text: `The barrel gurgles. “Displacement tells the truth,” he grins. “What goes in, pushes out equal volume.”`,
        },
        puzzle: {
          img: SCN_IMG('waterBarrel.png'),
          prompt: `A trinket dropped in the measuring barrel raises the water by 150 mL. What’s the trinket’s volume?`,
          reveal: `<b>150 cm³.</b> (1 mL ≈ 1 cm³)`,
        },
      },
    },
    {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Happy • Archimedes',
      img: PRO_IMG('archimedesHappy.png'),
      text: `He laughs. “Balanced perfectly!” He pockets the cone like a solved problem.`,
      soloLabel: 'Next Customer ➡️',
      grants: [{ item: ItemIds.ARCHIMEDES_TOKEN }],
    },

    // ───────────────────────────────────
    // 4) Luca Pacioli — item on happy slide; Jehnk jumps in next
    // ───────────────────────────────────
    {
      role: SlideRole.CUSTOMER,
      title: 'Customer • Luca Pacioli',
      customer: {
        name: 'Luca Pacioli',
        bio: {
          img: PRO_IMG('pacioli.png'),
          text: `Renaissance popularizer of double-entry bookkeeping—two columns in honest balance.`,
        },
        lore: {
          img: SCN_IMG('ledgerGlow.png'),
          text: `He flips a tiny ledger: left syrup, right cones. “Debits greet credits,” he winks.`,
        },
        puzzle: {
          img: SCN_IMG('mixCard.png'),
          prompt: `Order: 10 cones, each 150 mL, at a 3:2 mint:lime ratio.
                   Total mint and lime needed?`,
          reveal: `<b>Mint 900 mL; Lime 600 mL.</b> Total 1500 mL → 3/5 = 900; 2/5 = 600.`,
        },
      },
    },
    {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Happy • Luca Pacioli',
      img: PRO_IMG('pacioliHappy.png'),
      text: `He nods at your books and your blend. “Balanced.” The page glows, then closes itself.`,
      soloLabel: 'Jehnk Jumps In ➡️',
      grants: [{ item: ItemIds.PACIOLI_TOKEN }],
    },

    // Wrap — Jehnk pep talk → Chapter 3
    {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Shift Complete',
      img: PRO_IMG('jehnk2Cones.png'),
      text: `Jehnk whistles. “Four legends, four cones—clean pours, clean math. Keep this up and I might let you run the truck one night.”`,
      soloLabel: 'Chapter 3 ➡️',
      nextChapterId: 'ch3',
    },
  ],
};
