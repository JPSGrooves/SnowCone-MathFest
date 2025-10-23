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
      text: `When you arrive, it's 2am, dark, dewy, and the festival gate looms. You bought your ticket months ago and can't wait to see what the festival has to offer. A Dino Divider ushers you into a parking spot, and emerging from you car, you decide to make a move.`,
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
        She points to the footprints and glowing cones.<br><br>“We pair folks up, keep the beat moving,
        answer questions, and make sure nobody misses their first chill.” A claw waves good bye. “Hope you have fun!”`,
        },

      quest: {
      title: 'Kool Kat Selling Triangles',
      steps: [
        {
        img: PRO_IMG('hippyTriangle.png'),
        text: `She breezes between bumpers, shoulder-strap tray jangling.<br><br> “Triangles, triangles!” she grins—then clocks your empty pockets. “No coin? No problem. Pay with math.” <br><br>She chalks: 3–4–? and taps a right angle. “Shortest path corner-to-corner?”`,
        reveal: `5 — the hypotenuse. “Math accepted,” she laughs.`
        },
        {
        img: PRO_IMG('triangleHand.png'),
        text: `She presses a shimmering shard into your palm.<br><br>“Around this fest, folks <b>trade</b> little finds for favors—shortcuts, songs, secrets.<br><br>Start collecting and you can swap later.” She winks. “Here’s your first trinket!”`
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
      text: `Guard: “Dude, who gave you a ticket? It's wristbands only...”<br><br>The biker dino isn’t mad—just bummed for you. He tilts the scanner toward a sign that reads <i>WRISTBAND TENT ➜</i>.`,
      role: SlideRole.ADVANCE,
      topLabel: 'Toss ticket & turn back 😔',
      loopLabel: 'Stop by the wristband tent',
      questLabel: 'Sneak through a gap',
      weirdLabel: 'A Rambler Walks By',
      // Slide 1 — replace ONLY the `loop` block on "Sold Out"
      loop: {
        title: 'Wristband Tent',
        img: PRO_IMG('wristbandTent.png'),
        text:
            `The pop-up tent flaps in the breeze. A clipboard on the table reads:<b>SOLD OUT</b>.<br>Beside it, a hand-lettered sign:<br>“<i>Can’t get in? Talk to Jehnk!</i>”<br><br>
            As you stand there with dew soaking into your shoes, the night feels suddenly bigger; yet, your pocket feels light.<br><br>Who is Jehnk? You try the name out under your breath—“Jehnk”—and feel the festival listening back.`
      },

      // Slide 1 — QUEST (replace the whole quest block)
      quest: {
        title: 'Stopped at the gap',
        steps: [
            {
            img: PRO_IMG('bikerDino.png'), // add this asset
            text: `You edge along the rope line and slip toward a gap. A biker dino steps in; he's calm, firm, sympathetic.<br><br>“Sorry, I can't let you in. This is literally my only job.” He lowers his voice: “Answer me this and I’ll give you something that’ll blow him away:<br><br> The <i>festival grounds</i> have a perimeter of 2 miles. What’s the area?”`,
            reveal: `The sides of the fest = .5 miles,<br>The area = .5 × .5 = <b>.25 square miles</b>.`
            },
            {
            img: PRO_IMG('mintSquareRecipe.png'), // add this asset
            text: `He presses a perfectly square mint recipe into your hand; it's an edible paper, mint-green ink.<br><br>“Use the sheet in the mix; it’s part of the recipe,” he says. “If you find Jehnk, show him this. He’s got a thing for mint and neat squares.<br><br>You put the card in your <b>inventory</b>, wondering if someone else might need those ratios.”`
            }
        ],
        reward: {
            item: {
            id: ItemIds.SQUARE_SHARD,
            payload: {
                name: 'MintSquare',
                meta: { emoji: '🟩', note: 'mint recipe on edible square paper' }
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
        text:`The ground rumbles and tires squeal, as Jehnk swerves in and does a few infinity burnouts.<br><br>He stops the truck and leans out with an easy grin; sunglasses reflecting the 2AM neon. “Evening, camper. You look like someone who found the music but lost the map.”<br><br>He slides a <b>WorkBadge</b> your way. “Everyone starts right here at the gates! <b>You wanna work your way in?</b>”`,
        mode: 'solo',
        role: SlideRole.ADVANCE,
        soloLabel: 'Take the Job!', 

        // 🆕 would the reward system work here?
        grants: [ItemIds.WORK_BADGE],
    },


    // 3) Walkabout
    {
      title: 'You\'re in! Explore?',
      img: PRO_IMG('jehnkExplore.png'),
      text: `"Hey man, I can hold down the fisrt shift. Go check out the SnowCone MathFest!" Jehnk waves you off as he starts setting up his truck booth for the night.`,
      role: SlideRole.ADVANCE,
      topLabel: 'Start your shift ➡️',
      loopLabel: 'Stroll through ShakeSquare',
      questLabel: 'Turn off the CampLights',
      weirdLabel: 'More Syrup Bubbles?',
      loop: {
        title: 'ShakeSquare Stroll',
        img: PRO_IMG('shakeSquare.png'),
        text: `
            The row opens like a neon, tie-dye canyon. "<em>π-Pretzels</em>"-tying delicious, unsolvable knots; “Gold Ratio Cones” selling garbitrary twists. A kid twirls a beaded abacus like a wind chime. A vendor in mirrored shades holds up a prime crystal: “Three for a dollar—refractions included.” Another offers fractal tapestries that bloom when you step closer. You could get lost here for hours.<br><br>
            You pocket the urge to browse and turn back toward the truck. Somewhere past the tents, Jehnk’s offer calls like a promise.
        `,
      },
      quest: {
        title: "Turn off the CampLights",
        steps: [
            {
            img: PRO_IMG("campLight.png"),
            text: `A small dino stands under a blinding floodlight, staring it down.
                    “If you can answer this, that’ll be my sign to flip it,” it says, tapping the brightness switch.
                    <br><br><em>If I half the brightness each click. Starting at 100%, after how many clicks is it
                    effectively zero (below 1%)?</em>`,
            reveal: `7 clicks. Halves: 100 → 50 → 25 → 12.5 → 6.25 → 3.125 → 1.5625 → 0.78125%.
                    It drops below 1% after the <b>7th</b> click.`
            },
            {
            img: PRO_IMG("breakerBox.png"),
            text: `You give an educated guess. The dino grins, palms the lever, and snaps it clean to <b>OFF</b>. The generator coughs twice; moths scatter; the floodlight exhales into dark.`,
            reveal: `“Honestly, I was gonna kill it either way—I can’t depend on halves to tame these lights!”`
            },
            {
            img: PRO_IMG("moonChain.png"), // your circle sigil art
            text: `With the field light gone, the night settles. He fishes something from his pocket and sets it in your palm: a tiny full moon on a stubby chain.<br><br>La luna glows cool and steady, craters crisp, casting pale light across your fingers while the tents dim back to whispers.`,
            reveal: `You receive the <b>MoonChain</b>.`
            }
        ],
        reward: {
            item: {
            id: ItemIds.CIRCLE_SHARD,                  // ✅ same item id as your “circle thing”
            payload: { name: "MoonChain", meta: { emoji: "⚪", note: "moon keychain" } }
            },
            currency: 50
        }
      },
      weird: {
        title: 'More Syrup Bubbles',
        img: PRO_IMG('scienceGuy2.png'),
        text: `Under a humming camp light, Dr. Kenny Fields runs a tidy pop-up lab.<br><br>“I’ve got it now,” he says. “The bubble floats, kisses, and coats—perfect, every time.” He grimaces, “Blast! The moment it pops, the flavor fades.”<br><br>“I need flavor that survives the pop. If you spot any ratio tricks, send them my way.”`,

        // ✅ bonus screen only if player holds the *square* (mint) item
        // NOTE: change ItemIds.MINT_SQUARE to your actual square item id (e.g. SQUARE_SIGIL, SQUARE_CHIP, etc.)
        extraWhen: (appState) => appState.hasItem?.(ItemIds.SQUARE_SHARD),

        extra: {
            title: 'Mint Recipe, Eh?',
            img: PRO_IMG('mintSquare.png'),   // any square/mint art you’ve got
            text: `You flash a small <b>square</b> that glows cool-green. Fields’ smile widens—recognition, not surprise.<br>“Mint Square—classic,” he says. “That’s one of the first ratios folks try at SnowCone MathFest.”<br><br>“Good instincts. Believe me, I’ve run that one all night—float, kiss, perfect coat. But the moment it pops, the flavor ghosts.”<br><br>“Plus, this recipe can't use <em>mint</em>.”`
        }
      },
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
