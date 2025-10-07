// /src/modes/infinity/infinityMode.js

import './infinityMode.css';
import { swapModeBackground, applyBackgroundTheme } from '../../managers/backgroundManager.js';
import { playTransition } from '../../managers/transitionManager.js';
import { appState } from '../../data/appState.js';
import { startTripletLoop, stopTripletLoop, startTripletSequence } from './tripletAnimator.js';
import { stopTrack, toggleMute } from '../../managers/musicManager.js';
import { activateInputHandler } from '../../managers/inputManager.js';
import { launchConfetti } from '../../utils/confetti.js';
import { runInAction } from 'mobx';
import { playInfinityLoop } from '../../managers/musicManager.js';
import { awardBadge } from '../../managers/badgeManager.js';







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
const sfxIntervals = [3, 6, 9, 6, 3, 6, 9]; // Your exact pattern: 3 6 9 6 3 6 9 etc
let patternIndex = 0;
let nextTrigger = sfxIntervals[0];
// state near the other lets
let solvedCount = 0;     // how many problems the player solved this run
let currentMode = 'addsub'; // you use this but never declared it

// ⬇️ replace the old checkInfinityBadges() with this
function checkInfinityBadgesByScore() {
  const seconds = Math.floor((Date.now() - startTime) / 1000);

  // 🏅 time-gated, score-based thresholds
  // (keeping numeric thresholds identical to your old attempt counts: 25, 50, 100, 250 — now interpreted as POINTS)
  if (score >= 25  && seconds <= 60)   awardBadge('inf_25_1min');
  if (score >= 50  && seconds <= 120)  awardBadge('inf_50_2min');
  if (score >= 100 && seconds <= 240)  awardBadge('inf_100_4min');
  if (score >= 250 && seconds <= 600)  awardBadge('inf_250_10min');
}


export function loadInfinityMode() {
  console.log('♾️ Loading Infinity Mode');
  activateInputHandler('infinity');
  document.body.classList.add('il-active');
  appState.setMode('infinity');
  appState.setGameMode('addsub'); // 🌊 Default to +/- combo mode
  stopTrack(); // 🔇 stop jukebox track cold on entry

  const menuWrapper = document.querySelector('.menu-wrapper');
  const gameContainer = document.getElementById('game-container');

  menuWrapper?.classList.add('hidden');
  gameContainer.classList.remove('hidden');
  gameContainer.style.display = 'flex';

  renderIntroScreen();
  document.getElementById('ilBackIntro')?.addEventListener('click', returnToMenu);
  setTimeout(() => {
    startTripletLoop('intro', 'tripletSpriteIntro', 500);
  }, 100);


  // 🎨 Swap IL background (on first load and again later if needed)
  swapModeBackground('assets/img/modes/infinityLake/infinityBG.png');

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
        swapModeBackground('assets/img/modes/infinityLake/infinityBG.png');
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
  const container = document.getElementById('game-container');
  container.innerHTML = '';
  container.classList.add('hidden');
  container.style.display = 'none';

  cleanupEventHandlers();
  console.log('♾️ Infinity Mode cleaned up!');
}
function renderIntroScreen() {
  const container = document.getElementById('game-container');

  container.innerHTML = `
    <div class="il-aspect-wrap">
      <div class="il-game-frame">
        <img 
          class="background-fill"
          src="${import.meta.env.BASE_URL}assets/img/modes/infinityLake/infinityBG.png" 
          alt="Infinity Lake Background"
        />

        <!-- 🧊 INFINITY INTRO STACK -->
        <div class="il-intro">
          <div class="il-intro-stack">
            <div class="il-speech">
              Hi! We're the <strong>Infinity Triplets</strong>!<br>
              We keep the math beats pumping all night long!<br>
              Infinity Awaits!
            </div>

            <div class="triplet-wrapper">
              <img 
                id="tripletSpriteIntro" 
                class="triplet-img" 
                src="${import.meta.env.BASE_URL}assets/img/characters/infinityLake/il_intro.png"
              />
            </div>

            <!-- ✅ Keep Start button in the stack -->
            <button id="startInfinitySet" class="il-intro-btn start-show-btn">
              🎶 Start the Set 🎶
            </button>
          </div>

          <!-- ✅ QS/Story-style bottom bar (intro only) -->
          <div class="il-bottom-bar">
            <button id="ilBackIntro" class="il-square-btn il-left">🔙</button> <!-- ✅ no global class -->
          </div>
        </div>
      </div>
    </div>
  `;
}


