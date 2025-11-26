// src/modes/storyMode/chapters/ch5.js
import { SlideRole, ItemIds } from '../../../data/storySchema.js';
import { appState as globalAppState } from '../../../data/appState.js';
import { awardBadge } from '../../../managers/badgeManager.js';

const BASE = import.meta.env.BASE_URL;
const PRO_IMG      = (n) => `${BASE}assets/img/characters/storyMode/${n}`;
const PRO_MED_IMG  = (n) => `${BASE}assets/img/characters/storyMode/${n}?md=1`;   // 👈 NEW: medium portraits
const PRO_BIG_IMG  = (n) => `${BASE}assets/img/characters/storyMode/${n}?lg=1`;   // existing “hero” size

const SCN_IMG      = (n) => `${BASE}assets/img/modes/storymodeForest/${n}`;
const SCN_MED_IMG  = (n) => `${BASE}assets/img/modes/storymodeForest/${n}?md=1`;  // 👈 NEW: medium scenes
const SCN_BIG_IMG  = (n) => `${BASE}assets/img/modes/storymodeForest/${n}?lg=1`;  // existing “hero” size

const PERFECT_CONE = ItemIds.MASTER_SIGIL;
const BEATUP_PHONE = ItemIds.BEATUP_PHONE;

const playerName = (() => {
  try {
    const raw = globalAppState.profile?.username;
    const name = (raw && String(raw).trim()) || 'friend';
    return name;
  } catch {
    return 'friend';
  }
})();

