// versionTab.js — robust download + import/reset helpers
import { appState } from '../data/appState.js';


// ──────────────────────────────────────────────────────────
// SCMF 1.6.0 — Unified Save Bundle v2
// One downloadable JSON now carries:
// - the normal SnowCone MathFest appState save
// - Ant Attack's independent localStorage save
//
// Legacy pre-v2 save files still import normally.
// ──────────────────────────────────────────────────────────
const SCMF_SAVE_BUNDLE_FORMAT = 'snowcone-mathfest-save';
const SCMF_SAVE_BUNDLE_VERSION = 2;
const ANT_ATTACK_SAVE_KEY = 'scmf.kidsCamping.antAttack.v1';

function readJSONStorageValue(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[Save] Could not parse localStorage key "${key}" for export.`, err);
    return null;
  }
}

function exportFullSaveBundle() {
  return {
    format: SCMF_SAVE_BUNDLE_FORMAT,
    version: SCMF_SAVE_BUNDLE_VERSION,
    exportedAt: new Date().toISOString(),

    appState: exportSaveSnapshot(),

    modeSaves: {
      antAttack: readJSONStorageValue(ANT_ATTACK_SAVE_KEY),
    },
  };
}

function unpackIncomingSave(incoming) {
  const isBundle = !!(
    incoming &&
    typeof incoming === 'object' &&
    !Array.isArray(incoming) &&
    incoming.format === SCMF_SAVE_BUNDLE_FORMAT &&
    Number(incoming.version) >= SCMF_SAVE_BUNDLE_VERSION &&
    incoming.appState &&
    typeof incoming.appState === 'object'
  );

  return {
    isBundle,
    appStateData: isBundle
      ? incoming.appState
      : incoming,
    modeSaves: isBundle
      ? (incoming.modeSaves || {})
      : null,
  };
}

function restoreBundledModeSaves(modeSaves) {
  if (
    !modeSaves ||
    typeof modeSaves !== 'object' ||
    !Object.prototype.hasOwnProperty.call(modeSaves, 'antAttack')
  ) {
    return;
  }

  const antAttackSave = modeSaves.antAttack;

  // An explicit null means the exported device had no Ant Attack save.
  // Remove an older local copy so restore behaves like a true restore.
  if (antAttackSave == null) {
    localStorage.removeItem(ANT_ATTACK_SAVE_KEY);
    return;
  }

  if (typeof antAttackSave !== 'object' || Array.isArray(antAttackSave)) {
    throw new Error('Invalid Ant Attack save payload.');
  }

  localStorage.setItem(
    ANT_ATTACK_SAVE_KEY,
    JSON.stringify(antAttackSave)
  );
}

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
  return `
    <div class="settings-block data-tab-card">
      <h3 class="data-tab-title">🗂️ Save Data</h3>

      <p class="data-tab-mainline">
        Your festival progress is saved on this device.
      </p>

      <p class="data-tab-warning">
        Heads up: deleting the app or clearing storage can erase this device’s progress.
      </p>

      <input type="file" id="importSave" accept="application/json" style="display:none;" />

      <div class="data-button-stack">
        <button class="track-button data-action-btn" id="downloadSave">
          ⬇️ Save Game
        </button>

        <button class="track-button data-action-btn" id="importSaveBtn">
          📤 Load Game
        </button>

        <button class="track-button data-action-btn data-danger-btn" id="resetProgress">
          🗑️ Reset Game
        </button>
      </div>

      <p class="data-tab-footer">
        Save backups to Files or iCloud Drive, then import them later if you switch devices.
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
        const bundle = exportFullSaveBundle();
        await downloadJSON('snowcone_save_data.json', bundle);
      } catch (err) {
        console.warn('[Save] Download failed, falling back to copy dialog.', err);
        try {
          const raw = JSON.stringify(exportFullSaveBundle(), null, 2);
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
          const {
            isBundle,
            appStateData,
            modeSaves,
          } = unpackIncomingSave(incoming);

          if (
            !appStateData ||
            typeof appStateData !== 'object' ||
            Array.isArray(appStateData)
          ) {
            throw new Error('Invalid SnowCone save payload.');
          }

          // Cautious restore: use the AppState importer so MobX maps/classes
          // remain real runtime objects instead of becoming plain JSON.
          if (typeof appState.importFromJSON === 'function') {
            appState.importFromJSON(appStateData);
          } else {
            Object.assign(appState, appStateData);
          }

          // Only v2 bundled saves touch independent mode storage.
          // Legacy saves continue to import exactly as before.
          if (isBundle) {
            restoreBundledModeSaves(modeSaves);
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
