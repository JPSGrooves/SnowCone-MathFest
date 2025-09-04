// /src/modes/kidsCamping/parkingGame.js

import { Howl } from 'howler';
import { appState } from '../../data/appState.js';


const parkingSprites = [
  'car1.png', 'car2.png', 'dinoBus.png', 'iceCreamTruck.png',
  'golfCart.png', 'jeep.png', 'tentVan.png', 'campWagon.png',
  'festivalFloat.png', 'tinyUFO.png', 'colorfulCuteThankYouLetter.png'
];

let honkMap = new Map();
let parkedCars = new Set();
let currentCarIndex = 0;
let gameStarted = false;
let startTime = null;
let arrivalOrder = [];
let sessionPoints = 0;

let carZone = null;
let honkLabel = null;
let parkBtn = null;

let awardedXP = 0;

let parkingRoot = null;
let previousPopCount = 0; // stores last known XP state
// ===== Parking Intro (Mario Kart-style) =====
let introController = null;
let nextButtonHonkIdx = 0;
let finalElapsedMs = null; // ⏱️ frozen when the 11th car is parked


function prefersReducedMotion() {
  try { return matchMedia('(prefers-reduced-motion: reduce)').matches; }
  catch { return false; }
}

function buildIntroDOM(wrapEl) {
  const lane = document.createElement('div');
  lane.id = 'parkingIntroLane';
  lane.className = 'kc-parking-intro-lane';
  // force full row span (bulletproof)
  lane.style.gridColumn = '1 / -1';
  lane.style.gridRow = '2 / 3';
  lane.style.justifySelf = 'stretch';
  lane.style.alignSelf = 'stretch';

  const carArea = wrapEl.querySelector('.kc-car-zone');
  if (carArea?.parentNode) {
    carArea.parentNode.insertBefore(lane, carArea);
  } else {
    wrapEl.appendChild(lane);
  }
  return lane;
}

function startParkingIntro(wrapEl) {
  const lane = buildIntroDOM(wrapEl);
  let stopped = false;
  let order = shuffle([...parkingSprites]);   // random non-repeating order
  let idx = 0;

  const baseDur = prefersReducedMotion() ? 6 : 3.2;

  function spawnOne() {
    if (stopped) return;

    // wrapper that actually moves across full width
    const wrap = document.createElement('div');
    wrap.className = 'kc-intro-car-wrap';
    wrap.style.setProperty('--drive-dur', (baseDur + (Math.random()*0.6 - 0.3)).toFixed(2) + 's');

    // pivot: flips to face-left so it’s not “driving backwards”
    const pivot = document.createElement('div');
    pivot.className = 'kc-intro-car-pivot';

    // sprite (with bobble animation)
    const img = document.createElement('img');
    img.className = 'kc-intro-car';
    img.alt = 'Rolling to the lot…';
    img.src = `${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/${order[idx] || 'car1.png'}`;
    img.onerror = () => { img.src = `${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/car1.png`; };

    pivot.appendChild(img);
    wrap.appendChild(pivot);
    lane.appendChild(wrap);

    // when the pass finishes, remove and queue the next sprite
    const cleanupAndNext = () => {
      wrap.remove();
      if (stopped) return;
      idx = (idx + 1) % order.length;
      if (idx === 0) order = shuffle(order); // reshuffle each cycle
      spawnOne();
    };

    wrap.addEventListener('animationend', cleanupAndNext, { once: true });

    // just-in-case fallback (if animationend is ever missed)
    const safety = setTimeout(cleanupAndNext, (parseFloat(wrap.style.getPropertyValue('--drive-dur')) * 1000) + 200);
    wrap.addEventListener('animationend', () => clearTimeout(safety), { once: true });
  }

  spawnOne();

  return {
    stop() {
      if (stopped) return;
      stopped = true;
      lane.style.transition = 'opacity 220ms ease';
      lane.style.opacity = '0';
      setTimeout(() => lane.remove(), 240);
    }
  };
}

// simple Fisher-Yates
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}