function switchMode(mode) {
  currentMode = mode;
  updateModeButtonUI();
  newProblem();               // ⬅️ was generateNewProblem(); fix the name
}


function renderUI() {
  const container = document.getElementById('game-container');
  container.innerHTML = `
    <div class="il-aspect-wrap">
      <div class="il-game-frame">
        <img 
          id="modeBackground" 
          class="background-fill" 
          src="${import.meta.env.BASE_URL}assets/img/modes/infinityLake/infinityBG.png" 
        />
        <div class="il-grid">

          <!-- 🌊 Title -->
          <div class="il-title">Infinity Lake</div>

          <!-- 🎶 Stage Row (Triplets + Score) -->
          <div class="il-stage">
            <img 
              id="tripletSpriteGame" 
              class="il-triplet-img fade-in" 
              src="${import.meta.env.BASE_URL}assets/img/characters/infinityLake/il_openSet.png"
            />
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

            <!-- 🌟 Wrap the score + streak in a horizontal row -->
            <div class="il-metric-row">
              <div class="il-score-box">Score: <span id="infScore">0</span></div>
              <div class="il-streak-box">Streak: <span id="infStreak">0</span></div>
            </div>
          </div>

          <!-- 🎛️ Controls Grid -->
          <div class="il-controls">
            <div class="mode-buttons">
              <button data-mode="addsub">+/−<br>Mode</button>
              <button data-mode="multdiv">×÷<br>Mode</button>
              <button data-mode="alg">𝒙<br>Mode</button>
            </div>
            <div class="utility-buttons">
              <button id="backToMenu">Main<br>Menu</button>
              <button id="endGame">End<br>♾️</button>
              <button id="muteToggle">🔇<br>Mute</button>
            </div>
          </div>

        </div>
        <div class="il-result-popup hidden" id="ilResultPopup">
          <h2>🎉 Set Complete!</h2>

          <p><strong>Score:</strong> <span id="ilScoreFinal">0</span></p>
          <p><strong>High Score:</strong> <span id="ilHighScore">0</span></p>
          <p><strong>Longest Streak:</strong> <span id="ilStreak">0</span></p>
          <p><strong>Time Played:</strong> <span id="ilTime">0:00</span></p>

          <div class="il-result-buttons">
            <button id="ilPlayAgainBtn" class="start-show-btn">🔁 Play Again</button>
            <button id="ilBackBtn" class="back-to-menu-btn">🔙 to Menu</button>
          </div>
        </div>
      </div>
    </div>
  `;

  problemEl = document.getElementById('mathProblem');
  answerBtns = Array.from(document.querySelectorAll('.ans-btn'));
  scoreDisplay = document.getElementById('infScore');
  resultMsg = document.getElementById('coneResultMsg');
}

function setupEventHandlers() {
  document.getElementById('backToMenu')?.addEventListener('click', () => {
    activateInputHandler(null); // disable hotkeys
    document.body.classList.remove('il-active', 'qs-active');
    returnToMenu(); // or whatever scene-switcher you use
  });
  document.getElementById('resetGame')?.addEventListener('click', startGame);
  document.getElementById('endGame')?.addEventListener('click', () => {
    console.log('🛑 End Game pressed – show result popup here');
    // Future: showResultPopup(); or renderEndGameStats();
  });
  document.getElementById('ilPlayAgainBtn')?.addEventListener('click', () => {
    closeResultPopup();
    startGame();
  });

  document.getElementById('ilBackBtn')?.addEventListener('click', () => {
    closeResultPopup();
    returnToMenu();
  });
  document.getElementById('endGame')?.addEventListener('click', () => {
    console.log('🛑 End Game pressed – show result popup here');

    // replace with real values when you track them
    showResultPopup({
      score: score,
      highScore: appState.profile.infinityHighScore || 0,
      streak: 0,
      time: '1:45'
    });
  });

  answerBtns.forEach(btn => btn.addEventListener('click', () => handleAnswer(btn)));

  // Add these 👇
  document.querySelectorAll('.mode-buttons button').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      if (!mode) return;
      appState.setGameMode(mode);
      updateModeButtonUI();
      newProblem();
      flashModeName();
    });
  });
  function updateMuteButtonLabel() {
    const icon = document.getElementById('muteToggle');
    const muted = Howler._muted;
    if (icon) {
      icon.innerHTML = muted ? '🔇<br>Unmute' : '🔊<br>Mute';
    }
  }

  document.getElementById('muteToggle')?.addEventListener('click', () => {
    toggleMute();
    updateMuteButtonLabel();
    flashMuteIcon();
  });


}



