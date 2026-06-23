// /src/modes/infinity/infinityMode.js

import './infinityMode.css';
import { swapModeBackground, applyBackgroundTheme } from '../../managers/backgroundManager.js';
import { playModeReturnTransition } from '../../managers/transitionManager.js';
import { appState } from '../../data/appState.js';
import { startTripletLoop, stopTripletLoop, startTripletSequence } from './tripletAnimator.js';
import { stopTrack, toggleMute, isMuted } from '../../managers/musicManager.js';
import { activateInputHandler } from '../../managers/inputManager.js';
import { launchConfetti } from '../../utils/confetti.js';
import { runInAction } from 'mobx';
import { playInfinityLoop } from '../../managers/musicManager.js';
import { awardBadge } from '../../managers/badgeManager.js';
import { Howl, Howler } from 'howler';
import { hapticSuccess, hapticError, hapticSoftPulse } from '../../utils/haptics.js';
import { getThemeAccent } from '../../data/themeAccentLaw.js';
import { initLakeVision, resetLakeVision, advanceLakeVision, collapseLakeVision } from './infinityVision.js';









// 🧷 Run commit guard (prevents double-paying XP/time if player hits Results then exits)
let didCommitThisRun = false;

// 🧼 Store exact handler refs so removeEventListener actually works
let onEndGameClick = null;
let onBackToMenuClick = null;
let onMuteClick = null;

// Answer button handlers: Map<buttonEl, fn>
let answerBtnHandlerMap = new Map();

// Mode button handlers: Map<buttonEl, fn>
let modeBtnHandlerMap = new Map();

// Popup handlers (if your popup exists each run)
let onPlayAgainClick = null;
let onPopupBackClick = null;

// Intro handlers
let onIntroBackClick = null;
let onIntroStartClick = null;



let answerBtns = [];
let score = 0;
let currentCorrect = null;
let problemEl = null;
let scoreDisplay = null;
let resultMsg = null;
let streak = 0;
let maxStreak = 0;
let addsubToggle = true;
let multdivToggle = true;
let startTime = 0;
let streakFlipFlop = true; // Alternates SFX: true = milestone, false = points100
const sfxIntervals = [3]; // Lake Vision v1.1: fire every 3 correct answers.
let patternIndex = 0;
let nextTrigger = sfxIntervals[0];
// state near the other lets
let solvedCount = 0;     // how many problems the player solved this run
let currentMode = 'addsub'; // you use this but never declared it

// 🧮 NEW: mistake tracking so we can teach something
let wrongCount = 0;
const modeMisses = {
  addsub: 0,
  multdiv: 0,
  alg: 0,
};

// 🌟 NEW: per-run Infinity milestone flags (25 / 50 / 100 / 250)
let hit25ThisRun  = false;
let hit50ThisRun  = false;
let hit100ThisRun = false;
let hit250ThisRun = false;


// last problem we *served*
let lastProblemMeta = null;

// last problem we *missed*, by mode (so we can pick the hardest lane)
const lastMissByMode = {
  addsub: null,
  multdiv: null,
  alg: null,
};

// ⬇️ replace the old checkInfinityBadges() with this
// ⬇️ now: run-local milestone haptics only (no badge awards here)
// ⬇️ replace the old checkInfinityBadgesByScore() with this
// now: run-local milestone haptics + REAL badge awards (so GC can mirror immediately)
function checkInfinityBadgesByScore() {
  const seconds = Math.floor((Date.now() - startTime) / 1000);

  let hitSomething = false;

  // helper: award once, persist immediately (important on iOS if user bounces out fast)
  const awardOnce = (badgeId) => {
    try {
      // silent:true so we don't double-buzz (we do hapticSoftPulse below)
      const isNew = awardBadge(badgeId, { silent: true });

      // Force persistence immediately so Back→Menu can't "lose" it on iOS
      if (isNew) {
        try { appState?.saveToStorage?.(); } catch {}
      }
    } catch (e) {
      console.warn('[Infinity] awardBadge failed:', badgeId, e);
    }
  };

  if (!hit25ThisRun && score >= 25 && seconds <= 60) {
    hit25ThisRun = true;
    hitSomething = true;
    console.log('♾️ Hit 25-point Infinity milestone this run');
    awardOnce('inf_25_1min');
  }

  if (!hit50ThisRun && score >= 50 && seconds <= 120) {
    hit50ThisRun = true;
    hitSomething = true;
    console.log('♾️ Hit 50-point Infinity milestone this run');
    awardOnce('inf_50_2min');
  }

  if (!hit100ThisRun && score >= 100 && seconds <= 240) {
    hit100ThisRun = true;
    hitSomething = true;
    console.log('♾️ Hit 100-point Infinity milestone this run');
    awardOnce('inf_100_4min');
  }

  if (!hit250ThisRun && score >= 250 && seconds <= 600) {
    hit250ThisRun = true;
    hitSomething = true;
    console.log('♾️ Hit 250-point Infinity milestone this run');
    awardOnce('inf_250_10min');
  }

  if (hitSomething) {
    try {
      // 🌊 soft, special reward buzz (mirrors QS behavior)
      hapticSoftPulse();
    } catch (err) {
      console.warn('[Infinity] milestone hapticSoftPulse failed:', err);
    }
  }
}


