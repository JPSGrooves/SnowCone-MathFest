// profileTab.js — MOBX REFRACTOR, as per OUR ACTUAL CODE

import { appState } from '../data/appState.js';
import { renderBadgeGrid, allBadges } from '../managers/badgeManager.js';

export function renderProfileTab() {
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
  `;
}

function getCompletionPercent(totalBadges) {
  const p = appState.profile;
  const s = appState.stats;
  const story = appState.storyProgress;

  let pct = 0;
  pct += Math.min(p.xp, 100) * 0.5;
  pct += (p.badges.length / totalBadges) * 20;

  if (s.story.chapter >= 5) pct += 15;
  if (s.quickServe.topScore >= 50) pct += 10;

  const triedAll = s.quickServe.sessions > 0 && s.infinity.timeSpent > 0 && story.seenPanels.length > 0;
  if (triedAll) pct += 5;

  return Math.min(100, Math.round(pct));
}

export function setupProfileTabUI() {
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

  const totalBadges = Object.keys(allBadges).length;
  const percent = getCompletionPercent(totalBadges);

  const bar = document.getElementById('xpBar');
  const text = document.getElementById('xpPercentText');
  if (bar) bar.style.width = `${percent}%`;
  if (text) text.textContent = `${percent}%`;

  renderBadgeGrid();
}
