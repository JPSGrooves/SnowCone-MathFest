// 🍧 quickServe.js — Cosmic Scene Loader 🚛🔥
// quickServe.js
import './quickServe.css';
import { swapModeBackground, applyBackgroundTheme } from '../../managers/backgroundManager.js';
import { playModeReturnTransition } from '../../managers/transitionManager.js';
import { appState } from '../../data/appState.js';
import { getThemeAccent } from '../../data/themeAccentLaw.js';

// ✅ Use only musicManager (no separate QS Howl player anymore)
import {
  stopTrack,
  pushMusicScope,
  popMusicScope,
  playRandomTrack,
  setMusicPool,
  setShuffle,
  setLoop,
  isPlaying,
  isMuted
} from '../../managers/musicManager.js';

import * as phil from './quickServePhil.js';
import * as gridFX from './quickServeGridFX.js';
import { setupKeypad, generateKeypadHTML } from './quickServeKeypad.js';
import {
  startGameLogic,
  stopGameLogic,
  resetCurrentAnswer,
  setMathMode
} from './quickServeGame.js';

import { activateInputHandler } from '../../managers/inputManager.js';
import { hapticSuccess } from '../../utils/haptics.js';


// ❌ no need to import awardBadge or finalizeQuickServeRun here
// import { awardBadge } from '../../managers/badgeManager.js';
// import { finalizeQuickServeRun } from './quickServeBadges.js';

const QS_TRACK_IDS = ['quikserve', 'kktribute', 'softdown'];
let _qsMusicScopeOn = false;
let qsIntroStartInFlight = false;
let qsPreflightDifficulty = 'easy';
let qsSelectedCharacterId = 'cosmicPhil';

const QS_ACT_ART_BASE =
  `${import.meta.env.BASE_URL}assets/img/characters/quickServe/acts/`;

function qsActImage(actSlug, frameName) {
  return `${QS_ACT_ART_BASE}${actSlug}_${frameName}.png`;
}

function qsActFrames(actSlug) {
  return {
    idle: qsActImage(actSlug, 'idle_white'),
    buildYellow1: qsActImage(actSlug, 'build_yellow_01'),
    buildYellow2: qsActImage(actSlug, 'build_yellow_02'),
    buildGreen1: qsActImage(actSlug, 'build_green_01'),
    buildGreen2: qsActImage(actSlug, 'build_green_02'),
    buildGreen3: qsActImage(actSlug, 'build_green_03'),
    correct: qsActImage(actSlug, 'correct_blue'),
    incorrect: qsActImage(actSlug, 'incorrect_magenta'),
  };
}

const QS_LOCKED_CHARACTER_PLACEHOLDER_SRC =
  `${import.meta.env.BASE_URL}assets/img/icons/cone_locked.png`;

const QS_CHARACTER_ROSTER = [
  {
    id: 'cosmicPhil',
    name: 'Cosmic Phil',
    shortName: 'Phil',
    displayNameLines: ['Cosmic', 'Phil'],
    unlockLabel: 'Default',
    unlockScore: 0,
    boostLabel: 'Boost: None',
    boostKind: 'none',
    scoreBonus: 0,
    introSrc: qsActImage('cosmic_phil', 'card'),
    frames: qsActFrames('cosmic_phil'),
    artClass: 'cosmic-phil',
  },
  {
    id: 'koolKat',
    name: 'Kool Kat',
    shortName: 'Kat',
    displayNameLines: ['Kool', 'Kat'],
    unlockLabel: '100',
    unlockScore: 100,
    boostLabel: 'Boost: +1 per solve',
    boostKind: 'plusOne',
    scoreBonus: 1,
    introSrc: qsActImage('kool_kat', 'card'),
    frames: qsActFrames('kool_kat'),
    artClass: 'kool-kat',
  },
  {
    id: 'drKennyFields',
    name: 'Kenny Fields',
    shortName: 'Kenny',
    displayNameLines: ['Kenny', 'Fields'],
    unlockLabel: '200',
    unlockScore: 200,
    boostLabel: 'Boost: +2 per solve',
    boostKind: 'plusTwo',
    scoreBonus: 2,
    introSrc: qsActImage('dr_kenny_fields', 'card'),
    frames: qsActFrames('dr_kenny_fields'),
    artClass: 'dr-kenny-fields',
  },
  {
    id: 'dinoKid',
    name: 'Dino Kid',
    shortName: 'Dino',
    displayNameLines: ['Dino', 'Kid'],
    unlockLabel: '400',
    unlockScore: 400,
    boostLabel: 'Boost: +5 per solve',
    boostKind: 'plusFive',
    scoreBonus: 5,
    introSrc: qsActImage('dino_kid', 'card'),
    frames: qsActFrames('dino_kid'),
    artClass: 'dino-kid',
  },
  {
    id: 'grampyP',
    name: 'Grampy P',
    shortName: 'Grampy',
    displayNameLines: ['Grampy', 'P'],
    unlockLabel: '800',
    unlockScore: 800,
    boostLabel: 'Boost: +7 per solve',
    boostKind: 'plusSeven',
    scoreBonus: 7,
    introSrc: qsActImage('grampy_p', 'card'),
    frames: qsActFrames('grampy_p'),
    artClass: 'grampy-p',
  },
];

