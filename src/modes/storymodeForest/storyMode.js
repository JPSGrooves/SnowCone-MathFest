import './storyMode.css';
import { swapModeBackground, applyBackgroundTheme } from '../../managers/backgroundManager.js';
import { playTransition } from '../../managers/transitionManager.js';
import { appState } from '../../data/appState.js';
import { preventDoubleTapZoom } from '../../utils/preventDoubleTapZoom.js';
// top of storyMode.js imports:
// storyMode.js (top)
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
// managers/sfxManager.js
import { Howl } from 'howler';




const SELECTORS = {
  container: '#game-container',
  menuWrapper: '.menu-wrapper',
};

let elRoot = null;  // .sm-aspect-wrap in current screen
let keyHandler = null;
let clickHandler = null;
let smAudioUnlockOnce = null;

let __smAudioCtx = null;
let __lastInterval = '';
let __lastPlayTs = 0;

// Assets
const BASE = import.meta.env.BASE_URL;
const BG_SRC = `${BASE}assets/img/modes/storymodeForest/storyBG.png`;
const DIRECTOR_SRC = `${BASE}assets/img/characters/storyMode/jehnk.png`;


// ---- Prologue assets (adjust if your paths differ) ----
const SFX_PATHS = {
  p25: `${BASE}assets/audio/QuikServe points25.mp3`,
  p100: `${BASE}assets/audio/QuikServe points100.mp3`,
};
// Put this where PRO_IMG is defined
const PRO_IMG = (name) => `${import.meta.env.BASE_URL}assets/img/characters/storyMode/${name}`;


