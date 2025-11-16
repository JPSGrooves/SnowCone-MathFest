// ch1.js (clean)
import { SlideRole, ItemIds } from '../../../data/storySchema.js';
import { appState as globalAppState } from '../../../data/appState.js';
import { awardBadge } from '../../../managers/badgeManager.js';
import { pickupPing } from '../ui/pickupPing.js'; 

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
      text: `When you arrive, it's 2am, dark, dewy, and the festival gate looms. You bought your ticket months ago and can't wait to see what the festival has to offer. A Dino Divider ushers you into a parking spot, and emerging from your car, you decide to make a move.`,
      role: SlideRole.ADVANCE,
      requireAllSidePaths: true,
      topLabel: 'Step up to the gate! ➡️',
      loopLabel: 'Stare at the dinosaurs',
      questLabel: 'Kool Kat selling triangles',
      weirdLabel: 'Follow a floating syrup bubble',
      loop: {
        title: 'Dino Divider',
        img: PRO_IMG('dinoDivider.png'),
        text: `You linger near the gates and one of the Dinos catch your look. She walks over and smiles.<br>
        “We’re the Dino Dividers, line keepers, vibe shepherds, buddy-system champs.”
        She points to the footprints and glowing cones.<br><br>“We pair folks up, keep the beat moving,
        answer questions, and make sure nobody misses their first chill.” A claw waves good-bye. “Hope you have fun!”`,
        },

      quest: {
      title: 'Kool Kat Selling Triangles',
      steps: [
        {
        img: PRO_IMG('hippyTriangle.png'),
        text: `Kat breezes between bumpers, shoulder-strap tray jangling.<br><br> “Triangles, triangles!” she grins...then notices your empty pockets. “No cone coin? No problem. Pay me with math.” <br><br>She chalks: 3–4–? and taps a right angle. “Shortest path corner-to-corner?”`,
        reveal: `5 — the hypotenuse. “Math accepted,” she laughs.`,
        requireRevealToAdvance: true
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
        text: `By the hatchback, Dr. Kenny Fields flips pancakes under string lights. <br><br>He’s chasing a “float-then-kiss” bubble; light enough to hover, dense enough to coat.<br><br> “Ratios are wrong,” he mutters. “Too heavy at 3:1, too poppy at 2:1. I drove here for help...someone here knows the mix.”<br><br>If you see a ratio board marked with triangles and spirals, send him there`,
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
      text: `Guard: “Dude, who gave you a ticket? It's wristbands only...”<br><br>The biker dino isn’t mad — just bummed for you. He tilts the scanner toward a sign that reads <i>WRISTBAND TENT ➜</i>.`,
      role: SlideRole.ADVANCE,
      requireAllSidePaths: true,
      topLabel: 'Toss ticket & give up 😔',
      loopLabel: 'Stop by the wristband tent',
      questLabel: 'Sneak through a gap',
      weirdLabel: 'A Rambler Walks By',
      // Slide 1 — replace ONLY the `loop` block on "Sold Out"
      loop: {
        title: 'Wristband Tent',
        img: PRO_IMG('wristbandTent.png'),
        text:
            `The pop-up tent flaps in the breeze. A clipboard on the table reads:<br><b>SOLD OUT</b>.<br>Beside it, a hand-lettered sign:<br>“<i>Can’t get in? Talk to Jehnk!</i>”<br><br>
            As you stand there with dew soaking into your shoes, the night feels suddenly bigger; yet, your pockets feel light.<br><br>Who is Jehnk? You try the name out under your breath—“Jehnk”—and feel the festival listening back.`
      },

      // Slide 1 — QUEST (replace the whole quest block)
      quest: {
        title: 'Stopped at the gap',
        steps: [
            {
            img: PRO_IMG('bikerDino.png'), // add this asset
            text: `You edge along the rope line and slip toward a gap. A biker dino steps in; he's calm, firm, sympathetic.<br><br>“Sorry, I can't let you in. This is literally my only job.” He lowers his voice: “Answer me this and I’ll give you a coveted festival secret:<br><br> The <i>festival grounds</i> has a perimeter of 2 miles. What’s the area?”`,
            reveal: `4 sides = .5 miles each,<br>The area = .5 × .5 = <b>.25 square miles</b>.`,
            requireRevealToAdvance: true
            },
            {
            img: PRO_IMG('mintSquareRecipe.png'), // add this asset
            text: `He presses a perfectly square mint recipe into your hand; it's on edible paper with mint-green ink.<br><br>“Use the sheet in the mix; it’s part of the recipe!” he says. “If you find Jehnk, show it to him. He’s got a thing for mint and neat squares."<br><br>You put the card in your <b>inventory</b>, wondering if someone else might need those ratios.`
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
        text: `From the neon mist, a beanie’d rambler drifts past, patting every pocket. “My wristband… I <i>worked for Jehnk last year</i>—does that still count?”<br><br>He shoves his hand into his hoodie and—<i>poof</i>—it vanishes to the elbow. He yelps, pulls it back dusted with dew. “Okay. My pocket folded into the space-time continuum <i>again</i>. It was right here, I swear.”<br><br>He gives you a conspiratorial nod and wanders on, still fishing for a wristband that might be orbiting a small moon.`
      }
    },

    // 2) Arrival — Jehnk rolls in (exposition beat)
    {
      title: "Jehnk Swirves In",
        img: PRO_IMG('jehnkTruck.png'), // ← use the iconic truck art
        text:`The ground rumbles and tires squeal, as Jehnk swerves in and does a few infinity burnouts.<br><br>He stops the truck and leans out with an easy grin, sunglasses reflecting the 2AM neon. “Evening, camper. You look like someone who found the music but lost the map.”<br><br>He slides a <b>WorkBadge</b> your way. “Everyone starts right here at the gates! <b>You wanna work your way in?</b>”`,
        mode: 'solo',
        role: SlideRole.ADVANCE,
        soloLabel: 'Take the Job!', 

        // 🆕 would the reward system work here?
        grants: [{ item: ItemIds.WORK_BADGE, announce: true }],
    },


    // 3) Walkabout
    {
      title: 'You\'re in! Explore?',
      img: PRO_IMG('jehnkExplore.png'),
      text: `"Hey man, I can hold down the first shift. Go check out the SnowCone MathFest!" Jehnk waves you off as he starts setting up his truck booth for the night.`,
      role: SlideRole.ADVANCE,
      requireAllSidePaths: true,
      topLabel: 'Start your shift ➡️',
      loopLabel: 'Stroll through ShakeSquare',
      questLabel: 'Turn off the CampLights',
      weirdLabel: 'More Syrup Bubbles?',
      loop: {
        title: 'ShakeSquare Stroll',
        img: PRO_IMG('shakeSquare.png'),
        text: `
            The row opens like a neon, tie-dye canyon. "<em>π-Pretzels</em>"-tying delicious, unsolvable knots; “Gold Ratio Cones” selling arbitrary twists. A kid dino walks by with a mysterious backpack. A vendor in mirrored shades holds up a prime crystal: “Three for a dollar—refractions included.” Another offers fractal tapestries that bloom when you step closer. You could get lost here for hours.<br><br>
            You pocket the urge to browse and turn back toward the truck. Somewhere past the tents, Jehnk’s offer calls like a promise.
        `,
      },
      quest: {
        title: "Turn off the CampLights",
        steps: [
            {
            img: PRO_IMG("campLight.png"),
            text: `A small dino stands under a blinding floodlight, staring it down.
                    “If you can answer this, that’ll be my sign to flip it,” he says, tapping the brightness switch.
                    <br><br><em>If I half the brightness each click. Starting at 100%, after how many clicks is it
                    effectively zero (below 1%)?</em>`,
            reveal: `7 clicks. Halves: 100 → 50 → 25 → 12.5 → 6.25 → 3.125 → 1.5625 → 0.78125%.
                    It drops below 1% after the <b>7th</b> click.`,
            requireRevealToAdvance: true
            },
            {
            img: PRO_IMG("breakerBox.png"),
            text: `You give an educated guess. The dino grins, palms the lever, and snaps it clean to <b>OFF</b>. The generator coughs twice; moths scatter; the floodlight exhales into dark.`,
            reveal: `“Honestly, I was gonna kill it either way—we're gonna need zeroes to tame these lights!”`,
            requireRevealToAdvance: true
            },
            {
            img: PRO_IMG("moonChain.png"), // your circle sigil art
            text: `With the field light gone, the night settles. He fishes something from his pocket and sets it in your palm: a tiny full moon on a stubby chain.<br><br>La Luna glows cool and steady, craters crisp, casting pale light across your fingers while the tents dim back to whispers.`,
            reveal: `You receive the <b>MoonChain</b>.`,
            requireRevealToAdvance: true
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
      img: PRO_IMG('jehnkNews.png'),
      text: `“Alright, map-finder… what’d the festival trade you for your time?” He breathes through his nose, “Mmm. That’s mint. And… lime? You been reading recipe cards in the mist?”<br><br>He taps the truck door twice—clink, clink. “Out here, math is a language and items are verbs.`,

      role: SlideRole.ADVANCE,

      // Top choice: go straight into Chapter 2
      topLabel: () => 'Go to Chapter 2 ➡️',
      nextChapterId: 'ch2',
      requireVisited: ['weird','loop'],

      // Side choices: dynamic descriptors
      loopLabel: 'Question the Recipes',
      questLabel: (appState) => {
        const total = (appState.listItems?.() ?? []).reduce((n, it) => n + (it.qty ?? 1), 0);
        return total >= 3 ? 'Forge the Perfect SnowCone' : 'Scavenge more parts';
      },
      weirdLabel: 'A Syrup Story',

      meta: {
        top:   { kind: 'Story' },
        loop:  { kind: 'Puzzle' },
        quest: { kind: 'Quest' },
        weird: { kind: 'Lore' },
      },

loop: {
  title: 'Question the Recipes',
  img: PRO_IMG('jehnkRecipe.png'),
  text: `
    Jehnk flips a stained card onto the counter. <i>“Ratios are stories. Taste the math.”</i><br><br>
    <b>Red</b> is momentum — bright and quick; a triangle of taste that spikes if you rush the sugar.<br>
    <b>Green</b> is patience — mint arrives when the heat leaves; time does the steeping, not the flame.<br>
    <b>Purple</b> is depth — grape needs a quiet flashlight of acid so the bass notes don’t go muddy.`
},


      quest: {
        title: 'Pocket Check',
        getSteps(appState) {
            const has = (id) => appState?.hasItem?.(id);
            const hasTriangle = has(ItemIds.TRIANGLE_SHARD);
            const hasSquare   = has(ItemIds.SQUARE_SHARD);   // Mint Square recipe
            const hasCircle   = has(ItemIds.CIRCLE_SHARD);   // MoonChain
            const haveAll = hasTriangle && hasSquare && hasCircle;

           if (haveAll) {
            return [
                {
                img: PRO_IMG('essentialsTrio.png'),
                imgAlt: 'Triangle Shard (Perpetual Chill), Mint Square recipe (The Ratio & Flavor), and MoonChain (The Shape Model) glowing on a dark field.',
                // ⬇️ SHORT pre-reveal; long detail stays in `reveal`
                text: `On the tailgate: a frost-bright shard, a mint-square ratio, and a moonlit chain. Three pieces; one method waiting to click.`,
                reveal: `These are the festival’s three essentials, kid: <b>Chill</b> (the shard’s cryo snap), <b>Flavor</b> (that 2:3 mint-lime choir), and <b>Shapes</b> (the moon’s perfect loop guiding the spiral).<br><br>
                        Line them up and you get the method: <i>Chill → Mix → Shape</i>. The bench lights breathe brighter, like they know what comes next.`,
                        requireRevealToAdvance: true
                },
                {
                img: PRO_IMG('essentialsTrio2.png'),
                imgAlt: 'Triangle Shard, Mint Square 2:3 recipe, and MoonChain spiraling together into a single flow.',
                text: `You lift them: cold breath, a glowing 2:3, and a steady lunar spin. The motions begin to braid.`,
                reveal: `The pieces <i>lock</i> with a little cosmic thunk—first a chill tone, then a bright 2:3 chord, then a soft lunar hum. A halo of neon bubbles lifts from your workbench as the mixture stabilizes.<br><br>
                        <b>Chill anchors.</b> <b>Flavor harmonizes.</b> <b>Shape guides.</b><br>
                        Your hands know the rest: spiral, crest, and crown. The Perfect SnowCone is ready to be born.`,
                        requireRevealToAdvance: true
                },
                {
                img: PRO_IMG('essentialsTrio3.png'),
                imgAlt: 'Jehnk cues the final steps at the truck: pack ice, swirl a 2:3 mint–lime ribbon, crown it with a precise triangle crest as neon bubbles glow at 2AM.',
                text: `Jehnk cues the finale: pack ice, pour a steady <b>2:3</b> ribbon, finish with a triangle crest.`,
                reveal: `<b>Perfect SnowCone crafted!</b> Neon bubbles rise and drift like little planets as the cone gleams in the 2AM glow.<br><br>
                        The stack sings in three parts—<b>Chill</b> holds the shape, <b>Flavor</b> rings out 2:3 bright, <b>Geometry</b> keeps the swirl honest. Jehnk grins: “Serve that comet cone, traveler.” 🫧🍧`,
                        requireRevealToAdvance: true
                }
            ];
            }


            // Partial set: name what’s missing
            const missing = [
            !hasTriangle ? 'a Triangle Shard' : null,
            !hasSquare   ? 'the Mint Square recipe' : null,
            !hasCircle   ? 'the MoonChain' : null,
            ].filter(Boolean).join(', ');

            return [{
                img: PRO_IMG('essentialsTrio0.png'),
                imgAlt: 'Three neon question marks where the Triangle Shard, Mint Square 2:3, and MoonChain should be.',
                text: `You check every pocket—lint and a ticket stub. You’re missing ${missing || 'something vital'}. Three faint placeholders glow on the bench: shard, square, moon.`,
                reveal: `Scavenger checklist → 🔺 Triangle Shard = <i>Chill</i>, 🟩 Mint Square (2:3) = <i>Flavor</i>, ⚪ MoonChain = <i>Shape</i>. Collect all three, click them together, then spin the Perfect SnowCone.`
            }];


        },
        reward: { currency: 50 },
      },


      // replace your current entry
      weird: {
        title: 'A Bubble Follows You',
        img: PRO_IMG('syrupBubble.png'), // close-up bubble near ear w/ triangle reflections
        imgAlt: 'A shimmering syrup bubble floating by your ear, reflecting glowing triangles.',
        text: `A syrup bubble drifts by, reflecting triangles that weren’t there a second ago.<br><br>“This must be the work of none other than Dr. Kenny Fields,” Jehnk muses. “He’s been experimenting with festival syrup bubbles for pancakes, but never tells anyone that they follow people around."<br><br>He points, "You’ve got one floating right by your ear.”`,

        // 👇 new: force the CTA copy on this slide
        extraLabel: 'Reveal More',

        // 🔓 follow-up is contingent on Work Badge
        extraWhen: (appState) => appState?.hasItem?.(ItemIds.WORK_BADGE),

        extra: {
            title: 'Three Days of Bubbles',
            img: PRO_IMG('fieldsBubbleStory.png'),
            imgAlt: 'Jehnk and Dr. Kenny Fields surrounded by neon syrup bubbles over the festival tents at 2AM.',
            text: `Jehnk leans back, grinning. “Me and Dr. Kenny Fields? Yeah, we tuned syrups together—ratios perfect, viscosity money.<br><br>Then Kenny gets obsessed with bubbles. Not just a few—like, a *weather system* of bubbles. They swarmed the Midway and wouldn’t pop unless you danced.<br><br>Whole festival formed a conga line and we—no joke—danced that cloud out for three days straight. Best cardio of my life. Worst cleanup.”`,
        },
      },

      // award on press (also handles forging if the player has everything)
        // /src/modes/storyMode/chapters/ch1.js — last slide object
        // ch1.js — replace the entire onAdvance handler on the last slide with this:

onAdvance: ({ appState }) => {
  // IDs we expect to consume to craft
  const need = [ItemIds.TRIANGLE_SHARD, ItemIds.SQUARE_SHARD, ItemIds.CIRCLE_SHARD];

  // tolerate missing master id in schema
  const MASTER_SIGIL_ID = (ItemIds && ItemIds.MASTER_SIGIL) ? ItemIds.MASTER_SIGIL : 'master_sigil';

  // helpers
  const hasItem = (id) => !!appState?.hasItem?.(id);
  const hasAllParts = need.every(hasItem);
  const alreadyForged = hasItem(MASTER_SIGIL_ID);

  // DEV: one-shot state debug so we can *see* why it didn’t fire
  console.log('[ch1 forge] parts:', {
    triangle: hasItem(ItemIds.TRIANGLE_SHARD),
    square:   hasItem(ItemIds.SQUARE_SHARD),
    circle:   hasItem(ItemIds.CIRCLE_SHARD),
    hasAllParts,
    alreadyForged,
    MASTER_SIGIL_ID,
  });

  // If the player currently has all three parts, we ALWAYS do the epic ping (celebration),
  // even if they already forged before.
  if (hasAllParts) {
    try {
      pickupPing({
        kind: 'item',
        emoji: '🍧',
        name: 'Perfect SnowCone',
        qty: 1,
        variant: 'epic',
        durationMs: 2600
      });
    } catch (e) {
      console.warn('[ch1 forge] epic ping failed:', e);
    }
  }

  // Only *add* the Perfect SnowCone + consume parts if not already forged
  if (hasAllParts && !alreadyForged) {
    // consume parts safely
    try {
      if (typeof appState.consumeItems === 'function') {
        appState.consumeItems(need);
      } else {
        need.forEach(id => { try { appState.removeItem?.(id); } catch {} });
      }
    } catch (e) {
      console.warn('[ch1 forge] consume parts failed:', e);
    }

    // award the crafted result
    try {
      appState.addItem(MASTER_SIGIL_ID, { name: 'Perfect SnowCone', meta: { emoji: '🍧' } });
      console.log('[ch1 forge] added Master Sigil item:', MASTER_SIGIL_ID);
    } catch (e) {
      console.warn('[ch1 forge] add master item failed:', e);
    }

    // quiet currency bump (no cash ping), then refresh chip
    try { appState.addCurrency?.(300); } catch {}
    refreshCashChip();

    try { awardBadge('ch1_forge'); } catch (e) {
      console.warn('[ch1 forge] badge award failed:', e);
    }
  } else {
    // Not all parts? Just explain in log so you know why no add happened.
    if (!hasAllParts) console.log('[ch1 forge] skipped (missing parts)');
    if (alreadyForged) console.log('[ch1 forge] skipped (already forged)');
  }

  // chapter finish drip (quiet)
  try { appState.addCurrency?.(200); } catch {}
  refreshCashChip();

  try { appState.saveToStorage?.(); } catch {}
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
// handy: keep the cash chip accurate without cash flash
// replace your refreshCashChip() with this:
function refreshCashChip() {
  const chip = document.getElementById('smCash');
  if (!chip) return;
  const parts = (chip.textContent || '').trim().split(/\s+/);
  const currentLabel = parts.length > 1 ? parts.slice(1).join(' ') : 'Coins';
  chip.textContent = `${globalAppState.getCurrency()} ${currentLabel}`;
}


