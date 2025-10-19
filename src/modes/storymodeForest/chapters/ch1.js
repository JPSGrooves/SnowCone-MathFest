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
      questLabel: 'Chick selling triangles',
      weirdLabel: 'Follow a floating syrup bubble',
      loop: {
        title: 'Dino Divider',
        img: PRO_IMG('dinoDivider.png'),
        text: `You linger at the ropes and the Dinos catch your look. One walks over and grins.<br>
        “We’re the Dino Dividers, line keepers, vibe shepherds, buddy-system champs.”
        They point to the footprints and glowing cones. “We pair folks up, keep the beat moving,
        answer questions, and make sure nobody misses their first chill.” A claw waves good bye. “Hope you like your spot!” <br><br>You wonder what it’s like to be part dinosaur...`,
        },

      quest: {
      title: 'Kat Selling Triangles',
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
      title: 'Sold Out',
      img: SCN_IMG('gate.png'),
      text: `Guard: “Wristbands only. Or… prove you can keep the flow.”`,
      role: SlideRole.ADVANCE,
      topLabel: 'Nod and step aside ➡️',
      loopLabel: 'Ask the Dividers for tips',
      questLabel: 'Find a square thing',
      weirdLabel: 'Try the side gate (lol)',
      loop: {
        title: 'Divider Tips',
        img: PRO_IMG('dinoDivider.png'),
        text: `“Every sixth jams. Stagger a solo.” You file that away like a pro.`,
      },
      quest: {
        title: 'Square Quest',
        steps: [
          {
            img: PRO_IMG('jehnkApron.png'),
            text: `A recipe card: 300 ml mix, mint:lime = 2:3. Mint = ? Lime = ?`,
            reveal: `Mint 120 ml; Lime 180 ml.`
          },
          { img: PRO_IMG('iceyTruck.png'), text: `The vendor smiles and flips you a ▢ chip.` },
        ],
        reward: {
          item: { id: ItemIds.SQUARE_SHARD, payload: { name: 'Square Shard', meta: { emoji: '◼️' } } },
          currency: 50
        }
      },
      weird: {
        title: 'Side Gate Shenanigans',
        img: PRO_IMG('dinoDivider.png'),
        text: `You start to slip through. “Nope,” says Dino, moving exactly the speed of your shame.`
      }
    },

    // 2) Climax — Jehnk’s equation (solo)
    {
      title: 'Jehnk’s Test',
      img: PRO_IMG('boredJehnk.png'),
      text:
        `Jehnk: “Two cones. One octave (½ string), one perfect fifth (2/3). ` +
        `Base string 60 cm — press points?” You: “30 cm and 20 cm.” He grins. “You’ve got hands.”`,
      mode: 'solo',
      role: SlideRole.ADVANCE,
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