function isQuickServeCharacterUnlocked(character) {
  if (!character) return false;
  return getQuickServeBestScore() >= Number(character.unlockScore || 0);
}

function getQuickServeUnlockedCharacterCount() {
  return QS_CHARACTER_ROSTER.filter(isQuickServeCharacterUnlocked).length;
}

function getQuickServeSelectedCharacter() {
  const selected =
    QS_CHARACTER_ROSTER.find((character) => character.id === qsSelectedCharacterId)
    || QS_CHARACTER_ROSTER[0];

  if (!isQuickServeCharacterUnlocked(selected)) {
    qsSelectedCharacterId = QS_CHARACTER_ROSTER[0].id;
    return QS_CHARACTER_ROSTER[0];
  }

  return selected;
}

const QS_CHARACTER_SCORE_STORAGE_KEY = 'scmf.qs.characterHighScores.v1';

const QS_CHARACTER_ID_ALIASES = {
  koolKatGirl: 'koolKat',
  doctorSax: 'drKennyFields',
  hoodedDinoDj: 'dinoKid',
  familyBand: 'grampyP',
};

function normalizeQuickServeCharacterId(characterOrId) {
  const rawId =
    typeof characterOrId === 'string'
      ? characterOrId
      : characterOrId?.id;

  if (!rawId) return 'cosmicPhil';

  return QS_CHARACTER_ID_ALIASES[rawId] || rawId;
}

function normalizeQuickServeCharacterScoreMap(rawMap = {}) {
  return Object.entries(rawMap || {}).reduce((acc, [rawId, rawValue]) => {
    const id = normalizeQuickServeCharacterId(rawId);
    const value = Number(rawValue);

    if (!Number.isFinite(value)) return acc;

    acc[id] = Math.max(Number(acc[id] || 0), Math.max(0, Math.floor(value)));
    return acc;
  }, {});
}

function readQuickServeCharacterScoreMap() {
  let localScores = {};

  try {
    localScores = JSON.parse(
      window.localStorage.getItem(QS_CHARACTER_SCORE_STORAGE_KEY) || '{}'
    );
  } catch {
    localScores = {};
  }

  const profileScores = appState?.profile?.qsCharacterHighScores || {};

  return normalizeQuickServeCharacterScoreMap({
    ...localScores,
    ...profileScores,
  });
}

function writeQuickServeCharacterScoreMap(nextScores = {}) {
  const normalized = normalizeQuickServeCharacterScoreMap(nextScores);

  try {
    if (!appState.profile) {
      appState.profile = {};
    }

    appState.profile.qsCharacterHighScores = {
      ...(appState.profile.qsCharacterHighScores || {}),
      ...normalized,
    };
  } catch (err) {
    console.warn('[QuickServe] Could not write character scores to appState profile:', err);
  }

  try {
    window.localStorage.setItem(
      QS_CHARACTER_SCORE_STORAGE_KEY,
      JSON.stringify(normalized)
    );
  } catch (err) {
    console.warn('[QuickServe] Could not write character scores to localStorage:', err);
  }

  return normalized;
}

function getQuickServeCharacterBestScore(characterOrId) {
  const id = normalizeQuickServeCharacterId(characterOrId);
  const scores = readQuickServeCharacterScoreMap();
  const storedScore = Number(scores[id] || 0);

  // Existing QS history belonged to the original default performer.
  // Seed Cosmic Phil visually from the global QS high score until a
  // character-specific score beats it.
  if (id === 'cosmicPhil') {
    return Math.max(storedScore, getQuickServeBestScore());
  }

  return storedScore;
}

export function recordQuickServeSelectedCharacterScore(scoreValue = 0) {
  const selectedCharacter = getQuickServeSelectedCharacter();
  const id = normalizeQuickServeCharacterId(selectedCharacter);
  const score = Math.max(0, Math.floor(Number(scoreValue) || 0));
  const previousBest = getQuickServeCharacterBestScore(id);

  if (score <= previousBest) {
    return {
      characterId: id,
      characterName: selectedCharacter.name,
      previousBest,
      bestScore: previousBest,
      didBeatCharacterHighScore: false,
    };
  }

  const scores = readQuickServeCharacterScoreMap();
  scores[id] = score;
  writeQuickServeCharacterScoreMap(scores);

  return {
    characterId: id,
    characterName: selectedCharacter.name,
    previousBest,
    bestScore: score,
    didBeatCharacterHighScore: true,
  };
}

export function getQuickServeSelectedCharacterScoreBonus() {
  const selectedCharacter = getQuickServeSelectedCharacter();
  return Math.max(0, Number(selectedCharacter?.scoreBonus || 0));
}

export function getQuickServeSelectedCharacterSummary() {
  const selectedCharacter = getQuickServeSelectedCharacter();

  return {
    id: selectedCharacter.id,
    name: selectedCharacter.name,
    shortName: selectedCharacter.shortName,
    scoreBonus: Math.max(0, Number(selectedCharacter.scoreBonus || 0)),
    bestScore: getQuickServeCharacterBestScore(selectedCharacter),
  };
}

