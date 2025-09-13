import './mathTips.css';
import { swapModeBackground, applyBackgroundTheme } from '../../managers/backgroundManager.js';
import { playTransition } from '../../managers/transitionManager.js';
import { getIntroMessage } from './intro.js';
import { appState } from '../../data/appState.js';
import { getResponse } from './qabot.js';
import { awardBadge } from '../../managers/badgeManager.js';



// === 🔥 Mode-local state (no globals)
let inputEl, outputEl, sendBtn, returnBtn;
let copyBtn, exportBtn;

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
    copyTx: null,
    expJson: null,
  }
};

// ── universal mode handler resolver ─────────────────────────────────────
function resolveModeHandler(modeKey) {
  const mod = MODEx?.[modeKey];
  if (!mod) return null;

  // case A: module itself is a function
  if (typeof mod === 'function') return mod;

  // case B: common method names
  if (typeof mod.handle === 'function') return mod.handle.bind(mod);
  if (typeof mod.start === 'function')  return mod.start.bind(mod);
  if (typeof mod.reply === 'function')  return mod.reply.bind(mod);
  if (typeof mod.run === 'function')    return mod.run.bind(mod);

  // case C: nothing usable
  return null;
}

// call a mode defensively; return null if not callable
function callMode(modeKey, text, extra = {}) {
  try {
    const fn = resolveModeHandler(modeKey);
    if (!fn) return null;
    // many of your modules accept (text, ctx) — pass both safely
    return fn(text, extra);
  } catch (err) {
    console.warn(`[callMode] ${modeKey} crashed:`, err);
    return {
      text: `<div class="mt-response-card"><p>${modeKey} booth hiccuped. try again or say <code>help</code>.</p></div>`
    };
  }
}
function menuHTML(name, prefix) {
  const who = (name || 'friend').trim() || 'friend';
  const lead = prefix ? `<p>${prefix}</p>` : '';
  return `
    ${lead}
    <p>Hey ${who}! What part of your MathBrain do you wanna explore today?</p>
    <ul class="mt-menu">
      <li>lessons booth</li>
      <li>quiz booth</li>
      <li>lore booth</li>
      <li>recipes booth</li>
      <li>calculator booth</li>
    </ul>
    <p>or type help to understand me better!</p>
    <p>Say one of those and I'll get you going.</p>
  `;
}

function idkHTML() {
  const name = (appState?.profile?.name || appState?.playerName || 'friend').trim();
  return menuHTML(name, `Sorry, not on my wave length of understanding... Wanna jump into a booth?`);
}


export function loadMathTips() {
  console.log('🧠 Loading Math Tips Mode');
  appState.setMode('mathtips');

  // lock in the new mobile bg (no filters on top)
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
    <div class="mt-root">
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
                <button id="mtBack"   class="mt-btn mt-btn-pink">🔙 Main Menu</button>
                <button id="mtStart"  class="mt-btn mt-btn-cyan">🍧 Math Tips!</button>
              </div>
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
    <div class="mt-root">
      <div class="mt-aspect-wrap">
        <div class="mt-game-frame">
          <img id="modeBackground" class="background-fill mt-bg-img"
               src="${import.meta.env.BASE_URL}assets/img/modes/mathTips/mathtipsBG.png"
               alt="MathTips Background"/>

          <div class="mt-grid">
            <div class="mt-header">
              <h1>🧠 Math Tips Village</h1>
            </div>

            <div class="mt-content">
              <div class="chat-window" id="chatOutput"></div>
              <div class="chat-input-zone">
                <input id="userInput" type="text" placeholder="Ask something cosmic…"/>
                <button id="sendBtn">Send</button>
              </div>
            </div>


            <div class="mt-footer">
              <div style="display:flex; gap:.5rem; flex-wrap:wrap; justify-content:center;">
                <button id="copyTranscript" class="mt-btn mt-btn-cyan">📋 Copy Transcript</button>
                <button id="exportChatJson" class="mt-btn mt-btn-cyan">📤 Export JSON</button>
                <button id="returnToMenu" class="mt-btn mt-btn-pink">🔙 Return to Menu</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // cache
  inputEl   = document.getElementById('userInput');
  outputEl  = document.getElementById('chatOutput');   // ✅ now exists
  sendBtn   = document.getElementById('sendBtn');
  returnBtn = document.getElementById('returnToMenu');
  copyBtn   = document.getElementById('copyTranscript');
  exportBtn = document.getElementById('exportChatJson');

  startChat();
}



