// storyMode.js — CLEAN RESET (Prologue-only)

// Styles & managers
// src/modes/storyMode/storyMode.js
import './storyMode.css';
import { swapModeBackground, applyBackgroundTheme } from '../../managers/backgroundManager.js';
import { playTransition } from '../../managers/transitionManager.js';
import { preventDoubleTapZoom } from '../../utils/preventDoubleTapZoom.js';

// StoryMode data
import { ITEM_DISPLAY, ItemIds } from '../../data/storySchema.js';

// SFX / badges / music
import {
  playTrack,
  stopTrack,
  toggleMute,
  isMuted,
  toggleLoop,
  getLooping,
  currentTrackId,
  isPlaying,
} from '../../managers/musicManager.js';
import { Howl } from 'howler';
import { awardBadge } from '../../managers/badgeManager.js';

import { Chapters as StoryChapters } from './chapters/index.js';
import { ChapterEngine } from './chapterEngine.js';

// 👇 NEW: use the same toast UI that chapterEngine uses
import { pickupPing } from './ui/pickupPing.js';

// src/modes/storyMode/storyMode.js
import { appState } from '../../data/appState.js';
import { scheduleStoryCredits } from './ui/storyCredits.js';
import { isIOSNative } from '../../utils/platform.js'; // 👈 unified platform helper




let chapterEngine;
function getEngine() {
  if (!chapterEngine) chapterEngine = new ChapterEngine(StoryChapters);
  return chapterEngine;
}
let __smWired = false;

// storyMode-scoped addItem patch
// ───── Story-mode inventory watcher (MobX reaction) ─────
// ───── Story-mode inventory watcher (polling diff, no MobX needed) ─────
let __smInvPoll = null;
let __smInvPrevJson = '';

function smReadItemsSnapshot() {
  // Robust: try accessor first, else fall back to profile.items
  const ids =
    appState.getItemIds?.() ||
    Object.keys(appState.profile?.items || {}) ||
    [];

  const pairs = ids.map((id) => {
    const rec = appState.getItem?.(id) || appState.profile?.items?.[id] || 0;
    // normalize qty: numbers okay; objects with qty okay; booleans/strings coerce
    let qty;
    if (typeof rec === 'number') qty = rec;
    else if (rec && typeof rec === 'object' && 'qty' in rec) qty = Number(rec.qty) || 0;
    else qty = rec ? 1 : 0;
    return [id, qty];
  });

  // Sort for stable stringify
  pairs.sort((a,b) => (a[0] > b[0] ? 1 : -1));
  return pairs;
}

function smStartInventoryWatcher() {
  if (__smInvPoll) return;

  const readNow = () => JSON.stringify(smReadItemsSnapshot());
  __smInvPrevJson = readNow();

  __smInvPoll = setInterval(() => {
    try {
      // Only operate if Story UI lives
      if (!document.querySelector('.sm-aspect-wrap')) return;

      const nowJson = readNow();
      if (nowJson === __smInvPrevJson) return;

      const prev = Object.fromEntries(JSON.parse(__smInvPrevJson));
      const now  = Object.fromEntries(JSON.parse(nowJson));

      // Detect increases and new IDs
      Object.keys(now).forEach((id) => {
        const oldQ = prev[id] ?? 0;
        const newQ = now[id] ?? 0;
        if (newQ > oldQ) {
          const delta = newQ - oldQ;
          const name  = (ITEM_DISPLAY?.[id]?.name)  || id || 'Item';
          const emoji = (ITEM_DISPLAY?.[id]?.emoji) || '✨';

          // 🔔 Use the shared StoryMode pickup toast
          pickupPing({
            emoji,
            name,
            qty: delta,
          });
        }
      });


      __smInvPrevJson = nowJson;
    } catch (err) {
      // fail silent; don’t break story loop
      // console.warn('[SM] inv poll err', err);
    }
  }, 250); // light + responsive
}



function smStopInventoryWatcher() {
  if (__smInvPoll) clearInterval(__smInvPoll);
  __smInvPoll = null;
  __smInvPrevJson = '';
}
function smSetChapterFlag(id) {
  const root = document.querySelector('.sm-aspect-wrap');
  if (!root) return;
  if (id) root.setAttribute('data-chapter', id);
  else root.removeAttribute('data-chapter');
}

// ────────────────────────────────────────────────────────────────────────────────
// Locals
// ────────────────────────────────────────────────────────────────────────────────
const SELECTORS = {
  container: '#game-container',
  menuWrapper: '.menu-wrapper',
};

// 🔹 Body flag for iOS padding tweaks (mirrors Kids Camping's kc-active)
const SM_BODY_CLASS = 'sm-active';

const STORY_TRACKS = ['prologue', 'bonusTime', 'patchrelaxes' ];

// 🔍 Native iOS detector for exclusive content.
// Your WKWebView / native wrapper should set window.SC_IOS_NATIVE = true
// inside the paid iOS app. Browsers will not see this.
// 🔍 StoryMode iOS-native gate – delegates to shared platform helper
function isIOSNativeExclusive() {
  // We keep the name so all existing StoryMode code keeps working,
  // but the actual “are we native?” logic lives in src/utils/platform.js.
  return isIOSNative();
}


let elRoot = null;
let keyHandler = null;
let clickHandler = null;
let smAudioUnlockOnce = null;

let __smAudioCtx = null;
let __lastInterval = '';
let __lastPlayTs = 0;
let __smLastStoryTrack = null;
let __smRotateTimer = null;

let __smRotateLock = false;


// Assets
const BASE = import.meta.env.BASE_URL;
const BG_SRC = `${BASE}assets/img/modes/storymodeForest/storyBG.png`;
const DIRECTOR_SRC = `${BASE}assets/img/characters/storyMode/jehnk.png`;
const PRO_IMG = (name) => `${BASE}assets/img/characters/storyMode/${name}`;