function getQuickServeMathModeFromPreflight(mode = qsPreflightDifficulty) {
  const map = {
    easy: 'addSub',
    medium: 'multiDiv',
    hard: 'algebra',
  };

  return map[mode] || 'addSub';
}

function applyQuickServePreflightMathMode() {
  const mathMode = getQuickServeMathModeFromPreflight();
  setMathMode(mathMode);

  console.log(
    `[QuickServe] Starting difficulty wired directly: ${qsPreflightDifficulty} → ${mathMode}`
  );

  return mathMode;
}

function selectQuickServeCharacter(characterId) {
  const character = QS_CHARACTER_ROSTER.find((item) => item.id === characterId);

  if (!character) {
    console.warn(`[QuickServe] Unknown character requested: ${characterId}`);
    return;
  }

  if (!isQuickServeCharacterUnlocked(character)) {
    console.log(
      `[QuickServe] Character locked: ${character.id}; requires score ${character.unlockScore}`
    );

    document
      .querySelector(`[data-qs-character-slot="${character.id}"]`)
      ?.classList.add('qs-locked-bump');

    window.setTimeout(() => {
      document
        .querySelector(`[data-qs-character-slot="${character.id}"]`)
        ?.classList.remove('qs-locked-bump');
    }, 320);

    return;
  }

  qsSelectedCharacterId = character.id;

  console.log(
    `[QuickServe] Character selected: ${character.id}; ${character.boostLabel}`
  );

  renderIntroScreen();
  applyQuickServeThemeVars(document.querySelector('.qs-intro'));
}

function renderQuickServeCharacterRosterRow(selectedCharacter) {
  return QS_CHARACTER_ROSTER.map((character) => {
    const unlocked = isQuickServeCharacterUnlocked(character);
    const selected = selectedCharacter?.id === character.id;
    const characterBest = getQuickServeCharacterBestScore(character);

    const slotClasses = [
      'qs-roster-slot',
      `qs-roster-${character.id}`,
      unlocked ? 'is-unlocked' : 'is-locked',
      selected ? 'is-selected' : '',
    ].filter(Boolean).join(' ');

    if (!unlocked) {
      return `
        <button
          type="button"
          class="${slotClasses}"
          data-qs-character-slot="${character.id}"
          aria-label="${character.name} locked until score ${character.unlockLabel}"
        >
          <span class="qs-roster-lock-mark" aria-hidden="true">🔒</span>

          <div class="qs-locked-message" aria-hidden="true">
            <span class="qs-locked-word">Unlock</span>
            <span class="qs-locked-threshold">${character.unlockScore}</span>
          </div>
        </button>
      `;
    }

    return `
      <button
        type="button"
        class="${slotClasses}"
        data-qs-character-slot="${character.id}"
        aria-label="${character.name} unlocked"
      >
        <span class="qs-roster-check" aria-hidden="true">✓</span>

        <span class="qs-roster-name">
          ${(character.displayNameLines || [character.shortName || character.name])
            .map((line) => `<span>${line}</span>`)
            .join('')}
        </span>

        <img
          class="qs-roster-img qs-character-art qs-character-art-${character.artClass}"
          src="${character.introSrc}"
          alt=""
          aria-hidden="true"
        />

        <span class="qs-roster-best-word">Best</span>
        <span class="qs-roster-score-line">Score: ${characterBest}</span>
      </button>
    `;
  }).join('');
}

function wireQuickServeCharacterPreviewButtons() {
  document.querySelectorAll('[data-qs-character-slot]').forEach((button) => {
    button.addEventListener('click', () => {
      selectQuickServeCharacter(button.dataset.qsCharacterSlot);
    });
  });
}

function getQuickServeBestScore() {
  const profileScore =
    typeof appState?.profile?.qsHighScore === 'number'
      ? appState.profile.qsHighScore
      : 0;

  const statsScore =
    typeof appState?.stats?.quickServe?.topScore === 'number'
      ? appState.stats.quickServe.topScore
      : 0;

  return Math.max(profileScore, statsScore, 0);
}

function setQuickServePreflightDifficulty(mode = 'easy') {
  const safeMode = ['easy', 'medium', 'hard'].includes(mode) ? mode : 'easy';
  qsPreflightDifficulty = safeMode;

  document.querySelectorAll('[data-qs-preflight-mode]').forEach((button) => {
    const isActive = button.dataset.qsPreflightMode === safeMode;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function wireQuickServePreflightDifficultyButtons() {
  document.querySelectorAll('[data-qs-preflight-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      setQuickServePreflightDifficulty(button.dataset.qsPreflightMode);
    });
  });

  setQuickServePreflightDifficulty(qsPreflightDifficulty || 'easy');
}

function syncQuickServeStartingModeFromPreflight() {
  // Deprecated QS 1.5 path:
  // direct preflight mode wiring now happens before renderGameUI().
  return applyQuickServePreflightMathMode();
}