export function initParkingGame(container) {
  // reset session state
  parkingRoot = container;
  honkMap.clear();
  parkedCars.clear();
  gameStarted = false;
  startTime = null;
  currentCarIndex = -1;
  sessionPoints = 0;
  finalElapsedMs = null; // ⬅️ add this

  const ordinals = ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th'];
  arrivalOrder = shuffle([...ordinals]);

  container.innerHTML = `
    <div class="kc-parking-wrap">
      <div id="parkingIntro" class="kc-parking-intro-row">
        <div class="kc-parking-intro">Park the Cars!</div>
      </div>

      <!-- 🛣️ intro lane gets injected before the real car zone -->

      <div id="honkLabel" class="kc-honk-label kc-hidden" style="grid-area: label;"></div>
      <div id="carContainer" class="kc-car-zone kc-hidden" style="grid-area: car;"></div>

      <button id="parkingCycleBtn" class="kc-park-image-btn" style="grid-area: button;" aria-label="Park Next Car">
        <img src="${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/parkButton.png" alt="Park Button" class="kc-park-icon" />
        <span class="kc-park-ring"></span>
      </button>
    </div>
  `;

  const wrapEl   = container.querySelector('.kc-parking-wrap');
  carZone        = document.getElementById('carContainer');
  honkLabel      = document.getElementById('honkLabel');
  parkBtn        = document.getElementById('parkingCycleBtn');

  // intro styling + animation
  wrapEl?.setAttribute('data-intro', 'on');
  introController = startParkingIntro(wrapEl);

  // single clean handler
  const onParkTap = () => {
    playButtonHonk();

    // tiny click pop (no duplicate)
    parkBtn.classList.add('clicked');
    setTimeout(() => parkBtn.classList.remove('clicked'), 140);

    // tiny point tick (keeps kids rewarded)
    sessionPoints += 1;
    appState.incrementPopCount(1);
    updatePopUI?.();

    // stop intro first time we interact
    if (introController) {
      introController.stop();
      introController = null;
      wrapEl?.removeAttribute('data-intro');
    }

    if (!gameStarted) {
      startGameTimer();
      const introRow = document.getElementById('parkingIntro');
      introRow?.classList.add('fade-out');

      setTimeout(() => {
        introRow?.remove();
        cycleNextCar();
        carZone?.classList.remove('kc-hidden');
        honkLabel?.classList.remove('kc-hidden');
      }, 300);
    } else {
      cycleNextCar();
    }
  };

  parkBtn?.addEventListener('pointerdown', onParkTap, { passive: true });
}

function showCar(index) {
  carZone.innerHTML = '';

  const holder = document.createElement('div');
  holder.className = 'kc-live-car-holder';
  carZone.appendChild(holder);

  const car = document.createElement('img');
  const carSprite = parkingSprites[index];
  car.src = `${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/${carSprite}`;
  car.className = 'kc-car-img';
  car.alt = `Car ${index + 1}`;

  // If a sprite fails, auto-park that slot so the run can still complete.
  car.onerror = () => {
    console.error('🚫 Failed to load:', car.src);
    try { holder.remove(); } catch {}
    parkedCars.add(index);

    // If that auto-park finished the set, freeze elapsed now and celebrate.
    if (parkedCars.size >= parkingSprites.length && startTime) {
      finalElapsedMs = Math.max(0, Date.now() - startTime);
      triggerFinalCelebration();
      return;
    }

    // Otherwise keep flowing
    cycleNextCar();
  };

  car.addEventListener('pointerdown', () => handleHonk(index, car));
  holder.appendChild(car);

  const honks = honkMap.get(index) || 0;
  const arrivalText = arrivalOrder[index] || `${index + 1}th`;

  honkLabel?.classList.remove('kc-hidden');
  carZone?.classList.remove('kc-hidden');
  honkLabel.innerHTML = renderHonkHTML(arrivalText, index, honks);
}


// ultra-smooth drive-out: pause bobble, then animate the wrapper left
function driveOutCar(carEl) {
  return new Promise((resolve) => {
    const holder = carEl.closest('.kc-live-car-holder') || carEl;

    // stop bobble/float on the IMG itself
    carEl.style.animation = 'none';
    carEl.style.willChange = 'auto';
    carEl.style.pointerEvents = 'none';

    // force style flush so the next animation starts clean
    // (avoids a 1-frame jump on Safari/iOS)
    void carEl.offsetWidth;

    // GPU nudge on the wrapper + run exit anim
    holder.style.transform = 'translateZ(0)';
    holder.classList.add('drive-out-left');
    holder.addEventListener('animationend', resolve, { once: true });
  });
}

