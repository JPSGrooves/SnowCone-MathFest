// src/modes/infinityLake/infinityVision.js
// 🍧 Infinity Lake Vision System v1.3
//
// Purpose:
// - Every 3-correct streak milestone reveals or energizes a lake vision.
// - Wrong answers crash the current vision apart.
// - Completed visions now transcend smoothly into the next shape instead of
//   flying away like broken pieces.
// - Triplets remain the performers; the vision is the streak-made light show.
//
// Rhythm:
// 3  → layer_01
// 6  → layer_02
// 9  → layer_03
// 12 → full + big ring burst
// 15 → ring pulse
// 18 → color shift + ring pulse
// 21 → transcend / dissolve
// 24 → next shape layer_01

const VISION_SHAPES = Object.freeze([
  'lake_01',
  'squares_01',
  'flower_01',
]);

const VISION_LAYER_FILES = Object.freeze([
  'layer_01.png',
  'layer_02.png',
  'layer_03.png',
  'full.png',
]);

const COLOR_PHASES = Object.freeze([
  'cyan',
  'gold',
  'pink',
  'green',
  'violet',
]);

let shapeIndex = 0;
let currentLayer = 0;
let overdriveCount = 0;
let colorPhaseIndex = 0;
let collapseTimer = null;
let pulseTimer = null;
let transitionTimer = null;
let burstTimer = null;

function assetUrl(shapeId, fileName) {
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  return `${cleanBase}assets/img/modes/infinityLake/visions/${shapeId}/${fileName}`;
}

function getStage() {
  return document.getElementById('lakeVisionStage');
}

function getLayerEls() {
  return Array.from(document.querySelectorAll('.lake-vision-layer'));
}

function getCurrentShapeId() {
  return VISION_SHAPES[shapeIndex] || VISION_SHAPES[0];
}

function getCurrentColorPhase() {
  return COLOR_PHASES[colorPhaseIndex] || COLOR_PHASES[0];
}

function clearTimers() {
  for (const timer of [collapseTimer, pulseTimer, transitionTimer, burstTimer]) {
    if (timer) clearTimeout(timer);
  }

  collapseTimer = null;
  pulseTimer = null;
  transitionTimer = null;
  burstTimer = null;
}

function applyStageState() {
  const stage = getStage();
  if (!stage) return;

  stage.dataset.visionShape = getCurrentShapeId();
  stage.dataset.visionLayer = String(currentLayer);
  stage.dataset.visionPhase = getCurrentColorPhase();

  stage.classList.remove(
    'phase-cyan',
    'phase-gold',
    'phase-pink',
    'phase-green',
    'phase-violet'
  );
  stage.classList.add(`phase-${getCurrentColorPhase()}`);

  stage.classList.toggle('vision-active', currentLayer > 0);
  stage.classList.toggle('vision-full', currentLayer >= 4);
}

function loadShapeImages() {
  const shapeId = getCurrentShapeId();
  const layers = getLayerEls();

  layers.forEach((el, index) => {
    const fileName = VISION_LAYER_FILES[index];
    if (!fileName) return;

    const src = assetUrl(shapeId, fileName);

    if (el.getAttribute('src') !== src) {
      el.setAttribute('src', src);
    }

    el.dataset.visionAsset = `${shapeId}/${fileName}`;
  });

  applyStageState();
}

function resetLayerMotionClasses() {
  getLayerEls().forEach((el) => {
    el.classList.remove(
      'current',
      'vision-crash-piece',
      'vision-blast-piece'
    );

    el.style.removeProperty('--vision-fly-x');
    el.style.removeProperty('--vision-fly-y');
    el.style.removeProperty('--vision-fly-rot');
    el.style.removeProperty('--vision-fly-delay');
  });
}

function showLayer(layerNumber) {
  const layers = getLayerEls();

  layers.forEach((el, index) => {
    const shouldShow = index < layerNumber;
    el.classList.toggle('visible', shouldShow);
    el.classList.toggle('current', index === layerNumber - 1);
  });

  applyStageState();
}

function clearMomentClasses(stage) {
  if (!stage) return;

  stage.classList.remove(
    'vision-pulse',
    'vision-overdrive-hit',
    'vision-full-burst',
    'vision-ring-burst',
    'vision-color-shift',
    'vision-transcending',
    'vision-next-arrive'
  );
}

function pulseVision(kind = 'pulse') {
  const stage = getStage();
  if (!stage) return;

  clearMomentClasses(stage);

  // Force animation restart.
  // eslint-disable-next-line no-unused-expressions
  stage.offsetWidth;

  if (kind === 'full') {
    stage.classList.add('vision-full-burst');
  } else if (kind === 'color') {
    stage.classList.add('vision-color-shift', 'vision-ring-burst');
  } else if (kind === 'ring') {
    stage.classList.add('vision-ring-burst');
  } else if (kind === 'overdrive') {
    stage.classList.add('vision-overdrive-hit', 'vision-ring-burst');
  } else {
    stage.classList.add('vision-pulse');
  }

  if (pulseTimer) clearTimeout(pulseTimer);

  pulseTimer = setTimeout(() => {
    stage.classList.remove(
      'vision-pulse',
      'vision-overdrive-hit',
      'vision-ring-burst',
      'vision-color-shift'
    );
  }, kind === 'overdrive' ? 980 : 760);

  if (kind === 'full') {
    if (burstTimer) clearTimeout(burstTimer);
    burstTimer = setTimeout(() => {
      stage.classList.remove('vision-full-burst');
    }, 1050);
  }
}

