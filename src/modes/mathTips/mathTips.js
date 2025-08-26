// /src/modes/mathTips/mathTips.js
import './mathTips.css';
import { swapModeBackground, applyBackgroundTheme } from '../../managers/backgroundManager.js';
import { playTransition } from '../../managers/transitionManager.js';
import { getResponse } from './qabot.js';
import { getIntroMessage } from './intro.js';
import { appState } from '../../data/appState.js';

// === 🔥 Mode-local state (no globals)
let inputEl, outputEl, sendBtn, returnBtn;

const MT = {
  containerSel: '#game-container',
  menuSel: '.menu-wrapper',
  bootLock: false,
  handlers: {
    startIntro: null,
    backIntro: null,
    sendClick: null,
    keydown: null,
    backMain: null,
  }
};

export function loadMathTips() {
  console.log('🧠 Loading Math Tips Mode');
  appState.setMode('mathtips');

  // lock in the new mobile bg (no filters on top)
  // (use swapModeBackground if you map keys internally; else apply explicit path)
  try {
    swapModeBackground('mathTips');
  } catch {
    applyBackgroundTheme(`${import.meta.env.BASE_URL}assets/img/modes/mathTips/mathtipsBG.png`);
  }

  // show container / hide menu
  const container = document.querySelector(MT.containerSel);
  const menu = document.querySelector(MT.menuSel);
  menu?.classList.add('hidden');
  if (container) {
    container.classList.remove('hidden');
    container.style.display = 'flex';
  }

  renderIntroScreen();
  wireIntroHandlers();
}

export function stopMathTips() {
  const container = document.querySelector(MT.containerSel);
  if (container) {
    container.innerHTML = '';
    container.classList.add('hidden');
    container.style.display = 'none';
  }
  unwireIntroHandlers();
  unwireMainHandlers();
  console.log('🧠 Math Tips Mode cleaned up!');
}

// ────────────────────────────────────────────────────────────────────────────────
// Intro Screen (no overlay filter)
// ────────────────────────────────────────────────────────────────────────────────
function renderIntroScreen() {
  const container = document.querySelector(MT.containerSel);
  if (!container) return;

  container.innerHTML = `
    <div class="mt-aspect-wrap">
      <div class="mt-game-frame">
        <img id="modeBackground" class="background-fill mt-bg-img"
             src="${import.meta.env.BASE_URL}assets/img/modes/mathTips/mathtipsBG.png"
             alt="MathTips Background"/>

        <div class="mt-intro">
          <div class="mt-intro-stack">
            <div class="mt-speech allow-select">
              ${getIntroMessage(appState)}
            </div>

            <div class="mt-avatar-wrap">
              <img class="mt-avatar mt-avatar--xxl"
                   src="${import.meta.env.BASE_URL}assets/img/characters/mathTips/grampyP.png"
                   alt="Grampy P"/>
            </div>

            <div class="mt-intro-bottom-btns">
              <button id="mtBack"   class="mt-btn mt-btn-pink">🔙 Return to Menu</button>
              <button id="mtStart"  class="mt-btn mt-btn-cyan">🍧 Get Some Tips!</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function wireIntroHandlers() {
  const start = document.getElementById('mtStart');
  const back  = document.getElementById('mtBack');

  MT.handlers.startIntro = async () => {
    if (MT.bootLock) return;
    MT.bootLock = true;

    const intro = document.querySelector('.mt-intro');
    intro?.classList.add('fade-out');
    setTimeout(() => {
      renderMainUI();
      wireMainHandlers();
      MT.bootLock = false;
    }, 420);
  };

  MT.handlers.backIntro = () => {
    returnToMenu();
  };

  start?.addEventListener('click', MT.handlers.startIntro);
  back?.addEventListener('click', MT.handlers.backIntro);
}

function unwireIntroHandlers() {
  const start = document.getElementById('mtStart');
  const back  = document.getElementById('mtBack');
  if (start && MT.handlers.startIntro) start.removeEventListener('click', MT.handlers.startIntro);
  if (back && MT.handlers.backIntro)   back.removeEventListener('click', MT.handlers.backIntro);
  MT.handlers.startIntro = MT.handlers.backIntro = null;
}

// ────────────────────────────────────────────────────────────────────────────────
function renderMainUI() {
  const container = document.querySelector(MT.containerSel);
  if (!container) return;

  container.innerHTML = `
    <div class="mt-aspect-wrap">
      <div class="mt-game-frame">
        <img id="modeBackground" class="background-fill mt-bg-img"
             src="${import.meta.env.BASE_URL}assets/img/modes/mathTips/mathtipsBG.png"
             alt="MathTips Background"/>

        <div class="mt-grid"><!-- slimmer, no heavy blur -->
          <div class="mt-header">
            <h1>🧠 Math Tips Village</h1>
          </div>

          <div class="mt-content">
            <div class="chat-window" id="chatOutput"></div>
            <div class="chat-input-zone">
              <input id="userInput" type="text" placeholder="Ask something cosmic…" />
              <button id="sendBtn">Send</button>
            </div>
          </div>

          <div class="mt-footer">
            <button id="returnToMenu" class="mt-btn mt-btn-pink">🔙 Return to Menu</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // cache
  inputEl   = document.getElementById('userInput');
  outputEl  = document.getElementById('chatOutput');
  sendBtn   = document.getElementById('sendBtn');
  returnBtn = document.getElementById('returnToMenu');

  // first line
  startChat();
}

