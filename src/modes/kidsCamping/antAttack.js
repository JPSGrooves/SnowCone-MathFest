// 🐜🛠 Ant Attack Mode – Enhanced Pull Direction + AI Spawn Loop
import { appState } from '../../data/appState.js';
import { gsap } from 'gsap';
import { showRoundMessage } from './roundFeedback.js';



// Store the updatePopUI callback globally
let updatePopUICallback = null;

const foods = [
  { name: 'grapes', weight: 2, src: 'grapes.png' },
  { name: 'orange', weight: 3, src: 'orange.png' },
  { name: 'pizza', weight: 5, src: 'pizza.png' },
  { name: 'snowcone', weight: 6, src: 'snowcone.png' },
  { name: 'burger', weight: 7, src: 'burger.png' },
];

const BASE_TIME = 1;
const MAX_ANTS_PER_SIDE = 10;
const TOTAL_ANT_POOL = 10;
const RED_SPAWN_INTERVAL_MS = 1000; // 🔴 1 red ant per second


let playerAntPool = TOTAL_ANT_POOL;
let aiAntPool = Infinity; // 🔁 red ants now infinite
let playerScore = 0;
let aiScore = 0; // 🩹 Add this back near the top
let currentFood;
let playerAntsAttached = 0;
let aiAntsAttached = 0;
let roundInProgress = false;
let foodTween;
let currentDirection = null; // 'player' or 'ai'
let bonus = 0;

let _resizeObs = null;

const _boundHandlers = new WeakMap(); // container -> { onPointerDown }

const activeAnts = [];
const diff = Math.abs(playerAntsAttached - aiAntsAttached);

// Store timeout IDs to clear them when round ends
let redAntTimeouts = [];

export function initAntAttackGame(container, updatePopUICallbackParam) {
  // reset ALL runtime state for a clean session (even if teardown wasn't called)
  playerAntPool = TOTAL_ANT_POOL;
  aiAntPool = Infinity;
  playerScore = 0;
  aiScore = 0;
  playerAntsAttached = 0;
  aiAntsAttached = 0;
  roundInProgress = false;
  foodTween?.kill();
  redAntTimeouts.forEach(clearTimeout);
  redAntTimeouts = [];
  currentDirection = null;

  // Store the callback globally
  updatePopUICallback = updatePopUICallbackParam;

  // Inject layout
  container.innerHTML = `
    <div class="ant-attack-wrapper">
      <div class="kc-ant-zone">
        <div class="score-overlay" style="position: absolute; bottom: -10px; left: -10px;">
          Red: <span id="aiScore">0</span><br>Black: <span id="playerScore">0</span>
        </div>
        <div class="ant-base red">
          <img class="ant-hill-img" src="${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/antBase.png" alt="Red Ant Hill" />
          <img class="ant2-img" src="${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/ant2.png" alt="Red Ant Commander" />
        </div>
        <div class="food-zone">
          <div class="food-container"></div>
        </div>
        <div class="ant-base black">
          <img class="ant-hill-img" src="${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/antBase.png" alt="Black Ant Base" />
        </div>
        <button id="kc-ant-button" class="ant-btn">
          <img src="${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/ant.png" alt="Deploy Ant" />
          <span id="antsReady" class="ant-count">10/10</span>
        </button>
      </div>
    </div>
  `;

  // 🎨 Background (picnic blanket) with fallback color
  const antZone = container.querySelector('.kc-ant-zone');
  const picnicBlanketUrl = `${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/picnicBlanket.png`;
  const img = new Image();
  img.src = picnicBlanketUrl;
  img.onload = () => {
    antZone.style.backgroundImage = `url(${picnicBlanketUrl})`;
    antZone.style.backgroundRepeat = 'repeat';
    antZone.style.backgroundSize = '75%';
    antZone.style.backgroundPosition = 'center';
  };
  img.onerror = () => {
    console.error('Failed to load picnicBlanket.png:', picnicBlanketUrl);
    antZone.style.backgroundColor = '#f0e0d0';
  };

  // 🖱️ Button binds (fast on mobile via pointerdown) — store handler so we can remove later
  const antButton = container.querySelector('#kc-ant-button');
  const onPointerDown = (e) => {
    e.preventDefault();
    deployPlayerAnt(container);
  };
  antButton.addEventListener('pointerdown', onPointerDown);
  _boundHandlers.set(container, { onPointerDown });

  // ✨ Glow setup (button = white by default, red commander = pink)
  const antBtnImg = antButton.querySelector('img');
  if (antBtnImg) antBtnImg.classList.add('glow-white');
  const redCommander = container.querySelector('.ant2-img');
  if (redCommander) redCommander.classList.add('ant-glow-pink');

  // 📊 Wire UI + force fresh scores at 0
  const playerScoreEl = container.querySelector('#playerScore');
  const aiScoreEl = container.querySelector('#aiScore');
  const antCountEl = container.querySelector('.ant-count');
  updateScores(playerScoreEl, aiScoreEl);
  updateAntCount(antCountEl, antButton);

  // 🔭 ResizeObserver — disconnect any old one, then attach fresh
  if (_resizeObs) {
    try { _resizeObs.disconnect(); } catch {}
  }
  _resizeObs = new ResizeObserver(() => {
    const zone = document.querySelector('.kc-ant-zone');
    const foodEl = document.getElementById('antFood');
    if (!zone || !foodEl) return;

    const foodRect = foodEl.getBoundingClientRect();
    const zoneRect = zone.getBoundingClientRect();
    const centerY = zoneRect.height / 2;
    const centerX = foodRect.left + foodRect.width / 2 - zoneRect.left;

    activeAnts.forEach(ant => {
      const offsetX = parseFloat(ant.dataset.offsetX) || 0;
      const offsetY = parseFloat(ant.dataset.offsetY) || 0;
      const targetX = centerX + offsetX - 16;
      const targetY = centerY + offsetY - 16;
      gsap.set(ant, { left: targetX, top: targetY });
    });
  });
  _resizeObs.observe(document.body);

  // 🚀 Start first round
  startNewRound(container);
}