export function loadInfinityMode() {
  console.log('♾️ Loading Infinity Mode');
  activateInputHandler('infinity');
  document.body.classList.add('il-active');
  appState.setMode('infinity');
  const savedInfinityMode = readInfinityDifficultyMode();
  currentMode = savedInfinityMode;
  appState.setGameMode(savedInfinityMode); // 🌊 Restore last IL lane instead of forcing Easy
  stopTrack(); // 🔇 stop jukebox track cold on entry

  const menuWrapper = document.querySelector('.menu-wrapper');
  const gameContainer = document.getElementById('game-container');

  menuWrapper?.classList.add('hidden');
  gameContainer.classList.remove('hidden');
  gameContainer.style.display = 'flex';

  renderIntroScreen();
  setupIntroDifficultyHandlers();
  document.getElementById('ilBackIntro')?.addEventListener('click', returnToMenu);
  setTimeout(() => {
    startTripletLoop('intro', 'tripletSpriteIntro', 500);
  }, 100);


  // 🎨 Swap IL background (on first load and again later if needed)
  swapModeBackground('assets/img/modes/infinityLake/plate_infinityBG.png');

  // 🌀 Animate intro strobe after #tripletSprite is in DOM
  setTimeout(() => {
    startTripletLoop('intro', 'tripletSpriteIntro', 500);
  }, 50);

  // 🔙 Back to Menu
  document.querySelector('.il-intro .back-to-menu-btn')?.addEventListener('click', returnToMenu);

  // 🎶 Start the Set
  document.querySelector('.il-intro .start-show-btn')?.addEventListener('click', () => {
    setTimeout(() => {
      startTripletLoop('intro', 'tripletSpriteIntro', 500);
    }, 100);
    const introEl = document.querySelector('.il-intro');

    if (introEl) {
      introEl.classList.add('fade-out');

      setTimeout(() => {
        stopTripletLoop(); // 🛑 Kill strobe

        renderUI(); // 🧠 Build game screen
        updateModeButtonUI(); // 👈 this will now highlight the correct button on load
        swapModeBackground('assets/img/modes/infinityLake/plate_infinityBG.png');
        setupEventHandlers();
        startGame();
        playInfinityLoop(); // 🎶🍧💫 kick off the infinite jam session
        

        // Fade in new game grid
        const grid = document.querySelector('.il-grid');
        if (grid) grid.classList.add('fade-in');

        // Start sprite sequence
        startTripletSequence([
          { pose: 'openSet', time: 3000 },
          { pose: 'jam1', time: 6000 },
          { pose: 'jam2', time: 9000 },
          { pose: 'change', time: 3000 },
          { pose: 'other', time: 6000 },
          { pose: 'other2', time: 9000 }
        ], 'tripletSpriteGame');



        // 🛸 Fade-In Candy: micro-delay before glow
        setTimeout(() => {
          document.getElementById('tripletSpriteGame')?.classList.add('fade-in');
        }, 100);
      }, 450); // allow fade-out to finish
    }
  });
}

export function stopInfinityMode() {
  // 🧼 Always clear the body flag so iOS CSS stops applying
  document.body.classList.remove('il-active');

  // ✅ hard reset run state so intro is truly "no run"
  startTime = 0;
  didCommitThisRun = false;

  const container = document.getElementById('game-container');
  container.innerHTML = '';
  container.classList.add('hidden');
  container.style.display = 'none';

  cleanupEventHandlers();
  console.log('♾️ Infinity Mode cleaned up!');
}



function getInfinityPreflightStats() {
  const profile = appState.profile || {};

  const bestScore = Number(profile.infinityHighScore || 0);
  const bestStreak = Number(profile.infinityLongestStreak || 0);

  return {
    bestScore: Number.isFinite(bestScore) ? bestScore : 0,
    bestStreak: Number.isFinite(bestStreak) ? bestStreak : 0,
  };
}

function getInfinityPreflightThemeAccent() {
  const { accent, glow, faint } = getThemeAccent(appState?.settings?.theme);

  return {
    accent,
    glow,
    faint,
  };
}
function applyInfinityPreflightThemeVars(scopeEl) {
  const { accent, glow, faint } = getInfinityPreflightThemeAccent();

  const targets = [
    document.body,
    scopeEl,
  ].filter(Boolean);

  targets.forEach((target) => {
    target.style.setProperty('--il-pref-accent', accent);
    target.style.setProperty('--il-pref-glow', glow);
    target.style.setProperty('--il-pref-faint', faint);
  });
}


const INFINITY_DIFFICULTY_MODES = Object.freeze(['addsub', 'multdiv', 'alg']);
const INFINITY_LAST_DIFFICULTY_FLAG = 'infinityLastMode';
const INFINITY_LAST_DIFFICULTY_STORAGE_KEY = 'scmf.infinity.lastMode';

function normalizeInfinityDifficultyMode(mode, fallback = 'addsub') {
  return INFINITY_DIFFICULTY_MODES.includes(mode) ? mode : fallback;
}

function readInfinityDifficultyMode() {
  let saved = null;

  try {
    if (typeof appState.getFlag === 'function') {
      saved = appState.getFlag(INFINITY_LAST_DIFFICULTY_FLAG, null);
    } else {
      saved = appState.flags?.[INFINITY_LAST_DIFFICULTY_FLAG];
    }
  } catch (err) {
    console.warn('[Infinity] Could not read saved difficulty flag:', err);
  }

  if (!INFINITY_DIFFICULTY_MODES.includes(saved)) {
    try {
      saved = window.localStorage?.getItem(INFINITY_LAST_DIFFICULTY_STORAGE_KEY);
    } catch (err) {
      console.warn('[Infinity] Could not read saved difficulty localStorage:', err);
    }
  }

  if (!INFINITY_DIFFICULTY_MODES.includes(saved)) {
    try {
      saved = appState.getGameMode?.();
    } catch {}
  }

  return normalizeInfinityDifficultyMode(saved || currentMode || 'addsub');
}

function saveInfinityDifficultyMode(mode) {
  const safeMode = normalizeInfinityDifficultyMode(mode);

  currentMode = safeMode;

  try {
    appState.setGameMode(safeMode);
  } catch (err) {
    console.warn('[Infinity] Could not set game mode:', err);
  }

  try {
    if (typeof appState.setFlag === 'function') {
      appState.setFlag(INFINITY_LAST_DIFFICULTY_FLAG, safeMode);
    } else {
      appState.flags = appState.flags || {};
      appState.flags[INFINITY_LAST_DIFFICULTY_FLAG] = safeMode;
    }
  } catch (err) {
    console.warn('[Infinity] Could not save difficulty flag:', err);
  }

  try {
    appState.saveToStorage?.();
  } catch (err) {
    console.warn('[Infinity] Could not persist saved difficulty:', err);
  }

  try {
    window.localStorage?.setItem(INFINITY_LAST_DIFFICULTY_STORAGE_KEY, safeMode);
  } catch (err) {
    console.warn('[Infinity] Could not save difficulty localStorage:', err);
  }

  return safeMode;
}

