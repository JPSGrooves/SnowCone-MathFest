// src/modes/storyMode/chapters/ch5.js
import { SlideRole, ItemIds } from '../../../data/storySchema.js';
import { appState as globalAppState } from '../../../data/appState.js';
import { awardBadge } from '../../../managers/badgeManager.js';
import { fadeToStoryCreditsFromCh5 } from '../ui/storyCredits.js';


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
      text: `Portal light folds back into itself like a slow breath.<br><br>Your decision with Jehnk has already locked into the math of the festival.<br><br>You feel the after-image of the moment hanging in the air, waiting to collapse into one reality or the other.`,
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
      img: PRO_MED_IMG('portalDecision4.png'),
      text: `You tighten your grip on <span style="color: rgb(247, 255, 105);">The Perfect SnowCone</span>.<br><br><span style="color: rgb(105, 248, 255);">“I’m sorry,”</span> you tell Jehnk. <span style="color: rgb(105, 248, 255);">“I just can't stay here.”</span><br><br>He studies your face for a long moment, then nods.<br><span style="color: rgb(247, 255, 105);">“I get it,”</span> he says quietly. <span style="color: rgb(247, 255, 105);">“Really. Someone should make it out.”</span>`,
      soloLabel: 'Next ➡️',
    },

    // Keep Cone Ending – part 2 (@ You turn toward the portal)
    {
      id: 'c5_keep_cone_ending_2',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Carry the Festival',
      img: PRO_MED_IMG('portalGlow3.png'),
      text: `Accepting your decision, you turn toward the portal. The closer you walk, the more the cone burns cold in your hand, every color locking into a perfect ratio of light.<br><br>You step through.`,
      soloLabel: 'Next ➡️',
    },

    // Keep Cone Ending – part 3 (@ When you open your eyes)
    {
      id: 'c5_keep_cone_ending_3',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Carry the Festival',
      img: PRO_MED_IMG('homeReturn3.png'),
      text: `When you open your eyes, you’re home.<br><br>No portal. No math ghosts. No hooded dinos. Just your regular life, waiting patiently like it never left, homework included...<br><br>But everything feels… different.`,
      soloLabel: 'Next ➡️',
    },
        {
      id: 'c5_keep_cone_ending_4',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Carry the Festival',
      img: PRO_MED_IMG('homeReturn2.png'),
      text: `Now, whenever you fold a shirt, you see the fractions behind it. Every time a towel tumbles in a dryer, you hear a distant beat. Even smashing a random bug reminds you of the mosquitos you smushed while playing Camping Games. Life just reminds you now of the nights when numbers and lightning bugs were the same kind of magic.`,
      soloLabel: 'Next ➡️',
    },

        {
      id: 'c5_keep_cone_ending_5',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Carry the Festival',
      img: PRO_MED_IMG('homeReturn5.png'), // <- new art goes here
      text: `<span style="color: rgb(247, 255, 105);">The Perfect SnowCone</span> still lives in the back of your mind, quiet and steady.<br><br>On the walk to school, in the grocery line, standing at the sink doing dishes—you catch flashes of neon in reflections: a doorway in the window glass, a glow in the corner of your eye. Every time you check your bank account, you remember Pacioli telling you to balance those books!`,
      soloLabel: 'Next ➡️',
    },


    // Keep Cone Ending – part 4 (@ Now, when you solve…) – keeps original id + onAdvance
    {
      id: 'c5_keep_cone_ending',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Carry the Festival',
      img: PRO_MED_IMG('homeReturn4.png'),
      text: `The festival hasn’t vanished.<br><br>You’re still there, every time you ask yourself: "Why did I learn this in school?" you remember, SnowCone MathFest did something you felt was impossible. It made math interesting.<br><br>And maybe that’s enough to keep the festival alive, as you keep carrying it with you.`,
      soloLabel: 'Look back… just once ➡️',
      onAdvance: ({ appState, engine }) => {
        const a = appState || globalAppState;

        if (a?.setFlag) {
          // mark this ending as seen
          a.setFlag('ending_way_home', true);

          // 🔍 check if we now have both endings
          const haveWay = true; // we just set it
          const haveDriver =
            typeof a.getFlag === 'function'
              ? a.getFlag('ending_driver_loop', false)
              : !!(a.flags && a.flags.ending_driver_loop);

          if (haveWay && haveDriver) {
            try {
              awardBadge('leg_dual_endings');
            } catch (e) {
              console.warn('[ch5] award leg_dual_endings (home path) failed:', e);
            }
          }

          a.saveToStorage?.();
        }

        if (!engine) return;
        const chapter = engine.registry[engine.state.chapterId];
        if (!chapter) return;

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
      text: `You press the Perfect SnowCone into Jehnk’s hands.<br><br>For a second, all three of them—the cone, the driver, and the portal—sync in the same pulse. The light flares. The festival hums.<br><br><span style="color: rgb(247, 255, 105);">“You sure about this?”</span> he asks.`,
      soloLabel: 'Next ➡️',
    },

    // Give Cone Ending – part 2 (@ When the glow fades)
    {
      id: 'c5_give_cone_ending_2',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'The New Driver',
      img: PRO_MED_IMG('truckLoop.png'),
      text: `You nod. You know the truck, the math, the ghosts, and the recipes. You know the way the festival feels at 2am when the main stage dies down, and the real weirdness is just getting started.<br><br>Jehnk takes one look back, before running full sprint and leaping into the portal, fizzling into a world he left countless years ago.`,
      soloLabel: 'Next ➡️',
    },

    // Give Cone Ending – part 3 (@ But Jehnk was right)
    {
      id: 'c5_give_cone_ending_3',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'The New Driver',
      img: PRO_MED_IMG('truckLoop2.png'),
      text: `The portal closes and as the glow fades, you notice that the keys are in your hand.<br><br>You walk back to the SnowCone truck and climb into the driver’s seat. You tap the SnowCone ornament hanging from the rearview mirror and begin to drive.<br><br>As an experiment, you try the exits. You try back roads. You even try turning the truck completely off.`,
      soloLabel: 'Next ➡️',
    },

    // Give Cone Ending – part 4 (original id + onAdvance)
    {
      id: 'c5_give_cone_ending',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'The New Driver',
      img: PRO_MED_IMG('truckLoop4.png'),
      text: `But Jehnk was right. Every route out just circles back to the same entrance gate...<br><br>Still, as you pull into SnowCone MathFest for what feels like the 67th time, you see a familiar face:<br>a poor, stranded, potential customer, talking to a Dino-Divider, clutching a ticket instead of a wristband…`,
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
          // mark this ending as seen
          a.setFlag('ending_driver_loop', true);

          // 🔍 check if we now have both endings
          const haveDriver = true; // we just set it
          const haveWay =
            typeof a.getFlag === 'function'
              ? a.getFlag('ending_way_home', false)
              : !!(a.flags && a.flags.ending_way_home);

          if (haveWay && haveDriver) {
            try {
              awardBadge('leg_dual_endings');
            } catch (e) {
              console.warn('[ch5] award leg_dual_endings (driver path) failed:', e);
            }
          }

          a.saveToStorage?.();
        }

        if (!engine) return;
        const chapter = engine.registry[engine.state.chapterId];
        if (!chapter) return;

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
      text: `It's clear by now that the SnowCone MathFest doesn’t erase cleanly.<br><br>For some people, it’s just a place on a map; a festival you went to once or twice, and then forgot. After the merch fades and the playlists move on, the ghosts are left to roam alone.`,
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
      text: `For you, it’s a loop, or a memory, or a glitch in the road where music and math keep folding into each other.<br><br>You find a certain peace in knowing that someone is always at the truck, keys in hand, waiting for the next unlucky soul to wander up with a ticket instead of a wristband.`,
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
      text: `Wherever you're at, the math you know now makes life look like a fresh notebook page.<br>For every pattern you notice, you can feel the legendary beats between that create the journey.<br><br>Life seems to be like that, like the story’s never exactly over.<br><br>Occasionally, as is the case here, it finds a nice pause.`,
      soloLabel: 'Next ➡️',
    },

    // Final Epilogue – part 4 (keeps original id + options)
    {
  id: 'c5_final_the_end',
  role: SlideRole.EPILOGUE,
  mode: 'solo',
  title: 'The End?',
  img: PRO_MED_IMG('festivalFade.png'),
  text: `As the screen fades and the music softens, two little words hang off the truck window like a promise:<br><b>The End?</b><br><br>This run is over, but the choices you made are baked into the festival’s math now; whether you carried the cone home or stayed to drive the truck, you made it this far and can always return to forge the Perfect SnowCone.`,
  soloLabel: 'Thank you for playing!🎉',
    onAdvance: ({ appState, engine }) => {
    const a = appState || globalAppState;

    // 🎖 Make sure the Chapter 5 badge always unlocks
    try {
      awardBadge('story_ch5');   // safe to call multiple times; it’s idempotent
      a?.saveToStorage?.();
    } catch (e) {
      console.warn('[ch5_final_the_end] failed to award story_ch5', e);
    }

    // Then do your visual exit as before
    fadeToStoryCreditsFromCh5();
    return 'handled';
  },

},



  ],
    onFinish: ({ appState }) => {
    const a = appState || globalAppState;
    try {
      // Normal chapter badge
      awardBadge('story_ch5');

      // 🌀 Legendary Cone: Dual Endings
      const haveWay    = typeof a.getFlag === 'function' ? a.getFlag('ending_way_home', false)    : !!(a.flags && a.flags.ending_way_home);
      const haveDriver = typeof a.getFlag === 'function' ? a.getFlag('ending_driver_loop', false) : !!(a.flags && a.flags.ending_driver_loop);

      if (haveWay && haveDriver) {
        awardBadge('leg_dual_endings');
      }

      a.saveToStorage?.();
    } catch (e) {
      console.warn('[ch5] onFinish failed', e);
    }
  },
};