export function destroyAntAttackGame(container) {
  // stop round + timers
  roundInProgress = false;
  foodTween?.kill();
  redAntTimeouts.forEach(clearTimeout);
  redAntTimeouts = [];

  // kill GSAP on ants and remove DOM nodes
  gsap.killTweensOf(activeAnts);
  activeAnts.forEach(ant => {
    stopCrawlWiggle(ant);
    ant.remove();
  });
  activeAnts.length = 0;

  // disconnect observer
  if (_resizeObs) {
    try { _resizeObs.disconnect(); } catch {}
    _resizeObs = null;
  }

  // remove button handler
  const antButton = container.querySelector('#kc-ant-button');
  const bound = _boundHandlers.get(container);
  if (antButton && bound?.onPointerDown) {
    antButton.removeEventListener('pointerdown', bound.onPointerDown);
  }
  _boundHandlers.delete(container);

  // clear food UI
  const foodContainer = container.querySelector('.food-container');
  if (foodContainer) foodContainer.innerHTML = '';

  // hard reset scores/pools so next init starts fresh
  playerAntPool = TOTAL_ANT_POOL;
  aiAntPool = Infinity;
  playerScore = 0;
  aiScore = 0;
  playerAntsAttached = 0;
  aiAntsAttached = 0;
  currentDirection = null;

  // optional: wipe container content to avoid ghost UI
  // container.innerHTML = '';
}


export function resetAntAttackGame(container) {
  console.log('🔄 Resetting ant attack game...');
  const antZone = container.querySelector('.kc-ant-zone');
  if (antZone) {
    gsap.killTweensOf(activeAnts);
    activeAnts.forEach(ant => ant.remove());
    activeAnts.length = 0;
    const redBase = antZone.querySelector('.ant-base.red');
    const blackBase = antZone.querySelector('.ant-base.black');
    if (redBase) redBase.style.alignSelf = 'flex-start';
    if (blackBase) blackBase.style.alignSelf = 'flex-end';
  }
  foodTween?.kill();
  playerAntPool = TOTAL_ANT_POOL;
  aiAntPool = Infinity; // Reset to infinite for each reset
  playerScore = 0;
  aiScore = 0;
  playerAntsAttached = 0;
  aiAntsAttached = 0;
  roundInProgress = false;
  redAntTimeouts.forEach(clearTimeout); // Clear any pending timeouts
  redAntTimeouts = [];
  const foodContainer = container.querySelector('.food-container');
  if (foodContainer) foodContainer.innerHTML = '';
  const playerScoreEl = container.querySelector('#playerScore');
  const aiScoreEl = container.querySelector('#aiScore');
  const antCountEl = container.querySelector('.ant-count');
  const antButton = container.querySelector('#kc-ant-button');
  updateScores(playerScoreEl, aiScoreEl);
  updateAntCount(antCountEl, antButton);
}