// ---- Prologue pages: text / image(+caption) / practice(reveal items) ----
const PROLOGUE_PAGES = [
  // Page 1 — Why Math? Why Now?
{
  type: 'html',
  html: `
      <div class="sm-slide-text">
        <strong style="font-size:1.4em; color: yellow;">How it all Started..</strong><br>
        I hated math when I was young.<br>
        It was cold 🥶. It was lifeless 💀. It was just numbers 🔢.<br>
        I needed it to move 🕺💃. To sing 🎶🎤. To matter ❤️.<br>
        That's why I started the SnowCone MathFest 🍧🚚🎉.<br>
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

  // Page 2 — Pythagorus text
  {
    type: 'html',
    html: `
      <div class="sm-slide-text">
        <strong style="font-size:1.2em; color: yellow;">Pythagorus - Song of Fractions</strong><br><br>
        <span style="color:#00ccff;">"Music is the math you already know 🎶 — deep in your bones 💀🎸.<br><br>
        When you go up the string and press exactly at its midpoint 📏✂️, you’ve traveled halfway along its path ↔️,
        yet somehow you can feel the whole journey echo back to you 🔄 from this midpoint.<br><br>
        It’s as if the universe has whispered its secret 🌌🤫: that harmony lives in the space between two points."</span>
      </div>`
  },
  // Page 3 — Pythagorus image
  { type: 'image', src: PRO_IMG('pythagoraspicture.png'), caption: "Pythagorus Eyes the Gates" },
    // Page 2A — Pythagorus text response
  {
    type: 'html',
    html: `
      <div class="sm-slide-text">
        <img src="${PRO_IMG('cosmicCone.png')}" 
            alt="cosmic cone" 
            class="sm-slide-image sm-cosmic">
        <strong style="font-size:1.2em; color: yellow;">I served him a SnowCone 🍧...</strong><br>
        ...and knew that here at SnowCone MathFest 🌈🎉,
        every neon beat is an octave you’ve already unlocked 🎵🔓 —<br><br>
        Maybe we're always just halfway to the next octave, but we can always discover the hidden frequencies
        singing along our path 👆🎶.
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
        sfx: 'smDing'
      },
      {
        prompt: "And when he presses at 20cm?",
        answer: "2/3 (vibrates, creating a fifth above the original note! 🎶)",
        sfx: 'smDing2'
      }
    ],
    interactive: {
      length: 60, // cm
      defaultPress: 25
    }
  },



  // Page 5 — Euclid text
  {
    type: 'html',
    html: `
      <div class="sm-slide-text">
        <strong style="font-size:1.3em; color: yellow;">Euclid Approches the Truck</strong><br>
        <span style="color:#00ccff;">"All structure, seen or unseen, begins with a line ✏️➡️📏."</span>
        He paused, tracing his proofs and figures through the void —
        <span style="color:#00ccff;">"The simplest gesture births every shape, every temple, every constellation above.
        Each angle is a handshake between points 🤝, each intersection a moment of cosmic agreement.<br><br>
        Even a circle is but a promise kept — every point faithful to its center 🌀.<br>
        A proof is a path through the fog, where reason becomes lantern-light 🏮.<br>
        Infinity itself is a patient horizon, waiting for steady interpretation to arrive 🌌."</span>
      </div>`
  },
  // Page 6 — Euclid image
  { type: 'image', src: PRO_IMG('euclidpicture.png'), caption: "Euclid Perfects the Cone" },
  {
    type: 'html',
    html: `
      <div class="sm-slide-text">
        <strong style="font-size:1.3em; color: yellow;">Euclid Recieves the Cone</strong><br>
        By connecting the two dots in front of him, Euclid wasn’t merely drawing — he was weaving the very fabric of
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
          "Euclid immediately notices the odd-shaped SnowCone and measures a right triangle with legs of 3 cm and 4 cm. " +
          "<span style='color:#00ccff'>“What’s the hypotenuse length?”</span> 🤔📐",
        answer: `5 cm is the longest side, opposite the right angle (3² + 4² = 9 + 16 = 25 → √25 = 5)`,
        sfx: 'smDing'
      },
      {
        prompt:
          "<strong style='font-size:1.1em; color: yellow;'>Follow-Up 🍧🔍</strong><br>" +
          "Next, Euclid sketches the perfect SnowCone: two equal sides of 6 cm and a top edge of 4 cm. " +
          "<span style='color:#00ccff'>“What’s the perimeter of this neon triangle?”</span> 🤔📏",
        answer: `16 cm (6 + 6 + 4 = 16) <span style='color:#00ccff;'>▽</span>!!
                <br>
                <img src="${PRO_IMG('cosmicCone.png')}" alt="cosmic cone" class="sm-cone-inline">`,
        sfx: 'smDing2'
      }
    ]
  },


  // Page 8 — Galileo & Newton text
  {
    type: 'html',
    html: `
      <div class="sm-slide-text">
        <strong style="font-size:1.2em; color: yellow;">Galileo &amp; Newton — Symphony of Motion</strong><br>
        <span style='color: white;'>Galileo:</span> <span style='color: #00ccff;'>\"Everything moves if you watch carefully enough 🎵🔭. Even what seems at rest is weaving through space at unimaginable speeds—the Earth spins, the Moon orbits, and light itself races across the void. Observation is the instrument that reveals the hidden dance of the cosmos.\"</span><br>
        <span style='color: white;'>Newton:</span> <span style='color: #00ccff;'>\"And every motion has a cause 🪐⚙️. Forces sculpt the tapestry of reality: gravity pulls apples and planets alike, inertia resists every change, and for every action there’s an equal echo. Even the unseen hand of attraction shapes the universe’s grand ballet.\"</span><br><br>
        I slung two neon SnowCones 🍧🍧 and wondered how to measure the speed of their cosmic stroll. 🚶🚶‍♂️
      </div>`
  },

  // Page 9 — Galileo & Newton image
  { type: 'image', src: PRO_IMG('galileonewtonpicture.png'), caption: "Galileo & Newton discussing motion" },

  // Page 10 — Galileo/Newton practice
  {
    type: 'practice',
    title: "Practice Problems 🍧🚀",
    items: [
      {
        prompt: "I informed Galileo that my neon snow cone truck cruised to the MathFest at a steady pace: I traveled 60 miles in 2 hours. He asked, <span style='color: #00ccff;'>\"What was your average speed?\"</span> 🤔🚚<br>",
        answer: "30 mph (Speed = Distance ÷ Time = 60 ÷ 2)<br> Dude, that’s like a cosmic cruise! 🚀",
        sfx: 'smDing'
      },
      {
        prompt: "<strong style='font-size:1.1em; color: yellow;'>Follow-Up 🍧🔍</strong><br>" +
        "Newton asked, <span style='color: #00ccff;'>\"If you kept rolling at that speed, how far would you cruise in 5 hours?\"</span> 🤔📏<br>",
        answer: "150 miles (30 × 5)<br> tis but a cosmic hop! 🌌",
        sfx: 'smDing2'
      }
    ]
  },

  // Page 11 — Turing & Brahmagupta text
  {
    type: 'html',
    html: `
      <div class="sm-slide-text">
        <strong style="font-size:1.2em; color: yellow;">Turing &amp; Brahmagupta — Secrets and Silence</strong><br>
        I almost lost myself in the motion of the music, but then I heard Turing speak softly,
        <span style='color: #00ccff;'>\"Every puzzle is a hidden message, encoded in the patterns of the world. From the fluttering of a breeze to the circuits of a machine. Each mathematical proof, carries its own secret that reveals the logic behind chaos.\"</span><br><br>
        Brahmagupta smiled and spoke more softly, <span style='color: #00ccff;'>\"And every silence is full of numbers, each pause a zero, each gap a canvas for infinity. By listening to the stillness, we trace the balance of forces that govern both sand-grains and galaxies.\"</span><br><br>
        I quickly realized that gaps and zeros in life are clues, not emptiness. Math isn't just numbers; it’s the story of life itself, waiting for a curious mind to unfold it.
      </div>`
  },

  // Page 12 — Turing/Brahmagupta image
  { type: 'image', src: PRO_IMG('turingbrahmaguptapicture.png'), caption: "Turing & Brahmagupta: the chaos of nothingness" },

  // Page 13 — Turing/Brahmagupta practice
  {
    type: 'practice',
    title: "Practice Problems 🍧🚀",
    items: [
      {
        prompt: "Turing was excited to see the SnowCones and said, <span style='color: #00ccff;'>\"I would like to have 7 scoops.\"</span> Remembering his doubling-plus-one function as f(x) = 2x + 1, he asked, <span style='color: #00ccff;'>\"What is f(3) scoops?\"</span> 🤔<br>",
        answer: "2 × 3 + 1 = 7 = f(3) 🍧",
        sfx: 'smDing'
      },
      {
        prompt: "Brahmagupta heard me say I couldn't stack that many scoops and asked Turing: <span style='color: #00ccff;'>\"What happens when a whole scoop is multiplied or divided by 0?\"</span> 🤔<br>",
        answer: "It melts into nothing! (ZThe scoops are reduced by the silence.)",
        sfx: 'smDing2'
      }
    ]
  },

  // Page 14 — Euclid & Bombelli text
  {
    type: 'html',
    html: `
      <div class="sm-slide-text">
        <strong style="font-size:1.2em; color: yellow;">Euclid Returns to Meet Bombelli</strong><br>
        Bombelli arrived later than the rest, but the familiar voice of Euclid ran back to understand the shifting shape of the world around us.<br><br>
        <span style='color: white;'>Bombelli:</span> <span style='color: #00ccff;'>\"What you call impossible... we call architecture. We draft cathedrals in the abstract, where each imaginary unit is a soaring arch and every complex plane lays the foundation for realms unseen. In our hands, ‘i’ becomes brick, and infinity our blueprint. Here, the dream of numbers carves space itself, and what others dismiss as folly reveals its hidden symmetry and strength.\"</span><br><br>" 
        My mind was tossed in a sprightly dance and I concluded that imaginary numbers build real dreams.
      </div>`
  },

  // Page 15 — Bombelli image
  { type: 'image', src: PRO_IMG('bombellieuclidpicture.png'), caption: "Bombelli’s imaginary stance" },

  // Page 16 — Bombelli practice
  {
    type: 'practice',
    title: "Practice Problems 🍧🚀",
    items: [
      {
        prompt: "What is √(−1)?",
        answer: "i (Imaginary)",
        sfx: SFX_PATHS.p25
      },
      {
        prompt: "What is i²?",
        answer: "−1 (loops back negative)",
        sfx: SFX_PATHS.p100
      }
    ]
  },

  // Page 17 — Lovelace & Gauss text
  {
    type: 'html',
    html: `
      <div class="sm-slide-text">
        <strong style="font-size:1.2em; color: yellow;">Lovelace &amp; Gauss — Rhythm in the Storm</strong><br>
        Ada: <span style="color:#00ccff;">"Find the rhythm hidden in the storm…"</span>
        Gauss: <span style="color:#00ccff;">"They dance between the numbers…"</span><br><br>
        Chaos is a tapestry of patterns too vast for untrained eyes.
      </div>`
  },

  // Page 18 — Lovelace/Gauss image
  { type: 'image', src: PRO_IMG('lovelacegausspicture.png'), caption: "Patterns in the rain" },

  // Page 19 — Lovelace/Gauss practice
  {
    type: 'practice',
    title: "Practice Problems 🍧🚀",
    items: [
      {
        prompt: "Thunder repeats every 5s. How many repeats in 20s?",
        answer: "4 (20 ÷ 5)",
        sfx: SFX_PATHS.p25
      },
      {
        prompt: "One drop every 0.25s. In 2.5s, how many drops?",
        answer: "10 (2.5 ÷ 0.25)",
        sfx: SFX_PATHS.p25
      }
    ]
  },

  // Page 20 — Final Reflection
  {
    type: 'html',
    html: `
      <div class="sm-slide-text">
        <strong style="font-size:1.3em; color: yellow;">✨ Cosmic Reflections ✨</strong><br><br>
        We jammed with Pythagoras 🎵🍧; walked Euclid & Bombelli’s arches 🏛️🔮; moved with Galileo & Newton 🚀🎶;
        decoded Turing’s echoes 🤖➕1; heard Brahmagupta’s zeros 0️⃣🤫; chased Lovelace’s rhythms 💻🌩️ and Gauss’s patterns 🔢🎉.<br><br>
        Math is more than numbers—it's music, architecture, motion, code, and the dreams that bind them together.<br>
        Keep practicing in Quick Serve Mode, and I’ll see you in Story Mode soon!
      </div>`
  },

  // Page 21 — Final image
  { type: 'image', src: PRO_IMG('finalsnowconepicture.png'), caption: "Galileo and Newton are ready for a SnowCone!" },
];


// Typing helper
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

  // Return a cancel/finish fast function
  return () => {
    cancelled = true;
    node.textContent = text;
    caret.remove();
    onDone?.();
  };
}

// Prologue text (typewriter “Why math? Why now?” — fill with full script)
const PROLOGUE_SCRIPT = `
Why math? Why now?

Because every great festival runs on patterns—lights, lines, loops—and SnowCone MathFest is no different.
The syrups swirl like spirals, the queues tick like clocks, and the ghosts of good ideas only show up
when you invite them with structure.

So we start small. We notice. We name. We nudge.
We learn to look twice, then a third time, until the pattern looks back.

Ready to try it the SnowCone way?
`;

// Prologue slides (word → picture → reveal-practice)
const PROLOGUE_SLIDES = [
  { kind: 'text', text: 'A story is just a pattern that knows where it’s going. So is a solution.' },
  { kind: 'image', src: `${BASE}assets/img/modes/storymodeForest/storyBG.png`, alt: 'Forest motif' },
  {
    kind: 'reveal',
    prompt: 'Spot the pattern in this mini line-up. Tap “Reveal” when you think you see it.',
    answer: 'Every third cone is mint. Patterns = predictions.'
  },
];

function resetContainerStyles() {
  const c = document.querySelector(SELECTORS.container);
  if (!c) return;
  c.style.display = '';
  c.style.alignItems = '';
  c.style.justifyContent = '';
  c.removeAttribute('style');
}

// ────────────────────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────────────────────
function loadStoryMode() {
  appState.setMode('story');
  swapModeBackground('storymodeForest');

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

  // 🔓 Make sure Howler is unlockable on first tap
  wireSMAudioUnlockOnce();
}

export function stopStoryMode() {
  unwireHandlers();
  unwireSMAudioUnlock();

  try { stopTrack(); } catch {}

  // reset loop so other modes behave normally
  try { if (getLooping()) toggleLoop(); } catch {}

  const container = document.querySelector(SELECTORS.container);
  if (container) {
    container.classList.add('hidden');
    container.style.display = 'none';
  }
  applyBackgroundTheme();
}



// ────────────────────────────────────────────────────────────────────────────────
// Screens
// ────────────────────────────────────────────────────────────────────────────────
// storyMode.js — RENDER INTRO (clean, KC-like)
// storyMode.js — renderIntroScreen (drop-in)
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
              <button id="smBackToMenu" class="sm-btn sm-btn-secondary">🔙 Back to Menu</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  `;

  elRoot = container.querySelector('.sm-aspect-wrap');

  // repaint helper you already had
  repaintBackground();
}


