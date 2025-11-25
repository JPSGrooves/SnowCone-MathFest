// src/modes/storyMode/chapterEngine.js
import {
  SlideRole,
  ItemIds,
  Currency,
  CURRENCY_NAME,
  ITEM_DISPLAY,        // ← grab display map here too
} from '../../data/storySchema.js';

import { appState } from '../../data/appState.js';
import { preventDoubleTapZoom } from '../../utils/preventDoubleTapZoom.js';
import { isMuted, toggleMute } from '../../managers/musicManager.js';
import { awardBadge } from '../../managers/badgeManager.js';
import { pickupPing } from './ui/pickupPing.js';
import { scheduleStoryCredits } from './ui/storyCredits.js';


const SELECTORS = { container: '#game-container' };
const BASE = import.meta.env.BASE_URL;
const BG_SRC = `${BASE}assets/img/modes/storymodeForest/storyBG.png`;

// ─────────────────────────────
// inline unlock store (no new files)
// ─────────────────────────────
const SM_UNLOCK_KEY = 'sm_unlocked_chapters_v1';

function _displayFor(itemId){
  const d = ITEM_DISPLAY?.[itemId] || {};
  return {
    name:  d.name  || String(itemId),
    emoji: d.emoji || '✨'
  };
}


function smLoadUnlocks() {
  try {
    const raw = localStorage.getItem(SM_UNLOCK_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch (e) {}
  return new Set(['ch1']); // default: ch1 is open
}
function smSaveUnlocks(set) {
  try { localStorage.setItem(SM_UNLOCK_KEY, JSON.stringify([...set])); } catch (e) {}
}
function smUnlock(id) {
  const set = smLoadUnlocks();
  if (!set.has(id)) {
    set.add(id);
    smSaveUnlocks(set);
    // tell any chapter menu to refresh if it's listening
    window.dispatchEvent(new CustomEvent('sm:chaptersChanged', { detail: [...set] }));
  }
}




function el(sel, root=document){ return root.querySelector(sel); }

export class ChapterEngine {
  constructor(registry){
    this.registry = registry;     // chapters by id
    this.state = null;
  }

  start(chapterId){
    const chapter = this.registry[chapterId];
    if (!chapter) {
      console.warn('[Story] Unknown chapterId:', chapterId, 'Known:', Object.keys(this.registry));
      return;
    }

    // ← NEW: ensure the chapter you’re starting is unlocked for the options screen
    this._unlockChapter(chapterId);

    this.state = {
      chapterId,
      idx: 0,          // 0..N
      loopStack: [],
      quest: null,
      flags: {},
      revealed: new Set(),
      visited: new Set(),
    };
    this._renderSlide();
  }


  _nextMain(){
    const last = this.registry[this.state.chapterId].slides.length - 1;
    if (this.state.idx >= last) return this._finishChapter();
    this.state.idx++;
    this._renderSlide();
  }

  // 👇 visited-key helpers
  _vKey(kind){ 
    return `${this.state.chapterId}:${this.state.idx}:${kind}`; 
  }
  _isVisited(kind){ 
    return this.state.visited.has(this._vKey(kind)); 
  }
  _markVisited(kind){ 
    this.state.visited.add(this._vKey(kind)); 
  }


  _goto(i){
    const last = this.registry[this.state.chapterId].slides.length - 1;
    this.state.idx = Math.max(0, Math.min(last, i|0));
    this._renderSlide();
  }
  // chapterEngine.js (inside export class ChapterEngine)
  // inside export class ChapterEngine { ... }
  
  _grantSlideRewards(slide){
    if (!slide || !slide.grants) return;
    try {
        const give = (id, qty = 1, payload = undefined) => {
        if (appState.hasItem?.(id)) return false;
        if (payload !== undefined) appState.addItem?.(id, payload);
        else appState.addItem?.(id, { qty });
        return true;
        };

        slide.grants.forEach(g => {
        if (typeof g === 'string') {
            const added = give(g, 1);
            if (added) pickupPing({ emoji: (ITEM_DISPLAY?.[g]?.emoji || '✨'), name: (ITEM_DISPLAY?.[g]?.name || g), qty: 1 });
        } else if (g && typeof g === 'object') {
            if (g.item) {
            const qty = (typeof g.qty === 'number') ? g.qty
                    : (typeof g.payload?.qty === 'number') ? g.payload.qty
                    : 1;
            const added = give(g.item, qty, g.payload);
            if (added) pickupPing({ emoji: (ITEM_DISPLAY?.[g.item]?.emoji || '✨'), name: (ITEM_DISPLAY?.[g.item]?.name || g.item), qty });
            }
            if (g.currency) {
            const amt = g.currency | 0;
            appState.addCurrency?.(amt);
            // 🔕 no pickupPing for cash
            // keep the chip fresh so players still see their money tick up
            const chip = document.getElementById('smCash');
            if (chip) chip.textContent = `${appState.getCurrency()} ${CURRENCY_NAME}`;
            }

        }
      });

        appState.saveToStorage?.();
    } catch (e) {
        console.warn('[Story] grant failed:', e);
    }
    }

// mark a chapter unlocked (engine-level, idempotent)
  _unlockChapter(id) {
    try {
      // if your appState also tracks unlocks, let it run (no-op if missing)
      if (typeof appState?.unlockChapter === 'function') appState.unlockChapter(id);
    } catch(e) {}
    smUnlock(id); // inline store above (localStorage)
  }

    _gotoById(targetId) {
    const chapter = this.registry[this.state.chapterId];
    if (!chapter) return;
    const idx = chapter.slides.findIndex((s) => s.id === targetId);
    if (idx >= 0) {
      this.state.idx = idx;
      this._renderSlide();
    }
  }
      _renderEndingSlide(chapter, slide) {
    const title = `<h2 class="sm-ch1-title">${slide.title || ''}</h2>`;
    const img   = slide.img ? `<img class="sm-ch1-img" src="${slide.img}" alt="">` : '';
    const text  = slide.text || '';

    const options = slide.options || [];

    const optionsHtml = options.map((opt, idx) => `
      <button
        class="sm-btn sm-btn-primary sm-ending-choice"
        data-i="${idx}"
      >
        ${opt.label}
      </button>
    `).join('');

    const inner = `
      ${title}
      ${img}
      <div class="sm-ch1-text">${text}</div>

      <div class="sm-choice-list sm-ending-choices">
        ${optionsHtml}
      </div>
    `;

    // 🔳 Draw the standard frame
    this._renderFrame(inner);

    // 🔔 NEW: fire slide.onEnter hooks for ending slides (credits, music, etc.)
    if (typeof slide.onEnter === 'function') {
      try {
        slide.onEnter({ appState, engine: this });
      } catch (err) {
        console.warn('[Story] ending onEnter failed:', err);
      }
    }

    const root = document;

    root.querySelectorAll('.sm-ending-choice').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = Number(btn.dataset.i || 0);
        const opt = options[i];
        if (!opt) return;

        // Honor normal reward + onAdvance hooks, like other slide types
        this._grantSlideRewards(slide);
        if (typeof slide.onAdvance === 'function') {
          try {
            slide.onAdvance({ appState, engine: this, choice: opt });
          } catch (err) {
            console.warn('[Story] ending onAdvance failed:', err);
          }
        }

        const target = opt.nextId;

        // Special 'root_menu' keyword → bounce back to chapter menu
        if (target === 'root_menu') {
          if (typeof chapter.onFinish === 'function') {
            try {
              chapter.onFinish({ appState, engine: this });
            } catch (err) {
              console.warn('[Story] ending onFinish failed:', err);
            }
          }
          this._finishChapter();
          return;
        }

        if (target) {
          this._gotoById(target);
        } else {
          // Fallback: just advance linearly
          this._nextMain();
        }
      });
    });
  }



  _isChapterUnlocked(id) {
    try {
      if (typeof appState?.isChapterUnlocked === 'function') {
        return !!appState.isChapterUnlocked(id);
      }
    } catch(e) {}
    return smLoadUnlocks().has(id);
  }



  _renderFrame(inner){
    const container = document.querySelector(SELECTORS.container);
    container.innerHTML = `
        <div class="sm-aspect-wrap">
        <div class="sm-game-frame sm-is-intro">
            <img id="modeBackground" class="sm-bg-img" src="${BG_SRC}" alt="Story Mode Background"/>
            <section class="sm-ch1" data-chapter="${this.state?.chapterId || ''}">
            <div class="sm-ch1-wrap">${inner}</div>

            <!-- bottom bar lives inside .sm-ch1 so grid can place it -->
            <div class="sm-bottom-bar">
                <button id="smBackToMenu" class="sm-square-btn sm-left">🔙</button>
                <div class="sm-bottom-center">
                <div class="sm-cash-chip" id="smCash"></div>
                <button id="smInv" class="sm-square-btn">👜</button>
                </div>
                <button id="smMute" class="sm-square-btn sm-right ${isMuted() ? 'muted' : ''}">
                ${isMuted() ? '🔇' : '🔊'}
                </button>
            </div>
            </section>
        </div>
        </div>
    `;

    // rebind global basics
    document.querySelectorAll('.sm-aspect-wrap, .sm-game-frame, .sm-ch1').forEach(preventDoubleTapZoom);
    this._wireCommon();
    // draw currency
    const label = CURRENCY_NAME;
    const chip = document.getElementById('smCash');
    if (chip) chip.textContent = `${appState.getCurrency()} ${label}`;
  }

  _wireCommon(){
    const root = document;
    root.getElementById('smBackToMenu')?.addEventListener('click', ()=> this._backToMenu());
    root.getElementById('smInv')?.addEventListener('click', ()=> this._toggleInv());
    root.getElementById('smMute')?.addEventListener('click', ()=>{
      const muted = toggleMute();
      const btn = root.getElementById('smMute'); if (!btn) return;
      btn.textContent = muted ? '🔇' : '🔊';
      btn.classList.toggle('muted', muted);
    });
  }

  _toggleInv(){
    // If open → close
    let sheet = document.querySelector('.sm-inventory-sheet');
    if (sheet){ sheet.remove(); return; }

    // Overlay + panel (bottom sheet)
    sheet = document.createElement('div');
    sheet.className = 'sm-inventory-sheet';
    sheet.innerHTML = `
        <div class="sm-inventory-panel" role="dialog" aria-label="Inventory">
        <div class="sm-inv-head">
            <div class="sm-inv-title">Inventory</div>
            <div class="sm-inv-cash">${appState.getCurrency()} ${CURRENCY_NAME}</div>
            <button class="sm-inv-close" aria-label="Close">✕</button>
        </div>
            <div class="sm-inventory-grid">
                ${appState.listItems().map(it=>{
                    const disp  = ITEM_DISPLAY[it.id] || {};
                    const emoji = disp.emoji ?? it.meta?.emoji ?? '📦';
                    const name  = disp.name  ?? it.name ?? it.id;
                    return `
                    <button class="sm-item" data-id="${it.id}">
                        <span class="sm-item-emoji">${emoji}</span>
                        <span class="sm-item-name">${name}</span>
                        ${it.qty>1 ? `<span class="sm-item-qty">×${it.qty}</span>`:''}
                    </button>
                    `;
                }).join('') || `<div class="sm-empty">You’ve got pockets, but no treasures yet.</div>`}
            </div>
        </div>`;

    document.body.appendChild(sheet);

    // Close helpers
    const close = () => {
        sheet.remove();
        window.removeEventListener('keydown', onEsc);
    };
    const onEsc = (e) => { if (e.key === 'Escape') close(); };

    // Click backdrop to close (only when clicking the overlay, not inside the panel)
    sheet.addEventListener('click', (e) => { if (e.target === sheet) close(); });
    // Close button
    sheet.querySelector('.sm-inv-close')?.addEventListener('click', close);
    // ESC to close
    window.addEventListener('keydown', onEsc);
  }
    // Only roll credits if we're leaving from the Ch5 final slide
  _maybeScheduleCredits() {
    try {
      const chapterId = this.state?.chapterId;
      if (chapterId !== 'ch5') return;

      const chapter = this.registry?.[chapterId];
      if (!chapter) return;

      const idx = this.state?.idx ?? 0;
      const slide = chapter.slides?.[idx];
      if (!slide || slide.id !== 'c5_final_the_end') return;

      // ✅ We are on Ch5's final slide and about to leave → start credits in 1s
      scheduleStoryCredits(1000);
    } catch (err) {
      console.warn('[Story] failed to schedule credits from Ch5 final:', err);
    }
  }



    _backToMenu(){
    // 🔍 If we're leaving from Ch5's final slide, arm the credits timer
    this._maybeScheduleCredits();

    const evt = new CustomEvent('sm:backToChapterMenu');
    window.dispatchEvent(evt);
  }

  _finishChapter(){
    // 🔍 Same check here for paths that use 'root_menu' from ending screens
    this._maybeScheduleCredits();

    // 🔔 NEW: chapter fully finished → tell StoryMode for XP/popup/SFX
    try {
      const detail = {
        chapterId: this.state?.chapterId || null,
        mode: 'to_menu',
      };
      window.dispatchEvent(new CustomEvent('sm:chapterComplete', { detail }));
    } catch (err) {
      console.warn('[Story] chapterComplete event (to_menu) failed:', err);
    }

    const evt = new CustomEvent('sm:backToChapterMenu');
    window.dispatchEvent(evt); // storyMode.js already listens and shows the chapter menu
  }




  _renderSlide(){
    const chapter = this.registry[this.state.chapterId];
    const slide = chapter.slides[this.state.idx];

    // 👉 NEW: fire onEnter hook when a slide is rendered
    if (slide && typeof slide.onEnter === 'function') {
      try {
        slide.onEnter({ appState, engine: this });
      } catch (err) {
        console.warn('[Story] slide.onEnter error:', err);
      }
    }

    // Route CUSTOMER slides to the mini-runner
    if (slide?.role === SlideRole.CUSTOMER || slide?.role === 'customer') {
      this._onCustomer(slide);
      return;
    }

    // Custom slide modes (Chapter 3, but reusable)
    if (slide?.mode === 'quiz3' && slide?.quiz) {
      this._renderQuizSlide(chapter, slide);
      return;
    }

    if (slide?.mode === 'choice3' && slide?.choices) {
      this._renderChoiceSlide(chapter, slide);
      return;
    }

    // NEW: simple ending-mode screens with buttons → next slide id
    if (slide?.mode === 'ending' && slide?.options) {
      this._renderEndingSlide(chapter, slide);
      return;
    }

    // ───────────────────────────────────────────
    // Gating: require side-path visits before "Advance"
    // ───────────────────────────────────────────
    const requiredSlots = slide.requireVisited || (slide.requireAllSidePaths ? ['weird','quest','loop'] : []);
    const unmetSlots = requiredSlots.filter(s => !this._isVisited(s));
    const blockAdvance = unmetSlots.length > 0;

    const title = `<h2 class="sm-ch1-title">${slide.title}</h2>`;
    const img = slide.img ? `<img class="sm-ch1-img" src="${slide.img}" alt="">` : '';
    const text = slide.text ? `<div class="sm-ch1-text">${slide.text}</div>` : '';

    const isLast = this.state.idx === (chapter.slides.length - 1);
    const defaultTop =
      (isLast && slide.nextChapterId && this.registry[slide.nextChapterId])
        ? 'Go to Chapter 2 ➡️'
        : (isLast ? 'Finish Chapter' : 'Continue ➡️');

    const topOpt = slide.dynamicTop?.(appState) ?? { label: slide.topLabel ?? defaultTop, disabled: false };
    const resolve = (v) => (typeof v === 'function' ? v(appState, this) : v);

    const kinds = {
      top:   slide.meta?.top?.kind   || 'Story',
      loop:  slide.meta?.loop?.kind  || 'Puzzle',
      quest: slide.meta?.quest?.kind || 'Quest',
      weird: slide.meta?.weird?.kind || 'Lore',
    };

    const desc = {
      top:   resolve(topOpt.label ?? slide.topLabel ?? defaultTop),
      loop:  resolve(slide.loopLabel  ?? 'Look around'),
      quest: resolve(slide.questLabel ?? 'Side quest'),
      weird: resolve(slide.weirdLabel ?? 'Something odd'),
    };

    const lbl = (kind, text) =>
      `<span class="sm-kind">${kind}:</span> <span class="sm-desc">${text}</span>`;

    const buildBtn = (slot) => {
      const visited = this._isVisited(slot);
      const visitedClass = visited ? ' is-visited' : '';
      const check = visited ? `<span class="sm-check" aria-hidden="true">✓</span>` : '';
      const primary = (slot === 'quest') || (slot === 'top');
      const cls = primary ? 'sm-btn sm-btn-primary' : 'sm-btn sm-btn-secondary';

      // 🔒 Top button locked if blockAdvance or topOpt.disabled
      const disabled = (slot === 'top' && (topOpt.disabled || blockAdvance)) ? 'disabled' : '';
      const handlerClass = (slot === 'top') ? 'js-advance' : `js-${slot}`;
      const kindLabel = kinds[slot === 'weird' ? 'weird' : slot];
      const textLabel = desc[slot === 'weird' ? 'weird' : slot];

      // Optional: hint text when locked (kept minimal)
      const lockHint = (slot === 'top' && (topOpt.disabled || blockAdvance))
        ? ' data-hint="Try the other options first!"'
        : '';

      return `
        <button class="${cls} ${handlerClass}${visitedClass}" ${disabled}${lockHint}>
          ${check}${lbl(kindLabel, textLabel)}
        </button>`;
    };

    const choices = `
      ${buildBtn('weird')}
      ${buildBtn('quest')}
      ${buildBtn('loop')}
      ${buildBtn('top')}
    `;

    const ctaLabel = resolve(slide.soloLabel ?? slide.topLabel ?? 'Continue ➡️');
    const body = (slide.mode === 'solo')
      ? `${title}${img}${text}
          <div class="sm-choice-list">
            <button class="sm-btn sm-btn-primary js-advance">${ctaLabel}</button>
          </div>`
      : `${title}${img}${text}<div class="sm-choice-list">${choices}</div>`;

    this._renderFrame(body);

    const root = document;
    root.querySelector('.js-advance')?.addEventListener('click', ()=> this._onAdvance(chapter, slide, topOpt));
    root.querySelector('.js-loop')?.addEventListener('click', ()=>{
      this._markVisited('loop'); this._onLoop(slide);
    });
    root.querySelector('.js-quest')?.addEventListener('click', ()=>{
      this._markVisited('quest'); this._onQuest(slide);
    });
    root.querySelector('.js-weird')?.addEventListener('click', ()=>{
      this._markVisited('weird'); this._onWeird(slide);
    });
  }

