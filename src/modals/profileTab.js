// profileTab.js — MOBX REFRACTOR, as per OUR ACTUAL CODE

import { appState } from '../data/appState.js';
import { renderBadgeGrid, allBadges } from '../managers/badgeManager.js';
import { COMPLETION_CONFIG } from '../managers/completionManager.js';


export function renderProfileTab() {
  const nonLegendTotal = Object.keys(allBadges).filter(id => id !== 'legend').length;
  const caps = COMPLETION_CONFIG.xpCaps;
  const extraCap = caps.global - (caps.story + caps.kidsCamping + caps.quickServe + caps.infinity);



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

    <!-- 🔻 New: concise 100% guide -->
    <div class="settings-block">
      <h3>🎯 How to reach 100%</h3>
      <ul class="completion-brief">
        <li><strong>XP (70%)</strong> — Earn <strong>${caps.global} XP</strong> across modes:
            Story ${caps.story}, Camping Games ${caps.kidsCamping}, QS ${caps.quickServe},
            Infinity ${caps.infinity}, Extra ${extraCap}.</li>
        <li><strong>Badges (25%)</strong> — Unlock all <strong>${nonLegendTotal}</strong> non-legend badges.</li>
        <li><strong>Legend (5%)</strong> — After the above, the <em>Legend</em> badge finishes the bar.</li>
      </ul>
    </div>
  `;
}
function getCompletionPercent(nonLegendTotal) {
  const { xp = 0, badges = [] } = appState.profile || {};
  const caps = COMPLETION_CONFIG.xpCaps;

  // 70% comes from total XP vs global cap
  const xpPct = Math.min(xp, caps.global) / caps.global * 70;

  // 25% comes from unlocking all non-legend badges
  const nonLegendUnlocked = badges.filter(id => id !== 'legend').length;
  const badgePct = (nonLegendUnlocked / nonLegendTotal) * 25;

  // 5% comes from the Legend badge
  const legendPct = badges.includes('legend') ? 5 : 0;

  return Math.round(Math.min(100, xpPct + badgePct + legendPct));
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