function setIntroDifficultyMode(mode) {
  const safeMode = saveInfinityDifficultyMode(mode);

  document.querySelectorAll('.il-preflight-diff-btn').forEach((btn) => {
    const selected = btn.dataset.mode === safeMode;
    btn.classList.toggle('selected', selected);
    btn.setAttribute('aria-pressed', selected ? 'true' : 'false');
  });
}


function setupIntroDifficultyHandlers() {
  const buttons = document.querySelectorAll('.il-preflight-diff-btn');

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      setIntroDifficultyMode(btn.dataset.mode);
    });
  });

  setIntroDifficultyMode(readInfinityDifficultyMode());
}

function renderIntroScreen() {
  const container = document.getElementById('game-container');
  const { bestScore, bestStreak } = getInfinityPreflightStats();

  container.innerHTML = `
    <div class="il-aspect-wrap">
      <div class="il-game-frame">
        <img
          class="background-fill"
          src="${import.meta.env.BASE_URL}assets/img/modes/infinityLake/plate_infinityBG.png"
          alt="Infinity Lake Background"
          draggable="false"
        />

        <div class="il-intro il-preflight-scene">
          <div class="il-preflight-vignette" aria-hidden="true"></div>

          <header class="il-preflight-header">
            <h1>Infinity Lake</h1>
            <p>
              Pick the right answer.<br />
              Keep the streak alive.
            </p>
          </header>

          <section class="il-preflight-stage" aria-label="Infinity Triplets">
            <div class="il-preflight-stage-glow" aria-hidden="true"></div>
            <img
              id="tripletSpriteIntro"
              class="triplet-img il-preflight-triplets"
              src="${import.meta.env.BASE_URL}assets/img/characters/infinityLake/il_intro.png"
              alt="The Infinity Triplets"
              draggable="false"
            />
          </section>

          <section class="il-preflight-hud" aria-label="Infinity Lake setup">
            <div class="il-preflight-stats il-preflight-stats-merged">
              <div class="il-preflight-stat-col">
                <span>Best Score</span>
                <strong>${bestScore}</strong>
              </div>

              <div class="il-preflight-stat-divider" aria-hidden="true"></div>

              <div class="il-preflight-stat-col">
                <span>Best Streak</span>
                <strong>${bestStreak}</strong>
              </div>
            </div>

            <div class="il-preflight-flow-label" aria-hidden="true">Choose Difficulty</div>

            <div class="il-preflight-difficulty" aria-label="Choose difficulty">
              <button
                type="button"
                class="il-preflight-diff-btn il-diff-easy selected"
                data-mode="addsub"
                aria-pressed="true"
              >
                <span>EASY</span>
                <strong>+/−</strong>
              </button>

              <button
                type="button"
                class="il-preflight-diff-btn il-diff-medium"
                data-mode="multdiv"
                aria-pressed="false"
              >
                <span>MEDIUM</span>
                <strong>×÷</strong>
              </button>

              <button
                type="button"
                class="il-preflight-diff-btn il-diff-hard"
                data-mode="alg"
                aria-pressed="false"
              >
                <span>HARD</span>
                <strong>𝒙</strong>
              </button>
            </div>
          </section>

          <footer class="il-preflight-footer">
            <button id="startInfinitySet" type="button" class="il-preflight-play start-show-btn">
              Play Game
            </button>
          </footer>

          <div class="il-bottom-bar il-preflight-bottom-bar">
            <button
              id="ilBackIntro"
              type="button"
              class="il-square-btn il-left il-preflight-back-btn"
              aria-label="Back to Main Menu"
            >
              <span class="il-preflight-back-arrow" aria-hidden="true">←</span>
              <span class="il-preflight-back-text">Back</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  applyInfinityPreflightThemeVars(container.querySelector('.il-preflight-scene'));
}


function switchMode(mode) {
  saveInfinityDifficultyMode(mode);
  updateModeButtonUI();
  newProblem();               // ⬅️ was generateNewProblem(); fix the name
}

//removed to keep user playing..: <button id="ilBackBtn" class="back-to-menu-btn">🔙 to Menu</button>
function renderUI() {
  const container = document.getElementById('game-container');
  container.innerHTML = `
    <div class="il-aspect-wrap">
      <div class="il-game-frame">
        <img 
          id="modeBackground" 
          class="background-fill" 
          src="${import.meta.env.BASE_URL}assets/img/modes/infinityLake/plate_infinityBG.png" 
        />
        <div class="il-grid">

          <!-- 🌊 Title -->
          <div class="il-title">Infinity Lake</div>

          <!-- 🎶 Stage Row (Triplets + Score HUD) -->
          <div class="il-stage">
            <img 
              id="tripletSpriteGame" 
              class="il-triplet-img fade-in" 
              src="${import.meta.env.BASE_URL}assets/img/characters/infinityLake/il_openSet.png"
            />

            <div id="lakeVisionStage" class="lake-vision-stage phase-cyan" aria-hidden="true">
              <img class="lake-vision-layer lake-vision-layer-01" data-vision-layer="1" alt="" />
              <img class="lake-vision-layer lake-vision-layer-02" data-vision-layer="2" alt="" />
              <img class="lake-vision-layer lake-vision-layer-03" data-vision-layer="3" alt="" />
              <img class="lake-vision-layer lake-vision-layer-full" data-vision-layer="4" alt="" />
            </div>

            <div class="il-metric-row il-stage-metrics" aria-label="Infinity Lake score and streak">
              <div class="il-score-box">Score: <span id="infScore">0</span></div>
              <div class="il-streak-box">Streak: <span id="infStreak">0</span></div>
            </div>
          </div>

          <!-- 🧠 Math & Answer UI -->
          <div class="il-math">
            <div id="mathProblem">-- + -- = ?</div>
            <div class="answer-options">
              <button class="ans-btn ans-yellow" data-choice="0">?</button>
              <button class="ans-btn ans-blue" data-choice="1">?</button>
              <button class="ans-btn ans-violet" data-choice="2">?</button>
            </div>
            <div id="coneResultMsg" class="result-msg"></div>

          </div>

          <!-- 🎛️ Controls Grid -->
          <div class="il-controls">
            <div class="mode-buttons" aria-label="Choose difficulty while playing">
              <button data-mode="addsub" aria-label="Easy mode, addition and subtraction">
                <span class="il-mode-label">EASY</span>
                <strong>+/−</strong>
              </button>
              <button data-mode="multdiv" aria-label="Medium mode, multiplication and division">
                <span class="il-mode-label">MEDIUM</span>
                <strong>×÷</strong>
              </button>
              <button data-mode="alg" aria-label="Hard mode, algebra">
                <span class="il-mode-label">HARD</span>
                <strong>𝒙</strong>
              </button>
            </div>
            <div class="utility-buttons">
              <button id="backToMenu" aria-label="Main Menu">
                <span class="il-util-arrow" aria-hidden="true">←</span>
                <span class="il-util-label">Menu</span>
              </button>
              <button id="endGame" aria-label="Show Results">
                <span class="il-results-symbol" aria-hidden="true">∞</span>
                <span class="il-results-label">RESULTS</span>
              </button>
              <button id="muteToggle" aria-label="Mute" aria-pressed="false">
                <span class="il-mute-symbol" aria-hidden="true">🔊</span>
                <span class="il-mute-label">MUTE</span>
              </button>
            </div>
          </div>

        </div>

        <!-- 🎉 Result overlay + popup -->
        <div class="il-result-overlay hidden" id="ilResultOverlay">
          <div class="il-result-popup" id="ilResultPopup">
            <h2>🎉 Set Complete!</h2>

            <p><strong>Score:</strong> <span id="ilScoreFinal">0</span></p>
            <p><strong>Streak:</strong> <span id="ilStreakRun">0</span></p>
            <p><strong>High Score:</strong> <span id="ilHighScore">0</span></p>
            <p><strong>Longest Streak:</strong> <span id="ilStreak">0</span></p>

            <!-- 🧠 Teaching tip line -->
            <p class="il-tip-line">
              <strong>Feedback:</strong>
              <span id="ilTipText"></span>
            </p>

            <div class="il-result-buttons">
              <button id="ilPlayAgainBtn" class="start-show-btn">🔁 Play Again</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  applyInfinityPreflightThemeVars(container.querySelector('.il-grid'));

  problemEl = document.getElementById('mathProblem');
  answerBtns = Array.from(document.querySelectorAll('.ans-btn'));
  scoreDisplay = document.getElementById('infScore');
  resultMsg = document.getElementById('coneResultMsg');
  initLakeVision();
  resetLakeVision({ rotateShape: false });
}