export const Chapter5 = {
  id: 'ch5',
  title: 'The Long Loop / The Way Home',
  slides: [
    // 0) Entry router: decides which ending to show
    {
      id: 'c5_entry_router',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Crossing Over',
      img: PRO_MED_IMG('jehnkPortal.png'),
      text: `Portal light folds back into itself like a slow breath.<br><br>
Your decision with Jehnk has already locked into the math of this place.<br><br>
You feel the after-image of the moment hanging in the air, waiting to collapse into one reality or the other.`,
      soloLabel: 'See what became of your choice ➡️',
      onAdvance: ({ appState, engine }) => {
        const a = appState || globalAppState;
        if (!a || !engine) return;

        const chapter = engine.registry[engine.state.chapterId];
        if (!chapter) return;

        // If you STILL have the Perfect SnowCone → “Carry the Festival” ending path
        // If not → “The New Driver” ending path
        const hasPerfect = !!a.hasItem?.(PERFECT_CONE);
        const targetId = hasPerfect
          ? 'c5_keep_cone_ending_1'   // 👈 start of KEEP path
          : 'c5_give_cone_ending_1';  // 👈 start of GIVE path

        const idx = chapter.slides.findIndex((s) => s.id === targetId);
        if (idx >= 0) {
          engine.state.idx = idx;
          engine._renderSlide();
          return 'handled';
        }
        // fallback: let engine advance linearly if something’s weird
        return false;
      },
    },

    // 1) Ending if you KEPT the snowcone and walked through
        // Keep Cone Ending – part 1
    {
      id: 'c5_keep_cone_ending_1',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Carry the Festival',
      img: PRO_MED_IMG('jehnkPortal2.png'),
      text: `You tighten your grip on the Perfect SnowCone.<br><br>
<span style="color: rgb(105, 248, 255);">“I’m sorry,”</span> you tell Jehnk. <span style="color: rgb(105, 248, 255);">“I can’t leave myself stuck here.”</span><br><br>
He studies your face for a long moment, then nods.<br>
<span style="color: rgb(247, 255, 105);">“I get it,”</span> he says quietly. <span style="color: rgb(247, 255, 105);">“Really. Someone should make it out.”</span>`,
      soloLabel: 'Next ➡️',
    },

    // Keep Cone Ending – part 2 (@ You turn toward the portal)
    {
      id: 'c5_keep_cone_ending_2',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Carry the Festival',
      img: PRO_MED_IMG('portalGlow2.png'),
      text: `You turn toward the portal. The closer you walk, the more the cone burns cold in your hand,
every color locking into a perfect ratio of light.<br><br>
You step through.`,
      soloLabel: 'Next ➡️',
    },

    // Keep Cone Ending – part 3 (@ When you open your eyes)
    {
      id: 'c5_keep_cone_ending_3',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Carry the Festival',
      img: PRO_MED_IMG('homeReturn2.png'),
      text: `When you open your eyes, you’re home.<br><br>
No portal. No math ghosts. No hooded dinos. Just your regular life,
waiting patiently like it never left.<br><br>
But everything feels… different.`,
      soloLabel: 'Next ➡️',
    },
        {
      id: 'c5_keep_cone_ending_4',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Carry the Festival',
      img: PRO_MED_IMG('homeReturn3.png'),
      text: `Now, when you solve an equation, you see the stage lights behind it.
Every time a pattern untangles in your head, you hear a distant beat.
Even smashing a random mosquito reminds you of the campsite at Kids Camping,
of the nights when numbers and fireflies were the same kind of magic.`,
      soloLabel: 'Next ➡️',
    },

    // Keep Cone Ending – part 4 (@ Now, when you solve…) – keeps original id + onAdvance
    {
      id: 'c5_keep_cone_ending',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Carry the Festival',
      img: PRO_BIG_IMG('homeReturn4.png'),
      text: `SnowCone MathFest hasn’t vanished.<br><br>You’re still there, every time you balance something that felt impossible.`,
      soloLabel: 'Look back… just once ➡️',
      onAdvance: ({ appState, engine }) => {
        const a = appState || globalAppState;
        if (a?.setFlag) {
          a.setFlag('ending_way_home', true);
          a.saveToStorage?.();
        }

        if (!engine) return;
        const chapter = engine.registry[engine.state.chapterId];
        if (!chapter) return;

        // 👇 Jump to the FIRST epilogue slide, not the last
        const idx = chapter.slides.findIndex((s) => s.id === 'c5_final_the_end_1');
        if (idx >= 0) {
          engine.state.idx = idx;
          engine._renderSlide();
          return 'handled';
        }
        return false;
      },
    },


    // 2) Ending if you GAVE Jehnk the snowcone (you’re the new driver)
       // Give Cone Ending – part 1 (@ You nod)
    {
      id: 'c5_give_cone_ending_1',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'The New Driver',
      img: PRO_MED_IMG('portalDecision2.png'),
      text: `You press the Perfect SnowCone into Jehnk’s hands.<br><br>
For a second, all three of you—the cone, the driver, and the portal—sync in the same pulse.
The light flares. The festival hums.<br><br>
<span style="color: rgb(247, 255, 105);">“You sure about this?”</span> he asks.`,
      soloLabel: 'Next ➡️',
    },

    // Give Cone Ending – part 2 (@ When the glow fades)
    {
      id: 'c5_give_cone_ending_2',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'The New Driver',
      img: PRO_MED_IMG('truckLoop.png'),
      text: `You nod. You know the truck, the math, the ghosts, the menu beats.
You know the way the festival feels at 2am when the main stage dies down
but the real weirdness is just getting started.<br><br>
He takes one slow bite and vanishes in a halo of syrup light.`,
      soloLabel: 'Next ➡️',
    },

    // Give Cone Ending – part 3 (@ But Jehnk was right)
    {
      id: 'c5_give_cone_ending_3',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'The New Driver',
      img: PRO_MED_IMG('truckLoop2.png'),
      text: `When the glow fades, the keys are in your hand.<br><br>
You climb into the driver’s seat. You drive.<br><br>
You try exits. You try back roads. You even try turning the truck completely off.`,
      soloLabel: 'Next ➡️',
    },

    // Give Cone Ending – part 4 (original id + onAdvance)
    {
      id: 'c5_give_cone_ending',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'The New Driver',
      img: PRO_MED_IMG('truckLoop4.png'),
      text: `But Jehnk was right. Every route circles back to the same entrance gate.<br><br>
You’ve lost signal to the tiny dino—the beat-up phone just flashes <b>NO SERVICE</b> in every timeline.<br><br>
Still, as you pull into SnowCone MathFest for what feels like the 67th time, you see them:<br>
a poor, stranded potential customer, standing at the start of the line,
clutching a ticket instead of a wristband…`,
      soloLabel: 'Serve the next customer ➡️',
      onAdvance: ({ appState, engine }) => {
        const a = appState || globalAppState;

        if (a?.removeItem) {
          try {
            if (a.hasItem?.(PERFECT_CONE)) {
              a.removeItem(PERFECT_CONE);
            }
          } catch (e) {
            console.warn('[ch5] remove cone in driver ending failed:', e);
          }
        }
        if (a?.setFlag) {
          a.setFlag('ending_driver_loop', true);
          a.saveToStorage?.();
        }

        if (!engine) return;
        const chapter = engine.registry[engine.state.chapterId];
        if (!chapter) return;

        // 👇 Again: go to epilogue part 1, not the last slide
        const idx = chapter.slides.findIndex((s) => s.id === 'c5_final_the_end_1');
        if (idx >= 0) {
          engine.state.idx = idx;
          engine._renderSlide();
          return 'handled';
        }
        return false;
      },
    },

    // 3) Shared final slide: The End?
            // 3) Shared final slide: The End?
       // 3) Shared final slide: The End?
        // 3) Shared final slide: The End?
        // Final Epilogue – part 1 (@ For you, it’s a loop)
    {
      id: 'c5_final_the_end_1',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'The End?',
      img: PRO_MED_IMG('truckLoop3.png'), // 🔧 subtle, dreamy fest art
      text: `SnowCone MathFest doesn’t erase cleanly.<br><br>
For some people, it’s a place on a map—a festival you drive to once,<br>
then forget after the merch fades and the playlists move on.`,
      soloLabel: 'Next ➡️',
    },

    // Final Epilogue – part 2 (@ Maybe you’re home)
        // Final Epilogue – part 2 (@ Maybe you’re home)
    {
      id: 'c5_final_the_end_2',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'The End?',
      img: PRO_MED_IMG('festivalFade2.png'),
      text: `For you, it’s a loop, or a memory, or a glitch in the road where music and math keep folding into each other.<br><br>
Maybe you’re at the truck, keys in hand, waiting for the next unlucky soul to wander up with a ticket instead of a wristband.`,
      soloLabel: 'Next ➡️',
      onAdvance: ({ appState, engine }) => {
        const a = appState || globalAppState;
        if (!engine) return;

        const chapter = engine.registry[engine.state.chapterId];
        if (!chapter) return;

        // We already set these earlier:
        //  - ending_way_home   (KEEP the cone, go home)
        //  - ending_driver_loop (GIVE the cone, stay as driver)
        const flags = a?.flags || {};
        const isDriver = !!flags.ending_driver_loop;

        // 🚦 If you're the driver, skip the "maybe you're home" slide
        // and jump straight to the final epilogue button screen.
        const targetId = isDriver
          ? 'c5_final_the_end'    // driver: stay in the fest, no "home" slide
          : 'c5_final_the_end_3'; // way-home ending: show the "maybe you're home" beat

        const idx = chapter.slides.findIndex((s) => s.id === targetId);
        if (idx >= 0) {
          engine.state.idx = idx;
          engine._renderSlide();
          return 'handled';
        }

        // fallback: let engine advance linearly if something's weird
        return false;
      },
    },


    // Final Epilogue – part 3 (@ For now, the screen)
    {
      id: 'c5_final_the_end_3',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'The End?',
      img: PRO_MED_IMG('festivalFade.png'),
      text: `Maybe you’re home, staring at homework or spreadsheets or a fresh notebook page,<br>
feeling the ghost-beat of the festival under every pattern you notice.<br><br>
Either way, the story’s not exactly over.<br><br>
It just knows how to pause.`,
      soloLabel: 'Next ➡️',
    },

    // Final Epilogue – part 4 (keeps original id + options)
    {
      id: 'c5_final_the_end',
      role: SlideRole.EPILOGUE,
      mode: 'ending',
      title: 'The End?',
      img: PRO_MED_IMG('festivalFade.png'), // 🔧 subtle, dreamy fest art
      text: `For now, the screen fades, the music softens,<br>
and two little words hang at the edge of the UI like a promise:<br><br>
<b>The End?</b>`,
      options: [
        {
          label: 'Back to Menu',
          nextId: 'root_menu', // engine sends you to the chapter/menu screen
        },
      ],
    },


  ],
  onFinish: ({ appState }) => {
    const a = appState || globalAppState;
    try {
      awardBadge('story_ch5');
      a.saveToStorage?.();
    } catch (e) {
      console.warn('[ch5] onFinish failed', e);
    }
  },
};