function renderChapterMenu() {
  const container = document.querySelector(SELECTORS.container);
  if (!container) return;

  container.querySelector('.sm-game-frame')?.classList.add('sm-is-intro');

  container.innerHTML = `
    <div class="sm-aspect-wrap">
      <div class="sm-game-frame sm-is-intro">
        <img id="modeBackground" class="sm-bg-img" src="${BG_SRC}" alt="Story Mode Background"/>

        <section class="sm-chapter-menu">
          <h2 class="sm-chapter-title">Story Mode Forest</h2>

          <div class="sm-chapter-list">
            <button class="sm-btn sm-btn-primary" id="smPrologue">Prologue</button>

            <button class="sm-btn sm-btn-secondary is-disabled" id="smCh1" disabled>
              Chapter 1 — Coming Day One
            </button>

            <button class="sm-btn sm-btn-secondary is-disabled" id="smCh2" disabled>
              🔒 Chapter 2 — Paid
            </button>

            <button class="sm-btn sm-btn-secondary is-disabled" id="smCh3" disabled>
              🔒 Chapter 3 — Paid
            </button>
          </div>

          <div class="sm-chapter-note">
            Pick Prologue to begin. The others will unlock soon.
          </div>

          <!-- Bottom utility bar: left=Back, right=Mute (last chance) -->
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

  // ✅ Start prologue music only if not already playing
  if (!(isPlaying() && currentTrackId() === 'prologue')) {
    playTrackUnlocked('prologue');
    if (!getLooping()) toggleLoop(); // loop Prologue
  }

  // ✅ Let the global handler own all clicks/keys
  wireHandlersForCurrentRoot();
}


function renderPrologueReader() {
  const container = document.querySelector(SELECTORS.container);
  if (!container) return;

  container.querySelector('.sm-game-frame')?.classList.add('sm-is-intro');

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
            <button id="smReady" class="sm-btn sm-btn-primary" style="display:none">I’m Ready</button>
          </div>
        </section>
      </div>
    </div>
  `;

  elRoot = container.querySelector('.sm-aspect-wrap');
  repaintBackground();


  // ⌨️ Typewriter effect
  const node = elRoot.querySelector('#smTypeNode');
  const doneFast = typeInto(node, PROLOGUE_SCRIPT.trim(), {
    cps: 30,
    onDone: () => {
      const ready = elRoot.querySelector('#smReady');
      const skip  = elRoot.querySelector('#smSkipType');
      if (skip)  skip.style.display  = 'none';
      if (ready) ready.style.display = '';
    }
  });

  // Make Skip button callable from global handler
  elRoot.__smDoneFast = doneFast;

  // 🌍 Single handler wiring
  wireHandlersForCurrentRoot();
}



