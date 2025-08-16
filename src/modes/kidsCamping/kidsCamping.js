
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
import { initAntButtonManager } from './antButtonManager.js';
import { initMosquitoGame } from './mosquitoGame.js';

// ────────────────────────────────────────────────────────────────────────────────
// Module-level state
// ────────────────────────────────────────────────────────────────────────────────
let mosquitoCtrl = null;
let xpDisposer   = null;
let lastScoreBucket = 0;

const SELECTORS = {
  container: '#game-container',
  menuWrapper: '.menu-wrapper',
};

const TRACKS = {
  sc90: `${import.meta.env.BASE_URL}assets/audio/sc90.mp3`,
};

const HANDLERS = {
  unlockAudioOnce: null,
  onStartCamping: null,
  onBackToMenuIntro: null,
  onMuteClick: null,
  onIconTwist: null,
};

// ────────────────────────────────────────────────────────────────────────────────
export function loadKidsMode() {
  // Reset score & set mode
  runInAction(() => { appState.popCount = 0; });
  appState.setMode('kids');
  updatePopUI();

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

  // Defensive tap-zoom prevention
  document.querySelectorAll('.kc-aspect-wrap, .kc-game-frame').forEach(preventDoubleTapZoom);
}

export function stopKidsMode() {
  // Stop music and tent game
  stopTrack();
  cleanupTentLineGame();

  // Mosquito: confined to #game-container, but still cancel timers/raf
  try { mosquitoCtrl?.disable?.(); } catch {}
  try { mosquitoCtrl?.cleanup?.(); } catch {}
  mosquitoCtrl = null;

  // Unwire handlers
  unwireIntroHandlers();
  unwireMainHandlers();
  unwireAudioUnlock();

  // Clear container (removes any leftover mosq holders/splats because they’re children)
  const container = document.querySelector(SELECTORS.container);
  if (container) {
    container.innerHTML = '';
    container.classList.add('hidden');
    container.style.display = 'none';
  }

  // Stop XP watcher and reset score
  try { xpDisposer?.(); } catch {}
  xpDisposer = null;
  appState.popCount = 0;
  updatePopUI();

  // Restore menu bg
  applyBackgroundTheme();

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
              Hello! We're the Dino Dividers! Let's play some camping games!
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

  document.body.addEventListener('touchstart', HANDLERS.unlockAudioOnce, { once: false });
  document.body.addEventListener('click', HANDLERS.unlockAudioOnce, { once: false });
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
}

// ────────────────────────────────────────────────────────────────────────────────
// Boot games (now mosquito is confined to #game-container)
// ────────────────────────────────────────────────────────────────────────────────
async function bootGames() {
  // Tent Line
  const tentZone = document.querySelector('.kc-tent-zone');
  if (tentZone) {
    tentZone.innerHTML = '';
    const tentGameEl = createTentLineGame((score) => {
      appState.incrementPopCount(score);
      updatePopUI();
      animatePopCount();
    });
    tentZone.appendChild(tentGameEl);
  } else {
    console.warn('⚠️ .kc-tent-zone not found');
  }

  // Parking
  const parkingZone = document.getElementById('parkingZone');
  if (parkingZone) {
    initParkingGame(parkingZone);
  } else {
    console.warn('⚠️ #parkingZone not found in .kc-slider-cell');
  }

  // Ant Attack
  const antZone = document.getElementById('antZone');
  if (antZone) {
    try {
      const { initAntAttackGame } = await import('./antAttack.js');
      initAntAttackGame(antZone, updatePopUI);
      initAntButtonManager();
    } catch (err) {
      console.error('Failed to initialize ant attack game:', err);
    }
  } else {
    console.warn('⚠️ #antZone not found');
  }

  // Mosquito — LOCKED to the game container
  const host = document.querySelector(SELECTORS.container);
  if (host) {
    mosquitoCtrl?.cleanup?.();
    mosquitoCtrl = initMosquitoGame({
      zoneEl: host,          // ⬅️ confined here
      spawnDelayMs: 7000,    // ⏱️ 7s
      respawnDelayMs: 7000,  // ⏱️ 7s
      baseSpeed: 80,
      onSwat() {
        appState.incrementPopCount(50);  // +50 reward
        updatePopUI();
        animatePopCount();
      }
    });
    mosquitoCtrl.enable();
  }
}

// ────────────────────────────────────────────────────────────────────────────────
// UI helpers
// ────────────────────────────────────────────────────────────────────────────────
export function updatePopUI() {
  const popSpan = document.getElementById('popCount');
  if (popSpan) popSpan.textContent = appState.popCount;
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
  playTransition(() => {
    stopKidsMode();
    document.querySelector(SELECTORS.menuWrapper)?.classList.remove('hidden');
    applyBackgroundTheme();
  });
}

