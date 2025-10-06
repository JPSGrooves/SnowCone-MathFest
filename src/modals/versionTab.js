import { appState } from '../data/appState.js';

export function renderVersionTab() {
  const build = window?.devFlags?.build || 'unknown';
  const backup = JSON.stringify(appState, null, 2); // 🧠 Using MobX state directly!

  return `
    <div class="settings-block">
      <h3>🧠 SnowCone MathFest v0.9.4</h3>
      <p><strong>Build:</strong> <code>${build}</code></p>
      <p>Crafted with cosmic cones 🍧</p>
    </div>

    <div class="settings-block">
      <h3>🍦 v0.9.4 — More Kitty Fixes, Louder About, Quick Polishes</h3>
      <p>
        – 📖 <strong>Story Mode Forest polish</strong>: KC-style 11:16 stage (center/contain BG), typewriter intro with <em>Skip / I’m Ready</em>, clean slide deck (Prev/Next + Enter/←/→/Esc), one-shot “Reveal” blocks, +25 XP per reveal and <strong>+500 XP</strong> on Finish, subtle toast near the pressed button, and a tiny fretboard mini-sim (fraction readout + interval beep)<br>
        – 🧊 <strong>Bottom bar stability</strong>: Back/Mute pinned inside safe-area; portraits/images and popups no longer push buttons down on small phones<br>
        – 🔊 <strong>Audio discipline</strong>: one-tap Howler unlock, Prologue track loops, mute UI stays in sync across screens, loop state reset on exit<br>
        – 🧠 <strong>Math Tips Village — iOS PWA fix</strong>: true full-height after intro (<code>100svh</code> + safe-area), single chat scroller owns overflow (<code>min-height:0</code> grid fix), intro overlay drops <code>pointer-events</code> on fade, <code>touch-action: pan-y</code> restores smooth scroll, bottom bar never overlaps input<br>
        – 🏷️ <strong>Header cleanup (Tips)</strong>: title is text-only — neon glow, no panel/border<br>
        – 💬 <strong>Response styling (Tips)</strong>: added <code>.mt-response-card</code>, <code>.mt-response-list</code>, <code>.mt-lecture-card</code>; tidy inline <code>code</code> tokens, softer pop-in animations<br>
        – 🪪 <strong>About/Info modal — louder & clearer</strong>: removed fullscreen warning; bold credit line (<em>Built end-to-end by JPS Grooves</em>); <strong>JPSGrooves.com</strong> listed first; links stack vertically on mobile; header contrast fixed (no “invisible black” look)<br>
        – 🧼 <strong>Event wiring & repaint</strong>: single screen-level handlers (click/keydown) with full unwire on exit; background repaint helper to bust stale paints<br>
        – 🐛 <strong>Misc fixes</strong>: tiny-screen text clamping, safe-area padding, button hitboxes, and minor CSS dedupe across Story/Tips
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