let slideIndex = 0;
function renderPrologueSlides() {
  slideIndex = 0;
  drawSlide();
}

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

function drawSlide() {
  const container = document.querySelector(SELECTORS.container);
  if (!container) return;

  const page = PROLOGUE_PAGES[slideIndex];
  if (!page) { backToChapterMenu(); return; }

  // Build the inner content for the slide type
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
    // Fallback: plain wrapper
    inner = `<div class="sm-slide sm-fade-in"></div>`;
  }

  // Frame markup:
  // - Keep content in .sm-typewrap
  // - Keep only Prev/Next in the center controls row (smaller, frees height)
  // - Dock 🔙 Menu (left) + 🔊/🔇 Mute (right) in a bottom bar like chapter select
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

  // Practice: wire reveal buttons to open answers + play SFX (per item)
  if (page.type === 'practice') {
    elRoot.querySelectorAll('.js-reveal').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = +btn.dataset.i;
        const ans = elRoot.querySelector(`#ans-${i}`);
        if (ans && !ans.classList.contains('is-open')) {
          ans.classList.add('is-open');
          const item = PROLOGUE_PAGES[slideIndex].items[i];
          if (item?.sfx) playSFX(item.sfx);
        }
        btn.setAttribute('disabled', 'true');
      }, { once: true });
    });

    // Optional interactive fretboard (kept exactly as your logic expects)
    if (page.interactive) {
      const L = page.interactive.length || 60;
      const fret = elRoot.querySelector('#smFret');
      const pressOut = elRoot.querySelector('#smPressVal');
      const vibeLenOut = elRoot.querySelector('#smVibeLen');
      const fracOut = elRoot.querySelector('#smFrac');
      const intervalOut = elRoot.querySelector('#smInterval');

      const gcd = (a,b) => { a=Math.abs(a); b=Math.abs(b); while(b){[a,b]=[b,a%b]} return a||1; };
      const simp = (n,d) => {
        const g = gcd(n,d);
        return `${(n/g)}/${(d/g)}`;
      };
      const intervalLabel = (press, len) => {
        const remain = len - press;
        const r = remain / len; // fraction vibrating
        if (press === len/2) return 'Octave ↑';
        if (Math.abs(r - 2/3) < 0.001) return 'Perfect Fifth ↑';
        if (Math.abs(r - 3/4) < 0.001) return 'Perfect Fourth ↑';
        if (Math.abs(r - 3/5) < 0.001) return 'Major Third-ish ↑';
        return '';
      };

      const update = () => {
        const p = Number(fret.value);
        const vib = Math.max(0, L - p);
        pressOut.textContent = p.toString();
        vibeLenOut.textContent = vib.toString();
        fracOut.textContent = simp(vib, L);

        const label = intervalLabel(p, L);
        intervalOut.textContent = label ? `• ${label}` : '';
        intervalOut.classList.toggle('is-emph', !!label);

        // Beep when newly hitting a landmark (throttled)
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
  }

  // Global handlers (you already wire clicks/keys elsewhere)
  wireHandlersForCurrentRoot();
}