// ────────────────────────────────────────────────────────────────────────────────
// Prologue pages (text/image/practice)
// ────────────────────────────────────────────────────────────────────────────────
const PROLOGUE_PAGES = [
  // Page 1 — Why Math? Why Now?
{
  type: 'html',
  html: `
      <div class="sm-slide-text">
        <strong style="font-size:1.4em; color: yellow;">How it all Started..</strong><br>
        I hated math when I was young.<br>
        It was cold 🥶. It was lifeless 💀. It was just a bunch of numbers 🔢.<br>
        I needed it to move 🕺💃. To sing 🎶🎤. To matter ❤️.<br>
        That's why I went to the SnowCone MathFest 🍧🚚🎉.<br>
        <img src="${PRO_IMG('boredJehnk.png')}" alt="Jehnk bored in math class" class="sm-slide-image">
      </div>`
  },

  // Page 1A — after the first year
  {
    type: 'html',
    html: `
      <div class="sm-slide-text">
        <strong style="font-size:1.4em; color: yellow;">After the first year...</strong><br>
        ... strange things started happening 🌌.<br><br>
        Ghosts arrived 👻✨ — ancient, glowing numbers whispering in the wind.<br>
        I realized I had been seeing them my whole life, hidden in the columns before me...<br>
        but now, they were seeing me too 👀🔮.<br><br>
        As I stood at the gates 🏰🍧, slinging SnowCones to the masses in the mystical moist night-air 🎊🍦,
        I heard the first ghost walk by and say… 🎶👂
        <img src="${PRO_IMG('iceyTruck.png')}" alt="crystal ice truck" class="sm-slide-image">
      </div>`
  },
  // Page 3 — Pythagorus image
  { type: 'image', src: PRO_IMG('pythagoraspicture.png'), caption: "Pythagorus - Eyes the Gates" },
  // Page 2 — Pythagorus text
  {
    type: 'html',
    html: `
      <div class="sm-slide-text">
        <strong style="font-size:1.2em; color: yellow;">Pythagorus Explains the Song of Fractions</strong><br><br>
        <span style="color:#00ccff;">"Music is the math you already know 🎶 — deep in your bones 💀🎸.<br><br>
        When you go up a string and press exactly at its midpoint 📏✂️, you’ve traveled halfway along its path ↔️.
        Somehow you can feel the whole journey echo back to you 🔄 from this midpoint.<br><br>
        It’s as if the festival has whispered its secret 🌌🤫: that harmony lives in the space between two points."</span>
      </div>`
  },
    // Page 2A — Pythagorus text response
  {
    type: 'html',
    html: `
      <div class="sm-slide-text">
        <img src="${PRO_IMG('cosmicCone.png')}" 
            alt="cosmic cone" 
            class="sm-slide-image sm-cosmic">
        <strong style="font-size:1.2em; color: yellow;">I served him a SnowCone 🍧...</strong><br>
        ...and knew, that here at SnowCone MathFest 🌈🎉,
        every neon beat has an octave waiting to be unlocked 🎵🔓.<br><br>
        I wondered if we're always just halfway to the next note. Hearing where we've been and where we want to go, but always appreciating the hidden, singing frequencies
        scattered along the path 👆🎶.
      </div>`
  },


  // Page 4 — Pythagorus practice
  // Page 4 — Pythagorus practice (spiced)
  {
    type: 'practice',
    title: "Pythagorus Problems 🎸🎵",
    items: [
      {
        prompt: "🎸 When Pythagorus presses a 60cm string exactly halfway ⏱️ (30 cm), what fraction of the original length is vibrating? 🤔➗",
        answer: "1/2 (Half the string, twice the pitch — an octave higher! 🎵)",
        sfx: 'honk1'
      },
      {
        prompt: "And when he presses at 20cm?",
        answer: "2/3 (vibrates, creating a fifth above the original note! 🎶)",
        sfx: 'honk2'
      }
    ],
    interactive: {
      length: 60, // cm
      defaultPress: 25
    }
  },

  // Page 6 — Euclid image
  { type: 'image', src: PRO_IMG('euclidpicture.png'), caption: "Euclid decides to grab a cone..." },

  // Page 5 — Euclid text
  {
    type: 'html',
    html: `
      <div class="sm-slide-text">
        <strong style="font-size:1.3em; color: yellow;">Euclid Nears the Truck</strong><br>
        <span style="color:#00ccff;">"All structure, seen or unseen, begins with a line ✏️➡️📏."</span>
        He pauses, tracing his proofs and figures through the void —
        <span style="color:#00ccff;">"The simplest gesture births every shape, every temple, every constellation above.
        Each angle is a handshake between points 🤝, each intersection is a moment of cosmic agreement.<br><br>
        <img 
          src="${PRO_IMG('infinity.png')}" 
          alt="bram" 
          class="sm-slide-image sm-slide-image-bram"
        />
        Even a circle is simply a promise kept — every point faithful to its center 🌀.<br>
        Infinity itself is a patient horizon, waiting for steady interpretation as we pass through the stars 🌌."</span>
      </div>`
  },
  {
    type: 'html',
    html: `
      <div class="sm-slide-text">
        <strong style="font-size:1.3em; color: yellow;">Euclid Recieves the Cone</strong><br>
        By connecting the two dots between us, Euclid wasn’t merely drawing — he was weaving the very fabric of
        existence into patterns the mind could grasp. He almost didn't see the SnowCone I was handing him 🍧 —
        but the glistening crystals in the concert light were enough to catch his eye.
        <img src="${PRO_IMG('euclidCone.png')}"alt="Euclid with Cone" class="sm-slide-image sm-slide-euclid">
      </div>`
  },

  // Page 7 — Euclid practice
  // Page 7 — Euclid practice
  {
    type: 'practice',
    title: "Euclid Problems 🍧🚀",
    items: [
      {
        prompt:
          "Euclid immediately notices the off-shaped SnowCone that measures like a right triangle with legs of 3 cm and 4 cm. " +
          "<span style='color:#00ccff'>“What is the hypotenuse length?”</span> 🤔📐",
        answer: `5 cm is the longest side, opposite the right angle (3² + 4² = 9 + 16 = 25 → √25 = 5)`,
        sfx: 'honk2'
      },
      {
        prompt:
          "<strong style='font-size:1.1em; color: yellow;'>Follow-Up 🍧🔍</strong><br>" +
          "Next, Euclid sketches the perfect SnowCone: two equal sides of 6 cm and a top edge of 4 cm. " +
          "<span style='color:#00ccff'>“What’s the perimeter of this neon triangle?”</span> 🤔📏",
        answer: `16 cm (6 + 6 + 4 = 16) <span style='color:#00ccff;'>▽</span>!!`,
        sfx: 'honk1'
      }
    ]
  },


  // Page 8 — Galileo & Newton text
  {
    type: 'html',
    html: `
      <div class="sm-slide-text">
        <strong style="font-size:1.2em; color: yellow;">Galileo Awaits Newton</strong><br>
        <img src="${PRO_IMG('galileoStar.png')}" alt="Gstars"
            class="sm-slide-image sm-slide-legend sm-bump-galileo">
        <span style='color: white;'>Galileo:</span>
        <span style='color: #00ccff;'>\"Everything moves if you watch carefully enough 🎵🔭. Even planets that seem at rest are weaving through space at unimaginable speeds—the Earth spins, the Moon orbits, and light itself races across the void. Observation is the instrument that reveals the hidden dance of the cosmos.\"</span><br>
      </div>`
  },


  {
    type: 'html',
    html: `
      <div class="sm-slide-text">
        <strong style="font-size:1.2em; color: yellow;">Newton Arrives!</strong><br><br>
        <span style='color: white;'>Newton:</span> <span style='color: #00ccff;'>\"And every movement has a cause 🪐⚙️. Universal forces sculpt the tapestry of our reality: gravity pulls apples and planets alike, inertia resists every change, and for every action there’s an equal reaction. Even the unseen hand of attraction shapes the festival’s grand ballet.\"</span><br>
        <img src="${PRO_IMG('newtonSky.png')}" alt="newton" class="sm-slide-image sm-slide-legend">
      </div>`
  },


  {
    type: 'html',
    html: `
      <div class="sm-slide-text">
        <strong style="font-size:1.2em; color: yellow;">SnowCone Solutions!</strong><br>
        I slung them two neon SnowCones 🍧🍧 and wondered how I could ever measure the speed of their cosmic stroll. 🚶🚶‍♂️<br>

        <img src="${PRO_IMG('jehnk2Cones.png')}" alt="2 cones" class="sm-slide-image sm-slide-legend">

        It was at that point I felt the festival’s math begin click into place:<br>  
        <em>observe → compare → solve</em>.<br>  
        The heat of the festival pushes the cone, the chill of the cone pushes back — equal echoes finding a purpose in opposite ways.<br>  
        ♻️<span style="color:#9ff;">(action ⇄ reaction)</span>♻️
      </div>`
  },


  // Page 9 — Galileo & Newton image
  { type: 'image', src: PRO_IMG('galileonewtonpicture.png'), caption: "Galileo & Newton discussing how long it took to get in..." },

  // Page 10 — Galileo/Newton practice
  {
    type: 'practice',
    title: "Motion Math 🍧🚀",
    items: [
      {
        prompt: "I informed Galileo that my neon SnowCone truck cruised to the entrance at a steady pace: I looped 60 miles in 2 hours. He asked, <span style='color: #00ccff;'>\"What was your average speed?\"</span> 🤔🚚<br>",
        answer: "30 mph<br>(Speed = Distance ÷ Time = 60 ÷ 2)<br> Dude, I'm back here every year! 🚀",
        sfx: 'honk1'
      },
      {
        prompt: "<strong style='font-size:1.1em; color: yellow;'>Follow-Up 🍧🔍</strong><br>" +
        "Newton asked, <span style='color: #00ccff;'>\"If you kept driving at 30mph, how far would you cruise in 5 hours?\"</span> 🤔📏<br>",
        answer: "150 miles (30 × 5)<br> Glad I didn't wander that long! 🌌",
        sfx: 'honk2'
      }
    ]
  },

  // Page 11 — Turing & Brahmagupta text
  {
    type: 'html',
    html: `
      <div class="sm-slide-text">
        <strong style="font-size:1.2em; color: yellow;">Turing &amp; A Friend Walk By</strong><br>
        <img src="${PRO_IMG('breeze1.png')}"alt="breeze" class="sm-slide-image sm-slide-euclid">
        Turing saw me almost lose myself in the motion of the music, but then spoke softly,
        <span style='color: #00ccff;'>\"Every puzzle is a hidden message, encoded in the patterns of the world. From the fluttering of a butterfly to the hum of a machine, each mathematical proof, carries its own secret that reveals the logic behind chaos.\"</span><br><br>
      </div>`
  },  
  
  // Page 11A — Turing & Brahmagupta text
  {
    type: 'html',
    html: `
      <div class="sm-slide-text">
        <strong style="font-size:1.2em; color: yellow;">His Friend Smiled...</strong><br>
        <img 
          src="${PRO_IMG('bram.png')}" 
          alt="bram" 
          class="sm-slide-image sm-slide-image-bram"
        />
        Brahmagupta spoke even more softly, <span style='color: #00ccff;'>\"Silence is full of numbers; each pause is made of zeroes. Each gap is a canvas for infinity. By listening to the stillness, we trace the balance of forces that govern both sand-grains and galaxies.\"</span><br><br>
        Listening to them talk helped me realize that gaps and zeroes in life are very postive clues. Math isn't just numbers; it’s the story of life itself, waiting for a curious mind to unfold it.
      </div>`
  },

  // Page 12 — Turing/Brahmagupta image
  { type: 'image', src: PRO_IMG('turingbrahmaguptapicture.png'), caption: "Turing & Brahmagupta ponder the next plot turn of nothingness..." },

  // Page 13 — Turing/Brahmagupta practice
  {
    type: 'practice',
    title: "f(0) Problems 🍧🚀",
    items: [
      {
        prompt: "Turing was excited to see the SnowCones and said, <span style='color: #00ccff;'>\"I would like to have f(3) scoops using my doubling-plus-one function of f(x) = 2x + 1.\"</span> 🤔🍧<br>",
        answer: "2 × 3 + 1 = 7 = f(3) = 7 scoops!!🍧",
        sfx: 'honk2'
      },
      {
        prompt: "Brahmagupta heard me say I couldn't stack that many scoops and asked Turing: <span style='color: #00ccff;'>\"What happens when a whole scoop is multiplied or divided by 0?\"</span> 🤔<br>",
        answer: "It melts to nothing! (The scoops are reduced by the silence.)",
        sfx: 'honk1'
      }
    ]
  },

  // Page 14 — Euclid & Bombelli text
  {
    type: 'html',
    html: `
      <div class="sm-slide-text">
        <strong style="font-size:1.2em; color: yellow;">Euclid Returns<br> to Meet Bombelli...</strong><br>
        <img 
          src="${PRO_IMG('bombellieuclidpicture.png')}" 
          alt="bram" 
          class="sm-slide-image sm-slide-image-bram"
        />
        Bombelli arrived later than the rest, but the familiar voice of Euclid ran back to gain a better understanding of the shifting shapes of the world around us.<br>
      </div>`
  },

  {
    type: 'html',
    html: `
      <div class="sm-slide-text">
        <strong style="font-size:1.2em; color: yellow;">Bombelli Explains...</strong><br>
        <span style='color: #00ccff;'>\"What you call impossible...I call architecture. I draft my cathedrals in the abstract; each imaginary unit is a soaring arch and every complex plane lays the foundation for realms to be seen.<br><br>In our hands, ‘i’ becomes brick, and infinity our blueprint. An insight of numbers carves through space itself, and what others dismiss as folly, reveals hidden symmetry and strength.\"</span><br><br> 
        My mind was tossed in a sprightly dance by Bombelli's words, and I concluded that imaginary numbers could indeed explode into real Snowcones.
      </div>`
  },


  // Page 16 — Bombelli practice
  {
    type: 'practice',
    title: "Bombelli Bombs 🍧🚀",
    items: [
      {
        prompt: "Stepping up for his first Snowcone of the MathFest, Bombelli, was trying to figure out how to get an impossible SnowCone and asked, <span style='color: #00ccff;'>What is the square root of −1?🤔</span><br>",
        answer: "i (Imaginary, but essential for an impossible SnowCones.)",
        sfx: 'honk1'
      },
      {
        prompt: "Euclid, figuring out how he could offer ME an imaginary Snowcone, asked, <span style='color: #00ccff;'>Can I have i² SnowCones?</span><br>",
        answer: "That's −1! (He looped it right back to me!)",
        sfx: 'honk2'
      }
    ]
  },

  // Page 17 — Lovelace & Gauss text
  {
    type: 'html',
    html: `
      <div class="sm-slide-text">
        <strong style='font-size:1.2em; color: yellow;'>Lovelace Reflects On<br>Battling the Storms</strong><br>
        Eyeing a swirling tempest over the MathFest, Ada Lovelace bends close to an infinite lake of SnowCones...<br>
        <span style='color: #00ccff;'>\"Find the rhythm hidden in the storm. Let each thunderclap be the drumbeat of your desire and every spiral of wind the loop that composes your melody.\"</span><br>
        <img 
          src="${PRO_IMG('lovelace.png')}" 
          alt="Lovelace" 
          class="sm-slide-image sm-slide-image-bram"
        />
     </div>`
  },

  {
    type: 'html',
    html: `
      <div class="sm-slide-text">
        <strong style='font-size:1.2em; color: yellow;'>Gauss Goes On,<br>Battling the Storms</strong><br>
        <img 
          src="${PRO_IMG('guassLesson.png')}" 
          alt="Guass" 
          class="sm-slide-image sm-slide-image-bram"
        />
        At the edge of a wind-whipped SnowCone, her new friend, Gauss, traces arcs in the raindrops, falling like decimal points... <br>
        <span style='color: #00ccff;'>\"The arcs dance between the droplets, gliding into what seems to be randomness, but in every space lies a formula that can be seen throughout the fabric of the festival.\"</span><br><br>
      </div>`
  },



  // Page 18 — Lovelace/Gauss image
  { type: 'image', src: PRO_IMG('lovelacegausspicture.png'), caption: "Lovelace and Guass Counting the Drops of Rain" },

  // Page 19 — Lovelace/Gauss practice
  {
    type: 'practice',
    title: "Love Problems 🍧🚀",
    items: [
      {
        prompt: "Before snagging a SnowCone, Lovelace pondered whether the weather might cancel the MathFest: <span style='color: #00ccff;'>\"If thunder repeats every 5 seconds, how many repeats happen in 20 seconds?\"🤔</span><br>",
        answer: "4 repitions (20 ÷ 5)",
        sfx: 'honk2'
      },
      {
        prompt: "Gauss knew he wasn't leaving without a SnowCone. He mused at the neon rain, noting that a drop fell every 0.25 seconds: <br> <span style='color: #00ccff;'>\"If the storm lasts 2.5 seconds, how many drops hit the ground?\"</span> 🤔<br>",
        answer: "10 drops = (2.5 ÷ 0.25)",
        sfx: 'honk1'
      }
    ]
  },

  {
    type: 'html',
    html: `
      <div class="sm-slide-text">
        <strong style='font-size:1.2em; color: yellow;'>Drops of Understanding</strong><br>
        My heart raced as the mathematical uproar around me felt impossibly ordered; I realized chaos is merely a tapestry of patterns too vast for my untrained eyes.
        <img 
          src="${PRO_IMG('jehnkTransparent.png')}" 
          alt="Jehnky" 
          class="sm-slide-image sm-slide-image-bram"
        />
        Lovelace and Gauss were teaching me to see the hidden order in the storm, to find the meaning in the chaos, and to dance with the patterns of the universe itself.
      </div>`
      
  },

  // Page 20 — Final Reflection
  {
    type: 'html',
    html: `
      <div class="sm-slide-text">
        <strong style="font-size:1.3em; color: yellow;">✨ Cosmic Reflections ✨</strong><br><br>
        We jammed with Pythagoras 🎵🍧; walked Euclid & Bombelli’s arches 🏛️🔮; moved with Galileo & Newton 🚀🎶;
        decoded Turing’s echoes 🤖➕; heard Brahmagupta’s zeros 0️⃣🤫; chased Lovelace’s rhythms 💻🌩️ and Gauss’s patterns 🔢🎉.<br><br>
        Math is more than numbers—it's music, architecture, motion, code, and the dreams that bind them together.<br><br>
        Keep practicing at QuickServe Pavilion and Infinity Lake, and don't forget about MathTips Village and the Camping Games!<br> 
        OR start your own adventure in Chapter 1!!
      </div>`
  },

  // Page 21 — Final image
  { type: 'image', src: PRO_IMG('finalsnowconepicture.png'), caption: "Galileo and Newton are ready for a SnowCone!" },
];
// Typewriter text
const PROLOGUE_SCRIPT = `
Why math? Why now?

Because every great festival runs on patterns—lights, lines, loops—and SnowCone MathFest is no different. The syrup bubbles swirl like spirals, the queues tick like clocks, and the ghosts of good ideas only show up when you invite them with structure.

So we start small. We notice. We name. We nudge.

We learn to look twice, then a third time, until the pattern looks back.

Ready to try it the SnowCone MathFest way?
`;

