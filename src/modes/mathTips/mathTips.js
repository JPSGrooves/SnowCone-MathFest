// /src/modes/mathTips/mathTips.js
import './mathTips.css';
import { swapModeBackground, applyBackgroundTheme } from '../../managers/backgroundManager.js';
import { playTransition } from '../../managers/transitionManager.js';
import { getIntroMessage } from './intro.js';
import { appState } from '../../data/appState.js';
import { getResponse } from './qabot.js';
import { awardBadge } from '../../managers/badgeManager.js';
import { runInAction } from 'mobx';

// 🎵 music hooks — no loop forcing here
import {
  playTrack,
  stopTrack,
  toggleMute,
  isMuted,
  currentTrackId,
  isPlaying,
} from '../../managers/musicManager.js';

import { attachAutoScroller, alreadyHasCard } from './qabot.js';
import { composeReply } from './conversationPolicy.js';

// === 🔥 Mode-local state (no globals)
let inputEl, outputEl, sendBtn;
let copyBtn, exportBtn;
let detachAutoScroll; // cleanup handle returned by attachAutoScroller()

let __mtMusicStarted = false; // prevents double-starts across re-renders
let _mtOwnsMusic = false; // ← NEW: track if MathTips started playback

const MT_BODY_CLASS = 'mt-active'; // 🍏 iOS bezel targeting for MathTips

const MT = {
  containerSel: '#game-container',
  menuSel: '.menu-wrapper',
  bootLock: false,
  handlers: {
    startIntro: null,
    backIntro: null,
    sendClick: null,
    keydown: null,
    copyTx: null,
    expJson: null,
    globalClick: null,
  }
};


// ────────────────────────────────────────────────────────────────────────────────
// tiny helper—match Story Mode’s immediate play-unlocked pattern
function playTrackUnlocked(id) {
  try {
    const H = window.Howler ?? globalThis.Howler;
    if (H && H._muted) H.mute(false);
    if (H?.ctx && H.ctx.state === 'suspended') H.ctx.resume().catch(() => {});
  } catch {}
  try { playTrack(id); } catch {}
}

// ── universal mode handler resolver (kept intact) ──────────────────────────────
function resolveModeHandler(modeKey) {
  const mod = MODEx?.[modeKey];
  if (!mod) return null;
  if (typeof mod === 'function') return mod;
  if (typeof mod.handle === 'function') return mod.handle.bind(mod);
  if (typeof mod.start  === 'function') return mod.start.bind(mod);
  if (typeof mod.reply  === 'function') return mod.reply.bind(mod);
  if (typeof mod.run    === 'function') return mod.run.bind(mod);
  return null;
}

function callMode(modeKey, text, extra = {}) {
  const mod = MODEx[modeKey];
  if (!mod) return { text: `<p>${modeKey} booth not found.</p>` };

  // Prefer a clean boot so “recipe booth” opens the menu, not step 1.
  if (typeof mod.start === 'function') return mod.start(extra);
  if (typeof mod.run   === 'function') return mod.run(text, extra);
  if (typeof mod.handle=== 'function') return mod.handle(text, extra);

  return { text: `<p>${modeKey} booth has no handler.</p>` };
}


// layered card wrapper to match other replies
function wrapLayer(inner, { tone = 'cyan', title = '' } = {}) {
  const head = title ? `<div class="mt-layer-head">${leadSafe(title)}</div>` : '';
  return `<div class="mt-layer-card mt-layer--${tone}">
            <div class="mt-layer-body">${head}${inner}</div>
          </div>`;
}


function menuHTML(name, prefix) {
  const who = (name || 'friend').trim() || 'friend';
  const lead = prefix ? `<p class="mt-dim">${leadSafe(prefix)}</p>` : '';

  // plain markup (NO mt-layer-card wrapper) so it renders in the normal bot bubble
  return `
    ${lead}
    <p><strong>Hey ${who}!</strong> What Math Booth do you wanna explore today?</p>
    <ul class="mt-menu">
      <li>lessons booth</li>
      <li>quiz booth</li>
      <li>lore booth</li>
      <li>recipe booth</li>
      <li>status booth</li>
      <li>calculator booth</li>
    </ul>
    <p class="mt-dim">Say one of those and I'll get you going.</p>
  `;
}



