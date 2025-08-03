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




export function initParkingGame(container) {
  // Save reference to reset into later
  parkingRoot = container;
  honkMap.clear();
  parkedCars.clear();
  gameStarted = false;
  startTime = null;
  currentCarIndex = -1;
  sessionPoints = 0;

  const ordinals = ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th'];
  arrivalOrder = shuffle([...ordinals]);

  container.innerHTML = `
    <div class="kc-parking-wrap">
      <div id="parkingIntro" class="kc-parking-intro-row">
        <div class="kc-parking-intro">Park the Cars!</div>
      </div>

      <div id="honkLabel" class="kc-honk-label kc-hidden" style="grid-area: label;"></div>
      <div id="carContainer" class="kc-car-zone kc-hidden" style="grid-area: car;"></div>

      <button id="parkingCycleBtn" class="kc-park-image-btn" style="grid-area: button;" aria-label="Park Next Car">
        <img src="${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/parkButton.png" alt="Park Button" class="kc-park-icon" />
        <span class="kc-park-ring"></span>
      </button>
    </div>
  `;

  carZone = document.getElementById('carContainer');
  honkLabel = document.getElementById('honkLabel');
  parkBtn = document.getElementById('parkingCycleBtn');

  parkBtn?.addEventListener('pointerdown', () => {
    sessionPoints += 1;
    appState.incrementPopCount(1);
    updatePopUI?.();

    parkBtn.classList.add('clicked');
    setTimeout(() => parkBtn.classList.remove('clicked'), 200); // ⏱️ faster reset

    if (!gameStarted) {
      startGameTimer();
      document.getElementById('parkingIntro')?.classList.add('fade-out');

      setTimeout(() => {
        document.getElementById('parkingIntro')?.remove();
        cycleNextCar();
      }, 300);
    } else {
      cycleNextCar();
    }
  });
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
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
  if (!gameStarted) return;
  gameStarted = false; // ✅ Prevent duplicate calls
  console.log("🎉 triggerFinalCelebration() fired");
  console.log("🏁 parkedCars:", [...parkedCars]);
  console.log("🏁 sessionPoints:", sessionPoints);

  const elapsed = Date.now() - startTime;
  if (elapsed < 60000) {
    sessionPoints += 100;
  }

  appState.incrementPopCount(sessionPoints);
  checkXPBatchAwardFromTotal();
  updatePopUI?.();

  triggerConfetti();
  // 💨 Hide UI during finale
  if (honkLabel) {
    honkLabel.classList.add('kc-hidden');
    honkLabel.innerHTML = ''; // ✨💨 wipe it clean!
  }

  if (parkBtn) {
    parkBtn.classList.add('kc-hidden');
  }



  // 🎊 Reuse classic overlay for finale, but hold longer
  const finale = document.createElement('div');
  finale.className = 'kc-parked-overlay';
  finale.textContent = '🏁 All Parked!';
  carZone.appendChild(finale);

  // 🎛️ Extend duration manually (override fadeOut timing)
  finale.style.animation = 'none'; // 🚫 cancel default
  requestAnimationFrame(() => {
    finale.style.opacity = '1';
    finale.style.transition = 'opacity 0.4s ease';
  });

  // 🕓 Hold for 2s, then fade and remove
  setTimeout(() => {
    finale.style.opacity = '0';
    setTimeout(() => finale.remove(), 400);
  }, 2000);

  // ⏳ Final reset
  setTimeout(() => {
    resetGame();
  }, 2500);
}







function showCar(index) {
  carZone.innerHTML = '';

  const car = document.createElement('img');
  const carSprite = parkingSprites[index];
  car.src = `${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/${carSprite}`;
  car.className = 'kc-car-img';
  car.alt = `Car ${index + 1}`;
  car.onerror = () => {
    console.error('🚫 Failed to load:', car.src);
    car.remove(); // 🧼 cut the bad egg
    parkedCars.add(index); // auto-park broken ones
    cycleNextCar(); // move along!
  };


  car.addEventListener('pointerdown', () => handleHonk(index, car));
  carZone.appendChild(car);

  const honks = honkMap.get(index) || 0;
  const arrivalText = arrivalOrder[index] || `${index + 1}th`;

  honkLabel?.classList.remove('kc-hidden');
  carZone?.classList.remove('kc-hidden');

  honkLabel.innerHTML = renderHonkHTML(arrivalText, index, honks);
}



function handleHonk(index, carEl) {
  if (parkedCars.has(index)) return;

  let honks = honkMap.get(index) || 0;

  const honkLimit = index + 1;
  if (honks >= honkLimit) return;

  honks++;
  honkMap.set(index, honks);

  // 🎶 Play progression honk (loops 1–5)
  playHonkForCar(index);

  const arrivalText = arrivalOrder[index] || `${index + 1}th`;

  honkLabel.innerHTML = renderHonkHTML(arrivalText, index, honks);

  if (honks === honkLimit) {
    parkedCars.add(index);
    sessionPoints += 10;

    if (arrivalOrder[index] === `${ordinalSuffix(index + 1)}`) {
      sessionPoints += 50;
    }

    showParkedOverlay('🚗 PARKED!');
    playVictoryHonk(); // 🎺 Honk of Glory
    appState.incrementPopCount(sessionPoints);
    updatePopUI?.();
    checkXPBatchAwardFromTotal();

    setTimeout(() => {
      carEl?.remove();

      if (parkedCars.size >= parkingSprites.length) {
        // 🏁 Game done!
        honkLabel.classList.add('kc-hidden');
        parkBtn?.classList.add('kc-hidden');
        triggerFinalCelebration();
      } else {
        cycleNextCar();
      }
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
    volume: 0.15
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
}