function setupEventHandlers() {
  // 🔙 Main Menu
  const backBtn = document.getElementById('backToMenu');
  if (backBtn) {
    if (onBackToMenuClick) backBtn.removeEventListener('click', onBackToMenuClick);
    onBackToMenuClick = returnToMenu;
    backBtn.addEventListener('click', onBackToMenuClick);
  }

  // ♾️ Results
  const endBtn = document.getElementById('endGame');
  if (endBtn) {
    if (onEndGameClick) endBtn.removeEventListener('click', onEndGameClick);
    onEndGameClick = () => {
      console.log('🛑 End Game pressed – finalize run');
      endInfinityGame();
    };
    endBtn.addEventListener('click', onEndGameClick);
  }

  // 🔇 Mute
  const muteBtn = document.getElementById('muteToggle');
  if (muteBtn) {
    if (onMuteClick) muteBtn.removeEventListener('click', onMuteClick);
    onMuteClick = () => {
      toggleMute();
      updateMuteButtonLabel();
      requestAnimationFrame(updateMuteButtonLabel);
      setTimeout(updateMuteButtonLabel, 80);
      flashMuteIcon();
    };
    muteBtn.addEventListener('click', onMuteClick);

    // SCMF 1.3.1e initial mute visual sync
    // Sync visual button state from the real global/native mute state.
    updateMuteButtonLabel();
    requestAnimationFrame(updateMuteButtonLabel);
    setTimeout(updateMuteButtonLabel, 80);
  }

  // ✅ Answer buttons (store handler per button)
  answerBtnHandlerMap = new Map();
  answerBtns = Array.from(document.querySelectorAll('.ans-btn'));

  answerBtns.forEach((btn) => {
    const fn = (e) => handleAnswer(e.currentTarget);
    answerBtnHandlerMap.set(btn, fn);
    btn.addEventListener('click', fn);
  });

  // ✅ Mode buttons (store handler per button)
  modeBtnHandlerMap = new Map();
  document.querySelectorAll('.mode-buttons button').forEach((btn) => {
    const fn = () => {
      const mode = btn.dataset.mode;
      if (!mode) return;
      saveInfinityDifficultyMode(mode);
      updateModeButtonUI();
      newProblem();
      flashModeName();
    };
    modeBtnHandlerMap.set(btn, fn);
    btn.addEventListener('click', fn);
  });

  // Popup buttons (only if present)
  const playAgain = document.getElementById('ilPlayAgainBtn');
  if (playAgain) {
    if (onPlayAgainClick) playAgain.removeEventListener('click', onPlayAgainClick);
    onPlayAgainClick = () => {
      closeResultPopup();
      startGame();
    };
    playAgain.addEventListener('click', onPlayAgainClick);
  }

  const popupBack = document.getElementById('ilBackBtn');
  if (popupBack) {
    if (onPopupBackClick) popupBack.removeEventListener('click', onPopupBackClick);
    onPopupBackClick = () => {
      closeResultPopup();
      returnToMenu();
    };
    popupBack.addEventListener('click', onPopupBackClick);
  }
}



