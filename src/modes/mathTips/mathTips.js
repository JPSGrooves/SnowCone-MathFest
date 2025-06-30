import './mathTips.css';
import { swapModeBackground, applyBackgroundTheme } from '../../managers/backgroundManager.js';
import { playTransition } from '../../managers/transitionManager.js';
import { getResponse } from './qabot.js';
import { getIntroMessage } from './intro.js';
import { appState } from '../../data/appState.js';

// === 🔥 State
let inputEl, outputEl, sendBtn, returnBtn;

//////////////////////////////
// 🚀 Entry Point
//////////////////////////////
export function loadMathTips() {
  console.log('🧠 Loading Math Tips Mode');
  appState.setMode('mathtips');

  swapModeBackground('mathTips');

  const menuWrapper = document.querySelector('.menu-wrapper');
  const gameContainer = document.getElementById('game-container');

  menuWrapper?.classList.add('hidden');
  gameContainer.classList.remove('hidden');
  gameContainer.style.display = 'flex';

  renderUI();
  setupEventHandlers();
  startChat();
}

//////////////////////////////
// 💀 Exit Point
//////////////////////////////
export function stopMathTips() {
  const container = document.getElementById('game-container');
  container.innerHTML = '';
  container.classList.add('hidden');
  container.style.display = 'none';

  cleanupEventHandlers();

  console.log('🧠 Math Tips Mode cleaned up!');
}

//////////////////////////////
// 🎨 Render UI
//////////////////////////////
function renderUI() {
  const container = document.getElementById('game-container');

  container.innerHTML = `
    <div class="game-frame">
      <img id="modeBackground" class="background-fill" src="assets/img/modes/mathTips/mathtipsBG.png" alt="Math Tips Background" />
      <div class="mt-grid">
        <div class="mt-header">
          <h1>🧠 Math Tips Village</h1>
        </div>

        <div class="mt-content">
          <div class="chat-window" id="chatOutput"></div>
          <div class="chat-input-zone">
            <input id="userInput" type="text" placeholder="Ask something cosmic..." />
            <button id="sendBtn">Send</button>
          </div>
        </div>

        <div class="mt-footer">
          <button id="returnToMenu" class="btn-return">🔙 Return to Menu</button>
        </div>
      </div>
    </div>
  `;

  repaintBackground();

  // 🔗 Cache DOM
  inputEl = document.getElementById('userInput');
  outputEl = document.getElementById('chatOutput');
  sendBtn = document.getElementById('sendBtn');
  returnBtn = document.getElementById('returnToMenu');
}

//////////////////////////////
// 🚦 Event Handlers
//////////////////////////////
function setupEventHandlers() {
  sendBtn?.addEventListener('click', handleSend);
  inputEl?.addEventListener('keydown', handleKeyDown);
  returnBtn?.addEventListener('click', returnToMenu);
}

function cleanupEventHandlers() {
  sendBtn?.removeEventListener('click', handleSend);
  inputEl?.removeEventListener('keydown', handleKeyDown);
  returnBtn?.removeEventListener('click', returnToMenu);
}

//////////////////////////////
// 🔙 Return to Menu
//////////////////////////////
function returnToMenu() {
  playTransition(() => {
    stopMathTips();
    document.querySelector('.menu-wrapper')?.classList.remove('hidden');
    applyBackgroundTheme();
  });
}

//////////////////////////////
// 💬 Chat Logic
//////////////////////////////
function startChat() {
  outputEl.innerHTML = `<div class="cat-reply">🍧 ${getIntroMessage()}</div>`;
  scrollToBottom();
}

function handleSend() {
  const userText = inputEl.value.trim();
  if (!userText) return;

  appendMessage('user', userText);

  const reply = getResponse(userText);
  appendMessage('bot', reply);

  inputEl.value = '';
  inputEl.focus();
}

function handleKeyDown(e) {
  if (e.key === 'Enter') handleSend();
}

function appendMessage(sender, text) {
  const msgClass = sender === 'user' ? 'user-msg' : 'cat-reply';
  const prefix = sender === 'user' ? '🧠' : '🍧';
  outputEl.innerHTML += `<div class="${msgClass}">${prefix} ${text}</div>`;
  scrollToBottom();
}

function scrollToBottom() {
  outputEl.scrollTop = outputEl.scrollHeight;
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
