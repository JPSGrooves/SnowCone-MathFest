// 🧠 Module-scoped state (replace your globals at the top)
const GRID_SIZE = 24; // 4x6
let selectedTents = new Set();
let activeLine = [];
let gridEls = [];
let onScoreCallback = null;

// keep strong refs so cleanup actually works
let refs = {
  wrapper: null,
  grid: null,
  svg: null,
  mo: null,
  resizeObs: null,
  listeners: {
    onResize: null,
    onOrient: null,
    onScroll: null,
    onTransitionEnd: null,
  },
  pendingRAF: 0,
};

const KC_DEBUG = true;
function dbg(...args){ if (KC_DEBUG) console.log('[kc-line]', ...args); }


// 🔺 add these near your other module-scoped vars
let isResolving = false; // prevents double-firing while we handle success

// swipe state lives here so multiple mounts don't collide
let swipeState = {
  pointerDown: false,
  startX: 0,
  startY: 0,
  tentRects: new Map(),     // index -> DOMRect
  touchedIndices: new Set() // dedupe while dragging
};

let swipeTracking = {
  pointerDown: false,
  touchedIndices: new Set()
};


// keep the path object but allow reset in cleanup
let guidePath = null;


export function createTentLineGame(onScore) {
  onScoreCallback = onScore;
  selectedTents.clear();
  gridEls = [];

  const wrapper = document.createElement('div');
  wrapper.className = 'kc-tent-wrap';
  refs.wrapper = wrapper;

  const grid = document.createElement('div');
  grid.className = 'kc-tent-grid';
  wrapper.appendChild(grid);
  refs.grid = grid;

  // SVG overlay (scoped inside this grid)
  const svgOverlay = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svgOverlay.classList.add('kc-glow-overlay');
  svgOverlay.setAttribute('width', '100%');
  svgOverlay.setAttribute('height', '100%');
  svgOverlay.setAttribute('preserveAspectRatio', 'none');
  svgOverlay.style.pointerEvents = 'none';
  grid.appendChild(svgOverlay);
  refs.svg = svgOverlay;

  ensureGuideDefs(svgOverlay);
  ensureGuidePath(svgOverlay);

  // Below-the-grid area
  const spaceBelow = document.createElement('div');
  spaceBelow.className = 'kc-tent-space-below';
  const successMsg = document.createElement('div');
  successMsg.className = 'kc-success-msg';
  const dinoIcon = document.createElement('img');
  dinoIcon.className = 'kc-dino-icon';
  dinoIcon.src = `${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/stegoVider.png`;
  dinoIcon.alt = 'Dino Divider';
  spaceBelow.appendChild(successMsg);
  spaceBelow.appendChild(dinoIcon);
  wrapper.appendChild(spaceBelow);

  // Cells
  for (let i = 0; i < GRID_SIZE; i++) {
    const cell = document.createElement('div');
    cell.className = 'kc-tent-inner-cell';
    cell.dataset.index = i;

    const img = document.createElement('img');
    img.className = 'kc-tent-img';
    img.src = `${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/tent.png`;
    img.alt = 'Tent';

    cell.appendChild(img);
    grid.appendChild(cell);
    gridEls.push({ cell, img, index: i });
  }

  setupSwipeHandlers(grid);

  // ✅ keep *references* for cleanup
  refs.listeners.onTransitionEnd = () => drawLineWhenReady();
  grid.addEventListener('transitionend', refs.listeners.onTransitionEnd);

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => drawLineWhenReady());
  }

  refs.listeners.onScroll = () => drawLineWhenReady();
  window.addEventListener('scroll', refs.listeners.onScroll, { passive: true });

  // mutation observer scoped to the grid
  const mo = new MutationObserver(() => drawLineWhenReady());
  mo.observe(grid, { attributes: true, attributeFilter: ['class', 'style'] });
  refs.mo = mo;

  // Resize observer
  const ro = new ResizeObserver(() => {
    if (grid.getBoundingClientRect().height > 0 && activeLine.length) {
      drawLineWhenReady();
    }
  });
  ro.observe(grid);
  refs.resizeObs = ro;

  // window listeners (store refs so we can remove them)
  refs.listeners.onResize = () => redrawLineSoon();
  refs.listeners.onOrient = () => redrawLineSoon();
  window.addEventListener('resize', refs.listeners.onResize, { passive: true });
  window.addEventListener('orientationchange', refs.listeners.onOrient, { passive: true });

  return wrapper;
}

