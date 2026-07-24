// /src/modes/kidsCamping/kidsCamping.js
import './kidsCamping.css';
import { applyBackgroundTheme } from '../../managers/backgroundManager.js';
import { playModeReturnTransition } from '../../managers/transitionManager.js';
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
import { getThemeAccent } from '../../data/themeAccentLaw.js';



// State
// ────────────────────────────────────────────────────────────────────────────────
let mosquitoCtrl = null;
let xpDisposer   = null;
let lastScoreBucket = 0;

let selectedCampingActivity = 'ant';

const KC_ACTIVITY_HIGH_SCORE_KEY = 'scmf.kidsCamping.activityHighScores.v1';

let kcSessionActive = false;
let kcSessionActivityId = null;
let kcSessionScoreBaseline = 0;

const KC_ACTIVITY_CONFIG = Object.freeze({
  ant: {
    id: 'ant',
    title: 'Ant Attack',
    shortTitle: 'ANTS',
    subtitle: 'Battle for Snacks!',
    img: 'ant2.png',
    alt: 'Ant Attack'
  },
  tent: {
    id: 'tent',
    title: 'Tent Frenzy',
    shortTitle: 'TENTS',
    subtitle: 'Light Up the Tents!',
    img: 'tentLit.png',
    alt: 'Tent Frenzy'
  },
  parking: {
    id: 'parking',
    title: 'Go & Park',
    shortTitle: 'CARS',
    subtitle: 'Park Cars in Order',
    img: 'golfCart.png',
    alt: 'Go & Park'
  },
  mosquito: {
    id: 'mosquito',
    title: 'Squito Swat',
    shortTitle: 'BUGS',
    subtitle: 'Swat the Skeeters!',
    img: 'mosquito.png',
    alt: 'Squito Swat'
  }
});

// ✅ local once-only guards (awardBadge is idempotent, this just avoids noise)
const _awarded = {
  cars: false,
  camp10k: false,
  mosquito: false,
  ants10: false,
  tentsAll: false,
};

const PARKING_FAST_MS = 60_000; // 60s target


const KC_FIRST_TRACK_BY_ACTIVITY = Object.freeze({
  ant: 'sc90',
  parking: 'kcParkingVibes',
  mosquito: 'kcMosquito',
  tent: 'kcTentLines',
});

// After SnowCone 90 plays once, Kids Camping enters the full festival rotation.
// setMusicPool() filters iOS-exclusive tracks automatically when not visible.
const KC_ROTATION_TRACK_IDS = [
  'sc90',
  'kcParkingVibes',
  'kcTentLines',
  'kcMosquito'
];
let _kcMusicScopeOn = false;

function activateKidsCampingMusicScope() {
  if (_kcMusicScopeOn) return;

  pushMusicScope({
    // 🏕️ Kids Camping music lane:
    // Start on SnowCone 90, then native ended handler advances into this pool.
    poolIds: KC_ROTATION_TRACK_IDS,

    // Signature track plays once.
    // When it naturally ends, existing musicManager ended handling
    // advances into the shuffled Camping pool.
    shuffling: false,

    // Cycle through only the four Camping songs.
    looping: false
  });

  _kcMusicScopeOn = true;
}

