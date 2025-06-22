import { appState } from '../data/appState.js';
import { getSetting, setSetting } from '../data/cdms.js';

export function renderProfileTab(container) {
  container.innerHTML = `
    <div class="tab-section">
      <label class="input-label">Name:</label>
      <input id="usernameInput" type="text" maxlength="12" value="${appState.profile.username}" />
    </div>

    <div class="tab-section stat-block">
      <p><strong>XP:</strong> ${appState.profile.xp}</p>
      <p><strong>Level:</strong> ${appState.profile.level}</p>
    </div>

    <div class="tab-section stat-block">
      <p><strong>Badges:</strong> ${appState.profile.badges.length}</p>
      <p><strong>Modes Completed:</strong> ${appState.profile.completedModes.join(', ') || 'None'}</p>
    </div>

    <div class="tab-section save-load-buttons">
      <button id="saveProgressBtn">💾 Save Progress</button>
      <button id="resetProgressBtn">🗑️ Reset Save</button>
    </div>

    <div class="tab-section">
      <label><input type="checkbox" id="seenIntroToggle" ${appState.profile.seenIntro ? 'checked' : ''} /> Skip Intro</label>
    </div>

    <div class="tab-section">
      <p><small><strong>Last Played:</strong> ${appState.profile.lastPlayed || 'Never'}</small></p>
    </div>
  `;

  // Update name
  container.querySelector('#usernameInput')?.addEventListener('input', (e) => {
    appState.profile.username = e.target.value.trim();
  });

  // Save Progress
  container.querySelector('#saveProgressBtn')?.addEventListener('click', () => {
    const dataToSave = {
      profile: appState.profile,
      settings: appState.settings,
      stats: appState.stats,
      storyProgress: appState.storyProgress
    };
    localStorage.setItem('snowcone_save_data', JSON.stringify(dataToSave));
    alert('✅ Progress saved!');
  });

  // Reset Progress
  container.querySelector('#resetProgressBtn')?.addEventListener('click', () => {
    if (confirm('⚠️ This will erase your progress. Are you sure?')) {
      localStorage.removeItem('snowcone_save_data');
      location.reload();
    }
  });

  // Toggle Intro Seen
  container.querySelector('#seenIntroToggle')?.addEventListener('change', (e) => {
    appState.profile.seenIntro = e.target.checked;
  });
}
