// src/modes/storyMode/ui/storyCredits.js

// src/modes/storyMode/ui/storyCredits.js

let creditsTimer = null;

const THANK_YOU_TEXT = `
Thank you for spending a little bit of your real life at SnowCone MathFest. 
Every click, choice, and “wait, what?” moment helps keep this world alive and evolving. 
Share it with a friend, a student, a teacher, or anyone who could use a sprinkle of experimental math magic in their day.
`.trim();

const CREDITS_LINES = [
  ['SnowCone MathFest', 'Created by Jeremy Smith'],
  ['Story Mode – Writing & Design', 'Jeremy Smith'],
  ['Story Mode – Code & Game Logic', 'Jeremy Smith'],
  ['Original Soundtrack', 'JPS Grooves'],
  ['Art & UI Direction', 'Jeremy Smith'],
  ['UX, Layout & Polish', 'Jeremy Smith'],
  ['Playtesting & Classroom Chaos', 'SnowCone MathFest Players'],
  ['Concept & Worldbuilding', 'Jeremy Smith & Patch'],
  ['Special Thanks', 'Family, Friends & Students'],
  ['Extra Thanks', 'Everyone who shared the game'],
  ['More Extra Thanks', 'Everyone who tried to break it'],
  ['Love & Gratitude', 'You, the player'],
];


/**
 * Schedule the story credits overlay to appear after a short delay.
 * Can be called from *any* active Story Mode screen.
 */
export function scheduleStoryCredits(delayMs = 0) {
  if (creditsTimer) {
    clearTimeout(creditsTimer);
    creditsTimer = null;
  }

  creditsTimer = setTimeout(() => {
    creditsTimer = null;
    showStoryCredits();
  }, Math.max(0, delayMs));
}

/**
 * Render the overlay immediately (idempotent – won’t stack overlays).
 */
export function showStoryCredits() {
  // prevent double-stacking
  if (document.querySelector('.sm-credits-overlay')) return;

  // Prefer the story frame; fall back to body if somehow missing
  const host = document.querySelector('.sm-aspect-wrap') || document.body;
  if (!host) return;

  const overlay = document.createElement('div');
  overlay.className = 'sm-credits-overlay';

  // Merge regular credits + thank-you paragraph into one rolling list
  const thankYouLines = THANK_YOU_TEXT
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map((line, index) => [
      index === 0 ? 'Thank You' : '', // only label the first line
      line,
    ]);

  const allCredits = [
    ...CREDITS_LINES,
    ...thankYouLines,
  ];

  overlay.innerHTML = `
    <div class="sm-credits-panel sm-fade-in">
      <div class="sm-credits-title">SnowCone MathFest – Story Mode</div>
      <div class="sm-credits-sub">Chapters 1–5 · Beta Build</div>

      <div class="sm-credits-list">
        <div class="sm-credits-roll">
          ${allCredits.map(
            ([role, name]) => `
            <div class="sm-credits-row">
              <span class="sm-credits-role">${role}</span>
              <span class="sm-credits-name">${name}</span>
            </div>`
          ).join('')}
        </div>
      </div>

      <button type="button" class="sm-btn sm-btn-primary sm-credits-btn">
        Back to Chapter Menu
      </button>
    </div>
  `;

  host.appendChild(overlay);

  // 🔹 start the movie-style crawl
  const rollEl = overlay.querySelector('.sm-credits-roll');
  if (rollEl) {
    requestAnimationFrame(() => {
      rollEl.classList.add('is-rolling');
    });
  }

  const btn = overlay.querySelector('.sm-credits-btn');

  const closeAndReturn = () => {
    overlay.classList.add('is-fading-out');

    // also clear any blackout that might still be sitting behind us
    const blackout = document.querySelector('.sm-blackout');
    if (blackout) {
      blackout.remove();
    }

    setTimeout(() => {
      overlay.remove();
    }, 260);

    // Let storyMode.js handle the actual menu transition
    window.dispatchEvent(new CustomEvent('sm:backToChapterMenu'));
  };

  btn?.addEventListener('click', closeAndReturn);

  // Click-outside-to-close
  overlay.addEventListener('click', (evt) => {
    if (evt.target === overlay) {
      closeAndReturn();
    }
  });
}

export function fadeToStoryCreditsFromCh5() {
  // don’t double-run if we’re already in the middle of this
  if (document.querySelector('.sm-credits-overlay') ||
      document.querySelector('.sm-blackout')) {
    return;
  }

  const host = document.querySelector('.sm-aspect-wrap') || document.body;
  if (!host) return;

  const blackout = document.createElement('div');
  blackout.className = 'sm-blackout';
  host.appendChild(blackout);

  let done = false;

  const safeShow = () => {
    if (done) return;
    done = true;
    blackout.removeEventListener('animationend', handleEnd);
    showStoryCredits();
  };

  const handleEnd = () => {
    safeShow();
  };

  // primary: wait for the CSS animation to finish
  blackout.addEventListener('animationend', handleEnd);

  // fallback: if animation never fires (Safari / reduced motion / CSS bug),
  // still roll credits after roughly the blackout duration.
  const CSS_DURATION_MS = 320; // match your blackout animation length
  setTimeout(safeShow, CSS_DURATION_MS + 80);
}
