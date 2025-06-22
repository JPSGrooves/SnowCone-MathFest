import { autorun } from 'mobx';
import { appState } from '../data/appState.js';
import { allBadges } from '../data/badges.js';
import { renderBadgeGrid } from '../managers/badgeManager.js'; // assuming this still builds the DOM tiles


export function renderProfileTab() {
  return `
    <div class="settings-block">
      <label for="profileNameInput">🧑‍🚀 Your Name:</label>
      <input id="profileNameInput" type="text" placeholder="Enter name..." />
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

function updateXPBar() {
  const totalBadges = Object.keys(allBadges).length;
  const percent = getCompletionPercent(totalBadges);

  const bar = document.getElementById('xpBar');
  const text = document.getElementById('xpPercentText');

  if (bar) bar.style.width = `${percent}%`;
  if (text) text.textContent = `${percent}%`;
}

export function setupProfileTabUI() {
  const input = document.getElementById('profileNameInput');
  if (input) {
    input.value = appState.profile.username;

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

  renderBadgeGrid();

  autorun(() => {
    updateXPBar();
  });
}

function getCompletionPercent(totalBadges) {
  let pct = 0;

  pct += Math.min(appState.profile.xp, 100) * 0.5;
  pct += (appState.profile.badges.length / totalBadges) * 20;

  if (appState.stats.story.chapter >= 5) pct += 15;
  if (appState.stats.quickServe.topScore >= 50) pct += 10;

  const triedAll =
    appState.stats.quickServe.sessions > 0 &&
    appState.stats.infinity.timeSpent > 0 &&
    appState.storyProgress.seenPanels.length > 0;

  if (triedAll) pct += 5;

  return Math.min(100, Math.round(pct));
}
