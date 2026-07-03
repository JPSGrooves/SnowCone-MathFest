// src/tabs/profileTab.js — profile, rank, completion, XP

import { appState } from '../data/appState.js';
import { getRankModelForAppState } from '../data/rankModel.js';

const DEFAULT_AVATAR_EMOJI = '🧑‍🚀';

const AVATAR_GROUPS = [
  {
    label: 'Cosmic Crew',
    emojis: [
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
    ],
  },

  {
    label: 'Wizard Grove',
    emojis: [
      '🧙',
      '🧙‍♀️',
      '🧙‍♂️',
      '🧙🏻‍♀️',
      '🧙🏽‍♀️',
      '🧙🏿‍♀️',
      '🧙🏻‍♂️',
      '🧙🏽‍♂️',
    ],
  },

  {
    label: 'Hero Hideout',
    emojis: [
      '🦸',
      '🦸‍♀️',
      '🦸‍♂️',
      '🦸🏻‍♀️',
      '🦸🏽‍♀️',
      '🦸🏿‍♀️',
      '🦸🏻‍♂️',
      '🦸🏽‍♂️',
      '🥷',
      '🥷🏽',
    ],
  },

  {
    label: 'Groove Grove',
    emojis: [
      '🧑‍🎨',
      '👩‍🎨',
      '👨‍🎨',
      '🧑‍🎤',
      '👩‍🎤',
      '👨‍🎤',
    ],
  },

  {
    label: 'Camp Critters',
    emojis: [
      '🐱',
      '🐶',
      '🦊',
      '🐻',
      '🐼',
      '🐸',
      '🐵',
      '🐯',
      '🦁',
      '🐰',
    ],
  },
];

const AVATAR_EMOJIS = AVATAR_GROUPS.flatMap((group) => group.emojis);

function getAvatarThemeLabel(emoji) {
  const group = AVATAR_GROUPS.find((entry) =>
    entry.emojis.includes(emoji)
  );

  return group?.label || 'Festival Crew';
}

let profileSaveTimer = null;

function saveProfileSoon() {
  if (profileSaveTimer) {
    clearTimeout(profileSaveTimer);
  }

  profileSaveTimer = setTimeout(() => {
    profileSaveTimer = null;

    try {
      appState.saveToStorage?.();
    } catch {}
  }, 220);
}

const PROFILE_NAME_MAX_CHARS = 15;
const PROFILE_NAME_FALLBACK = 'Friend';

const BASIC_BLOCKED_NAME_PATTERNS = [
  // common profanity
  ['s', 'h', 'i', 't'],
  ['b', 't', 'c', 'h'],
  ['a', 's', 's', 'h', 'o', 'l', 'e'],
  ['n', 'i', 'g', 'g', 'e', 'r'],
  ['s', 'h', 't'],
  ['b', 'i', 't', 'c', 'h'],
  ['n', 'i', 'g', 'g', 'a'],
  ['f', 'u', 'c', 'k'],
  ['f', 'c', 'k'],
  ['f', 'u', 'k'],

  // sexual / explicit basics
  ['p', 'o', 'r', 'n'],
  ['s', 'e', 'x'],
  ['c', 'o', 'c', 'k'],
  ['p', 'e', 'n', 'i', 's'],
  ['v', 'a', 'g', 'i', 'n', 'a'],
  ['p', 'u', 's', 's', 'y'],

  // drug / adult basics
  ['w', 'e', 'e', 'd'],
  ['c', 'o', 'c', 'a', 'i', 'n', 'e'],
  ['m', 'e', 't', 'h'],

  // platform / authority impersonation
  ['a', 'd', 'm', 'i', 'n'],
  ['m', 'o', 'd', 'e', 'r', 'a', 't', 'o', 'r'],
  ['s', 'y', 's', 't', 'e', 'm'],
  ['d', 'e', 'v', 'e', 'l', 'o', 'p', 'e', 'r'],
].map((parts) => parts.join(''));

function limitProfileNameLength(value) {
  return Array.from(String(value ?? '')).slice(0, PROFILE_NAME_MAX_CHARS).join('');
}

function normalizeProfileNameForFilter(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replaceAll('@', 'a')
    .replaceAll('4', 'a')
    .replaceAll('0', 'o')
    .replaceAll('1', 'i')
    .replaceAll('!', 'i')
    .replaceAll('3', 'e')
    .replaceAll('5', 's')
    .replaceAll('$', 's')
    .replace(/[^a-z]/g, '');
}

function hasBlockedProfileLanguage(value) {
  const normalized = normalizeProfileNameForFilter(value);

  if (!normalized) return false;

  return BASIC_BLOCKED_NAME_PATTERNS.some((pattern) =>
    normalized.includes(pattern)
  );
}

