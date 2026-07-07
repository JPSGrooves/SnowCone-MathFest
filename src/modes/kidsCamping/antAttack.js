// /src/modes/kidsCamping/antAttack.js
// Ant Attack 1.6.0 — Choose Ant v1 + existing battle bridge
// Keeps the current tug-of-war core alive while adding the new setup screen.

import { gsap } from 'gsap';
import { appState } from '../../data/appState.js';
import { showRoundMessage } from './roundFeedback.js';

// ────────────────────────────────────────────────────────────────────────────────
// Runtime singletons / module state
// ────────────────────────────────────────────────────────────────────────────────
const ANT = (globalThis.__KC_ANT__ ||= { session: 0, alive: false, root: null });

const ASSET_BASE = `${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/`;

const ANT_ATTACK_SAVE_KEY = 'scmf.kidsCamping.antAttack.v1';

const ANT_ROSTER = Object.freeze([
  {
    id: 'black',
    name: 'Black Ant',
    shortName: 'Black',
    waveName: 'Night Wave',
    wavePower: 3,
    unlockText: 'Starter ant',
    basePng: 'aa_ant_black_base.png',
    poweredPng: 'aa_ant_black_powered.png',
    royalPng: 'aa_ant_black_royal.png',
    soldierPng: 'aa_blackAnt.png',
  },
  {
    id: 'blue',
    name: 'Blue Water Ant',
    shortName: 'Blue',
    waveName: 'Water Wave',
    wavePower: 4,
    unlockText: 'Beat Blue Ant',
    basePng: 'aa_ant_blue_base.png',
    poweredPng: 'aa_ant_blue_powered.png',
    royalPng: 'aa_ant_blue_royal.png',
    soldierPng: 'aa_blueAnt.png',
  },
  {
    id: 'pink',
    name: 'Pink Flower Ant',
    shortName: 'Pink',
    waveName: 'Flower Wave',
    wavePower: 5,
    unlockText: 'Beat Pink Ant',
    basePng: 'aa_ant_pink_base.png',
    poweredPng: 'aa_ant_pink_powered.png',
    royalPng: 'aa_ant_pink_royal.png',
    soldierPng: 'aa_pinkAnt.png',
  },
  {
    id: 'white',
    name: 'White Cloud Ant',
    shortName: 'White',
    waveName: 'Cloud Wave',
    wavePower: 6,
    unlockText: 'Beat White Ant',
    basePng: 'aa_ant_white_base.png',
    poweredPng: 'aa_ant_white_powered.png',
    royalPng: 'aa_ant_white_royal.png',
    soldierPng: 'aa_whiteAnt.png',
  },
  {
    id: 'yellow',
    name: 'Yellow Sun Ant',
    shortName: 'Yellow',
    waveName: 'Sun Wave',
    wavePower: 7,
    unlockText: 'Beat Yellow Ant',
    basePng: 'aa_ant_yellow_base.png',
    poweredPng: 'aa_ant_yellow_powered.png',
    royalPng: 'aa_ant_yellow_royal.png',
    soldierPng: 'aa_yellowAnt.png',
  },
  {
    id: 'red',
    name: 'Red Fire Ant',
    shortName: 'Red',
    waveName: 'Fire Wave',
    wavePower: 8,
    unlockText: 'Beat Red Ant',
    basePng: 'aa_ant_red_base.png',
    poweredPng: 'aa_ant_red_powered.png',
    royalPng: 'aa_ant_red_royal.png',
    soldierPng: 'aa_redAnt.png',
  },
]);

const QUEEN_SNACKJACKET = Object.freeze({
  id: 'queen',
  name: 'Queen SnackJacket',
  shortName: 'Queen',
  waveName: 'Pollen Storm',
  wavePower: 9,
  basePng: 'aa_ant_queen_snackjacket_base.png',
  poweredPng: 'aa_ant_queen_snackjacket_powered.png',
  soldierPng: 'aa_yellowJacket.png',
  fallbackSoldierPng: 'aa_yellowAnt.png',
});

const STORY_RIVAL_ORDER = Object.freeze(['blue', 'pink', 'white', 'yellow', 'red', 'queen']);

const foodCatalog = Object.freeze([
  { name: 'grapes',   label: 'Grapes',   emoji: '🍇', weight: 2, src: 'aa_grapes.png',   fallback: 'grapes.png' },
  { name: 'orange',   label: 'Orange',   emoji: '🍊', weight: 3, src: 'aa_orange.png',   fallback: 'orange.png' },
  { name: 'egg',      label: 'Egg',      emoji: '🥚', weight: 4, src: 'aa_egg.png',      fallback: 'egg.png' },
  { name: 'pizza',    label: 'Pizza',    emoji: '🍕', weight: 5, src: 'aa_pizza.png',    fallback: 'pizza.png' },
  { name: 'snowcone', label: 'SnowCone', emoji: '🍧', weight: 6, src: 'aa_snowcone.png', fallback: 'snowcone.png' },
  { name: 'burger',   label: 'Burger',   emoji: '🍔', weight: 7, src: 'aa_burger.png',   fallback: 'burger.png' },
]);

