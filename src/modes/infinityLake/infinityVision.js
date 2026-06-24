// src/modes/infinityLake/infinityVision.js
// ♾️ Infinity Lake Vision — Tier Color + Breathing v2
//
// Rhythm:
// Tier 1: layer 1 appears yellow
// Tier 2: layer 2 adds yellow
// Tier 3: layer 3 adds and turns blue
// Tier 4: full vision completes, stays blue
// Tier 5: ring pulse, turns magenta
// Tier 6: magenta stays, full image starts breathing
// Tier 7: transcend into next design

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

let stageEl = null;
let layerEls = [];
let shapeIndex = 0;
let currentLayer = 0;
let overdriveCount = 0;
let resetTimer = null;
let transcendTimer = null;

function visionBaseUrl() {
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  return `${cleanBase}assets/img/modes/infinityLake/visions`;
}

function getShapeId(index = shapeIndex) {
  return VISION_SHAPES[((index % VISION_SHAPES.length) + VISION_SHAPES.length) % VISION_SHAPES.length];
}

function srcFor(shapeId, fileName) {
  return `${visionBaseUrl()}/${shapeId}/${fileName}`;
}

function clearTimers() {
  clearTimeout(resetTimer);
  clearTimeout(transcendTimer);
  resetTimer = null;
  transcendTimer = null;
}

function getLayerEls() {
  if (!stageEl) return [];

  return [1, 2, 3, 4]
    .map((layerNumber) => stageEl.querySelector(`[data-vision-layer="${layerNumber}"]`))
    .filter(Boolean);
}

function preloadCurrentShape() {
  const shapeId = getShapeId();

  VISION_LAYER_FILES.forEach((fileName) => {
    const img = new Image();
    img.src = srcFor(shapeId, fileName);
  });
}

function loadShapeIntoLayers() {
  const shapeId = getShapeId();

  if (stageEl) {
    stageEl.dataset.visionShape = shapeId;
  }

  layerEls.forEach((layer, index) => {
    const fileName = VISION_LAYER_FILES[index];
    if (!fileName) return;
    layer.src = srcFor(shapeId, fileName);
  });

  preloadCurrentShape();
}

function removeTierClasses() {
  if (!stageEl) return;

  stageEl.classList.remove(
    'phase-cyan',
    'phase-gold',
    'phase-pink',
    'phase-green',
    'phase-violet',
    'phase-yellow',
    'phase-blue',
    'phase-magenta',
    'vision-breathing',
    'vision-next-arrive',
    'vision-overdrive',
    'vision-transcending',
    'vision-crashing',
    'vision-pulse',
    'vision-full-pulse',
    'vision-ring-pulse',
    'vision-color-pulse',
    'vision-handoff-pop',
    'vision-next-born',
    'vision-wrong-burst'
  );
}

function setTierPhase(tier) {
  if (!stageEl) return;

  stageEl.classList.remove('phase-yellow', 'phase-blue', 'phase-magenta');

  if (tier <= 2) {
    stageEl.classList.add('phase-yellow');
    return;
  }

  if (tier <= 4) {
    stageEl.classList.add('phase-blue');
    return;
  }

  stageEl.classList.add('phase-magenta');
}

function showLayer(layerNumber) {
  const safeLayerNumber = Math.max(0, Math.min(4, Number(layerNumber) || 0));

  if (stageEl) {
    stageEl.classList.toggle('vision-active', safeLayerNumber > 0);
    stageEl.classList.toggle('vision-full', safeLayerNumber >= 4);
  }

  layerEls.forEach((layer, index) => {
    const shouldShow = index < safeLayerNumber;
    const isCurrent = shouldShow && index === safeLayerNumber - 1;

    // New class from the latest pass.
    layer.classList.toggle('is-visible', shouldShow);

    // Compatibility with the existing working CSS stack.
    layer.classList.toggle('visible', shouldShow);
    layer.classList.toggle('current', isCurrent);
  });
}