function wireMainHandlers() {
  MT.handlers.sendClick = () => handleSend();
  MT.handlers.keydown   = (e) => { if (e.key === 'Enter') handleSend(); };
  MT.handlers.backMain  = () => returnToMenu();
  MT.handlers.copyTx    = () => copyTranscript();
  MT.handlers.expJson   = () => exportChatJson();

  sendBtn?.addEventListener('click', MT.handlers.sendClick);
  inputEl?.addEventListener('keydown', MT.handlers.keydown);
  returnBtn?.addEventListener('click', MT.handlers.backMain);
  copyBtn?.addEventListener('click', MT.handlers.copyTx);
  exportBtn?.addEventListener('click', MT.handlers.expJson);
}

function unwireMainHandlers() {
  sendBtn?.removeEventListener('click', MT.handlers.sendClick);
  inputEl?.removeEventListener('keydown', MT.handlers.keydown);
  returnBtn?.removeEventListener('click', MT.handlers.backMain);
  copyBtn?.removeEventListener('click', MT.handlers.copyTx);
  exportBtn?.removeEventListener('click', MT.handlers.expJson);
  MT.handlers.sendClick = MT.handlers.keydown = MT.handlers.backMain = null;
  MT.handlers.copyTx = MT.handlers.expJson = null;
}

// ────────────────────────────────────────────────────────────────────────────────
// Chat logic
// ────────────────────────────────────────────────────────────────────────────────


function startChat() {
  if (!outputEl) return;
  outputEl.innerHTML = '';
  const name = (appState?.profile?.name || appState?.playerName || 'friend').trim();
  appendMessage('bot', menuHTML(name), /* alreadyHtml */ true);
}

// ...then use: appendMessage('bot', idkHTML(), true)


// Safe fallback if renderBoothsHelp wasn't imported for any reason
function mtFallbackBoothCards() {
  return `
    <div class="booth-grid">
      <div class="booth-card">
        <h3><span class="emoji">🧮</span> Calculator Booth</h3>
        <ul>
          <li><code>7*8+12</code> → 68</li>
          <li><code>.5 * 1/7</code> → 0.0714…</li>
          <li><code>sqrt 5 * sqrt 7</code></li>
        </ul>
      </div>
      <div class="booth-card">
        <h3><span class="emoji">📚</span> Lessons Booth</h3>
        <ul>
          <li><code>simplify 12/18</code> → 2/3</li>
          <li><code>1/2 + 1/3</code> → 5/6</li>
          <li><code>25% of 40</code> → 10</li>
        </ul>
      </div>
      <div class="booth-card">
        <h3><span class="emoji">🧩</span> Quiz Booth</h3>
        <ul>
          <li><code>quiz fractions 3</code></li>
          <li><code>quiz percent 3</code></li>
          <li><code>score</code> · <code>end quiz</code></li>
        </ul>
      </div>
      <div class="booth-card">
        <h3><span class="emoji">🎟️</span> Status Booth</h3>
        <ul>
          <li><code>my badges</code> · <code>streak</code></li>
          <li><code>what should i study?</code></li>
        </ul>
      </div>
      <div class="booth-card">
        <h3><span class="emoji">🌲</span> Lore Booth</h3>
        <ul>
          <li><code>tell festival lore</code></li>
        </ul>
      </div>
      <div class="booth-card">
        <h3><span class="emoji">🌮</span> Recipes Booth</h3>
        <ul>
          <li><code>quesadilla wisdom</code></li>
          <li><code>mango snowcone mode</code></li>
          <li><code>nacho night energy</code></li>
        </ul>
      </div>
    </div>
    <div class="help-footer">
      tip: say <code>help</code> anytime · switch with <code>calculator booth</code>, <code>lessons booth</code>, etc.  
      say <code>exit</code> to leave a booth.
    </div>
  `;
}


async function handleSend() {
  const raw = inputEl?.value ?? '';
  const userText = raw.trim();
  if (!userText) return;

  appendMessage('user', userText);
  inputEl.value = '';
  inputEl.focus();

  // 🏅 First-time chat with Grampy P → award badge once via badgeManager (handles popups/themes)
  try {
    if (!(appState.hasBadge?.('talk_grampy') || appState.profile.badges?.includes('talk_grampy'))) {
      awardBadge('talk_grampy');
      console.log('🏅 Badge earned: talk_grampy');
    }
  } catch (_) {}

  try {
    const res = getResponse(userText, appState); // { html, meta? }
    const html = typeof res === 'string' ? res : res?.html;
    const intent = typeof res === 'object' && res?.meta ? (res.meta.intent || 'unknown') : 'unknown';

    if (!html) {
      console.warn('🐛 getResponse returned nothing or wrong shape:', res);
      appendMessage('bot', "Small brain freeze — try that again in simpler words? I’m listening.", false);
      return;
    }

    appendMessage('bot', html, /* alreadyHtml */ true);

    // ✅ Log to appState.chatLogs for JSON export/dev review
    try { appState.logChat(userText, intent, htmlToText(html)); } catch (e) { console.warn('logChat failed', e); }
  } catch (err) {
    console.error('💥 getResponse threw:', err);
    appendMessage('bot', `Brain freeze 🥶: ${String(err?.message || err)}. Try “15% of 80” or “simplify 12/18”.`, false);
  }
}