function leadSafe(s){ return String(s).replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function idkHTML() {
  const name = (appState?.profile?.name || appState?.playerName || 'friend').trim();
  return menuHTML(name, `Sorry, not on my wave length of understanding... Wanna jump into a booth?`);
}

// ────────────────────────────────────────────────────────────────────────────────
// Public entry/exit
// ────────────────────────────────────────────────────────────────────────────────
export function loadMathTips() {
  console.log('🧠 Loading Math Tips Mode');
  appState.setMode('mathtips');

  // 🍏 mark body so iOS-only CSS can push this mode down under the fake bezel
  document.body.classList.add(MT_BODY_CLASS);

  try { swapModeBackground('mathTips'); }
  catch { applyBackgroundTheme(`${import.meta.env.BASE_URL}assets/img/modes/mathTips/mathtipsBG.png`); }

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
  unwireIntroHandlers();
  unwireMainHandlers();
  unwireGlobalClick();
  try { detachAutoScroll?.(); detachAutoScroll = null; } catch {}

  // 🎵 stop only if we’re actually in this mode’s track
  try {
    if (currentTrackId() === 'kittyPaws') stopTrack();
  } catch {}

  // 🎵 stop only if MathTips started this session’s music
  try {
    if (_mtOwnsMusic) stopTrack();
  } catch {}
  _mtOwnsMusic = false;

  __mtMusicStarted = false;

  // 🍏 drop the MathTips body flag so iOS padding stops applying
  document.body.classList.remove(MT_BODY_CLASS);

  const container = document.querySelector(MT.containerSel);
  if (container) {
    container.innerHTML = '';
    container.classList.add('hidden');
    container.style.display = 'none';
  }
  console.log('🧠 Math Tips Mode cleaned up!');
}


// ────────────────────────────────────────────────────────────────────────────────
// Intro Screen
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

              <!-- single bottom bar: Back | Start | Mute -->
              <div class="mt-bottom-bar">
                <button id="mtBackToMenu" class="mt-square-btn mt-left" title="Back">🔙</button>
                <div class="mt-center-stack">
                  <button id="mtStart" class="mt-btn mt-btn-cyan mt-large">🍧 Math Tips!</button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `;
}



function wireIntroHandlers() {
  // make sure the center area is actually clickable even if a stale CSS rule wins
  document.querySelector('.mt-intro .mt-center-stack')
    ?.style.setProperty('pointer-events', 'auto', 'important');

  const start = document.getElementById('mtStart');

  MT.handlers.startIntro = async () => {
    if (MT.bootLock) return;
    MT.bootLock = true;

    const intro = document.querySelector('.mt-intro');
  if (intro) {
    intro.classList.add('fade-out');
    intro.style.pointerEvents = 'none';
    intro.addEventListener('transitionend', () => intro.remove(), { once: true }); // ← add this line
  }
  setTimeout(() => {
    renderMainUI();
    wireMainHandlers();
    intro?.remove?.();      // 💡 remove the overlay after the transition
    MT.bootLock = false;
  }, 420);
 };

  start?.addEventListener('click', MT.handlers.startIntro);
  wireGlobalClick();
}


function unwireIntroHandlers() {
  const start = document.getElementById('mtStart');
  if (start && MT.handlers.startIntro) start.removeEventListener('click', MT.handlers.startIntro);
  MT.handlers.startIntro = null;
}

// ────────────────────────────────────────────────────────────────────────────────
// Main UI
// ────────────────────────────────────────────────────────────────────────────────
function renderMainUI() {
  const container = document.querySelector(MT.containerSel);
  if (!container) return;

  container.innerHTML = `
    <div class="mt-root">
      <div class="mt-aspect-wrap">
        <div class="mt-game-frame">
          <img
            id="modeBackground"
            class="background-fill mt-bg-img"
            src="${import.meta.env.BASE_URL}assets/img/modes/mathTips/mathtipsBG.png"
            alt="MathTips Background"
          />

          <div class="mt-grid">
            <!-- 🟡 HEADER ROW -->
            <header class="mt-header">
              <h1>🐱 Math Tips Village</h1>
            </header>

            <!-- 🔵 MAIN CONTENT: chat + input -->
            <section class="mt-content">
              <div class="chat-window" id="chatOutput"></div>

              <div class="chat-input-zone">
                <input
                  id="userInput"
                  type="text"
                  placeholder="Ask something cosmic…"
                />
                <button id="sendBtn">Send</button>
              </div>
            </section>

            <!-- 🟣 FOOTER ROW: Back | Copy/Export | Mute -->
            <footer class="mt-footer">
              <div class="mt-bottom-bar">
                <button id="mtBackToMenu" class="mt-square-btn mt-left">🔙</button>

                <div class="mt-bottom-row">
                  <button
                    id="copyTranscript"
                    class="mt-btn mt-btn-cyan mt-small"
                  >
                    📋 Copy
                  </button>
                  <button
                    id="exportChatJson"
                    class="mt-btn mt-btn-cyan mt-small"
                  >
                    📤 Export
                  </button>
                </div>

                <button
                  id="mtMute"
                  class="mt-square-btn mt-right ${isMuted() ? 'muted' : ''}"
                >
                  ${isMuted() ? '🔇' : '🔊'}
                </button>
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  `;

  // ensure center-stack isn't inheriting pointer-events:none from the bar
  document.querySelector('.mt-center-stack')
    ?.style.setProperty('pointer-events', 'auto');

  // cache
  inputEl   = document.getElementById('userInput');
  outputEl  = document.getElementById('chatOutput');
  sendBtn   = document.getElementById('sendBtn');
  copyBtn   = document.getElementById('copyTranscript');
  exportBtn = document.getElementById('exportChatJson');

  // 🔽 respectful auto-scroll
  try { detachAutoScroll = attachAutoScroller('chatOutput'); } catch {}

  // 🎵 Start MathTips with kittyPaws, then let global Jukebox rules run
  try {
    const needStart =
      (typeof currentTrackId === 'function' && currentTrackId() !== 'kittyPaws') ||
      (typeof isPlaying === 'function' && !isPlaying());

    if (needStart) {
      playTrackUnlocked('kittyPaws');
      _mtOwnsMusic = true;
    } else {
      _mtOwnsMusic = false;
    }

    __mtMusicStarted = true;
  } catch {}

  startChat();
}


function wireMainHandlers() {
  MT.handlers.sendClick = () => handleSend();
  MT.handlers.keydown   = (e) => { if (e.key === 'Enter') handleSend(); };
  sendBtn?.addEventListener('click', MT.handlers.sendClick);
  inputEl?.addEventListener('keydown', MT.handlers.keydown);

  // text buttons in the bottom row
  MT.handlers.copyTx  = () => copyTranscript();
  MT.handlers.expJson = () => exportChatJson();
  copyBtn?.addEventListener('click', MT.handlers.copyTx);
  exportBtn?.addEventListener('click', MT.handlers.expJson);

  wireGlobalClick(); // handles Back + Mute consistently across screens
}

function unwireMainHandlers() {
  sendBtn?.removeEventListener('click', MT.handlers.sendClick);
  inputEl?.removeEventListener('keydown', MT.handlers.keydown);
  copyBtn?.removeEventListener('click', MT.handlers.copyTx);
  exportBtn?.removeEventListener('click', MT.handlers.expJson);
  MT.handlers.sendClick = MT.handlers.keydown = null;
  MT.handlers.copyTx = MT.handlers.expJson = null;
}

// ────────────────────────────────────────────────────────────────────────────────
// Global click (Back + Mute live anywhere inside MathTips)
// ────────────────────────────────────────────────────────────────────────────────
function wireGlobalClick() {
  if (MT.handlers.globalClick) return;
  MT.handlers.globalClick = (e) => {
    const backBtn = e.target.closest('#mtBackToMenu');
    const muteBtn = e.target.closest('#mtMute');

    if (backBtn) {
      returnToMenu();
      return;
    }

    if (muteBtn) {
      const muted = toggleMute();
      const btn = document.getElementById('mtMute');
      if (btn) {
        btn.textContent = muted ? '🔇' : '🔊';
        btn.classList.toggle('muted', muted);
      }
      e.preventDefault();
    }
  };
  document.addEventListener('click', MT.handlers.globalClick);
}
function unwireGlobalClick() {
  if (!MT.handlers.globalClick) return;
  document.removeEventListener('click', MT.handlers.globalClick);
  MT.handlers.globalClick = null;
}

// ────────────────────────────────────────────────────────────────────────────────
// Chat logic (unchanged except badge + logging)
// ────────────────────────────────────────────────────────────────────────────────
function startChat() {
  if (!outputEl) return;
  outputEl.innerHTML = '';

  const name = (appState?.profile?.name || appState?.playerName || 'friend').trim();

  // Render opening menu as a NORMAL response card (not the layered style)
  const cardHtml = composeReply({
    part: { kind: 'answer', html: menuHTML(name) },
    askAllowed: false,
    noAck: true,
    mode: 'center'
  });

  appendMessage('bot', cardHtml, /* alreadyHtml */ true);
}



function decodeEntities(s) {
  return String(s)
    .replaceAll('&lt;','<')
    .replaceAll('&gt;','>')
    .replaceAll('&amp;','&');
}



async function handleSend() {
  const raw = inputEl?.value ?? '';
  const userText = raw.trim();
  if (!userText) return;

  appendMessage('user', userText);
  inputEl.value = '';
  inputEl.focus();

  // 🏅 badge write → inside action
  try {
    runInAction(() => {
      if (!(appState.hasBadge?.('talk_grampy') || appState.profile.badges?.includes('talk_grampy'))) {
        awardBadge('talk_grampy');
      }
    });
  } catch {}

  try {
    const res = getResponse(userText, appState);
    const html = typeof res === 'string' ? res : res?.html;
    const intent = typeof res === 'object' && res?.meta ? (res.meta.intent || 'unknown') : 'unknown';
    if (!html) {
      appendMessage('bot', "Small brain freeze — try that again in simpler words? I’m listening.", false);
      return;
    }

    // 🔧 make output golden-friendly + decode double-escaped inner HTML
    const patched = decodeEntities(html); // keep only the de-escape
    appendMessage('bot', patched, /* alreadyHtml */ true);

    // chat log write → inside action
    try {
      runInAction(() => { appState.logChat?.(userText, intent, htmlToText(patched)); });
    } catch {}
  } catch (err) {
    console.error('💥 getResponse threw:', err);
    appendMessage('bot', `Brain freeze 🥶: ${String(err?.message || err)}. Try “15% of 80” or “simplify 12/18”.`, false);
  }
}

function isNearBottom(el, slack = 32) {
  return (el.scrollHeight - el.scrollTop - el.clientHeight) <= slack;
}
function appendMessage(sender, textOrHtml, alreadyHtml = false) {
  if (!outputEl) return;

  const raw = String(textOrHtml ?? '');

  // Respect pre-styled “card” HTML (no emoji on those).
  const hasCardHelper = typeof alreadyHasCard === 'function';
  const isCard = alreadyHtml && (
    hasCardHelper
      ? alreadyHasCard(raw)
      : /\bmt-(?:response|layer|lecture)-card\b|\bmt-quiz-list\b|\bbooth-card\b/.test(raw)
  );

  // Escape only when we’re rendering plain text.
  const safe = alreadyHtml
    ? raw
    : raw
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');

  // Build bubble.
  const div = document.createElement('div');
  div.className = sender === 'user' ? 'user-msg' : 'cat-reply';
  const emoji = sender === 'user' ? '🍧' : '😺';
  div.innerHTML = isCard ? safe : `${emoji} ${safe}`;
  outputEl.appendChild(div);

  // Auto-scroll only if user is pinned near bottom.
  const pinned = isNearBottom(outputEl, 48);
  if (pinned) {
    requestAnimationFrame(() => {
      outputEl.scrollTop = outputEl.scrollHeight;
    });
  }
}



function htmlToText(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = String(html);
  return tmp.textContent || tmp.innerText || '';
}

async function copyTranscript() {
  const box = document.getElementById('chatOutput');
  if (!box) return;
  const lines = [...box.querySelectorAll('.user-msg, .cat-reply')]
    .map(el => el.textContent.trim())
    .filter(Boolean);
  const stamp = new Date().toISOString();
  const header = `Grampy P — Math Tips transcript (${stamp})`;
  const text = `${header}\n\n${lines.join('\n')}`;

  try {
    await navigator.clipboard.writeText(text);
    console.log('%c📋 Transcript copied to clipboard', 'color:#00ffee;');
  } catch {
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
    if (typeof appState.exportChatLogs === 'function') appState.exportChatLogs();
    else console.warn('exportChatLogs() not found on appState.');
  } catch (e) {
    console.error('Export JSON failed:', e);
  }
}

// ────────────────────────────────────────────────────────────────────────────────
function returnToMenu() {
  playTransition(() => {
    stopMathTips();
    document.querySelector(MT.menuSel)?.classList.remove('hidden');
    applyBackgroundTheme();
  });
}
