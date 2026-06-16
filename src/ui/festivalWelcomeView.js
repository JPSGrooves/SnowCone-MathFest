// src/ui/festivalWelcomeView.js
// Renders the simple iOS-first welcome doorway on #startup-screen.

import { appState } from '../data/appState.js';
import { getFestivalWelcomeModel } from '../data/festivalWelcome.js';

const DEFAULT_STARTUP_AVATAR = '🧑‍🚀';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function getStartupAvatarEmoji() {
  const saved = appState?.profile?.avatarEmoji;

  if (typeof saved === 'string' && saved.trim()) {
    return saved;
  }

  return DEFAULT_STARTUP_AVATAR;
}

function hideStartupScreen(onDone) {
  const screen = document.getElementById('startup-screen');

  if (!screen) {
    if (typeof onDone === 'function') onDone();
    return;
  }

  screen.classList.add('startup-hide');

  setTimeout(() => {
    screen.style.display = 'none';

    if (typeof onDone === 'function') {
      onDone();
    }
  }, 300);
}

/**
 * Render the welcome card under the logo.
 * onPlay fires AFTER the fade-out finishes.
 */
export function renderFestivalWelcomeOnStartup(onPlay) {
  const screen = document.getElementById('startup-screen');
  if (!screen) return;

  screen.style.pointerEvents = 'auto';

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
  const avatarEmoji = getStartupAvatarEmoji();

  card.innerHTML = `
    <p class="startup-welcome-line">
      <span class="startup-greeting">${escapeHtml(model.greeting)},</span>
      <br />
      <span class="startup-username">${escapeHtml(model.username)}</span>
    </p>

    <p class="startup-streak-line">
      <span class="startup-avatar-emoji" aria-hidden="true">${escapeHtml(avatarEmoji)}</span>
      <span>${escapeHtml(streakLabel)}</span>
    </p>

    <button type="button" class="startup-play-btn" aria-label="Enter SnowCone MathFest">
      Enter Festival
    </button>
  `;

  const playBtn = card.querySelector('.startup-play-btn');

  if (playBtn) {
    playBtn.addEventListener('click', (ev) => {
      ev?.preventDefault?.();
      ev?.stopPropagation?.();
      hideStartupScreen(onPlay);
    });
  }
}