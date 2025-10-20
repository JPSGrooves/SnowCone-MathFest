// ch1.js (clean)
import { SlideRole, ItemIds } from '../../../data/storySchema.js';
import { appState as globalAppState } from '../../../data/appState.js';
import { awardBadge } from '../../../managers/badgeManager.js';

const BASE = import.meta.env.BASE_URL;
const PRO_IMG = (name) => `${BASE}assets/img/characters/storyMode/${name}`;
const SCN_IMG = (name) => `${BASE}assets/img/modes/storymodeForest/${name}`;

// ───────────────── helpers ─────────────────
const SHARDS = [ItemIds.TRIANGLE_SHARD, ItemIds.SQUARE_SHARD, ItemIds.CIRCLE_SHARD];
const countShards = (hasItemFn) => SHARDS.reduce((n, id) => n + (hasItemFn(id) ? 1 : 0), 0);

// ───────────────── chapter ─────────────────
export const Chapter1 = {
  id: 'ch1',
  title: 'The Gates of Dawn',
  slides: [
    // 0) Exposition
    {
      title: 'The Gate',
      img: PRO_IMG('gate.png'),
      text: `When you arrive, it's 2am, dark, dewy, and the festival gate looms. A Dino Divider ushers you into a parking spot amongst a bustling group of festival goers.<br><br> You feel ready; knowing you bought your ticket months ago. Taking one last look at your car, you decide to make a move!`,
      role: SlideRole.ADVANCE,
      topLabel: 'Step up to the gate! ➡️',
      loopLabel: 'Stare at the dinosaurs',
      questLabel: 'Kool Kat selling triangles',
      weirdLabel: 'Follow a floating syrup bubble',
      loop: {
        title: 'Dino Divider',
        img: PRO_IMG('dinoDivider.png'),
        text: `You linger at the ropes and the Dinos catch your look. One walks over and grins.<br>
        “We’re the Dino Dividers, line keepers, vibe shepherds, buddy-system champs.”
        They point to the footprints and glowing cones. “We pair folks up, keep the beat moving,
        answer questions, and make sure nobody misses their first chill.” A claw waves good bye. “Hope you have fun!” <br><br>You wonder what it’s like to be part dinosaur...`,
        },

      quest: {
      title: 'Kool Kat Selling Triangles',
      steps: [
        {
        img: PRO_IMG('hippyTriangle.png'),
        text: `She breezes between bumpers, shoulder-strap tray jangling. “Triangles, triangles!” she grins—then clocks your empty pockets. “No coin? No problem. Pay with math.” She chalks: 3–4–? and taps a right angle. “Shortest path corner-to-corner?”`,
        reveal: `5 — the hypotenuse. “Math accepted,” she laughs.`
        },
        {
        img: PRO_IMG('triangleHand.png'),
        text: `She presses a shimmering shard into your palm. “Around this fest, folks **trade** little finds for favors—shortcuts, songs, secrets. Start collecting and you can swap later.” She winks. “Here’s your first trinket!”`
        }
      ],
      reward: {
        item: {
        id: ItemIds.TRIANGLE_SHARD,
        payload: { name: 'Triangle Shard', meta: { emoji: '🔺' } }
        },
        currency: 50
      }


      },
      weird: {
        title: 'Syrupy Scientist',
        img: PRO_IMG('scienceGuy.png'),
        text: `By the hatchback, Dr. Kenny Fields flips pancakes under string lights. <br><br>He’s chasing a “float-then-kiss” bubble—light enough to hover, dense enough to coat.<br><br> “Ratios are wrong,” he mutters. “Too heavy at 3:1, too poppy at 2:1. I drove here for help—someone here knows the mix.”<br><br>If you see a ratio board marked with triangles and spirals, send him there`,
      },

      meta: {
        top:   { kind: 'Story',  skills: ['advance'] },
        loop:  { kind: 'Puzzle', skills: ['ratio','flow'] },
        quest: { kind: 'Quest',  skills: ['geometry','collect'] },
        weird: { kind: 'Lore',   skills: ['mystery'] }
      },
      blurbs: {
        top:   'Advance the story',
        loop:  'Quick brain-teaser',
        quest: 'Multi-step side quest',
        weird: 'Flavor/secret vibes'
      }
    },

    // 1) Rising action — can’t get in
    {
      title: 'All Sold Out',
      img: PRO_IMG('noEntry.png'),
      text: `Guard: “Dude, who gave you a ticket? It's wristbands only...”<br><br>The biker dino isn’t mad—just bummed for you. They tilt the scanner toward a sign that reads <i>WRISTBAND TENT ➜</i> while paw-print lights pad into the crowd.<br><br>Your stomach does a tiny drum fill.`,
      role: SlideRole.ADVANCE,
      topLabel: 'Toss ticket & turn back 😔',
      loopLabel: 'Stop by the wristband tent',
      questLabel: 'Sneak through a gap',
      weirdLabel: 'A rambler walks by',
      // Slide 1 — replace ONLY the `loop` block on "Sold Out"
      loop: {
        title: 'Wristband Tent',
        img: PRO_IMG('wristbandTent.png'),
        text:
            `The pop-up tent flaps in the breeze. A clipboard on the table reads <b>SOLD OUT</b>.<br>Beside it, a hand-lettered sign:<br><br> “<i>Can’t get in? Talk to Jehnk!</i>”<br><br>
            You stand there, dew soaking into your shoes, the lantern hum syncing with your pulse. The night feels suddenly bigger; your pocket feels light. Who is this, Jehnk, exactly? You try the name out under your breath—“Jehnk”—and feel the festival listening back. you turn back, wondering what thread to follow.`
      },

      // Slide 1 — QUEST (replace the whole quest block)
      quest: {
        title: 'Stopped at the gap',
        steps: [
            {
            img: PRO_IMG('bikerDino.png'), // add this asset
            text: `You edge along the rope line and slip toward the gap. A biker dino steps in; he's calm, firm, sympathetic.<br><br>“Sorry, I can't let you in. This is literally my only job.” He lowers his voice: “Ask around for <b>Jehnk</b>. He started this whole thing. He might help.” <br><br>Then he grins. “Answer me this and I’ll give you something that’ll blow him away:<br><br> The <i>festival grounds</i> has a perimeter of 2 miles. What’s its area?”`,
            reveal: `Sides = .5 miles, so area = .5 × .5 = <b>.25 square miles</b>.`
            },
            {
            img: PRO_IMG('mintSquareRecipe.png'), // add this asset
            text: `He presses a perfectly square mint recipe into your hand; it's an edible paper, mint-green ink.<br><br>“Use the sheet in the mix; it’s part of the recipe,” he says. “If you find Jehnk, show him this. He’s got a thing for mint and neat squares.”`
            }
        ],
        reward: {
            item: {
            id: ItemIds.SQUARE_SHARD,
            payload: {
                name: 'Syrup Recipe',
                meta: { emoji: '◼️', note: 'mint recipe on edible square paper' }
            }
            },
            currency: 50
        }
      },

      weird: {
        title: 'A Rambler Walks By',
        img: PRO_IMG('rambler.png'),
        text: `From the neon mist, a beanie’d rambler drifts past, patting every pocket. “Wristband… I <i>worked for Jehnk last year</i>—does that still count?”<br><br>He shoves his hand into his hoodie and—<i>poof</i>—it vanishes to the elbow. He yelps, pulls it back dusted with dew. “Okay. My pocket folded into the space-time continuum <i>again</i>. It was right here, I swear.”<br><br>He gives you a conspiratorial nod and wanders on, still fishing for a wristband that might be orbiting a small moon.`
      }
    },

    // 2) Arrival — Jehnk rolls in (exposition beat)
    {
      title: "Jehnk Swirves In",
        img: PRO_IMG('jehnkTruck.png'), // ← use the iconic truck art
        text:
            `A low electric hum swims through the mist. Headlights bloom across the cones, painting wet asphalt with neon halos.<br><br>
            The truck window lifts with a soft clack. Jehnk leans out with an easy grin; he has eyes that clock everything. 
            “Evening, camper. You look like someone who found the music but lost the map.”<br><br>
            He slides a <b>WorkBadge</b> over, thumbprint of syrup on the corner. “I started this whole circus, but even I started right here at the gates. 
            Breathe. Count. Let me know when you’re ready to roll.”`,
        mode: 'solo',
        role: SlideRole.ADVANCE,

        // 🆕 would the reward system work here?
        grants: [ItemIds.WORK_BADGE],
    },


    // 3) Walkabout
    {
      title: 'Walk the Lights',
      img: PRO_IMG('galileoStar.png'),
      text: `He waves you to explore. Posters rustle. Math ghosts hum in the trees.`,
      role: SlideRole.ADVANCE,
      topLabel: 'Head back toward the truck ➡️',
      loopLabel: 'Read a schedule',
      questLabel: 'Find a circle thing',
      weirdLabel: 'Listen to a power line sing',
      loop: {
        title: 'Schedule Cipher',
        img: PRO_IMG('galileoStar.png'),
        text: `“4 cones / 45s.” You compute ≈5.33 cones/min. The page glows like you leveled up.`
      },
      quest: {
        title: 'Circle Quest',
        steps: [
          { img: PRO_IMG('euclidCone.png'), text: `A chalk wheel asks: circumference with r=5?`, reveal: `≈31.4 (2πr).` },
          { img: PRO_IMG('infinity.png'), text: `You palm a ◯ chip. It feels like a moon.` },
        ],
        reward: {
          item: { id: ItemIds.CIRCLE_SHARD, payload: { name: 'Circle Shard', meta: { emoji: '⚪' } } },
          currency: 50
        }
      },
      weird: {
        title: 'Grid Siren',
        img: PRO_IMG('breeze.png'),
        text: `A transformer hum resolves to a major third. You ascend spiritually .0002 levels.`
      }
    },

    // 4) Last slide — go to Chapter 2, with dynamic side paths
    {
      title: 'Back to the Truck',
      img: PRO_IMG('jehnk2Cones.png'),
      text: `Jehnk eyes your pockets. “Whatcha find out there?”`,
      role: SlideRole.ADVANCE,

      // Top choice: go straight into Chapter 2
      topLabel: () => 'Go to Chapter 2 ➡️',
      nextChapterId: 'ch2',

      // Side choices: dynamic descriptors
      loopLabel: 'Square puzzle',
      questLabel: (appState) => {
        const total = (appState.listItems?.() ?? []).reduce((n, it) => n + (it.qty ?? 1), 0);
        return total >= 3 ? 'Forge the Master Sigil' : 'Scavenge more parts';
      },
      weirdLabel: 'Strange syrup lore',

      meta: {
        top:   { kind: 'Story' },
        loop:  { kind: 'Puzzle' },
        quest: { kind: 'Quest' },
        weird: { kind: 'Lore' },
      },

      loop: {
        title: 'Square Quest',
        img: `${BASE}assets/img/modes/storymodeForest/art/puzzle_card.png`,
        text: `A recipe card: 300 ml mix, mint:lime = 2:3. What are the parts?`,
      },

      quest: {
        title: 'Pocket Check',
        getSteps(appState) {
          const total = (appState.listItems?.() ?? []).reduce((n, it) => n + (it.qty ?? 1), 0);
          if (total >= 3) {
            return [
              { text: 'You lay out the parts: a sigil shard, a token, a tag.', reveal: 'They lock together like magnets.' },
              { text: 'A faint hum rises from the pieces.', reveal: 'The Master Sigil clicks into place. The gate listens.' },
            ];
          }
          return [{ text: 'Not quite enough to craft the Sigil.', reveal: 'Try the puzzle or lore paths for another piece.' }];
        },
        reward: { currency: 50 },
      },

      weird: {
        title: 'Bubble Follows You',
        text: `A syrup bubble drifts by, reflecting triangles that weren’t there a second ago.`,
      },

      // award on press (also handles forging if the player has everything)
      onAdvance: ({ appState }) => {
        const hasAll =
          appState.hasItem(ItemIds.TRIANGLE_SHARD) &&
          appState.hasItem(ItemIds.SQUARE_SHARD) &&
          appState.hasItem(ItemIds.CIRCLE_SHARD);

        if (hasAll && !appState.hasItem(ItemIds.MASTER_SIGIL)) {
          appState.addItem(ItemIds.MASTER_SIGIL, { name: 'Master Sigil', meta: { emoji: '🜚' } });
          appState.addCurrency(300);
          try { awardBadge('ch1_forge'); } catch {}
        }

        appState.addCurrency(200); // chapter finish drip
        appState.saveToStorage?.();
      }
    },
  ],

  onFinish: ({ appState }) => {
    try {
      appState.addCurrency(250);
      appState.saveToStorage?.();
    } catch {}
  }
};
