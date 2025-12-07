// versionTab.js — robust download + import/reset helpers
import { appState } from '../data/appState.js';

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────

// Try to produce a plain JSON-ready snapshot of appState.
function exportSaveSnapshot() {
  // 1) First-class exporter if you provide it.
  if (typeof appState?.toJSON === 'function') {
    try {
      return appState.toJSON();
    } catch {
      // fall through
    }
  }

  // 2) Structured clone (modern browsers).
  try {
    return structuredClone(appState);
  } catch {
    // fall through
  }

  // 3) JSON round-trip (skips functions/reactions, may drop non-plain props).
  try {
    return JSON.parse(JSON.stringify(appState));
  } catch {
    // fall through
  }

  // 4) Minimal curated snapshot (last resort—tweak as your state evolves).
  try {
    return {
      items: appState.listItems?.() ?? [],
      currency: appState.getCurrency?.() ?? appState.currency ?? 0,
      xp: appState.getXP?.() ?? appState.xp ?? 0,
      badges: appState.listBadges?.() ?? appState.badges ?? [],
      themes: appState.themes ?? [],
      flags: appState.flags ?? {},
      // add other stable primitives you care about here
    };
  } catch {
    // If truly nothing works, at least give the user *something*
    return { note: 'Snapshot failed, minimal stub', ts: Date.now() };
  }
}

function isStandaloneMode() {
  // iOS Safari PWA: navigator.standalone === true
  // Other PWAs: matchMedia('(display-mode: standalone)')
  try {
    return (
      (window.navigator && window.navigator.standalone === true) ||
      (window.matchMedia &&
        window.matchMedia('(display-mode: standalone)').matches)
    );
  } catch {
    return false;
  }
}

async function fallbackShareOrOpen(filename, blob) {
  // Prefer Share Sheet with a real File if possible (iOS 15+ / modern)
  try {
    const file = new File([blob], filename, { type: blob.type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'SnowCone Save',
        text: 'SnowCone MathFest save file',
      });
      return true;
    }
  } catch {
    // ignore and try next fallback
  }

  // Data URL fallback — open in a new tab (may prompt user to copy/save)
  try {
    await new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result);
      fr.onerror = rej;
      fr.readAsDataURL(blob);
    }).then((dataUrl) => {
      const w = window.open(dataUrl, '_blank', 'noopener,noreferrer');
      if (!w) {
        // Last-ditch: navigate current tab
        window.location.href = dataUrl;
      }
    });
    return true;
  } catch {
    return false;
  }
}

async function downloadBlob(filename, blob) {
  // Many browsers: anchor with objectURL, appended to DOM, delayed revoke
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.rel = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    // Let the browser grab the bytes before we clean up
    setTimeout(() => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
      a.remove();
    }, 1500);
    return true;
  } catch {
    // fall through to share/data-url path
  }

  return fallbackShareOrOpen(filename, blob);
}

async function downloadJSON(filename, data) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });

  // Some PWAs on iOS choke on anchor+blob; try share/data-url first if standalone.
  if (isStandaloneMode()) {
    const ok = await fallbackShareOrOpen(filename, blob);
    if (ok) return;
    // if share failed, try the normal blob path
  }

  await downloadBlob(filename, blob);
}

// ──────────────────────────────────────────────────────────
// Public render + setup
// ─────────────────────────────────────────────────────────-

