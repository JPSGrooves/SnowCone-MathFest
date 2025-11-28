// src/modes/storyMode/chapters/ch3.js
import { SlideRole, ItemIds } from '../../../data/storySchema.js';
import { appState as globalAppState } from '../../../data/appState.js';
import { pickupPing } from '../ui/pickupPing.js';
import { awardBadge } from '../../../managers/badgeManager.js';

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
      title: 'Start of the Show',
      img: PRO_MED_IMG('jehnkNews.png'), // same art for now
      text: `Jehnk leans back to finish his newspaper, stage lights flickering off his shades.<br>
      <span style="color: rgb(247, 255, 105);">"Best part of SnowCone MathFest?"</span> he asks. <span style="color: rgb(247, 255, 105);">"THE MUSIC! ${playerName}, you can sling cones forever, but if you never see the acts, you’ll miss half the math."</span>`,
      soloLabel: 'Next ➡️',
    },

    // 1) Intro – Jehnk sends you to the music (part 2)
    {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Follow the Sound',
      img: PRO_MED_IMG('jehnkNod.png'), // can swap to a wider festival shot later if you want
      text: `He references the legendary music of SnowCone MathFest:<br><span style="color: rgb(61, 229, 255);">Cosmic Phil</span> over at QuickServe,<br><span style="color: rgb(164, 255, 164);">Infinity Triplets</span> looping by Infinity Lake,<br><span style="color: rgb(217, 164, 255);">Grampy P</span> by his tent in MathTips Village.<br><br><span style="color: rgb(247, 255, 105);">"Clock out for a minute. Go see what the ghosts are dancing to."</span>`,
      soloLabel: 'Go to QuickServe Pavilion ➡️',
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
      text: `The QuickServe Pavilion glows like a cracked open jukebox glowstick.<br>
      The lights pulse and crowds gather 'round to hear the headline act:<br><span style="color: rgb(61, 229, 255);">Cosmic Phil.</span>`,
      soloLabel: 'Move Closer ➡️',
    },

    // QuickServe Pavilion – part 2
    {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Cosmic Phil',
      img: PRO_MED_IMG('phil_06_hype.png'), // same scene for continuity
      text: `Already up on stage, <span style="color: rgb(61, 229, 255);">Cosmic Phil</span> jumps in the air with his trademark cosmic keytar.<br><br>His looping fingers put jazzy chords on full display, keys on fire, always dishing out the tastiest 2 minute grooves.`,
      soloLabel: 'You see someone you know ➡️',
    },

    // Kool Kat’s Review – part 1
    {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'So we meet again...',
      img: PRO_MED_IMG('koolKatStage.png'),
      text: `You catch <span style="color: rgb(61, 229, 255);">Kool Kat</span> vending the pavilion, slipping SnowCones to the front row like they’re backstage passes. You nudge up beside her at the rail.<br><br><span style="color: rgb(61, 229, 255);">"Phil is killing it tonight,"</span> she yells.<span style="color: rgb(61, 229, 255);">"He brings the best crowds to the festival and always creates the most cosmic vibes."</span>`,
      soloLabel: 'Tell me more...➡️',
    },

    // Kool Kat’s Review – part 2
    {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Origins of Cosmic Phil',
      img: PRO_IMG('koolKatStage2.png'),
      text: `She nods at the stage, where tiny lights climb and fall into sine waves.<br><br><span style="color: rgb(61, 229, 255);">"Phil used to play parking lots,"</span> she shouts over the crowd. <span style="color: rgb(61, 229, 255);">"He’d loop the sound of cars rolling in, fans standing in line, cones getting shaved… then flip all that noise into a groove."</span><br><br><span style="color: rgb(61, 229, 255);">"Now he does the same thing with us,"</span> she gloats. <span style="color: rgb(61, 229, 255);">"He builds a loop from whoever shows up and runs it into one full batch. That’s Phil—keeping the structure, scrambling the flavors, and making every set feel like the festival is lining up just for you."</span>`,
      soloLabel: 'A Quick Question...➡️',
    },

    {
      role: SlideRole.ADVANCE,
      mode: 'quiz3',
      title: 'Concert Vibes',
      text: `Kat is struck with a curious question:<br><span style="color: rgb(61, 229, 255);">\"So, ${playerName}… if someone wants to really vibe with Cosmic Phil tonight, What's the move?\"</span>`,
      quiz: {
        options: [
          {
            id: 'a',
            label: 'Listen for the keytar solo and holler at the peak.',
            correct: true,
            praise: `Exactly! Cosmic Phil's solos try to break the cosmic structure!`,
          },
          {
            id: 'b',
            label: 'Worry about who might be watching while you do a silly dance.',
            correct: false,
            praise: `Trust your dance and you'll inspire others. No shame here!.`,
          },
          {
            id: 'c',
            label: 'Talk loudly to people around you while the concert is going on.',
            correct: false,
            praise: `Shhh..at least during the quiet parts. Try again.`,
          },
        ],
        advanceLabel: 'Before you go… ➡️',
      },
    },
        {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Festival Duties',
      img: PRO_MED_IMG('koolKatStage3.png'),
      text: `Her friend, <span style="color: rgb(219, 61, 255);">Mr. Leo</span>, appears out of nowhere and lets her know it's time to switch shifts...
      <span style="color: rgb(61, 229, 255);">"Welp, that's my queue! We all work this fest in one way or another. But I decided a long time ago that I was going to enjoy every day, that includes work and play!"</span>`,
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
      text: `You follow a shimmer of reverb down to <span style="color: rgb(164, 255, 164);">Infinity Lake</span>. You remember Banneker humming the tune and get excited that you made it this far.<br><br>You see three silhouettes practicing in a lit up tent, preparing for a set on a floating dock, hands over the water—<br><span style="color: rgb(164, 255, 164);">The Infinity Triplets</span>.`,
      soloLabel: 'Next ➡️',
    },

    // Infinity Lake – part 2
    {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Meticulous Echoes',
      img: PRO_MED_IMG('fieldsInfinity.png'),
      text: `<span style="color: rgb(164, 255, 164);">Dr. Kenny Fields</span>, taking a break from syrup and pancakes, has rigged the lake with little buoy lights that pulse on each echo.<br><br><span style="color: rgb(164, 255, 164);">"Every echo is being trained to send out a calbrated bubble; every bubble doubles back in time and then double bubbles."</span>`,
      soloLabel: 'Verify Results ➡️',
    },

    {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Verifying Results',
      img: PRO_IMG('ratioFields.png'),
      text: `He leans back and checks the echoes with headphones.<br><span style="color: rgb(164, 255, 164);">\"The Infinity Triplets always run three echoes per beat,\"</span> he shouts over the water. <span style="color: rgb(164, 255, 164);">\"The first echo is for the stage, the second for the lake, and the third for the sky.\"</span><br><br>He points to the buoys. <span style="color: rgb(164, 255, 164);">\"I'm trying to keep the lake honest, it's same tempo every time but the lake hides their mysteries. These Triplets expertly change the *spacing* between echoes, creating perfect loops with an organic feel. That’s why it feels endless but never lost.\"</span>`,
      soloLabel: 'A Quick Question...➡️',
    },
    {
      role: SlideRole.ADVANCE,
      mode: 'quiz3',
      title: 'Fields Tests Your Echo',
      text: `<span style="color: rgb(164, 255, 164);">\"One last check, ${playerName}. What’s the trick that makes an Infinity Triplets set feel infinite but still grounded?\"</span>`,
      quiz: {
        options: [
          {
            id: 'a',
            label: 'They change the tempo randomly so no one can predict the next clap.',
            correct: false,
            praise: `Nope! Random tempo changes would just feel chaotic, not infinite.`,
          },
          {
            id: 'b',
            label: 'They keep the loop length steady, but only change how the three echoes are spaced inside it.',
            correct: true,
            praise: `Yep! Fixed loop, flexible spacing—Infinity in a frame.`,
          },
          {
            id: 'c',
            label: 'They play a giant echo until sunrise and then go home.',
            correct: false,
            praise: `Nah...That’d be dramatic, but hardly endless.`,
          },
        ],
        advanceLabel: 'One more jam...➡️',
      },
    },
        {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Sittin at the Dock',
      img: PRO_MED_IMG('fieldsJamming.png'),
      text: `Music helps Fields to break free from infinite experimenting and he always finds his way back to it...
      <span style="color: rgb(164, 255, 164);">"Ah, there it is! The perfect balance of predictability and surprise. I could analyze The Infinity Triplets all day, but it's just as important to settle down and listen to the music!"</span>`,
      soloLabel: 'Go to MathTips Village ➡️',
    },

    // ─────────────────────────────────────────
    // GRAMPY P – MathTips Village (3 slides)
    // ─────────────────────────────────────────
    {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'MathTips Village',
      img: PRO_IMG('mathTipsVillage.png'),
      text: `The noise of the stages fades into a low hum as you wander into:<br><span style="color: rgb(217, 164, 255);">MathTips Village</span>.<br><br>Lanterns gleam from tent poles. Whiteboards glow softly. In the middle of it all, <span style="color: rgb(217, 164, 255);">Grampy P</span> sits by his tent with a notebook and a SnowCone, just listening.<br><br>These days, he’s not teaching, not preaching—just watching patterns walk by. Always ready to jot down a thought or a question, he really just wants to here what you know.`,
      soloLabel: 'Tell me more...➡️',
    },
    // Grampy’s Neighbor – part 1
    {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Grampy P',
      img: PRO_MED_IMG('grampyP.png'),
      text: `<span style="color: rgb(217, 164, 255);">"I used to sit at a desk and circle wrong answers all day,"</span> he admits softly. <span style="color: rgb(217, 164, 255);">"Out here, I just listen. I care way more about the story behind your mistake than the mistake itself. If you tell me what you were trying to do, we’re already doing math together."</span>`,
      soloLabel: 'See him still teaching ➡️',
    },
    // Grampy’s Neighbor – part 2
    {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Grampy’s Lesson',
      img: PRO_MED_IMG('grampyLesson.png'),
      text: `A ring of tiny dinosaur campers crowds around his chalkboard, tails swishing in the dust.<span style="color: rgb(217, 164, 255);">"See, little ones,"</span> Grampy P says, pointing to the equation, <span style="color: rgb(217, 164, 255);">"every tough problem is just a story with a monster."</span><br><br><span style="color: rgb(217, 164, 255);">"When you show your work, we can usually spot the monster. The trick? Find the monster, then you can tell it what to do."</span>`,
      soloLabel: 'A question for you… ➡️',
    },

    {
      role: SlideRole.ADVANCE,
      mode: 'quiz3',
      title: 'Grampy P Tests You…',
      text: `Grampy P gives you a small nod past his guitar,<br><span style="color: rgb(217, 164, 255);">\"Alright, ${playerName}, tell me now,\"</span> he murmurs. <span style="color: rgb(217, 164, 255);">\"What do you think I care about most out here?\"</span>`,
      quiz: {
        options: [
          {
            id: 'a',
            label: 'Making sure every answer is perfectly correct the first time.',
            correct: false,
            praise: `<span style="color: rgb(217, 164, 255);">If that were true, I’d be grading instead of listening. Keep going.</span>`,
          },
          {
            id: 'b',
            label: 'Collecting as many rare SnowCones as possible.',
            correct: false,
            praise: `<span style="color: rgb(217, 164, 255);">Nah...I love SnowCones, but that’s not what I'm most concerned with.</span>`,
          },
          {
            id: 'c',
            label: 'Hearing what people think and the questions they’re carrying.',
            correct: true,
            praise: `<span style="color: rgb(217, 164, 255);">Yep! The thinking and the questions—that’s my favorite part.</span>`,
          },
        ],
        advanceLabel: '"Hey, wait up!" ➡️',
      },
    },
        {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Grampy’s Neighbor',
      img: PRO_MED_IMG('grampyPoint.png'),
      text: `Grampy P knows you can't stay, but runs over to give you a warm farewell, <span style="color: rgb(217, 164, 255);">"I'll be here if you ever need a fraction lesson, haiku, joke, or to know how much to tip your waiter!"</span><br><br>He notices a hooded dino behind you in the bushes, <span style="color: rgb(217, 164, 255);">"Although, it looks like someone else wants your attention. See ya!"</span>`,
      soloLabel: 'He points to the dino ➡️',
    },

    // ─────────────────────────────────────────
    // Dino encounter + trade
    // ─────────────────────────────────────────
    {
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'A Familiar Hood',
      img: PRO_MED_IMG('hoodedDinoPath.png'),
      text: `<span style="color: rgb(61, 229, 255);">"Psst!"</span>The small hooded dino calls from the shadows—the same dino who killed the floodlights and slipped you the MoonChain...<br>He tilts his head, eyes catching the glow from your pockets.<span style="color: rgb(61, 229, 255);">"Are your pockets feeling a little full?"</span>`,
      soloLabel: 'Go talk to the dino ➡️',
    },

            {
    role: SlideRole.ADVANCE,
    mode: 'choice3',
    title: 'The Trade?',
    img: PRO_IMG('dinoTrade.png'),
    text: `He eyes <span style="color: rgb(247, 255, 105);">The Perfect SnowCone</span> in your inventory.<br>From his hoodie pocket, he pulls a <b>beat-up cell phone</b>—cracked screen, dented sides, but battery icon somehow full. He says:<br><span style="color: rgb(61, 229, 255);">\"We should trade!\"</span>`,
    choiceAdvanceLabel: 'The Dino Dips Out ➡️',
    bigChoices: true,
    choices: [
        {
        id: 'trade',
        label: 'Trade for the beat-up phone',
        praise: `<span style="color: rgb(61, 229, 255);">The dino grins, \"Good call!\"</span>`,
        onSelect: ({ appState }) => {
            try {
            // 🔹 record the latest choice
            appState.flags = appState.flags || {};
            appState.flags.ch3_tradeChoice = 'trade';

            // 🔹 inventory effects
            const hasPerfect = appState?.hasItem?.(ItemIds.MASTER_SIGIL);
            if (hasPerfect) {
                if (typeof appState.consumeItems === 'function') {
                appState.consumeItems([ItemIds.MASTER_SIGIL]);
                } else {
                appState.removeItem?.(ItemIds.MASTER_SIGIL);
                }
            }
            } catch (e) {
            console.warn('[ch3 trade] failed to consume Perfect SnowCone or set flag:', e);
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
        praise: `<span style="color: rgb(61, 229, 255);">The dino shrugs, \"Maybe next time...\"</span>`,
        onSelect: ({ appState }) => {
            try {
            appState.flags = appState.flags || {};
            appState.flags.ch3_tradeChoice = 'keep';
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
      text: `The hooded dino nods once and darts back into the branches.<br><br>He cryptically states, <span style="color: rgb(61, 229, 255);">"Only way out is through the forest!"</span> You pat your full inventory bag and follow the sound of his crunching leaves, heading deeper and deeper into the woods.`,
      soloLabel: 'Follow the Dino...➡️',
    },

  // Into the Trees – part 2
  {
    role: SlideRole.ADVANCE,
    mode: 'solo',
    title: 'The Endless Meander',
    img: PRO_IMG('forestPath.png'),
    text: `You're stepping completely away from the festival. The bass fades first, then the crowd noise, like someone slowly turning down a dial.<br><br>The hooded dino's voice lingers—<span style="color: rgb(61, 229, 255);">“the only way out”</span>—looping in your head like a half-finished lyric.<br><br>What did that tiny dino mean? Out of the forest? Out of the festival? Out of whatever this whole thing really is?<br><br>Each step feels less like exploring a festival and more like walking into the questions behind it.`,
    soloLabel: 'Keep walking ➡️',
    nextChapterId: 'ch4',
  },


  ],
  onFinish: ({ appState }) => {
    const a = appState || globalAppState;
    try {
      awardBadge('story_ch3');
      a.saveToStorage?.();
    } catch (e) {
      console.warn('[ch3] onFinish failed', e);
    }
  },
};
