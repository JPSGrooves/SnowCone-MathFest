// /src/modes/kidsCamping/antAttack.js
// Clean, self-contained Ant Attack with hard kill + container guards

import { gsap } from 'gsap';
import { appState } from '../../data/appState.js';
import { showRoundMessage } from './roundFeedback.js';

// ────────────────────────────────────────────────────────────────────────────────
// Runtime singletons / module state
// ────────────────────────────────────────────────────────────────────────────────
const ANT = (globalThis.__KC_ANT__ ||= { session: 0, alive: false, root: null });

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

const activeAnts = [];
let redAntTimeouts = [];

let _resizeObs   = null;
let _domObs      = null;
const _boundHandlers = new WeakMap(); // container -> { onPointerDown }

const foods = [
  { name: 'grapes',   weight: 2, src: 'grapes.png'   },
  { name: 'orange',   weight: 3, src: 'orange.png'   },
  { name: 'pizza',    weight: 5, src: 'pizza.png'    },
  { name: 'snowcone', weight: 6, src: 'snowcone.png' },
  { name: 'burger',   weight: 7, src: 'burger.png'   },
];

const MAX_ANTS_PER_SIDE     = 10;
const TOTAL_ANT_POOL        = 10;
const RED_SPAWN_INTERVAL_MS = 1000;

// ────────────────────────────────────────────────────────────────────────────────
// Utilities / guards
// ────────────────────────────────────────────────────────────────────────────────
function aliveGuard(container) {
  return ANT.alive && ANT.root === container && document.body.contains(container);
}

function clearAllRedTimeouts() {
  try { redAntTimeouts.forEach(clearTimeout); } catch {}
  redAntTimeouts = [];
}