function isNearBottom(el, slack = 32) {
  return (el.scrollHeight - el.scrollTop - el.clientHeight) <= slack;
}

function appendMessage(sender, textOrHtml, alreadyHtml = false) {
  const atBottom = isNearBottom(outputEl);

  const msgClass = sender === 'user' ? 'user-msg' : 'cat-reply';
  const prefix = sender === 'user' ? '🍧' : '😺';
  const safe = alreadyHtml ? String(textOrHtml) : String(textOrHtml)
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#39;');

  const div = document.createElement('div');
  div.className = msgClass;
  div.innerHTML = `${prefix} ${safe}`;
  outputEl.appendChild(div);

  if (atBottom) outputEl.scrollTop = outputEl.scrollHeight; // ✅ only if pinned already
}






function htmlToText(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = String(html);
  return tmp.textContent || tmp.innerText || '';
}

async function copyTranscript() {
  if (!outputEl) return;
  const lines = [...outputEl.querySelectorAll('.user-msg, .cat-reply')]
    .map(el => el.textContent.trim())
    .filter(Boolean);
  const stamp = new Date().toISOString();
  const header = `Grampy P — Math Tips transcript (${stamp})`;
  const text = `${header}\n\n${lines.join('\n')}`;

  try {
    await navigator.clipboard.writeText(text);
    console.log('%c📋 Transcript copied to clipboard', 'color:#00ffee;');
  } catch {
    // fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select(); ta.setSelectionRange(0, 999999);
    try { document.execCommand('copy'); } catch {}
    document.body.removeChild(ta);
    console.log('%c📋 Transcript copied (fallback)', 'color:#00ffee;');
  }
}

function exportChatJson() {
  try {
    if (typeof appState.exportChatLogs === 'function') {
      appState.exportChatLogs();
    } else {
      console.warn('exportChatLogs() not found on appState.');
    }
  } catch (e) {
    console.error('Export JSON failed:', e);
  }
}

// ────────────────────────────────────────────────────────────────────────────────
function returnToMenu() {
  playTransition(() => {
    stopMathTips();
    document.querySelector(MT.menuSel)?.classList.remove('hidden');
    applyBackgroundTheme(); // return to menu theme
  });
}
// ── PATCH: message appending + smart autoscroll bottom pin ─────────────
const CHAT_SEL = '.chat-window';
function getChatEl() {
  return document.querySelector(CHAT_SEL);
}

// only scroll if the user is already near the bottom (don’t yank during scrollback)
function smartScrollToBottom(container) {
  if (!container) return;
  const slack = 32; // px threshold
  const atBottom = (container.scrollHeight - container.scrollTop - container.clientHeight) <= slack;
  if (atBottom) {
    container.scrollTop = container.scrollHeight;
  }
}

// create a bubble and append to the bottom
export function pushMessage({ html, role = 'cat' }) {
  const box = getChatEl();
  if (!box) return;
  const wasNearBottom = (box.scrollHeight - box.scrollTop - box.clientHeight) <= 32;

  const div = document.createElement('div');
  div.className = role === 'user' ? 'user-msg' : 'cat-reply';
  div.innerHTML = html;
  box.appendChild(div);

  // trigger CSS animation class if you want a delayed kick (optional)
  // div.classList.add('mt-pop'); // not needed; we use keyframes on base class

  if (wasNearBottom) box.scrollTop = box.scrollHeight;
}

// optional: observe DOM changes to keep bottom pinned on render bursts
export function attachChatAutoScroller() {
  const box = document.querySelector('.chat-window');
  if (!box || typeof MutationObserver === 'undefined') return;
  const mo = new MutationObserver(() => {
    if (isNearBottom(box)) box.scrollTop = box.scrollHeight;
  });
  mo.observe(box, { childList: true });
  box.scrollTop = box.scrollHeight; // initial pin
  return () => mo.disconnect();
}


// call once after UI mounts
attachChatAutoScroller();