function rotateToNextShape({ startAtLayer = 0 } = {}) {
  shapeIndex = (shapeIndex + 1) % VISION_SHAPES.length;
  currentLayer = startAtLayer;
  overdriveCount = 0;
  loadShapeImages();
  showLayer(currentLayer);
}

function setFlyVars(el, index) {
  const crashMap = [
    ['-58vw', '18vh', '-22deg', '0ms'],
    ['48vw', '24vh', '18deg', '44ms'],
    ['-36vw', '54vh', '-34deg', '88ms'],
    ['42vw', '-20vh', '26deg', '122ms'],
  ];

  const [x, y, rot, delay] = crashMap[index % crashMap.length];

  el.style.setProperty('--vision-fly-x', x);
  el.style.setProperty('--vision-fly-y', y);
  el.style.setProperty('--vision-fly-rot', rot);
  el.style.setProperty('--vision-fly-delay', delay);
}

function crashVisiblePieces() {
  getLayerEls().forEach((el, index) => {
    if (!el.classList.contains('visible')) return;

    setFlyVars(el, index);

    el.classList.remove('current');

    // Force each piece animation to restart cleanly.
    el.classList.remove('vision-crash-piece');
    // eslint-disable-next-line no-unused-expressions
    el.offsetWidth;
    el.classList.add('vision-crash-piece');
  });
}

function transcendToNextShape(streakValue = 0) {
  const stage = getStage();
  if (!stage) return;

  clearTimers();
  resetLayerMotionClasses();

  stage.classList.remove(
    'vision-collapsing',
    'vision-overdrive-hit',
    'vision-full-burst',
    'vision-ring-burst',
    'vision-color-shift',
    'vision-next-arrive'
  );

  stage.classList.add('vision-overdrive', 'vision-transcending');

  transitionTimer = setTimeout(() => {
    stage.classList.remove('vision-transcending', 'vision-overdrive');

    resetLayerMotionClasses();
    rotateToNextShape({ startAtLayer: 1 });

    stage.classList.add('vision-next-arrive');
    pulseVision('ring');

    transitionTimer = setTimeout(() => {
      stage.classList.remove('vision-next-arrive');
    }, 760);
  }, 820);

  console.log(`♾️ Lake Vision transcend at streak ${streakValue}`);
}

export function initLakeVision() {
  clearTimers();
  const stage = getStage();
  if (!stage) return;

  resetLayerMotionClasses();
  loadShapeImages();
  showLayer(currentLayer);
}

export function resetLakeVision({ rotateShape = false } = {}) {
  clearTimers();

  const stage = getStage();

  if (rotateShape) {
    shapeIndex = (shapeIndex + 1) % VISION_SHAPES.length;
  }

  currentLayer = 0;
  overdriveCount = 0;

  if (stage) {
    stage.classList.remove(
      'vision-active',
      'vision-full',
      'vision-collapsing',
      'vision-pulse',
      'vision-overdrive',
      'vision-overdrive-hit',
      'vision-full-burst',
      'vision-ring-burst',
      'vision-color-shift',
      'vision-transcending',
      'vision-next-arrive',
      'vision-blasting'
    );
  }

  resetLayerMotionClasses();
  loadShapeImages();
  showLayer(0);
}

export function advanceLakeVision(streakValue = 0) {
  const stage = getStage();
  if (!stage) return;

  clearTimers();
  resetLayerMotionClasses();

  stage.classList.remove(
    'vision-collapsing',
    'vision-transcending',
    'vision-next-arrive'
  );

  // First four 3-streak hits build the image:
  // 3 → layer 1, 6 → layer 2, 9 → layer 3, 12 → full.
  if (currentLayer < 4) {
    currentLayer += 1;
    showLayer(currentLayer);
    pulseVision(currentLayer >= 4 ? 'full' : 'pulse');
    return;
  }

  // After full reveal:
  // 15 → ring pulse
  // 18 → color shift + ring pulse
  // 21 → smooth transcend into next shape.
  overdriveCount += 1;

  if (overdriveCount === 1) {
    pulseVision('ring');
    return;
  }

  if (overdriveCount === 2) {
    colorPhaseIndex = (colorPhaseIndex + 1) % COLOR_PHASES.length;
    applyStageState();
    pulseVision('color');
    return;
  }

  transcendToNextShape(streakValue);
}

export function collapseLakeVision() {
  const stage = getStage();

  if (!stage || currentLayer <= 0) {
    resetLakeVision({ rotateShape: false });
    return;
  }

  clearTimers();

  stage.classList.remove(
    'vision-pulse',
    'vision-overdrive-hit',
    'vision-full-burst',
    'vision-ring-burst',
    'vision-color-shift',
    'vision-transcending',
    'vision-next-arrive'
  );

  stage.classList.add('vision-collapsing');
  crashVisiblePieces();

  collapseTimer = setTimeout(() => {
    stage.classList.remove('vision-collapsing', 'vision-overdrive');
    resetLakeVision({ rotateShape: true });
  }, 900);
}