function killFoodTween() {
  try { foodTween?.kill?.(); } catch {}
  foodTween = null;
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
function startCrawlWiggle(ant, fromX, fromY, toX, toY) {
  const dx = toX - fromX, dy = toY - fromY;
  const len = Math.hypot(dx, dy) || 1;
  const ux = -dy / len, uy = dx / len;
  const amplitude = 6, freq = 8, rotAmp = 5;

  const wiggleFn = () => {
    const t = gsap.ticker.time * freq * Math.PI * 2;
    const s = Math.sin(t);
    const offX = ux * amplitude * s;
    const offY = uy * amplitude * s;
    ant.style.transform = `translate(${offX}px, ${offY}px) rotate(${s * rotAmp}deg)`;
  };
  ant._wiggleFn = wiggleFn;
  gsap.ticker.add(wiggleFn);
}
function stopCrawlWiggle(ant) {
  if (ant?._wiggleFn) { gsap.ticker.remove(ant._wiggleFn); ant._wiggleFn = null; }
  if (ant) ant.style.transform = 'translate(0px,0px) rotate(0deg)';
}

// UI helpers (scoped to container)
function updateScores(container) {
  const p = container.querySelector('#playerScore');
  const a = container.querySelector('#aiScore');
  if (p) p.textContent = playerScore;
  if (a) a.textContent = aiScore;
}
function updateAntCount(container) {
  const el = container.querySelector('.ant-count');
  const btn = container.querySelector('#kc-ant-button');
  if (el)  el.textContent = `${playerAntPool}/10`;
  if (btn) btn.classList.toggle('disabled', playerAntPool <= 0);
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

  // full reset
  playerAntPool = TOTAL_ANT_POOL;
  aiAntPool = Infinity;
  playerScore = aiScore = 0;
  playerAntsAttached = aiAntsAttached = 0;
  roundInProgress = false;
  currentDirection = null;
  killFoodTween();
  clearAllRedTimeouts();
  activeAnts.length = 0;

  updatePopUICallback = updatePopUICallbackParam || null;

  // Inject layout
  container.innerHTML = `
    <div class="ant-attack-wrapper">
      <div class="kc-ant-zone">
        <div class="score-overlay" style="position:absolute;bottom:-10px;left:-10px;">
          Red: <span id="aiScore">0</span><br/>Black: <span id="playerScore">0</span>
        </div>
        <div class="ant-base red">
          <img class="ant-hill-img" src="${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/antBase.png" alt="Red Ant Hill"/>
          <img class="ant2-img"   src="${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/ant2.png"   alt="Red Ant Commander"/>
        </div>
        <div class="food-zone"><div class="food-container"></div></div>
        <div class="ant-base black">
          <img class="ant-hill-img" src="${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/antBase.png" alt="Black Ant Base"/>
        </div>
        <button id="kc-ant-button" class="ant-btn">
          <img src="${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/ant.png" alt="Deploy Ant"/>
          <span class="ant-count">10/10</span>
        </button>
      </div>
    </div>
  `;

  // background (with fallback)
  const zone = container.querySelector('.kc-ant-zone');
  const picnic = `${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/picnicBlanket.png`;
  const img = new Image();
  img.onload = () => {
    zone.style.setProperty('--kc-ant-bg', `url(${picnic})`);
  };
  img.onerror = () => {
    zone.style.setProperty('--kc-ant-bg', 'none');
    zone.style.backgroundColor = '#f0e0d0';
  };
  img.src = picnic;

  // Button handler (pointerdown for mobile snappiness)
  const antButton = container.querySelector('#kc-ant-button');
  const onPointerDown = (e) => { e.preventDefault(); deployPlayerAnt(container); };
  antButton.addEventListener('pointerdown', onPointerDown);
  _boundHandlers.set(container, { onPointerDown });

  // simple glows
  antButton.querySelector('img')?.classList.add('glow-white');
  container.querySelector('.ant2-img')?.classList.add('ant-glow-pink');

  // initial UI
  updateScores(container);
  updateAntCount(container);

  // Resize observer keeps ants anchored to food on layout change
  if (_resizeObs) { try { _resizeObs.disconnect(); } catch {} }
  _resizeObs = new ResizeObserver(() => {
    if (!aliveGuard(container)) return;
    const { centerX, centerY } = getFoodCenterCoords(container);
    activeAnts.forEach(ant => {
      const offsetX = parseFloat(ant.dataset.offsetX) || 0;
      const offsetY = parseFloat(ant.dataset.offsetY) || 0;
      gsap.set(ant, { left: centerX + offsetX - 16, top: centerY + offsetY - 16 });
    });
  });
  _resizeObs.observe(document.body);

  // If the container leaves the DOM, auto-kill
  if (_domObs) { try { _domObs.disconnect(); } catch {} }
  _domObs = new MutationObserver(() => {
    if (!document.body.contains(container)) {
      try { forceKillAntAttack(); } catch {}
    }
  });
  _domObs.observe(document.body, { childList: true, subtree: true });

  // Start!
  startNewRound(container);
}

export function destroyAntAttackGame(container) {
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

  // button
  const antButton = container.querySelector('#kc-ant-button');
  const bound = _boundHandlers.get(container);
  if (antButton && bound?.onPointerDown) antButton.removeEventListener('pointerdown', bound.onPointerDown);
  _boundHandlers.delete(container);

  // food UI
  const fc = container.querySelector('.food-container');
  if (fc) fc.innerHTML = '';

  // reset counters
  playerAntPool = TOTAL_ANT_POOL;
  aiAntPool = Infinity;
  playerScore = aiScore = 0;
  playerAntsAttached = aiAntsAttached = 0;
  currentDirection = null;
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
  ANT.session++;   // invalidate any scheduled timeouts
  ANT.alive   = false;
  ANT.root    = null;

  if (_resizeObs) { try { _resizeObs.disconnect(); } catch {} _resizeObs = null; }
  if (_domObs)    { try { _domObs.disconnect(); } catch {} _domObs    = null; }
}

// ────────────────────────────────────────────────────────────────────────────────
function startNewRound(container) {
  if (!aliveGuard(container)) return;

  // wipe ants
  try { gsap.killTweensOf(activeAnts); } catch {}
  activeAnts.forEach(a => { try { a.remove(); } catch {} });
  activeAnts.length = 0;

  if (playerAntPool <= 0) playerAntPool = TOTAL_ANT_POOL;
  playerAntsAttached = aiAntsAttached = 0;
  roundInProgress = true;
  currentDirection = null;

  updateAntCount(container);

  const foodContainer = container.querySelector('.food-container');
  if (!foodContainer) return;
  foodContainer.innerHTML = '';

  currentFood = foods[Math.floor(Math.random() * foods.length)];

  const foodEl = document.createElement('img');
  foodEl.src = `${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/${currentFood.src}`;
  foodEl.className = 'food-plate-img';
  foodEl.id = 'antFood';
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
  if (!aliveGuard(container)) return;
  if (playerAntPool <= 0 || !roundInProgress || playerAntsAttached >= MAX_ANTS_PER_SIDE) return;

  const zone = container.querySelector('.kc-ant-zone');
  const { centerX, centerY } = getFoodCenterCoords(container);
  const spawnFrom = zone.querySelector('.ant-base.black');
  const baseRect = spawnFrom.getBoundingClientRect();
  const zoneRect = zone.getBoundingClientRect();
  const spawnX = baseRect.left - zoneRect.left + baseRect.width / 2;
  const spawnY = baseRect.top  - zoneRect.top  + baseRect.height / 2;

  const ant = document.createElement('img');
  ant.src = `${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/blackAnt.png`;
  ant.className = 'ant-sprite black-ant ant-glow-white';
  ant.dataset.team = 'black';
  zone.appendChild(ant);

  const i = playerAntsAttached;
  const row = Math.floor(i / 5), col = i % 5;
  const offsetX = (col - 2) * 20;
  const offsetY = row * 20;
  ant.dataset.offsetX = offsetX;
  ant.dataset.offsetY = offsetY;

  gsap.set(ant, { left: spawnX, top: spawnY });

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
  if (!aliveGuard(container)) return;
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
  // minimal log to trace, comment out if noisy:
  // console.log(`Spawning red ants (1/sec) for weight ${requiredWeight}, max: ${maxRedAnts}`);

  function scheduleNext() {
    if (!aliveGuard(container) || session !== ANT.session || !roundInProgress || i >= maxRedAnts) return;
    const tid = setTimeout(deployOneRedAnt, RED_SPAWN_INTERVAL_MS);
    redAntTimeouts.push(tid);
  }

  function deployOneRedAnt() {
    if (!aliveGuard(container) || session !== ANT.session || !roundInProgress || i >= maxRedAnts) return;

    const ant = document.createElement('img');
    ant.src = `${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/redAnt.png`;
    ant.className = 'ant-sprite red-ant ant-glow-pink';
    ant.dataset.team = 'red';
    ant.style.position = 'absolute';
    ant.style.zIndex = '10';
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
  if (!aliveGuard(container)) return;
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
  if (!aliveGuard(container)) return;
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
  if (!aliveGuard(container)) return;

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

  // 🔔 NEW: broadcast round result & running margin
  try {
    const margin = playerScore - aiScore;
    document.dispatchEvent(new CustomEvent('kcAntRoundResult', {
      detail: {
        result,                // 'win' | 'loss'
        playerWins: playerScore,
        aiWins: aiScore,
        margin                 // playerWins - aiWins
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
        if (session === ANT.session && !roundInProgress && aliveGuard(container)) {
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