function playButtonHonk() {
  const sfx = new Howl({
    src: [`${import.meta.env.BASE_URL}assets/audio/SFX/${honkSounds[nextButtonHonkIdx]}`],
    volume: 0.15
  });
  sfx.play();
  nextButtonHonkIdx = (nextButtonHonkIdx + 1) % honkSounds.length;
}


function cycleNextCar() {
  const totalCars = parkingSprites.length;
  if (parkedCars.size >= totalCars) {
    console.warn("✅ All cars parked. Triggering celebration manually.");
    triggerFinalCelebration();
    return;
  }

  const remaining = [];
  for (let i = 0; i < totalCars; i++) {
    if (!parkedCars.has(i)) remaining.push(i);
  }

  if (remaining.length === 0) {
    console.warn("🛑 No unparked cars left, but didn't trigger celebration. Forcing now.");
    triggerFinalCelebration();
    return;
  }

  // 🔁 Find next from current
  let start = (currentCarIndex + 1) % totalCars;
  let attempts = 0;

  while (attempts < totalCars) {
    const candidate = (start + attempts) % totalCars;
    if (!parkedCars.has(candidate)) {
      currentCarIndex = candidate;
      showCar(currentCarIndex);
      return;
    }
    attempts++;
  }

  console.error("❌ cycleNextCar() failed to find next index. Forcing celebration.");
  triggerFinalCelebration();
}

function triggerFinalCelebration() {
  // guard against re-entry
  if (!gameStarted) return;
  gameStarted = false;

  // Prefer the frozen time (captured when the 11th car was parked)
  const elapsed = (finalElapsedMs != null && Number.isFinite(finalElapsedMs))
    ? finalElapsedMs
    : (startTime ? (Date.now() - startTime) : Infinity);

  // “≤ 60s” earns a bonus
  const speedBonus = elapsed <= 60_000 ? 100 : 0;
  if (speedBonus) {
    appState.incrementPopCount(speedBonus);
    checkXPBatchAwardFromTotal();
    updatePopUI?.();
  }

  // 🎉 mini finale
  triggerConfetti();

  // hide live UI
  if (honkLabel) {
    honkLabel.classList.add('kc-hidden');
    honkLabel.innerHTML = '';
  }
  parkBtn?.classList.add('kc-hidden');

  // overlay
  const finale = document.createElement('div');
  finale.className = 'kc-parked-overlay';
  finale.textContent = '🏁 All Parked!';
  carZone.appendChild(finale);

  // fade in overlay (avoid CSS race)
  finale.style.animation = 'none';
  requestAnimationFrame(() => {
    finale.style.opacity = '1';
    finale.style.transition = 'opacity 0.4s ease';
  });

  // 🔔 dispatch completion once with the elapsed
  parkingRoot?.dispatchEvent(new CustomEvent('kcParkingComplete', {
    detail: { elapsedMs: elapsed },
    bubbles: true
  }));

  // fade out + cleanup
  setTimeout(() => {
    finale.style.opacity = '0';
    setTimeout(() => finale.remove(), 400);
  }, 2000);

  // reset back to intro
  setTimeout(() => { resetGame(); }, 2500);
}




function handleHonk(index, carEl) {
  // already parked? ignore
  if (parkedCars.has(index)) return;

  let honks = honkMap.get(index) || 0;
  const honkLimit = index + 1;
  if (honks >= honkLimit) return;

  // count a honk
  honks++;
  honkMap.set(index, honks);

  // sfx + label
  playHonkForCar(index);
  const arrivalText = arrivalOrder[index] || ordinalSuffix(index + 1);
  if (honkLabel) {
    honkLabel.innerHTML = renderHonkHTML(arrivalText, index, honks);
  }

  // reached the needed honks => park this car
  if (honks === honkLimit) {
    parkedCars.add(index);

    // ⏱️ if that was the final car, freeze the elapsed now (before any overlay/animations)
    if (parkedCars.size >= parkingSprites.length && startTime) {
      finalElapsedMs = Math.max(0, Date.now() - startTime);
    }

    // points: award only the delta for THIS car
    const base = 10;
    const ordinalBonus = (arrivalOrder[index] === ordinalSuffix(index + 1)) ? 50 : 0;
    const delta = base + ordinalBonus;

    sessionPoints += delta;               // track session total for display/summary
    appState.incrementPopCount(delta);    // award just this car’s delta
    updatePopUI?.();
    checkXPBatchAwardFromTotal();

    // refresh label once more so the parked count reflects the new state
    if (honkLabel) {
      honkLabel.innerHTML = renderHonkHTML(arrivalText, index, honks);
    }

    showParkedOverlay('🚗 PARKED!');
    playVictoryHonk();

    // let the PARKED overlay breathe, then drive out + continue or finish
    setTimeout(() => {
      const proceed = () => {
        if (parkedCars.size >= parkingSprites.length) {
          honkLabel?.classList.add('kc-hidden');
          parkBtn?.classList.add('kc-hidden');
          triggerFinalCelebration();
        } else {
          cycleNextCar();
        }
      };

      if (!carEl) { proceed(); return; }
      driveOutCar(carEl).then(() => { try { carEl.remove(); } catch {} proceed(); });
    }, 800);
  }
}