function cleanupEventHandlers() {
  const backBtn = document.getElementById('backToMenu');
  if (backBtn && onBackToMenuClick) {
    backBtn.removeEventListener('click', onBackToMenuClick);
  }

  const endBtn = document.getElementById('endGame');
  if (endBtn && onEndGameClick) {
    endBtn.removeEventListener('click', onEndGameClick);
  }

  const muteBtn = document.getElementById('muteToggle');
  if (muteBtn && onMuteClick) {
    muteBtn.removeEventListener('click', onMuteClick);
  }

  // Answer buttons
  if (answerBtnHandlerMap && answerBtnHandlerMap.size) {
    for (const [btn, fn] of answerBtnHandlerMap.entries()) {
      try { btn.removeEventListener('click', fn); } catch {}
    }
  }
  answerBtnHandlerMap = new Map();

  // Mode buttons
  if (modeBtnHandlerMap && modeBtnHandlerMap.size) {
    for (const [btn, fn] of modeBtnHandlerMap.entries()) {
      try { btn.removeEventListener('click', fn); } catch {}
    }
  }
  modeBtnHandlerMap = new Map();

  // Popup buttons
  const playAgain = document.getElementById('ilPlayAgainBtn');
  if (playAgain && onPlayAgainClick) {
    playAgain.removeEventListener('click', onPlayAgainClick);
  }

  const popupBack = document.getElementById('ilBackBtn');
  if (popupBack && onPopupBackClick) {
    popupBack.removeEventListener('click', onPopupBackClick);
  }

  onEndGameClick = null;
  onBackToMenuClick = null;
  onMuteClick = null;
  onPlayAgainClick = null;
  onPopupBackClick = null;
}



function returnToMenu() {
  // ✅ Commit run even if player leaves early (no popup)
  commitInfinityRun({ reason: 'exit_menu', showPopup: false });

  console.log('🌌 [Infinity] Back-to-menu using playModeReturnTransition');

  stopTrack(); // 💥 nukes the Howl
  playModeReturnTransition(() => {
    console.log('🌌 [Infinity] return transition callback: restoring menu');
    stopInfinityMode();
    document.querySelector('.menu-wrapper')?.classList.remove('hidden');
    applyBackgroundTheme();
  });
}



function startGame() {
  // ♾️ Lake Vision v1 resets with each fresh run.
  patternIndex = 0;
  nextTrigger = sfxIntervals[0];
  resetLakeVision({ rotateShape: false });

  // re-arm keyboard for a fresh set
  activateInputHandler('infinity');

  // ✅ re-arm commit + start time immediately (safer)
  didCommitThisRun = false;
  startTime = Date.now();

  score = 0;
  streak = 0;
  maxStreak = 0;
  solvedCount = 0;
  streakFlipFlop = true;
  patternIndex = 0;
  nextTrigger = sfxIntervals[0];

  wrongCount = 0;
  modeMisses.addsub = 0;
  modeMisses.multdiv = 0;
  modeMisses.alg = 0;
  lastProblemMeta = null;
  lastMissByMode.addsub = null;
  lastMissByMode.multdiv = null;
  lastMissByMode.alg = null;

  hit25ThisRun  = false;
  hit50ThisRun  = false;
  hit100ThisRun = false;
  hit250ThisRun = false;

  updateScore();
  updateStreak();
  newProblem();
}

function updateStreak() {
  const el = document.getElementById('infStreak');
  if (el) el.textContent = streak;
}

function compute(a, b, op) {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '×': return a * b;
    case '÷': return Math.floor(a / b); // simple clean divide
  }
}


function newProblem() {
  const mode = appState.getGameMode();
  let a = Math.floor(Math.random() * 20) + 1;
  let b = Math.floor(Math.random() * 20) + 1;
  let correctAnswer;
  let question;
  let op = null; // 🧮 track what kind of problem this is

  switch (mode) {
    case 'addsub': {
      const head = `<span class="il-problem-head il-problem-head-easy">ADD & SUB</span>`;
      if (addsubToggle) {
        op = '+';
        correctAnswer = a + b;
        question = `${head}<span class="il-problem-break" aria-hidden="true"></span>${a} + ${b} = ?`;
      } else {
        op = '−';
        correctAnswer = a - b;
        question = `${head}<span class="il-problem-break" aria-hidden="true"></span>${a} − ${b} = ?`;
      }
      addsubToggle = !addsubToggle;
      break;
    }

    case 'multdiv': {
      const head = `<span class="il-problem-head il-problem-head-medium">MULT & DIV</span>`;
      if (multdivToggle) {
        op = '×';
        correctAnswer = a * b;
        question = `${head}<span class="il-problem-break" aria-hidden="true"></span>${a} × ${b} = ?`;
      } else {
        // clean division
        op = '÷';
        b = Math.floor(Math.random() * 9) + 1;                // 1–9
        correctAnswer = Math.floor(Math.random() * 10) + 1;   // 1–10
        a = b * correctAnswer;
        question = `${head}<span class="il-problem-break" aria-hidden="true"></span>${a} ÷ ${b} = ?`;
      }
      multdivToggle = !multdivToggle;
      break;
    }

    case 'alg': {
      const head = `<span class="il-problem-head il-problem-head-hard">ALGEBRA</span>`;
      // 🔧 use the SAME glyphs we check for later
      const ops = ['+', '−', '×', '÷'];
      op = ops[Math.floor(Math.random() * ops.length)];
      let result;

      correctAnswer = a; // default

      if (op === '+') {
        // 𝒙 + b = result  (x is a)
        result = a + b;
        correctAnswer = a;
        question = `${head}<span class="il-problem-break" aria-hidden="true"></span>𝒙 + ${b} = ${result}`;
      } else if (op === '−') {
        // 𝒙 − b = result (x is a)
        result = a - b;
        correctAnswer = a;
        question = `${head}<span class="il-problem-break" aria-hidden="true"></span>𝒙 − ${b} = ${result}`;
      } else if (op === '×') {
        // 𝒙 × b = result (x is a)
        result = a * b;
        correctAnswer = a;
        question = `${head}<span class="il-problem-break" aria-hidden="true"></span>𝒙 × ${b} = ${result}`;
      } else if (op === '÷') {
        // a ÷ 𝒙 = b, where a = b * x
        correctAnswer = Math.floor(Math.random() * 10) + 1; // 1–10
        b = Math.floor(Math.random() * 9) + 1;              // 1–9
        a = b * correctAnswer;
        question = `${head}<span class="il-problem-break" aria-hidden="true"></span>${a} ÷ 𝒙 = ${b}`;
      }

      break;
    }
  }

  currentCorrect = correctAnswer;

  // 📝 remember this problem so we can talk about it later
  lastProblemMeta = {
    mode,
    op,
    a,
    b,
    correct: correctAnswer,
  };

  // 🎲 Generate 2 fake options that aren’t the correct answer
  let options = [correctAnswer];
  let tries = 0;
  while (options.length < 3) {
    const fake = correctAnswer + Math.floor(Math.random() * 11) - 5;
    if (!options.includes(fake) && fake >= 0) {
      options.push(fake);
    } else {
      options.push(Math.floor(Math.random() * 50)); // 💥 backup junk answer
    }
    if (++tries > 10) break;
  }

  options = options.slice(0, 3);
  options.sort(() => Math.random() - 0.5);

  // ✍️ Inject into DOM
  problemEl.innerHTML = question;
  answerBtns.forEach((btn, i) => {
    btn.textContent = options[i];
    btn.dataset.value = options[i];
  });
}

