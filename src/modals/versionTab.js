import { appState } from '../data/appState.js';

export function renderVersionTab() {
  const build = window?.devFlags?.build || 'unknown';
  const backup = JSON.stringify(appState, null, 2); // 🧠 Using MobX state directly!

  return `
    <div class="settings-block">
      <h3>🧠 SnowCone MathFest v0.9.9</h3>
      <p><strong>Build:</strong> <code>${build}</code></p>
      <p>Crafted with cosmic cones 🍧</p>
    </div>

    <div class="settings-block">
      <h3>v0.9.9 — Just Small Details Now</h3>
      <p>
        – 📖 <strong>Story Mode Forest</strong>: KC-style 11:16 stage, typewriter intro with <em>Skip / I’m Ready</em>, clean slide deck (Prev/Next + Enter/←/→/Esc), one-shot “Reveal” blocks, +25 XP per reveal and <strong>+500 XP</strong> on Finish, tiny fretboard mini-sim (fraction readout + interval beep)<br>
        – 🧊 <strong>Bottom bar stability (all modes)</strong>: Back/Mute pinned inside safe-area; portraits, images, and popups no longer push controls on small phones<br>
        – 🧠 <strong>Math Tips Village</strong>: true full-height iOS PWA fix (<code>100svh</code> + safe-area), single chat scroller owns overflow, smooth scroll restored, bottom bar never overlaps input; refreshed response styling cards<br>
        – 🪪 <strong>About/Info clarity</strong>: louder credits (<em>Built end-to-end by JPS Grooves</em>), JPSGrooves.com first, stacked links on mobile, fixed header contrast<br>
        – 🧼 <strong>Event wiring & repaint</strong>: single screen-level handlers with clean unwire on exit; background repaint helper to prevent stale paints<br>
        – 🏕️ <strong>Kids Camping suite</strong>: layout locks, honk/park flow stable, zoom protections tightened; smoother celebration overlays and score handling<br>
        – ✅ <strong>Final polishes applied across all modes</strong>: UI consistency, safe-area padding, text clamping, hitboxes, and minor CSS dedupe<br>
        – 🎵 <strong>Soundtrack update</strong>: all tracks <strong>remastered</strong> for levels, clarity, and loop smoothness (JPS Grooves)
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
        CLEARS ALL SAVED PROGRESS and starts fresh.
      </p>

      <input type="file" id="importSave" accept="application/json" style="display:none;" />
      <button class="track-button" id="downloadSave">⬇️ Download Save</button>
      <button class="track-button" id="importSaveBtn">📤 Import Save</button>
      <button class="track-button" id="resetProgress">☠️ Reset Progress</button>
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