function deployPlayerAnt(container) {
  if (playerAntPool <= 0 || !roundInProgress || playerAntsAttached >= MAX_ANTS_PER_SIDE) return;

  const zone = document.querySelector('.kc-ant-zone');
  const { centerX, centerY } = getFoodCenterCoords();
  const spawnFrom = zone.querySelector('.ant-base.black');
  const baseRect = spawnFrom.getBoundingClientRect();
  const zoneRect = zone.getBoundingClientRect();
  const spawnX = baseRect.left - zoneRect.left + baseRect.width / 2;
  const spawnY = baseRect.top - zoneRect.top + baseRect.height / 2;

  const ant = document.createElement('img');
  ant.src = `${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/blackAnt.png`;
  ant.className = 'ant-sprite black-ant';
  ant.dataset.team = 'black';

  // ✅ add white glow to black ants
  ant.classList.add('ant-glow-white');

  zone.appendChild(ant);

  const i = playerAntsAttached;
  const row = Math.floor(i / 5);
  const col = i % 5;
  const offsetX = (col - 2) * 20;
  const offsetY = row * 20;

  ant.dataset.offsetX = offsetX;
  ant.dataset.offsetY = offsetY;

  gsap.set(ant, { left: spawnX, top: spawnY });

  activeAnts.push(ant);
  playerAntsAttached++;
  playerAntPool--;
  updateAntCount(document.querySelector('.ant-count'), document.querySelector('#kc-ant-button'));

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
      triggerFoodMotion(document.getElementById('antFood'), container);
      if (!foodTween) checkEndOfPlayWinner(container);
    },
    onInterrupt: () => {
      stopCrawlWiggle(ant);
    }
  });
}



function spawnRedAntLoop(container, requiredWeight) {
  const zone = container.querySelector('.kc-ant-zone');
  const { centerX, centerY } = getFoodCenterCoords();
  const spawnFrom = zone.querySelector('.ant-base.red');
  const baseRect = spawnFrom.getBoundingClientRect();
  const zoneRect = zone.getBoundingClientRect();
  const spawnX = baseRect.left - zoneRect.left + baseRect.width / 2;
  const spawnY = baseRect.top - zoneRect.top + baseRect.height / 2;

  let i = 0;
  const maxRedAnts = Math.min(requiredWeight + Math.floor(Math.random() * 3) + 1, MAX_ANTS_PER_SIDE);
  console.log(`Spawning red ants (1/sec) for weight ${requiredWeight}, max: ${maxRedAnts}`);

  function scheduleNext() {
    if (!roundInProgress || i >= maxRedAnts) return;
    const timeoutId = setTimeout(deployOneRedAnt, RED_SPAWN_INTERVAL_MS);
    redAntTimeouts.push(timeoutId);
  }

  function deployOneRedAnt() {
    if (!roundInProgress || i >= maxRedAnts) return;

    const ant = document.createElement('img');
    ant.src = `${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/redAnt.png`;
    ant.className = 'ant-sprite red-ant';
    ant.dataset.team = 'red';
    ant.style.position = 'absolute';
    ant.style.zIndex = '10';

    // ✅ add pink glow to red ants
    ant.classList.add('ant-glow-pink');

    zone.appendChild(ant);

    const row = Math.floor(i / 5);
    const col = i % 5;
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
        triggerFoodMotion(document.getElementById('antFood'), container);
        i++;
        if (roundInProgress && i < maxRedAnts) scheduleNext();
      },
      onInterrupt: () => {
        stopCrawlWiggle(ant);
      }
    });
  }

  // Kick off immediately, then 1/sec thereafter
  deployOneRedAnt();
}




function startNewRound(container) {
  // 🔁 Clean up old state
  if (playerAntPool <= 0) playerAntPool = TOTAL_ANT_POOL;
  gsap.killTweensOf(activeAnts);
  activeAnts.forEach(el => el.remove());
  activeAnts.length = 0;
  playerAntsAttached = 0;
  aiAntsAttached = 0;
  roundInProgress = true;
  currentDirection = null;
  updateAntCount(
    document.querySelector('.ant-count'),
    document.querySelector('#kc-ant-button')
  );

  const foodContainer = container.querySelector('.food-container');
  if (!foodContainer) return;
  foodContainer.innerHTML = '';
  currentFood = foods[Math.floor(Math.random() * foods.length)];

  const foodEl = document.createElement('img');
  foodEl.src = `${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/${currentFood.src}`;
  foodEl.className = 'food-plate-img';
  foodEl.id = 'antFood';

  if (currentFood.name === 'snowcone') {
    foodEl.classList.add('big-snowcone');
  }

  const overlay = document.createElement('div');
  overlay.className = 'food-weight-overlay';
  overlay.textContent = currentFood.weight;

  const wrapper = document.createElement('div');
  wrapper.className = 'food-with-overlay';
  wrapper.appendChild(foodEl);
  wrapper.appendChild(overlay);

  foodContainer.appendChild(wrapper);
  gsap.set(foodEl, { y: 0 });

  spawnRedAntLoop(container, currentFood.weight);
}