function getQuickServeThemeAccent() {
  const { accent, glow, faint } = getThemeAccent(appState?.settings?.theme);

  return {
    accent,
    glow,
    faint,
  };
}

function applyQuickServeThemeVars(scopeEl) {
  const { accent, glow, faint } = getQuickServeThemeAccent();

  const targets = [
    document.body,
    document.getElementById('game-container'),
    document.querySelector('.game-frame'),
    document.querySelector('.qs-intro'),
    document.querySelector('.qs-grid'),
    scopeEl,
  ].filter(Boolean);

  targets.forEach((target) => {
    target.style.setProperty('--qs-accent', accent);
    target.style.setProperty('--qs-glow', glow);
    target.style.setProperty('--qs-faint', faint);
  });
}

function activateQuickServeMusicScope() {
  if (!_qsMusicScopeOn) {
    pushMusicScope({
      poolIds: QS_TRACK_IDS,
      shuffling: true,

      // 🍧 QuickServe fix:
      // Native iOS does not currently auto-advance the shuffle pool on track end.
      // So QS loops the active track until the player leaves QS or starts a fresh shift.
      looping: true
    });

    _qsMusicScopeOn = true;
    return;
  }

  // Safety refresh if QS is already active.
  // Keep this QS-only so we do not disturb other modes.
  setMusicPool(QS_TRACK_IDS);
  setShuffle(true);
  setLoop(true);
}

export function ensureQuickServeMusicPlaying() {
  activateQuickServeMusicScope();

  // Keypad reset uses this path:
  // if music is already playing, leave it alone.
  // if the track ended / died / got stopped, restart the QS lane.
  if (!isPlaying()) {
    playRandomTrack();
  }
}

export function restartQuickServeMusicFresh() {
  activateQuickServeMusicScope();

  // Result modal Play Again uses this path:
  // always request a fresh QS track for the new shift.
  playRandomTrack();
}


//////////////////////////////
// 🚀 Load QuickServe Mode
//////////////////////////////
export function loadQuickServe() {
  console.log('🍧 Loading QuickServe Mode');
  qsIntroStartInFlight = false;
  // 💫 Activate QS mode keys
  activateInputHandler('quickServe');
  document.body.classList.add('qs-active');
  appState.setMode('quickServe');
  appState.incrementQuickServeSessions();
  swapModeBackground('quickServe');

  stopTrack();  // 🔇 Shut down jukebox for QS

  hideMenu();
  showGameContainer();
  renderIntroScreen();
  applyQuickServeThemeVars(document.querySelector('.qs-intro'));
}





//////////////////////////////
// 🎬 Intro Screen
//////////////////////////////
function renderIntroScreen() {
  const container = getGameContainer();
  const bestScore = getQuickServeBestScore();
  const selectedCharacter = getQuickServeSelectedCharacter();

  phil.setQuickServePerformer(selectedCharacter);

  container.innerHTML = `
    <img
      class="qs-mode-backdrop-plate"
      src="${import.meta.env.BASE_URL}assets/img/modes/quickServe/plate_quickserveBG.png"
      alt=""
      aria-hidden="true"
    />
    <div class="qs-mode-backdrop-wash" aria-hidden="true"></div>

    <div class="aspect-wrap">
      <div class="game-frame">
        <img id="modeBackground" class="background-fill" src="${import.meta.env.BASE_URL}assets/img/modes/quickServe/plate_quickserveBG.png"/>
        <div class="qs-intro qs-preflight qs-character-preflight qs-character-v3">
          <section class="qs-preflight-scene qs-character-v3-scene" aria-label="QuickServe character select preflight">
            <header class="qs-preflight-header qs-character-header">
              <h1>QuickServe Pavilion</h1>
              <p class="qs-character-subtitle">
                <span>Choose your character!</span>
                <span>Solve equations fast!</span>
              </p>
            </header>

            <section
              class="qs-character-main-card qs-selected-${selectedCharacter.id}"
              aria-label="QuickServe character card"
            >
              <div class="qs-character-label">${selectedCharacter.name}</div>

              <div class="qs-character-portrait-wrap">
                <img
                  id="philSpriteIntro"
                  class="phil-img qs-character-portrait qs-character-art qs-character-art-${selectedCharacter.artClass}"
                  src="${selectedCharacter.introSrc}"
                  alt=""
                  aria-hidden="true"
                />
              </div>

              <div class="qs-character-name" id="qsSelectedCharacterName">
                ${selectedCharacter.name}
              </div>

              <div class="qs-character-boost" id="qsSelectedCharacterBoost">
                ${selectedCharacter.boostLabel}
              </div>

              <div class="qs-character-best-main" id="qsSelectedCharacterBest">
                Best Score: <strong>${getQuickServeCharacterBestScore(selectedCharacter) ?? '--'}</strong>
              </div>

              <div class="qs-unlocked-header">
                Characters Unlocked: ${getQuickServeUnlockedCharacterCount()} of ${QS_CHARACTER_ROSTER.length}
              </div>

              <div class="qs-unlocked-row" aria-label="Characters unlocked">
                ${renderQuickServeCharacterRosterRow(selectedCharacter)}
              </div>
            </section>

            <section class="qs-difficulty-panel" aria-label="Choose QuickServe difficulty">
              <div class="qs-difficulty-label">Choose Difficulty</div>

              <div class="qs-difficulty-row">
                <button
                  type="button"
                  class="qs-difficulty-btn is-active"
                  data-qs-preflight-mode="easy"
                  aria-pressed="true"
                >
                  <strong>Easy</strong>
                  <span>+ / −</span>
                </button>

                <button
                  type="button"
                  class="qs-difficulty-btn"
                  data-qs-preflight-mode="medium"
                  aria-pressed="false"
                >
                  <strong>Medium</strong>
                  <span>× / ÷</span>
                </button>

                <button
                  type="button"
                  class="qs-difficulty-btn"
                  data-qs-preflight-mode="hard"
                  aria-pressed="false"
                >
                  <strong>Hard</strong>
                  <span>𝒙</span>
                </button>
              </div>
            </section>

            <button id="startShowBtn" class="start-show-btn qs-preflight-start">
              PLAY GAME
            </button>
          </section>
        </div>

        <!-- ✅ Story-style bottom bar just for QS intro -->
        <div class="qs-bottom-bar">
          <button id="qsBackIntro" class="qs-preflight-back-btn" aria-label="Back to menu"><span class="qs-preflight-back-arrow">←</span><span class="qs-preflight-back-text">BACK</span></button>
        </div>
      </div>
    </div>
  `;

  phil.initPhil();
  repaintBackground();

  // Start the show — QS 1.5:
  // In-place intro → gameplay fade.
  // No old global portal between QS intro and QS gameplay.
  document.getElementById('startShowBtn')?.addEventListener('click', startQuickServeShiftFromIntro);

  // New square Back/Mute for intro
  document.getElementById('qsBackIntro')?.addEventListener('click', returnToMenu);
  wireQuickServePreflightDifficultyButtons();
  wireQuickServeCharacterPreviewButtons();



  // (leave setupMuteButton() out here; it targets in-game #muteBtn if present)
}