// ────────────────────────────────────────────────────────────────────────────────
// Wiring
// ────────────────────────────────────────────────────────────────────────────────
function wireHandlersForCurrentRoot() {
  unwireHandlers();

  clickHandler = (e) => {
    if (e.target.closest('#smBackToMenu')) {
      backToMainMenu();
      return;
    }
    if (e.target.closest('#smMute')) {
      const muted = toggleMute();
      const btn = elRoot.querySelector('#smMute');
      if (btn) {
        btn.textContent = muted ? '🔇' : '🔊';
        btn.classList.toggle('muted', muted);
      }
      return;
    }
    if (e.target.closest('#smHearStory')) {
      renderChapterMenu();
      wireHandlersForCurrentRoot();
      return;
    }
    if (e.target.closest('#smPrologue')) {
      renderPrologueReader();
      return;
    }
    // 🆕 Prologue typing screen
    if (e.target.closest('#smSkipType')) {
      elRoot?.__smDoneFast?.();
      return;
    }
    if (e.target.closest('#smReady')) {
      renderPrologueSlides();
      return;
    }
    // Slides
    if (e.target.closest('#smNext')) {
      slideIndex++;
      drawSlide();
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
      backToMainMenu();
      e.preventDefault();
      return;
    }

    // 🆕 Handle Enter across contexts
    if (e.key === 'Enter') {
      // 1) Typing screen: prefer Ready if visible, else Skip
      const ready = elRoot?.querySelector('#smReady');
      const skip  = elRoot?.querySelector('#smSkipType');
      if (ready && ready.style.display !== 'none') {
        ready.click();
        e.preventDefault();
        return;
      }
      if (skip) {
        skip.click();
        e.preventDefault();
        return;
      }
      // 2) Slides: Next
      const next = elRoot?.querySelector('#smNext');
      if (next) {
        next.click();
        e.preventDefault();
        return;
      }
      // 3) Intro / Chapter menu fallback
      const pro = elRoot?.querySelector('#smPrologue') || elRoot?.querySelector('#smHearStory');
      if (pro) {
        pro.click();
        e.preventDefault();
        return;
      }
    }

    if (e.key === 'ArrowRight') {
      const next = elRoot?.querySelector('#smNext') || elRoot?.querySelector('#smPrologue');
      next?.click();
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      const prev = elRoot?.querySelector('#smPrev');
      prev?.click();
      e.preventDefault();
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
    stopStoryMode();
    document.querySelector(SELECTORS.menuWrapper)?.classList.remove('hidden');
    applyBackgroundTheme();
  });
}

