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
        title: '<span style="color: rgb(217, 164, 255);">Dino Divider</span>',
        img: PRO_IMG('dinoDivider.png'),
        text: `You linger near the gates and make eye contact with a Dino Divider. She walks over and smiles.<br>
        <span style='color:rgb(217, 164, 255);'>\"We’re the Dino Dividers, line keepers, vibe shepherds and buddy-system champs.\"</span>
        She points to the footprints and glowing cones.<br><br><span style='color: rgb(217, 164, 255);'>\"We pair folks up and keep the beat moving,
        answering questions and making sure nobody misses their first SnowCone!\"</span> She waves you in, <span style='color: rgb(217, 164, 255);'>\"This way to the gates!\"</span>`,
        },

      quest: {
      title: '<span style="color: rgb(143, 190, 255);">Kool Kat Selling Triangles</span>',
      steps: [
        {
        img: PRO_IMG('hippyTriangle.png'),
        text: `<span style='color: rgb(143, 190, 255);'>\“Triangles, triangles!\"</span> Kat offers you some of her best 3-siders...then she notices your empty pockets. <span style='color: rgb(143, 190, 255);'>\"No cone coins? No problem. Just pay me with math!\"</span> <br><br>She draws a shape: <span style='color: rgb(143, 190, 255);'>\"3–4–?\"</span> and taps an imaginary right triangle:<br><span style='color: rgb(143, 190, 255);'>\"What is the length of the longest side of this triangle?\"</span>`,
        reveal: `<span style='color: rgb(143, 190, 255);'>\“5 — the hypotenuse! Your Math is accepted!\"</span>`,
        requireRevealToAdvance: true
        },
        {
        img: PRO_IMG('triangleHand.png'),
        text: `She presses a shimmering shard into your palm.<br><br><span style='color: rgb(143, 190, 255);'>\“Around this fest, folks <b>trade</b> little finds for favors, shortcuts, songs...maybe even secrets. Start collecting with this and you can use them later!\"</span><br><br>She winks, <span style='color: rgb(143, 190, 255);'>\“Here’s your first trinket!\"</span>`
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
        title: '<span style="color: rgb(164, 255, 164);">Syrupy Scientist</span>',
        img: PRO_IMG('scienceGuy.png'),
        text: `By a dusty hatchback, Dr. Kenny Fields flips pancakes under the string lights. <br><br>He’s chasing a <span style='color: rgb(164, 255, 164);'>\"float-then-kiss\"</span> bubble; light enough to hover but dense enough to coat a whole pancake.<br><br> <span style='color: rgb(164, 255, 164);'>\"My ratios are all wrong,\"</span> he mutters. <span style='color: rgb(164, 255, 164);'>\"The bubbles are too heavy at 3:1 and too poppy at 2:1. I drove here for help...someone here knows the mix.\"</span><br><br>If you see a ratio board marked with waffles and flapjacks, send him there!`,
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
      title: 'All Sold Out!!',
      img: PRO_IMG('noEntry.png'),
      text: `The guard sees your ticket and immediately begins to frown. <span style='color: rgb(164, 255, 164);'>\"Dude, who gave you a ticket? It's wristbands only...\"</span><br><br>The biker dino isn’t mad — just bummed for you. He tilts the scanner toward a sign that reads <span style="color: rgb(247, 255, 105);"><i>WRISTBAND TENT ➜</i></span>.`,
      role: SlideRole.ADVANCE,
      requireAllSidePaths: true,
      topLabel: 'Toss ticket & give up 😔',
      loopLabel: 'Stop by the wristband tent',
      questLabel: 'Sneak through a gap',
      weirdLabel: 'A Rambler Walks By',
      // Slide 1 — replace ONLY the `loop` block on "Sold Out"
      loop: {
        title: '<span style="color: rgb(164, 255, 164);">Wristband Tent</span>',
        img: PRO_IMG('wristbandTent.png'),
        text:
            `The pop-up tent flaps in the breeze. A clipboard on the table reads:<br><b><span style='color: rgb(164, 255, 164);'>\"SOLD OUT\"</span></b>.<br>Beside it, a hand-lettered sign:<br><span style='color: rgb(164, 255, 164);'>\"<i>Can’t get in? Talk to Jehnk!</i>\"</span><br>
            As you stand wondering, with dew soaking into your shoes, the night feels suddenly bigger; yet, your wrist feels light.<br><br>Who is this Jehnk? You try the name out under your breath—<span style='color: rgb(164, 255, 164);'>\"Jehnk\"</span>—and immediately feel the festival listening back.`
      },

      // Slide 1 — QUEST (replace the whole quest block)
      quest: {
        title: '<span style="color: rgb(217, 164, 255);">Stopped at the Gap</span>',
        steps: [
            {
            img: PRO_IMG('bikerDino.png'), // add this asset
            text: `You edge along the festival perimeter and slip toward an open gap. A biker dino swiftly steps in; he's firm, yet calm and sympathetic.<br><br><span style='color:rgb(217, 164, 255);'>\"Sorry, I can't let you in. This is literally my only job.\"</span> He lowers his voice: <span style='color:rgb(217, 164, 255);'>\"But...answer a question and I’ll give you a coveted festival secret:<br><br> The <i>festival grounds</i> have a perimeter of 2 miles. What’s the area?\"</span>`,
            reveal: `<span style="color: rgb(217, 164, 255);">4 sides = .5 miles each,<br>The area = .5 × .5 = <b>.25 square miles</b>.</span>`,
            requireRevealToAdvance: true
            },
            {
            img: PRO_IMG('mintSquareRecipe.png'), // add this asset
            text: `He presses a perfectly square, mint recipe into your hand; it's printed on edible green paper with mint-green ink.<br><br><span style='color:rgb(217, 164, 255);'>\"You can use this sheet in the mix; it’s part of the recipe!\"</span> He goes on, <span style='color:rgb(217, 164, 255);'>\"If you find Jehnk, show it to him. He’s got a thing for mint and perfect squares.\"</span><br><br>You put the card in your <b>inventory</b>, wondering if anyone else might need those ratios.`
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
        title: '<span style="color: rgb(143, 190, 255);">A Rambler Walks By</span>',
        img: PRO_IMG('rambler.png'),
        text: `Wandering in the neon mist, a weathered, beanie’d rambler drifts past, patting every pocket. <span style='color: rgb(143, 190, 255);'>\“Lost my wristband… I <i>worked for Jehnk last year</i>—does that still count?\"</span><br><br>He shoves his hand into his hoodie and—<i>poof</i>—it vanishes to the elbow. He yelps and pulls it back, dusted with frost. <span style='color: rgb(143, 190, 255);'>\“Okay. My pocket folded into the space-time continuum <i>again</i>. It was right there, I swear.\"</span><br><br>He barely notices you and wanders on, still fishing for a wristband that might be orbiting a small moon.`
      }
    },

    // 2) Arrival — Jehnk rolls in (exposition beat)
    {
      title: '<span style="color: rgb(247, 255, 105);">Jehnk Swirves In</span>',
        img: PRO_IMG('jehnkTruck.png'), // ← use the iconic truck art
        text:`The ground rumbles and tires squeal, as Jehnk swerves in and does a few infinity burnouts.<br><br>He stops the truck and leans out with an easy grin, sunglasses reflecting the 2AM neon. <span style='color: rgb(247, 255, 105);'>\"Evening, camper! You look like someone who found the music but lost the map.\"</span><br><br>He slides a <b>WorkBadge</b> your way. <span style='color: rgb(247, 255, 105);'>\"Everyone starts right here at the gates! You seem cool enough...<b>You wanna work your way in?</b>\"</span>`,
        mode: 'solo',
        role: SlideRole.ADVANCE,
        soloLabel: 'Take the Job!', 

        // 🆕 would the reward system work here?
        grants: [{ item: ItemIds.WORK_BADGE, announce: true }],
    },


    // 3) Walkabout
    {
      title: '<span style="color: rgb(247, 255, 105);">You\'re in! Explore?</span>',
      img: PRO_IMG('jehnkExplore.png'),
      text: `<span style='color: rgb(247, 255, 105);'>\"Hey man, I can hold down the first shift. Go check out the SnowCone MathFest!\"</span> Jehnk waves you off as he starts setting up his truck booth for the night.`,
      role: SlideRole.ADVANCE,
      requireAllSidePaths: true,
      topLabel: 'Start your shift ➡️',
      loopLabel: 'Stroll through ShakeSquare',
      questLabel: 'Turn off the CampLights',
      weirdLabel: 'More Syrup Bubbles?',
      loop: {
        title: '<span style="color: rgb(217, 164, 255);">ShakeDownSquare</span>',
        img: PRO_IMG('shakeSquare.png'),
        text: `Shakedown Square opens up like a neon, tie-dye canyon. You see <span style='color:rgb(217, 164, 255);'>\"<em>Pi-Pretzels</em>\"</span> tying delicious, unsolvable knots; <span style='color:rgb(217, 164, 255);'>\"Gold Ratio Cones\"</span> selling randomly twisted scones. The tiny hooded dino walks by with a mysterious backpack full of prime crystals: <span style='color:rgb(217, 164, 255);'>\"Three for a Cone Coin? No refunds!\"</span> Another vendor offers fractal tapestries that bloom when you step closer.<br><br>You pocket the urge to explore and turn back toward the truck. Somewhere past the vendors, you can hear Jehnk’s customers lining up fast.`,
      },
      quest: {
        title: '<span style="color: rgb(143, 190, 255);">Turn off the CampLights</span>',
        steps: [
            {
            img: PRO_IMG("campLight.png"),
            text: `A tiny dino stands under a blinding floodlight, staring it down.<br>He wants the light OFF!<br><span style='color: rgb(143, 190, 255);'>\“If you can answer my question correctly, that’ll be my sign to turn it off!\"</span> He taps the brightness knob...<br><br><em><span style='color: rgb(143, 190, 255);'>\“Assume I half the brightness with each click; starting at 100%, how many clicks before the lights dim below 1%?\"</span></em>`,
            reveal: `<span style="color: rgb(143, 190, 255);">7 clicks! By halves = 100 → 50 → 25 → 12.5 → 6.25 → 3.125 → 1.563 → 0.781%.
                    It drops below 1% after the <b>7th</b> click.</span>`,
            requireRevealToAdvance: true
            },
            {
            img: PRO_IMG("breakerBox.png"),
            text: `You give it your best guess. The dino grins, grabs the ON/OFF switch, and snaps it clean to <span style="color: rgb(143, 190, 255);"><b>OFF</b></span>.<br><br>The generator coughs twice, causing the moths to scatter, and the bugless floodlight exhales its final beam into darkness.`,
            reveal: `He laughs, <span style='color: rgb(143, 190, 255);'>\“Honestly, I was gonna kill the lights either way! Zero was the only number good enough for these lights!\"</span>`,
            requireRevealToAdvance: true
            },
            {
            img: PRO_IMG("moonChain.png"), // your circle sigil art
            text: `With the field light gone, the night finally settles in. The tiny dino fishes something from his pocket and sets it in your palm: <span style="color: rgb(143, 190, 255);">A full moon on a stubby little chain</span>.<br><br>The <span style="color: rgb(143, 190, 255);">Moon</span> glows cool and steady. Craters crisping, the keychain casts a pale light across your fingers, while the tents around you settle into a din of whispers.`,
            reveal: `You receive the <span style="color: rgb(143, 190, 255);"><b>MoonChain</b></span>.`,
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
        title: '<span style="color: rgb(164, 255, 164);">More Syrup Bubbles</span>',
        img: PRO_IMG('scienceGuy2.png'),
        text: `Under a humming camp light, Dr. Kenny Fields runs a tidy pop-up lab outside MathTips Village.<br><br><span style='color: rgb(164, 255, 164);'>\"I’ve almost got it now,\"</span> he says. <span style='color: rgb(164, 255, 164);'>\"The bubbles float, kiss the pancake, and coat it perfectly.\"</span> Then he laments, <span style='color: rgb(164, 255, 164);'>\"And yet! The moment it pops, the flavor dissapears!\"</span><br><br><span style='color: rgb(164, 255, 164);'>\"I need flavor that survives the pop. If you spot any ratio tricks, send them my way...\"</span>`,

        // ✅ bonus screen only if player holds the *square* (mint) item
        // NOTE: change ItemIds.MINT_SQUARE to your actual square item id (e.g. SQUARE_SIGIL, SQUARE_CHIP, etc.)
        extraWhen: (appState) => appState.hasItem?.(ItemIds.SQUARE_SHARD),

        extra: {
            title: '<span style="color: rgb(164, 255, 164);">Mint Recipe, Eh?</span>',
            img: PRO_IMG('mintSquare.png'),   // any square/mint art you’ve got
            text: `You flash a small <b>square</b> that glows cool-green. Fields’ smile widens, one of recognition, not surprise.<br><span style='color: rgb(164, 255, 164);'>\"Mint Square? Classic,\"</span> he says. <span style='color: rgb(164, 255, 164);'>\"That’s one of the first ratios folks try at SnowCone MathFest.\"</span><br><br><span style='color: rgb(164, 255, 164);'>\"Good instincts. But believe me, I’ve run that one all night before. It floats, kisses, and even perfectly coats. But the moment it pops, the flavor ghosts.\"</span><br><br><span style='color: rgb(164, 255, 164);'>\"Plus,\"</span> he smiles, <span style='color: rgb(164, 255, 164);'>\"My recipe can't use <em>mint</em>.\"</span>`
        }
      },
    },

    // 4) Last slide — go to Chapter 2, with dynamic side paths
    {
      title: 'Back to the Truck',
      img: PRO_IMG('jehnkNews.png'),
      text: `<span style='color: rgb(247, 255, 105);'>\"Alright, map-finder… what’d the festival trade you for your time?\"</span> He breathes through his nose, <span style='color: rgb(247, 255, 105);'>\"Mmm. That’s mint. And… lime? You been reading recipe cards in the mist?\"</span><br><br>He taps the truck door twice—clink, clink. <span style='color: rgb(247, 255, 105);'>\"Out here, math is a language and items are verbs.\"</span>`,

      role: SlideRole.ADVANCE,

      // Top choice: go straight into Chapter 2
      topLabel: () => 'Go to Chapter 2 ➡️',
      nextChapterId: 'ch2',
      requireVisited: ['weird','loop'],

      // Side choices: dynamic descriptors
      loopLabel: 'Question the Recipes</span>',
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
  title: '<span style="color: rgb(247, 255, 105);">Question the Recipes</span>',
  img: PRO_IMG('jehnkRecipe.png'),
  text: `
    Jehnk flips a stained card onto the counter. <i><span style='color: rgb(247, 255, 105);'>\"Ratios are stories and Math has the flavors.\"</span></i><br><br>
    <b><span style='color: rgb(143, 190, 255);'>\“Blue\"</span></b> is momentum — smooth and quick; a trifecta of flavor that spikes if you rush the sugar.<br>
    <b><span style='color: rgb(164, 255, 164);'>\"Green\"</span></b> is patience — mint arrives to help the tempers cool down; once the cool is reached, the answer arrives.<br>
    <b><span style='color:rgb(217, 164, 255);'>\"Purple\"</span></b> is depth — circles need a quiet flashlight of citrus so the bass notes don’t go muddy.`
},


      quest: {
        title: '<span style="color: rgb(247, 255, 105);">Pocket Check</span>',
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
                text: `On the tailgate, sits a <span style="color: rgb(143, 190, 255);">frost-bit shard</span>, a <span style="color: rgb(164, 255, 164);">mint-square ratio</span>, and a <span style="color:rgb(217, 164, 255);">moonlit chain</span>. Three pieces; one method waiting to click.`,
                reveal: `These are the festival’s three essentials: <span style="color: rgb(143, 190, 255);"><b>Chill</b> (the shard’s cryo snap)</span>, <span style="color: rgb(164, 255, 164);"><b>Flavor</b> (that 2:3 mint-lime choir)</span>, and <span style="color: rgb(217, 164, 255);"><b>Shapes</b> (the moon’s perfect loop guiding the spiral)</span>.<br><br>
                        Line them up and you get the method: <span style="color: rgb(143, 190, 255);"><i>Chill</span> → <span style="color: rgb(164, 255, 164);">Mix</span> → <span style="color: rgb(217, 164, 255);">Shape</span></i>. The truck lights breathe brighter, like it knows what comes next.`,
                        requireRevealToAdvance: true
                },
                {
                img: PRO_IMG('essentialsTrio2.png'),
                imgAlt: 'Triangle Shard, Mint Square 2:3 recipe, and MoonChain spiraling together into a single flow.',
                text: `You lift them up: <span style="color: rgb(143, 190, 255);">cold breath</span>, a <span style='color: rgb(164, 255, 164);'>\"glowing 2:3</span>, and a steady <span style='color:rgb(217, 164, 255);'>\"lunar spin</span>. The ingredients begin to meld.`,
                reveal: `The pieces <i>lock together</i> with a little cosmic jingle—first a <span style="color: rgb(143, 190, 255);">chill tone</span>, then a <span style="color: rgb(164, 255, 164);">bright 2:3 chord</span>, then a soft <span style="color:rgb(217, 164, 255);">lunar hum</span>. A halo of neon notes lift from your workbench as the mixture stabilizes.<br><br>
                        <span style="color: rgb(143, 190, 255);"><b>Chill anchors</b></span>. <span style="color: rgb(164, 255, 164);"><b>Flavor harmonizes</b></span>. <span style="color: rgb(217, 164, 255);"><b>Shape guides</b></span>.<br>
                        The Perfect SnowCone is ready to be born.`,
                        requireRevealToAdvance: true
                },
                {
                img: PRO_IMG('essentialsTrio3.png'),
                text: `Jehnk cues the finale: pack some <span style="color: rgb(217, 164, 255);">ice</span>, pour a steady <span style="color: rgb(164, 255, 164);">syrupy ribbon</span>, finish with a signature <span style="color: rgb(143, 190, 255);">triangle crest</span>.`,
                reveal: `<span style="color: rgb(247, 255, 105);"><b>The Perfect SnowCone has been crafted!</b></span> Neon bubbles rise and drift like little planets, as the cone gleams in the 2AM glow.<br><br>
                        The stack sings in three parts—<span style="color: rgb(143, 190, 255);"><b>Chill</b></span> holds the shape, <span style="color: rgb(164, 255, 164);"><b>Flavor</b></span> rings out minty brightness, <span style="color: rgb(217, 164, 255);"><b>Geometry</b></span> keeps the swirl honest. Jehnk grins: <span style='color: rgb(247, 255, 105);'>\"Now you're trained to work the truck!\"</span> 🫧🍧`,
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
        title: '<span style="color: rgb(247, 255, 105);">A Bubble Follows You</span>',
        img: PRO_IMG('syrupBubble.png'), // close-up bubble near ear w/ triangle reflections
        imgAlt: 'A shimmering syrup bubble floating by your ear, reflecting glowing triangles.',
        text: `A syrup bubble drifts by, reflecting triangles that weren’t there a second ago.<br><br><span style='color: rgb(247, 255, 105);'>\"This must be the work of none other than Dr. Kenny Fields,\"</span> Jehnk muses. <span style='color: rgb(247, 255, 105);'>\"He’s been experimenting with festival syrup bubbles for pancakes, but never tells anyone that they will follow you around!\"</span><br><br>He points, <span style='color: rgb(247, 255, 105);'>\"You’ve got one floating right by your ear, as we speak!\"</span>`,

        // 👇 new: force the CTA copy on this slide
        extraLabel: 'Reveal More',

        // 🔓 follow-up is contingent on Work Badge
        extraWhen: (appState) => appState?.hasItem?.(ItemIds.WORK_BADGE),

        extra: {
            title: '<span style="color: rgb(247, 255, 105);">Three Days of Bubbles</span>',
            img: PRO_IMG('fieldsBubbleStory.png'),
            imgAlt: 'Jehnk and Dr. Kenny Fields surrounded by neon syrup bubbles over the festival tents at 2AM.',
            text: `Jehnk thinks back, grinning his way into the story, <span style='color: rgb(247, 255, 105);'>\"Me and Dr. Kenny Fields? Yeah, we tuned syrups together for a long time, made a lot of money at pancake festivals...<br><br>Then Kenny got obsessed with bubbles. Not just a few...like, an entire weather system of bubbles. They swarmed the 1997 Flapjack Forum and wouldn’t pop unless you danced on 'em.<br><br>Whole festival had to form a conga line and we, no joke, danced those bubbles out for three days straight. Best cardio of my life, but the worst cleanup ever!\"</span>`,
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


