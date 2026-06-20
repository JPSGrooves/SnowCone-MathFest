// /src/modes/kidsCamping/kidsCamping.js
import './kidsCamping.css';
import { applyBackgroundTheme } from '../../managers/backgroundManager.js';
import { playTransition } from '../../managers/transitionManager.js';
import { appState } from '../../data/appState.js';
import { hookReturnButton } from '../../utils/returnToMenu.js';
import { createTentLineGame, initGameLine, cleanupTentLineGame } from './kidsCampingTentLineGame.js';
import { runInAction, reaction } from 'mobx';
import {
  stopTrack,
  playTrack,
  toggleMute,
  isMuted,
  pushMusicScope,
  popMusicScope,
} from '../../managers/musicManager.js';
import { initParkingGame } from './parkingGame.js';
import { preventDoubleTapZoom } from '../../utils/preventDoubleTapZoom.js';
import { initMosquitoGame } from './mosquitoGame.js';
import { enableGestureCage, disableGestureCage } from '../../utils/gestureCage.js';
import { enableIosLoupeKiller, disableIosLoupeKiller } from '../../utils/iosLoupeKiller.js';
import { awardBadge } from '../../managers/badgeManager.js';



// State
// ────────────────────────────────────────────────────────────────────────────────
let mosquitoCtrl = null;
let xpDisposer   = null;
let lastScoreBucket = 0;

// ✅ local once-only guards (awardBadge is idempotent, this just avoids noise)
const _awarded = {
  cars: false,
  camp10k: false,
  mosquito: false,
  ants10: false,
  tentsAll: false,
};

const PARKING_FAST_MS = 60_000; // 60s target


const KC_FIRST_TRACK_ID = 'sc90';

// After SnowCone 90 plays once, Kids Camping enters the full festival rotation.
// setMusicPool() filters iOS-exclusive tracks automatically when not visible.
const KC_ROTATION_TRACK_IDS = [
  'quikserve',
  'kktribute',
  'softdown',
  'infadd',
  'sc90',
  'nothingorg',
  'secrets',
  'stoopidelectro',
  'prologue',
  'kittyPaws',
  'patchrelaxes',
  'bonusTime',
  'lastRun'
];
let _kcMusicScopeOn = false;

function activateKidsCampingMusicScope() {
  if (_kcMusicScopeOn) return;

  pushMusicScope({
    // 🏕️ Kids Camping music lane:
    // Start on SnowCone 90, then native ended handler advances into this pool.
    poolIds: KC_ROTATION_TRACK_IDS,

    // Once sc90 ends, musicManager.handleNativeTrackEnded()
    // sees shuffling=true and calls playRandomTrack().
    shuffling: false,

    // Important: false here.
    // If true, native ended handler returns early and sc90 loops forever.
    looping: true
  });

  _kcMusicScopeOn = true;
}

function startKidsCampingMusic() {
  activateKidsCampingMusicScope();

  // First Camping song is always SnowCone 90.
  // After it ends, the active shuffled pool takes over.
  playTrack(KC_FIRST_TRACK_ID);
}

function stopKidsCampingMusic() {
  try { stopTrack(); } catch {}

  if (_kcMusicScopeOn) {
    try { popMusicScope(); } catch (err) {
      console.warn('[kc] popMusicScope failed', err);
    }
    _kcMusicScopeOn = false;
  }
}




const SELECTORS = {
  container: '#game-container',
  menuWrapper: '.menu-wrapper',
};

const HANDLERS = {
  unlockAudioOnce: null,
  onStartCamping: null,
  onBackToMenuIntro: null,
  onBackFromMain: null,
  onMuteClick: null,
  onIconTwist: null,
};
// add near HANDLERS:
HANDLERS.onAntsFull = null;
HANDLERS.onParkingComplete = null;
// kidsCamping.js

const KC_BODY_CLASS = 'kc-active';

// put this near your other HANDLERS keys
HANDLERS.onAntRoundProgress = null;

