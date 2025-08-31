// /src/modes/kidsCamping/kidsCamping.js
import './kidsCamping.css';
import { applyBackgroundTheme } from '../../managers/backgroundManager.js';
import { playTransition } from '../../managers/transitionManager.js';
import { appState } from '../../data/appState.js';
import { hookReturnButton } from '../../utils/returnToMenu.js';
import { createTentLineGame, initGameLine, cleanupTentLineGame } from './kidsCampingTentLineGame.js';
import { runInAction, reaction } from 'mobx';
import { stopTrack, playTrack } from '../../managers/musicManager.js';
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



const SELECTORS = {
  container: '#game-container',
  menuWrapper: '.menu-wrapper',
};

const HANDLERS = {
  unlockAudioOnce: null,
  onStartCamping: null,
  onBackToMenuIntro: null,
  onMuteClick: null,
  onIconTwist: null,
};
// add near HANDLERS:
HANDLERS.onAntsFull = null;
HANDLERS.onParkingComplete = null;

// kidsCamping.js
function wireKidsBadgeListeners() {
  unwireKidsBadgeListeners();

  HANDLERS.onAntsFull = () => {
    if (!_awarded.ants10) { _awarded.ants10 = true; awardBadge('kids_ants10'); }
  };
  document.addEventListener('kcAntsFull', HANDLERS.onAntsFull);

  HANDLERS.onParkingComplete = (ev) => {
    const elapsedMs = ev?.detail?.elapsedMs ?? Infinity;
    // 🏁 “speed” badge → only if finished within 60s
    if (elapsedMs <= PARKING_FAST_MS && !_awarded.cars) {
      _awarded.cars = true;
      awardBadge('kids_cars_speed');   // ✅ your real ID
      // console.log('[kids] awarded kids_cars_speed in', elapsedMs, 'ms');
    }
  };
  document.addEventListener('kcParkingComplete', HANDLERS.onParkingComplete);
}

function unwireKidsBadgeListeners() {
  if (HANDLERS.onAntsFull)          document.removeEventListener('kcAntsFull', HANDLERS.onAntsFull);
  if (HANDLERS.onParkingComplete)    document.removeEventListener('kcParkingComplete', HANDLERS.onParkingComplete);
  HANDLERS.onAntsFull = HANDLERS.onParkingComplete = null;
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
  // Reset score & set mode
  runInAction(() => { appState.popCount = 0; });
  appState.setMode('kids');
  updatePopUI();

  disableNoSelectForKids();

  // Show container, hide menu
  const container = document.querySelector(SELECTORS.container);
  const menuWrapper = document.querySelector(SELECTORS.menuWrapper);
  menuWrapper?.classList.add('hidden');
  if (container) {
    container.classList.remove('hidden');
    container.style.display = 'flex';
  }

  // Theme + preload
  setTimeout(() => applyBackgroundTheme('assets/img/modes/kidsCamping/kidsBG.png'), 0);
  import('./preloadParkingSprites.js').then(m => m.preloadParkingSprites()).catch(() => {});

  // Stop prior games/music
  stopTrack();
  cleanupTentLineGame();

  // Render intro & wire
  renderIntroScreen();
  wireIntroHandlers();
  wireAudioUnlockOnce();

  // XP watcher (100 XP / 1000 score)
  startXPWatcher();

  // Prevent accidental zoom
  document.querySelectorAll('.kc-aspect-wrap, .kc-game-frame').forEach(preventDoubleTapZoom);
}

