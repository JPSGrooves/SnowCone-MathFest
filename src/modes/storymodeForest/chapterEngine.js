// chapterEngine.js
import { SlideRole, ItemIds, Currency, CURRENCY_NAME } from '../../data/storySchema.js';
import { appState } from '../../data/appState.js';
import { preventDoubleTapZoom } from '../../utils/preventDoubleTapZoom.js';
import { isMuted, toggleMute } from '../../managers/musicManager.js';
import { awardBadge } from '../../managers/badgeManager.js';
import { ITEM_DISPLAY} from '../../data/storySchema.js';

const SELECTORS = { container: '#game-container' };
const BASE = import.meta.env.BASE_URL;
const BG_SRC = `${BASE}assets/img/modes/storymodeForest/storyBG.png`;

// ─────────────────────────────
// inline unlock store (no new files)
// ─────────────────────────────
const SM_UNLOCK_KEY = 'sm_unlocked_chapters_v1';

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
  // mark a chapter unlocked (engine-level, idempotent)
  _unlockChapter(id) {
    try {
      // if your appState also tracks unlocks, let it run (no-op if missing)
      if (typeof appState?.unlockChapter === 'function') appState.unlockChapter(id);
    } catch(e) {}
    smUnlock(id); // inline store above (localStorage)
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

  // Route CUSTOMER slides to the mini-runner
  if (slide?.role === SlideRole.CUSTOMER || slide?.role === 'customer') {
    this._onCustomer(slide);
    return;
  }

  // ───────────────────────────────────────────
  // Gating: require side-path visits before "Advance"
  // You can set either:
  //   slide.requireAllSidePaths = true
  // or:
  //   slide.requireVisited = ['weird','quest','loop']  // any subset, order agnostic
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

_onAdvance(chapter, slide, topOpt){
  const last = chapter.slides.length - 1;

  this._grantSlideRewards(slide);

  if (typeof slide.onAdvance === 'function') {
    slide.onAdvance({ appState, engine: this });
  }

  if (this.state.idx === last) {
    if (slide.nextChapterId && this.registry[slide.nextChapterId]) {
      this._unlockChapter(slide.nextChapterId);  // make it visible in the menu
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

// chapterEngine.js — inside export class ChapterEngine { ... }
// chapterEngine.js — inside export class ChapterEngine { ... } in _onQuest(slide){ ... }

_onQuest(slide){
  if (!slide.quest) return this._renderSlide();

  const stepsBase = slide.quest.getSteps?.(appState, this) ?? slide.quest.steps;
  let i = 0;

  const keyFor = (idx) => `${this.state.chapterId}:${this.state.idx}:${idx}`;

  const grantReward = (reward) => {
    if (!reward) return;
    try {
      // item: string OR { id, payload }
      if (reward.item) {
        const itemId = (typeof reward.item === 'string')
          ? reward.item
          : reward.item.id;
        const payload = (typeof reward.item === 'object')
          ? (reward.item.payload ?? reward.payload)
          : reward.payload;
        if (itemId && !appState.hasItem?.(itemId)) {
          appState.addItem?.(itemId, payload);
        }
      }
      if (reward.currency) appState.addCurrency?.(reward.currency|0);
      appState.saveToStorage?.();
    } catch (e) {
      console.warn('[Story] quest reward grant failed:', e);
    }
  };

  // ⬇️ NEW: treat legacy quest.reward as a completion fallback
  const completionPayout = slide.quest.completionReward || slide.quest.reward || null;

  const renderStep = () => {
    const s = stepsBase[i] || {};
    const key = keyFor(i);
    const already = this.state.revealed.has(key);

    const revealBtnHTML = s.reveal ? (already
      ? `<button class="sm-btn sm-btn-primary js-reveal is-visited is-disabled" disabled>
           <span class="sm-check" aria-hidden="true">✓</span> Revealed
         </button>`
      : `<button class="sm-btn sm-btn-primary js-reveal">Reveal</button>`)
      : '';

    const inner = `
      <h2 class="sm-ch1-title">${slide.quest.title}</h2>
      ${s.img ? `<img class="sm-ch1-img" src="${s.img}" alt="${s.imgAlt ?? ''}">` : ''}
      <div class="sm-ch1-text">${s.text ?? ''}</div>
      <div class="sm-ch1-reveal-hold">
        ${already ? `<div class="sm-reveal-answer is-open">${s.reveal ?? ''}</div>` : ``}
      </div>
      <div class="sm-choice-list">
        ${revealBtnHTML}
        <button class="sm-btn sm-btn-secondary js-next">${i < stepsBase.length - 1 ? 'Next' : 'Finish'}</button>
      </div>`;

    this._renderFrame(inner);

    const root = document;

    // Step reveal → show, award s.reward once
    const rb = root.querySelector('.js-reveal');
    if (rb && !already) {
      rb.addEventListener('click', () => {
        const hold = root.querySelector('.sm-ch1-reveal-hold');
        if (hold && !hold.querySelector('.sm-reveal-answer')) {
          const ans = document.createElement('div');
          ans.className = 'sm-reveal-answer is-open';
          ans.innerHTML = s.reveal ?? '';
          hold.appendChild(ans);
        }
        grantReward(s.reward);                 // ← step-level reward still supported
        this.state.revealed.add(key);
        rb.classList.add('is-visited','is-disabled');
        rb.setAttribute('disabled','true');
        rb.innerHTML = `<span class="sm-check" aria-hidden="true">✓</span> Revealed`;
      }, { once: true });
    }

    // Next/Finish
    root.querySelector('.js-next')?.addEventListener('click', () => {
      if (i < stepsBase.length - 1) {
        i++;
        renderStep();
      } else {
        // ⬇️ NEW: pay completion reward OR legacy quest.reward here
        if (completionPayout) grantReward(completionPayout);
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
