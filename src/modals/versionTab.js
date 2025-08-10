import { appState } from '../data/appState.js';

export function renderVersionTab() {
  const build = window?.devFlags?.build || 'unknown';
  const backup = JSON.stringify(appState, null, 2); // 🧠 Using MobX state directly!

  return `
    <div class="settings-block">
      <h3>🧠 SnowCone MathFest v0.7.0</h3>
      <p><strong>Build:</strong> <code>${build}</code></p>
      <p>Crafted with cosmic cones 🍧</p>
    </div>

    <div class="settings-block">
      <h3>🍦 v0.7.0 Update – TentsUpCarsParked</h3>
      <p>
        – 🏕️ <strong>Kids Camping v0.7.0 locked</strong> — Tent Lines, Parking, Ant Attack, and the new Mosquito mini-game all live<br>
        – 🚗 Parking Game: all 11 cars, ordinal bonus (+50) and under-one-minute bonus (+100), smooth festival-pace drive-offs, zero jank<br>
        – 🎺 Honk system v2: <code>honk1…honk5</code> sequence per car, honk memory persists if you skip and come back<br>
        – 🖼️ Sprite preloader for parking art — first load stutter gone; intro lane drive-by anim toggles off on first tap<br>
        – 🐜 Ant Attack rewrite: pure count-based tug-of-war; food moves at weight; player wins ties; direction can flip mid-pull; every round scores<br>
        – 🧯 “Ghost score” + late red-spawn bugs squashed; clean tween redirects; food weight overlay + big snowcone polish<br>
        – ⛺ Tent Lines: resilient SVG glow (retries, filter refresh, solid-stroke fallback), solve-all path awards +100, mobile-safe scaling<br>
        – 🦟 Mosquito mini-game: spawns every 7s, smooth slide-in + drift, tap-to-splat at exact touch, +50 Camping Score reward<br>
        – 🔊 SFX: <code>mosquito.mp3</code> on splat at 30% volume, respects global mute; no “haunting” — fully scoped to Kids canvas and killed on exit<br>
        – 🎚️ Mute button synced with Howler state; AudioContext auto-unlock on first touch/click for mobile reliability<br>
        – 🧮 XP flow: earn <strong>100 XP per 1000</strong> Camping Score (auto-tracked with MobX reaction)🎖️<br>
        – 📱 Mobile polish: double-tap-zoom prevention, vh/clamp sizing audit, centered background, grid row locks, tidy score pop animation<br>
        – 🧼 Cleanup discipline: global mosquito kill-switch, timers/RAF/disposers cleared, handlers unwired — no leaks, no leftovers<br>
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