// ────────────────────────────────────────────────────────────────────────────────
// Utilities
// ────────────────────────────────────────────────────────────────────────────────
function typeInto(node, text, { cps = 35, onDone } = {}) {
  node.textContent = '';
  let i = 0;
  let cancelled = false;

  const caret = document.createElement('span');
  caret.className = 'sm-type-caret';
  node.after(caret);

  const tick = () => {
    if (cancelled) return;
    node.textContent = text.slice(0, i++);
    if (i <= text.length) {
      setTimeout(tick, Math.max(8, 1000 / cps));
    } else {
      caret.remove();
      onDone?.();
    }
  };
  tick();

  return () => {
    cancelled = true;
    node.textContent = text;
    caret.remove();
    onDone?.();
  };
}

function resetContainerStyles() {
  const c = document.querySelector(SELECTORS.container);
  if (!c) return;
  c.style.display = '';
  c.style.alignItems = '';
  c.style.justifyContent = '';
  c.removeAttribute('style');
}
// Hoisted, module-scope handler (function declaration = hoisted)
// Hoisted, module-scope handler — single source of truth
function onChaptersChanged(e) {
  // Only re-render if the chapter menu is visible
  if (document.querySelector('.sm-chapter-menu')) {
    renderChapterMenu(e?.detail);
  }
}