function wireMainHandlers() {
  MT.handlers.sendClick = () => handleSend();
  MT.handlers.keydown   = (e) => { if (e.key === 'Enter') handleSend(); };
  MT.handlers.backMain  = () => returnToMenu();

  sendBtn?.addEventListener('click', MT.handlers.sendClick);
  inputEl?.addEventListener('keydown', MT.handlers.keydown);
  returnBtn?.addEventListener('click', MT.handlers.backMain);
}

function unwireMainHandlers() {
  sendBtn?.removeEventListener('click', MT.handlers.sendClick);
  inputEl?.removeEventListener('keydown', MT.handlers.keydown);
  returnBtn?.removeEventListener('click', MT.handlers.backMain);
  MT.handlers.sendClick = MT.handlers.keydown = MT.handlers.backMain = null;
}

// ────────────────────────────────────────────────────────────────────────────────
// Chat logic (unchanged vibe)
// ────────────────────────────────────────────────────────────────────────────────
function startChat() {
  if (!outputEl) return;
  // seed the chat window with the same intro “brain” used on the splash
  outputEl.innerHTML = `<div class="cat-reply">🍧 ${getIntroMessage(appState)}</div>`;
  scrollToBottom();
}


function handleSend() {
  const raw = inputEl?.value ?? '';
  const userText = raw.trim();
  if (!userText) return;

  // show user line (escaped inside appendMessage)
  appendMessage('user', userText);

  // get bot reply (HTML produced but sanitized in builder)
  const replyHtml = getResponse(userText, appState);

  // append bot line
  appendMessage('bot', replyHtml, /* alreadyHtml */ true);

  // clear
  inputEl.value = '';
  inputEl.focus();
}

function appendMessage(sender, textOrHtml, alreadyHtml = false) {
  const msgClass = sender === 'user' ? 'user-msg' : 'cat-reply';
  const prefix = sender === 'user' ? '🧠' : '🍧';

  const safe = alreadyHtml
    ? String(textOrHtml) // qabot already escaped/sanitized its HTML output
    : String(textOrHtml)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');

  outputEl.innerHTML += `<div class="${msgClass}">${prefix} ${safe}</div>`;
  scrollToBottom();
}

function scrollToBottom() {
  outputEl.scrollTop = outputEl.scrollHeight;
}

// ────────────────────────────────────────────────────────────────────────────────
function returnToMenu() {
  playTransition(() => {
    stopMathTips();
    document.querySelector(MT.menuSel)?.classList.remove('hidden');
    applyBackgroundTheme(); // return to menu theme
  });
}
