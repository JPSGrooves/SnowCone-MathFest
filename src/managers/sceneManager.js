// 🚦 MobX Scene Manager (Hardened: swap lock + await stops + safe UI state)
import { appState } from '../data/appState.js';

import { loadQuickServe, stopQuickServeGame } from '../modes/quickServe/quickServe.js';
import { loadKidsMode, stopKidsMode } from '../modes/kidsCamping/kidsCamping.js';
import { loadMathTips, stopMathTips } from '../modes/mathTips/mathTips.js';
import { loadStoryMode, stopStoryMode } from '../modes/storymodeForest/storyMode.js';
import { loadInfinityMode, stopInfinityMode } from '../modes/infinityLake/infinityMode.js';

import { applyBackgroundTheme } from './backgroundManager.js';

//////////////////////////////
// 🧊 Swap Lock + Queue
//////////////////////////////
let isSwitching = false;
let queuedMode = null;
let switchToken = 0;

//////////////////////////////
// 🧠 Mode tables (clean + less switch duplication)
//////////////////////////////
const MODE_LOADERS = {
  quickServe: loadQuickServe,
  kids: loadKidsMode,
  mathtips: loadMathTips,
  story: loadStoryMode,
  infinity: loadInfinityMode,
};

const MODE_STOPPERS = {
  quickServe: stopQuickServeGame,
  kids: stopKidsMode,
  mathtips: stopMathTips,
  story: stopStoryMode,
  infinity: stopInfinityMode,
};

//////////////////////////////
// 🚀 GLOBAL SCENE SWAPPER
//////////////////////////////
export async function startMode(modeName) {
  modeName = String(modeName || '').trim();

  if (!modeName) {
    console.warn('⚠️ startMode called with empty modeName');
    return;
  }

  // 🧊 If a swap is already in progress, queue the newest request and bail.
  // This kills the intermittent "blank mode" bug caused by overlapping cleanup/load.
  if (isSwitching) {
    queuedMode = modeName;
    console.warn('🧊 Mode switch in progress — queued:', modeName);
    return;
  }

  const token = ++switchToken;
  isSwitching = true;

  console.log(`🌀 Switching to ${modeName}...`, { token, from: appState.mode });

  try {
    // ✅ Stop old mode FIRST (while its DOM still exists), then clear/hide.
    await cleanupCurrentMode({ token, nextMode: modeName });

    // 🧠 MobX tracks active mode
    appState.setMode(modeName);

    // ✅ Ensure menu is hidden and game container is visible before load
    hideMenu();
    showGameContainer();

    const loader = MODE_LOADERS[modeName];
    if (!loader) {
      console.warn(`⚠️ Unknown mode: ${modeName}`);
      // fallback: show menu again
      showMenu();
      return;
    }

    // ✅ Run loader guarded so an exception can't strand you in a blank state
    try {
      loader();
    } catch (err) {
      console.error(`💥 Mode loader crashed for "${modeName}"`, err);
      // Back to safety
      safeResetToMenu();
      return;
    }

    // 🧪 Optional tiny sanity check: if a mode forgot to unhide container, fix it
    // (This is harmless and prevents invisible-but-loaded states.)
    requestAnimationFrame(() => {
      const container = document.getElementById('game-container');
      if (!container) return;
      if (container.classList.contains('hidden') || container.style.display === 'none') {
        console.warn('🧯 Container was hidden after load; forcing visible', { modeName, token });
        container.classList.remove('hidden');
        container.style.display = 'flex';
      }
    });
  } finally {
    isSwitching = false;

    // 🔁 If user spam-clicked modes while switching, run the newest queued request now.
    if (queuedMode && queuedMode !== modeName) {
      const next = queuedMode;
      queuedMode = null;
      // Fire and forget (but it is serialized by lock)
      startMode(next);
    } else {
      queuedMode = null;
    }
  }
}

//////////////////////////////
// 🧹 CLEAN UP EVERYTHING (now async + ordered)
//////////////////////////////
async function cleanupCurrentMode({ token, nextMode } = {}) {
  const container = document.getElementById('game-container');

  if (!container) {
    console.warn('⚠️ No #game-container found during cleanup.');
    return;
  }

  const lastMode = appState.mode;

  // 🛑 Stop running systems based on last mode
  // IMPORTANT: await in case new musicManager logic uses fades/promises/timers.
  const stopFn = MODE_STOPPERS[lastMode];

  if (typeof stopFn === 'function') {
    try {
      const maybePromise = stopFn();
      await Promise.resolve(maybePromise);
      console.log('🧹 Stopped previous mode:', { lastMode, token, nextMode });
    } catch (err) {
      console.warn('⚠️ Failed stopping previous mode (continuing):', { lastMode, err });
    }
  }

  // ✅ UI Reset – just the game area (do this AFTER stop)
  container.innerHTML = '';
  container.classList.add('hidden');
  container.style.display = 'none';

  // ✅ Background reset:
  // If we are going back to the menu, apply menu theme.
  // If we are switching into another mode, let the new mode set its own background
  // (this avoids flicker + weird mid-swap background state).
  if (!nextMode) {
    applyBackgroundTheme();
  }

  // NOTE:
  // We DO NOT clear appState.mode here because startMode() will set it to the next mode.
  // If you have a "clearCurrentMode" you want on menu-return only, do it in showMenu() flows.
}

//////////////////////////////
// 🧰 UI Helpers
//////////////////////////////
function hideMenu() {
  document.querySelector('.menu-wrapper')?.classList.add('hidden');
}

function showMenuWrapperOnly() {
  document.querySelector('.menu-wrapper')?.classList.remove('hidden');
}

function showGameContainer() {
  const container = document.getElementById('game-container');
  if (!container) return;
  container.classList.remove('hidden');
  container.style.display = 'flex';
}

function hideGameContainer() {
  const container = document.getElementById('game-container');
  if (!container) return;
  container.innerHTML = '';
  container.classList.add('hidden');
  container.style.display = 'none';
}

function safeResetToMenu() {
  try {
    hideGameContainer();
  } catch {}
  try {
    showMenuWrapperOnly();
  } catch {}
  try {
    applyBackgroundTheme();
  } catch {}
}

//////////////////////////////
// 🏠 Menu Return
//////////////////////////////
export function showMenu() {
  // Queue clearing: if user requested a mode while we were returning, wipe it.
  queuedMode = null;

  hideGameContainer();
  showMenuWrapperOnly();

  // When explicitly returning to menu, apply base theme.
  applyBackgroundTheme();

  // If you want to clear mode on menu return, do it here:
  // appState.clearCurrentMode?.();
}