let playerAntPool = 10;
let aiAntPool      = Infinity;
let playerScore    = 0;
let aiScore        = 0;
let playerAntsAttached = 0;
let aiAntsAttached     = 0;
let currentFood        = null;
let roundInProgress    = false;
let currentDirection   = null; // 'player' | 'ai'
let foodTween          = null;

let updatePopUICallback = null;

let currentPhase = 'choose'; // choose | battle
let selectedAntId = 'black';
let currentBattleMode = 'story';
let currentPlayerAnt = ANT_ROSTER[0];
let currentRivalAnt = ANT_ROSTER[1];

const activeAnts = [];
let redAntTimeouts = [];

let _resizeObs   = null;
let _domObs      = null;
const _boundHandlers = new WeakMap(); // container -> { onPointerDown, onBackCapture }

// ────────────────────────────────────────────────────────────────────────────────
// Utilities / guards
// ────────────────────────────────────────────────────────────────────────────────
function assetUrl(filename) {
  return `${ASSET_BASE}${filename}`;
}

function aliveGuard(container) {
  return ANT.alive && ANT.root === container && document.body.contains(container);
}

function markAntAttackShell(container) {
  container?.classList?.add('aa-ant-root');

  const stage = container?.closest?.('.kc-activity-stage');
  const grid = container?.closest?.('.kc-activity-grid');

  stage?.classList?.add('aa-ant-stage-root');
  grid?.classList?.add('aa-ant-grid-root');
}

function unmarkAntAttackShell(container) {
  container?.classList?.remove('aa-ant-root');

  const stage = container?.closest?.('.kc-activity-stage');
  const grid = container?.closest?.('.kc-activity-grid');

  stage?.classList?.remove('aa-ant-stage-root');
  grid?.classList?.remove('aa-ant-grid-root');
}


function getAntById(id) {
  return ANT_ROSTER.find((ant) => ant.id === id) || ANT_ROSTER[0];
}

function readAntAttackSave() {
  const fallback = {
    selectedAntId: 'black',
    unlockedAnts: { black: true },
    story: {
      nextRivalId: 'blue',
      complete: false,
    },
  };

  try {
    const raw = localStorage.getItem(ANT_ATTACK_SAVE_KEY);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    return {
      ...fallback,
      ...parsed,
      unlockedAnts: {
        ...fallback.unlockedAnts,
        ...(parsed?.unlockedAnts || {}),
      },
      story: {
        ...fallback.story,
        ...(parsed?.story || {}),
      },
    };
  } catch (err) {
    console.warn('[antAttack] failed to read save:', err);
    return fallback;
  }
}

function writeAntAttackSave(nextSave) {
  try {
    localStorage.setItem(ANT_ATTACK_SAVE_KEY, JSON.stringify(nextSave || readAntAttackSave()));
  } catch (err) {
    console.warn('[antAttack] failed to write save:', err);
  }
}

function isAntUnlocked(antId) {
  const save = readAntAttackSave();
  return antId === 'black' || !!save.unlockedAnts?.[antId];
}

function setSelectedAntId(antId) {
  selectedAntId = getAntById(antId).id;

  const save = readAntAttackSave();
  save.selectedAntId = selectedAntId;
  writeAntAttackSave(save);
}

function getSelectedRosterIndex() {
  return Math.max(0, ANT_ROSTER.findIndex((ant) => ant.id === selectedAntId));
}

function getNextStoryRival() {
  const save = readAntAttackSave();
  const nextId = save?.story?.complete ? 'blue' : (save?.story?.nextRivalId || 'blue');

  if (nextId === 'queen') return QUEEN_SNACKJACKET;
  return getAntById(nextId);
}

function getArcadeRival(playerId) {
  const possible = ANT_ROSTER.filter((ant) => ant.id !== playerId);
  return possible[Math.floor(Math.random() * possible.length)] || ANT_ROSTER[1];
}

function getStoryButtonText() {
  const save = readAntAttackSave();
  return save?.story?.complete ? 'Story Mode' : 'Continue Story';
}

function setImgSrcWithFallback(img, primaryName, fallbackName = null) {
  if (!img || !primaryName) return;

  const primary = assetUrl(primaryName);
  const fallback = fallbackName ? assetUrl(fallbackName) : '';

  img.onerror = () => {
    if (fallback && img.src !== fallback) {
      img.onerror = null;
      img.src = fallback;
    }
  };

  img.src = primary;
}

function clearAllRedTimeouts() {
  try { redAntTimeouts.forEach(clearTimeout); } catch {}
  redAntTimeouts = [];
}