function handleAnswer(btn) {
  const guess = Number(btn.dataset.value);
  if (guess === currentCorrect) {
    handleCorrect();
  } else {
    handleIncorrect(guess);
  }
}

function handleCorrect() {
  const mode = appState.getGameMode();
  let points = 0;
  let xp = 0;

  switch (mode) {
    case 'addsub':
      points = 1;
      xp = 3;
      break;
    case 'multdiv':
      points = 3;
      xp = 4;
      break;
    case 'alg':
      points = 4;
      xp = 5;
      break;
    default:
      points = 1;
      xp = 1;
  }

  score += points;
  streak++;
  solvedCount++;

  checkInfinityBadgesByScore();

  console.log(`🌈 Streak now at: ${streak}`);
  if (streak === nextTrigger) {
    console.log('💥 Triggering SFX burst!');
    playStreakBurst();
    advanceLakeVision(streak);
    patternIndex = (patternIndex + 1) % sfxIntervals.length;
    nextTrigger += sfxIntervals[patternIndex];
  }

  if (streak > maxStreak) maxStreak = streak;

  appState.addXP(xp);
  updateScore();
  updateStreak();
  showResult(`✅ +${points} pt, +${xp} XP`, '#00ffee');
  newProblem();
}


async function playLakeVisionCrashSound() {
  try {
    const sfx = await import('../../managers/sfxManager.js');
    const play = sfx.playSfx || sfx.playSFX || sfx.playSoundEffect;

    if (typeof play !== 'function') return;

    // Try common wrong-answer ids without making this patch depend on one exact name.
    // If none exist, sfxManager should safely warn/fallback and the vision still works.
    for (const id of ['wrong', 'incorrect', 'qs_wrong', 'quickserve_wrong', 'error']) {
      try {
        const result = play(id);
        if (result && typeof result.then === 'function') await result;
        return;
      } catch (err) {
        // Try the next likely id.
      }
    }
  } catch (err) {
    console.warn('[Infinity] Lake Vision crash sound unavailable:', err);
  }
}

function handleIncorrect(guess) {
  const mode = appState.getGameMode();

  // 🧮 Track mistakes for end-of-set coaching
  wrongCount += 1;
  if (mode && Object.prototype.hasOwnProperty.call(modeMisses, mode)) {
    modeMisses[mode] += 1;

    // remember the last missed problem for this mode
    lastMissByMode[mode] = {
      ...(lastProblemMeta || {}),
      guess,
    };
  }

  streak = 0;
  patternIndex = 0;
  nextTrigger = sfxIntervals[0];

  updateStreak();
  showResult('❌ Nope. Try again!', '#ff5555');
  collapseLakeVision();
  playLakeVisionCrashSound();

  // 📳 Wrong-answer haptic
  try {
    hapticError();
  } catch (err) {
    console.warn('[Infinity] hapticError failed:', err);
  }
}

function updateScore() {
  scoreDisplay.textContent = score;
}

function showResult(msg, color) {
  resultMsg.textContent = msg;
  resultMsg.style.color = color;
  setTimeout(() => resultMsg.textContent = '', 1500);
}

/*popup*/
function showResultPopup({ score, highScore, streak, longest, time }) {
  const overlay = document.getElementById('ilResultOverlay');
  const popup   = document.getElementById('ilResultPopup');
  if (!overlay || !popup) return;

  // 🌊 This run
  const scoreEl     = document.getElementById('ilScoreFinal');
  const streakRunEl = document.getElementById('ilStreakRun');

  if (scoreEl)     scoreEl.textContent     = score;
  if (streakRunEl) streakRunEl.textContent = streak;

  // 🏅 Lifetime records
  const highScoreEl   = document.getElementById('ilHighScore');
  const longestEl     = document.getElementById('ilStreak');

  if (highScoreEl) highScoreEl.textContent = highScore;
  if (longestEl)   longestEl.textContent   = longest;

  // (time is still available if you ever want to log/use it,
  // but we don't show it in the popup anymore)

  // 🧠 Teaching tip
  const tipEl = document.getElementById('ilTipText');
  if (tipEl) {
    tipEl.textContent = buildInfinityTip();
  }

  // 🔒 freeze hotkeys while modal is up
  activateInputHandler(null);

  // 📺 Show overlay
  overlay.classList.remove('hidden');

  // 📳 Soft “set complete” buzz
  try {
    hapticSuccess();
  } catch (e) {
    console.warn('[Infinity] hapticSuccess failed:', e);
  }
}

function closeResultPopup() {
  const overlay = document.getElementById('ilResultOverlay');
  if (overlay) overlay.classList.add('hidden');
}