function setupSwipeHandlers(grid) {
  const seen = new Set();

  const onPointerDown = (e) => {
    swipeState.pointerDown = true;
    seen.clear();
    swipeState.touchedIndices.clear();
    swipeState.startX = e.clientX;
    swipeState.startY = e.clientY;

    swipeState.tentRects.clear();
    gridEls.forEach(({ cell }, index) => {
      swipeState.tentRects.set(index, cell.getBoundingClientRect());
    });

    processHit(e); // immediate hit
  };

  const onPointerMove = (e) => {
    if (!swipeState.pointerDown) return;
    const dx = Math.abs(e.clientX - swipeState.startX);
    const dy = Math.abs(e.clientY - swipeState.startY);
    if (Math.hypot(dx, dy) > 5) processHit(e);
  };

  const endSwipe = () => {
    swipeState.pointerDown = false;
    seen.clear();
    swipeState.touchedIndices.clear();
  };

  const processHit = (e) => {
    if (!swipeState.pointerDown) return;
    const x = e.clientX, y = e.clientY;

    for (const [index, rect] of swipeState.tentRects.entries()) {
      const marginX = rect.width * 0.15;
      const marginY = rect.height * 0.15;
      const inside =
        x >= rect.left + marginX && x <= rect.right - marginX &&
        y >= rect.top + marginY && y <= rect.bottom - marginY;

      if (inside && !seen.has(index)) {
        seen.add(index);
        toggleTent(index);
        break;
      }
    }
  };

  grid.addEventListener('pointerdown', onPointerDown);
  grid.addEventListener('pointermove', onPointerMove);
  grid.addEventListener('pointerup', endSwipe);
  const onDocUp = () => endSwipe();
  const onDocCancel = () => endSwipe();
  document.addEventListener('pointerup', onDocUp);
  document.addEventListener('pointercancel', onDocCancel);

  // save refs for cleanup
  refs.listeners.swipe_onPointerDown = onPointerDown;
  refs.listeners.swipe_onPointerMove = onPointerMove;
  refs.listeners.swipe_onPointerUp   = endSwipe;
  refs.listeners.swipe_docUp         = onDocUp;
  refs.listeners.swipe_docCancel     = onDocCancel;
}



function ensureGuideDefs(svg) {
  if (!svg) return;

  const NS = "http://www.w3.org/2000/svg";

  // ensure a single <defs>
  let defs = svg.querySelector("defs");
  if (!defs) {
    defs = document.createElementNS(NS, "defs");
    svg.appendChild(defs);
  }

  // ===== Gradient (kcPulseGrad) =====
  let gradient = svg.querySelector("#kcPulseGrad");
  if (!gradient) {
    gradient = document.createElementNS(NS, "linearGradient");
    gradient.setAttribute("id", "kcPulseGrad");
    gradient.setAttribute("x1", "0%");
    gradient.setAttribute("y1", "0%");
    gradient.setAttribute("x2", "100%");
    gradient.setAttribute("y2", "0%");

    const s1 = document.createElementNS(NS, "stop");
    s1.setAttribute("offset", "0%");
    s1.setAttribute("stop-color", "#00ff66");
    const s1Anim = document.createElementNS(NS, "animate");
    s1Anim.setAttribute("attributeName", "stop-color");
    s1Anim.setAttribute("values", "#00ff66; #66ff99; #00ff66");
    s1Anim.setAttribute("dur", "1.4s");
    s1Anim.setAttribute("repeatCount", "indefinite");
    s1.appendChild(s1Anim);

    const s2 = document.createElementNS(NS, "stop");
    s2.setAttribute("offset", "100%");
    s2.setAttribute("stop-color", "#00ffaa");
    const s2Anim = document.createElementNS(NS, "animate");
    s2Anim.setAttribute("attributeName", "stop-color");
    s2Anim.setAttribute("values", "#00ffaa; #99ffcc; #00ffaa");
    s2Anim.setAttribute("dur", "1.4s");
    s2Anim.setAttribute("repeatCount", "indefinite");
    s2.appendChild(s2Anim);

    gradient.appendChild(s1);
    gradient.appendChild(s2);
    defs.appendChild(gradient);
  }

  // ===== Filter (kcGlow) =====
  let filter = svg.querySelector("#kcGlow");
  if (!filter) {
    filter = document.createElementNS(NS, "filter");
    filter.setAttribute("id", "kcGlow");
    filter.setAttribute("x", "-50%");
    filter.setAttribute("y", "-50%");
    filter.setAttribute("width", "200%");
    filter.setAttribute("height", "200%");
    filter.setAttribute("filterUnits", "userSpaceOnUse");

    const blur = document.createElementNS(NS, "feGaussianBlur");
    blur.setAttribute("in", "SourceGraphic");
    blur.setAttribute("stdDeviation", "3");
    blur.setAttribute("result", "blur"); // ✅ critical so feMerge can reference it

    const blurAnim = document.createElementNS(NS, "animate");
    blurAnim.setAttribute("attributeName", "stdDeviation");
    blurAnim.setAttribute("values", "3;6;3");
    blurAnim.setAttribute("dur", "1.2s");
    blurAnim.setAttribute("repeatCount", "indefinite");
    blur.appendChild(blurAnim);

    const merge = document.createElementNS(NS, "feMerge");
    const m1 = document.createElementNS(NS, "feMergeNode");
    m1.setAttribute("in", "blur"); // matches blur's result
    const m2 = document.createElementNS(NS, "feMergeNode");
    m2.setAttribute("in", "SourceGraphic");
    merge.appendChild(m1);
    merge.appendChild(m2);

    filter.appendChild(blur);
    filter.appendChild(merge);
    defs.appendChild(filter);
  }
}


