// 🍧 quickServe.js — Cosmic Scene Loader 🚛🔥

import './quickServe.css';
import { swapModeBackground, applyBackgroundTheme } from '../../managers/backgroundManager.js';
import { playTransition } from '../../managers/transitionManager.js';
import { appState } from '../../data/appState.js';
import { stopTrack, toggleMute } from '../../managers/musicManager.js';

import * as phil from './quickServePhil.js';
import * as gridFX from './quickServeGridFX.js';
import { generateKeypadHTML } from './quickServeKeypad.js';
import { 
  startGameLogic, 
  stopGameLogic, 
  resetCurrentAnswer, 
  setupKeypad 
} from './quickServeGame.js';

import { playQSRandomTrack, stopQS } from './quickServeMusic.js';

//////////////////////////////
// 🚀 Load QuickServe Mode
//////////////////////////////
export function loadQuickServe() {
  console.log('🍧 Loading QuickServe Mode');
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
    <div class="game-frame">
      <img id="modeBackground" class="background-fill" src="${import.meta.env.BASE_URL}assets/img/modes/quickServe/quickserveBG.png"/>
      <div class="qs-intro">
        <div class="phil-wrapper">
          <img 
            id="philSprite" 
            class="phil-img" 
            src="${import.meta.env.BASE_URL}assets/img/characters/quickServe/phil_01_idle.png"
            alt="Cosmic Phil"
          />
        </div>
        <button id="startShowBtn" class="start-show-btn">✨ Start the Show ✨</button>
        <button id="backToMenuBtn" class="back-to-menu-btn">🔙 Back to Menu</button>
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
function renderGameUI() {
  const container = getGameContainer();

  container.innerHTML = `
    <div class="game-frame">
      <img id="modeBackground" class="background-fill" src="${import.meta.env.BASE_URL}assets/img/modes/quickServe/quickserveBG.png"/>
      
      <div class="qs-grid">

        <!-- 🍧 Header -->
        <div class="qs-header">
          <h1>🍧 QuickServe Pavilion</h1>
        </div>

        <!-- 🎸 Stage -->
        <div class="qs-stage">
          <div class="phil-wrapper">
            <img 
              id="philSprite" 
              class="phil-img" 
              src="${import.meta.env.BASE_URL}assets/img/characters/quickServe/phil_01_idle.png" 
              alt="Cosmic Phil"
            />
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
          <div class="info-box">Score: <span id="qsScore">0</span></div>

          <div class="center-stack">
            <div class="math-problem" id="mathProblem">-- + -- = ?</div>
            <div id="answerDisplay" class="answer-display">0</div>
            <div class="qs-result-msg" id="qsResultMsg"></div>
          </div>

          <div class="info-box timer-box">⏱️ <span id="qsTimer">1:45</span></div>
        </div>

        <!-- 🎹 Keypad -->
        ${generateKeypadHTML()}

      </div>
    </div>
  `;

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
    toggleMute();
    updateLabel();
  });

  updateLabel();
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

//////////////////////////////
// 🚀 Scene Manager Hooks
//////////////////////////////
export { stopGameLogic as stopQuickServeGame } from './quickServeGame.js';
export { startGameLogic as startQuickServeGame } from './quickServeGame.js';
