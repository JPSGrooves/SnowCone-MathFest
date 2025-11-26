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
      <h3>🧠 SnowCone MathFest v1.3.0</h3>
      <p><strong>Build:</strong> <code>${build}</code></p>
      <p>Crafted with cosmic cones 🍧</p>
    </div>

    <div class="settings-block">
      <h3>v1.3.0 — Story CYOA, Badges & Credits (Ch3–Ch5)</h3>
      <p>
        – 📖 <strong>Story Mode Forest</strong>: Branch web for <strong>Ch.3 → Ch.4 → Ch.5</strong> is now locked — the CYOA “Trade” choice in Ch.3 flows cleanly through the portal/forge in Ch.4 into the two big endings in Ch.5 via <em>flags + inventory + router slides</em><br>
        – 🍧 <strong>Perfect SnowCone vs Beat-Up Phone</strong>: <code>ch3_tradeChoice</code> sets the path — trading removes <code>MASTER_SIGIL</code> and grants <code>BEATUP_PHONE</code> with a pickup ping; keeping preserves the cone but marks the flag, and Ch.4 reads both to decide which portal/phone flavor you see<br>
        – 🔨 <strong>Forge logic in the right place</strong>: Chapter 1’s Pocket Check quest is now the canonical forge — it consumes the three shard items, creates the <strong>Perfect SnowCone</strong>, fires a single epic pickup ping, and leaves chapter completion / currency drip to <code>Chapter1.onFinish</code> instead of a giant custom <code>onAdvance</code><br>
        – ☎️ <strong>Portal, phone, and alignment</strong>: Ch.4’s <code>c4_portal_inventory_tug</code> router steers you into KEEP vs TRADE phone-call variants based on flags; the forge only re-adds the cone if it’s truly reforged, and the alignment GIVE branch now actually removes <code>PERFECT_CONE</code> before handing you into Ch.5<br>
        – 🧭 <strong>Ch.5 endings router</strong>: <code>c5_entry_router</code> checks <code>hasItem(PERFECT_CONE)</code> and sends you to either the <em>Carry the Festival</em> path or the <em>New Driver</em> path; ending flags and inventory cleanup now match the story (“way home” vs “new driver”) without double-advances or weird state leaks<br>
        – 🏅 <strong>Story badges + themes</strong>: Ch.1–Ch.5 completion badges are wired through <code>onFinish</code> hooks, and Ch.5 now calls <code>awardBadge('story_ch5')</code> so finishing the chapter always pops the new story badge and runs through the same <code>awardBadge</code> / theme-unlock pipeline as other modes<br>
        – 📊 <strong>Completion + badge math</strong>: <code>badgeManager</code> now uses a canonical <code>BADGE_ALIAS</code> map and a shared <code>computeCompletionBreakdown()</code> (XP 70% / badges 25% / legend 5%) so Story Mode progress, badges, and the eventual legend unlock all feed into one global completion percent<br>
        – 🧠 <strong>Chapter-complete signal</strong>: Story engine’s <code>_onAdvance()</code> now fires a <code>sm:chapterComplete</code> event, runs <code>chapter.onFinish</code> once, unlocks the next chapter, and then starts it — keeping XP, badges, and credits centralized instead of hand-wired per slide<br>
        – 🎬 <strong>Story credits overlay</strong>: New <code>storyCredits</code> overlay lives in <code>storyCredits.js</code>; Ch.5’s <code>onFinish</code> calls <code>scheduleStoryCredits(800)</code> after save + badge so credits roll once per clear, mount inside <code>.sm-game-frame</code> when present, fall back to <code>document.body</code> if needed, and stay idempotent + pointer-through<br>
        – ⭐ <strong>Next</strong>: Curate copy and art for the branches; test story badges end-to-end; optional pass to have credits roll on first clear only + maybe layer in subtle XP/SFX hooks on key beats
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
