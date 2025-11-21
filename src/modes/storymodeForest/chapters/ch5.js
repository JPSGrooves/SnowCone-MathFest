// src/modes/storyMode/chapters/ch5.js
import { SlideRole, ItemIds } from '../../../data/storySchema.js';
import { appState as globalAppState } from '../../../data/appState.js';
import { scheduleStoryCredits } from '../ui/storyCredits.js';

const BASE = import.meta.env.BASE_URL;
const PRO_IMG = (n) => `${BASE}assets/img/characters/storyMode/${n}`;
const SCN_IMG = (n) => `${BASE}assets/img/modes/storymodeForest/${n}`;

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
      img: SCN_IMG('portalGlow.png'),
      text: `Portal light folds back into itself like a slow breath.<br><br>
Whatever you chose with Jehnk—keeping the cone or handing it over—has already locked into the math of this place.<br><br>
You feel the after-image of the moment hanging in the air, waiting to collapse into one reality or the other.`,
      soloLabel: 'See what became of your choice ➡️',
      onAdvance: ({ appState, engine }) => {
        const a = appState || globalAppState;
        if (!a || !engine) return;

        const chapter = engine.registry[engine.state.chapterId];
        if (!chapter) return;

        // If you STILL have the Perfect SnowCone → “Carry the Festival” ending
        // If not → “The New Driver” ending
        const hasPerfect = !!a.hasItem?.(PERFECT_CONE);
        const targetId = hasPerfect ? 'c5_keep_cone_ending' : 'c5_give_cone_ending';

        const idx = chapter.slides.findIndex((s) => s.id === targetId);
        if (idx >= 0) {
          engine.state.idx = idx;
          engine._renderSlide();
          return 'handled';
        }
        return false;
      },
    },

    // 1) Ending if you KEPT the snowcone and walked through
    {
      id: 'c5_keep_cone_ending',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Carry the Festival',
      img: SCN_IMG('homeReturn.png'),
      text: `You tighten your grip on the Perfect SnowCone.<br><br>
<span style="color: rgb(247, 255, 105);">“I’m sorry,”</span> you tell Jehnk. <span style="color: rgb(247, 255, 105);">“I can’t leave myself stuck here.”</span><br><br>
He studies your face for a long moment, then nods.<br>
<span style="color: rgb(247, 255, 105);">“I get it,”</span> he says quietly. <span style="color: rgb(247, 255, 105);">“Really. Someone should make it out.”</span><br><br>
You turn toward the portal. The closer you walk, the more the cone burns cold in your hand,
every color locking into a perfect ratio of light.<br><br>
You step through.<br><br>
When you open your eyes, you’re home.<br><br>
No portal. No math ghosts. No hooded dinos. Just your regular life,
waiting patiently like it never left.<br><br>
But everything feels… different.<br><br>
Now, when you solve an equation, you see the stage lights behind it.
Every time a pattern untangles in your head, you hear a distant beat.
Even smashing a random mosquito reminds you of the campsite at Kids Camping,
of the nights when numbers and fireflies were the same kind of magic.<br><br>
SnowCone MathFest hasn’t vanished.<br><br>
You’re still there, every time you balance something that felt impossible.`,
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

        const idx = chapter.slides.findIndex((s) => s.id === 'c5_final_the_end');
        if (idx >= 0) {
          engine.state.idx = idx;
          engine._renderSlide();
          return 'handled';
        }
        return false;
      },
    },

    // 2) Ending if you GAVE Jehnk the snowcone (you’re the new driver)
    {
      id: 'c5_give_cone_ending',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'The New Driver',
      img: SCN_IMG('truckLoop.png'),
      text: `You press the Perfect SnowCone into Jehnk’s hands.<br><br>
For a second, all three of you—the cone, the driver, and the portal—sync in the same pulse.
The light flares. The festival hums.<br><br>
<span style="color: rgb(247, 255, 105);">“You sure about this?”</span> he asks.<br><br>
You nod. You know the truck, the math, the ghosts, the menu beats.
You know the way the festival feels at 2am when the main stage dies down
but the real weirdness is just getting started.<br><br>
He takes one slow bite and vanishes in a halo of syrup light.<br><br>
When the glow fades, the keys are in your hand.<br><br>
You climb into the driver’s seat. You drive.<br><br>
You try exits. You try back roads. You even try turning the truck completely off.<br><br>
But Jehnk was right. Every route circles back to the same entrance gate.<br><br>
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

        const idx = chapter.slides.findIndex((s) => s.id === 'c5_final_the_end');
        if (idx >= 0) {
          engine.state.idx = idx;
          engine._renderSlide();
          return 'handled';
        }
        return false;
      },
    },

    // 3) Shared final slide: The End?
       {
  id: 'c5_final_the_end',
  role: SlideRole.EPILOGUE,
  mode: 'ending',
  title: 'The End?',
  img: SCN_IMG('festivalFade.png'), // 🔧 subtle, dreamy fest art
  text: `SnowCone MathFest doesn’t erase cleanly.

For some people, it’s a place on a map—a festival you drive to once,
then forget after the merch fades and the playlists move on.

For you, it’s a loop, or a memory, or a glitch in the road where music and math keep folding into each other.

Maybe you’re at the truck, keys in hand, waiting for the next unlucky soul to wander up with a ticket instead of a wristband.

Maybe you’re home, staring at homework or spreadsheets or a fresh notebook page,
feeling the ghost-beat of the festival under every pattern you notice.

Either way, the story’s not exactly over.

It just knows how to pause.

For now, the screen fades, the music softens,
and four little words hang at the edge of the UI like a promise:

<b>The End?</b>`,
  onEnter: () => {
    try {
      // ⏱️ roll credits ~1s after we land here — EVERY TIME
      scheduleStoryCredits(1000);
    } catch (err) {
      console.warn('[Chapter5] failed to schedule story credits:', err);
    }
  },
  options: [
    {
      label: 'Back to Menu',
      nextId: 'root_menu', // handled by engine: back to chapter menu
    },
  ],
},
  ],
};