function backToChapterMenu() {
  renderChapterMenu();
  wireHandlersForCurrentRoot();
}

// Force BG repaint if needed
function repaintBackground() {
  requestAnimationFrame(() => {
    setTimeout(() => {
      const img = document.getElementById('modeBackground');
      if (img) img.src = img.src;
    }, 10);
  });
}

// ensure named exports exist
export { loadStoryMode };

function playTrackUnlocked(id) {
  try {
    const H = window.Howler ?? globalThis.Howler;

    // Make sure master is unmuted before constructing/playing the Howl
    if (H && H._muted) H.mute(false);

    // Best-effort WebAudio unlock (does nothing if html5:true, but harmless)
    if (H?.ctx && H.ctx.state === 'suspended') {
      // Don't await; keep synchronous gesture timing
      H.ctx.resume().catch(() => {});
    }
  } catch {}

  // Play immediately in the same click stack
  try { playTrack(id); } catch {}
}
// 🔔 Local SFX Howls
const smDing = new Howl({
  src: [`${import.meta.env.BASE_URL}assets/audio/SFX/smDing.mp3`],
  volume: .25
});

const smDing2 = new Howl({
  src: [`${import.meta.env.BASE_URL}assets/audio/SFX/smDing2.mp3`],
  volume: .25
});

// Helper to pick the right one
function playSFX(name) {
  if (name === 'smDing') smDing.play();
  else if (name === 'smDing2') smDing2.play();
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

  // Map label → frequency multiple of a base note
  const baseHz = 220; // A3 feels nice
  const mult =
    label.includes('Octave')        ? 2.0 :
    label.includes('Perfect Fifth') ? 3/2 :
    label.includes('Perfect Fourth')? 4/3 :
    label.includes('Major Third')   ? 5/4 :
    1.0;

  osc.type = 'sine';
  osc.frequency.value = baseHz * mult;

  // Short clickless envelope
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.12, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

  osc.connect(gain);
  gain.connect(ac.destination);

  osc.start(now);
  osc.stop(now + 0.4);
}