function pulseVision(kind = 'pulse') {
  if (!stageEl) return;

  stageEl.classList.remove(
    'vision-pulse',
    'vision-full-pulse',
    'vision-ring-pulse',
    'vision-color-pulse'
  );

  // Force animation restart.
  // eslint-disable-next-line no-unused-expressions
  stageEl.offsetWidth;

  if (kind === 'full') {
    stageEl.classList.add('vision-full-pulse');
  } else if (kind === 'ring') {
    stageEl.classList.add('vision-ring-pulse');
  } else if (kind === 'color') {
    stageEl.classList.add('vision-color-pulse');
  } else {
    stageEl.classList.add('vision-pulse');
  }

  window.setTimeout(() => {
    stageEl?.classList.remove(
      'vision-pulse',
      'vision-full-pulse',
      'vision-ring-pulse',
      'vision-color-pulse'
    );
  }, 900);
}

function resetVisibleLayers() {
  layerEls.forEach((layer) => {
    layer.classList.remove(
      'is-visible',
      'visible',
      'current',
      'vision-crash-piece',
      'vision-crash-hide-full',
      'vision-crash-piece-1',
      'vision-crash-piece-2',
      'vision-crash-piece-3',
      'vision-crash-piece-4',
      'vision-flyoff-piece',
      'vision-next-piece'
    );

    layer.style.removeProperty('--vision-crash-x');
    layer.style.removeProperty('--vision-crash-y');
    layer.style.removeProperty('--vision-crash-r');
    layer.style.removeProperty('--vision-crash-scale');
    layer.style.removeProperty('--vision-crash-delay');

    layer.style.removeProperty('--vision-fly-x');
    layer.style.removeProperty('--vision-fly-y');
    layer.style.removeProperty('--vision-fly-rot');
    layer.style.removeProperty('--vision-fly-delay');
  });
}



export function getLakeVisionTotalCount() {
  return VISION_SHAPES.length;
}


export function getLakeVisionShapeIds() {
  return [...VISION_SHAPES];
}

export function getCurrentLakeVisionShapeId() {
  return getShapeId();
}

export function initLakeVision() {
  stageEl = document.getElementById('lakeVisionStage');
  if (!stageEl) return;

  layerEls = getLayerEls();
  loadShapeIntoLayers();
  resetLakeVision({ rotateShape: false });
}

export function resetLakeVision({ rotateShape = false, startAtLayer = 0 } = {}) {
  if (!stageEl) return;

  clearTimers();

  if (rotateShape) {
    shapeIndex = (shapeIndex + 1) % VISION_SHAPES.length;
  }

  removeTierClasses();
  resetVisibleLayers();

  loadShapeIntoLayers();

  currentLayer = Math.max(0, Math.min(4, Number(startAtLayer) || 0));
  overdriveCount = 0;

  if (currentLayer > 0) {
    setTierPhase(currentLayer);
    showLayer(currentLayer);
  } else {
    stageEl.classList.add('phase-yellow');
    stageEl.classList.remove('vision-active', 'vision-full');
    showLayer(0);
  }
}

export function advanceLakeVision(streakValue = 0) {
  if (!stageEl) return;

  if (!layerEls.length) {
    layerEls = getLayerEls();
  }

  if (currentLayer < 4) {
    currentLayer += 1;

    setTierPhase(currentLayer);
    showLayer(currentLayer);

    pulseVision(currentLayer === 4 ? 'full' : 'pulse');
    return;
  }

  overdriveCount += 1;

  // Tier 5: magenta ring pulse.
  if (overdriveCount === 1) {
    setTierPhase(5);
    stageEl.classList.add('vision-overdrive');
    pulseVision('ring');
    return;
  }

  // Tier 6: magenta breathing.
  if (overdriveCount === 2) {
    setTierPhase(6);
    stageEl.classList.add('vision-overdrive', 'vision-breathing');
    pulseVision('color');
    return;
  }

  // Tier 7: transcend into next design.
  transcendToNextShape(streakValue);
}

function transcendToNextShape(streakValue = 0) {
  if (!stageEl) return;

  clearTimeout(transcendTimer);

  // Tier 7 handoff:
  // Keep the charged magenta vision alive, then make it burst into the next design.
  // The shape swap happens while hidden, so the player sees transformation, not reset.
  setTierPhase(7);

  stageEl.classList.remove(
    'vision-next-born',
    'vision-swap-hidden',
    'vision-transcending'
  );

  stageEl.classList.add(
    'vision-overdrive',
    'vision-breathing',
    'vision-handoff-pop'
  );

  transcendTimer = window.setTimeout(() => {
    if (!stageEl) return;

    // Hide the swap frame so the old full glyph never visibly snaps back.
    stageEl.classList.add('vision-swap-hidden');

    resetLakeVision({ rotateShape: true, startAtLayer: 1 });

    window.requestAnimationFrame(() => {
      if (!stageEl) return;

      stageEl.classList.add('vision-next-born');
      stageEl.classList.remove('vision-swap-hidden');

      window.setTimeout(() => {
        stageEl?.classList.remove('vision-next-born');
      }, 1050);
    });
  }, 1180);
}