// inside export class ChapterEngine { ... } — place below your other handlers
_onCustomer(slide){
  // inside function _onCustomer(slide) { ... }
    const C = slide.customer || {};
    let step = 0;
    let didReveal = false;

    const headerHTML = () => `
    <div class="sm-customer-header">
        <h2 class="sm-ch1-title sm-customer-title">
        ${slide.title || `Customer • ${C.name || 'Guest'}`}
        </h2>
        <div class="sm-customer-meta sm-customer-step-pill">
        <span class="sm-customer-step">Step ${step + 1}/3</span>
        </div>
    </div>
    `;

    const card = (s) => `
    ${s?.img ? `<img class="sm-ch1-img" src="${s.img}" alt="">` : ''}
    <div class="sm-ch1-text">${s?.text || ''}</div>`;

    // render()
    const render = () => {
    let inner = '';
    if (step === 0) inner = card(C.bio);
    else if (step === 1) inner = card(C.lore);
    else {
        inner = `
        ${C.puzzle?.img ? `<img class="sm-ch1-img" src="${C.puzzle.img}" alt="">` : ''}
        <div class="sm-ch1-text">${C.puzzle?.prompt || ''}</div>
        <div class="sm-ch1-reveal-hold"></div>`;
    }

    const controls = (() => {
        if (step < 2) {
        return `
            <div class="sm-choice-list">
            ${step>0 ? `<button class="sm-btn sm-btn-secondary js-prev">Back</button>` : ''}
            <button class="sm-btn sm-btn-primary js-next">Next ➡️</button>
            </div>`;
        }
        return `
        <div class="sm-choice-list">
            <button class="sm-btn sm-btn-secondary js-prev">Back</button>
            <button class="sm-btn sm-btn-primary js-reveal">Reveal</button>
            <button class="sm-btn sm-btn-primary js-serve ${didReveal ? '' : 'is-disabled'}" ${didReveal ? '' : 'disabled'}>Serve the SnowCone ➡️</button>
        </div>`;
    })();

    this._renderFrame(`${headerHTML()}${inner}${controls}`);


    const root = document;

    if (step < 2) {
      root.querySelector('.js-prev')?.addEventListener('click', () => { step = Math.max(0, step-1); render(); });
      root.querySelector('.js-next')?.addEventListener('click', () => { step = Math.min(2, step+1); render(); });
      return;
    }

    // step === 2 (Puzzle)
    const revealBtn = root.querySelector('.js-reveal');
    const serveBtn  = root.querySelector('.js-serve');

    // Keep Serve disabled until didReveal flips
    if (serveBtn) {
      serveBtn.disabled = !didReveal;
      serveBtn.classList.toggle('is-disabled', !didReveal);
    }

    revealBtn?.addEventListener('click', () => {
      const hold = root.querySelector('.sm-ch1-reveal-hold');
      if (hold && !hold.querySelector('.sm-reveal-answer')) {
        const ans = document.createElement('div');
        ans.className = 'sm-reveal-answer is-open';
        ans.innerHTML = C.puzzle?.reveal || '';
        hold.appendChild(ans);
      }
      // 🔓 unlock Serve
      didReveal = true;
      if (serveBtn) {
        serveBtn.disabled = false;
        serveBtn.classList.remove('is-disabled');
      }
    }, { once: true });

    root.querySelector('.js-prev')?.addEventListener('click', () => { step = Math.max(0, step-1); render(); });

    root.querySelector('.js-serve')?.addEventListener('click', () => {
      if (!didReveal) return; // hard gate
      const chapter = this.registry[this.state.chapterId];
      this._onAdvance(chapter, slide, { disabled:false });
    });
  };

  render();
}

  /**
   * 3-option quiz:
   * - slide.mode === 'quiz3'
   * - slide.quiz = {
   *     options: [{ id, label, correct, praise? }, ...],
   *     advanceLabel?: string
   *   }
   * - slide.text = question/prompt
   */
  _renderQuizSlide(chapter, slide) {
    const title = `<h2 class="sm-ch1-title">${slide.title || ''}</h2>`;
    const img   = slide.img ? `<img class="sm-ch1-img" src="${slide.img}" alt="">` : '';
    const prompt = slide.text || '';

    const optionsHtml = (slide.quiz.options || []).map((opt, idx) => `
      <button
        class="sm-btn sm-btn-secondary sm-quiz-choice"
        data-i="${idx}"
        data-correct="${opt.correct ? '1' : '0'}"
      >
        ${opt.label}
      </button>
    `).join('');

    const advanceLabel =
      slide.quiz.advanceLabel ||
      slide.topLabel ||
      slide.soloLabel ||
      'Continue ➡️';

    const inner = `
      ${title}
      ${img}
      <div class="sm-ch1-text">${prompt}</div>

      <div class="sm-choice-list sm-quiz-choices">
        ${optionsHtml}
      </div>

      <div class="sm-ch1-text sm-quiz-note" id="smQuizNote"></div>

      <div class="sm-choice-list">
        <button class="sm-btn sm-btn-primary js-advance is-disabled" disabled>
          ${advanceLabel}
        </button>
      </div>
    `;

    this._renderFrame(inner);

    const root = document;
    const advanceBtn = root.querySelector('.js-advance');
    const note = root.getElementById('smQuizNote');

    if (advanceBtn) {
      advanceBtn.disabled = true;
      advanceBtn.classList.add('is-disabled');
    }

    const opts = slide.quiz.options || [];

    root.querySelectorAll('.sm-quiz-choice').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.i || 0);
        const opt = opts[idx] || {};
        const isCorrect = btn.dataset.correct === '1';

        if (isCorrect) {
          // lock all choices
          root.querySelectorAll('.sm-quiz-choice').forEach(b => {
            b.disabled = true;
            if (b !== btn) b.classList.add('is-disabled');
          });

          // decorate chosen button with check
          if (!btn.classList.contains('is-visited')) {
            btn.classList.add('is-visited');
            btn.innerHTML = `<span class="sm-check" aria-hidden="true">✓</span> ${btn.innerHTML}`;
          }

          if (note) {
            note.innerHTML = opt.praise || 'Nice call.';
          }

          if (advanceBtn) {
            advanceBtn.disabled = false;
            advanceBtn.classList.remove('is-disabled');
          }
        } else {
          // gentle "try again", but keep other buttons live
          if (note) {
            note.innerHTML = opt.praise || 'Not quite—try another one.';
          }
          btn.disabled = true;
          btn.classList.add('is-disabled');
        }
      });
    });

    advanceBtn?.addEventListener('click', () => {
      if (advanceBtn.disabled) return;
      this._onAdvance(chapter, slide, { disabled: false });
    });
  }

    /**
   * Choice/trade slide:
   * - slide.mode === 'choice3'
   * - slide.choices = [
   *     { id, label, praise?, onSelect?({ appState, engine }) }
   *   ]
   * - slide.choiceAdvanceLabel?: string
   */
    _renderChoiceSlide(chapter, slide) {
    const title  = `<h2 class="sm-ch1-title">${slide.title || ''}</h2>`;
    const img    = slide.img ? `<img class="sm-ch1-img" src="${slide.img}" alt="">` : '';
    const prompt = slide.text || '';

    const optionsHtml = (slide.choices || []).map((opt) => `
      <button
        class="sm-btn sm-btn-secondary sm-choice-option"
        data-id="${opt.id}"
      >
        ${opt.label}
      </button>
    `).join('');

    const advanceLabel =
      slide.choiceAdvanceLabel ||
      slide.topLabel ||
      slide.soloLabel ||
      'Continue ➡️';

    const inner = `
      ${title}
      ${img}
      <div class="sm-ch1-text">${prompt}</div>

      <div class="sm-choice-list sm-choice-options">
        ${optionsHtml}
      </div>

      <div class="sm-ch1-text sm-quiz-note" id="smChoiceNote"></div>

      <div class="sm-choice-list">
        <button class="sm-btn sm-btn-primary js-advance is-disabled" disabled>
          ${advanceLabel}
        </button>
      </div>
    `;

    this._renderFrame(inner);

    const root        = document;
    const note        = root.getElementById('smChoiceNote');
    const advanceBtn  = root.querySelector('.js-advance');
    const choices     = slide.choices || [];

    if (advanceBtn) {
      advanceBtn.disabled = true;
      advanceBtn.classList.add('is-disabled');
    }

    let pickedId = null;

    // 🔹 choose exactly one option
    root.querySelectorAll('.sm-choice-option').forEach(btn => {
      btn.addEventListener('click', () => {
        if (pickedId) return; // single-commit

        pickedId = btn.dataset.id;
        const choice = choices.find(c => c.id === pickedId) || {};

        // decorate chosen button
        if (!btn.classList.contains('is-visited')) {
          btn.classList.add('is-visited');
          btn.innerHTML = `<span class="sm-check" aria-hidden="true">✓</span> ${btn.innerHTML}`;
        }

        // lock the other options
        root.querySelectorAll('.sm-choice-option').forEach(b => {
          if (b !== btn) {
            b.disabled = true;
            b.classList.add('is-disabled');
          }
        });

        // side-effect hook
        if (typeof choice.onSelect === 'function') {
          try {
            choice.onSelect({ appState, engine: this });
          } catch (err) {
            console.warn('[Story] choice onSelect failed:', err);
          }
        }

        if (note) {
          note.innerHTML = choice.praise || '';
        }

        if (advanceBtn) {
          advanceBtn.disabled = false;
          advanceBtn.classList.remove('is-disabled');
        }
      });
    });

    // 🔻 THIS is the key part: portal-style routing
    // 🔻 THIS is the key part: portal-style routing
    advanceBtn?.addEventListener('click', () => {
      if (advanceBtn.disabled) return;

      const choice = choices.find(c => c.id === pickedId) || null;

      // If this choice points to another chapter, handle it here
      if (choice && choice.nextChapterId && this.registry[choice.nextChapterId]) {
        // 1) Same reward plumbing as _onAdvance
        this._grantSlideRewards(slide);

        let handled = false;
        if (typeof slide.onAdvance === 'function') {
          try {
            const res = slide.onAdvance({ appState, engine: this, choice });
            handled = (res === true || res === 'handled');
          } catch (err) {
            console.warn('[Story] choice slide.onAdvance error:', err);
          }
        }
        if (handled) return;

        // 2) Treat this as "chapter finished" before portaling out
        if (typeof chapter.onFinish === 'function') {
          try {
            chapter.onFinish({ appState, engine: this });
          } catch (err) {
            console.warn('[Story] choice chapter.onFinish error:', err);
          }
        }

        // 3) Unlock and portal into the new chapter
        this._unlockChapter(choice.nextChapterId);
        this.start(choice.nextChapterId);

        // Optional: jump to a specific slide id inside that chapter
        if (choice.nextId) {
          this._gotoById(choice.nextId);
        }
        return;
      }

      // Fallback: normal per-slide behavior (same-chapter advance / finish)
      this._onAdvance(chapter, slide, { disabled: false });
    });

  }