function renderHonkHTML(arrivalText, index, honks) {
  return `
    <div style="text-align: center;">
      <div style="font-size: 1.2em; font-weight: bold;">Park ${arrivalText}</div>
      <div>${Math.min(honks, index + 1)} / ${index + 1}</div>
      <div>Honks</div>
      <div style="height: 0.2em;"></div> <!-- 🍩 tiny spacer -->
      <div class="kc-parked-count">Cars Parked<br/>${parkedCars.size} / ${parkingSprites.length}</div>
    </div>
  `;
}



function ordinalSuffix(n) {
  if (n === 1) return '1st';
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return `${n}th`;
}


function checkXPBatchAwardFromTotal() {
  const current = appState.popCount;
  const currentXP = Math.floor(current / 100) * 10;
  const previousXP = Math.floor(previousPopCount / 100) * 10;

  const newXP = currentXP - previousXP;
  if (newXP > 0) {
    appState.addXP(newXP);
  }

  previousPopCount = current; // update checkpoint
}


function showParkedOverlay(text) {
  const overlay = document.createElement('div');
  overlay.className = 'kc-parked-overlay';
  overlay.textContent = text;

  // 🍬 Start hidden so we can animate in
  overlay.style.opacity = 0;
  overlay.style.transition = 'opacity 0.4s ease';

  carZone.appendChild(overlay);

  // 🌀 Animate in
  requestAnimationFrame(() => {
    overlay.style.opacity = 1;
  });

  // 🕒 Animate out after delay
  setTimeout(() => {
    overlay.style.opacity = 0;
    setTimeout(() => overlay.remove(), 500); // give it time to fade out
  }, 2000); // 👈 stays for 2s, then fades out over 0.5s
}


function triggerConfetti() {
  const confetti = document.createElement('div');
  confetti.className = 'kc-parked-overlay';
  confetti.textContent = '🎉🎉🎉';

  confetti.style.opacity = 0;
  confetti.style.transition = 'opacity 0.4s ease';

  carZone.appendChild(confetti);

  requestAnimationFrame(() => {
    confetti.style.opacity = 1;
  });

  setTimeout(() => {
    confetti.style.opacity = 0;
    setTimeout(() => confetti.remove(), 500);
  }, 2000);
}


function resetGame() {
  if (!parkingRoot) return;
  gameStarted = false; // 🧠 make sure intro works again
  parkingRoot.innerHTML = '';
  initParkingGame(parkingRoot);
}



function startGameTimer() {
  gameStarted = true;
  startTime = Date.now();
  console.log('⏱️ Parking timer started');
}

const honkSounds = [
  'honk1.mp3', 'honk2.mp3', 'honk3.mp3',
  'honk4.mp3', 'honk5.mp3'
];

function playHonkForCar(index) {
  const honksSoFar = honkMap.get(index) || 0;
  const soundIndex = honksSoFar % honkSounds.length;
  const sfx = new Howl({
    src: [`${import.meta.env.BASE_URL}assets/audio/SFX/${honkSounds[soundIndex]}`],
    volume: 0.18
  });
  sfx.play();
}

function playVictoryHonk() {
  const sfx = new Howl({
    src: [`${import.meta.env.BASE_URL}assets/audio/SFX/honk1.mp3`],
    volume: 0.15
  });
  sfx.play();
}


function updatePopUI() {
  const popSpan = document.getElementById('popCount');
  if (popSpan) popSpan.textContent = appState.popCount;
  try { document.dispatchEvent(new CustomEvent('campScoreUpdated', { detail: appState.popCount })); } catch {}
}

