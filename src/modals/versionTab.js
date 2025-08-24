import { appState } from '../data/appState.js';

export function renderVersionTab() {
  const build = window?.devFlags?.build || 'unknown';
  const backup = JSON.stringify(appState, null, 2); // 🧠 Using MobX state directly!

  return `
    <div class="settings-block">
      <h3>🧠 SnowCone MathFest v0.8.0</h3>
      <p><strong>Build:</strong> <code>${build}</code></p>
      <p>Crafted with cosmic cones 🍧</p>
    </div>

    <div class="settings-block">
      <h3>🍦 v0.8.0 — Prologuing the Inevitable is Done</h3>
      <p>
        – 📖 <strong>Story Mode (Prologue) online</strong> — centered chapter menu, bigger title, typewriter screen, clean Prev/Next flow<br>
        – 🖼️ <strong>Legend image system</strong>: new <code>.sm-slide-legend</code> sizing + Galileo bump class; title→image spacing fix; crisp margins<br>
        – 🌌 New art drops: Galileo/Newton night skies (landscape), Ada storm spiral (landscape), Gauss rain-arcs (landscape), Jehnk 2-Cones (portrait), festival variants with transparent edges<br>
        – 🧊 Bram image re-exported @2× for retina; optional <code>image-rendering: crisp-edges</code> hook added<br>
        – 🧩 Practice slides: cone art now <em>pinned</em> (abs-pos) with reserved space — no button push-down on mobile<br>
        – 📱 Viewport prep pass: clamp + vh audit, safe-area bottom bar, iOS tap highlight off, double-tap zoom prevention kept<br>
        – 🔊 Audio: Howler one-tap unlock preserved; mute sync; interval-beep throttle; sfx wiring stays scoped to Story canvas<br>
        – ⚙️ Perf: sprite & image preloads tuned; lazy-in slide art; background repaint helper keeps cache fresh without layout thrash<br>
        – 🐛 Fixes: title/text underlap beneath images, Galileo “too small” PNG, reveal button double-fires, Back/Mute alignment, pointer-events on bottom bar<br>
        – 🧯 Cleanup discipline: listeners/RAF/timers fully unwired on exit; no leaks between Kids/Story canvases<br>
        – 🧮 <strong>XP</strong>: +25 XP per Reveal; +500 XP on Prologue “Finish”; single subtle popup anchored to the pressed button (no duplicate toast); capture-before-nav so XP always saves; badges coming later ⭐️<br>
        – 🧰 Dev: centralized <code>awardXP(amount, { anchor, reason })</code> and <code>showXPPopup(text, anchor)</code>; removed duplicate inline popup calls in <code>drawSlide()</code>
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
