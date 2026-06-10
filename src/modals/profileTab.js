// src/tabs/profileTab.js — profile, rank, completion, cones

import { appState } from '../data/appState.js';
import { renderBadgeGrid, allBadges } from '../managers/badgeManager.js';
import { INTRO_COPY_HTML } from '../content/introCopy.js';

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
    return 'Full festival completion. Everything now is style runs, high scores, and cosmic flexing.';
  }

  if (coreDone && !legendDone) {
    return 'Core cones are cleared. The Legend badge is the final push.';
  }

  if (percent >= 80) return 'Late-game cone energy. Target specific badges now.';
  if (percent >= 50) return 'More done than not. The festival is taking shape.';
  if (percent >= 20) return 'You are learning the map. Keep scooping.';
  return 'Fresh festival file. Every cone counts.';
}

function getSafeUsername() {
  return appState?.profile?.username || 'Friend';
}

export function renderProfileTab() {
  const breakdown = appState.getCompletionBreakdown
    ? appState.getCompletionBreakdown()
    : null;

  const percent = appState.getCompletionPercent
    ? appState.getCompletionPercent()
    : 0;

  const nonLegendTotal =
    breakdown?.badges?.nonLegendTotal ??
    Object.keys(allBadges).filter((id) => {
      const meta = allBadges[id];
      return id !== 'legend' && !meta?.legendary;
    }).length;

  const nonLegendOwned = breakdown?.badges?.nonLegendOwned ?? 0;
  const rankTitle = getProfileRankTitle(percent, breakdown);
  const rankLine = getProfileRankLine(percent, breakdown);
  const username = getSafeUsername();

  return `
    <div class="settings-block profile-name-block">
      <label for="profileNameInput">🧑‍🚀 Your Name:</label>
      <input
        id="profileNameInput"
        type="text"
        placeholder="Enter name..."
        value="${username}"
      />
    </div>

    <div class="settings-block">
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

    <div class="settings-block">
      <h3 class="cones-earned-title">
        🏅 Cones Earned <span class="cones-earned-count">${nonLegendOwned}/${nonLegendTotal}</span>
      </h3>
      <div id="badgeGrid" class="badge-wrapper"></div>
    </div>

    <div class="settings-block completion-guide-block">
      <h3>🎯 How to reach 100%</h3>
      <ul class="completion-brief">
        <li><strong>Core Cones (95%)</strong> — Unlock all <strong>${nonLegendTotal}</strong> core cones.</li>
        <li><strong>Legend Cone (5%)</strong> — After that, the <em>Legend</em> cone completes the bar.</li>
        <li><strong>Bonus Legendary Cones</strong> — Extra flex cones that do not move the % bar.</li>
      </ul>
    </div>
  `;
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
        fontSize: '0.85rem',
      });

      input.insertAdjacentElement('afterend', msg);
      setTimeout(() => msg.remove(), 2500);
    }

    input.onchange = () => {
      appState.profile.username = input.value.trim() || 'Friend';

      const oldMsg = input.nextElementSibling;
      if (oldMsg?.classList.contains('input-message')) oldMsg.remove();

      const message = document.createElement('div');
      message.classList.add('input-message');
      message.textContent = `🧊 Welcome, ${appState.profile.username}!`;

      Object.assign(message.style, {
        color: '#00ffee',
        textAlign: 'center',
        marginTop: '0.5em',
        fontSize: '0.85rem',
      });

      input.insertAdjacentElement('afterend', message);
      setTimeout(() => message.remove(), 2500);

      try {
        appState.saveToStorage?.();
      } catch {}
    };
  }

  const percent = appState.getCompletionPercent();
  const bar = document.getElementById('xpBar');
  const text = document.getElementById('xpPercentText');

  if (bar) bar.style.width = `${percent}%`;
  if (text) text.textContent = `${percent}%`;

  renderBadgeGrid();
}