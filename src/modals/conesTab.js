// src/tabs/conesTab.js — badge grid + completion guide 🍧🏅

import { appState } from '../data/appState.js';
import { renderBadgeGrid, allBadges } from '../managers/badgeManager.js';

function getConesBreakdown() {
  const breakdown = appState.getCompletionBreakdown
    ? appState.getCompletionBreakdown()
    : null;

  const nonLegendTotal =
    breakdown?.badges?.nonLegendTotal ??
    Object.keys(allBadges).filter((id) => {
      const meta = allBadges[id];
      return id !== 'legend' && !meta?.legendary;
    }).length;

  const nonLegendOwned = breakdown?.badges?.nonLegendOwned ?? 0;

  return {
    breakdown,
    nonLegendTotal,
    nonLegendOwned,
  };
}

export function renderConesTab() {
  const { nonLegendTotal, nonLegendOwned } = getConesBreakdown();

  return `
    <div class="settings-block cones-tab-card">
      <h3 class="cones-earned-title">
        🏅 Cones Earned
        <span class="cones-earned-count">${nonLegendOwned}/${nonLegendTotal}</span>
      </h3>

      <p class="cones-tab-note">
        These are your festival cones. Core cones push completion forward.
        Legendary cones prove you were really here!
      </p>

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

export function setupConesTabUI() {
  renderBadgeGrid();
}