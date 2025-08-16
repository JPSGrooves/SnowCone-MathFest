import './storyMode.css';
import { swapModeBackground, applyBackgroundTheme } from '../../managers/backgroundManager.js';
import { playTransition } from '../../managers/transitionManager.js';
import { appState } from '../../data/appState.js';

import { preventDoubleTapZoom } from '../../utils/preventDoubleTapZoom.js';



const SELECTORS = {
  container: '#game-container',
  menuWrapper: '.menu-wrapper',
};

let elRoot = null;  // .sm-aspect-wrap in current screen
let keyHandler = null;
let clickHandler = null;

// Assets
const BASE = import.meta.env.BASE_URL;
const BG_SRC = `${BASE}assets/img/modes/storymodeForest/storyBG.png`;
const DIRECTOR_SRC = `${BASE}assets/img/characters/storyMode/jehnk.png`;
const PROLOGUE_TRACK = `${BASE}assets/audio/prologueTrack.mp3`; // <— drop your file here

// ---- Prologue assets (adjust if your paths differ) ----
const SFX = {
  p25: `${BASE}assets/audio/QuikServe points25.mp3`,
  p100: `${BASE}assets/audio/QuikServe points100.mp3`,
};
const PRO_IMG = (name) => `${BASE}assets/img/prologue/${name}`;

