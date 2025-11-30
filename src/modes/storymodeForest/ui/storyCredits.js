// src/modes/storyMode/ui/storyCredits.js

let creditsTimer = null;

const CREDITS_LINES = [
  ['SnowCone MathFest', 'JPS Grooves'],
  ['Story Mode Forest – Writing & Design', 'JPS Grooves'],
  ['Story Mode Forest – Code & Game Logic', 'JPS Grooves'],
  ['Original Soundtrack', 'JPS Grooves'],
  ['Concept & Worldbuilding', 'JPS Grooves'],
  ['Math Ghosts & Dino Cameos', 'You & the Festival'],
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

  overlay.innerHTML = `
    <div class="sm-credits-panel sm-fade-in">
      <div class="sm-credits-title">SnowCone MathFest – Story Mode</div>
      <div class="sm-credits-sub">Chapters 1–5 · Beta Build</div>

      <div class="sm-credits-list">
        <div class="sm-credits-roll">
          ${CREDITS_LINES.map(
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

  const handleEnd = () => {
    blackout.removeEventListener('animationend', handleEnd);

    // Once we’re fully black, roll credits on top
    showStoryCredits();
  };

  blackout.addEventListener('animationend', handleEnd);
}