//////////////////////////////
// 🎮 Main Game Screen
/////////////////////////////
//          removed for pay loop    <button id="qsBackBtn" class="back-to-menu-btn">🔙 Back to Menu</button>)
export function startQuickServeShiftFromIntro() {
  if (qsIntroStartInFlight) return;
  qsIntroStartInFlight = true;

  const introEl = document.querySelector('.qs-intro');
  const bottomBarEl = document.querySelector('.qs-bottom-bar');
  const frameEl = document.querySelector('.game-frame');

  const launchGameplay = () => {
    console.log(
      `[QuickServe] Starting game with character scaffold: ${getQuickServeSelectedCharacter().id}`
    );

    applyQuickServePreflightMathMode();

    // Preserve the current QS music ownership rule:
    // intro start / completed-run replay may request a fresh QS track.
    restartQuickServeMusicFresh();

    renderGameUI();
    applyQuickServeThemeVars(document.querySelector('.qs-grid'));

    requestAnimationFrame(() => {
      const gridEl = document.querySelector('.qs-grid');
      gridEl?.classList.add('qs-game-fade-in');

      window.setTimeout(() => {
        gridEl?.classList.remove('qs-game-fade-in');
        qsIntroStartInFlight = false;
      }, 720);
    });
  };

  if (!introEl) {
    launchGameplay();
    return;
  }

  frameEl?.classList.add('qs-intro-to-game-active');
  introEl.classList.add('qs-intro-fade-out');
  bottomBarEl?.classList.add('qs-intro-fade-out');

  window.setTimeout(launchGameplay, 360);
}