function wireKidsBadgeListeners() {
  unwireKidsBadgeListeners();

  HANDLERS.onAntRoundProgress = (ev) => {
    const d = ev?.detail || {};
    const p = Number.isFinite(+d.playerWins) ? +d.playerWins : 0;
    const a = Number.isFinite(+d.aiWins)     ? +d.aiWins     : 0;
    const margin = Number.isFinite(+d.margin) ? +d.margin : (p - a);

    // dev visibility (remove later)
    console.log('[kc] kcAntRoundResult:', { p, a, margin });

    if (!_awarded.ants10 && margin >= 10) {
      _awarded.ants10 = true;
      // tiny defer so we never collide with round UI updates
      requestAnimationFrame(() => setTimeout(() => awardBadge('kids_ants_streak10'), 0));
    }
  };

  document.addEventListener('kcAntRoundResult', HANDLERS.onAntRoundProgress);

  // existing parking listener stays the same
  HANDLERS.onParkingComplete = (ev) => {
    const elapsedMs = ev?.detail?.elapsedMs ?? Infinity;
    if (elapsedMs <= PARKING_FAST_MS && !_awarded.cars) {
      _awarded.cars = true;
      awardBadge('kids_cars_speed');
    }
  };
  document.addEventListener('kcParkingComplete', HANDLERS.onParkingComplete);
}

function unwireKidsBadgeListeners() {
  if (HANDLERS.onAntRoundProgress)
    document.removeEventListener('kcAntRoundResult', HANDLERS.onAntRoundProgress);
  if (HANDLERS.onParkingComplete)
    document.removeEventListener('kcParkingComplete', HANDLERS.onParkingComplete);

  HANDLERS.onAntRoundProgress = null;
  HANDLERS.onParkingComplete  = null;
}



function emitCampScore() {
  try {
    document.dispatchEvent(new CustomEvent('campScoreUpdated', { detail: appState.popCount }));
  } catch {}
}
// ────────────────────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────────────────────
export function loadKidsMode() {
  enableIosLoupeKiller(document.getElementById('game-container'));
  enableGestureCage();                 // ⬅️ turn the cage on

  // 🔹 NEW: mark body so iOS-only CSS can target this mode
  document.body.classList.add(KC_BODY_CLASS);

  // Reset score & set mode
  runInAction(() => { appState.popCount = 0; });
  appState.setMode('kids');
  updatePopUI();

  // 🔹 NEW: actually ENABLE the kids no-select shield
  enableNoSelectForKids();

  // Show container, hide menu
  const container = document.querySelector(SELECTORS.container);
  const menuWrapper = document.querySelector(SELECTORS.menuWrapper);
  menuWrapper?.classList.add('hidden');
  if (container) {
    container.classList.remove('hidden');
    container.style.display = 'flex';
  }

  // Theme + preload
  setTimeout(() => applyBackgroundTheme('assets/img/modes/kidsCamping/plate_kidsBG.png'), 0);
  import('./preloadParkingSprites.js').then(m => m.preloadParkingSprites()).catch(() => {});

  // Stop prior games/music
  stopTrack();
  cleanupTentLineGame();

  // Render intro & wire
  renderIntroScreen();
  wireIntroHandlers();
  wireAudioUnlockOnce();

  // XP watcher (100 XP / 1000 score – global XP bucket)
  startXPWatcher();

  // Prevent accidental zoom just inside the frame
  document.querySelectorAll('.kc-aspect-wrap, .kc-game-frame').forEach(preventDoubleTapZoom);
}