function ensureGuidePath(svg) {
  if (!svg) return;

  // if we had a previous path from another mount, re-home it
  if (guidePath && guidePath.ownerSVGElement !== svg) {
    try { svg.appendChild(guidePath); } catch {}
  }

  // create a new one if missing or detached
  if (!guidePath || !svg.contains(guidePath)) {
    guidePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    guidePath.setAttribute("stroke", "url(#kcPulseGrad)");
    guidePath.setAttribute("stroke-width", "8");
    guidePath.setAttribute("fill", "none");
    guidePath.setAttribute("stroke-linecap", "round");
    guidePath.setAttribute("filter", "url(#kcGlow)");
    guidePath.setAttribute("stroke-dasharray", "14 10");

    const dashAnim = document.createElementNS("http://www.w3.org/2000/svg", "animate");
    dashAnim.setAttribute("attributeName", "stroke-dashoffset");
    dashAnim.setAttribute("values", "0;-48");
    dashAnim.setAttribute("dur", "1.2s");
    dashAnim.setAttribute("repeatCount", "indefinite");
    guidePath.appendChild(dashAnim);

    const widthAnim = document.createElementNS("http://www.w3.org/2000/svg", "animate");
    widthAnim.setAttribute("attributeName", "stroke-width");
    widthAnim.setAttribute("values", "8;11;8");
    widthAnim.setAttribute("dur", "1.2s");
    widthAnim.setAttribute("repeatCount", "indefinite");
    guidePath.appendChild(widthAnim);

    svg.appendChild(guidePath);
  }
}


function drawLineWhenReady() {
  // If we're mid celebration, don't lose the draw; queue a retry.
  if (isResolving) {
    if (refs.pendingRAF) cancelAnimationFrame(refs.pendingRAF);
    refs.pendingRAF = requestAnimationFrame(() => drawLineWhenReady());
    return;
  }
  if (refs.pendingRAF) cancelAnimationFrame(refs.pendingRAF);
  refs.pendingRAF = requestAnimationFrame(async () => {
    await waitForImages();
    drawLineBurst(36);
  });
}



// double-rAF helper stays
function redrawLineSoon() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      drawLineWhenReady();
    });
  });
}

