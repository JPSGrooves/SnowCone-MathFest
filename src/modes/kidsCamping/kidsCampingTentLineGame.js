// kidsCampingTentLineGame.js
// 🏕️ Tent Swipe + Tap Hybrid Fix

const GRID_SIZE = 24; // 4x6 grid

let selectedTents = new Set();
let activeLine = [];
let gridEls = [];
let onScoreCallback = null;
let svgOverlay = null;
let swipeTracking = {
  isSwiping: false,
  touchedIndices: new Set(),
  tentRects: new Map(),
};

export function createTentLineGame(onScore) {
  onScoreCallback = onScore;

  selectedTents.clear();
  gridEls = [];

  const wrapper = document.createElement('div');
  wrapper.className = 'kc-tent-wrap';

  const grid = document.createElement('div');
  grid.className = 'kc-tent-grid';
  wrapper.appendChild(grid);

  svgOverlay = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svgOverlay.classList.add('kc-glow-overlay');
  svgOverlay.setAttribute('width', '100%');
  svgOverlay.setAttribute('height', '100%');
  grid.appendChild(svgOverlay);

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

  const observer = new ResizeObserver(() => {
    if (grid.getBoundingClientRect().height > 0 && activeLine.length) {
      requestAnimationFrame(() => drawLineGlow({ svgOverlay, activeLine, gridEls }));
    }
  });
  observer.observe(grid);

  const redrawOnChange = () => requestAnimationFrame(() => drawLineGlow({ svgOverlay, activeLine, gridEls }));
  window.addEventListener('resize', redrawOnChange, { passive: true });
  window.addEventListener('orientationchange', redrawOnChange, { passive: true });

  wrapper._cleanup = () => {
    observer.disconnect();
    window.removeEventListener('resize', redrawOnChange);
    window.removeEventListener('orientationchange', redrawOnChange);
  };

  return wrapper;
}

function drawLineGlow({ svgOverlay, activeLine, gridEls }) {
  if (!svgOverlay || !activeLine.length) return;

  svgOverlay.innerHTML = ''; // Clear old content

  const gridRect = svgOverlay.parentElement.getBoundingClientRect();
  if (!gridRect || gridRect.width === 0 || gridRect.height === 0) return;

  // Dynamic viewBox for scaling
  svgOverlay.setAttribute('viewBox', `0 0 ${gridRect.width} ${gridRect.height}`);

  // Fresh filter defs
  const glowId = `glow-${Date.now()}`;
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
  filter.setAttribute("id", glowId);
  filter.setAttribute("x", "-50%");
  filter.setAttribute("y", "-50%");
  filter.setAttribute("width", "200%");
  filter.setAttribute("height", "200%");
  filter.setAttribute("filterUnits", "userSpaceOnUse"); // For consistency

  const blur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
  blur.setAttribute("stdDeviation", "6");
  blur.setAttribute("result", "blur");

  const merge = document.createElementNS("http://www.w3.org/2000/svg", "feMerge");
  merge.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode")).setAttribute("in", "blur");
  merge.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode")).setAttribute("in", "blur");
  merge.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode")).setAttribute("in", "SourceGraphic");

  filter.appendChild(blur);
  filter.appendChild(merge);
  defs.appendChild(filter);
  svgOverlay.appendChild(defs);

  const points = activeLine.map(i => {
    const rect = gridEls[i]?.cell?.getBoundingClientRect();
    return {
      x: rect ? rect.left - gridRect.left + rect.width / 2 : 0,
      y: rect ? rect.top - gridRect.top + rect.height / 2 : 0
    };
  });

  if (points.every(p => p.x === 0 && p.y === 0)) {
    console.warn('⚠️ Invalid points in drawLineGlow');
    return;
  }

  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    pathD += ` L ${points[i].x} ${points[i].y}`;
  }

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", pathD);
  path.setAttribute("stroke", "#00ff00");
  path.setAttribute("stroke-width", "8");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("filter", `url(#${glowId})`);

  svgOverlay.appendChild(path);

  // Force repaint
  svgOverlay.style.display = 'none';
  void svgOverlay.offsetWidth;
  svgOverlay.style.display = '';
  svgOverlay.getBoundingClientRect();
  svgOverlay.style.transform = 'translateZ(0)';

  // Extra: Clone path to trigger render
  const clone = path.cloneNode(true);
  svgOverlay.appendChild(clone);
  setTimeout(() => {
    if (clone.parentNode === svgOverlay) {
      svgOverlay.removeChild(clone);
    }
  }, 0);

  console.log('🖼️ Drew path:', path.outerHTML, 'Points:', points);
}