function getCurrentModeName() {
  const mode = appState.getGameMode();
  switch (mode) {
    case 'addsub': return 'Addition/Subtraction Mode';
    case 'multdiv': return 'Multiply/Divide Mode';
    case 'alg': return 'Algebra Mode';
    default: return 'Infinity Mode';
  }
}

function formatElapsedTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function buildMiniLesson(meta) {
  if (!meta || !meta.mode) return '';

  const { mode, op, a, b, correct, guess } = meta;
  const guessNote =
    typeof guess === 'number' && guess !== correct
      ? ` You picked ${guess}, but the correct answer is ${correct}.`
      : '';

  // 🧠 Algebra gets the richest coaching
  if (mode === 'alg') {
    if (op === '+') {
      const result = correct + b;
      return `I noticed this one gave you trouble: 𝒙 + ${b} = ${result}.${guessNote} Next time, subtract ${b} from ${result}: ${result} − ${b} = ${correct}, so 𝒙 = ${correct}.`;
    }
    if (op === '−') {
      const result = correct - b;
      return `I noticed this one gave you trouble: 𝒙 − ${b} = ${result}.${guessNote} Next time, add ${b} to ${result}: ${result} + ${b} = ${correct}, so 𝒙 = ${correct}.`;
    }
    if (op === '×') {
      const result = correct * b;
      return `I noticed this one gave you trouble: 𝒙 × ${b} = ${result}.${guessNote} Next time, divide both sides by ${b}: ${result} ÷ ${b} = ${correct}, so 𝒙 = ${correct}.`;
    }
    if (op === '÷') {
      // a ÷ 𝒙 = b  where a = b * correct
      return `I noticed this one gave you trouble: ${a} ÷ 𝒙 = ${b}.${guessNote} Next time, think “what number times ${b} gives ${a}?” That’s ${correct}, so 𝒙 = ${correct}.`;
    }
  }

  // ✏️ Mult / Div – better strategies
  if (mode === 'multdiv') {
    if (op === '×') {
      const big   = Math.max(a, b);
      const small = Math.min(a, b);

      // If one factor is multi-digit, split THAT one into tens + ones
      if (big >= 10) {
        const tens  = Math.floor(big / 10) * 10;  // e.g. 14 → 10
        const ones  = big - tens;                 // e.g. 14 → 4
        const part1 = small * tens;
        const part2 = small * ones;

        if (ones > 0) {
          // 14 × 6 → 10×6 + 4×6
          return `Questions like ${a} × ${b} = ? were the trickiest.${guessNote} Try breaking ${big} into ${tens} and ${ones}: ${small}×${tens} = ${part1} and ${small}×${ones} = ${part2}, then add them: ${part1} + ${part2} = ${correct}.`;
        }

        // Clean tens like 20, 30, etc.
        return `Questions like ${a} × ${b} = ? were the trickiest.${guessNote} Here ${big} is already a tens number, so you can think “${big} is how many tens of ${small}?” — ${small}×${big} = ${correct}.`;
      }

      // Both factors are 1-digit → simple groups-of story
      return `Questions like ${a} × ${b} = ? were the trickiest.${guessNote} Try seeing it as ${small} groups of ${big}. Picture ${big} once, then twice, then ${small} times in total — all stacked together to make ${correct}.`;
    }

    if (op === '÷') {
      return `Questions like ${a} ÷ ${b} = ? tripped you up.${guessNote} Try asking “${b} times what equals ${a}?” — that missing factor is your answer.`;
    }
  }

  // ➕➖ Add / Sub – simple nudge
  if (mode === 'addsub') {
    if (op === '+') {
      return `A few ${a} + ${b} = ? problems were off.${guessNote} Next time, stack the numbers in your head and add the ones place first, then tens.`;
    }
    if (op === '−') {
      return `A few ${a} − ${b} = ? problems were off.${guessNote} Try slowing down just enough to check if you need to borrow before you answer.`;
    }
  }

  return '';
}

function buildInfinityTip() {
  // 🍼 No questions answered at all
  if (solvedCount === 0 && score === 0) {
    return 'Try answering a few warm-up questions first. Your first streak is always the hardest — then the flow kicks in.';
  }

  const hasMisses = wrongCount > 0;

  // 🌟 Perfect set
  if (!hasMisses && score > 0) {
    return 'Perfect set! No misses this time. Try nudging the difficulty by switching modes or chasing an even longer streak.';
  }

  // 🧊 Opening vibe depending on how many went wrong
  let opening;
  if (wrongCount <= 3) {
    opening = 'Good job this set — just a few bumps along the way.';
  } else if (wrongCount <= 8) {
    opening = 'You’re getting the Infinity rhythm. This run had some rough spots, but that’s exactly how your brain levels up.';
  } else {
    opening = 'This one was more of a practice set, which is perfect — the clean runs always come after a few messy ones.';
  }

  // 🎯 Pick the hardest lane you struggled in: alg → multdiv → addsub
  let focusMode = null;
  if (modeMisses.alg > 0) {
    focusMode = 'alg';
  } else if (modeMisses.multdiv > 0) {
    focusMode = 'multdiv';
  } else if (modeMisses.addsub > 0) {
    focusMode = 'addsub';
  }

  const meta = focusMode ? lastMissByMode[focusMode] : null;
  const lesson = buildMiniLesson(meta);

  if (!lesson) {
    // fallback to your old “generic coaching” if somehow we have no meta
    return `${opening} Most misses were in ${focusMode || 'your current mode'}. Try watching the operation label before you tap.`;
  }

  // inside buildInfinityTip()

  return `${opening} ${lesson}\n\nWant another go? Hit “Play Again” and try to beat this set.`;

}


function flashModeName() {
  const el = document.createElement('div');
  el.className = 'mode-flash';
  el.textContent = getCurrentModeName(); // Like "Algebra Mode"
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}
function flashMuteIcon() {
  // just flash the mute button itself
  const icon = document.getElementById('muteToggle');
  if (!icon) return;
  icon.classList.add('flash');
  setTimeout(() => icon.classList.remove('flash'), 400);
}