function killFoodTween() {
  try { foodTween?.kill?.(); } catch {}
  foodTween = null;
}

function resetBattleRuntimeCounters() {
  playerAntPool = TOTAL_ANT_POOL;
  aiAntPool = Infinity;
  playerScore = 0;
  aiScore = 0;
  playerAntsAttached = 0;
  aiAntsAttached = 0;
  currentFood = null;
  roundInProgress = false;
  currentDirection = null;
  killFoodTween();
  clearAllRedTimeouts();
  try { gsap.killTweensOf(activeAnts); } catch {}
  activeAnts.forEach((ant) => {
    stopCrawlWiggle(ant);
    try { ant.remove(); } catch {}
  });
  activeAnts.length = 0;
}

// center of the food within THIS container
function getFoodCenterCoords(container) {
  const wrapper = container.querySelector('.food-with-overlay');
  const zone    = container.querySelector('.kc-ant-zone');
  if (!wrapper || !zone) return { centerX: 0, centerY: 0 };

  const wrapperRect = wrapper.getBoundingClientRect();
  const zoneRect    = zone.getBoundingClientRect();
  const centerX     = wrapperRect.left - zoneRect.left + wrapperRect.width  / 2;
  const centerY     = wrapperRect.top  - zoneRect.top  + wrapperRect.height / 2;
  return { centerX, centerY };
}

// regen rules (win bonus refill)
function getPlayerRegenBonus(foodName, requiredAnts, usedAnts) {
  if (foodName === 'snowcone') return 10;
  if (usedAnts === requiredAnts) return 6;
  if (usedAnts === requiredAnts + 1) return 5;
  return 4;
}

// wiggle helpers
function getAntBaseRotation(ant) {
  return ant?.dataset?.team === 'player' ? 180 : 0;
}

function startCrawlWiggle(ant, fromX, fromY, toX, toY) {
  const dx = toX - fromX, dy = toY - fromY;
  const len = Math.hypot(dx, dy) || 1;
  const ux = -dy / len, uy = dx / len;
  const amplitude = 6, freq = 8, rotAmp = 5;
  const baseRot = getAntBaseRotation(ant);

  const wiggleFn = () => {
    const t = gsap.ticker.time * freq * Math.PI * 2;
    const s = Math.sin(t);
    const offX = ux * amplitude * s;
    const offY = uy * amplitude * s;
    ant.style.transform = `translate(${offX}px, ${offY}px) rotate(${baseRot + (s * rotAmp)}deg)`;
  };
  ant._wiggleFn = wiggleFn;
  gsap.ticker.add(wiggleFn);
}

function stopCrawlWiggle(ant) {
  if (ant?._wiggleFn) {
    gsap.ticker.remove(ant._wiggleFn);
    ant._wiggleFn = null;
  }

  if (ant) {
    const baseRot = getAntBaseRotation(ant);
    ant.style.transform = `translate(0px,0px) rotate(${baseRot}deg)`;
  }
}

// UI helpers (scoped to container)
function updateScores(container) {
  const p = container.querySelector('#playerScore');
  const a = container.querySelector('#aiScore');
  const playerLabel = container.querySelector('#aaPlayerScoreLabel');
  const rivalLabel = container.querySelector('#aaRivalScoreLabel');

  if (p) p.textContent = playerScore;
  if (a) a.textContent = aiScore;
  if (playerLabel) playerLabel.textContent = currentPlayerAnt?.shortName || 'Player';
  if (rivalLabel) rivalLabel.textContent = currentRivalAnt?.shortName || 'Rival';
}

function updateAntCount(container) {
  const el = container.querySelector('.ant-count');
  const btn = container.querySelector('#kc-ant-button');
  if (el)  el.textContent = `${playerAntPool}/10`;
  if (btn) btn.classList.toggle('disabled', playerAntPool <= 0);
}

function renderSnackCostGrid() {
  return foodCatalog.map((food) => `
    <span class="aa-snack-cost">
      <span aria-hidden="true">${food.emoji}</span>
      <strong>${food.weight}</strong>
    </span>
  `).join('');
}

// ────────────────────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────────────────────
export function initAntAttackGame(container, updatePopUICallbackParam) {
  // prevent double init / cross-container confusion
  if (ANT.alive && ANT.root === container) return;
  if (ANT.alive && ANT.root && ANT.root !== container) {
    try { destroyAntAttackGame(ANT.root); } catch {}
  }

  ANT.session++;
  ANT.alive = true;
  ANT.root  = container;

  updatePopUICallback = updatePopUICallbackParam || null;

  markAntAttackShell(container);

  const save = readAntAttackSave();
  selectedAntId = save.selectedAntId || 'black';

  // If saved selected ant somehow does not exist, repair it.
  if (!ANT_ROSTER.some((ant) => ant.id === selectedAntId)) {
    selectedAntId = 'black';
  }

  resetBattleRuntimeCounters();
  wireBackCapture(container);
  wireContainerDeathWatcher(container);

  renderChooseScreen(container);
}