// 🔔 Chapter-complete XP + SFX hook
// 🔔 Chapter-complete XP + SFX hook
function onChapterComplete(e) {
  const detail = e?.detail || {};
  const chapterId = detail.chapterId;

  console.log('[StoryMode] sm:chapterComplete fired:', detail);

  if (!chapterId) return;

  // We only care about numbered chapters ch1–ch5.
  // Prologue already has its own 500 XP + badge flow.
  if (!/^ch[1-5]$/.test(chapterId)) {
    console.log('[StoryMode] chapterComplete ignored (not a main chapter):', chapterId);
    return;
  }

  // 🌟 100 XP per chapter completion, with the same popup system
  try {
    awardXP(100, {
      anchor: null,
      reason: `chapter ${chapterId} complete`,
    });
    console.log('[StoryMode] XP awarded for chapter:', chapterId);
  } catch (err) {
    console.warn('[StoryMode] chapter XP award failed:', err);
  }

  // 🎧 Sound effect only for ch1–ch4, not for the end of ch5
  const n = Number(chapterId.replace('ch', '')) || 0;
  if (n >= 1 && n <= 4) {
    try {
      console.log('[StoryMode] playing chapter-complete SFX for', chapterId);
      playSFX('QuikServemilestone');
    } catch (err) {
      console.warn('[StoryMode] chapter complete SFX failed:', err);
    }
  } else {
    console.log('[StoryMode] no SFX for final chapter', chapterId);
  }
}


// ────────────────────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────────────────────
function loadStoryMode() {
  appState.setMode('story');
  smStartInventoryWatcher();
  swapModeBackground('storymodeForest');

  // 🔹 mark body so iOS-only CSS can target Story the same way as Kids Camping
  document.body.classList.add(SM_BODY_CLASS);

  const container = document.querySelector(SELECTORS.container);
  const menuWrapper = document.querySelector(SELECTORS.menuWrapper);
  menuWrapper?.classList.add('hidden');
  if (container) {
    container.classList.remove('hidden');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
  }

  renderIntroScreen();
  wireHandlersForCurrentRoot();
  document.querySelectorAll('.sm-aspect-wrap, .sm-game-frame, .sm-intro').forEach(preventDoubleTapZoom);

  wireSMAudioUnlockOnce();

  // Global listeners — add once
  if (!__smWired) {
    window.addEventListener('sm:backToChapterMenu', backToChapterMenu);
    window.addEventListener('sm:chaptersChanged', onChaptersChanged);
    window.addEventListener('sm:chapterComplete', onChapterComplete);
    __smWired = true;
  }
}

export function stopStoryMode() {
  unwireHandlers();
  unwireSMAudioUnlock();
  smStopInventoryWatcher();
  stopStoryRotation();

  // 🔹 clear Story body flag so iOS padding stops applying
  document.body.classList.remove(SM_BODY_CLASS);

  try { stopTrack(); } catch {}
  try { if (getLooping()) toggleLoop(); } catch {}

  const container = document.querySelector(SELECTORS.container);
  if (container) {
    container.innerHTML = '';    // 🧼 hard clear like other modes
    container.classList.add('hidden');
    container.style.display = 'none';
  }

  applyBackgroundTheme();

  if (__smWired) {
    window.removeEventListener('sm:backToChapterMenu', backToChapterMenu);
    window.removeEventListener('sm:chaptersChanged', onChaptersChanged);
    window.removeEventListener('sm:chapterComplete', onChapterComplete);
    __smWired = false;
  }
}


