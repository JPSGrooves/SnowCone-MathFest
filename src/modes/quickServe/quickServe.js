// 🍧 quickServe.js — Cosmic Scene Loader 🚛🔥

import './quickServe.css';
import { swapModeBackground, applyBackgroundTheme } from '../../managers/backgroundManager.js';
import { playTransition } from '../../managers/transitionManager.js';
import { appState } from '../../data/appState.js';
import { stopTrack, toggleMute } from '../../managers/musicManager.js';

import * as phil from './quickServePhil.js';
import * as gridFX from './quickServeGridFX.js';
import { setupKeypad, generateKeypadHTML } from './quickServeKeypad.js';
import { 
  startGameLogic, 
  stopGameLogic, 
  resetCurrentAnswer 
} from './quickServeGame.js';



import { playQSRandomTrack, stopQS } from './quickServeMusic.js';
import { activateInputHandler } from '../../managers/inputManager.js';
import { awardBadge } from '../../managers/badgeManager.js';




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
            You’ve got <strong>1 minute and 45 seconds</strong> to score as many points as you can!<br/>
            The tougher the math, the sweeter the reward!<br/>
            🎸 Rock on to your next high score!
          </div>

          <div class="phil-wrapper">
            <img 
              id="philSpriteIntro" 
              class="phil-img" 
              src="${import.meta.env.BASE_URL}assets/img/characters/quickServe/phil_intro.png"
            />
          </div>
          <button id="startShowBtn" class="start-show-btn">✨ Start the Show ✨</button>
          <button id="backToMenuBtn" class="back-to-menu-btn">🔙 Back to Menu</button>
        </div>
      </div>
    </div>
  `;

  phil.initPhil();
  repaintBackground();
  setupMuteButton();

  document.getElementById('startShowBtn')?.addEventListener('click', () => {
    playTransition(() => {
      playQSRandomTrack();  // 🎧 DJ Booth spins up
      renderGameUI();
    });
  });

  document.getElementById('backToMenuBtn')?.addEventListener('click', returnToMenu);
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
}


//////////////////////////////
// 🔊 Mute Button Logic
//////////////////////////////
function setupMuteButton() {
  const muteBtn = document.getElementById('muteBtn');
  if (!muteBtn) return;

  const updateLabel = () => {
    muteBtn.textContent = Howler._muted ? '🔇 Unmute' : '🔊 Mute';
  };

  muteBtn.addEventListener('click', () => {
    const nowMuted = toggleMute();  // 🔇 actually flip sound
    updateLabel();
  });


  updateLabel();
}

export function updateMuteButtonLabel() {
  const muteBtn = document.getElementById('muteBtn');
  if (!muteBtn) return;
  muteBtn.textContent = Howler._muted ? '🔇 Unmute' : '🔊 Mute';
}


//////////////////////////////
// 🔙 Return to Menu
//////////////////////////////
export function returnToMenu() {
  stopQS();      // 🔇 Kill QS booth
  stopTrack();   // 🔇 Just in case jukebox sneaks back (failsafe)

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

  stopQS(); // 🔇 Kill QuickServe music every single time cleanup is called
  stopGameLogic();
  gridFX.stopGridPulse();
  phil.resetPhil();
  resetCurrentAnswer();

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

function handleCorrect() {
  showResultMsg('✅ Correct!', '#00ffee', 3);
  score++;
  updateScore();
  appState.addXP(3);

  const xpMsg = document.getElementById('qsXPMsg');
  const resultMsg = document.getElementById('qsResultMsg');

  xpMsg.textContent = '🍧 +3 XP';
  resultMsg.textContent = '✅ Correct!';

  xpMsg.classList.remove('hidden', 'zero');
  resultMsg.classList.remove('hidden', 'error');
  resultMsg.style.color = '#00ff88'; // bright green if needed

  gridFX.bumpGridGlow();
  phil.bumpJam();
  playCorrect();

  checkBadgeUnlock();

  currentAnswer = '';
  updateAnswerDisplay();
  generateProblem();

  setTimeout(clearFeedback, 1500);
}
function handleIncorrect() {
  showResultMsg('❌ Nope!', '#ff4444', 0);
  const xpMsg = document.getElementById('qsXPMsg');
  const resultMsg = document.getElementById('qsResultMsg');

  xpMsg.textContent = '🍧 0 XP';
  resultMsg.textContent = '❌ Try Again';

  xpMsg.classList.remove('hidden');
  xpMsg.classList.add('zero');

  resultMsg.classList.remove('hidden');
  resultMsg.classList.add('error');

  resultMsg.style.color = '#ff4444'; // red

  gridFX.bumpGridGlow('bad');
  phil.triggerGlitch();
  playIncorrect();
  setTimeout(clearFeedback, 1500);
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
function checkQSBadges() {
  if (score >= 25)  awardBadge('quick_25');
  if (score >= 50)  awardBadge('quick_50');
  if (score >= 75)  awardBadge('quick_75');
  if (score >= 100) awardBadge('quick_100');
}
// call checkQSBadges() right after you bump score
export function finalizeQuickServeRun(runScore) {
  // pacing: ~1 XP per 2 points (tune as you like)
  const QS_XP_PER_POINT = 0.5;
  const xp = Math.max(0, Math.floor(runScore * QS_XP_PER_POINT));

  appState.addQuickServeXP(xp);      // ✅ fills QuickServe bucket (cap 500)
  appState.updateQuickServeHighScore(runScore);

  // sample badge thresholds you already planned
  if (runScore >= 25)  awardBadge('quick_25');
  if (runScore >= 50)  awardBadge('quick_50');
  if (runScore >= 75)  awardBadge('quick_75');
  if (runScore >= 100) awardBadge('quick_100');
}