// 🔒 take one stab, return true on success
function drawLineWhenReadyOnce() {
  const svg  = refs.svg;
  const grid = refs.grid;

  if (!svg)  { dbg('no svg');  return false; }
  if (!grid) { dbg('no grid'); return false; }
  if (!activeLine?.length) { dbg('no activeLine'); return false; }

  // Make sure defs + path exist *now*
  ensureGuideDefs(svg);
  ensureGuidePath(svg);
  if (!guidePath || !svg.contains(guidePath)) {
    dbg('guidePath missing/DETACHED, re-creating');
    ensureGuidePath(svg);
    if (!guidePath) return false;
  }

  const rect1 = grid.getBoundingClientRect?.();
  if (!rect1) { dbg('no rect1'); return false; }
  if (rect1.width <= 0 || rect1.height <= 0) { dbg('grid size 0', rect1); return false; }

  // settle check
  const rect2 = grid.getBoundingClientRect();
  const unsettled = (Math.abs(rect2.width - rect1.width) > 0.1) || (Math.abs(rect2.height - rect1.height) > 0.1);
  if (unsettled) { dbg('layout unsettled', rect1, rect2); return false; }

  const points = activeLine.map(i => {
    const r = gridEls[i]?.cell?.getBoundingClientRect?.();
    if (!r) return null;
    return { x: r.left - rect1.left + r.width / 2, y: r.top - rect1.top + r.height / 2 };
  });

  if (!points.length) { dbg('no points'); return false; }
  if (points.some(p => !p || !isFinite(p.x) || !isFinite(p.y))) { dbg('bad points', points); return false; }

  // make sure svg itself isn't display:none
  const cs = getComputedStyle(svg);
  if (cs.display === 'none' || cs.opacity === '0' || cs.visibility === 'hidden') {
    dbg('svg hidden by CSS', {display: cs.display, opacity: cs.opacity, visibility: cs.visibility});
    return false;
  }

  svg.setAttribute('viewBox', `0 0 ${rect1.width} ${rect1.height}`);

  // last sanity: ensure path is in the correct svg and visible
  if (guidePath.ownerSVGElement !== svg) {
    try { svg.appendChild(guidePath); } catch {}
    dbg('re-homed guidePath');
  }
  guidePath.setAttribute('stroke', 'url(#kcPulseGrad)');
  guidePath.setAttribute('filter', 'url(#kcGlow)');
  guidePath.style.opacity = '1';

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) d += ` L ${points[i].x} ${points[i].y}`;
  guidePath.setAttribute('d', d);

  // --- paint resilience: check bbox & kick renderer if needed ---
  let bboxOK = true;
  try {
    const bb = guidePath.getBBox();
    bboxOK = bb && bb.width > 0 && bb.height > 0;
  } catch {
    // some engines throw when not painted yet; treat as not ok
    bboxOK = false;
  }

  if (!bboxOK) {
    dbg('bbox empty -> forcing repaint');
    forceRepaintPath(svg, guidePath);

    // re-check once after the poke
    try {
      const bb2 = guidePath.getBBox();
      bboxOK = bb2 && bb2.width > 0 && bb2.height > 0;
    } catch { bboxOK = false; }
  }

  // if still not painting, nuke & rebuild defs, or fall back to solid stroke
  if (!bboxOK) {
    dbg('still empty -> refreshing defs');
    refreshDefs(svg);
    guidePath.setAttribute('stroke', 'url(#kcPulseGrad)');
    guidePath.setAttribute('filter', 'url(#kcGlow)');
    forceRepaintPath(svg, guidePath);

    // final fallback (no filter/gradient)
    try {
      const bb3 = guidePath.getBBox();
      if (!(bb3 && bb3.width > 0 && bb3.height > 0)) {
        dbg('final fallback -> solid stroke, no filter');
        guidePath.removeAttribute('filter');
        guidePath.setAttribute('stroke', '#00ffaa'); // solid neon
      }
    } catch {
      dbg('final fallback -> solid stroke, no filter (exception path)');
      guidePath.removeAttribute('filter');
      guidePath.setAttribute('stroke', '#00ffaa');
    }
  }

  guidePath.style.opacity = '1';
  dbg('draw ok');
  return true;

}




function drawLineGlow({ svgOverlay, activeLine, gridEls }) {
  if (!svgOverlay || !activeLine.length) return;

  ensureGuideDefs(svgOverlay);
  ensureGuidePath(svgOverlay);

  const gridRect = svgOverlay.parentElement.getBoundingClientRect();
  if (!gridRect || gridRect.width === 0 || gridRect.height === 0) return;

  svgOverlay.setAttribute('viewBox', `0 0 ${gridRect.width} ${gridRect.height}`);

  const points = activeLine.map(i => {
    const rect = gridEls[i]?.cell?.getBoundingClientRect();
    return rect
      ? { x: rect.left - gridRect.left + rect.width / 2, y: rect.top - gridRect.top + rect.height / 2 }
      : { x: 0, y: 0 };
  });

  if (points.length === 0 || points.every(p => p.x === 0 && p.y === 0)) {
    requestAnimationFrame(() => drawLineGlow({ svgOverlay, activeLine, gridEls }));
    return;
  }

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) d += ` L ${points[i].x} ${points[i].y}`;
  guidePath.setAttribute('d', d);
  guidePath.style.opacity = '1';
}