function startKidsCampingMusic(
  activityId = selectedCampingActivity
) {
  activateKidsCampingMusicScope();

  const firstTrackId =
    KC_FIRST_TRACK_BY_ACTIVITY[activityId]
    || KC_FIRST_TRACK_BY_ACTIVITY.ant;

  playTrack(
    firstTrackId,
    { fadeMs: 0 }
  );
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
function getCampingActivityConfig(activityId = selectedCampingActivity) {
  return KC_ACTIVITY_CONFIG[activityId] || KC_ACTIVITY_CONFIG.ant;
}

function getKidsAssetUrl(filename) {
  return `${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/${filename}`;
}

function getKidsCampingTotalScore() {
  return Number(appState?.popCount) || 0;
}

function readKidsActivityHighScores() {
  try {
    const raw = localStorage.getItem(KC_ACTIVITY_HIGH_SCORE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    console.warn('[kc] failed to read activity high scores:', err);
    return {};
  }
}

function writeKidsActivityHighScores(scores) {
  try {
    localStorage.setItem(KC_ACTIVITY_HIGH_SCORE_KEY, JSON.stringify(scores || {}));
  } catch (err) {
    console.warn('[kc] failed to write activity high scores:', err);
  }
}

function getKidsActivityHighScore(activityId) {
  const scores = readKidsActivityHighScores();
  const score = Number(scores?.[activityId]) || 0;
  return Math.max(0, score);
}

function getKidsActivityHighScoreText(activityId) {
  const score = getKidsActivityHighScore(activityId);
  return score > 0 ? String(score) : '--';
}

function beginKidsActivityScoreSession(activityId) {
  kcSessionActive = true;
  kcSessionActivityId = KC_ACTIVITY_CONFIG[activityId] ? activityId : 'parking';
  kcSessionScoreBaseline = getKidsCampingTotalScore();

  console.log(
    `🏕️ [KC] Score session started for ${kcSessionActivityId} at baseline ${kcSessionScoreBaseline}.`
  );
}

function getKidsActivitySessionScore() {
  if (!kcSessionActive) return 0;

  const current = getKidsCampingTotalScore();
  return Math.max(0, current - kcSessionScoreBaseline);
}

function finishKidsActivityScoreSession() {
  if (!kcSessionActive || !kcSessionActivityId) return 0;

  const activityId = kcSessionActivityId;
  const sessionScore = getKidsActivitySessionScore();

  if (sessionScore > 0) {
    const scores = readKidsActivityHighScores();
    const previousBest = Number(scores?.[activityId]) || 0;

    if (sessionScore > previousBest) {
      scores[activityId] = sessionScore;
      writeKidsActivityHighScores(scores);
      console.log(`🏕️ [KC] New ${activityId} high score: ${sessionScore}`);
    }
  }

  kcSessionActive = false;
  kcSessionActivityId = null;
  kcSessionScoreBaseline = 0;

  return sessionScore;
}

function applyKidsCampingThemeVars(scopeEl) {
  let accent = '#00ffee';
  let glow = 'rgba(0, 255, 238, 0.55)';
  let faint = 'rgba(0, 255, 238, 0.16)';

  try {
    const themeAccent = getThemeAccent(appState?.settings?.theme);
    accent = themeAccent?.accent || accent;
    glow = themeAccent?.glow || glow;
    faint = themeAccent?.faint || faint;
  } catch (err) {
    console.warn('[kc] theme accent fallback used:', err);
  }

  [document.body, scopeEl].filter(Boolean).forEach((target) => {
    target.style.setProperty('--kc-theme-accent', accent);
    target.style.setProperty('--kc-theme-glow', glow);
    target.style.setProperty('--kc-theme-faint', faint);
  });
}

function renderCampingActivityCards() {
  return Object.values(KC_ACTIVITY_CONFIG).map((activity) => {
    const selected = activity.id === selectedCampingActivity;

    return `
      <button
        type="button"
        class="kc-activity-card ${selected ? 'selected' : ''}"
        data-kc-activity="${activity.id}"
        aria-pressed="${selected ? 'true' : 'false'}"
      >
        <span class="kc-activity-art-wrap">
          <img
            class="kc-activity-art"
            src="${getKidsAssetUrl(activity.img)}"
            alt="${activity.alt}"
            draggable="false"
          />
        </span>
        <span class="kc-activity-title">${activity.title}</span>
        <span class="kc-activity-subtitle">${activity.subtitle}</span>
        <span class="kc-activity-high-score">High Score: ${getKidsActivityHighScoreText(activity.id)}</span>
      </button>
    `;
  }).join('');
}

function setSelectedCampingActivity(activityId) {
  selectedCampingActivity = KC_ACTIVITY_CONFIG[activityId] ? activityId : 'ant';

  document.querySelectorAll('.kc-activity-card').forEach((card) => {
    const selected = card.dataset.kcActivity === selectedCampingActivity;
    card.classList.toggle('selected', selected);
    card.setAttribute('aria-pressed', selected ? 'true' : 'false');
  });
}

async function launchCampingActivity(activityId) {
  if (globalThis.__KC_BOOT_LOCK__) return;

  const activity = getCampingActivityConfig(activityId);

  // Remember the most recently played Camping game.
  setSelectedCampingActivity(activity.id);

  const introEl = document.querySelector('.kc-intro');

  if (!introEl) {
    return;
  }

  globalThis.__KC_BOOT_LOCK__ = true;

  introEl.classList.add('fade-out');

  setTimeout(async () => {
    renderMainUI(activity.id);
    wireMainHandlers();

    await bootGames(activity.id);

    if (activity.id === 'tent') {
      requestAnimationFrame(() => {
        requestAnimationFrame(initGameLine);
      });
    }
  }, 180);
}

function wireCampingActivityCards() {
  document.querySelectorAll('.kc-activity-card').forEach((card) => {
    card.addEventListener('click', () => {
      launchCampingActivity(
        card.dataset.kcActivity
      );
    });
  });

  setSelectedCampingActivity(
    selectedCampingActivity
  );
}

function getCampingActivityZoneMarkup(activityId = selectedCampingActivity) {
  const activity = getCampingActivityConfig(activityId);

  if (activity.id === 'ant') {
    return `<div class="kc-ant-attack-zone kc-full-activity-zone" id="antZone"></div>`;
  }

  if (activity.id === 'tent') {
    return `<div class="kc-tent-zone kc-full-activity-zone"></div>`;
  }

  if (activity.id === 'mosquito') {
    return `
      <div class="kc-mosquito-zone kc-full-activity-zone" id="mosquitoZone">
        <div class="kc-mosquito-prompt">
          <span class="kc-mosquito-big">🦟</span>
          <strong>Tap the tiny sky demon!</strong>
          <small>Swat bugs to grow your Camping Score.</small>
        </div>
      </div>
    `;
  }

  return `<div class="kc-slider-cell kc-full-activity-zone" id="parkingZone"></div>`;
}

async function cleanupActiveCampingActivity() {
  try { cleanupTentLineGame(); } catch {}

  try {
    const container = document.querySelector(SELECTORS.container);
    const antMod = await import('./antAttack.js');
    const antZone = container?.querySelector('#antZone');
    if (antZone && typeof antMod.destroyAntAttackGame === 'function') {
      antMod.destroyAntAttackGame(antZone);
    }
    antMod.forceKillAntAttack?.();
  } catch {}

  try { mosquitoCtrl?.disable?.(); } catch {}
  try { mosquitoCtrl?.cleanup?.(); } catch {}
  mosquitoCtrl = null;
}

async function returnToKidsSetupFromActivity() {
  console.log('🏕️ [KC] Activity Back pressed — returning to Camping setup.');

  finishKidsActivityScoreSession();
  stopKidsCampingMusic();

  try { unwireMainHandlers(); } catch {}
  await cleanupActiveCampingActivity();

  globalThis.__KC_BOOT_LOCK__ = false;
  if (globalThis.__KC_RUNTIME__) {
    globalThis.__KC_RUNTIME__.booting = false;
    globalThis.__KC_RUNTIME__.booted = false;
  }

  renderIntroScreen();
  wireIntroHandlers();
  wireAudioUnlockOnce();
  updatePopUI();
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

  applyKidsCampingThemeVars(container);

  container.innerHTML = `
    <div class="kc-aspect-wrap">
      <div class="kc-game-frame">
        <img id="modeBackground" class="background-fill kc-bg-img"
             src="${import.meta.env.BASE_URL}assets/img/modes/kidsCamping/plate_kidsBG.png"
             alt="Kids Camping Background" />

        <div class="kc-intro kc-setup-screen">
          <div class="kc-setup-stack">
            <header class="kc-setup-header">
              <h1 class="kc-setup-title">Camping Games</h1>
              <p class="kc-setup-subtitle">Pick a game to play!</p>
            </header>

            <div class="kc-setup-directors" aria-hidden="true">
              <img
                id="directorSpriteIntro"
                class="director-img kc-setup-director-img"
                src="${getKidsAssetUrl('directors_intro.png')}"
                alt=""
                draggable="false"
              />
            </div>

            <div class="kc-activity-picker" aria-label="Choose a Camping activity">
              ${renderCampingActivityCards()}
            </div>

          </div>
        </div>

        <div class="kc-bottom-bar kc-setup-bottom-bar">
          <button id="kcBackIntro" class="kc-square-btn kc-left" aria-label="Back to menu">
            <span class="kc-util-arrow" aria-hidden="true">←</span>
            <span class="kc-util-label">Back</span>
          </button>
        </div>
      </div>
    </div>
  `;

  wireCampingActivityCards();
}


function wireIntroHandlers() {
  const back = document.querySelector('#kcBackIntro');
  const mute = document.querySelector('#kcMuteIntro');

  // Activity cards now launch directly.
  HANDLERS.onStartCamping = null;

  HANDLERS.onBackToMenuIntro = () => {
    stopKidsCampingMusic();
    returnToMenu();
  };

  HANDLERS.onMuteClickIntro = () => {
    const nextMuted = !safeCampingMuted();

    toggleMute(nextMuted);
    applyMuteVisual(mute);
  };

  back?.addEventListener(
    'click',
    HANDLERS.onBackToMenuIntro
  );

  mute?.addEventListener(
    'click',
    HANDLERS.onMuteClickIntro
  );

  applyMuteVisual(mute);
}

function unwireIntroHandlers() {
  const back = document.querySelector('#kcBackIntro');
  const mute = document.querySelector('#kcMuteIntro');

  if (back && HANDLERS.onBackToMenuIntro) {
    back.removeEventListener(
      'click',
      HANDLERS.onBackToMenuIntro
    );
  }

  if (mute && HANDLERS.onMuteClickIntro) {
    mute.removeEventListener(
      'click',
      HANDLERS.onMuteClickIntro
    );
  }

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
function renderMainUI(activityId = selectedCampingActivity) {
  const container = document.querySelector(SELECTORS.container);
  if (!container) return;

  const activity = getCampingActivityConfig(activityId);

  startKidsCampingMusic(
    activity.id
  );

  selectedCampingActivity = activity.id;
  applyKidsCampingThemeVars(container);
  beginKidsActivityScoreSession(activity.id);

  container.innerHTML = `
    <div class="kc-aspect-wrap">
      <div class="kc-game-frame">
        <img id="modeBackground" class="background-fill"
             src="${import.meta.env.BASE_URL}assets/img/modes/kidsCamping/plate_kidsBG.png"
             alt="Kids Camping Background" />

        <div class="kc-grid kc-activity-grid" data-kc-activity="${activity.id}">
          <div class="kc-title">
            <img src="${getKidsAssetUrl('rexVider.png')}" class="kc-icon kc-left-title" alt="" />
            <span class="kc-title-text">${activity.title}</span>
            <img src="${getKidsAssetUrl('triceriVider.png')}" class="kc-icon kc-right-title" alt="" />
          </div>

          <section class="kc-activity-stage kc-activity-stage-${activity.id}" aria-label="${activity.title}">
            ${getCampingActivityZoneMarkup(activity.id)}
          </section>
        </div>

        <div class="kc-bottom-bar">
          <button id="kcBack" class="kc-square-btn kc-left" aria-label="Back to Camping setup">
            <span class="kc-util-arrow" aria-hidden="true">←</span>
            <span class="kc-util-label">Back</span>
          </button>

          <div class="kc-dock-score" aria-live="polite">
            <div class="kc-score-label">Camping Score</div>
            <span id="popCount">0</span>
          </div>

          <button id="kcMute" class="kc-square-btn kc-right" aria-label="Mute">🔊</button>
        </div>
      </div>
    </div>
  `;

  document
    .querySelectorAll('.kc-aspect-wrap, .kc-game-frame, .kc-grid')
    .forEach(preventDoubleTapZoom);

  updatePopUI();
}


function onTentsAll() {
  if (_awarded.tentsAll) return;
  _awarded.tentsAll = true;
  requestAnimationFrame(() => setTimeout(() => awardBadge('kids_tents_all'), 0));
}


// and in unwireMainHandlers() (or stopKidsMode) remove if you didn’t use { once: true }:
// container?.removeEventListener('kc:tents-all', onTentsAll);


function wireMainHandlers() {
  // 🔙 Back button – return to Camping setup, not the main menu
  const backBtn = document.getElementById('kcBack');
  if (backBtn) {
    HANDLERS.onBackFromMain = () => {
      returnToKidsSetupFromActivity();
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
async function bootGames(activityId = selectedCampingActivity) {
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

    const activity = getCampingActivityConfig(activityId);

    // 1) Tent Line
    if (activity.id === 'tent') {
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
    }

    // 2) Parking
    if (activity.id === 'parking') {
      const parkingZone = document.getElementById('parkingZone');
      if (parkingZone) {
        initParkingGame(parkingZone);
      }
    }

    // 3) Ant Attack
    if (activity.id === 'ant') {
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
    }

    // 4) Mosquito — selected activity only
    if (activity.id === 'mosquito') {
      const host = document.querySelector(SELECTORS.container);
      if (host) {
        try { mosquitoCtrl?.disable?.(); } catch {}
        try { mosquitoCtrl?.cleanup?.(); } catch {}

        mosquitoCtrl = initMosquitoGame({
          zoneEl: host,
          spawnDelayMs: 900,
          respawnDelayMs: 1400,
          baseSpeed: 92,
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
  const current = kcSessionActive ? getKidsActivitySessionScore() : getKidsCampingTotalScore();

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
  playModeReturnTransition(async () => {
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