export function updateMuteButtonLabel() {
  const icon = document.getElementById('muteToggle');
  const muted = isMuted();

  if (icon) {
    icon.innerHTML = `
      <span class="il-mute-symbol" aria-hidden="true">${muted ? '🔇' : '🔊'}</span>
      <span class="il-mute-label">${muted ? 'UNMUTE' : 'MUTE'}</span>
    `;
    icon.classList.toggle('muted', muted);
    icon.setAttribute('aria-pressed', String(muted));
    icon.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
  }
}



function updateModeButtonUI() {
  const mode = appState.getGameMode();
  const map = {
    addsub: 0,
    multdiv: 1,
    alg: 2
  };

  const buttons = document.querySelectorAll('.mode-buttons button');
  buttons.forEach((btn, i) => {
    if (i === map[mode]) {
      btn.classList.add('active-mode');
    } else {
      btn.classList.remove('active-mode');
    }
  });
}

function commitInfinityRun({ reason = 'unknown', showPopup = false } = {}) {
  // If we never started a set (still on intro), do nothing.
  if (!startTime || startTime <= 0) {
    return;
  }

  // Prevent double-commit if user triggers multiple exit paths
  if (didCommitThisRun) {
    return;
  }
  didCommitThisRun = true;

  const endTime = Date.now();
  const elapsedMs = Math.max(0, endTime - startTime);
  const seconds = Math.floor(elapsedMs / 1000);

  // 1) Score-based badge checks (the “live” path w/ your run flags + haptic pulse)
  try {
    checkInfinityBadgesByScore();
  } catch (e) {
    console.warn('[Infinity] checkInfinityBadgesByScore failed during commit:', e);
  }

  // 2) Update record stats (high score + longest streak) even if player exits early
  const prevHigh = appState.profile.infinityHighScore || 0;
  const prevLongest = appState.profile.infinityLongestStreak || 0;

  const isNewHighScore = score > prevHigh;
  const isNewStreak = maxStreak > prevLongest;

  try {
    runInAction(() => {
      if (isNewHighScore) appState.profile.infinityHighScore = score;
      if (isNewStreak) appState.profile.infinityLongestStreak = maxStreak;
    });
  } catch (e) {
    console.warn('[Infinity] failed to commit profile records:', e);
  }

  // 3) Meta progression: Infinity XP + Time + mirror badge gates
  try {
    finalizeInfinityRun({ score, seconds });
  } catch (e) {
    console.warn('[Infinity] finalizeInfinityRun failed during commit:', e);
  }

  // 4) Force persistence immediately (important on iOS if user bounces / app suspends)
  try {
    appState?.saveToStorage?.();
  } catch (e) {
    console.warn('[Infinity] saveToStorage failed during commit:', e);
  }

  // 5) Optional popup celebration (Results button path)
  if (showPopup) {
    try {
      const timeLabel = typeof formatElapsedTime === 'function'
        ? formatElapsedTime(elapsedMs)
        : `${seconds}s`;

      const runStreak = maxStreak;
      const lifetimeStreak = appState.profile.infinityLongestStreak || 0;

      showResultPopup({
        score,
        streak: runStreak,
        highScore: appState.profile.infinityHighScore || 0,
        longest: lifetimeStreak,
        time: timeLabel
      });

      // Confetti only when breaking records (matches your current behavior)
      if (isNewHighScore || isNewStreak) {
        launchConfetti();
      }
    } catch (e) {
      console.warn('[Infinity] showPopup failed during commit:', e);
    }
  }

  console.log(`♾️ commitInfinityRun ok | reason=${reason} | score=${score} | seconds=${seconds}`);
}


function endInfinityGame() {
  console.log('♾️ Ending Infinity Mode...');

  // ✅ Single pipe: commits score/streak/xp/time + awards + (optional) popup
  commitInfinityRun({ reason: 'end_button', showPopup: true });
}


function playStreakBurst() {
  // 🔇 Respect global mute via Howler
  try {
    if (isMuted()) {
      return;
    }
  } catch {
    // if Howler isn't ready for some reason, just fail silently
  }

  const file = streakFlipFlop ? 'honk1.mp3' : 'honk2.mp3';

  try {
    const sfx = new Howl({
      src: [`${import.meta.env.BASE_URL}assets/audio/SFX/${file}`],
      volume: 0.4, // softer, still punchy for streak hype
    });

    sfx.play();
    streakFlipFlop = !streakFlipFlop;
  } catch (err) {
    console.warn('[Infinity] streak SFX failed:', err);
  }
}



export {
  switchMode,
  endInfinityGame,
  flashModeName,
  newProblem,
  updateModeButtonUI // 👈 add this line bro
};


export function finalizeInfinityRun(stats) {
  const seconds = Math.max(0, Number(stats.seconds) || 0);

  // 600s → 1000 XP  => XP = seconds * (1000/600) = seconds * 5/3
  const xp = Math.round((seconds * 5) / 3);

  appState.addInfinityXP(xp);
  appState.addInfinityTime(seconds);

  // ⬇️ score-based mirror (keeps identical time gates & numeric thresholds)
  const sc = Math.max(0, Number(stats.score) || 0);

  if (sc >= 25  && seconds <= 60) {
    awardBadge('inf_25_1min', { silent: true });
  }
  if (sc >= 50  && seconds <= 120) {
    awardBadge('inf_50_2min', { silent: true });
  }
  if (sc >= 100 && seconds <= 240) {
    awardBadge('inf_100_4min', { silent: true });
  }
  if (sc >= 250 && seconds <= 600) {
    awardBadge('inf_250_10min', { silent: true });
  }

  // 🌀 Legendary Cone: Infinity Flow (100-streak lifetime)
  try {
    const longest = Number(appState.profile?.infinityLongestStreak ?? 0);
    if (longest >= 100) {
      awardBadge('leg_infinity_flow');
    }
  } catch (e) {
    console.warn('[infinity] failed to award leg_infinity_flow', e);
  }
}