export async function stopKidsMode() {
  disableIosLoupeKiller(document.getElementById('game-container'));
  disableGestureCage();                // ⬅️ lift the cage
  disableNoSelectForKids();
  try { stopTrack(); } catch {}
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
             src="${import.meta.env.BASE_URL}assets/img/modes/kidsCamping/kidsBG.png"
             alt="Kids Camping Background" />
        <div class="kc-intro">
          <div class="kc-intro-stack">
            <div class="kc-speech">
              Heyo! We're the Dino Dividers! Let's chill out and play some camping games!
            </div>
            <div class="director-wrapper">
              <img id="directorSpriteIntro" class="director-img"
                   src="${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/directors_intro.png" />
            </div>
            <button id="startCamping" class="kc-intro-btn kc-btn-large start-camp-btn">⛺ Get to Camping! ⛺</button>
            <button id="backToMenuIntro" class="kc-intro-btn kc-btn-large back-to-menu-btn">🔙 Back to Menu</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function wireIntroHandlers() {
  const back = document.querySelector('#backToMenuIntro');
  const start = document.querySelector('#startCamping');

  HANDLERS.onBackToMenuIntro = () => {
    stopTrack();
    returnToMenu();
  };

  HANDLERS.onStartCamping = async () => {
    if (globalThis.__KC_BOOT_LOCK__) return;  // prevent double-boot
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

  back?.addEventListener('click', HANDLERS.onBackToMenuIntro);
  start?.addEventListener('click', HANDLERS.onStartCamping);
}

function unwireIntroHandlers() {
  const back = document.querySelector('#backToMenuIntro');
  const start = document.querySelector('#startCamping');
  if (back && HANDLERS.onBackToMenuIntro) back.removeEventListener('click', HANDLERS.onBackToMenuIntro);
  if (start && HANDLERS.onStartCamping) start.removeEventListener('click', HANDLERS.onStartCamping);
  HANDLERS.onBackToMenuIntro = null;
  HANDLERS.onStartCamping = null;
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
  playTrack('sc90');

  const container = document.querySelector(SELECTORS.container);
  if (!container) return;

  container.innerHTML = `
    <div class="kc-aspect-wrap">
      <div class="kc-game-frame">
        <img id="modeBackground" class="background-fill"
             src="${import.meta.env.BASE_URL}assets/img/modes/kidsCamping/kidsBG.png"
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

          <div class="kc-popper-cell">
            <div class="kc-popper-lineup">
              <div class="kc-popper-slot">
                <button id="backToMenu">🔙<br/>Menu</button>
              </div>
              <div class="kc-score-wrap">
                <div class="kc-score-box">
                  <div class="kc-score-label">Camping Score</div>
                  <span id="popCount">0</span>
                </div>
              </div>
              <div class="kc-popper-slot">
                <button id="muteToggle" class="mute-btn">🔊<br/>Mute?</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `;

  hookReturnButton('backToMenu');
  document.querySelectorAll('.kc-aspect-wrap, .kc-game-frame, .kc-grid').forEach(preventDoubleTapZoom);
}


function onTentsAll() {
  if (_awarded.tentsAll) return;
  _awarded.tentsAll = true;
  requestAnimationFrame(() => setTimeout(() => awardBadge('kids_tents_all'), 0));
}


// and in unwireMainHandlers() (or stopKidsMode) remove if you didn’t use { once: true }:
// container?.removeEventListener('kc:tents-all', onTentsAll);


function wireMainHandlers() {
  // Mute toggle
  const muteBtn = document.getElementById('muteToggle');
  if (muteBtn) {
    HANDLERS.onMuteClick = () => {
      const H = window.Howler ?? globalThis.Howler;
      H?.mute?.(!H._muted);
      applyMuteVisual(muteBtn);
    };
    muteBtn.addEventListener('click', HANDLERS.onMuteClick);
    applyMuteVisual(muteBtn);
  }

  // Title dino twirl
  HANDLERS.onIconTwist = (ev) => {
    const icon = ev.currentTarget;
    icon.classList.remove('twisting');
    void icon.offsetWidth;
    icon.classList.add('twisting');
  };
  document.querySelectorAll('.kc-icon, .kc-title img.kc-icon').forEach(el => {
    el.addEventListener('click', HANDLERS.onIconTwist);
  });
  wireKidsBadgeListeners(); // <— add this
  const container = document.querySelector(SELECTORS.container);
  container?.addEventListener('kc:tents-all', onTentsAll, { once: true, passive: true });
}

function unwireMainHandlers() {
  const muteBtn = document.getElementById('muteToggle');
  if (muteBtn && HANDLERS.onMuteClick) muteBtn.removeEventListener('click', HANDLERS.onMuteClick);
  HANDLERS.onMuteClick = null;

  if (HANDLERS.onIconTwist) {
    document.querySelectorAll('.kc-icon, .kc-title img.kc-icon').forEach(el => {
      el.removeEventListener('click', HANDLERS.onIconTwist);
    });
  }
  HANDLERS.onIconTwist = null;
  unwireKidsBadgeListeners(); // <— add this
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

// ────────────────────────────────────────────────────────────────────────────────
// UI helpers
// ────────────────────────────────────────────────────────────────────────────────
export function updatePopUI() {
  const popSpan = document.getElementById('popCount');
  if (popSpan) popSpan.textContent = appState.popCount;

  emitCampScore(); // ✅ let the Kids XP listener run

  // 10k camping score → badge (once)
  if (!_awarded.camp10k && (appState.popCount || 0) >= 10_000) {
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
  const H = window.Howler ?? globalThis.Howler;
  const isMuted = !!H?._muted;
  btn.innerHTML = isMuted ? '🔇<br/>Muted' : '🔊<br/>Mute?';
  btn.classList.toggle('muted', isMuted);
}

// ────────────────────────────────────────────────────────────────────────────────
// Navigation
// ────────────────────────────────────────────────────────────────────────────────
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
    document.querySelector(SELECTORS.menuWrapper)?.classList.remove('hidden');
    applyBackgroundTheme();
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