export async function stopKidsMode() {
  disableIosLoupeKiller(document.getElementById('game-container'));
  disableGestureCage();                // ⬅️ lift the cage

  // 🔹 NEW: clear body flag so iOS padding stops applying
  document.body.classList.remove(KC_BODY_CLASS);

  // 🔹 NEW: turn off the no-select guard when we leave Kids Mode
  disableNoSelectForKids();

  stopKidsCampingMusic();
  try { cleanupTentLineGame(); } catch {}

  // 🔴 HARD KILL Ant Attack
  const container = document.querySelector(SELECTORS.container);
  try {
    const antMod = await import('./antAttack.js');
    const antZone = container?.querySelector('#antZone');
    if (antZone && typeof antMod.destroyAntAttackGame === 'function') {
      antMod.destroyAntAttackGame(antZone);
    }
    antMod.forceKillAntAttack?.();   // double-tap kill (timers/session)
  } catch {}

  // Mosquito
  try { mosquitoCtrl?.disable?.(); } catch {}
  try { mosquitoCtrl?.cleanup?.(); } catch {}
  mosquitoCtrl = null;

  // Unwire handlers
  try { unwireIntroHandlers(); } catch {}
  try { unwireMainHandlers(); } catch {}
  try { unwireAudioUnlock(); } catch {}

  // Clear container
  try {
    if (container) {
      container.innerHTML = '';
      container.classList.add('hidden');
      container.style.display = 'none';
    }
  } catch {}

  try { xpDisposer?.(); } catch {}
  xpDisposer = null;
  appState.popCount = 0;
  updatePopUI();

  console.log('🏕️ Kids Camping Mode cleaned up!');
}


// ────────────────────────────────────────────────────────────────────────────────
// XP watcher
// ────────────────────────────────────────────────────────────────────────────────
function startXPWatcher() {
  lastScoreBucket = Math.floor((appState.popCount || 0) / 1000);
  xpDisposer?.();
  xpDisposer = reaction(
    () => appState.popCount,
    (score) => {
      const currBucket = Math.floor((score || 0) / 1000);
      const gain = currBucket - lastScoreBucket;
      if (gain > 0) appState.addXP(gain * 100);
      lastScoreBucket = currBucket;
    }
  );
}

// ────────────────────────────────────────────────────────────────────────────────
// Intro
// ────────────────────────────────────────────────────────────────────────────────
function renderIntroScreen() {
  const container = document.querySelector(SELECTORS.container);
  if (!container) return;
  container.innerHTML = `
    <div class="kc-aspect-wrap">
      <div class="kc-game-frame">
        <img id="modeBackground" class="background-fill kc-bg-img"
             src="${import.meta.env.BASE_URL}assets/img/modes/kidsCamping/plate_kidsBG.png"
             alt="Kids Camping Background" />
        <div class="kc-intro">
          <div class="kc-intro-stack">
            <div class="kc-speech">
              Heyo! We're the Dino Dividers! Let's chill out and play: Ant Attack, Tent Line, Parking Panic, and Mosquito Mash!<br/>
            </div>
            <div class="director-wrapper">
              <img id="directorSpriteIntro" class="director-img"
                   src="${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/directors_intro.png" />
            </div>
            <button id="startCamping" class="kc-intro-btn kc-btn-large start-camp-btn">⛺ Get to Camping! ⛺</button>
          </div>
        </div>

        <!-- 🍧 KC bottom bar (Story-style) -->
        <div class="kc-bottom-bar">
          <button id="kcBackIntro" class="kc-square-btn kc-left">🔙</button>
        </div>
      </div>
    </div>
  `;
}


function wireIntroHandlers() {
  const start = document.querySelector('#startCamping');
  const back  = document.querySelector('#kcBackIntro');
  const mute  = document.querySelector('#kcMuteIntro');

  HANDLERS.onBackToMenuIntro = () => {
    stopKidsCampingMusic();
    returnToMenu();
  };
  HANDLERS.onStartCamping = async () => {
    if (globalThis.__KC_BOOT_LOCK__) return;
    globalThis.__KC_BOOT_LOCK__ = true;
    const introEl = document.querySelector('.kc-intro');
    if (!introEl) return;
    introEl.classList.add('fade-out');
    setTimeout(async () => {
      renderMainUI();
      wireMainHandlers();
      await bootGames();
      requestAnimationFrame(() => requestAnimationFrame(initGameLine));
    }, 450);
  };

  HANDLERS.onMuteClickIntro = () => {
    const nextMuted = !safeCampingMuted();
    toggleMute(nextMuted);
    applyMuteVisual(mute);
  };

  back?.addEventListener('click', HANDLERS.onBackToMenuIntro);
  start?.addEventListener('click', HANDLERS.onStartCamping);
  mute?.addEventListener('click', HANDLERS.onMuteClickIntro);
  applyMuteVisual(mute);
}