export function renderGameUI() {
  const container = getGameContainer();
  const selectedCharacter = getQuickServeSelectedCharacter();
  const gameSpriteSrc =
    selectedCharacter?.frames?.idle
    || `${import.meta.env.BASE_URL}assets/img/characters/quickServe/phil_01_idle.png`;

  phil.setQuickServePerformer(selectedCharacter);

  container.innerHTML = `
    <img
      class="qs-mode-backdrop-plate"
      src="${import.meta.env.BASE_URL}assets/img/modes/quickServe/plate_quickserveBG.png"
      alt=""
      aria-hidden="true"
    />
    <div class="qs-mode-backdrop-wash" aria-hidden="true"></div>

    <div class="aspect-wrap">
      <div class="game-frame">
        <img id="modeBackground" class="background-fill" src="${import.meta.env.BASE_URL}assets/img/modes/quickServe/plate_quickserveBG.png"/>
        
        <div class="qs-grid">

          <!-- 🍧 Header -->
          <div class="qs-header">
            <h1>QuickServe Pavilion</h1>
          </div>

          <!-- 🎸 Stage -->
          <div class="qs-stage">
            <div class="score-box">
              <div class="info-box">
                <span class="label">Score</span>
                <span class="value" id="qsScore">0</span>
              </div>
            </div>

            <div class="phil-wrapper in-game">
              <img 
                id="philSpriteInGame" 
                class="phil-img in-game qs-character-art qs-character-art-${selectedCharacter.artClass}"
                src="${gameSpriteSrc}"
                alt=""
                aria-hidden="true"
              />
            </div>

            <div class="timer-box">
              <div class="info-box">
                <span class="label">Time</span>
                <span class="value" id="qsTimer">35</span>
              </div>
            </div>

            <!-- ✨ Glow Lines -->
            <div class="glow-lines">
              <div class="glow-line"></div>
              <div class="glow-line"></div>
              <div class="glow-line"></div>
            </div>
          </div>

          <!-- 🧠 Math Stack -->
          <div class="qs-math">
            <div class="center-stack">
              <div class="equation-row">
                <div class="math-problem" id="mathProblem">-- + -- = ?</div>
              </div>

              <div id="answerDisplay" class="answer-display">0</div>

              <!-- 🌈 Feedback floats down here -->
              <div class="qs-xp-msg hidden" id="qsXPMsg">🍧 +3 XP</div>
              <div class="qs-result-msg hidden" id="qsResultMsg">✅ Correct!</div>
            </div>
          </div>

          <!-- 🎹 Keypad -->
          ${generateKeypadHTML()}

        </div>

        <!-- 🎯 QS result overlay + popup -->
        <div class="qs-result-overlay hidden" id="qsResultOverlay">
          <div class="qs-result-popup" id="qsResultPopup">
            <h2>Shift Complete!</h2>

            <p><strong>Score:</strong> <span id="qsScoreFinal">0</span></p>
            <p><strong>High score:</strong> <span id="qsHighScore">0</span></p>
            <p><strong>Cones served:</strong> <span id="qsServedCount">0</span></p>
            <p><strong>Missed orders:</strong> <span id="qsMissCount">0</span></p>

            <p class="qs-tip-line">
              <strong>Phil’s tip:</strong>
              <span id="qsTipText"></span>
            </p>

            <div class="qs-result-buttons">
              <button id="qsPlayAgainBtn" class="start-show-btn">🔁 Run another shift</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  // 🚨 MOVE THIS *AFTER* innerHTML is injected
  console.log('💥 CORRECT FIRED');
  document.getElementById('qsXPMsg')?.classList.add('hidden');
  document.getElementById('qsResultMsg')?.classList.add('hidden');

  // 🚀 Setup Sequence (correct order)
  phil.initPhil();
  gridFX.initGridGlow();
  gridFX.startGridPulse();
  setupKeypad();
  updateMuteButtonLabel();
  startGameLogic();

  // 🔗 Wire up result popup buttons once DOM exists
  setupQuickServeResultButtons();
}


//////////////////////////////
// ↩️ Return Active Shift To QS Intro
//////////////////////////////
export function returnQuickServeGameToIntro() {
  console.log('[QuickServe] Returning active shift to intro/preflight');

  qsIntroStartInFlight = false;

  // Stop the active shift without leaving QuickServe.
  stopGameLogic();
  resetCurrentAnswer();
  gridFX.stopGridPulse();
  phil.resetPhil();

  // QS intro/preflight should be quiet until the next PLAY GAME.
  // Keep the QS music scope alive; do not pop back to menu ownership here.
  stopTrack();

  renderIntroScreen();
  applyQuickServeThemeVars(document.querySelector('.qs-intro'));

  // Keep keyboard/input ownership inside QuickServe.
  activateInputHandler('quickServe');
}

//////////////////////////////
// 🔊 Mute Button Logic
//////////////////////////////


export function updateMuteButtonLabel() {
  const muteBtn = document.getElementById('muteBtn');
  if (!muteBtn) return;

  const muted = isMuted();
  muteBtn.textContent = muted ? '🔇 Unmute' : '🔊 Mute';
}

//////////////////////////////
// 🔙 Return to Menu
//////////////////////////////
export function returnToMenu() {
  // 🔇 Kill QS music (global player)
  stopTrack();

  // Restore whatever music state existed before QS took over.
  if (_qsMusicScopeOn) {
    popMusicScope();
    _qsMusicScopeOn = false;
  }

  // QS intro Back → Main Menu uses the same return portal language as IL.
  playModeReturnTransition(() => {
    cleanUpQuickServe();
    showMenu();
    applyBackgroundTheme();
  });
}


//////////////////////////////
// ♻️ Cleanup
//////////////////////////////
function cleanUpQuickServe() {
  console.log('🧹 Cleaning up QuickServe');

  document.body.classList.remove('qs-active');

  stopGameLogic();
  gridFX.stopGridPulse();
  phil.resetPhil();
  resetCurrentAnswer();

  // failsafe: if we somehow didn’t pop scope yet
  if (_qsMusicScopeOn) {
    try { popMusicScope(); } catch {}
    _qsMusicScopeOn = false;
  }

  clearGameContainer();
  appState.clearCurrentMode();
}



//////////////////////////////
// 🔄 Background Refresh
//////////////////////////////
function repaintBackground() {
  requestAnimationFrame(() => {
    setTimeout(() => {
      const img = document.getElementById('modeBackground');
      if (img) img.src = img.src;
    }, 10);
  });
}

//////////////////////////////
// 🪄 Utility Helpers
//////////////////////////////
function hideMenu() {
  document.querySelector('.menu-wrapper')?.classList.add('hidden');
}

function showMenu() {
  document.querySelector('.menu-wrapper')?.classList.remove('hidden');
}

function showGameContainer() {
  const container = getGameContainer();
  container.classList.remove('hidden');
  container.style.display = 'flex';
}

function clearGameContainer() {
  const container = getGameContainer();
  container.innerHTML = '';
  container.classList.add('hidden');
  container.style.display = 'none';
}

function getGameContainer() {
  return document.getElementById('game-container');
}


function clearFeedback() {
  document.getElementById('qsXPMsg')?.classList.add('hidden');
  document.getElementById('qsResultMsg')?.classList.add('hidden');
}

//////////////////////////////
// 🚀 Scene Manager Hooks
//////////////////////////////
export { stopGameLogic as stopQuickServeGame } from './quickServeGame.js';
export { startGameLogic as startQuickServeGame } from './quickServeGame.js';
//////////////////////////////
// 🎯 QS Result Popup Wiring
//////////////////////////////
function setupQuickServeResultButtons() {
  const playAgainBtn = document.getElementById('qsPlayAgainBtn');
  const backBtn      = document.getElementById('qsBackBtn');

  // 🔁 Stay in QuickServe, so restore QS keyboard handler
  playAgainBtn?.addEventListener('click', () => {
    hideQuickServeResultPopup('quickServe');

    // 🧼 Clean the completed run
    stopGameLogic();
    resetCurrentAnswer();

    // 🎧 Completed shift = fresh DJ lane request
    restartQuickServeMusicFresh();

    // 🍧 New run starts clean
    startGameLogic();
  });

  // 🔙 Heading back to menu; let the menu/system own the keys again
  backBtn?.addEventListener('click', () => {
    hideQuickServeResultPopup('menu');
    returnToMenu();
  });
}

function hideQuickServeResultPopup(nextMode = 'quickServe') {
  const overlay = document.getElementById('qsResultOverlay');
  if (overlay) {
    overlay.classList.add('hidden');
  }

  // 🎹 Hand the keys back to whoever is up next
  if (nextMode) {
    activateInputHandler(nextMode);
  }
}

//////////////////////////////
// 📊 Public: show QS results
//////////////////////////////
export function showQuickServeResults(rawStats = {}) {
  // 🧴 normalize a couple of expected fields
  const stats = {
    score:        rawStats.score        ?? 0,
    served:       rawStats.served       ?? rawStats.totalServed ?? 0,
    missed:       rawStats.missed       ?? rawStats.totalMissed ?? 0,
    easyMisses:   rawStats.easyMisses   ?? 0,
    mediumMisses: rawStats.mediumMisses ?? 0,
    hardMisses:   rawStats.hardMisses   ?? 0,
    highScore:    rawStats.highScore    ?? (appState.profile?.qsHighScore ?? 0),
    lastMissed:   rawStats.lastMissed   ?? null,   // 👈 we’ll use this in the tip
  };

  const overlay = document.getElementById('qsResultOverlay');
  const popup   = document.getElementById('qsResultPopup');
  if (!overlay || !popup) return;

  const scoreEl   = document.getElementById('qsScoreFinal');
  const hiEl      = document.getElementById('qsHighScore');
  const servedEl  = document.getElementById('qsServedCount');
  const missEl    = document.getElementById('qsMissCount');
  const tipEl     = document.getElementById('qsTipText');

  if (scoreEl)  scoreEl.textContent  = stats.score;
  if (hiEl)     hiEl.textContent     = stats.highScore;
  if (servedEl) servedEl.textContent = stats.served;
  if (missEl)   missEl.textContent   = stats.missed;

  if (tipEl) {
    tipEl.textContent = buildQuickServeTip(stats);
  }

  // 🛑 Pause hotkeys while modal is up
  activateInputHandler(null);

  // 📺 Show overlay
  overlay.classList.remove('hidden');

  // 📳 Soft “shift complete” buzz
  try {
    hapticSuccess();
  } catch (e) {
    console.warn('[QuickServe] hapticSuccess failed:', e);
  }
}


function buildQuickServeTip(stats) {
  const score        = Number(stats.score        ?? 0);
  const served       = Number(stats.served       ?? 0);
  const missed       = Number(stats.missed       ?? 0);
  const easyMisses   = Number(stats.easyMisses   ?? 0);
  const mediumMisses = Number(stats.mediumMisses ?? 0);
  const hardMisses   = Number(stats.hardMisses   ?? 0);
  const lastMissed   = stats.lastMissed || null;

  let tipText = '';

  // 🎚️ How “spicy” were the cones overall? (1 = easy, 3 = medium, 5 = hard)
  const avgPoints = served > 0 ? score / served : 0;

  // 🌱 No real run yet
  if (served === 0 && score === 0) {
    tipText = 'Try a few warm-up cones first. Once you get a flow going, the big streaks start to show up.';
  }
  // 💯 Perfect shift (use avgPoints to talk about difficulty)
  else if (missed === 0 && served > 0) {
    if (avgPoints <= 1.6) {
      // mostly add/sub lane
      tipText =
        'Perfect shift! You didn’t miss a single cone in the basics lane. Next run, try mixing in some ×/÷ or Algebra mode to challenge yourself a little more.';
    } else if (avgPoints <= 3.6) {
      // mix of add/sub + multi/div
      tipText =
        'Perfect shift! You kept every ticket clean across the main lanes. If that felt comfy, lean a bit harder into the spicier cones next time and see how high you can push your score.';
    } else {
      // mostly algebra / high-difficulty cones
      tipText =
        'Perfect shift on the hardest cones — no misses at all. That’s festival-legend territory. Next round is all about chasing an even wilder high score.';
    }
  }
  else {
    // 🎯 Non-perfect run: keep your existing lane-based coaching
    let hardestLane = null;
    if (hardMisses > 0 && hardMisses >= mediumMisses && hardMisses >= easyMisses) {
      hardestLane = 'hard';
    } else if (mediumMisses > 0 && mediumMisses >= easyMisses) {
      hardestLane = 'medium';
    } else if (easyMisses > 0) {
      hardestLane = 'easy';
    }

    if (hardestLane === 'hard') {
      tipText =
        'Nice work — the spiciest cones were the ones causing trouble. Try slowing down just a little on the big multi-step problems and double-checking before you hit serve.';
    } else if (hardestLane === 'medium') {
      tipText =
        'Solid shift! Most of the bumps were on the middle-tier cones. Try glancing at the whole problem first, then working it piece by piece instead of rushing the answer.';
    } else if (hardestLane === 'easy') {
      tipText =
        'You actually lost a few orders on the simpler cones. That usually means your brain is in high gear — take half a second to check the small ones before you slam serve.';
    } else if (missed <= 3) {
      tipText =
        'Good run — just a few cones slipped through. A tiny slowdown on the last few seconds of the timer can turn near-misses into extra points.';
    } else {
      tipText =
        'This one was more of a practice shift, which is exactly how your brain levels up. Watch the whole problem before you start typing, and your next run will already feel smoother.';
    }
  }

  // 🧩 Add a concrete “here’s how to do THAT cone” if we have meta from mathBrain
  if (lastMissed && lastMissed.eq && lastMissed.answer != null) {
    tipText += ' ' + buildSpecificConeLesson(lastMissed);
  }

  return tipText;
}

// 🧠 Break down the exact problem they missed
function buildSpecificConeLesson(last) {
  const { eq, answer, mode, meta } = last || {};

  // 🧩 Algebra: multi-step with parentheses
  if (meta?.type === 'algebraTwoBinops' && Array.isArray(meta.steps)) {
    const stepText = meta.steps
      .map(step => `${step.expr} = ${step.value}`)
      .join(', then ');

    return `One that gave you trouble was ${eq} = ${answer}. Try it step by step: ${stepText}.`;
  }

  // ✖️ Multiplication / Division
  if (meta?.type === 'multiDiv' && typeof meta.a === 'number' && typeof meta.b === 'number') {
    const a = meta.a;
    const b = meta.b;
    const op = meta.op;

    if (op === '×') {
      const big   = Math.max(a, b);
      const small = Math.min(a, b);

      if (big >= 10) {
        const tens  = Math.floor(big / 10) * 10;
        const ones  = big - tens;
        const part1 = small * tens;
        const part2 = small * ones;

        if (ones > 0) {
          return `One that tripped you up was ${eq} = ${answer}. Try breaking ${big} into ${tens} and ${ones}: ${small}×${tens} = ${part1} and ${small}×${ones} = ${part2}, then add them: ${part1} + ${part2} = ${answer}.`;
        }

        return `One that tripped you up was ${eq} = ${answer}. Here ${big} is already a tens number, so think “${big} is how many tens of ${small}?” — ${small}×${big} = ${answer}.`;
      }

      return `One that tripped you up was ${eq} = ${answer}. See it as ${small} groups of ${big}. Picture ${big} once, then twice, then ${small} times in total — all stacked together to make ${answer}.`;
    }

    if (op === '÷') {
      return `One that tripped you up was ${eq} = ${answer}. Next time, think “${b} times what equals ${a}?” — that missing factor is your answer.`;
    }
  }

  // ➕➖ Add/Sub
  if (meta?.type === 'addSub' && typeof meta.a === 'number' && typeof meta.b === 'number') {
    const a = meta.a;
    const b = meta.b;
    const op = meta.op;

    if (op === '+') {
      return `One of the simpler cones that slipped was ${eq} = ${answer}. Try stacking ${a} and ${b} and adding the ones place first, then the tens.`;
    }

    if (op === '-') {
      return `One of the cones that slipped was ${eq} = ${answer}. Next time, check if you need to borrow before you subtract. Think “${a} is how far above ${b}?”, and count down carefully.`;
    }
  }

  // 🍼 Fallback: at least point at the exact problem
  return `One to try again: ${eq} = ${answer}.`;
}
