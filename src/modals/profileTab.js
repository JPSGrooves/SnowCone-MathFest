// /src/tabs/profileTab.js — single-source completion (badges-only model)

import { appState } from '../data/appState.js';
import { renderBadgeGrid, allBadges } from '../managers/badgeManager.js';
import { COMPLETION_CONFIG } from '../managers/completionManager.js';

export function renderProfileTab() {
  // For the “how to” copy only:
  const caps = COMPLETION_CONFIG?.xpCaps || { global: 5000, story: 0, kidsCamping: 0, quickServe: 0, infinity: 0 };
  const extraCap = Math.max(0, (caps.global || 0) - ((caps.story || 0) + (caps.kidsCamping || 0) + (caps.quickServe || 0) + (caps.infinity || 0)));

  const nonLegendTotal = Object.keys(allBadges).filter(id => id !== 'legend').length;

  return `
    <div class="settings-block">
      <label for="profileNameInput">🧑‍🚀 Your Name:</label>
      <input id="profileNameInput" type="text" placeholder="Enter name..." value="${appState.profile.username}" />
    </div>

    <div class="settings-block">
      <h3>📈 Completion</h3>
      <div class="xp-bar-wrap">
        <div class="xp-bar" id="xpBar"></div>
      </div>
      <span id="xpPercentText">0%</span>
    </div>

    <div class="settings-block">
      <h3>🏅 Cones Earned</h3>
      <div id="badgeGrid" class="badge-wrapper"></div>
    </div>

    <!-- 🔻 Concise 100% guide (copy only; actual % comes from appState.getCompletionPercent()) -->
    <div class="settings-block">
      <h3>🎯 How to reach 100%</h3>
      <ul class="completion-brief">
        <li><strong>Badges (95%)</strong> — Unlock all <strong>${nonLegendTotal}</strong> non-legend badges.</li>
        <li><strong>Legend (5%)</strong> — After that, the <em>Legend</em> badge completes the bar.</li>
      </ul>
    </div>
  `;
}

export function setupProfileTabUI() {
  // name editing UX
  const input = document.getElementById('profileNameInput');
  if (input) {
    input.value = appState.profile.username || 'Guest';

    if (sessionStorage.getItem('forceWelcomeReload')) {
      sessionStorage.removeItem('forceWelcomeReload');
      const msg = document.createElement('div');
      msg.classList.add('input-message');
      msg.textContent = `✅ Save restored: Welcome back, ${appState.profile.username}!`;
      Object.assign(msg.style, {
        color: '#00ffee',
        textAlign: 'center',
        marginTop: '0.5em',
        fontSize: '0.85rem'
      });
      input.insertAdjacentElement('afterend', msg);
      setTimeout(() => msg.remove(), 2500);
    }

    input.onchange = () => {
      appState.profile.username = input.value.trim();

      const oldMsg = input.nextElementSibling;
      if (oldMsg?.classList.contains('input-message')) oldMsg.remove();

      const message = document.createElement('div');
      message.classList.add('input-message');
      message.textContent = `🧊 Welcome, ${appState.profile.username}!`;
      Object.assign(message.style, {
        color: '#00ffee',
        textAlign: 'center',
        marginTop: '0.5em',
        fontSize: '0.85rem'
      });
      input.insertAdjacentElement('afterend', message);
      setTimeout(() => message.remove(), 2500);
    };
  }

  // 🔥 Single source of truth for completion:
  const percent = appState.getCompletionPercent();
  const bar = document.getElementById('xpBar');
  const text = document.getElementById('xpPercentText');
  if (bar) bar.style.width = `${percent}%`;
  if (text) text.textContent = `${percent}%`;

  // Render badges grid
  renderBadgeGrid();
}