function cleanupEventHandlers() {
  document.getElementById('backToMenu')?.removeEventListener('click', returnToMenu);
  document.getElementById('resetGame')?.removeEventListener('click', startGame);
  document.getElementById('endGame')?.removeEventListener('click', () => {});


  if (!answerBtns || !Array.isArray(answerBtns)) return; // 🍃 Chill if no game yet

  answerBtns.forEach(btn => btn.removeEventListener('click', handleAnswer));
}



function returnToMenu() {
  stopTrack(); // 💥 nukes the Howl
  playTransition(() => {
    stopInfinityMode();
    document.querySelector('.menu-wrapper')?.classList.remove('hidden');
    applyBackgroundTheme();
  });
}

function startGame() {
  score = 0;
  streak = 0;
  maxStreak = 0; // Reset session max
  solvedCount = 0;            // ⬅️ reset
  streakFlipFlop = true; // Start with milestone SFX
  patternIndex = 0;
  nextTrigger = sfxIntervals[0]; // First trigger at 3
  updateScore();
  updateStreak();
  newProblem();
  startTime = Date.now();
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

  switch (mode) {
    case 'addsub': {
      const head = `<span class="il-problem-head">Add. and Sub.</span>`;
      if (addsubToggle) {
        correctAnswer = a + b;
        question = `${head}<br>${a} + ${b} = ?`;
      } else {
        correctAnswer = a - b;
        question = `${head}<br>${a} − ${b} = ?`;
      }
      addsubToggle = !addsubToggle;
      break;
    }

    case 'multdiv': {
      const head = `<span class="il-problem-head">Mult. and Div.</span>`;
      if (multdivToggle) {
        correctAnswer = a * b;
        question = `${head}<br>${a} × ${b} = ?`;
      } else {
        // clean division
        b = Math.floor(Math.random() * 9) + 1;           // 1–9
        correctAnswer = Math.floor(Math.random() * 10) + 1; // 1–10
        a = b * correctAnswer;
        question = `${head}<br>${a} ÷ ${b} = ?`;
      }
      multdivToggle = !multdivToggle;
      break;
    }

    case 'alg': {
      const head = `<span class="il-problem-head">Solve for 𝒙</span>`;
      const ops = ['+', '-', '×', '÷'];
      let op = ops[Math.floor(Math.random() * ops.length)];
      let result;

      correctAnswer = a; // default

      if (op === '+') {
        result = a + b;
        question = `${head}<br>𝒙 + ${b} = ${result}`;
      }
      else if (op === '-') {
        result = a - b;
        question = `${head}<br>𝒙 − ${b} = ${result}`;
      }
      else if (op === '×') {
        result = a * b;
        correctAnswer = a;
        question = `${head}<br>𝒙 × ${b} = ${result}`;
      }
      else if (op === '÷') {
        // clean division: a = b * x
        correctAnswer = Math.floor(Math.random() * 10) + 1;
        b = Math.floor(Math.random() * 9) + 1;
        a = b * correctAnswer;
        question = `${head}<br>${a} ÷ 𝒙 = ${b}`;
      }

      break;
    }

  }



  currentCorrect = correctAnswer;

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
  }



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
    handleIncorrect();
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
  solvedCount++; // ✅ safe to keep for analytics if you still want attempts tracked

  // ⬇️ score-based badge checks (replaces the attempts-based call)
  checkInfinityBadgesByScore();

  // 🎯 Interval SFX logic (unchanged)
  console.log(`🌈 Streak now at: ${streak}`);
  if (streak === nextTrigger) {
    console.log('💥 Triggering SFX burst!');
    playStreakBurst();
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


function handleIncorrect() {
  streak = 0;
  updateStreak();
  showResult('❌ Nope. Try again!', '#ff5555');
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
function showResultPopup() {
  const popup = document.getElementById('ilResultPopup');
  if (!popup) return;

  const endTime = Date.now();
  const elapsed = formatElapsedTime(endTime - startTime);

  const isNewHighScore = score > (appState.profile.infinityHighScore || 0);
  const isNewStreak = streak > (appState.profile.infinityLongestStreak || 0);

  if (isNewHighScore) {
    appState.profile.infinityHighScore = score;
    launchConfetti(); // or `launchConfetti('score')`
  }

  if (isNewStreak) {
    appState.profile.infinityLongestStreak = streak;
    launchConfetti(); // or `launchConfetti('streak')`
  }


  document.getElementById('ilScoreFinal').textContent = score;
  document.getElementById('ilHighScore').textContent = appState.profile.infinityHighScore;
  document.getElementById('ilStreak').textContent = appState.profile.infinityLongestStreak;
  document.getElementById('ilTime').textContent = elapsed;
  document.getElementById('ilStreak').textContent = appState.profile.infinityLongestStreak;

  popup.classList.remove('hidden');
}

function closeResultPopup() {
  const popup = document.getElementById('ilResultPopup');
  if (popup) popup.classList.add('hidden');
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



function flashModeName() {
  const el = document.createElement('div');
  el.className = 'mode-flash';
  el.textContent = getCurrentModeName(); // Like "Algebra Mode"
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}
function flashMuteIcon() {
  const icon = document.querySelector('#muteIcon'); // Whatever ID/class you use
  if (!icon) return;
  icon.classList.add('flash');
  setTimeout(() => icon.classList.remove('flash'), 400);
}

export function updateMuteButtonLabel() {
  const icon = document.getElementById('muteToggle');
  const muted = Howler._muted;
  if (icon) {
    icon.innerHTML = muted ? '🔇<br>Unmute' : '🔊<br>Mute';
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

function endInfinityGame() {
  console.log('♾️ Ending Infinity Mode...');
  
  const endTime = Date.now();
  const elapsed = formatElapsedTime(endTime - startTime);

  const isNewHighScore = score > (appState.profile.infinityHighScore || 0);
  const isNewStreak = maxStreak > (appState.profile.infinityLongestStreak || 0);

  runInAction(() => {
    if (isNewHighScore) {
      appState.profile.infinityHighScore = score;
    }

    if (isNewStreak) {
      appState.profile.infinityLongestStreak = maxStreak;
    }
  });

  showResultPopup({
    score,
    highScore: appState.profile.infinityHighScore,
    streak: appState.profile.infinityLongestStreak,
    time: elapsed
  });

  if (isNewHighScore || isNewStreak) {
    launchConfetti(); // 💥 celebrate after showing results
  }
}


function playStreakBurst() {
  console.log('💥 Triggering SFX burst!');
  const file = streakFlipFlop
    ? 'QuikServemilestone.mp3'
    : 'QuikServepoints100.mp3';

  const sfx = new Howl({
    src: [`${import.meta.env.BASE_URL}assets/audio/SFX/${file}`],
    volume: 1.0
  });

  sfx.play();
  streakFlipFlop = !streakFlipFlop;
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

  if (sc >= 25  && seconds <= 60)   awardBadge('inf_25_1min');
  if (sc >= 50  && seconds <= 120)  awardBadge('inf_50_2min');
  if (sc >= 100 && seconds <= 240)  awardBadge('inf_100_4min');
  if (sc >= 250 && seconds <= 600)  awardBadge('inf_250_10min');
}