function pickNewLine() {
  const patterns = [
    [0,1,2,3],[4,5,6,7],[8,9,10,11],[12,13,14,15],[16,17,18,19],[20,21,22,23],
    [0,4,8,12,16,20],[1,5,9,13,17,21],[2,6,10,14,18,22],[3,7,11,15,19,23],
    [0,5,10,15],[4,9,14,19],[8,13,18,23],[3,6,9,12],[7,10,13,16],[11,14,17,20]
  ];
  activeLine = patterns[Math.floor(Math.random() * patterns.length)];
  clearTentGrid();

  // Phase A: next rAF
  requestAnimationFrame(() => drawLineWhenReady());

  // Phase B: double-rAF after that
  redrawLineSoon();

  // Phase C: late retry after images/layout
  setTimeout(() => {
    dbg('late retry');
    drawLineWhenReady();
  }, 120);

  // Phase D: final hail-mary after a full second
  setTimeout(() => {
    dbg('very late retry');
    drawLineBurst(60);
  }, 1000);
}

function forceRepaintPath(svg, path) {
  // poke the renderer
  path.style.transition = 'none';
  const prevFilter = path.getAttribute('filter');
  path.removeAttribute('filter');
  path.getBoundingClientRect(); // flush
  if (prevFilter) path.setAttribute('filter', prevFilter);

  // nudge dasharray a hair (no visual change)
  const da = path.getAttribute('stroke-dasharray') || '14 10';
  path.setAttribute('stroke-dasharray', da === '14 10' ? '14.01 10' : '14 10');
}

function refreshDefs(svg) {
  // re-create gradient/filter to break any stale GPU state
  const defs = svg.querySelector('defs') || svg.insertBefore(document.createElementNS(svg.namespaceURI,'defs'), svg.firstChild);

  const oldGrad = svg.querySelector('#kcPulseGrad');
  if (oldGrad) oldGrad.remove();
  const oldGlow = svg.querySelector('#kcGlow');
  if (oldGlow) oldGlow.remove();

  // rebuild exactly like your ensureGuideDefs
  ensureGuideDefs(svg);
}


function checkIfSolved() {

  const selected = Array.from(selectedTents).sort((a, b) => a - b);
  const line = [...activeLine].sort((a, b) => a - b);
  const solvedByAll = selectedTents.size === GRID_SIZE;
  const solvedByLine =
    selected.length === line.length &&
    selected.every((val, i) => val === line[i]);

  if (!(solvedByAll || solvedByLine)) return;

  isResolving = true;

  if (solvedByLine) {
    flashLineSuccess();
  } else {
    gridEls.forEach(({ img }) => {
      img.classList.remove('tent-flash');
      void img.offsetWidth;
      img.classList.add('tent-flash');
    });
  }

  playCorrect();
  onScoreCallback?.(100);

  const msg = refs.wrapper?.querySelector('.kc-success-msg');
  const dinoIcon = refs.wrapper?.querySelector('.kc-dino-icon');

  if (msg) {
    msg.textContent = solvedByAll ? '🌟 Everything Lit! Nice!' : '✅ Good Job!';
    if (dinoIcon) dinoIcon.style.opacity = '0';
    setTimeout(() => {
      msg.textContent = '';
      if (dinoIcon) dinoIcon.style.opacity = '1';
    }, 800);
  }

  // 🔧 slight delay, then reset + redraw
  setTimeout(() => {
    selectedTents.clear();
    isResolving = false;        // ✅ drop the lock first
    pickNewLine();              // schedules draw via rAF
    redrawLineSoon();           // double-rAF belt & suspenders
    setTimeout(drawLineWhenReady, 120); // late retry after layout/images settle
  }, 800);
}



function toggleTent(index) {
  const tent = gridEls[index];
  if (!tent) return;

  const isSelected = selectedTents.has(index);

  if (isSelected) {
    selectedTents.delete(index);
    tent.img.src = `${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/tent.png`;
  } else {
    selectedTents.add(index);
    tent.img.src = `${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/tentLit.png`;
  }

  checkIfSolved();
}