export function destroyAntAttackGame(container) {
  unmarkAntAttackShell(container);
  // stop spawns / tweens
  roundInProgress = false;
  killFoodTween();
  clearAllRedTimeouts();

  // kill GSAP + DOM ants
  try { gsap.killTweensOf(activeAnts); } catch {}
  activeAnts.forEach(a => { stopCrawlWiggle(a); try { a.remove(); } catch {} });
  activeAnts.length = 0;

  // observers
  if (_resizeObs) { try { _resizeObs.disconnect(); } catch {} _resizeObs = null; }
  if (_domObs)    { try { _domObs.disconnect(); } catch {} _domObs = null;   }

  // button / back capture
  const antButton = container?.querySelector?.('#kc-ant-button');
  const bound = _boundHandlers.get(container);
  if (antButton && bound?.onPointerDown) {
    antButton.removeEventListener('pointerdown', bound.onPointerDown);
  }
  if (bound?.onBackCapture) {
    document.removeEventListener('click', bound.onBackCapture, true);
  }
  _boundHandlers.delete(container);

  // food UI
  const fc = container?.querySelector?.('.food-container');
  if (fc) fc.innerHTML = '';

  // reset counters
  playerAntPool = TOTAL_ANT_POOL;
  aiAntPool = Infinity;
  playerScore = aiScore = 0;
  playerAntsAttached = aiAntsAttached = 0;
  currentDirection = null;
  currentPhase = 'choose';
}

export function resetAntAttackGame(container) {
  if (!aliveGuard(container)) return;
  destroyAntAttackGame(container);
  initAntAttackGame(container, updatePopUICallback);
}

export function forceKillAntAttack() {
  // global hard stop (no container required)
  killFoodTween();
  clearAllRedTimeouts();
  try { gsap.killTweensOf(activeAnts); } catch {}
  activeAnts.forEach(stopCrawlWiggle);
  activeAnts.length = 0;
  roundInProgress = false;
  currentPhase = 'choose';
  ANT.session++;   // invalidate any scheduled timeouts
  ANT.alive   = false;
  ANT.root    = null;

  if (_resizeObs) { try { _resizeObs.disconnect(); } catch {} _resizeObs = null; }
  if (_domObs)    { try { _domObs.disconnect(); } catch {} _domObs    = null; }
}

// ────────────────────────────────────────────────────────────────────────────────
// Choose screen
// ────────────────────────────────────────────────────────────────────────────────
function renderChooseScreen(container) {
  if (!aliveGuard(container)) return;

  currentPhase = 'choose';
  resetBattleRuntimeCounters();

  const selectedAnt = getAntById(selectedAntId);
  const unlocked = isAntUnlocked(selectedAnt.id);
  const nextRival = getNextStoryRival();

  container.innerHTML = `
    <div class="aa-choose-screen">
      <section class="aa-choose-card ${unlocked ? '' : 'is-locked'}" aria-label="Choose your Ant Attack character">
        <header class="aa-choose-header">
          <p class="aa-kicker">ANT ATTACK</p>
          <h2>Choose Your Ant</h2>
        </header>

        <div class="aa-ant-carousel">
          <button id="aaPrevAnt" class="aa-arrow-btn" type="button" aria-label="Previous ant">←</button>

          <div class="aa-ant-preview">
            ${unlocked ? '' : '<span class="aa-lock-badge" aria-label="Locked">🔒</span>'}
            <img
              id="aaSelectedAntImg"
              class="aa-selected-ant-img"
              src="${assetUrl(selectedAnt.basePng)}"
              alt="${selectedAnt.name}"
              draggable="false"
            />
          </div>

          <button id="aaNextAnt" class="aa-arrow-btn" type="button" aria-label="Next ant">→</button>
        </div>

        <div class="aa-ant-meta">
          <h3>${selectedAnt.name}</h3>
          <p class="aa-wave-line">${selectedAnt.waveName}: +${selectedAnt.wavePower}</p>
          <p class="aa-lock-line ${unlocked ? 'unlocked' : 'locked'}">
            ${unlocked ? 'Unlocked' : `🔒 ${selectedAnt.unlockText}`}
          </p>
        </div>

        <div class="aa-snack-panel" aria-label="Snack costs">
          <span class="aa-snack-title">Snack Cost</span>
          <div class="aa-snack-grid">
            ${renderSnackCostGrid()}
          </div>
        </div>

        <p class="aa-rule-line">First to 10 snacks wins.</p>

        <div class="aa-mode-buttons">
          <button
            id="aaStoryModeBtn"
            class="aa-mode-btn aa-story-btn"
            type="button"
            ${unlocked ? '' : 'disabled'}
          >
            ${getStoryButtonText()}
            <small>Next: ${nextRival.name}</small>
          </button>

          <button
            id="aaArcadeModeBtn"
            class="aa-mode-btn aa-arcade-btn"
            type="button"
            ${unlocked ? '' : 'disabled'}
          >
            Arcade Mode
            <small>Random rival</small>
          </button>
        </div>
      </section>
    </div>
  `;

  wireChooseScreen(container);
}

