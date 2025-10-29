// versionTab.js — robust download + import/reset helpers
import { appState } from '../data/appState.js';

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────

// Try to produce a plain JSON-ready snapshot of appState.
function exportSaveSnapshot() {
  // 1) First-class exporter if you provide it.
  if (typeof appState?.toJSON === 'function') {
    try { return appState.toJSON(); } catch {}
  }

  // 2) Structured clone (modern browsers).
  try { return structuredClone(appState); } catch {}

  // 3) JSON round-trip (skips functions/reactions, may drop non-plain props).
  try { return JSON.parse(JSON.stringify(appState)); } catch {}

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
  return (
    (window.navigator && window.navigator.standalone === true) ||
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
  );
}

async function fallbackShareOrOpen(filename, blob) {
  // Prefer Share Sheet with a real File if possible (iOS 15+ / modern)
  try {
    const file = new File([blob], filename, { type: blob.type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'SnowCone Save', text: 'SnowCone MathFest save file' });
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
      try { URL.revokeObjectURL(url); } catch {}
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
  // (unused) Keeping this note of your prior pattern:
  // const backup = JSON.stringify(appState, null, 2);

  return `
    <div class="settings-block">
      <h3>🧠 SnowCone MathFest v1.1.0</h3>
      <p><strong>Build:</strong> <code>${build}</code></p>
      <p>Crafted with cosmic cones 🍧</p>
    </div>

    <div class="settings-block">
      <h3>v1.1.0 — Chapter 1: It Has Begun</h3>
      <p>
        – 📖 <strong>Story Mode Forest</strong>: <strong>Prologue + Chapter 1 (The Gates of Dawn) complete</strong> — KC-style 11:16 stage, typewriter intro (<em>Skip / I’m Ready</em>), clean slide deck (Prev/Next + Enter/←/→/Esc), one-shot “Reveal” blocks; new lore loop <em>Question the Recipes</em>; quest <em>Pocket Check</em> (tight pre-reveal → big reveal) with item-forge flow; chapter finish drip + <strong>Chapter 2 handoff</strong><br>
        – ⬇️ <strong>Save Tools (rock-solid)</strong>: hardened <em>Download Save</em> (delayed URL revoke + in-DOM anchor), iOS PWA <code>navigator.share({ files })</code> fallback, data-URL + clipboard backups; safer <code>toJSON()</code> snapshot with defensive fallbacks<br>
        – 🧊 <strong>Bottom bar stability (all modes)</strong>: Back/Mute pinned inside safe-area; portraits, images, and popups no longer push controls on small phones<br>
        – 🧠 <strong>Math Tips Village</strong>: true full-height iOS PWA fix (<code>100svh</code> + safe-area), single chat scroller owns overflow, smooth scroll restored, bottom bar never overlaps input; refreshed response styling cards<br>
        – 🪪 <strong>About/Info clarity</strong>: louder credits (<em>Built end-to-end by JPS Grooves</em>), JPSGrooves.com first, stacked links on mobile, fixed header contrast<br>
        – 🧼 <strong>Event wiring & repaint</strong>: single screen-level handlers with clean unwire on exit; background repaint helper to prevent stale paints<br>
        – 🏕️ <strong>Kids Camping suite</strong>: layout locks, honk/park flow stable, zoom protections tightened; smoother celebration overlays and score handling<br>
        – ♿ <strong>Accessibility & copy</strong>: ALT labels on key UI/badges; contrast nudges on dark headers; consistent help/exit patterns<br>
        – ✅ <strong>Final polishes across all modes</strong>: UI consistency, safe-area padding, text clamping, hitboxes, and minor CSS dedupe<br>
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
          alert('Copied save JSON to clipboard. Paste into a file named snowcone_save_data.json');
        } catch {
          alert('⚠️ Could not download or copy save. Try from a regular browser tab instead of PWA.');
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
        } catch {}
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
          const text = typeof event.target.result === 'string'
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
      try { reader.readAsArrayBuffer(file); }
      catch { reader.readAsText(file); }
    });
  }
}