function pickNewLine() {
  const patterns = [
    [0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15], [16, 17, 18, 19], [20, 21, 22, 23], // Rows (6 rows)
    [0, 4, 8, 12, 16, 20], [1, 5, 9, 13, 17, 21], [2, 6, 10, 14, 18, 22], [3, 7, 11, 15, 19, 23], // Columns (6 cells)
    [0, 5, 10, 15], [4, 9, 14, 19], [8, 13, 18, 23], [3, 6, 9, 12], [7, 10, 13, 16], [11, 14, 17, 20] // Valid 4-cell diagonals
  ];
  activeLine = patterns[Math.floor(Math.random() * patterns.length)];
  clearTentGrid();
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

function checkIfSolved() {
  const selected = Array.from(selectedTents).sort((a, b) => a - b);
  const line = [...activeLine].sort((a, b) => a - b);

  if (selected.length !== line.length) return;

  const match = selected.every((val, i) => val === line[i]);

  if (match) {
    flashLineSuccess();
    console.log('✅ Correct match!');
    playCorrect();
    onScoreCallback?.(25);

    const msg = document.querySelector('.kc-success-msg');
    const dinoIcon = document.querySelector('.kc-dino-icon');
    if (msg) {
      msg.textContent = '✅ Good Job!';
      if (dinoIcon) dinoIcon.style.opacity = '0'; // Fade out dino during message
      setTimeout(() => {
        msg.textContent = '';
        if (dinoIcon) dinoIcon.style.opacity = '1'; // Fade back in
      }, 800);
    }

    const svg = document.querySelector('.kc-glow-overlay');
    if (svg) svg.innerHTML = ''; // Clear old line immediately

    setTimeout(() => {
      selectedTents.clear();
      pickNewLine();
      requestAnimationFrame(() => drawLineGlow({ svgOverlay, activeLine, gridEls }));
    }, 800);
  }
}

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
    volume: 0.1
  });
  sfx.play();
}


export function initGameLine() {
  console.log('🍧 initGameLine() triggered');
  pickNewLine();
  // No retries needed; ResizeObserver will trigger draw when ready
  // But force one initial call after a frame
  requestAnimationFrame(() => drawLineGlow({ svgOverlay, activeLine, gridEls }));
}

function setupSwipeHandlers(grid) {
  let pointerDown = false;
  let seen = new Set();
  let startX = 0, startY = 0;

  grid.addEventListener('pointerdown', (e) => {
    pointerDown = true;
    seen.clear();
    startX = e.clientX;
    startY = e.clientY;

    gridEls.forEach(({ cell }, index) => {
      swipeTracking.tentRects.set(index, cell.getBoundingClientRect());
    });

    processHit(e); // 🎯 hit first tent immediately
  });

  grid.addEventListener('pointermove', (e) => {
    if (!pointerDown) return;

    const dx = Math.abs(e.clientX - startX);
    const dy = Math.abs(e.clientY - startY);
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 5) processHit(e);
  });

  grid.addEventListener('pointerup', () => {
    pointerDown = false;
    seen.clear();
  });

  // 🔥 Global kill — ends swipe no matter *where* the mouse/finger goes up
  document.addEventListener('pointerup', () => {
    pointerDown = false;
    seen.clear(); // 🌬️ prevent rogue hover lighting
  });

  function processHit(e) {
    if (!pointerDown) return;

    const x = e.clientX;
    const y = e.clientY;

    for (const [index, rect] of swipeTracking.tentRects.entries()) {
      const marginX = rect.width * 0.15;
      const marginY = rect.height * 0.15;

      if (
        x >= rect.left + marginX && x <= rect.right - marginX &&
        y >= rect.top + marginY && y <= rect.bottom - marginY &&
        !seen.has(index)
      ) {
        seen.add(index);
        toggleTent(index);
        break;
      }
    }
  }
}




function registerTentFromCoords(x, y) {
  for (let [index, rect] of swipeTracking.tentRects.entries()) {
    if (
      x >= rect.left && x <= rect.right &&
      y >= rect.top && y <= rect.bottom &&
      !swipeTracking.touchedIndices.has(index)
    ) {
      swipeTracking.touchedIndices.add(index);
      toggleTent(index);
      break;
    }
  }
}


export function cleanupTentLineGame() {
  gridEls = [];
  selectedTents.clear();
  svgOverlay = null;

  const svg = document.querySelector('.kc-glow-overlay');
  if (svg) svg.innerHTML = '';

  const wrapper = document.querySelector('.kc-tent-wrap');
  if (wrapper && wrapper._cleanup) wrapper._cleanup();
}