function wireChooseScreen(container) {
  const prev = container.querySelector('#aaPrevAnt');
  const next = container.querySelector('#aaNextAnt');
  const story = container.querySelector('#aaStoryModeBtn');
  const arcade = container.querySelector('#aaArcadeModeBtn');

  prev?.addEventListener('click', () => {
    const current = getSelectedRosterIndex();
    const nextIndex = (current - 1 + ANT_ROSTER.length) % ANT_ROSTER.length;
    setSelectedAntId(ANT_ROSTER[nextIndex].id);
    renderChooseScreen(container);
  });

  next?.addEventListener('click', () => {
    const current = getSelectedRosterIndex();
    const nextIndex = (current + 1) % ANT_ROSTER.length;
    setSelectedAntId(ANT_ROSTER[nextIndex].id);
    renderChooseScreen(container);
  });

  story?.addEventListener('click', () => {
    const player = getAntById(selectedAntId);
    if (!isAntUnlocked(player.id)) return;
    startBattle(container, {
      mode: 'story',
      playerAntId: player.id,
      rivalAntId: getNextStoryRival().id,
    });
  });

  arcade?.addEventListener('click', () => {
    const player = getAntById(selectedAntId);
    if (!isAntUnlocked(player.id)) return;
    startBattle(container, {
      mode: 'arcade',
      playerAntId: player.id,
      rivalAntId: getArcadeRival(player.id).id,
    });
  });
}

function wireBackCapture(container) {
  const existing = _boundHandlers.get(container) || {};
  if (existing.onBackCapture) return;

  const onBackCapture = (ev) => {
    if (!aliveGuard(container)) return;

    const target = ev.target;
    const backBtn = target?.closest?.('#kcBack');
    if (!backBtn) return;

    // On battle screen, Back returns to Ant Attack setup.
    // On choose screen, allow Kids Camping shell to handle Back to Camping setup.
    if (currentPhase === 'battle') {
      ev.preventDefault();
      ev.stopPropagation();
      ev.stopImmediatePropagation();

      renderChooseScreen(container);
    }
  };

  document.addEventListener('click', onBackCapture, true);
  _boundHandlers.set(container, { ...existing, onBackCapture });
}

function wireContainerDeathWatcher(container) {
  // If the container leaves the DOM, auto-kill.
  if (_domObs) { try { _domObs.disconnect(); } catch {} }

  _domObs = new MutationObserver(() => {
    if (!document.body.contains(container)) {
      try { forceKillAntAttack(); } catch {}
    }
  });

  _domObs.observe(document.body, { childList: true, subtree: true });
}

// ────────────────────────────────────────────────────────────────────────────────
// Battle render / core loop
// ────────────────────────────────────────────────────────────────────────────────
const MAX_ANTS_PER_SIDE     = 10;
const TOTAL_ANT_POOL        = 10;
const RED_SPAWN_INTERVAL_MS = 1000;

function startBattle(container, { mode = 'story', playerAntId = 'black', rivalAntId = 'blue' } = {}) {
  if (!aliveGuard(container)) return;

  currentPhase = 'battle';
  currentBattleMode = mode;
  currentPlayerAnt = getAntById(playerAntId);
  currentRivalAnt = rivalAntId === 'queen' ? QUEEN_SNACKJACKET : getAntById(rivalAntId);

  resetBattleRuntimeCounters();

  renderBattleScreen(container);
  startNewRound(container);
}