function stripUnsupportedProfileNameChars(value) {
  return String(value ?? '')
    .replace(/[^\p{L}\p{N} _'-]/gu, '')
    .replace(/\s+/g, ' ');
}

function sanitizeProfileName(rawValue) {
  const trimmed = stripUnsupportedProfileNameChars(rawValue).trim();
  const limited = limitProfileNameLength(trimmed);

  if (!limited) {
    return {
      name: PROFILE_NAME_FALLBACK,
      reason: 'empty',
    };
  }

  if (hasBlockedProfileLanguage(limited)) {
    return {
      name: PROFILE_NAME_FALLBACK,
      reason: 'blocked',
    };
  }

  if (limited !== trimmed) {
    return {
      name: limited,
      reason: 'length',
    };
  }

  return {
    name: limited,
    reason: null,
  };
}

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
  return sanitizeProfileName(appState?.profile?.username || PROFILE_NAME_FALLBACK).name;
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
  const themeLabel = getAvatarThemeLabel(currentEmoji);

  return `
    <div class="profile-avatar-picker" aria-label="Choose your festival avatar">
      <button
        type="button"
        class="profile-avatar-arrow profile-avatar-arrow-prev"
        data-avatar-step="-1"
        aria-label="Previous avatar"
      ></button>

      <div class="profile-avatar-display-wrap">
        <div class="profile-avatar-big" aria-hidden="true">
          ${escapeHtml(currentEmoji)}
        </div>
        <div class="profile-avatar-count" id="profileAvatarCount">
          ${escapeHtml(themeLabel)} · ${displayNumber}/${total}
        </div>
      </div>

      <button
        type="button"
        class="profile-avatar-arrow profile-avatar-arrow-next"
        data-avatar-step="1"
        aria-label="Next avatar"
      ></button>
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
  const rankModel = getRankModelForAppState(appState);
  const rankTitle = rankModel.title;
  const rankLine = rankModel.line;
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
          maxlength="${PROFILE_NAME_MAX_CHARS}"
          autocomplete="nickname"
          autocapitalize="words"
          autocorrect="off"
          spellcheck="false"
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
          XP Level ${xpModel.level}
        </p>
      </div>
    </div>
  `;
}
// Future XP detail, currently hidden for cleaner presentation:
// ${xpModel.xpToNext} XP more to upgrade!

let avatarHoldStartTimer = null;
let avatarHoldRepeatTimer = null;

function clearAvatarHoldTimers() {
  if (avatarHoldStartTimer) {
    clearTimeout(avatarHoldStartTimer);
    avatarHoldStartTimer = null;
  }

  if (avatarHoldRepeatTimer) {
    clearInterval(avatarHoldRepeatTimer);
    avatarHoldRepeatTimer = null;
  }
}

function applyAvatarStep(step) {
  const safeStep = Number(step || 0);
  if (!safeStep) return;

  const currentEmoji = getSafeAvatarEmoji();
  const currentIndex = getAvatarIndex(currentEmoji);
  const nextEmoji = getAvatarByIndex(currentIndex + safeStep);

  appState.profile.avatarEmoji = nextEmoji;

  const bigAvatar = document.querySelector('.profile-avatar-big');
  if (bigAvatar) {
    bigAvatar.textContent = nextEmoji;
  }

  const count = document.getElementById('profileAvatarCount');
  if (count) {
    count.textContent = `${getAvatarThemeLabel(nextEmoji)} · ${getAvatarIndex(nextEmoji) + 1}/${AVATAR_EMOJIS.length}`;
  }

  syncProfileTabIcon();
  saveProfileSoon();
}

function wireAvatarArrowButton(btn) {
  if (!btn) return;

  const step = Number(btn.dataset.avatarStep || 0);
  if (!step) return;

  const startHold = (ev) => {
    ev?.preventDefault?.();
    ev?.stopPropagation?.();

    clearAvatarHoldTimers();

    try {
      if (ev?.pointerId !== undefined) {
        btn.setPointerCapture?.(ev.pointerId);
      }
    } catch {}

    // Instant first move.
    applyAvatarStep(step);

    // Hold briefly, then zip.
    avatarHoldStartTimer = setTimeout(() => {
      avatarHoldStartTimer = null;

      avatarHoldRepeatTimer = setInterval(() => {
        applyAvatarStep(step);
      }, 85);
    }, 260);
  };

  const stopHold = (ev) => {
    clearAvatarHoldTimers();

    try {
      if (ev?.pointerId !== undefined) {
        btn.releasePointerCapture?.(ev.pointerId);
      }
    } catch {}
  };

  btn.addEventListener('pointerdown', startHold);
  btn.addEventListener('pointerup', stopHold);
  btn.addEventListener('pointercancel', stopHold);
  btn.addEventListener('pointerleave', stopHold);
  btn.addEventListener('lostpointercapture', stopHold);

  // Keep keyboard / external keyboard support.
  btn.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter' && ev.key !== ' ') return;

    ev.preventDefault();
    applyAvatarStep(step);
  });
}

export function setupProfileTabUI() {
  syncProfileTabIcon();

  const input = document.getElementById('profileNameInput');

  if (input) {
    const initialName = sanitizeProfileName(appState.profile.username).name;

    input.maxLength = PROFILE_NAME_MAX_CHARS;
    input.value = initialName;
    appState.profile.username = initialName;

    try {
      appState.saveToStorage?.();
    } catch {}

    if (sessionStorage.getItem('forceWelcomeReload')) {
      sessionStorage.removeItem('forceWelcomeReload');

      showProfileInputMessage(
        input,
        `✅ Save restored: Welcome back, ${appState.profile.username}!`
      );
    }

    input.onchange = () => {
      const result = sanitizeProfileName(input.value);

      input.value = result.name;
      appState.profile.username = result.name;

      let messageText = `🧊 Welcome, ${appState.profile.username}!`;

      if (result.reason === 'blocked') {
        messageText = '🧊 Keep profile names festival-friendly.';
      } else if (result.reason === 'empty') {
        messageText = '🧊 Blank names become Friend.';
      } else if (result.reason === 'length') {
        messageText = `🧊 Saved as ${appState.profile.username} — ${PROFILE_NAME_MAX_CHARS} character max.`;
      }

      showProfileInputMessage(input, messageText);

      try {
        appState.saveToStorage?.();
      } catch {}
    };
  }

  document.querySelectorAll('.profile-avatar-arrow').forEach((btn) => {
    wireAvatarArrowButton(btn);
  });

  const percent = appState.getCompletionPercent
    ? appState.getCompletionPercent()
    : 0;

  const bar = document.getElementById('xpBar');
  const text = document.getElementById('xpPercentText');

  if (bar) bar.style.width = `${percent}%`;
  if (text) text.textContent = `${percent}%`;
}