function unwireIntroHandlers() {
  const back = document.querySelector('#kcBackIntro');
  const start = document.querySelector('#startCamping');
  const mute = document.querySelector('#kcMuteIntro');

  if (back && HANDLERS.onBackToMenuIntro) back.removeEventListener('click', HANDLERS.onBackToMenuIntro);
  if (start && HANDLERS.onStartCamping)   start.removeEventListener('click', HANDLERS.onStartCamping);
  if (mute && HANDLERS.onMuteClickIntro)  mute.removeEventListener('click', HANDLERS.onMuteClickIntro);

  HANDLERS.onBackToMenuIntro = null;
  HANDLERS.onStartCamping = null;
  HANDLERS.onMuteClickIntro = null;
}

// ────────────────────────────────────────────────────────────────────────────────
// Audio unlock (Howler)
// ────────────────────────────────────────────────────────────────────────────────
function wireAudioUnlockOnce() {
  if (HANDLERS.unlockAudioOnce) return;

  HANDLERS.unlockAudioOnce = () => {
    try {
      const H = window.Howler ?? globalThis.Howler;
      if (H?.ctx && H.ctx.state === 'suspended') {
        H.ctx.resume().then(() => console.log('🔓 Howler AudioContext unlocked'));
      }
    } catch {}
    document.body.removeEventListener('touchstart', HANDLERS.unlockAudioOnce);
    document.body.removeEventListener('click', HANDLERS.unlockAudioOnce);
    HANDLERS.unlockAudioOnce = null;
  };

  document.body.addEventListener('touchstart', HANDLERS.unlockAudioOnce, { once: true });
  document.body.addEventListener('click', HANDLERS.unlockAudioOnce, { once: true });
}

function unwireAudioUnlock() {
  if (!HANDLERS.unlockAudioOnce) return;
  document.body.removeEventListener('touchstart', HANDLERS.unlockAudioOnce);
  document.body.removeEventListener('click', HANDLERS.unlockAudioOnce);
  HANDLERS.unlockAudioOnce = null;
}

// ────────────────────────────────────────────────────────────────────────────────
// Main UI + handlers
// ────────────────────────────────────────────────────────────────────────────────
function renderMainUI() {
  startKidsCampingMusic();

  const container = document.querySelector(SELECTORS.container);
  if (!container) return;

  container.innerHTML = `
    <div class="kc-aspect-wrap">
      <div class="kc-game-frame">
        <img id="modeBackground" class="background-fill"
             src="${import.meta.env.BASE_URL}assets/img/modes/kidsCamping/plate_kidsBG.png"
             alt="Kids Camping Background" />
        <div class="kc-grid">
          <div class="kc-title">
            <img src="${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/rexVider.png" class="kc-icon kc-left-title" />
            <span class="kc-title-text">Camping Games</span>
            <img src="${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/triceriVider.png" class="kc-icon kc-right-title" />
          </div>

          <div class="kc-ant-attack-zone" id="antZone"></div>
          <div class="kc-tent-zone"></div>
          <div class="kc-slider-cell" id="parkingZone"></div>

          <!-- Score moved to the real bottom dock in 1.3.1d.
               Keep this cell as a harmless grid-area placeholder only. -->
          <div class="kc-popper-cell" aria-hidden="true"></div>
        </div>

        <!-- 🍧 KC bottom dock: Back | Camping Score | Mute -->
        <div class="kc-bottom-bar">
          <button id="kcBack" class="kc-square-btn kc-left" aria-label="Back to Menu">🔙</button>

          <div class="kc-dock-score" aria-live="polite">
            <div class="kc-score-label">Camping Score</div>
            <span id="popCount">0</span>
          </div>

          <button id="kcMute" class="kc-square-btn kc-right" aria-label="Mute">🔊</button>
        </div>
      </div>
    </div>
  `;

  // return hook now targets the square back button
  // local zoom shield
  document
    .querySelectorAll('.kc-aspect-wrap, .kc-game-frame, .kc-grid')
    .forEach(preventDoubleTapZoom);
}