// ---- Prologue pages: text / image(+caption) / practice(reveal items) ----
const PROLOGUE_PAGES = [
  // Page 1 — Why Math? Why Now?
  {
    type: 'html',
    html: `
      <div class="sm-slide-text">
        <strong style="font-size:1.4em; color: yellow;">Why Math? Why Now? 🤔</strong><br>
        I hated math when I was young.<br>
        It was cold 🥶. It was lifeless 💀. It was just numbers 🔢.<br>
        I needed it to move 🕺💃. To sing 🎶🎤. To matter ❤️.<br>
        That's why I started the SnowCone MathFest 🍧🚚🎉.<br>
        After the first year... strange things happened 🌌.<br><br>
        Ghosts started arriving 👻✨ — ancient, glowing numbers whispering in the wind.<br>
        I realized I had been seeing them my whole life, hidden in the columns before me...<br>
        but only now were they seeing me too 👀🔮.<br>
        As I stood at the gates 🏰🍧, slinging SnowCones to the masses in the mystical moist night-air 🎊🍦,
        I heard the first ghost walk by and say… 🎶👂
      </div>`
  },

  // Page 2 — Pythagorus text
  {
    type: 'html',
    html: `
      <div class="sm-slide-text">
        <strong style="font-size:1.2em; color: yellow;">Pythagorus - Song of Fractions</strong><br>
        <span style="color:#00ccff;">"Music is the math you already know 🎶 — deep in your bones 💀🎸.
        When you go up the string and press exactly at its midpoint 📏✂️, you’ve traveled halfway along its path ↔️,
        yet somehow you can feel the whole journey echo back to you 🔄 from this midpoint.
        It’s as if the universe has whispered its secret 🌌🤫: that harmony lives in the space between two points."</span><br><br>
        I served him a SnowCone 🍧 and knew that here at SnowCone MathFest 🌈🎉,
        every neon beat is an octave you’ve already unlocked 🎵🔓 —
        Maybe we're always just halfway to the next octave, but we can always discover the hidden frequencies
        singing along our path 👆🎶.
      </div>`
  },

  // Page 3 — Pythagorus image
  { type: 'image', src: PRO_IMG('pythagoraspicture.png'), caption: "Pythagorus Eyes the Gates" },

  // Page 4 — Pythagorus practice
  {
    type: 'practice',
    title: "Practice Problems 🎸🎵",
    items: [
      {
        prompt: "A guitar string is 60 cm long 🎸. Press exactly halfway (30 cm) — what fraction of the original length vibrates?",
        answer: "1/2 (Half the string, twice the pitch — an octave higher! 🎵)",
        sfx: SFX.p25
      },
      {
        prompt: "Now press 20 cm up the 60 cm string. What fraction vibrates?",
        answer: "2/3 (60 − 20 = 40; 40/60 = 2/3)",
        sfx: SFX.p100
      }
    ]
  },

  // Page 5 — Euclid text
  {
    type: 'html',
    html: `
      <div class="sm-slide-text">
        <strong style="font-size:1.3em; color: yellow;">Euclid — Architect of Reality</strong><br>
        <span style="color:#00ccff;">"All structure, seen or unseen, begins with a line ✏️➡️📏."</span>
        He paused, tracing his proofs and figures through the void —
        <span style="color:#00ccff;">"The simplest gesture births every shape, every temple, every constellation above.
        Each angle is a handshake between points 🤝, each intersection a moment of cosmic agreement."</span><br><br>
        By connecting the two dots in front of him, Euclid wasn’t merely drawing — he was weaving the very fabric of
        existence into patterns the mind could grasp. He almost didn't see the SnowCone I was handing him 🍧 —
        but the glistening crystals in the concert light were enough to catch his eye.
      </div>`
  },

  // Page 6 — Euclid image
  { type: 'image', src: PRO_IMG('euclidpicture.png'), caption: "Euclid Perfects the Cone" },

  // Page 7 — Euclid practice
  {
    type: 'practice',
    title: "Practice Problems 🍧🚀",
    items: [
      {
        prompt: "Right triangle with legs 3 cm and 4 cm. What’s the hypotenuse?",
        answer: "5 cm (3² + 4² = 9 + 16 = 25 → √25 = 5)",
        sfx: SFX.p25
      },
      {
        prompt: "Isosceles: sides 6, 6, top 4. What’s the perimeter?",
        answer: "16 cm (6 + 6 + 4 = 16)",
        sfx: SFX.p100
      }
    ]
  },

  // Page 8 — Galileo & Newton text
  {
    type: 'html',
    html: `
      <div class="sm-slide-text">
        <strong style="font-size:1.2em; color: yellow;">Galileo &amp; Newton — Symphony of Motion</strong><br>
        <span style="color:white;">Galileo:</span> <span style="color:#00ccff;">"Everything moves if you watch carefully enough 🎵🔭..."</span><br>
        <span style="color:white;">Newton:</span> <span style="color:#00ccff;">"And every motion has a cause 🪐⚙️..."</span><br><br>
        I slung them neon SnowCones 🍧🍧 and wondered how to measure the speed of their cosmic stroll. 🚶🚶‍♂️
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
        prompt: "The cone truck traveled 60 miles in 2 hours. What’s the average speed?",
        answer: "30 mph (Speed = Distance ÷ Time = 60 ÷ 2)",
        sfx: SFX.p25
      },
      {
        prompt: "At that speed, how far in 5 hours?",
        answer: "150 miles (30 × 5)",
        sfx: SFX.p100
      }
    ]
  },

  // Page 11 — Turing & Brahmagupta text
  {
    type: 'html',
    html: `
      <div class="sm-slide-text">
        <strong style="font-size:1.2em; color: yellow;">Turing &amp; Brahmagupta — Secrets and Silence</strong><br>
        Turing: <span style="color:#00ccff;">"Every puzzle is a hidden message…"</span>
        Brahmagupta: <span style="color:#00ccff;">"Every silence is full of numbers…"</span><br><br>
        I realized gaps and zeros are clues, not emptiness. Math is the story of life, waiting to be unfolded.
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
        prompt: "Turing’s f(x) = 2x + 1. What is f(3) scoops?",
        answer: "2×3 + 1 = 7 🍧",
        sfx: SFX.p25
      },
      {
        prompt: "What happens when a whole scoop is multiplied by 0?",
        answer: "It melts into nothing! (Zero wipes it out.)",
        sfx: SFX.p100
      }
    ]
  },

  // Page 14 — Euclid & Bombelli text
  {
    type: 'html',
    html: `
      <div class="sm-slide-text">
        <strong style="font-size:1.2em; color: yellow;">Euclid Returns to Meet Bombelli</strong><br>
        Bombelli: <span style="color:#00ccff;">"What you call impossible... we call architecture..."</span><br><br>
        Imaginary numbers build real dreams.
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
        sfx: SFX.p25
      },
      {
        prompt: "What is i²?",
        answer: "−1 (loops back negative)",
        sfx: SFX.p100
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
        sfx: SFX.p25
      },
      {
        prompt: "One drop every 0.25s. In 2.5s, how many drops?",
        answer: "10 (2.5 ÷ 0.25)",
        sfx: SFX.p25
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

// Simple audio handle (start after user gesture)
let bgm;
/** safe music start on user gesture */
function ensureMusic() {
  try {
    if (!bgm) {
      bgm = new Audio(PROLOGUE_TRACK);
      bgm.loop = true;
      bgm.volume = 0.55;
    }
    bgm.play().catch(() => {/* mobile needs further UI tap; that's OK */});
  } catch {}
}

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
  // ✅ add this line to harden mobile taps
  document.querySelectorAll('.sm-aspect-wrap, .sm-game-frame, .sm-intro').forEach(preventDoubleTapZoom);

  wireHandlersForCurrentRoot();
}

export function stopStoryMode() {
  unwireHandlers();
  const container = document.querySelector(SELECTORS.container);
  if (container) {
    container.classList.add('hidden');
    container.style.display = 'none';
  }
  try { bgm?.pause(); } catch {}
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

          <div class="sm-intro-buttons" style="margin-top: auto;">
            <button id="smBackToMenu" class="sm-btn sm-btn-secondary">🔙 Back to Menu</button>
          </div>
        </section>
      </div>
    </div>
  `;

  elRoot = container.querySelector('.sm-aspect-wrap');
  repaintBackground();
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
            <button id="smReady" class="sm-btn sm-btn-primary" style="display:none">🎵 I’m Ready</button>
          </div>
        </section>
      </div>
    </div>
  `;

  elRoot = container.querySelector('.sm-aspect-wrap');
  repaintBackground();

  const node = elRoot.querySelector('#smTypeNode');
  const doneFast = typeInto(node, PROLOGUE_SCRIPT.trim(), {
    cps: 40,
    onDone: () => {
      const ready = elRoot.querySelector('#smReady');
      const skip  = elRoot.querySelector('#smSkipType');
      if (skip) skip.style.display = 'none';
      if (ready) ready.style.display = '';
    }
  });

  // Wire the local buttons for this screen
  unwireHandlers();
  clickHandler = (e) => {
    if (e.target.closest('#smSkipType')) {
      doneFast();
    } else if (e.target.closest('#smReady')) {
      ensureMusic();     // start music on user gesture
      renderPrologueSlides();
      wireHandlersForCurrentRoot();
    } else if (e.target.closest('#smBackToMenu')) {
      backToMainMenu();
    }
  };
  window.addEventListener('keydown', keyHandler = (e) => {
    if (e.key === 'Enter') {
      const ready = elRoot.querySelector('#smReady');
      if (ready && ready.style.display !== 'none') {
        ready.click();
      } else {
        const skip = elRoot.querySelector('#smSkipType');
        skip?.click();
      }
      e.preventDefault();
    } else if (e.key === 'Escape') {
      backToMainMenu();
      e.preventDefault();
    }
  });
  elRoot?.addEventListener('click', clickHandler);
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
  if (!page) { backToChapterMenu(); return; }

  // Build page inner
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
      <div class="sm-slide sm-fade-in">
        <div class="sm-slide-text" style="margin-bottom:.5rem;">
          <strong style="font-size:1.2em; color: yellow;">${page.title ?? 'Practice'}</strong>
        </div>
        <div class="sm-reveal-list">
          ${page.items.map((it, idx) => `
            <div class="sm-reveal-block" data-i="${idx}">
              <div class="sm-reveal-prompt">${it.prompt}</div>
              <div class="sm-reveal-controls">
                <button class="sm-btn sm-btn-primary js-reveal" data-i="${idx}">Click to Reveal</button>
                <div class="sm-reveal-answer" id="ans-${idx}">${it.answer}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>`;
  }

  container.innerHTML = `
    <div class="sm-aspect-wrap">
      <div class="sm-game-frame sm-is-intro">
        <section class="sm-prologue">
          <div class="sm-typewrap">${inner}</div>
          <div class="sm-prologue-controls">
            <button id="smPrev" class="sm-btn sm-btn-secondary" ${slideIndex === 0 ? 'disabled' : ''}>⬅️ Back</button>
            <button id="smNext" class="sm-btn sm-btn-primary">${slideIndex === PROLOGUE_PAGES.length - 1 ? 'Finish' : 'Next ➡️'}</button>
            <button id="smBackToMenu" class="sm-btn sm-btn-secondary">🔙 Menu</button>
          </div>
        </section>
      </div>
    </div>
  `;

  elRoot = container.querySelector('.sm-aspect-wrap');

  // Reveal events (if practice)
  if (page.type === 'practice') {
    elRoot.querySelectorAll('.js-reveal').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = +btn.dataset.i;
        const ans = elRoot.querySelector(`#ans-${i}`);
        if (ans && !ans.classList.contains('is-open')) {
          ans.classList.add('is-open');
          // Play SFX
          const item = PROLOGUE_PAGES[slideIndex].items[i];
          if (item?.sfx) {
            try { new Audio(item.sfx).play(); } catch {}
          }
        }
        btn.setAttribute('disabled', 'true');
      }, { once: true });
    });
  }

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
    if (e.target.closest('#smHearStory')) {
      renderChapterMenu();
      wireHandlersForCurrentRoot();
      return;
    }
    if (e.target.closest('#smPrologue')) {
      renderPrologueReader();
      return;
    }
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
    } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
      const next = elRoot.querySelector('#smNext');
      next?.click();
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      const prev = elRoot.querySelector('#smPrev');
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