function renderBattleScreen(container) {
  container.innerHTML = `
    <div class="ant-attack-wrapper aa-battle-wrapper" data-aa-mode="${currentBattleMode}">
      <div class="kc-ant-zone">
        <div class="score-overlay aa-score-overlay" style="position:absolute;bottom:-10px;left:-10px;">
          <span id="aaRivalScoreLabel">${currentRivalAnt.shortName}</span>: <span id="aiScore">0</span><br/>
          <span id="aaPlayerScoreLabel">${currentPlayerAnt.shortName}</span>: <span id="playerScore">0</span>
        </div>

        <div class="ant-base red">
          <img class="ant-hill-img" src="${assetUrl('aa_antBase.png')}" alt="${currentRivalAnt.name} base"/>
          <img class="ant2-img" src="${assetUrl(currentRivalAnt.basePng)}" alt="${currentRivalAnt.name}"/>
        </div>

        <div class="food-zone"><div class="food-container"></div></div>

        <div class="ant-base black">
          <img class="ant-hill-img" src="${assetUrl('aa_antBase.png')}" alt="${currentPlayerAnt.name} base"/>
        </div>

        <button id="kc-ant-button" class="ant-btn aa-send-ant-btn" type="button" aria-label="Send ant">
          <img src="${assetUrl(currentPlayerAnt.basePng)}" alt="Deploy ${currentPlayerAnt.name}"/>
          <span class="ant-count">10/10</span>
        </button>
      </div>
    </div>
  `;

  // background with fallback
  const zone = container.querySelector('.kc-ant-zone');
  const picnic = assetUrl('aa_picnicBlanket.png');
  const fallbackPicnic = assetUrl('picnicBlanket.png');
  const img = new Image();

  img.onload = () => {
    zone?.style.setProperty('--kc-ant-bg', `url(${picnic})`);
  };
  img.onerror = () => {
    zone?.style.setProperty('--kc-ant-bg', `url(${fallbackPicnic})`);
  };
  img.src = picnic;

  // Button handler (pointerdown for mobile snappiness)
  const antButton = container.querySelector('#kc-ant-button');
  const onPointerDown = (e) => {
    e.preventDefault();
    deployPlayerAnt(container);
  };

  antButton?.addEventListener('pointerdown', onPointerDown);

  const existing = _boundHandlers.get(container) || {};
  if (existing.onPointerDown && existing.onPointerDown !== onPointerDown) {
    try { antButton?.removeEventListener('pointerdown', existing.onPointerDown); } catch {}
  }
  _boundHandlers.set(container, { ...existing, onPointerDown });

  // simple glows
  antButton?.querySelector('img')?.classList.add('glow-white');
  container.querySelector('.ant2-img')?.classList.add('ant-glow-pink');

  // initial UI
  updateScores(container);
  updateAntCount(container);

  // Resize observer keeps ants anchored to food on layout change
  if (_resizeObs) { try { _resizeObs.disconnect(); } catch {} }
  _resizeObs = new ResizeObserver(() => {
    if (!aliveGuard(container) || currentPhase !== 'battle') return;

    const { centerX, centerY } = getFoodCenterCoords(container);
    activeAnts.forEach(ant => {
      const offsetX = parseFloat(ant.dataset.offsetX) || 0;
      const offsetY = parseFloat(ant.dataset.offsetY) || 0;
      gsap.set(ant, { left: centerX + offsetX - 16, top: centerY + offsetY - 16 });
    });
  });
  _resizeObs.observe(document.body);
}

function startNewRound(container) {
  if (!aliveGuard(container) || currentPhase !== 'battle') return;

  // wipe ants
  try { gsap.killTweensOf(activeAnts); } catch {}
  activeAnts.forEach(a => { stopCrawlWiggle(a); try { a.remove(); } catch {} });
  activeAnts.length = 0;

  if (playerAntPool <= 0) playerAntPool = TOTAL_ANT_POOL;
  playerAntsAttached = aiAntsAttached = 0;
  roundInProgress = true;
  currentDirection = null;

  updateAntCount(container);

  const foodContainer = container.querySelector('.food-container');
  if (!foodContainer) return;
  foodContainer.innerHTML = '';

  currentFood = foodCatalog[Math.floor(Math.random() * foodCatalog.length)];

  const foodEl = document.createElement('img');
  foodEl.className = 'food-plate-img';
  foodEl.id = 'antFood';
  foodEl.alt = currentFood.label;
  setImgSrcWithFallback(foodEl, currentFood.src, currentFood.fallback);

  if (currentFood.name === 'snowcone') foodEl.classList.add('big-snowcone');

  const overlay = document.createElement('div');
  overlay.className = 'food-weight-overlay';
  overlay.textContent = currentFood.weight;

  const wrapper = document.createElement('div');
  wrapper.className = 'food-with-overlay';
  wrapper.appendChild(foodEl);
  wrapper.appendChild(overlay);
  foodContainer.appendChild(wrapper);

  gsap.set(wrapper, { y: 0 });

  spawnRedAntLoop(container, currentFood.weight);
}