function onTentsAll() {
  if (_awarded.tentsAll) return;
  _awarded.tentsAll = true;
  requestAnimationFrame(() => setTimeout(() => awardBadge('kids_tents_all'), 0));
}


// and in unwireMainHandlers() (or stopKidsMode) remove if you didn’t use { once: true }:
// container?.removeEventListener('kc:tents-all', onTentsAll);


function wireMainHandlers() {
  // 🔙 Back button – go through our local returnToMenu, which calls stopKidsMode()
  const backBtn = document.getElementById('kcBack');
  if (backBtn) {
    HANDLERS.onBackFromMain = () => {
      stopKidsCampingMusic();
      returnToMenu();              // 👈 this already awaits stopKidsMode + forceKillAntAttack
    };
    backBtn.addEventListener('click', HANDLERS.onBackFromMain);
  }

  // 🔇 / 🔊 Mute toggle (square)
  const muteBtn = document.getElementById('kcMute');
  if (muteBtn) {
    HANDLERS.onMuteClick = () => {
      const nextMuted = !safeCampingMuted();
      toggleMute(nextMuted);
      applyMuteVisual(muteBtn);
    };
    muteBtn.addEventListener('click', HANDLERS.onMuteClick);
    applyMuteVisual(muteBtn);
  }

  // 🦕 Title dino twirl (unchanged)
  HANDLERS.onIconTwist = (ev) => {
    const icon = ev.currentTarget;
    icon.classList.remove('twisting');
    void icon.offsetWidth;
    icon.classList.add('twisting');
  };
  document.querySelectorAll('.kc-icon, .kc-title img.kc-icon').forEach(el => {
    el.addEventListener('click', HANDLERS.onIconTwist);
  });

  wireKidsBadgeListeners();

  const container = document.querySelector(SELECTORS.container);
  container?.addEventListener('kc:tents-all', onTentsAll, { once: true, passive: true });
}

function unwireMainHandlers() {
  // 🔙 Back
  const backBtn = document.getElementById('kcBack');
  if (backBtn && HANDLERS.onBackFromMain) {
    backBtn.removeEventListener('click', HANDLERS.onBackFromMain);
  }
  HANDLERS.onBackFromMain = null;

  // 🔇 / 🔊 Mute
  const muteBtn = document.getElementById('kcMute');
  if (muteBtn && HANDLERS.onMuteClick) {
    muteBtn.removeEventListener('click', HANDLERS.onMuteClick);
  }
  HANDLERS.onMuteClick = null;

  // 🦕 Title dino twirl
  if (HANDLERS.onIconTwist) {
    document.querySelectorAll('.kc-icon, .kc-title img.kc-icon').forEach(el => {
      el.removeEventListener('click', HANDLERS.onIconTwist);
    });
  }
  HANDLERS.onIconTwist = null;

  // badges & tents
  unwireKidsBadgeListeners();
  const container = document.querySelector(SELECTORS.container);
  container?.removeEventListener('kc:tents-all', onTentsAll);
}