// Try to draw every frame for N frames, or until success
function drawLineBurst(frames = 90) { // ~1.5s safety
  let left = frames;
  const tick = () => {
    if (drawLineWhenReadyOnce()) return; // success -> stop early
    if (--left > 0) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
// One attempt; returns true if we actually set a path

function flashLineSuccess() {
  activeLine.forEach(i => {
    const el = gridEls[i].img;
    el.classList.remove('tent-flash');
    void el.offsetWidth; // Force reflow
    el.classList.add('tent-flash');
  });
}

function clearTentGrid() {
  gridEls.forEach(({ img }) => {
    img.src = `${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/tent.png`;
  });
}

function playCorrect() {
  const sfx = new Howl({
    src: [`${import.meta.env.BASE_URL}assets/audio/SFX/tentSuccess.mp3`],
    volume: 0.18
  });
  sfx.play();
}


export function initGameLine() {
  console.log('🍧 initGameLine() triggered');
  pickNewLine();
  drawLineWhenReady();
}






function registerTentFromCoords(x, y) {
  for (let [index, rect] of swipeState.tentRects.entries()) {
    if (
      x >= rect.left && x <= rect.right &&
      y >= rect.top && y <= rect.bottom &&
      !swipeState.touchedIndices.has(index)
    ) {
      swipeState.touchedIndices.add(index);
      toggleTent(index);
      break;
    }
  }
}



export function cleanupTentLineGame() {
  // cancel any scheduled draw
  if (refs.pendingRAF) cancelAnimationFrame(refs.pendingRAF);
  refs.pendingRAF = 0;

  // remove listeners safely
  if (refs.grid && refs.listeners.onTransitionEnd) {
    refs.grid.removeEventListener('transitionend', refs.listeners.onTransitionEnd);
  }
  if (refs.listeners.onScroll) window.removeEventListener('scroll', refs.listeners.onScroll);
  if (refs.listeners.onResize) window.removeEventListener('resize', refs.listeners.onResize);
  if (refs.listeners.onOrient) window.removeEventListener('orientationchange', refs.listeners.onOrient);
  // swipe listeners
  // ...existing removes...
  if (refs.grid && refs.listeners.swipe_onPointerDown) {
    refs.grid.removeEventListener('pointerdown', refs.listeners.swipe_onPointerDown);
    refs.grid.removeEventListener('pointermove',  refs.listeners.swipe_onPointerMove);
    refs.grid.removeEventListener('pointerup',    refs.listeners.swipe_onPointerUp);
  }
  if (refs.listeners.swipe_docUp)     document.removeEventListener('pointerup',     refs.listeners.swipe_docUp);
  if (refs.listeners.swipe_docCancel) document.removeEventListener('pointercancel', refs.listeners.swipe_docCancel);

  


  // observers
  refs.mo?.disconnect();
  refs.resizeObs?.disconnect();

  // nuke svg contents in this instance only
  if (refs.svg) refs.svg.innerHTML = '';

  // clear game state
  gridEls = [];
  selectedTents.clear();

  // ❗ reset the path so the next mount creates a fresh one
  guidePath = null;

  // drop refs
  refs = {
    wrapper: null, grid: null, svg: null, mo: null, resizeObs: null,
    listeners: {
      onResize: null, onOrient: null, onScroll: null, onTransitionEnd: null,
      swipe_onPointerDown: null, swipe_onPointerMove: null, swipe_onPointerUp: null,
      swipe_docUp: null, swipe_docCancel: null,
    },
    pendingRAF: 0, 
  };


}

// ✅ Award 100 points and regenerate, just like a line solve
export function solveAllTents() {
  if (isResolving) return; // don't double-trigger during resolve
  // fill state first (canonical source of truth)
  selectedTents.clear();
  for (let i = 0; i < GRID_SIZE; i++) {
    selectedTents.add(i);
  }
  // sync visuals (so kids see them all lit)
  gridEls.forEach(({ img }) => {
    img.src = `${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/tentLit.png`;
  });
  // run the shared solver path (this gives 100 points + regen)
  checkIfSolved();
}


function waitForImages() {
  const imgs = gridEls.map(g => g.img).filter(Boolean);
  const pending = imgs.filter(img => !(img.complete && img.naturalWidth > 0));
  if (pending.length === 0) return Promise.resolve();

  return new Promise(resolve => {
    let left = pending.length;
    const done = () => { if (--left <= 0) resolve(); };
    pending.forEach(img => {
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true }); // don't hang on errors
    });
    // hard timeout in case browser never fires a load (cache oddities)
    setTimeout(resolve, 600);
  });
}