export function collapseLakeVision() {
  if (!stageEl) return;

  clearTimers();

  if (!layerEls.length) {
    layerEls = getLayerEls();
  }

  const visibleLayers = layerEls.filter((layer) =>
    layer.classList.contains('is-visible') || layer.classList.contains('visible')
  );

  if (!visibleLayers.length) {
    resetLakeVision({ rotateShape: false });
    return;
  }

  // Wrong-answer crash only.
  // Full.png is a complete alpha image, not a fragment.
  // In late blue / magenta states, hide that full layer first so it does not
  // ghost underneath the flying fragment pieces.
  stageEl.classList.remove(
    'vision-breathing',
    'vision-overdrive',
    'vision-pulse',
    'vision-full-pulse',
    'vision-ring-pulse',
    'vision-color-pulse',
    'vision-full-burst',
    'vision-ring-burst',
    'vision-color-shift',
    'vision-handoff-pop',
    'vision-next-born',
    'vision-swap-hidden',
    'vision-transcending',
    'vision-next-arrive',
    'vision-wrong-burst',
    'vision-wrong-flyoff'
  );

  stageEl.classList.add('vision-crashing', 'vision-collapsing', 'vision-no-ghost-crash');

  const hasFullLayer = visibleLayers.some((layer) => layer.dataset.visionLayer === '4');

  const crashLayers = hasFullLayer
    ? visibleLayers.filter((layer) => layer.dataset.visionLayer !== '4')
    : visibleLayers;

  visibleLayers.forEach((layer) => {
    layer.classList.remove(
      'current',
      'vision-crash-piece',
      'vision-flyoff-piece',
      'vision-crash-hide-full',
      'vision-crash-piece-1',
      'vision-crash-piece-2',
      'vision-crash-piece-3',
      'vision-crash-piece-4'
    );

    layer.style.removeProperty('--vision-crash-x');
    layer.style.removeProperty('--vision-crash-y');
    layer.style.removeProperty('--vision-crash-r');
    layer.style.removeProperty('--vision-crash-scale');
    layer.style.removeProperty('--vision-crash-delay');
    layer.style.removeProperty('--vision-fly-x');
    layer.style.removeProperty('--vision-fly-y');
    layer.style.removeProperty('--vision-fly-rot');
    layer.style.removeProperty('--vision-fly-delay');
  });

  if (hasFullLayer) {
    visibleLayers
      .filter((layer) => layer.dataset.visionLayer === '4')
      .forEach((layer) => {
        layer.classList.add('vision-crash-hide-full');
      });
  }

  const crashMap = [
    ['-58vw', '18vh', '-22deg', '0ms'],
    ['48vw', '24vh', '18deg', '44ms'],
    ['-36vw', '54vh', '-34deg', '88ms'],
    ['42vw', '-20vh', '26deg', '132ms'],
  ];

  const activeCrashLayers = crashLayers.length ? crashLayers : visibleLayers;

  activeCrashLayers.forEach((layer, index) => {
    const [x, y, rot, delay] = crashMap[index % crashMap.length];

    layer.style.setProperty('--vision-fly-x', x);
    layer.style.setProperty('--vision-fly-y', y);
    layer.style.setProperty('--vision-fly-rot', rot);
    layer.style.setProperty('--vision-fly-delay', delay);

    // Force animation restart cleanly.
    // eslint-disable-next-line no-unused-expressions
    layer.offsetWidth;

    layer.classList.add('vision-crash-piece');
  });

  resetTimer = window.setTimeout(() => {
    stageEl?.classList.remove(
      'vision-crashing',
      'vision-collapsing',
      'vision-no-ghost-crash',
      'vision-wrong-burst',
      'vision-wrong-flyoff'
    );

    resetLakeVision({ rotateShape: true });
  }, 1260);
}