_onAdvance(chapter, slide, topOpt){
  const last = chapter.slides.length - 1;

  // 1) Normal reward plumbing
  this._grantSlideRewards(slide);

  // 2) Optional slide-level override:
  //    If onAdvance returns true or 'handled', we *do not* auto-advance.
  let handled = false;
  if (typeof slide.onAdvance === 'function') {
    try {
      const res = slide.onAdvance({ appState, engine: this });
      handled = (res === true || res === 'handled');
    } catch (err) {
      console.warn('[Story] slide.onAdvance error:', err);
    }
  }
  if (handled) return;

  // 3) Default flow: step forward or jump to the next chapter / finish
  if (this.state.idx === last) {
    // 🛠️ CHANGED: even if we have nextChapterId, we still treat this as 
    // "chapter finished" and fire chapter.onFinish *before* hopping.
    if (slide.nextChapterId && this.registry[slide.nextChapterId]) {
      // 🔔 NEW: chapter is *finishing* and we are portaling into another
      // chapter → let StoryMode know so it can do XP + (maybe) SFX.
      try {
        const detail = {
          chapterId: this.state?.chapterId || null,
          nextChapterId: slide.nextChapterId,
          mode: 'to_next',
        };
        window.dispatchEvent(new CustomEvent('sm:chapterComplete', { detail }));
      } catch (err) {
        console.warn('[Story] chapterComplete event (to_next) failed:', err);
      }

      if (typeof chapter.onFinish === 'function') {
        try {
          chapter.onFinish({ appState, engine: this });
        } catch (err) {
          console.warn('[Story] chapter.onFinish error:', err);
        }
      }

      this._unlockChapter(slide.nextChapterId);  // make it visible in the menu
      this.start(slide.nextChapterId);
      return;
    }

    // No nextChapterId → normal finish to menu
    if (typeof chapter.onFinish === 'function') {
      try {
        chapter.onFinish({ appState, engine: this });
      } catch (err) {
        console.warn('[Story] chapter.onFinish error:', err);
      }
    }

    this._finishChapter();
  } else {
    this.state.idx++;
    this._renderSlide();
  }
}