// ────────────────────────────────────────────────────────────────────────────────
// Screens
// ────────────────────────────────────────────────────────────────────────────────
function renderIntroScreen() {
  const container = document.querySelector(SELECTORS.container);
  if (!container) return;
  resetContainerStyles();

  container.classList.remove('hidden');
  container.removeAttribute('style');

  container.innerHTML = `
    <div class="sm-aspect-wrap">
      <div class="sm-game-frame">
        <img id="modeBackground" class="sm-bg-img" src="${BG_SRC}" alt="Story Mode Background"/>

        <section class="sm-intro">
          <div class="sm-intro-stack">
            <div class="sm-speech">
              My name’s <span class="glitch-name" data-text="Jeh̶n̶k̶">Jeh̶n̶k̶</span> — curator of SnowCone MathFest.
              The syrup stains never wash out and the math ghosts won’t stop lining up.
              Pull up a chair. I’ll tell you how it all began…
            </div>

            <div class="sm-director-zone">
              <div class="sm-director-wrap">
                <img class="sm-director-img" src="${DIRECTOR_SRC}" alt="Jeh̶n̶k̶ portrait"/>
              </div>
            </div>

            <div class="sm-intro-buttons">
              <button id="smHearStory" class="sm-btn sm-btn-primary">🍧 Hear the Story</button>
            </div>
          </div>

          <div class="sm-bottom-bar">
            <button id="smBackToMenu" class="sm-square-btn sm-left">🔙</button>
          </div>
        </section>
      </div>
    </div>
  `;

  elRoot = container.querySelector('.sm-aspect-wrap');
  repaintBackground();

  wireHandlersForCurrentRoot();
  document.querySelectorAll('.sm-aspect-wrap, .sm-game-frame, .sm-intro').forEach(preventDoubleTapZoom);
}




function renderChapterMenu() {
  const container = document.querySelector(SELECTORS.container);
  if (!container) return;

  const unlockedSet = smGetUnlocked();
  const devUnlock = !!window.devFlags?.unlockAllChapters;

  const unlockedCh2 =
    devUnlock ||
    unlockedSet.has('ch2') ||
    appState.hasItem?.(ItemIds.MASTER_SIGIL);

  const unlockedCh3 =
    devUnlock ||
    unlockedSet.has('ch3');

  const unlockedCh4 =
    devUnlock ||
    unlockedSet.has('ch4');

  const unlockedCh5 =
    devUnlock ||
    unlockedSet.has('ch5');

  // 🔍 is this the native iOS build?
  const iosExclusive = isIOSNativeExclusive();

  container.innerHTML = `
    <div class="sm-aspect-wrap">
      <div class="sm-game-frame sm-is-intro">
        <img id="modeBackground" class="sm-bg-img" src="${BG_SRC}" alt="Story Mode Background"/>

        <section class="sm-chapter-menu">
          <h2 class="sm-chapter-title">Story Mode Forest</h2>

          <div class="sm-chapter-list">
            <button class="sm-btn sm-btn-primary" id="smPrologue">Prologue</button>

            <button class="sm-btn sm-btn-primary" id="smCh1">
              Chapter 1 — I got a Ticket!
            </button>

            <button
               class="sm-btn ${unlockedCh2 ? 'sm-btn-primary' : 'sm-btn-secondary'}"
               id="smCh2"
               ${unlockedCh2 ? '' : 'disabled title="Find the Perfect SnowCone in Chapter 1 to unlock"'}
             >
               Chapter 2 — Four Customers
            </button>

            <button
               class="sm-btn ${unlockedCh3 ? 'sm-btn-primary' : 'sm-btn-secondary'}"
               id="smCh3"
               ${unlockedCh3 ? '' : 'disabled title="Finish Chapter 2 to unlock"'}
            >
               Chapter 3 — See the Music
            </button>

            <button
               class="sm-btn ${unlockedCh4 ? 'sm-btn-primary' : 'sm-btn-secondary'}"
               id="smCh4"
               ${unlockedCh4 ? '' : 'disabled title="Follow the Dino into the forest to unlock"'}
            >
               Chapter 4 — Portal in the Forest
            </button>

            <button
              class="sm-btn ${unlockedCh5 ? 'sm-btn-primary' : 'sm-btn-secondary'}"
              id="smCh5"
              ${unlockedCh5 ? '' : 'disabled title="Finish Chapter 4 to unlock"'}
            >
              Chapter 5 — SnowCone Endings
            </button>



            <!-- 🌟 Always visible, but only clickable in native iOS -->
            <button
              class="sm-btn ${
                iosExclusive
                  ? 'sm-btn-primary'
                  : 'sm-btn-secondary sm-btn-locked'
              }"
              id="smChJournal"
              ${iosExclusive ? '' : 'disabled aria-disabled="true" title="Available in the iOS app"'}
            >
              Creator&apos;s Journal (iOS Exclusive)
            </button>

          </div>

          <div class="sm-chapter-note">
            Pick Prologue to begin! <br> Future chapters unlock as you play.
          </div>

          <div class="sm-bottom-bar">
            <button id="smBackToMenu" class="sm-square-btn sm-left">🔙</button>
            <button id="smMute" class="sm-square-btn sm-right ${isMuted() ? 'muted' : ''}">
              ${isMuted() ? '🔇' : '🔊'}
            </button>
          </div>
        </section>
      </div>
    </div>
  `;

  const flags = appState.flags || {};
  const storyDone = flags.ending_way_home || flags.ending_driver_loop;
  const creditsSeen = flags.story_credits_seen;

  if (storyDone && !creditsSeen) {
    // 🌈 Schedule the credits to roll a second or two after we show the menu
    scheduleStoryCredits(2000);
    // Flag handled so we don’t keep spamming credits on every open
    appState.setFlag?.('story_credits_seen', true);
    appState.saveToStorage?.();
  }

  elRoot = container.querySelector('.sm-aspect-wrap');
  repaintBackground();

  // Story music: random track, no loop; rotation handles next picks
  if (!isPlaying?.()) {
    kickStoryMusic({ forceNew: true, rotate: true });
    startStoryRotation();
  }

  wireHandlersForCurrentRoot();
}
function renderPrologueReader() {
  const container = document.querySelector(SELECTORS.container);
  if (!container) return;

  container.innerHTML = `
    <div class="sm-aspect-wrap">
      <div class="sm-game-frame sm-is-intro">
        <img id="modeBackground" class="sm-bg-img" src="${BG_SRC}" alt="Story Mode Background"/>

        <section class="sm-prologue">
          <div class="sm-typewrap">
            <div class="sm-type" id="smTypeNode"></div>
          </div>
          <div class="sm-prologue-controls">
            <button id="smSkipType" class="sm-btn sm-btn-secondary">⏩ Skip</button>
            <button id="smReady" class="sm-btn sm-btn-primary" style="display:none">I’m Ready 🎵</button>
          </div>
          <div class="sm-bottom-bar">
            <button id="smBackToMenu" class="sm-square-btn sm-left">🔙</button>
            <button id="smMute" class="sm-square-btn sm-right ${isMuted() ? 'muted' : ''}">
              ${isMuted() ? '🔇' : '🔊'}
            </button>
          </div>
        </section>
      </div>
    </div>
  `;

  elRoot = container.querySelector('.sm-aspect-wrap');
  repaintBackground();

  const node = elRoot.querySelector('#smTypeNode');
  const doneFast = typeInto(node, PROLOGUE_SCRIPT.trim(), {
    cps: 30,
    onDone: () => {
      elRoot.querySelector('#smSkipType')?.classList.add('hidden');
      elRoot.querySelector('#smReady')?.style.removeProperty('display');
    }
  });

  elRoot.__smDoneFast = doneFast;
  wireHandlersForCurrentRoot();
}