export function renderVersionTab() {
  const build = window?.devFlags?.build || 'unknown';

  // Runtime check: are we running as an installed app / standalone PWA?
  // We gate copy on this so browser users keep the current PWA instructions,
  // while installed-app users get “native app” style wording.
  const isApp =
    typeof window !== 'undefined'
      ? isStandaloneMode()
      : false;

  return `
    <div class="settings-block">
      <h3>🧠 SnowCone MathFest v1.4.0</h3>
      <p><strong>Build:</strong> <code>${build}</code></p>
      <p>Crafted with cosmic cones 🍧</p>
    </div>

    <div class="settings-block">
      <h3>v1.4.0 — High Score Release + Credits &amp; Music Guard ✨</h3>
      <p>
        – 🚚 <strong>Truck-tap High Score HUD</strong>: invisible <code>.menu-highscore-hitbox</code> now rides on top of the festival truck on the main menu; keyboard-focusable and scaled to the 11:16 stage so tapping the truck pops stats on phones and desktop without adding a new mode<br>
        – 📈 <strong>High Score overlay card</strong>: new <code>#highScoreOverlay</code> dialog reuses the cosmic dimmer to show Camping Score, QuickServe best run, and Infinity high score + longest streak in a compact neon card that fits even tiny phones<br>
        – 🎧 <strong>App-wide music visibility guard</strong>: <code>wireMusicVisibilityGuard()</code> in <code>main.js</code> listens for <code>visibilitychange</code> and pauses whatever track was playing when the tab/app goes to the background, then resumes only that track on return for proper “native app” lock/unlock behavior<br>
        – 🎛️ <strong>QuickServe private booth guard</strong>: <code>attachQuickServeVisibilityGuard()</code> in <code>quickServeMusic.js</code> keeps its own <code>qsWasPlayingOnHide</code> flag so QS music pauses/resumes cleanly without fighting the global guard or resurrecting dead runs after result popups<br>
        – ♾️ <strong>Infinity Lake high score pipeline</strong>: end-of-run handler now updates score, streak, longest streak, and solved count in <code>appState</code>, calls <code>checkInfinityBadgesByScore()</code> off score + elapsed time, and only bumps High Score / Longest Streak when you actually beat your previous record<br>
        – 🎬 <strong>Story credits layout + safety net</strong>: credits viewport (<code>.sm-credits-list</code>) gets a real min-height so lines don’t clip; blackout hand-off uses <code>animationend</code> + a 600ms timeout fallback to guarantee <code>showStoryCredits()</code> runs even on cranky mobile Safari<br>
        – 🍬 <strong>Toasts moved under the “movie”</strong>: <code>.pickup-stack</code> and Story XP popups are anchored just above the bottom bar so inventory/XP toasts still fire but never sit on top of the credits; <code>THANK_YOU_TEXT</code> adds a soft promo outro (tell a friend, search “SnowCone MathFest” / “JPS Grooves”) as data-only copy you can tweak anytime<br>
        – ⭐ <strong>Next</strong>: Light copy/visual polish on the High Score card, wire any final Infinity/QuickServe badge tiers off the new data, and decide if the credits “thank you” should appear on first-clear only or every lap through the forest
      </p>
    </div>

    <div class="settings-block">
      <h3>📲 App Info</h3>
      ${
        isApp
          ? `
      <p>You’re running the SnowCone MathFest app on this device.</p>
      <p>Your progress is stored locally in the app’s save data. Deleting the app or clearing its storage will erase your festival progress on this device.</p>
      <p>You can still back up or move your save using the tools below if you want to jump between devices.</p>
      `
          : `
      <p>This app works offline after install!<br>To save your data, don't clear site storage.</p>
      <p>If you're on an iPhone or iPad using Safari:<br>
        Tap the <strong>Share</strong> icon, then choose <strong>"Add to Home Screen"</strong> to install the app.</p>
      <p>If you're using Android or Chrome:<br>
        You can install this app for offline play:
      </p>
      <button class="track-button" id="installAppBtn" style="display: none;">📲 Install App</button>
      `
      }
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
    downloadBtn.addEventListener('click', async () => {
      try {
        const snapshot = exportSaveSnapshot();
        await downloadJSON('snowcone_save_data.json', snapshot);
      } catch (err) {
        console.warn('[Save] Download failed, falling back to copy dialog.', err);
        try {
          const raw = JSON.stringify(exportSaveSnapshot(), null, 2);
          // Friendly fallback: copy to clipboard as a last resort.
          await navigator.clipboard?.writeText(raw);
          alert(
            'Copied save JSON to clipboard. Paste into a file named snowcone_save_data.json'
          );
        } catch {
          alert(
            '⚠️ Could not download or copy save. Try from a regular browser tab instead of PWA.'
          );
        }
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset all progress? This cannot be undone.')) {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch {
          // ignore
        }
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
          // FileReader gives string or ArrayBuffer; ensure string:
          const text =
            typeof event.target.result === 'string'
              ? event.target.result
              : new TextDecoder().decode(event.target.result);
          const incoming = JSON.parse(text);

          // Cautious merge: prefer your appState helpers if they exist.
          if (typeof appState.importFromJSON === 'function') {
            appState.importFromJSON(incoming);
          } else {
            Object.assign(appState, incoming);
          }

          sessionStorage.setItem('forceWelcomeReload', 'true');
          appState.saveToStorage?.();

          alert('✅ Save data loaded! Reloading...');
          setTimeout(() => location.reload(), 120);
        } catch (err) {
          console.warn('[Save] Import failed:', err);
          alert('⚠️ Failed to load save. Invalid file format.');
        }
      };
      // Use readAsArrayBuffer → robust TextDecoder path for all encodings
      try {
        reader.readAsArrayBuffer(file);
      } catch {
        reader.readAsText(file);
      }
    });
  }
}