function triggerFoodMotion(foodEl, container, forcedDirection = null) {
  const foodWrapper = foodEl?.parentElement;
  if (!foodEl || !foodWrapper || !roundInProgress) return;

  const playerAnts = playerAntsAttached;
  const aiAnts = aiAntsAttached;

  // Decide direction by majority (player wins ties) unless forced
  let direction = forcedDirection;
  if (!direction) {
    if (playerAnts > aiAnts) direction = 'player';
    else if (aiAnts > playerAnts) direction = 'ai';
    else direction = 'player';
  }

  // Weight gate: only move if the winning side has enough ants
  if (direction === 'player' && playerAnts < currentFood.weight) return;
  if (direction === 'ai' && aiAnts < currentFood.weight) return;

  // 🔒 If direction didn’t change, don’t rebuild tweens = no fake slowdown
  if (currentDirection === direction && foodTween && foodTween.isActive()) return;
  currentDirection = direction;

  const zone = container.querySelector('.kc-ant-zone');
  if (!zone) return;

  const zoneHeight = zone.getBoundingClientRect().height;
  const targetY = zoneHeight * 0.5 * (direction === 'player' ? 1 : -1);
  const totalDistance = Math.abs(targetY - 0); // from center (0) to base target
  const currentY = gsap.getProperty(foodWrapper, 'y') || 0;
  const remainingDistance = Math.abs(targetY - currentY);

  // Scale duration to remaining distance to keep constant speed feel
  let duration = (remainingDistance / totalDistance) * currentFood.weight;
  duration = Math.max(duration, 0.15); // prevent micro-stutters

  // 🚿 Ensure nobody is still wiggling once the tug starts/changes
  activeAnts.forEach(stopCrawlWiggle);

  // 🚫 Only kill existing food tween when we actually change direction
  gsap.killTweensOf(foodWrapper);

  foodTween = gsap.to(foodWrapper, {
    y: targetY,
    duration,
    ease: 'linear',
    onComplete: () => {
      endRound(container, direction === 'player' ? 'win' : 'loss', foodWrapper);
    }
  });

  // Ants follow food at same constant speed, using TOP so transform wiggle survives
  gsap.killTweensOf(activeAnts);
  const sign = (direction === 'player') ? 1 : -1;
  const moveBy = sign * remainingDistance;
  gsap.to(activeAnts, {
    top: `+=${moveBy}`,   // ⬅️ relative top shift matches food’s travel
    duration,
    ease: 'linear'
  });
}

function checkEndOfPlayWinner(container) {
  const foodEl = document.getElementById('antFood');
  if (!foodEl || !roundInProgress || foodTween) return; // Prevent post-round triggers

  const playerOut = playerAntPool <= 0;
  const aiOut = aiAntsAttached >= MAX_ANTS_PER_SIDE;
  const noMoreMoves = playerOut && aiOut;

  if (!noMoreMoves) return;

  const playerAnts = playerAntsAttached;
  const aiAnts = aiAntsAttached;

  let direction;
  if (playerAnts > aiAnts) {
    direction = 'player';
  } else if (aiAnts > playerAnts) {
    direction = 'ai';
  } else {
    direction = 'player'; // Player wins ties
  }

  triggerFoodMotion(foodEl, container, direction);
}