let slideIndex = 0;

function renderPrologueSlides() {
  slideIndex = 0;
  drawSlide();
}

function drawSlide() {
  const container = document.querySelector(SELECTORS.container);
  if (!container) return;

  const page = PROLOGUE_PAGES[slideIndex];
  if (!page) {
    backToChapterMenu();
    return;
  }

  let inner = '';
  if (page.type === 'html') {
    inner = `<div class="sm-slide sm-fade-in">${page.html}</div>`;
  } else if (page.type === 'image') {
    inner = `
      <div class="sm-slide sm-fade-in">
        <img class="sm-slide-img" src="${page.src}" alt="${page.caption ?? ''}">
        ${page.caption ? `<div class="sm-slide-text" style="margin-top:.5rem;"><em>${page.caption}</em></div>` : ''}
      </div>`;
  } else if (page.type === 'practice') {
    inner = `
      <div class="sm-slide sm-fade-in sm-practice">
        <div class="sm-slide-text" style="margin-bottom:.5rem;">
          <strong style="font-size:1.2em; color: yellow;">${page.title ?? 'Practice'}</strong>
        </div>

        <div class="sm-reveal-list">
          ${page.items.map((it, idx) => `
            <div class="sm-reveal-block sm-practice-item" data-i="${idx}">
              <div class="sm-reveal-prompt sm-prompt">${it.prompt}</div>
              <div class="sm-reveal-controls">
                <button class="sm-btn sm-btn-primary js-reveal sm-reveal" data-i="${idx}">Click to Reveal</button>
                <div class="sm-reveal-answer sm-answer" id="ans-${idx}">${it.answer ?? ''}</div>
              </div>
            </div>
          `).join('')}
        </div>

        ${page.interactive ? `
        <div class="sm-fret-wrap">
          <div class="sm-fret-title">🎛️ Try it yourself</div>
          <div class="sm-fret-meta">String length: <strong>${page.interactive.length} cm</strong></div>
          <input id="smFret" class="sm-fret-range" type="range" min="0" max="${page.interactive.length}" value="${page.interactive.defaultPress ?? 0}" step="1" />
          <div class="sm-fret-readout">
            Press at <span id="smPressVal">0</span> cm →
            vibrating length <span id="smVibeLen">0</span> cm =
            <span id="smFrac">—</span>
            <span id="smInterval" class="sm-interval-tag"></span>
          </div>
        </div>` : ``}
      </div>`;
  } else {
    inner = `<div class="sm-slide sm-fade-in"></div>`;
  }

  container.innerHTML = `
    <div class="sm-aspect-wrap">
      <div class="sm-game-frame sm-is-intro">
        <img id="modeBackground" class="sm-bg-img" src="${BG_SRC}" alt="Story Mode Background"/>

        <section class="sm-prologue">
          <div class="sm-typewrap">${inner}</div>

          <div class="sm-prologue-controls">
            <button id="smPrev" class="sm-btn sm-btn-secondary" ${slideIndex === 0 ? 'disabled' : ''}>⬅️ Back</button>
            <button id="smNext" class="sm-btn sm-btn-primary">
              ${slideIndex === PROLOGUE_PAGES.length - 1 ? 'Finish' : 'Next ➡️'}
            </button>
          </div>

          <div class="sm-bottom-bar">
            <button id="smBackToMenu" class="sm-square-btn sm-left">🔙</button>
            <button id="smMute" class="sm-square-btn sm-right ${isMuted() ? 'muted' : ''}">
              ${isMuted() ? '🔇' : '🔊'}
            </button>
          </div>
        </section>
      </div>
    </div>
  `;

  elRoot = container.querySelector('.sm-aspect-wrap');

  const nextBtn = elRoot.querySelector('#smNext');

  // 🔒 Practice slides: lock "Next" until all reveals are opened
  if (page.type === 'practice') {
    const revealButtons = elRoot.querySelectorAll('.js-reveal');
    const answers       = elRoot.querySelectorAll('.sm-reveal-answer');

    // Only guard if we actually have reveal content
    if (revealButtons.length && answers.length) {
      if (nextBtn) {
        nextBtn.disabled = true;
        nextBtn.classList.add('is-locked'); // purely cosmetic; your .sm-btn[disabled] already styles it
      }

      const checkAllRevealed = () => {
        const remaining = elRoot.querySelectorAll('.sm-reveal-answer:not(.is-open)').length;
        if (remaining === 0 && nextBtn) {
          nextBtn.disabled = false;
          nextBtn.classList.remove('is-locked');
        }
      };

      revealButtons.forEach(btn => {
        btn.addEventListener(
          'click',
          () => {
            const i = +btn.dataset.i;
            const ans = elRoot.querySelector(`#ans-${i}`);
            if (ans && !ans.classList.contains('is-open')) {
              ans.classList.add('is-open');

              const item = PROLOGUE_PAGES[slideIndex].items[i];
              if (item?.sfx) playSFX(item.sfx);

              awardXP(25, { anchor: btn, reason: 'practice reveal' });
            }
            btn.setAttribute('disabled', 'true');

            // 🧮 After each reveal, re-check if all are open
            checkAllRevealed();
          },
          { once: true }
        );
      });
    }

    // 🎸 Interactive fretboard stays the same
    if (page.interactive) {
      const L = page.interactive.length || 60;
      const fret        = elRoot.querySelector('#smFret');
      const pressOut    = elRoot.querySelector('#smPressVal');
      const vibeLenOut  = elRoot.querySelector('#smVibeLen');
      const fracOut     = elRoot.querySelector('#smFrac');
      const intervalOut = elRoot.querySelector('#smInterval');

      const gcd = (a,b) => { a=Math.abs(a); b=Math.abs(b); while(b){[a,b]=[b,a%b]} return a||1; };
      const simp = (n,d) => { const g = gcd(n,d); return `${(n/g)}/${(d/g)}`; };
      const intervalLabel = (press, len) => {
        const remain = len - press;
        const r = remain / len;
        if (press === len/2) return 'Octave ↑';
        if (Math.abs(r - 2/3) < 0.001) return 'Perfect Fifth ↑';
        if (Math.abs(r - 3/4) < 0.001) return 'Perfect Fourth ↑';
        if (Math.abs(r - 3/5) < 0.001) return 'Major Third-ish ↑';
        return '';
      };

      const update = () => {
        const p   = Number(fret.value);
        const vib = Math.max(0, L - p);
        pressOut.textContent   = p.toString();
        vibeLenOut.textContent = vib.toString();
        fracOut.textContent    = simp(vib, L);

        const label = intervalLabel(p, L);
        intervalOut.textContent = label ? `• ${label}` : '';
        intervalOut.classList.toggle('is-emph', !!label);

        const now = performance.now();
        if (label && label !== __lastInterval && (now - __lastPlayTs > 350)) {
          playIntervalBeep(label);
          __lastInterval = label;
          __lastPlayTs = now;
        }
      };

      fret?.addEventListener('input', update);
      update();
    }
  } else {
    // Non-practice slides: make sure Next is unlocked
    if (nextBtn) {
      nextBtn.disabled = false;
      nextBtn.classList.remove('is-locked');
    }
  }

  // 🌟 Final slide: +500 XP + badge (same behavior, just using the shared nextBtn)
  if (nextBtn && slideIndex === PROLOGUE_PAGES.length - 1) {
    nextBtn.addEventListener(
      'click',
      () => {
        awardXP(500, { anchor: nextBtn, reason: 'prologue complete' });
        awardBadge('story_prologue');
        onPrologueCompleteOnce();
      },
      { once: true, capture: true }
    );
  }

  wireHandlersForCurrentRoot();
}

