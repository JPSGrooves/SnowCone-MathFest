// 🍧 quickServe.js — Cosmic Scene Loader 🚛🔥
// quickServe.js
import './quickServe.css';
import { swapModeBackground, applyBackgroundTheme } from '../../managers/backgroundManager.js';
import { playTransition } from '../../managers/transitionManager.js';
import { appState } from '../../data/appState.js';

// ✅ Use only musicManager (no separate QS Howl player anymore)
import {
  stopTrack,
  toggleMute,
  pushMusicScope,
  popMusicScope,
  playRandomTrack,
  setMusicPool,
  setShuffle,
  setLoop
} from '../../managers/musicManager.js';

import * as phil from './quickServePhil.js';
import * as gridFX from './quickServeGridFX.js';
import { setupKeypad, generateKeypadHTML } from './quickServeKeypad.js';
import {
  startGameLogic,
  stopGameLogic,
  resetCurrentAnswer
} from './quickServeGame.js';

import { activateInputHandler } from '../../managers/inputManager.js';
import { hapticSuccess } from '../../utils/haptics.js';


// ❌ no need to import awardBadge or finalizeQuickServeRun here
// import { awardBadge } from '../../managers/badgeManager.js';
// import { finalizeQuickServeRun } from './quickServeBadges.js';

const QS_TRACK_IDS = ['quikserve', 'kktribute', 'softdown'];
let _qsMusicScopeOn = false;


//////////////////////////////
// 🚀 Load QuickServe Mode
//////////////////////////////
export function loadQuickServe() {
  console.log('🍧 Loading QuickServe Mode');
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
}





//////////////////////////////
// 🎬 Intro Screen
//////////////////////////////
function renderIntroScreen() {
  const container = getGameContainer();

  container.innerHTML = `
    <div class="aspect-wrap">
      <div class="game-frame">
        <img id="modeBackground" class="background-fill" src="${import.meta.env.BASE_URL}assets/img/modes/quickServe/quickserveBG.png"/>
        <div class="qs-intro">
          <div class="phil-speech">
            Yo! I’m <strong>Cosmic Phil</strong>!<br/>
              See how many points you can stack in <strong>1:45</strong>.
              Harder problems hit harder — bigger points, bigger XP.<br/>
            🎸 Rock on to your next high score!
          </div>

          <div class="phil-wrapper">
            <img 
              id="philSpriteIntro" 
              class="phil-img" 
              src="${import.meta.env.BASE_URL}assets/img/characters/quickServe/phil_intro.png"
            />
          </div>

          <!-- keep Start button exactly as-is -->
          <button id="startShowBtn" class="start-show-btn">✨ Start the Show ✨</button>
        </div>

        <!-- ✅ Story-style bottom bar just for QS intro -->
        <div class="qs-bottom-bar">
          <button id="qsBackIntro" class="qs-square-btn qs-left">🔙</button>
        </div>
      </div>
    </div>
  `;

  phil.initPhil();
  repaintBackground();

  // Start the show
  document.getElementById('startShowBtn')?.addEventListener('click', () => {
    playTransition(() => {

      // 🎧 QS takes over music cleanly (curated pool + shuffle, no loop)
      if (!_qsMusicScopeOn) {
        pushMusicScope({ poolIds: QS_TRACK_IDS, shuffling: true, looping: false });
        _qsMusicScopeOn = true;
      } else {
        // safety if re-entering
        setMusicPool(QS_TRACK_IDS);
        setShuffle(true);
        setLoop(false);
      }

      // Start a random QS track; on end, musicManager sees shuffling=true and picks another.
      playRandomTrack();

      renderGameUI();
    });
  });

  // New square Back/Mute for intro
  document.getElementById('qsBackIntro')?.addEventListener('click', returnToMenu);



  // (leave setupMuteButton() out here; it targets in-game #muteBtn if present)
}


//////////////////////////////
// 🎮 Main Game Screen
//////////////////////////////
export function renderGameUI() {
  const container = getGameContainer();

  container.innerHTML = `
    <div class="aspect-wrap">
      <div class="game-frame">
        <img id="modeBackground" class="background-fill" src="${import.meta.env.BASE_URL}assets/img/modes/quickServe/quickserveBG.png"/>
        
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
                class="phil-img in-game"
                src="${import.meta.env.BASE_URL}assets/img/characters/quickServe/phil_01_idle.png"
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
              <button id="qsBackBtn" class="back-to-menu-btn">🔙 Back to Menu</button>
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
  setupMuteButton();
  startGameLogic();

  // 🔗 Wire up result popup buttons once DOM exists
  setupQuickServeResultButtons();
}

//////////////////////////////
// 🔊 Mute Button Logic
//////////////////////////////
function setupMuteButton() {
  const muteBtn = document.getElementById('muteBtn');
  if (!muteBtn) return;

  const getHowler = () => window.Howler ?? globalThis.Howler;

  const updateLabel = () => {
    const H = getHowler();
    const muted = !!H?._muted;
    muteBtn.textContent = muted ? '🔇 Unmute' : '🔊 Mute';
  };

  muteBtn.addEventListener('click', () => {
    // musicManager handles the actual muting
    toggleMute();
    updateLabel();
  });

  updateLabel();
}

export function updateMuteButtonLabel() {
  const muteBtn = document.getElementById('muteBtn');
  if (!muteBtn) return;
  const H = window.Howler ?? globalThis.Howler;
  const muted = !!H?._muted;
  muteBtn.textContent = muted ? '🔇 Unmute' : '🔊 Mute';
}


//////////////////////////////
// 🔙 Return to Menu
//////////////////////////////
export function returnToMenu() {
  // 🔇 Kill QS music (global player)
  stopTrack();

  // Restore whatever music state existed before QS took over
  if (_qsMusicScopeOn) {
    popMusicScope();
    _qsMusicScopeOn = false;
  }

  playTransition(() => {
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

    // 🧼 Clean the current run and fire up a fresh one
    stopGameLogic();
    resetCurrentAnswer();
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
