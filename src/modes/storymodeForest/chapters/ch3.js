// src/modes/storyMode/chapters/ch3.js
import { SlideRole, ItemIds } from '../../../data/storySchema.js';
import { appState as globalAppState } from '../../../data/appState.js';
import { pickupPing } from '../ui/pickupPing.js';

const BASE = import.meta.env.BASE_URL;
const PRO_IMG      = (n) => `${BASE}assets/img/characters/storyMode/${n}`;
const PRO_MED_IMG  = (n) => `${BASE}assets/img/characters/storyMode/${n}?md=1`;   // 👈 NEW: medium portraits
const PRO_BIG_IMG  = (n) => `${BASE}assets/img/characters/storyMode/${n}?lg=1`;   // existing “hero” size

const SCN_IMG      = (n) => `${BASE}assets/img/modes/storymodeForest/${n}`;
const SCN_MED_IMG  = (n) => `${BASE}assets/img/modes/storymodeForest/${n}?md=1`;  // 👈 NEW: medium scenes
const SCN_BIG_IMG  = (n) => `${BASE}assets/img/modes/storymodeForest/${n}?lg=1`;  // existing “hero” size


// pull username once at module load
const playerName = (() => {
  try {
    const raw = globalAppState.profile?.username;
    const name = (raw && String(raw).trim()) || 'Friend';
    return name;
  } catch {
    return 'Friend';
  }
})();

