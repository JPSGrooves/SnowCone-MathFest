import { appState } from '../data/appState.js';

export function renderVersionTab() {
  const build = window?.devFlags?.build || 'unknown';
  const backup = JSON.stringify(appState, null, 2); // 🧠 Using MobX state directly!

  return `
    <div class="settings-block">
      <h3>🧠 SnowCone MathFest v0.8.8</h3>
      <p><strong>Build:</strong> <code>${build}</code></p>
      <p>Crafted with cosmic cones 🍧</p>
    </div>

    <div class="settings-block">
      <h3>🍦 v0.8.8 — The Grampy P Badge</h3>
      <p>
        – 🎖️ <strong>Badges system, phase 1</strong> — event-driven & idempotent (no top-level checks or undefined refs)<br>
        – 🗨️ <strong>The “Grampy P” badge</strong>: awarded on first chat send in Math Tips Village<br>
        – 🎵 <strong>“Play Music” badge</strong>: tied to the Jukebox ▶️ button (first successful play), not auto-play<br>
        – 🎨 <strong>“Change Theme” badge</strong>: first non-default theme via MobX reaction on settings<br>
        – 🚪 <strong>“Try Modes” badges</strong>: awarded on first entry (single or per-mode variant supported)<br>
        – 🏕️ <strong>Kids Camping set</strong>: cars ≤60s, camp score ≥10k, first mosquito swat, ants streak ≥10, all tents lit — all via in-mode events<br>
        – 🧰 <code>achievementsWatcher.js</code>: centralized reactions for first-time/ambient unlocks; clean startup/teardown<br>
        – ⏯️ <strong>Jukebox UX</strong>: play/pause flips immediately, then re-syncs; “Now Playing” label updates reliably<br>
        – 🅿️ <strong>Parking mini-game</strong>: fixed <code>initParkingGame</code> export + <code>kcParkingComplete</code> event wiring<br>
        – 🐛 <strong>Crashes fixed</strong>: removed pre-init <code>awardBadge</code> uses & stray <code>count</code>/<code>seconds</code> checks; intro lockups<br>
        – 🔊 <strong>Audio</strong>: one-tap Howler unlock preserved; mute sync; optional neon progress glow toggle<br>
        – 💾 <strong>Persistence</strong>: autosave via MobX autorun; badge awards persist; unlocks are one-shot by design<br>
        – 🧯 <strong>Cleanup</strong>: listeners/timers unwired on exit; HMR-safe one-shot guards inside modes<br>
        – 🧪 <strong>QA checklist</strong> added (music, theme, modes, Math Tips, Camping cases) for quick regression passes<br>
        – 🚧 <strong>Next</strong>: wire Infinity/QuickServe milestone badges at end-of-run; optional confetti/banner per unlock<br>
      </p>
    </div>

    <div class="settings-block">
      <h3>📲 App Info</h3>
      <p>This app works offline after install!<br>To save your data, don't clear site storage.</p>
      <p>If you're on an iPhone or iPad using Safari:<br>
        Tap the <strong>Share</strong> icon, then choose <strong>"Add to Home Screen"</strong> to install the app.</p>
      <p>If you're using Android or Chrome:<br>
        You can install this app for offline play:
      </p>
      <button class="track-button" id="installAppBtn" style="display: none;">📲 Install App</button>
    </div>

    <div class="settings-block">
      <h3>🧰 Tools</h3>

      <p>Want to back up or transfer your progress?</p>

      <p>
        <strong>⬇️ Download Save:</strong><br>
        Exports your current game progress (XP, badges, themes) as a <code>.json</code> file.
      </p>

      <p>
        <strong>📤 Import Save:</strong><br>
        Load your save file to restore or sync across devices.<br>
        <em>⚠️ This will replace your current data!</em>
      </p>

      <p>
        <strong>🗑️ Reset Progress:</strong><br>
        Clears all saved progress and starts fresh.
      </p>

      <input type="file" id="importSave" accept="application/json" style="display:none;" />
      <button class="track-button" id="downloadSave">⬇️ Download Save</button>
      <button class="track-button" id="importSaveBtn">📤 Import Save</button>
      <button class="track-button" id="resetProgress">🗑️ Reset Progress</button>
    </div>
  `;
}

export function setupVersionTabUI() {
  const downloadBtn = document.getElementById('downloadSave');
  const resetBtn = document.getElementById('resetProgress');
  const importBtn = document.getElementById('importSaveBtn');
  const importInput = document.getElementById('importSave');

  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(appState.toJSON(), null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'snowcone_save_data.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset all progress? This cannot be undone.')) {
        localStorage.clear();
        location.reload();
      }
    });
  }

  if (importBtn && importInput) {
    importBtn.addEventListener('click', () => importInput.click());

    importInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const incoming = JSON.parse(event.target.result);
          Object.assign(appState, incoming); // 🧬 merge state
          sessionStorage.setItem('forceWelcomeReload', 'true');
          alert('✅ Save data loaded! Reloading...');
          setTimeout(() => location.reload(), 100);
        } catch (err) {
          alert('⚠️ Failed to load save. Invalid file format.');
        }
      };
      reader.readAsText(file);
    });
  }
}