function endRound(container, result, foodWrapper) {
  roundInProgress = false;
  foodTween?.kill();
  redAntTimeouts.forEach(clearTimeout); // Clear all pending red ant timeouts
  redAntTimeouts = [];

  const playerAnts = playerAntsAttached;
  const aiAnts = aiAntsAttached;
  const diff = Math.abs(playerAnts - aiAnts);

  let scoreBonus = 0;

  if (result === 'win') {
    playerScore++;
    const requiredAnts = currentFood.weight;
    const usedAnts = playerAnts;

    if (currentFood.name === 'snowcone') {
      scoreBonus = (usedAnts === requiredAnts) ? 300 :
                  (usedAnts === requiredAnts + 1) ? 200 : 100;
      showRoundMessage('snowcone'); // 🎯 special egg text
    } else if (usedAnts === requiredAnts) {
      scoreBonus = 300;
      showRoundMessage('perfect');
    } else if (usedAnts === requiredAnts + 1) {
      scoreBonus = 200;
      showRoundMessage('great');
    } else {
      scoreBonus = 100;
      showRoundMessage('good');
    }

    const regenBonus = getPlayerRegenBonus(currentFood.name, requiredAnts, usedAnts);
    playerAntPool = Math.min(playerAntPool + regenBonus, TOTAL_ANT_POOL);

    appState.incrementPopCount(scoreBonus);
    if (updatePopUICallback) updatePopUICallback();
  } else {
    aiScore++;
    // ❄️ Loss behavior unchanged: recovery +3
    playerAntPool = Math.min(playerAntPool + 3, TOTAL_ANT_POOL);
    showRoundMessage('loss');
  }

  const playerScoreEl = container.querySelector('#playerScore');
  const aiScoreEl = container.querySelector('#aiScore');
  const antCountEl = container.querySelector('.ant-count');
  const antButton = container.querySelector('#kc-ant-button');

  updateScores(playerScoreEl, aiScoreEl);
  updateAntCount(antCountEl, antButton);

  gsap.to(activeAnts, {
    opacity: 0,
    duration: 0.5,
    onComplete: () => {
      activeAnts.forEach(ant => {
        stopCrawlWiggle(ant); // 🔒 stop any active wiggle
        ant.remove();
      });
      activeAnts.length = 0;
    }
  });


  gsap.to(foodWrapper, {
    opacity: 0,
    duration: 0.5,
    onComplete: () => {
      const foodContainer = container.querySelector('.food-container');
      if (foodContainer) {
        foodContainer.innerHTML = '';
        gsap.set(foodContainer, { opacity: 1 });
      }
      setTimeout(() => startNewRound(container), 1000);
    }
  });
}


function endGame(container) {
  console.log('Game Over! Player Score:', playerScore, 'AI Score:', aiScore);
  appState.incrementPopCount(playerScore * 10);
  const msg = document.createElement('div');
  msg.textContent = playerScore > aiScore ? 'You Win!' : 'AI Wins!';
  msg.className = 'kc-success-msg';
  container.appendChild(msg);
  gsap.to(msg, {
    opacity: 0,
    duration: 1,
    delay: 2,
    onComplete: () => msg.remove()
  });
}

function updateScores(playerEl, aiEl) {
  if (playerEl) playerEl.textContent = playerScore;
  if (aiEl) aiEl.textContent = aiScore;
}

function updateAntCount(el, button) {
  if (el) el.textContent = `${playerAntPool}/10`;
  if (button) {
    button.classList.toggle('disabled', playerAntPool <= 0);
  }
}

function flashBonus(button, bonusText) {
  const flash = document.createElement('div');
  flash.className = 'bonus-flash';
  flash.textContent = bonusText;
  button.appendChild(flash);
  gsap.to(flash, {
    opacity: 0,
    scale: 1,
    duration: 0.5,
    ease: 'power2.out',
    onComplete: () => flash.remove()
  });
}

function getFoodCenterCoords() {
  const wrapper = document.querySelector('.food-with-overlay');
  const zone = document.querySelector('.kc-ant-zone');
  if (!wrapper || !zone) return { centerX: 0, centerY: 0 };

  const wrapperRect = wrapper.getBoundingClientRect();
  const zoneRect = zone.getBoundingClientRect();

  const centerX = wrapperRect.left - zoneRect.left + wrapperRect.width / 2;
  const centerY = wrapperRect.top - zoneRect.top + wrapperRect.height / 2;

  return { centerX, centerY };
}

// ✅ Player regen rules live here so they’re easy to tweak later.
function getPlayerRegenBonus(foodName, requiredAnts, usedAnts) {
  // Snowcone is special: always +10 refill on a win
  if (foodName === 'snowcone') return 10;

  // Existing behavior for everything else:
  // perfect = +6, great(+1) = +5, otherwise = +4
  if (usedAnts === requiredAnts) return 6;
  if (usedAnts === requiredAnts + 1) return 5;
  return 4;
}
// 🐜 wiggle helpers — sine wave crawl while traveling
function startCrawlWiggle(ant, fromX, fromY, toX, toY) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const len = Math.hypot(dx, dy) || 1;
  const ux = -dy / len; // ⟂ unit vector X
  const uy =  dx / len; // ⟂ unit vector Y

  const amplitude = 6;   // px side-to-side
  const freq = 8;        // oscillations/sec
  const rotAmp = 5;      // deg wiggle

  // one ticker per ant; store ref so we can remove later
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
  if (ant && ant._wiggleFn) {
    gsap.ticker.remove(ant._wiggleFn);
    ant._wiggleFn = null;
  }
  if (ant) ant.style.transform = 'translate(0px, 0px) rotate(0deg)';
}