function deployPlayerAnt(container) {
  if (!aliveGuard(container) || currentPhase !== 'battle') return;
  if (playerAntPool <= 0 || !roundInProgress || playerAntsAttached >= MAX_ANTS_PER_SIDE) return;

  const zone = container.querySelector('.kc-ant-zone');
  const { centerX, centerY } = getFoodCenterCoords(container);
  const spawnFrom = zone.querySelector('.ant-base.black');
  const baseRect = spawnFrom.getBoundingClientRect();
  const zoneRect = zone.getBoundingClientRect();
  const spawnX = baseRect.left - zoneRect.left + baseRect.width / 2;
  const spawnY = baseRect.top  - zoneRect.top  + baseRect.height / 2;

  const ant = document.createElement('img');
  ant.src = assetUrl(currentPlayerAnt.soldierPng);
  ant.className = `ant-sprite player-ant-soldier ${currentPlayerAnt.id}-ant ant-glow-white`;
  ant.dataset.team = 'player';
  zone.appendChild(ant);

  const i = playerAntsAttached;
  const row = Math.floor(i / 5), col = i % 5;
  const offsetX = (col - 2) * 20;
  const offsetY = row * 20;
  ant.dataset.offsetX = offsetX;
  ant.dataset.offsetY = offsetY;

  gsap.set(ant, { left: spawnX, top: spawnY });
  stopCrawlWiggle(ant);

  activeAnts.push(ant);
  playerAntsAttached++;
  playerAntPool--;
  updateAntCount(container);

  // 🔔 milestone: full team attached
  if (playerAntsAttached >= MAX_ANTS_PER_SIDE) {
    container?.dispatchEvent(new CustomEvent('kcAntsFull', { bubbles: true }));
  }

  const targetX = centerX + offsetX - 16;
  const targetY = centerY + offsetY - 16;
  startCrawlWiggle(ant, spawnX, spawnY, targetX, targetY);

  gsap.to(ant, {
    left: targetX,
    top: targetY,
    duration: 0.5,
    ease: 'power2.out',
    onComplete: () => {
      stopCrawlWiggle(ant);
      triggerFoodMotion(container.querySelector('#antFood'), container);
      if (!foodTween) checkEndOfPlayWinner(container);
    },
    onInterrupt: () => stopCrawlWiggle(ant)
  });
}

function spawnRedAntLoop(container, requiredWeight) {
  if (!aliveGuard(container) || currentPhase !== 'battle') return;
  const session = ANT.session;
  const zone = container.querySelector('.kc-ant-zone');
  const { centerX, centerY } = getFoodCenterCoords(container);
  const spawnFrom = zone.querySelector('.ant-base.red');
  const baseRect = spawnFrom.getBoundingClientRect();
  const zoneRect  = zone.getBoundingClientRect();
  const spawnX = baseRect.left - zoneRect.left + baseRect.width / 2;
  const spawnY = baseRect.top  - zoneRect.top  + baseRect.height / 2;

  let i = 0;
  const maxRedAnts = Math.min(requiredWeight + Math.floor(Math.random() * 3) + 1, MAX_ANTS_PER_SIDE);

  function scheduleNext() {
    if (!aliveGuard(container) || session !== ANT.session || !roundInProgress || currentPhase !== 'battle' || i >= maxRedAnts) return;
    const tid = setTimeout(deployOneRedAnt, RED_SPAWN_INTERVAL_MS);
    redAntTimeouts.push(tid);
  }

  function deployOneRedAnt() {
    if (!aliveGuard(container) || session !== ANT.session || !roundInProgress || currentPhase !== 'battle' || i >= maxRedAnts) return;

    const ant = document.createElement('img');
    const primarySoldier = currentRivalAnt.soldierPng || 'aa_redAnt.png';
    const fallbackSoldier = currentRivalAnt.fallbackSoldierPng || 'aa_redAnt.png';
    ant.className = `ant-sprite rival-ant-soldier ${currentRivalAnt.id}-ant ant-glow-pink`;
    ant.dataset.team = 'rival';
    ant.style.position = 'absolute';
    ant.style.zIndex = '10';
    setImgSrcWithFallback(ant, primarySoldier, fallbackSoldier);
    zone.appendChild(ant);

    const row = Math.floor(i / 5), col = i % 5;
    const offsetX = (col - 2) * 20;
    const offsetY = -row * 20;
    ant.dataset.offsetX = offsetX;
    ant.dataset.offsetY = offsetY;

    gsap.set(ant, { left: spawnX, top: spawnY });

    const targetX = centerX + offsetX - 16;
    const targetY = centerY + offsetY - 16;

    startCrawlWiggle(ant, spawnX, spawnY, targetX, targetY);

    gsap.to(ant, {
      left: targetX,
      top: targetY,
      duration: 0.5,
      ease: 'power2.out',
      rotation: (Math.random() * 10) - 5,
      onComplete: () => {
        stopCrawlWiggle(ant);
        activeAnts.push(ant);
        aiAntsAttached++;
        triggerFoodMotion(container.querySelector('#antFood'), container);
        i++;
        if (roundInProgress && i < maxRedAnts) scheduleNext();
      },
      onInterrupt: () => stopCrawlWiggle(ant)
    });
  }

  // start now, then schedule 1/sec
  deployOneRedAnt();
}

