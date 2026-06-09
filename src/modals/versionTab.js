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
      <h3>🧠 SnowCone MathFest v1.2.1</h3>
      <p><strong>Build:</strong> <code>${build}</code></p>
      <p><strong>Current pass:</strong> Startup Doorway Polish ✨</p>
      <p>Crafted with cosmic cones 🍧</p>
    </div>

    ${
      !isApp
        ? `
    <div class="settings-block">
      <h3>🍎 Get the iOS App</h3>
      <p>
        Playing in the browser? On iPhone or iPad you can grab the
        <strong>SnowCone MathFest</strong> app from the App Store for the main
        iOS-native experience.
      </p>
      <button class="track-button" id="openIOSAppBtn">🍎 Open App Store</button>
      <p style="font-size: 0.8em; opacity: 0.85; margin-top: 0.4rem;">
        This opens the SnowCone MathFest listing on the App Store.
      </p>
    </div>
        `
        : ''
    }

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
      <h3>v1.2.1 — Startup Doorway Polish ✨</h3>
      <p>
        – 🚪 <strong>Cleaner startup doorway</strong>: the opening screen now focuses on the SCMF logo, greeting, rank, completion, daily streak, and the new <strong>Enter Festival</strong> button.<br><br>

        – 🍧 <strong>Less front-door reading</strong>: longer narrative/suggestion copy was removed from startup so players can get into the festival faster while still seeing useful progress info.<br><br>

        – 🏆 <strong>Rank stays visible</strong>: rank remains near the top of the startup stack as the player’s arcade-style identity, with completion and daily streak underneath.<br><br>

        – 🌈 <strong>Button polish</strong>: <strong>Play Game</strong> became <strong>Enter Festival</strong>, with cleaner sizing and stronger “step into the world” language.<br><br>

        – 📱 <strong>iOS-native test path</strong>: this pass was checked through the Capacitor iOS lane instead of relying on browser-only confidence.<br><br>

        – 🧊 <strong>Scoped CSS discipline</strong>: startup/button polish stayed targeted. No global stylesheet cleanup was attempted because the current iOS layouts are working and should not be disturbed without cause.<br><br>

        – 🚚 <strong>Next</strong>: evolve the truck popup into the <strong>Festival Office</strong>, with Jehnk saying hello, high scores, rank/completion, daily streak, tiny festival tips, and future room for Daily Challenge, theme hints, and Hard Mode ideas.
      </p>
    </div>

    <div class="settings-block">
      <h3>v1.2.0 — Native Audio & User Soundtrack Update 🔊</h3>
      <p>
        – 🔊 <strong>Native iOS audio backbone</strong>: SCMF music and SFX now route through a native Swift audio layer on iPhone/iPad instead of relying fully on WebView audio behavior.<br><br>

        – 🔇 <strong>Silent switch respect</strong>: the iOS build uses a native audio policy that respects the iPhone silent switch.<br><br>

        – 🎧 <strong>User music wins</strong>: Apple Music, Spotify, and other user audio can take priority while SCMF keeps gameplay feedback available.<br><br>

        – 🎛️ <strong>Music Tab upgrade</strong>: play, pause, track switching, mute, and scrubber behavior now feel closer to a real media player.<br><br>

        – 📳 <strong>Native bridge stability</strong>: haptics, Game Center, audio bridge wiring, and native lifecycle events continue to come online in the iOS shell.
      </p>
    </div>

    <div class="settings-block">
      <h3>Next Cone Cart 🛠️</h3>
      <p>
        – 🚚 <strong>Festival Office</strong>: turn the truck popup into a home for high scores, rank, completion, streak, tiny tips, and Jehnk.<br><br>

        – 🎯 <strong>Daily Challenge idea</strong>: worth exploring later, especially if the app gets a more unified points/progression system.<br><br>

        – 🎨 <strong>Themes / Hard Modes</strong>: still strong future ideas, but they should not hijack the startup screen.<br><br>

        – 🍎 <strong>Native cleanup watch</strong>: eventually address Apple’s future <code>UIScene</code> lifecycle requirement.<br><br>

        – 🧹 <strong>CSS discipline</strong>: clean only the feature being changed. No global CSS refactor unless a layout is actively broken.
      </p>
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
  // 🍎 “Get the iOS App” CTA – browser only
  // (This button only exists when !isApp in renderVersionTab(), so this is safe.)
  const openIOSAppBtn = document.getElementById('openIOSAppBtn');
  if (openIOSAppBtn) {
    openIOSAppBtn.addEventListener('click', () => {
      const url = 'https://apps.apple.com/us/app/snowcone-mathfest/id6756327336';
      window.open(url, '_blank', 'noopener,noreferrer');
    });
  }

}
