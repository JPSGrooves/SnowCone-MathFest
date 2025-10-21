// chapterEngine.js
import { SlideRole, ItemIds, Currency, CURRENCY_NAME } from '../../data/storySchema.js';
import { appState } from '../../data/appState.js';
import { preventDoubleTapZoom } from '../../utils/preventDoubleTapZoom.js';
import { isMuted, toggleMute } from '../../managers/musicManager.js';
import { awardBadge } from '../../managers/badgeManager.js';

const SELECTORS = { container: '#game-container' };
const BASE = import.meta.env.BASE_URL;
const BG_SRC = `${BASE}assets/img/modes/storymodeForest/storyBG.png`;



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
    this.state = {
      chapterId,
      idx: 0,          // 0..4 (five main slides)
      loopStack: [],   // return points
      quest: null,     // active quest step if any
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
  _grantSlideRewards(slide){
    if (!slide || !slide.grants) return;
    try {
      const give = (id, qty = 1, payload = undefined) => {
        // prefer your appState helpers; avoid dupes if you track possession
        if (appState.hasItem?.(id)) return;
        // support either (id, payload) or (id, {qty,…})
        if (payload) {
          appState.addItem?.(id, payload);
        } else {
          appState.addItem?.(id, { qty });
        }
      };

      // grants can be ['work_badge'] OR [{ item:'work_badge', qty:1, payload:{...}}]
      slide.grants.forEach(g => {
        if (typeof g === 'string') give(g, 1);
        else if (g && typeof g === 'object') {
          if (g.item) give(g.item, g.qty ?? 1, g.payload);
          if (g.currency) appState.addCurrency?.(g.currency|0);
        }
      });
      appState.saveToStorage?.();
    } catch (e) {
      console.warn('[Story] grant failed:', e);
    }
  }



  _renderFrame(inner){
    const container = document.querySelector(SELECTORS.container);
    container.innerHTML = `
        <div class="sm-aspect-wrap">
        <div class="sm-game-frame sm-is-intro">
            <img id="modeBackground" class="sm-bg-img" src="${BG_SRC}" alt="Story Mode Background"/>
            <section class="sm-ch1">
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
            ${appState.listItems().map(it=>`
            <button class="sm-item" data-id="${it.id}">
                <span class="sm-item-emoji">${it.meta?.emoji ?? '📦'}</span>
                <span class="sm-item-name">${it.name}</span>
                ${it.qty>1 ? `<span class="sm-item-qty">×${it.qty}</span>`:``}
            </button>
            `).join('') || `<div class="sm-empty">You’ve got pockets, but no treasures yet.</div>`}
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


  _backToMenu(){
    // reuse your existing back logic
    const evt = new CustomEvent('sm:backToChapterMenu');
    window.dispatchEvent(evt);
  }

  _finishChapter(){
    const evt = new CustomEvent('sm:backToChapterMenu');
    window.dispatchEvent(evt); // storyMode.js already listens and shows the chapter menu
  }


  _renderSlide(){
    const chapter = this.registry[this.state.chapterId];
    const slide = chapter.slides[this.state.idx];
    const title = `<h2 class="sm-ch1-title">${slide.title}</h2>`;
    const img = slide.img ? `<img class="sm-ch1-img" src="${slide.img}" alt="">` : '';
    const text = slide.text ? `<div class="sm-ch1-text">${slide.text}</div>` : '';

    // dynamic top choice label / availability (for Slide 5 in Ch1)
    // dynamic top choice label / availability (+ “Finish Chapter” on last slide)
  // dynamic top choice label / availability (+ “Go to Chapter 2” on last slide if configured)
  const isLast = this.state.idx === (chapter.slides.length - 1);
  const defaultTop =
    (isLast && slide.nextChapterId && this.registry[slide.nextChapterId])
      ? 'Go to Chapter 2 ➡️'
      : (isLast ? 'Finish Chapter' : 'Continue ➡️');

  // keep supporting slide.dynamicTop...
  const topOpt = slide.dynamicTop?.(appState) ?? { label: slide.topLabel ?? defaultTop, disabled: false };

  // helper (must exist before we use it)
  const resolve = (v) => (typeof v === 'function' ? v(appState, this) : v);

  // category prefixes (can be overridden per slide)
  const kinds = {
    top:   slide.meta?.top?.kind   || 'Story',
    loop:  slide.meta?.loop?.kind  || 'Puzzle',
    quest: slide.meta?.quest?.kind || 'Quest',
    weird: slide.meta?.weird?.kind || 'Lore',
  };

  // short descriptors (strings or functions)
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
      const primary =
        (slot === 'quest') || (slot === 'top'); // keep your visual priority
      const cls = primary ? 'sm-btn sm-btn-primary' : 'sm-btn sm-btn-secondary';
      const disabled = (slot === 'top' && topOpt.disabled) ? 'disabled' : '';

      // map slot → handler class used by listeners
      const handlerClass = (slot === 'top') ? 'js-advance' : `js-${slot}`;

      // slot maps to kinds/desc keys ('top','loop','quest','weird')
      const kindLabel = kinds[slot === 'weird' ? 'weird' : slot];
      const textLabel = desc[slot === 'weird' ? 'weird' : slot];

      return `
        <button class="${cls} ${handlerClass}${visitedClass}" ${disabled}>
          ${check}${lbl(kindLabel, textLabel)}
        </button>`;
    };



    // 🔄 Lore → Quest → Puzzle → Story (uses buildBtn so visited styles appear)
    const choices = `
      ${buildBtn('weird')}
      ${buildBtn('quest')}
      ${buildBtn('loop')}
      ${buildBtn('top')}
    `;

  // compute CTA after resolve/choices exist
  const ctaLabel = resolve(slide.soloLabel ?? slide.topLabel ?? 'Continue ➡️');
  const body = (slide.mode === 'solo')
    ? `${title}${img}${text}
        <div class="sm-choice-list">
          <button class="sm-btn sm-btn-primary js-advance">${ctaLabel}</button>
        </div>`
    : `${title}${img}${text}<div class="sm-choice-list">${choices}</div>`;



    this._renderFrame(body);

const root = document;

// Story / advance
root.querySelector('.js-advance')?.addEventListener('click', ()=> this._onAdvance(chapter, slide, topOpt));

// Puzzle (loop)
root.querySelector('.js-loop')?.addEventListener('click', ()=>{
  this._markVisited('loop');   // ✅ mark as seen
  this._onLoop(slide);
});

// Quest
root.querySelector('.js-quest')?.addEventListener('click', ()=>{
  this._markVisited('quest');  // ✅ mark as seen
  this._onQuest(slide);
});

// Lore (weird)
root.querySelector('.js-weird')?.addEventListener('click', ()=>{
  this._markVisited('weird');  // ✅ mark as seen
  this._onWeird(slide);
});

  }

  _onAdvance(chapter, slide, topOpt){
    const last = chapter.slides.length - 1;

    // 🔔 new: process any slide-level item/currency grants
    this._grantSlideRewards(slide);

    if (typeof slide.onAdvance === 'function') {
      slide.onAdvance({ appState, engine: this });
    }

    if (this.state.idx === last) {
      if (slide.nextChapterId && this.registry[slide.nextChapterId]) {
        this.start(slide.nextChapterId);
        return;
      }
      if (typeof chapter.onFinish === 'function') {
        chapter.onFinish({ appState, engine: this });
      }
      this._finishChapter();
    } else {
      this.state.idx++;
      this._renderSlide();
    }
  }



  _onLoop(slide){
    if (!slide.loop) return this._renderSlide();
    const inner = `
      <h2 class="sm-ch1-title">${slide.loop.title}</h2>
      ${slide.loop.img ? `<img class="sm-ch1-img" src="${slide.loop.img}" alt="">` : ''}
      <div class="sm-ch1-text">${slide.loop.text}</div>
      <div class="sm-choice-list">
        <button class="sm-btn sm-btn-secondary js-back">Back</button>
      </div>`;
    this._renderFrame(inner);
    document.querySelector('.js-back')?.addEventListener('click', ()=> this._renderSlide());
  }

_onQuest(slide){
  if (!slide.quest) return this._renderSlide();

  // Allow slide.quest.getSteps(appState, engine) to override static steps
  const stepsBase = slide.quest.getSteps?.(appState, this) ?? slide.quest.steps;
  let i = 0;

  const doStep = () => {
    const s = stepsBase[i];
    const key = `${this.state.chapterId}:${this.state.idx}:${i}`;
    const already = this.state.revealed.has(key);

    const inner = `
      <h2 class="sm-ch1-title">${slide.quest.title}</h2>
      ${s.img ? `<img class="sm-ch1-img" src="${s.img}" alt="">` : ''}
      <div class="sm-ch1-text">${s.text}</div>

      <div class="sm-ch1-reveal-hold">
        ${already ? `<div class="sm-reveal-answer is-open">${s.reveal ?? ''}</div>` : ``}
      </div>

      <div class="sm-choice-list">
        ${s.reveal && !already ? `<button class="sm-btn sm-btn-primary js-reveal">Reveal</button>` : ''}
        <button class="sm-btn sm-btn-secondary js-next">${i<stepsBase.length-1 ? 'Next' : 'Finish'}</button>
      </div>`;
    this._renderFrame(inner);

    const revealBtn = document.querySelector('.js-reveal');
    if (revealBtn) {
      revealBtn.addEventListener('click', () => {
        const hold = document.querySelector('.sm-ch1-reveal-hold');
        if (hold && !hold.querySelector('.sm-reveal-answer')) {
          const ans = document.createElement('div');
          ans.className = 'sm-reveal-answer is-open';
          ans.innerHTML = s.reveal ?? '';
          hold.appendChild(ans);
          this.state.revealed.add(key);
        }
        revealBtn.disabled = true;
        revealBtn.classList.add('is-disabled');
        revealBtn.textContent = 'Revealed';
      }, { once: true });
    }

    document.querySelector('.js-next')?.addEventListener('click', () => {
      if (i < stepsBase.length - 1) { i++; doStep(); }
      else {
        try {
          if (slide.quest.reward?.item) appState.addItem(slide.quest.reward.item.id, slide.quest.reward.item.payload);
          if (slide.quest.reward?.currency) appState.addCurrency(slide.quest.reward.currency|0);
          appState.saveToStorage?.();
        } catch {}
        this._renderSlide();
      }
    });
  };

  doStep();
}

  // in chapterEngine.js, replace _onWeird with:
  _onWeird(slide){
    const w = slide.weird;
    if (!w) return this._renderSlide();

    const hasExtra =
        typeof w.extraWhen === 'function' ? !!w.extraWhen(appState, this) : false;
    const extra = hasExtra
        ? (typeof w.getExtra === 'function' ? w.getExtra(appState, this) : (w.extra || null))
        : null;

    const renderMain = () => {
        const inner = `
        <h2 class="sm-ch1-title">${w.title}</h2>
        ${w.img ? `<img class="sm-ch1-img" src="${w.img}" alt="">` : ''}
        <div class="sm-ch1-text">${w.text}</div>
        <div class="sm-choice-list">
            ${extra ? `<button class="sm-btn sm-btn-primary js-extra">See Note</button>` : ''}
            <button class="sm-btn sm-btn-secondary js-back">Okay then…</button>
        </div>`;
        this._renderFrame(inner);
        document.querySelector('.js-back')?.addEventListener('click', ()=> this._renderSlide());
        if (extra) {
        document.querySelector('.js-extra')?.addEventListener('click', ()=> renderExtra());
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

    // ✅ Always show the main screen first
    renderMain();
  }

}
