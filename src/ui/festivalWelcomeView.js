// src/ui/festivalWelcomeView.js
// Renders the welcome / progress / suggestion card on #startup-screen.

import { getFestivalWelcomeModel } from '../data/festivalWelcome.js';

function hideStartupScreen(onDone) {
  const screen = document.getElementById('startup-screen');
  if (!screen) {
    if (typeof onDone === 'function') onDone();
    return;
  }

  // add a class so CSS can animate opacity
  screen.classList.add('startup-hide');

  // after the fade, remove it from flow + fire callback
  setTimeout(() => {
    screen.style.display = 'none';
    if (typeof onDone === 'function') onDone();
  }, 300);
}

/**
 * Render the festival welcome card under the cone.
 * onPlay: callback fired AFTER the fade-out finishes.
 */
export function renderFestivalWelcomeOnStartup(onPlay) {
  const screen = document.getElementById('startup-screen');
  if (!screen) return;

  // allow clicks now (CSS used to block this)
  screen.style.pointerEvents = 'auto';

  // If you ever add an inner wrapper, we prefer that; otherwise use screen.
  const inner = screen.querySelector('.startup-inner') || screen;

  let card = inner.querySelector('.startup-festival-card');
  if (!card) {
    card = document.createElement('div');
    card.className = 'startup-festival-card';
    inner.appendChild(card);
  }

  
  const model = getFestivalWelcomeModel();

  const streak = Number(model.streakDays ?? 0);
  const streakLabel = `Daily Streak: ${streak} day${streak === 1 ? '' : 's'}`;

  card.innerHTML = `
    <p class="startup-welcome-line">
      ${model.greeting}, ${model.username}!
    </p>
    SnowCone MathFest is a neon math festival!<br>Explore each mode while listening to the tunes, and try to complete the whole festival!<br><br>
    <p class="startup-title-line">
      ${model.title}
    </p>
    <p class="startup-streak-line">
      ${streakLabel}
    </p>
    <p class="startup-progress-line">
      Festival Completion: <strong>${model.percent}%</strong>
    </p>
    <p class="startup-main-line">
      ${model.line}
    </p>
    <p class="startup-suggestion-line">
      ${model.suggestionText}
    </p>
    <button type="button" class="startup-play-btn">
      Play Game
    </button>
  `;


  const playBtn = card.querySelector('.startup-play-btn');
  if (playBtn) {
    playBtn.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      hideStartupScreen(onPlay);
    });
  }
}