// ────────────────────────────────────────────────────────────────────────────────
// Boot games (mosquito confined to #game-container)
// ────────────────────────────────────────────────────────────────────────────────
async function bootGames() {
  // local guard (survives HMR via global)
  const R = (globalThis.__KC_RUNTIME__ ||= { booting:false, booted:false });

  if (R.booting) {
    console.warn('[kc] bootGames: already booting — skip');
    return;
  }
  R.booting = true;
  console.log('[kc] bootGames: enter');

  try {
    // 0) Ant Attack: kill any leftover timers/tweens before init (idempotent)
    try {
      const antMod = await import('./antAttack.js');
      antMod.forceKillAntAttack?.();
    } catch {}

    // 1) Tent Line
    const tentZone = document.querySelector('.kc-tent-zone');
    if (tentZone) {
      tentZone.innerHTML = '';
      const tentGameEl = createTentLineGame((score) => {
        appState.incrementPopCount(score);
        updatePopUI();
        animatePopCount();
      });
      tentZone.appendChild(tentGameEl);
    }

    // 2) Parking
    const parkingZone = document.getElementById('parkingZone');
    if (parkingZone) {
      initParkingGame(parkingZone);
    }

    // 3) Ant Attack — build UI once
    const antZone = document.getElementById('antZone');
    if (antZone) {
      try {
        const { initAntAttackGame } = await import('./antAttack.js');
        if (!antZone.dataset.kcAntInit) {
          antZone.dataset.kcAntInit = '1';
          initAntAttackGame(antZone, updatePopUI);
        }
      } catch (err) {
        console.error('[kc] bootGames: antAttack init failed', err);
      }
    }

    // 4) Mosquito — confined to the game container
    const host = document.querySelector(SELECTORS.container);
    if (host) {
      try { mosquitoCtrl?.disable?.(); } catch {}
      try { mosquitoCtrl?.cleanup?.(); } catch {}
      mosquitoCtrl = initMosquitoGame({
        zoneEl: host,
        spawnDelayMs: 7000,
        respawnDelayMs: 7000,
        baseSpeed: 80,
        onSwat() {
          appState.incrementPopCount(50);
          updatePopUI();
          animatePopCount();
          if (!_awarded.mosquito) {
            _awarded.mosquito = true;
            awardBadge('kids_mosquito');
          }
        }
      });
      mosquitoCtrl.enable();
    }

    console.log('[kc] bootGames: done');
  } finally {
    R.booting = false;
    R.booted  = true;
    globalThis.__KC_BOOT_LOCK__ = false; // allow future clicks
  }
}
function updateCampingHighScore(currentScore) {
  const score = Number(currentScore) || 0;
  try {
    runInAction(() => {
      // Ensure profile exists
      const profile = appState.profile || (appState.profile = {});
      const prev =
        typeof profile.campingHighScore === 'number'
          ? profile.campingHighScore
          : 0;

      if (score > prev) {
        profile.campingHighScore = score;
        // optional debug:
        // console.log('[kc] New camping high score:', score);
      }
    });
  } catch (err) {
    console.warn('[kc] updateCampingHighScore failed', err);
  }
}

// ────────────────────────────────────────────────────────────────────────────────
// UI helpers
// ────────────────────────────────────────────────────────────────────────────────
export function updatePopUI() {
  const popSpan = document.getElementById('popCount');
  const current = Number(appState.popCount) || 0;

  if (popSpan) popSpan.textContent = current;

  // Let XP / listeners know the score changed
  emitCampScore();

  // 🏕️ Keep lifetime best in profile
  updateCampingHighScore(current);

  // 10k camping score → badge (once)
  if (!_awarded.camp10k && current >= 10_000) {
    _awarded.camp10k = true;
    awardBadge('kids_camp_10k'); // alias to your canonical id if needed
  }
}

function animatePopCount() {
  const el = document.getElementById('popCount');
  if (!el) return;
  el.style.transition = 'transform 0.2s ease';
  el.style.transform = 'scale(1.2)';
  setTimeout(() => { el.style.transform = 'scale(1)'; }, 200);
}

