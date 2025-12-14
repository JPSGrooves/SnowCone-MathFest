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
  try {
    // 0) Native wrapper / WKWebView-style shell (your Xcode app)
    // Many iOS WebViews expose window.webkit.messageHandlers for JS ↔ native bridges.
    // We treat that as "app-like" so the copy matches the native experience.
    if (
      typeof window !== 'undefined' &&
      window.webkit &&
      window.webkit.messageHandlers
    ) {
      return true;
    }

    // 1) iOS Safari PWA launched from home screen
    if (window.navigator && window.navigator.standalone === true) {
      return true;
    }

    // 2) Other installed PWAs (Chrome, Android, desktop)
    if (
      window.matchMedia &&
      window.matchMedia('(display-mode: standalone)').matches
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

// Simple UA sniff just for copy (not logic)
function isIOSDevice() {
  try {
    const ua = window.navigator?.userAgent || '';
    return /iPhone|iPad|iPod/i.test(ua);
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

  const isiOSApp = isApp && typeof window !== 'undefined' && isIOSDevice();

  return `
    <div class="settings-block">
      <h3>🧠 SnowCone MathFest v1.5.0</h3>
      <p><strong>Build:</strong> <code>${build}</code></p>
      <p>Crafted with cosmic cones 🍧</p>
    </div>
    <div class="settings-block">
    ${
      !isApp
        ? `
    <div class="settings-block">
      <h3>🍎 Get the iOS App</h3>
      <p>
        Playing in the browser? On iPhone or iPad you can grab the
        <strong>SnowCone MathFest</strong> app from the App Store for a more “regular app”
        feel with Screen Time &amp; parental controls.
      </p>
      <button class="track-button" id="openIOSAppBtn">🍎 Open App Store</button>
      <p style="font-size: 0.8em; opacity: 0.85; margin-top: 0.4rem;">
        For now this opens the main App Store page. Once the festival is live on iOS,
        this will jump straight to the SnowCone MathFest listing.
      </p>
    </div>
        `
        : ''
    }
      <h3>📲 App Info</h3>
    ${
        isApp
          ? `
      <p>You’re running the SnowCone MathFest app on this device.</p>
      <p>Your progress is stored locally in the app’s save data. Deleting the app or clearing its storage will erase your festival progress on this device.</p>
      <p>You can still back up or move your save using the tools below if you want to jump between devices.</p>
      `
          : `
      <p>You can install this app!<br>To save your data, don't clear site storage.</p>
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

      ${
        isiOSApp
          ? `
      <p>
        On an iPhone or iPad, you can choose <strong>iCloud Drive</strong> when saving this file
        if you want a cloud backup. Later, you can re-import that same file on another device
        to restore your SnowCone festival progress.
      </p>
      `
          : ''
      }

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
    
    <div class="settings-block">
      <h3>v1.5.0 — iOS Review Ready ✨</h3>
      <p>
        – 🚚 <strong>Truck-Tap High Score HUD</strong>: invisible, accessible <code>.menu-highscore-hitbox</code> rides directly on top of the festival truck; scales perfectly inside the 11:16 stage so tapping (or keyboard-focusing) the truck instantly opens stats on phones and desktop — no new mode added<br><br>
        – 📈 <strong>High Score overlay card</strong>: new <code>#highScoreOverlay</code> reuses the cosmic dimmer to display Camping best score, QuickServe best shift, and Infinity Lake high score + longest streak in a compact neon card that fits even the smallest phones with no scrolling or clipping<br><br>
        – 🎧 <strong>App-wide music visibility guard</strong>: <code>wireMusicVisibilityGuard()</code> listens for <code>visibilitychange</code> and pauses whatever track was playing when the app backgrounds or locks, then resumes only that track on return for true native-app audio behavior on iOS<br><br>
        – 🎛️ <strong>QuickServe private booth audio guard</strong>: <code>attachQuickServeVisibilityGuard()</code> in <code>quickServeMusic.js</code> tracks its own playback state so QuickServe music pauses and resumes cleanly without fighting the global guard or resurrecting finished runs after result screens<br><br>
        – ♾️ <strong>Infinity Lake record-safe scoring pipeline</strong>: end-of-run logic now updates score, streak, longest streak, and solved count deterministically, awards badges based on score + elapsed time, and only bumps High Score or Longest Streak when a true record is beaten — no drift, no false wins<br><br>
        – 🎬 <strong>Story credits layout + safety net</strong>: credits viewport (<code>.sm-credits-list</code>) now has a guaranteed minimum height, and the blackout hand-off uses <code>animationend</code> with a timed fallback to guarantee <code>showStoryCredits()</code> always fires, even on cranky iOS Safari / WKWebView<br><br>
        – 🍬 <strong>Celebrations moved under the “movie”</strong>: <code>.pickup-stack</code> and Story XP popups are anchored just above the bottom bar so rewards remain visible without covering the credits; <code>THANK_YOU_TEXT</code> adds a soft, data-only promo outro you can tweak anytime without touching layout code<br><br>
        – ⭐ <strong>Next</strong>: light visual polish on the High Score card, wire any final Infinity / QuickServe badge tiers off the stabilized score data, and decide whether the credits “thank you” appears on first-clear only or every full loop through the forest
      </p>
    </div>
  `;
}

export function setupVersionTabUI() {
  const downloadBtn = document.getElementById('downloadSave');
  const resetBtn = document.getElementById('resetProgress');
  const importBtn = document.getElementById('importSaveBtn');
  const importInput = document.getElementById('importSave');

  // 🍎 “Get the iOS App” CTA – browser only
  const openIOSAppBtn = document.getElementById('openIOSAppBtn');
  if (openIOSAppBtn) {
    openIOSAppBtn.addEventListener('click', () => {
      // Temporary: take them to the App Store homepage
      window.open('https://www.apple.com/app-store/', '_blank', 'noopener,noreferrer');
    });
  }

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

  // ...rest of setupVersionTabUI unchanged...


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

  // 📲 Wire "Open App Store Page" CTA (browser-only; not rendered when isApp === true)
  const iosBtn = document.getElementById('openIOSAppBtn');
  if (iosBtn) {
    iosBtn.addEventListener('click', () => {
      // 🔗 TODO: replace with your real App Store URL
      const url = 'https://example.com/snowcone-mathfest-ios';
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  }
}
