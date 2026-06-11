// src/tabs/profileTab.js — profile, rank, completion, XP

import { appState } from '../data/appState.js';

const DEFAULT_AVATAR_EMOJI = '🧑‍🚀';

const AVATAR_EMOJIS = [
  '🧑‍🚀',
  '👩‍🚀',
  '👨‍🚀',
  '👩🏻‍🚀',
  '👨🏻‍🚀',
  '👩🏽‍🚀',
  '👨🏽‍🚀',
  '👩🏿‍🚀',
  '👨🏿‍🚀',

  '👽',
  '🤖',
  '🛸',
  '🌙',
  '☄️',
  '🪐',
  '⭐',
  '🌟',

  '🧙',
  '🧙‍♀️',
  '🧙‍♂️',
  '🧝',
  '🧝‍♀️',
  '🧝‍♂️',
  '🧚',
  '🧚‍♀️',
  '🧚‍♂️',
  '🧞',
  '🧞‍♀️',
  '🧞‍♂️',

  '🦸',
  '🦸‍♀️',
  '🦸‍♂️',
  '🕵️',
  '🕵️‍♀️',
  '🕵️‍♂️',
  '🥷',
  '🧜',
  '🧜‍♀️',
  '🧜‍♂️',
];

function escapeAttr(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function getSafeAvatarEmoji() {
  const saved = appState?.profile?.avatarEmoji;

  if (AVATAR_EMOJIS.includes(saved)) {
    return saved;
  }

  return DEFAULT_AVATAR_EMOJI;
}

function getSafeUsername() {
  return appState?.profile?.username || 'Friend';
}

function getProfileRankTitle(percent, breakdown) {
  const coreDone = Number(breakdown?.badges?.badgesFrac ?? 0) >= 1;
  const legendDone = !!breakdown?.legendDone;

  if (percent >= 100 && legendDone) return 'Rank: Festival Legend';
  if (coreDone && !legendDone) return 'Rank: Legendary Cone Hunter';

  if (percent >= 90) return 'Rank: Cone Commander';
  if (percent >= 80) return 'Rank: Glow Chaser';
  if (percent >= 70) return 'Rank: Festival Pilot';
  if (percent >= 60) return 'Rank: Badge Scout';
  if (percent >= 50) return 'Rank: Cone Captain';
  if (percent >= 40) return 'Rank: Half-Cone Hero';
  if (percent >= 30) return 'Rank: Cone Climber';
  if (percent >= 20) return 'Rank: Cone Cruiser';
  if (percent >= 10) return 'Rank: Cone Camper';

  return 'Rank: Baby Cone';
}

function getProfileRankLine(percent, breakdown) {
  const coreDone = Number(breakdown?.badges?.badgesFrac ?? 0) >= 1;
  const legendDone = !!breakdown?.legendDone;

  if (percent >= 100 && legendDone) {
    return 'You did everything! You are the SnowCone Master!';
  }

  if (coreDone && !legendDone) {
    return '100% of Core Cones! The Legendendary cones await!';
  }

  if (percent >= 80) {
    return 'You probably know about the ghosts by now!';
  }

  if (percent >= 50) {
    return 'The cone is half full!';
  }

  if (percent >= 20) {
    return 'You are learning the shapes of the festival!';
  }

  if (percent >= 10) {
    return 'You have officially started your SnowCone trail!';
  }

  return 'Fresh Festival energy. Find your first cones!';
}

function getProfileXPModel() {
  const xp = Number(appState?.profile?.xp ?? 0);
  const level = Number(appState?.profile?.level ?? 1);

  const safeXP = Number.isFinite(xp) ? Math.max(0, Math.floor(xp)) : 0;
  const safeLevel = Number.isFinite(level) ? Math.max(1, Math.floor(level)) : 1;

  const nextLevelXP = safeLevel * 100;
  const xpToNext = Math.max(0, nextLevelXP - safeXP);

  return {
    xp: safeXP,
    level: safeLevel,
    xpToNext,
  };
}

function getAvatarIndex(emoji) {
  const index = AVATAR_EMOJIS.indexOf(emoji);
  return index >= 0 ? index : 0;
}

function getAvatarByIndex(index) {
  const safeIndex =
    ((index % AVATAR_EMOJIS.length) + AVATAR_EMOJIS.length) %
    AVATAR_EMOJIS.length;

  return AVATAR_EMOJIS[safeIndex] || DEFAULT_AVATAR_EMOJI;
}

function renderAvatarPicker(currentEmoji) {
  const currentIndex = getAvatarIndex(currentEmoji);
  const displayNumber = currentIndex + 1;
  const total = AVATAR_EMOJIS.length;

  return `
    <div class="profile-avatar-picker" aria-label="Choose your festival avatar">
      <button
        type="button"
        class="profile-avatar-arrow"
        data-avatar-step="-1"
        aria-label="Previous avatar"
      >
        ‹
      </button>

      <div class="profile-avatar-display-wrap">
        <div class="profile-avatar-big" aria-hidden="true">
          ${escapeHtml(currentEmoji)}
        </div>
        <div class="profile-avatar-count" id="profileAvatarCount">
          ${displayNumber}/${total}
        </div>
      </div>

      <button
        type="button"
        class="profile-avatar-arrow"
        data-avatar-step="1"
        aria-label="Next astronaut"
      >
        ›
      </button>
    </div>
  `;
}

function showProfileInputMessage(input, text) {
  const oldMsg = input.nextElementSibling;

  if (oldMsg?.classList.contains('input-message')) {
    oldMsg.remove();
  }

  const message = document.createElement('div');
  message.classList.add('input-message');
  message.textContent = text;

  Object.assign(message.style, {
    color: '#00ffee',
    textAlign: 'center',
    marginTop: '0.5em',
    fontSize: '0.85rem',
  });

  input.insertAdjacentElement('afterend', message);
  setTimeout(() => message.remove(), 2500);
}

export function syncProfileTabIcon() {
  const btn = document.querySelector('.tab-button[data-tab="profile"]');
  if (!btn) return;

  btn.textContent = `${getSafeAvatarEmoji()}Profile`;
}

export function renderProfileTab() {
  const breakdown = appState.getCompletionBreakdown
    ? appState.getCompletionBreakdown()
    : null;

  const percent = appState.getCompletionPercent
    ? appState.getCompletionPercent()
    : 0;

  const rankTitle = getProfileRankTitle(percent, breakdown);
  const rankLine = getProfileRankLine(percent, breakdown);
  const username = escapeAttr(getSafeUsername());
  const avatarEmoji = getSafeAvatarEmoji();
  const xpModel = getProfileXPModel();

  return `
    <div class="profile-tab-shell">
      <div class="settings-block profile-avatar-block">
        <div class="profile-avatar-label">
          Choose Your Festival Avatar
        </div>

        ${renderAvatarPicker(avatarEmoji)}
      </div>

      <div class="settings-block profile-name-block">
        <label for="profileNameInput">Profile Name:</label>
        <input
          id="profileNameInput"
          type="text"
          placeholder="Enter name..."
          value="${username}"
        />
      </div>

      <div class="settings-block profile-completion-card">
        <h3>📈 SnowCone Completion</h3>
        <div class="xp-bar-wrap">
          <div class="xp-bar" id="xpBar"></div>
        </div>
        <span id="xpPercentText">0%</span>
      </div>

      <div class="settings-block profile-rank-card">
        <h3 class="profile-rank-title">🍧 ${rankTitle}</h3>
        <p class="profile-rank-line">${rankLine}</p>
      </div>

      <div class="settings-block profile-xp-card">
        <h3 class="profile-xp-title">
          ✨ XP: <span id="profileXpValue">${xpModel.xp}</span>
        </h3>
        <p class="profile-xp-line">
          Level ${xpModel.level} · ${xpModel.xpToNext} XP to next level
        </p>
      </div>
    </div>
  `;
}

export function setupProfileTabUI() {
  syncProfileTabIcon();

  const input = document.getElementById('profileNameInput');

  if (input) {
    input.value = appState.profile.username || 'Guest';

    if (sessionStorage.getItem('forceWelcomeReload')) {
      sessionStorage.removeItem('forceWelcomeReload');

      showProfileInputMessage(
        input,
        `✅ Save restored: Welcome back, ${appState.profile.username}!`
      );
    }

    input.onchange = () => {
      appState.profile.username = input.value.trim() || 'Friend';

      showProfileInputMessage(
        input,
        `🧊 Welcome, ${appState.profile.username}!`
      );

      try {
        appState.saveToStorage?.();
      } catch {}
    };
  }

  document.querySelectorAll('.profile-avatar-arrow').forEach((btn) => {
    btn.addEventListener('click', () => {
      const step = Number(btn.dataset.avatarStep || 0);
      const currentEmoji = getSafeAvatarEmoji();
      const currentIndex = getAvatarIndex(currentEmoji);
      const nextEmoji = getAvatarByIndex(currentIndex + step);

      appState.profile.avatarEmoji = nextEmoji;

      const bigAvatar = document.querySelector('.profile-avatar-big');
      if (bigAvatar) {
        bigAvatar.textContent = nextEmoji;
      }

      const count = document.getElementById('profileAvatarCount');
      if (count) {
        count.textContent = `${getAvatarIndex(nextEmoji) + 1}/${AVATAR_EMOJIS.length}`;
      }

      syncProfileTabIcon();

      try {
        appState.saveToStorage?.();
      } catch {}
    });
  });

  const percent = appState.getCompletionPercent
    ? appState.getCompletionPercent()
    : 0;

  const bar = document.getElementById('xpBar');
  const text = document.getElementById('xpPercentText');

  if (bar) bar.style.width = `${percent}%`;
  if (text) text.textContent = `${percent}%`;
}