export const Chapter3 = {
  id: 'ch3',
  title: 'The Acts',
  slides: [
    // 0) Intro – Jehnk sends you to the music (part 1)
    {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Follow the Sound',
      img: PRO_MED_IMG('jehnkNews.png'), // same art for now
      text: `Jehnk leans back to finish his newspaper, stage lights flickering off his shades.<br>
      <span style="color: rgb(247, 255, 105);">"Best part of SnowCone MathFest?"</span> he grins. <span style="color: rgb(247, 255, 105);">"THE MUSIC! ${playerName}, you can sling cones forever, but if you never see the acts, you’ll miss half the math."</span>`,
      soloLabel: 'Next ➡️',
    },

    // 1) Intro – Jehnk sends you to the music (part 2)
    {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Follow the Sound',
      img: PRO_MED_IMG('jehnkNod.png'), // can swap to a wider festival shot later if you want
      text: `He points across the grounds:<br><span style="color: rgb(143, 190, 255);">Cosmic Phil</span> at the QuickServe Pavilion,<br><span style="color: rgb(164, 255, 164);">Infinity Triplets</span> looping by Infinity Lake,<br>and <span style="color: rgb(217, 164, 255);">Grampy P</span> tucked in by his tent at MathTips Village.<br><br><span style="color: rgb(247, 255, 105);">"Clock out for a minute. Go see what the ghosts are dancing to."</span>`,
      soloLabel: 'Head to the first stage ➡️',
    },


    // ─────────────────────────────────────────
    // COSMIC PHIL – QuickServe Pavilion (3 slides)
    // ─────────────────────────────────────────
    // QuickServe Pavilion – part 1
    {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'QuickServe Pavilion',
      img: PRO_BIG_IMG('qsPavilion.png'), // pavilion art
      text: `The QuickServe Pavilion glows like a jukebox cracked open.<br>
      Order boards flicker, mixers pulse, and the line moves in sync with the beat.`,
      soloLabel: 'Next ➡️',
    },

    // QuickServe Pavilion – part 2
    {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'QuickServe Pavilion',
      img: PRO_MED_IMG('phil_06_hype.png'), // same scene for continuity
      text: `Up on stage, <span style="color: rgb(143, 190, 255);">Cosmic Phil</span> rides a stack of samplers, looping fryer hiss, cup clacks, and register beeps into a steady 1:45 groove.`,
      soloLabel: 'Move into the crowd ➡️',
    },

    // Kool Kat’s Review – part 1
    {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Kool Kat’s Review',
      img: PRO_MED_IMG('koolKatStage.png'),
      text: `Kool Kat is vending the pavilion, slipping SnowCones to the front row like they’re backstage passes.<br>You nudge up beside Kool Kat at the rail.<br>
      <span style="color: rgb(143, 190, 255);">"Phil records the line,"</span> she says.
      <span style="color: rgb(143, 190, 255);">"Every order’s a sample. Every ‘Next!’ is a snare drum."</span>`,
      soloLabel: 'Next ➡️',
    },

    // Kool Kat’s Review – part 2
    {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Kool Kat’s Review',
      img: PRO_MED_IMG('koolKatStage2.png'),
      text: `She nods at the scoreboard.
      <span style="color: rgb(143, 190, 255);">"He builds a loop, runs it for one full batch, then flips the recipe on the next chorus. Same timing, new pattern. That’s his whole thing—keep the structure, scramble the flavors."</span>`,
      soloLabel: 'Before you go… ➡️',
    },
    {
      role: SlideRole.ADVANCE,
      mode: 'quiz3',
      title: 'Cosmic Phil – Before You Go…',
      text: `Kool Kat tilts her sunglasses toward you.<br><span style="color: rgb(143, 190, 255);">\"So, ${playerName}… if you wanted to really vibe with Cosmic Phil tonight, what’s the move?\"</span>`,
      quiz: {
        options: [
          {
            id: 'a',
            label: 'Listen for the loop length and noticehow the recipe changes.',
            correct: true,
            praise: `Exactly! Cosmic Phil lives on structure with shifting details.`,
          },
          {
            id: 'b',
            label: 'Ignore the beat and just count how many people leave the line.',
            correct: false,
            praise: `That’s crowd control math, not Cosmic Phil’s deal. Try again.`,
          },
          {
            id: 'c',
            label: 'Talk loudly to people around you while the concert is going on.',
            correct: false,
            praise: `Shhh..if you were talking about the show it would've been fine...`,
          },
        ],
        advanceLabel: 'Before you go… ➡️',
      },
    },
        {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Kool Kat’s Review',
      img: PRO_MED_IMG('koolKatStage3.png'),
      text: `Her friend appears and lets her know its time to switch shifts...
      <span style="color: rgb(143, 190, 255);">"Welp, that's my queue! We all work this fest in one way or another, just try to have fun along the way and you'll enjoy every day!"</span>`,
      soloLabel: 'Head to Infinity Lake ➡️',
    },

    // ─────────────────────────────────────────
    // INFINITY TRIPLETS – Infinity Lake (3 slides)
    // ─────────────────────────────────────────
    // Infinity Lake – part 1
    {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Infinity Lake',
      img: PRO_MED_IMG('infinityLakeStage.png'),
      text: `You follow a shimmer of reverb down to Infinity Lake.<br><br>
      Three silhouettes stand on a floating dock, hands over the water—
      <span style="color: rgb(164, 255, 164);">the Infinity Triplets</span>.`,
      soloLabel: 'Next ➡️',
    },

    // Infinity Lake – part 2
    {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Infinity Lake',
      img: PRO_MED_IMG('fieldsInfinity.png'),
      text: `Dr. Kenny Fields has rigged the lake with little buoy lights that pulse on each echo.<br>
      Every clap throws a ring; every ring doubles back in time.`,
      soloLabel: 'Move into the crowd ➡️',
    },

    {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Dockside Fan',
      img: PRO_MED_IMG('ratioFields.png'),
      text: `A fan in a rain poncho leans over the rail beside you.<br><span style="color: rgb(164, 255, 164);">\"Triplets always run three echoes per beat,\"</span> they shout over the water. <span style="color: rgb(164, 255, 164);">\"First echo for the stage, second for the lake, third for the sky.\"</span><br><br>
      They point to the buoys. <span style="color: rgb(164, 255, 164);">\"Kenny keeps the lake honest—same tempo every time. The Triplets only change the *spacing* between echoes, never the total loop. That’s why it feels endless but never lost.\"</span>`,
      soloLabel: 'Before you go… ➡️',
    },
    {
      role: SlideRole.ADVANCE,
      mode: 'quiz3',
      title: 'Infinity Triplets – Before You Go…',
      text: `The fan grabs the rail.<br><span style="color: rgb(164, 255, 164);">\"One last check, ${playerName}. What’s the trick that makes an Infinity Triplets set feel infinite but still grounded?\"</span>`,
      quiz: {
        options: [
          {
            id: 'a',
            label: 'They keep changing tempo randomly so no one can predict the next clap.',
            correct: false,
            praise: `Random tempo changes would just feel chaotic, not infinite. Try again.`,
          },
          {
            id: 'b',
            label: 'They keep the overall loop length steady while only changing how the three echoes are spaced inside it.',
            correct: true,
            praise: `Yep. Fixed loop, flexible spacing—Infinity in a frame.`,
          },
          {
            id: 'c',
            label: 'They play a giant echo until sunrise and then go home.',
            correct: false,
            praise: `That’d be dramatic, but not the Triplets’ way.`,
          },
        ],
        advanceLabel: 'Walk to MathTips Village ➡️',
      },
    },
        {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Dockside Fan',
      img: PRO_MED_IMG('fieldsJamming.png'),
      text: `Fields finds his way to the music again...
      <span style="color: rgb(164, 255, 164);">"Ah, there it is! The perfect balance of predictability and surprise. Just like math!"</span>`,
      soloLabel: 'Before you go… ➡️',
    },

    // ─────────────────────────────────────────
    // GRAMPY P – MathTips Village (3 slides)
    // ─────────────────────────────────────────
    {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'MathTips Village',
      img: PRO_MED_IMG('mathTipsVillage.png'),
      text: `The noise of the stages fades into a low hum as you wander into MathTips Village.<br>Lanterns hang from tent poles. Whiteboards glow softly. In the middle of it all, <span style="color: rgb(217, 164, 255);">Grampy P</span> sits by his tent with a notebook and a SnowCone, just listening.<br>He’s not teaching, not preaching—just watching patterns walk by.`,
      soloLabel: 'Move into the crowd ➡️',
    },
    // Grampy’s Neighbor – part 1
    {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Grampy’s Neighbor',
      img: PRO_BIG_IMG('grampyP.png'),
      text: `A nearby camper taps their pencil against a clipboard.<br><br>
      <span style="color: rgb(217, 164, 255);">"Grampy P’s whole thing is *questions*,"</span> they say.
      <span style="color: rgb(217, 164, 255);">"He doesn’t grade you. He just wants to know how you’re thinking."</span>`,
      soloLabel: 'Next ➡️',
    },

    // Grampy’s Neighbor – part 2
    {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Grampy’s Neighbor',
      img: PRO_MED_IMG('grampyLesson.png'),
      text: `They nod at his notebook.
      <span style="color: rgb(217, 164, 255);">"He writes down good questions like he’s collecting rare trading cards. Math, feelings, stories—it all goes in the same journal."</span>`,
      soloLabel: 'Before you go… ➡️',
    },
    {
      role: SlideRole.ADVANCE,
      mode: 'quiz3',
      title: 'Grampy P – Before You Go…',
      text: `Grampy P gives you a small nod over the rim of his cone.<br><span style="color: rgb(217, 164, 255);">\"Alright, ${playerName}, one last check-in,\"</span> he murmurs. <span style="color: rgb(217, 164, 255);">\"What do you think I care about most out here?\"</span>`,
      quiz: {
        options: [
          {
            id: 'a',
            label: 'Making sure every answer is perfectly correct the first time.',
            correct: false,
            praise: `<span style="color: rgb(217, 164, 255);">If that were true, I’d be grading instead of listening. Try again.</span>`,
          },
          {
            id: 'b',
            label: 'Collecting as many rare SnowCones as possible.',
            correct: false,
            praise: `<span style="color: rgb(217, 164, 255);">I like cones, but that’s not what I'm most concerned with.</span>`,
          },
          {
            id: 'c',
            label: 'Hearing what people think and the questions they’re carrying.',
            correct: true,
            praise: `<span style="color: rgb(217, 164, 255);">Yeah. The thinking and the questions—that’s my favorite part.</span>`,
          },
        ],
        advanceLabel: 'Head back toward the truck ➡️',
      },
    },
        {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Grampy’s Neighbor',
      img: PRO_MED_IMG('grampyPoint.png'),
      text: `Grampy P knows you can't stay, but send a farewell as he points at a dinsoaur trying to get your attention.
      <span style="color: rgb(217, 164, 255);">"I'll be here if you ever need a fractions lesson, haiku, joke, or how much you should tip your waiter. But it looks like that hooded dino over there wants your attention."</span>`,
      soloLabel: 'Before you go… ➡️',
    },

    // ─────────────────────────────────────────
    // Dino encounter + trade
    // ─────────────────────────────────────────
    {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'A Familiar Hood',
      img: PRO_MED_IMG('hoodedDinoPath.png'),
      text: `On your way back to the truck, the path narrows into trees.<br>A small hooded dino pads out of the shadows—the same one who killed the floodlights and slipped you the MoonChain.<br>He tilts his head, eyes catching the glow from your pockets.`,
      soloLabel: 'Go talk to the dino ➡️',
    },

    {
      role: SlideRole.ADVANCE,
      mode: 'choice3',
      title: 'The Trade',
      img: PRO_MED_IMG('dinoTrade.png'),
      text: `His gaze lands on <span style="color: rgb(247, 255, 105);">The Perfect SnowCone</span> in your hand.<br><span style="color: rgb(143, 190, 255);">\"That one doesn’t melt easy,\"</span> he whispers. <span style="color: rgb(143, 190, 255);">\"But neither does this.\"</span><br>From his hoodie, he pulls a <b>beat-up cell phone</b>—cracked screen, dented sides, battery icon somehow full.<br><span style="color: rgb(143, 190, 255);">\"Trade?\"</span>`,
      choiceAdvanceLabel: 'Go into the forest ➡️',
      choices: [
        {
          id: 'trade',
          label: 'Trade the Perfect SnowCone for the beat-up phone',
          praise: `<span style="color: rgb(143, 190, 255);">The dino grins. \"Good call. Some signals don’t show up unless you’re tuned in.\"</span>`,
          onSelect: ({ appState }) => {
            try {
              const hasPerfect = appState?.hasItem?.(ItemIds.MASTER_SIGIL);
              if (hasPerfect) {
                if (typeof appState.consumeItems === 'function') {
                  appState.consumeItems([ItemIds.MASTER_SIGIL]);
                } else {
                  appState.removeItem?.(ItemIds.MASTER_SIGIL);
                }
              }
            } catch (e) {
              console.warn('[ch3 trade] failed to consume Perfect SnowCone:', e);
            }

            try {
              if (!appState.hasItem?.(ItemIds.BEATUP_PHONE)) {
                appState.addItem?.(ItemIds.BEATUP_PHONE, {
                  name: 'Beat-Up Phone',
                  meta: {
                    emoji: '📱',
                    note: 'Cracked screen, full bars somehow.',
                  },
                });
                pickupPing({ emoji: '📱', name: 'Beat-Up Phone', qty: 1 });
              }
              appState.saveToStorage?.();
            } catch (e) {
              console.warn('[ch3 trade] failed to grant Beat-Up Phone:', e);
            }
          },
        },
        {
          id: 'keep',
          label: 'Keep the Perfect SnowCone',
          praise: `<span style="color: rgb(143, 190, 255);">The dino shrugs. \"Some legends gotta be carried, not traded.\"</span>`,
          onSelect: ({ appState }) => {
            // no-op on inventory; just make sure it’s saved
            try {
              appState.saveToStorage?.();
            } catch (e) {
              console.warn('[ch3 trade] save after keep failed:', e);
            }
          },
        },
      ],
    },

    // Into the Trees – part 1
    {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Into the Trees',
      img: PRO_MED_IMG('phoneRun.png'),
      text: `No matter what you chose, the hooded dino nods once and melts back into the branches.<br><br>
      <span style="color: rgb(143, 190, 255);">"Only way out is through the forest,"</span> he calls softly from somewhere you can’t quite see.`,
      soloLabel: 'Next ➡️',
    },

    // Into the Trees – part 2
    {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Into the Trees',
      img: PRO_MED_IMG('forestPath.png'),
      text: `You step off the festival path. The music thins. Crickets and distant subs share a strange, quiet rhythm.<br><br>
      Step by step, you slip deeper between the trunks, wondering what could possibly be next.`,
      soloLabel: 'Keep walking ➡️',
      nextChapterId: 'ch4',
    },

  ],
};
