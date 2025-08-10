import { appState } from '../data/appState.js';

export function renderVersionTab() {
  const build = window?.devFlags?.build || 'unknown';
  const backup = JSON.stringify(appState, null, 2); // 🧠 Using MobX state directly!

  return `
    <div class="settings-block">
      <h3>🧠 SnowCone MathFest v0.6.6</h3>
      <p><strong>Build:</strong> <code>${build}</code></p>
      <p>Crafted with cosmic cones 🍧</p>
    </div>

    <div class="settings-block">
      <h3>🍦 v0.6.6 Update – TentsUpCarsParked</h3>
      <p>
        – ♾️ Infinity Lake Mode now fully playable — intro screen, Triplet jam, math problems, XP, and high scores<br>
        – 🎶 Background music shuffles from curated Infinity tracks — reshuffles every loop for eternal vibes<br>
        – 🔊 Mute button now syncs with Howler state — works via mouse or keyboard (M key)<br>
        – 🧠 Mode switching with <strong>J / K / L</strong> keys fully functional — updates visuals and generates new problems<br>
        – 💫 Mode button glow now reflects current selection — both mouse and keyboard stay in sync<br>
        – 💥 3–6–9 streak SFX burst added — Triplet hype plays alternating sound effects at key intervals<br>
        – 🎉 High score and longest streak are tracked and celebrated with confetti explosions<br>
        – ⏱️ Time played now reported at end-of-game popup — no more guessing your grind<br>
        – 🧃 Clean problem generator handles Add/Sub, Mult/Div, and Algebra with smooth fake answer logic<br>
        – 🧽 Fixed missing answer button values — blue and violet buttons now update properly every time<br>
        – 🏕️ Kids Camping Parking Game now **fully complete** — all 11 cars, ordinal bonus logic, and one-minute finale scoring<br>
        – 🔊 New <code>honk1</code> to <code>honk5</code> SFX system plays sequential honks based on car’s honk count<br>
        – 🎺 Honk memory persists if user skips cars — resumes honk where it left off<br>
        – 🧠 50pt ordinal bonus and 100pt under-one-minute bonus fully wired and awarded<br>
        – 🌈 Final “All Parked!” overlay locks & fades before soft reset — looks crispy on mobile<br>
        – 🚀 PNG preloader added for parking sprites — eliminates first-load image delay<br>
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
