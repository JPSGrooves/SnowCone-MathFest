import { appState } from '../data/appState.js';

export function renderVersionTab() {
  const build = window?.devFlags?.build || 'unknown';
  const backup = JSON.stringify(appState, null, 2); // 🧠 Using MobX state directly!

  return `
    <div class="settings-block">
      <h3>🧠 SnowCone MathFest v0.9.0.5</h3>
      <p><strong>Build:</strong> <code>${build}</code></p>
      <p>Crafted with cosmic cones 🍧</p>
    </div>

    <div class="settings-block">
      <h3>🍦 v0.9.0.5 — musical kitty paws</h3>
      <p>
        – 🧠 <strong>Math Tips Village UI refresh</strong>: full-bleed background restored, 11:16 aspect wrapper, single scroll area that hugs the bottom, smoother pop-in animations, safe-area padding, and mobile scrollbars hidden<br>
        – 🏷️ <strong>Header cleanup</strong>: title is text-only (“Math Tips Village”) — no panel/border — neon glow retained<br>
        – 💬 <strong>Response styling</strong>: new <code>.mt-response-card</code>, <code>.mt-response-list</code>, and mini-lecture blocks (<code>.mt-lecture-card</code>) for consistent lesson/lore rendering + tidy inline <code>code</code> tokens<br>
        – 🧭 <strong>Bottom utility bar</strong>: fixed Back / Copy / Export / Mute pinned to corners; pointer-events fixes so center actions stay clickable on intro & main screens<br>
        – 🧱 <strong>CSS dedupe & layout hardening</strong>: one scroller owns overflow (<code>min-height:0</code> grid fixes), fewer duplicate rules, and HMR-safe animations<br>
        – 📖 <strong>Lore mode expansion</strong>: added “Festival lore” (Hypotenuse Gate beat), “Who is Grampy P?” identity blurb, and a lightweight “lore joke” path; all use the new card/footer pattern (“Would you like to know more?”) with polished copy<br>
        – 🎵 <strong>MathTips music flow</strong>: reliable one-tap Howler unlock, <code>kittyPaws</code> auto-resume on re-entry, loop toggled on enter/exit, and stop only if the current track belongs to this mode; mute UI stays in sync<br>
        – 🏆 <strong>Legend badge</strong>: auto-awards once all non-legend badges are unlocked (95%), adds the final 5% for 100% completion<br>
        – 📊 <strong>Completion system simplified</strong>: badge-driven only (95% non-legend + 5% legend); XP still fuels levels but no longer affects completion<br>
        – 🗨️ <strong>“Grampy P” badge</strong>: first chat in Math Tips Village (working + persisted)<br>
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