// chapterEngine.js — inside export class ChapterEngine { ... }
// chapterEngine.js — inside export class ChapterEngine { ... } in _onQuest(slide){ ... }

// chapterEngine.js — inside export class ChapterEngine { ... }

_onQuest(slide){
  if (!slide.quest) return this._renderSlide();

  // 🔄 Optional: clear any remembered reveals for THIS slide
  const revealPrefix = `${this.state.chapterId}:${this.state.idx}:`;
  if (slide.quest?.resetRevealsOnOpen === true) {
    for (const key of Array.from(this.state.revealed)) {
      if (key.startsWith(revealPrefix)) this.state.revealed.delete(key);
    }
  }

  const stepsBase = slide.quest.getSteps?.(appState, this) ?? slide.quest.steps;
  let i = 0;

  // unique key for "this step on this slide"
  const keyFor = (idx) => `${this.state.chapterId}:${this.state.idx}:${idx}`;

  const grantReward = (reward) => {
    if (!reward) return;
    try {
      if (reward.item) {
        const itemId =
          (typeof reward.item === 'string') ? reward.item :
          (reward.item && typeof reward.item.id === 'string') ? reward.item.id :
          null;

        const payload =
          (typeof reward.item === 'object')
            ? (reward.item.payload ?? reward.payload)
            : reward.payload;

        let qty = 1;
        if (typeof reward.qty === 'number') qty = reward.qty;
        else if (typeof payload?.qty === 'number') qty = payload.qty;

        if (itemId && !appState.hasItem?.(itemId)) {
          appState.addItem?.(itemId, payload ?? { qty });
          pickupPing({
            emoji: (ITEM_DISPLAY?.[itemId]?.emoji || '✨'),
            name:  (ITEM_DISPLAY?.[itemId]?.name  || itemId),
            qty
          });
        }
      }

      if (reward.currency) {
        const amount = reward.currency | 0;
        appState.addCurrency?.(amount);
        // 🔕 no pickupPing for cash
        const chip = document.getElementById('smCash');
        if (chip) chip.textContent = `${appState.getCurrency()} ${CURRENCY_NAME}`;
      }

      appState.saveToStorage?.();
    } catch (e) {
      console.warn('[Story] quest reward grant failed:', e);
    }
  };

  // legacy “completion” payout still honored
  const completionPayout = slide.quest.completionReward || slide.quest.reward || null;

  // tiny helper to toggle a button disabled state
  const setBtnEnabled = (btn, on) => {
    if (!btn) return;
    btn.disabled = !on;
    btn.classList.toggle('is-disabled', !on);
  };

  const renderStep = () => {
    const s   = stepsBase[i] || {};
    const key = keyFor(i);

    // did this step’s reveal already happen?
    const alreadyRevealed = this.state.revealed.has(key);

    // per-step gate; also allow a quest-wide default via slide.quest.requireRevealToAdvance
    const mustReveal       = !!(s.requireRevealToAdvance || slide.quest?.requireRevealToAdvance);
    const hasRevealContent = !!s.reveal;

    // if dev mistakenly requires reveal but no reveal content exists, don't soft-lock
    const gateActive = mustReveal && hasRevealContent;

    const revealBtnHTML = s.reveal
      ? (alreadyRevealed
          ? `<button class="sm-btn sm-btn-primary js-reveal is-visited is-disabled" disabled>
               <span class="sm-check" aria-hidden="true">✓</span> Revealed
             </button>`
          : `<button class="sm-btn sm-btn-primary js-reveal">Reveal</button>`)
      : '';

    const nextLabel = (i < stepsBase.length - 1) ? 'Next' : 'Finish';
    const nextDisabledAtLoad = gateActive && !alreadyRevealed;

    const inner = `
      <h2 class="sm-ch1-title">${slide.quest.title}</h2>
      ${s.img ? `<img class="sm-ch1-img" src="${s.img}" alt="${s.imgAlt ?? ''}">` : ''}
      <div class="sm-ch1-text">${s.text ?? ''}</div>

      <div class="sm-ch1-reveal-hold">
        ${alreadyRevealed && s.reveal
          ? `<div class="sm-reveal-answer is-open">${s.reveal}</div>`
          : ``}
      </div>

      <div class="sm-choice-list">
        ${revealBtnHTML}
        <button class="sm-btn sm-btn-secondary js-next ${nextDisabledAtLoad ? 'is-disabled' : ''}"
                ${nextDisabledAtLoad ? 'disabled' : ''}>
          ${nextLabel}
        </button>
      </div>
    `;

    this._renderFrame(inner);

    const root      = document;
    const nextBtn   = root.querySelector('.js-next');
    const revealBtn = root.querySelector('.js-reveal');
    const hold      = root.querySelector('.sm-ch1-reveal-hold');

    // Reveal → show answer, pay step reward once, unlock Next
    if (revealBtn && !alreadyRevealed) {
      revealBtn.addEventListener('click', () => {
        if (hold && !hold.querySelector('.sm-reveal-answer') && s.reveal) {
          const ans = document.createElement('div');
          ans.className = 'sm-reveal-answer is-open';
          ans.innerHTML = s.reveal;
          hold.appendChild(ans);
        }
        // step-level reward remains supported
        grantReward(s.reward);

        // mark this step revealed
        this.state.revealed.add(key);

        // update the reveal button look
        revealBtn.classList.add('is-visited', 'is-disabled');
        revealBtn.setAttribute('disabled', 'true');
        revealBtn.innerHTML = `<span class="sm-check" aria-hidden="true">✓</span> Revealed`;

        // 🔓 unlock Next for gated steps
        if (gateActive) setBtnEnabled(nextBtn, true);
      }, { once: true });
    }

    // Next/Finish click
    nextBtn?.addEventListener('click', () => {
      // hard gate: if required and not revealed yet, do nothing (soft jiggle vibe)
      if (gateActive && !this.state.revealed.has(key)) {
        nextBtn.style.transform = 'translateY(0) scale(1.02)';
        nextBtn.style.filter = 'brightness(1.05)';
        setTimeout(() => {
          nextBtn.style.transform = '';
          nextBtn.style.filter = '';
        }, 120);
        return;
      }

      // proceed
      if (i < stepsBase.length - 1) {
        i++;
        renderStep();
      } else {
        // ✅ Quest is finishing now
        if (completionPayout) grantReward(completionPayout);

        // ✅ NEW: quest-level complete hook (for stuff like forging Perfect SnowCone)
        if (slide.quest && typeof slide.quest.onComplete === 'function') {
          try {
            slide.quest.onComplete({ appState, engine: this });
          } catch (e) {
            console.warn('[Story] quest onComplete failed:', e);
          }
        }

        this._renderSlide();
      }
    });
  };

  renderStep();
}

  // in chapterEngine.js, replace _onWeird with:
 // in chapterEngine.js
  _onWeird(slide){
  const w = slide.weird;
  if (!w) return this._renderSlide();

  const hasExtra =
    (typeof w.extraWhen === 'function') ? !!w.extraWhen(appState, this) : false;
  const extra = hasExtra
    ? (typeof w.getExtra === 'function' ? w.getExtra(appState, this) : (w.extra || null))
    : null;

  // visited state for the gated note
  const VISIT_SLOT = 'weird.extra';
  const isExtraVisited = () => this._isVisited(VISIT_SLOT);

  // 🔹 resolve the CTA label once; allow per-slide override via w.extraLabel
  const extraLabel =
    (w && typeof w.extraLabel === 'string' && w.extraLabel.trim())
      ? w.extraLabel.trim()
      : 'Show MintSquare'; // <- global default for other slides

  // button factory (defaults to the resolved label above)
  const noteButtonHTML = (label = extraLabel) => {
    const visitedCls = isExtraVisited() ? ' is-visited' : '';
    const check = isExtraVisited() ? '<span class="sm-check" aria-hidden="true">✓</span> ' : '';
    return `<button class="sm-btn sm-btn-primary js-extra${visitedCls}">${check}${label}</button>`;
  };

  const renderMain = () => {
    const inner = `
      <h2 class="sm-ch1-title">${w.title}</h2>
      ${w.img ? `<img class="sm-ch1-img" src="${w.img}" alt="">` : ''}
      <div class="sm-ch1-text">${w.text}</div>
      <div class="sm-choice-list">
        ${extra ? noteButtonHTML() : ''}  <!-- uses extraLabel (e.g., "Reveal More") -->
        <button class="sm-btn sm-btn-secondary js-back">Okay then…</button>
      </div>`;
    this._renderFrame(inner);

    document.querySelector('.js-back')?.addEventListener('click', ()=> this._renderSlide());

    if (extra) {
      document.querySelector('.js-extra')?.addEventListener('click', ()=> {
        this._markVisited(VISIT_SLOT); // mark when opened
        renderExtra();
      }, { once: true });
    }
  };

  const renderExtra = () => {
    const ex = extra || {};
    const inner = `
      <h2 class="sm-ch1-title">${ex.title ?? 'Field Notes'}</h2>
      ${ex.img ? `<img class="sm-ch1-img" src="${ex.img}" alt="">` : ''}
      <div class="sm-ch1-text">${ex.text ?? ''}</div>
      <div class="sm-choice-list">
        <button class="sm-btn sm-btn-secondary js-back">Back</button>
      </div>`;
    this._renderFrame(inner);
    document.querySelector('.js-back')?.addEventListener('click', ()=> renderMain());
  };

  // show the main screen first
  renderMain();
}

}