// ────────────────────────────────────────────────────────────────────────────────
// Wiring
// ────────────────────────────────────────────────────────────────────────────────
function wireHandlersForCurrentRoot() {
  unwireHandlers();

  clickHandler = (e) => {
    // Global UI
    if (e.target.closest('#smBackToMenu')) {
      const inPrologue = !!document.querySelector('.sm-prologue');
      if (inPrologue) backToChapterMenu();
      else backToMainMenu();
      return;
    }

    if (e.target.closest('#smMute')) {
      const muted = toggleMute();
      const btn = elRoot?.querySelector('#smMute');
      if (btn) {
        btn.textContent = muted ? '🔇' : '🔊';
        btn.classList.toggle('muted', muted);
      }
      return;
    }

    // Intro + Chapter menu navigation
    if (e.target.closest('#smHearStory')) { renderChapterMenu(); return; }
    if (e.target.closest('#smPrologue'))  { renderPrologueReader(); return; }
    if (e.target.closest('#smCh1'))       { smSetChapterFlag('ch1'); getEngine().start('ch1'); return; }
    if (e.target.closest('#smCh2'))       { smSetChapterFlag('ch2'); getEngine().start('ch2'); return; }
    if (e.target.closest('#smCh3'))       { smSetChapterFlag('ch3'); getEngine().start('ch3'); return; }
    if (e.target.closest('#smCh4'))       { smSetChapterFlag('ch4'); getEngine().start('ch4'); return; }
    if (e.target.closest('#smCh5'))       { smSetChapterFlag('ch5'); getEngine().start('ch5'); return; }


    // 🌟 NEW: iOS-only Creator's Journal chapter
    if (e.target.closest('#smChJournal')) {
      // Hard gate: if someone somehow sees this in browser, ignore.
      if (!isIOSNativeExclusive()) return;
      smSetChapterFlag('chJournal');
      getEngine().start('chJournal');
      return;
    }

    // Prologue flow
    if (e.target.closest('#smSkipType')) { elRoot?.__smDoneFast?.(); return; }
    if (e.target.closest('#smReady'))    { renderPrologueSlides();  return; }
    if (e.target.closest('#smNext')) {
      const btn = elRoot?.querySelector('#smNext');
      if (!btn?.disabled) {
        slideIndex++;
        drawSlide();
      }
      return;
    }
    if (e.target.closest('#smPrev')) {
      slideIndex = Math.max(0, slideIndex - 1);
      drawSlide();
      return;
    }
  };

  keyHandler = (e) => {
    if (e.key === 'Escape') {
      backToChapterMenu();
      e.preventDefault();
      return;
    }

    if (e.key === 'Enter') {
      const ready = elRoot?.querySelector('#smReady');
      const skip  = elRoot?.querySelector('#smSkipType');

      if (ready && ready.style.display !== 'none') {
        ready.click();
        e.preventDefault();
        return;
      }

      if (skip && !skip.classList.contains('hidden')) {
        skip.click();
        e.preventDefault();
        return;
      }

      const pro =
        elRoot?.querySelector('#smNext') ||
        elRoot?.querySelector('#smPrologue') ||
        elRoot?.querySelector('#smHearStory');

      if (pro && !pro.disabled) {
        pro.click();
        e.preventDefault();
        return;
      }
    }

    if (e.key === 'ArrowRight') {
      const next =
        elRoot?.querySelector('#smNext') ||
        elRoot?.querySelector('#smPrologue');

      if (next && !next.disabled) {
        next.click();
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowLeft') {
      const prev = elRoot?.querySelector('#smPrev');
      if (prev && !prev.disabled) {
        prev.click();
        e.preventDefault();
      }
      return;
    }
  };

  elRoot?.addEventListener('click', clickHandler);
  window.addEventListener('keydown', keyHandler);
}


function unwireHandlers() {
  if (elRoot && clickHandler) elRoot.removeEventListener('click', clickHandler);
  if (keyHandler) window.removeEventListener('keydown', keyHandler);
  clickHandler = null;
  keyHandler = null;
}

function backToMainMenu() {
  playTransition(() => {
    stopStoryRotation();
    stopStoryMode();
    document.querySelector(SELECTORS.menuWrapper)?.classList.remove('hidden');
    applyBackgroundTheme();
  });
}


function repaintBackground() {
  requestAnimationFrame(() => {
    setTimeout(() => {
      const img = document.getElementById('modeBackground');
      if (img) img.src = img.src;
    }, 10);
  });
}

export { loadStoryMode };

// ────────────────────────────────────────────────────────────────────────────────
// Audio helpers
// ────────────────────────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────────────────────────
// Story music rotation — flexible + no immediate repeats
// ────────────────────────────────────────────────────────────────────────────────
function unlockHowlerCtx() {
  try {
    const H = window.Howler ?? globalThis.Howler;
    if (H && H._muted) H.mute(false);
    if (H?.ctx && H.ctx.state === 'suspended') { H.ctx.resume().catch(() => {}); }
  } catch {}
}

function pickNextStoryTrack(excludeId = null) {
  try {
    const pool = STORY_TRACKS.filter(Boolean);
    if (!pool.length) return null;

    // prefer the last-played id if we have it, else ask manager
    const curOrLast = excludeId ?? __smLastStoryTrack ?? (() => { try { return currentTrackId?.(); } catch { return null; } })();

    const eligible = pool.length > 1 ? pool.filter(id => id !== curOrLast) : pool;
    const idx = Math.floor(Math.random() * eligible.length);
    return eligible[idx] ?? pool[0];
  } catch {
    return STORY_TRACKS[0] ?? null;
  }
}

function backToChapterMenu() {
  smSetChapterFlag(null);
  renderChapterMenu();
  wireHandlersForCurrentRoot();
}

function ensureStoryLoop() {
  try { if (!getLooping?.()) toggleLoop(); } catch {}
}

/**
 * Kick story music:
 * - random pick from STORY_TRACKS
 * - never same as last
 * - rotate: don't loop; when song ends we'll start another
 */
function kickStoryMusic({ forceNew = false, rotate = false } = {}) {
  // Don’t fight the browser if we’re backgrounded
  if (typeof document !== 'undefined' && document.hidden) return;

  const wantId = pickNextStoryTrack(__smLastStoryTrack);
  if (!wantId) return;

  unlockHowlerCtx();

  let curId = null;
  let playing = false;
  try {
    curId   = currentTrackId?.();
    playing = isPlaying?.();
  } catch {
    // ignore, fall back to defaults
  }

  // Decide whether we *actually* need to change tracks
  const needChange = forceNew
    ? (STORY_TRACKS.length > 1 ? true : !playing)
    : (!playing || curId !== wantId);

  if (needChange) {
    try {
      // 🔇 Let musicManager handle crossfades/cleanup; we just request the id.
      playTrack(wantId);
      __smLastStoryTrack = wantId;
      // console.log('[StoryMusic] play →', wantId, '(prev was', curId, ')');
    } catch (err) {
      console.warn('[StoryMusic] playTrack failed:', err);
    }
  }

  // In “rotation” mode we explicitly *don’t* force looping —
  // we want each track to end naturally and then our rotation timer
  // will spin up the next one. If rotate is false, we fall back to “loop story”.
  if (rotate) {
    try {
      if (getLooping?.()) toggleLoop(); // ensure non-loop for rotation mode
    } catch {}
  } else {
    ensureStoryLoop();
  }
}

function startStoryRotation() {
  // Rotation mode = non-looping; we advance when tracks end.
  try {
    if (getLooping?.()) toggleLoop();
  } catch {}

  if (__smRotateTimer) return;

  __smRotateTimer = setInterval(() => {
    try {
      if (typeof document !== 'undefined' && document.hidden) return;

      // If we’ve just asked for a track, chill for a moment.
      if (__smRotateLock) return;

      const playing = isPlaying?.();
      if (!playing) {
        __smRotateLock = true;
        kickStoryMusic({ forceNew: true, rotate: true });

        // Give Howler ~1s to spin up before we ask again
        setTimeout(() => { __smRotateLock = false; }, 1100);
      }
    } catch (err) {
      console.warn('[StoryMusic] rotation tick error:', err);
    }
  }, 1000);
}

function stopStoryRotation() {
  if (__smRotateTimer) {
    clearInterval(__smRotateTimer);
    __smRotateTimer = null;
  }
  __smRotateLock = false;
}


const smDing = new Howl({
  src: [`${BASE}assets/audio/SFX/honk1.mp3`],
  volume: 0.25,
});

const smDing2 = new Howl({
  src: [`${BASE}assets/audio/SFX/honk2.mp3`],
  volume: 0.25,
});

// 🔊 NEW: Story-mode use of the QuickServe milestone chime
const smMilestone = new Howl({
  src: [`${BASE}assets/audio/SFX/QuikServemilestone.mp3`], // 👈 check this path/name
  volume: 0.6,                                             // 🔊 louder over music
});

function playSFX(name) {
  console.log('[StoryMode] playSFX called with:', name);

  // Make sure Howler is actually alive and unmuted before we play
  try {
    unlockHowlerCtx();
  } catch (err) {
    console.warn('[StoryMode] unlockHowlerCtx failed (safe to ignore):', err);
  }

  if (name === 'honk1') {
    smDing.play();
  } else if (name === 'honk2') {
    smDing2.play();
  } else if (name === 'QuikServemilestone') {
    try {
      smMilestone.play();
    } catch (err) {
      console.warn('[StoryMode] smMilestone.play() failed, falling back to honk1:', err);
      smDing.play();
    }
  }
}







function playIntervalBeep(label) {
  try {
    const H = window.Howler ?? globalThis.Howler;
    __smAudioCtx = (__smAudioCtx || H?.ctx || new (window.AudioContext || window.webkitAudioContext)());
    if (__smAudioCtx.state === 'suspended') __smAudioCtx.resume().catch(() => {});
  } catch {}
  const ac = __smAudioCtx;
  if (!ac) return;

  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();

  const baseHz = 220;
  const mult =
    label.includes('Octave')        ? 2.0 :
    label.includes('Perfect Fifth') ? 3/2 :
    label.includes('Perfect Fourth')? 4/3 :
    label.includes('Major Third')   ? 5/4 : 1.0;

  osc.type = 'sine';
  osc.frequency.value = baseHz * mult;

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.12, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

  osc.connect(gain);
  gain.connect(ac.destination);

  osc.start(now);
  osc.stop(now + 0.4);
}

// XP popup helpers
function awardXP(amount, opts = {}) {
  const { anchor = null, noPopup = false, reason = '' } = opts;
  try {
    appState.addXP(amount);
    if (!noPopup) showXPPopup(`+${amount} XP`, anchor);
    console.log(`✨ [StoryMode] +${amount} XP ${reason}`);
  } catch (err) {
    console.warn('XP award failed:', err);
  }
}

function showXPPopup(text, anchorEl) {
  const container = document.body;
  const popup = document.createElement('div');
  popup.className = 'sm-xp-popup';
  popup.textContent = text;

  Object.assign(popup.style, {
    position: 'fixed',
    zIndex: 9999,
    fontFamily: '"Orbitron", sans-serif',
    fontSize: 'clamp(1rem, 1.2vh + 0.6rem, 1.4rem)',
    color: '#9ff',
    textShadow: '0 0 8px rgba(0,255,238,0.55)',
    pointerEvents: 'none',
    opacity: '0',
    transition: 'transform 0.9s ease, opacity 1.2s ease',
  });

  if (anchorEl) {
    const rect = anchorEl.getBoundingClientRect();
    popup.style.left = rect.left + rect.width/2 + 'px';
    popup.style.top = rect.top - 10 + 'px';
    popup.style.transform = 'translate(-50%, 0)';
  } else {
    popup.style.left = '50%';
    popup.style.bottom = '12vh';
    popup.style.transform = 'translateX(-50%)';
  }

  container.appendChild(popup);

  requestAnimationFrame(() => {
    popup.style.opacity = '1';
    popup.style.transform += ' translateY(-24px)';
    setTimeout(() => {
      popup.style.opacity = '0';
      popup.style.transform += ' translateY(-44px)';
    }, 900);
    setTimeout(() => popup.remove(), 1600);
  });
}

export function onPrologueCompleteOnce() {
  // award Story-bucket XP the first time only
  if (!appState.profile.completedModes?.includes?.('story')) {
    try {
      appState.addStoryXP?.(800);         // Story bucket cap example
      appState.markModeComplete?.('story');
    } catch {}
  }
}

// ────────────────────────────────────────────────────────────────────────────────
// Mobile audio unlock
// ────────────────────────────────────────────────────────────────────────────────
function wireSMAudioUnlockOnce() {
  if (smAudioUnlockOnce) return;
  smAudioUnlockOnce = () => {
    try {
      const H = window.Howler ?? globalThis.Howler;
      if (H?.ctx && H.ctx.state === 'suspended') {
        H.ctx.resume().then(() => console.log('🔓 [SM] Howler AudioContext unlocked'));
      }
    } catch {}
    document.body.removeEventListener('touchstart', smAudioUnlockOnce);
    document.body.removeEventListener('click', smAudioUnlockOnce);
    smAudioUnlockOnce = null;
  };
  document.body.addEventListener('touchstart', smAudioUnlockOnce, { once: true });
  document.body.addEventListener('click', smAudioUnlockOnce, { once: true });
}
function unwireSMAudioUnlock() {
  if (!smAudioUnlockOnce) return;
  document.body.removeEventListener('touchstart', smAudioUnlockOnce);
  document.body.removeEventListener('click', smAudioUnlockOnce);
  smAudioUnlockOnce = null;
}


// ── inline chapter-unlock reader (matches chapterEngine.js key)
const SM_UNLOCK_KEY = 'sm_unlocked_chapters_v1';
function smGetUnlocked(){
  try { return new Set(JSON.parse(localStorage.getItem(SM_UNLOCK_KEY) || '["ch1"]')); }
  catch { return new Set(['ch1']); }
}