function applyMuteVisual(btn) {
  try {
    const muted = safeCampingMuted();

    if (btn) {
      btn.textContent = muted ? '🔇' : '🔊';
      btn.classList.toggle('muted', muted);
      btn.dataset.muted = muted ? '1' : '0';
      btn.setAttribute('aria-pressed', muted ? 'true' : 'false');
      btn.title = muted ? 'Unmute' : 'Mute';
    }
  } catch {}
}

function safeCampingMuted() {
  try {
    const m = isMuted?.();
    if (typeof m === 'boolean') return m;
  } catch {}

  try {
    const H = window.Howler ?? globalThis.Howler;
    return !!H?._muted;
  } catch {}

  return false;
}

// ────────────────────────────────────────────────────────────────────────────────
// Navigation
// ────────────────────────────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────────────────────────
// Navigation
// ────────────────────────────────────────────────────────────────────────────────

function restartMenuTitleNeonAfterKidsReturn() {
  // No-op now.
  // Menu owns title animation behavior.
  // The old Kids-only repeated restart caused the return blink/stutter.
}

function returnToMenu() {
  playTransition(async () => {
    try {
      await stopKidsMode();
      // extra hard stop in case anything was mid-tick
      try {
        const { forceKillAntAttack } = await import('./antAttack.js');
        forceKillAntAttack?.();
      } catch {}
    } catch (e) {
      console.error('[kc] returnToMenu: stopKidsMode error', e);
    }

    const menuWrapper = document.querySelector(SELECTORS.menuWrapper);
    if (menuWrapper) {
      menuWrapper.classList.remove('hidden');
    }

    applyBackgroundTheme();

    // Title glow is handled by menu.js now.
    // Do not restart it from Kids Camping; repeated kicks cause return blink.
    restartMenuTitleNeonAfterKidsReturn();
  });
}

// at module scope
const NOSEL = (globalThis.__KC_NOSEL__ ||= {});

function enableNoSelectForKids() {
  document.documentElement.classList.add('kc-no-select', 'kc-no-drag');

  // Block context menu / selection / drag (but allow inside .allow-select and form fields)
  NOSEL.blockCtx = (e) => e.preventDefault();
  NOSEL.blockSelect = (e) => {
    const t = e.target;
    if (t.closest('.allow-select')) return;
    if (/INPUT|TEXTAREA/.test(t.tagName)) return;
    e.preventDefault();
  };
  NOSEL.blockDrag = (e) => e.preventDefault();

  document.addEventListener('contextmenu', NOSEL.blockCtx);
  document.addEventListener('selectstart', NOSEL.blockSelect);
  document.addEventListener('dragstart', NOSEL.blockDrag);
}

function disableNoSelectForKids() {
  document.documentElement.classList.remove('kc-no-select', 'kc-no-drag');

  document.removeEventListener('contextmenu', NOSEL.blockCtx);
  document.removeEventListener('selectstart', NOSEL.blockSelect);
  document.removeEventListener('dragstart', NOSEL.blockDrag);

  NOSEL.blockCtx = NOSEL.blockSelect = NOSEL.blockDrag = null;
}
(function wireCampXPIncrement() {
  const POINTS_PER_XP = 10;
  let creditedXPFromPop = 0;

  const onCampScoreUpdated = (ev) => {
    const currentPop = Number(ev.detail) || 0;

    // bucketed Kids XP
    const shouldHaveXP = Math.floor(currentPop / POINTS_PER_XP);
    const delta = shouldHaveXP - creditedXPFromPop;
    if (delta > 0) {
      appState.addKidsCampingXP(delta);  // fills Kids bucket (cap 1000)
      creditedXPFromPop += delta;
    }

    // 10k badge here too, so Parking’s local UI still awards it
    if (!_awarded.camp10k && currentPop >= 10_000) {
      _awarded.camp10k = true;
      awardBadge('kids_camp_10k');
    }
  };

  document.removeEventListener('campScoreUpdated', onCampScoreUpdated);
  document.addEventListener('campScoreUpdated', onCampScoreUpdated);
})();