function triggerFoodMotion(foodEl, container, forcedDirection = null) {
  if (!aliveGuard(container) || currentPhase !== 'battle') return;
  const foodWrapper = foodEl?.parentElement;
  if (!foodEl || !foodWrapper || !roundInProgress) return;

  const playerAnts = playerAntsAttached;
  const aiAnts     = aiAntsAttached;

  let direction = forcedDirection;
  if (!direction) {
    if (playerAnts > aiAnts) direction = 'player';
    else if (aiAnts > playerAnts) direction = 'ai';
    else direction = 'player'; // ties → player
  }

  // weight gate
  if (direction === 'player' && playerAnts < currentFood.weight) return;
  if (direction === 'ai'     && aiAnts     < currentFood.weight) return;

  if (currentDirection === direction && foodTween && foodTween.isActive()) return;
  currentDirection = direction;

  const zone = container.querySelector('.kc-ant-zone');
  const zoneHeight = zone.getBoundingClientRect().height;
  const targetY = zoneHeight * 0.5 * (direction === 'player' ? 1 : -1);
  const totalDistance = Math.abs(targetY - 0);
  const currentY = gsap.getProperty(foodWrapper, 'y') || 0;
  const remaining = Math.abs(targetY - currentY);

  let duration = (remaining / totalDistance) * currentFood.weight;
  duration = Math.max(duration, 0.15);

  activeAnts.forEach(stopCrawlWiggle);
  gsap.killTweensOf(foodWrapper);

  foodTween = gsap.to(foodWrapper, {
    y: targetY,
    duration,
    ease: 'linear',
    onComplete: () => endRound(container, direction === 'player' ? 'win' : 'loss', foodWrapper)
  });

  const sign = (direction === 'player') ? 1 : -1;
  const moveBy = sign * remaining;
  gsap.killTweensOf(activeAnts);
  gsap.to(activeAnts, { top: `+=${moveBy}`, duration, ease: 'linear' });
}

function checkEndOfPlayWinner(container) {
  if (!aliveGuard(container) || currentPhase !== 'battle') return;
  const foodEl = container.querySelector('#antFood');
  if (!foodEl || !roundInProgress || foodTween) return;

  const playerOut = playerAntPool <= 0;
  const aiOut     = aiAntsAttached >= MAX_ANTS_PER_SIDE;
  if (!(playerOut && aiOut)) return;

  let direction = 'player';
  if (aiAntsAttached > playerAntsAttached) direction = 'ai';
  triggerFoodMotion(foodEl, container, direction);
}

function endRound(container, result, foodWrapper) {
  if (!aliveGuard(container) || currentPhase !== 'battle') return;

  roundInProgress = false;
  killFoodTween();
  clearAllRedTimeouts();

  const playerAnts = playerAntsAttached;
  const required   = currentFood.weight;

  if (result === 'win') {
    playerScore++;
    let scoreBonus = 0;
    if (currentFood.name === 'snowcone') {
      scoreBonus = (playerAnts === required) ? 300 : (playerAnts === required + 1) ? 200 : 100;
      showRoundMessage('snowcone');
    } else if (playerAnts === required) {
      scoreBonus = 300; showRoundMessage('perfect');
    } else if (playerAnts === required + 1) {
      scoreBonus = 200; showRoundMessage('great');
    } else {
      scoreBonus = 100; showRoundMessage('good');
    }

    const regen = getPlayerRegenBonus(currentFood.name, required, playerAnts);
    playerAntPool = Math.min(playerAntPool + regen, TOTAL_ANT_POOL);

    appState.incrementPopCount(scoreBonus);
    updatePopUICallback?.();
  } else {
    aiScore++;
    playerAntPool = Math.min(playerAntPool + 3, TOTAL_ANT_POOL);
    showRoundMessage('loss');
  }

  // 🔔 Broadcast round result & running margin.
  try {
    const margin = playerScore - aiScore;
    document.dispatchEvent(new CustomEvent('kcAntRoundResult', {
      detail: {
        result,
        playerWins: playerScore,
        aiWins: aiScore,
        margin
      }
    }));
  } catch {}

  updateScores(container);
  updateAntCount(container);

  gsap.to(activeAnts, {
    opacity: 0,
    duration: 0.5,
    onComplete: () => {
      activeAnts.forEach(a => { stopCrawlWiggle(a); try { a.remove(); } catch {} });
      activeAnts.length = 0;
    }
  });

  gsap.to(foodWrapper, {
    opacity: 0,
    duration: 0.5,
    onComplete: () => {
      const fc = container.querySelector('.food-container');
      if (fc) { fc.innerHTML = ''; gsap.set(fc, { opacity: 1 }); }
      const session = ANT.session;
      setTimeout(() => {
        if (session === ANT.session && !roundInProgress && aliveGuard(container) && currentPhase === 'battle') {
          startNewRound(container);
        }
      }, 1000);
    }
  });
}

// ────────────────────────────────────────────────────────────────────────────────
// HMR safety
// ────────────────────────────────────────────────────────────────────────────────
if (import.meta?.hot) {
  import.meta.hot.dispose(() => {
    try { forceKillAntAttack(); } catch {}
  });
}
