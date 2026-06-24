// src/modes/infinityLake/tripletAnimator.js
// 🍧 Infinity Triplets Animator — Direct Swap + One-Time Opener v2
//
// Purpose:
// - Use measured PNGs directly.
// - No pose crossfade.
// - No clone overlay.
// - No double buffer.
// - Lit/unlit frame swap remains the baked "lights over characters" trick.
// - CSS glow stays constant/theme-responsive and never flashes.
// - Supports one-time opener: openSet → jam1 → jam2 → jam1 → jam2...
// - Lake Vision untouched.

let currentFrame = 0;
let animationTimer = null;
let sequenceTimer = null;
let loopedPoseSteps = [];
let sequenceStepIndex = 0;
let sequenceLoopStartIndex = 0;
let sequenceStrobeSpeed = 500;

const imageCache = new Map();

function tripletSrc(poseId, lit = false) {
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  return `${cleanBase}assets/img/characters/infinityLake/il_${poseId}${lit ? 'Lit' : ''}.png`;
}

function preloadImage(src) {
  if (!src) return Promise.resolve(false);

  if (imageCache.has(src)) {
    return imageCache.get(src);
  }

  const promise = new Promise((resolve) => {
    const img = new Image();

    img.onload = async () => {
      try {
        if (typeof img.decode === 'function') {
          await img.decode();
        }
      } catch {
        // Loaded is enough for direct swaps in WKWebView.
      }

      resolve(true);
    };

    img.onerror = () => {
      console.warn('[Infinity Triplets] Could not preload:', src);
      resolve(false);
    };

    img.src = src;
  });

  imageCache.set(src, promise);
  return promise;
}

function preloadPose(poseId) {
  return Promise.all([
    preloadImage(tripletSrc(poseId, false)),
    preloadImage(tripletSrc(poseId, true)),
  ]);
}

function preloadPoses(poseIds) {
  Array.from(new Set(poseIds.filter(Boolean))).forEach((poseId) => {
    preloadPose(poseId);
  });
}

function absoluteSrc(src) {
  try {
    return new URL(src, window.location.href).href;
  } catch {
    return src;
  }
}

function setSpriteSource(el, src) {
  if (!el || !src) return;

  if (el.src !== absoluteSrc(src)) {
    el.src = src;
  }
}

function setTripletFrame(el, poseId, lit = false) {
  if (!el) return;

  const src = tripletSrc(poseId, lit);
  preloadImage(src);

  setSpriteSource(el, src);

  // Important:
  // Do NOT toggle a CSS "lit" class.
  // The Lit PNG itself provides the light overlay.
  // CSS glow must remain constant/theme-responsive.
  el.classList.remove('triplet-strobe-lit');
}

function clearAllTimers() {
  clearInterval(animationTimer);
  clearTimeout(sequenceTimer);

  animationTimer = null;
  sequenceTimer = null;
}

function cleanupOldTransitionLayers() {
  document.querySelectorAll('.triplet-crossfade-layer, .triplet-buffer-layer').forEach((layer) => {
    try {
      layer.remove();
    } catch {}
  });
}

function cleanupTripletClasses() {
  document
    .querySelectorAll('#tripletSpriteIntro, #tripletSpriteGame')
    .forEach((el) => {
      el.classList.remove(
        'triplet-pose-swap',
        'triplet-pose-arrive',
        'triplet-crossfade-live',
        'triplet-buffer-base',
        'triplet-buffer-active',
        'triplet-strobe-lit'
      );

      el.style.opacity = '';
      el.style.zIndex = '';
      el.style.transition = '';
    });
}

function startFrameStrobe(el, poseId, speed = 500) {
  clearInterval(animationTimer);

  currentFrame = 0;

  animationTimer = setInterval(() => {
    currentFrame = (currentFrame + 1) % 2;
    setTripletFrame(el, poseId, currentFrame === 1);
  }, speed);
}

function getNextSequenceIndex() {
  const nextIndex = sequenceStepIndex + 1;

  if (nextIndex >= loopedPoseSteps.length) {
    return sequenceLoopStartIndex;
  }

  return nextIndex;
}

/**
 * Loop 2-frame strobe between pose and poseLit.
 * Used for intro/preflight.
 */
export function startTripletLoop(poseId = 'intro', elementId = 'tripletSprite', speed = 500) {
  const el = document.getElementById(elementId);
  if (!el) return;

  stopTripletLoop();

  preloadPose(poseId);

  currentFrame = 0;
  setTripletFrame(el, poseId, false);
  startFrameStrobe(el, poseId, speed);
}

/**
 * Start a timed gameplay pose sequence.
 *
 * Supports:
 * { pose: 'openSet', time: 4200, once: true }
 *
 * Then loops from the first non-once pose.
 */
export function startTripletSequence(poseSteps, elementId = 'tripletSprite', speed = 500) {
  const el = document.getElementById(elementId);
  if (!el || !Array.isArray(poseSteps) || poseSteps.length === 0) return;

  stopTripletLoop();

  loopedPoseSteps = poseSteps
    .filter((step) => step && step.pose)
    .map((step) => ({
      pose: step.pose,
      time: Math.max(900, Number(step.time) || 4200),
      once: Boolean(step.once),
    }));

  if (loopedPoseSteps.length === 0) return;

  const firstLoopableIndex = loopedPoseSteps.findIndex((step) => !step.once);
  sequenceLoopStartIndex = firstLoopableIndex >= 0 ? firstLoopableIndex : 0;

  sequenceStepIndex = 0;
  sequenceStrobeSpeed = speed;

  preloadPoses(loopedPoseSteps.map((step) => step.pose));

  nextSequenceStep(el);
}

/**
 * Step to the next pose directly.
 */
function nextSequenceStep(el) {
  const step = loopedPoseSteps[sequenceStepIndex];
  if (!step) return;

  clearInterval(animationTimer);
  clearTimeout(sequenceTimer);

  currentFrame = 0;

  // Direct pose swap. No fade. No blur. No transition.
  setTripletFrame(el, step.pose, false);
  startFrameStrobe(el, step.pose, sequenceStrobeSpeed);

  sequenceTimer = setTimeout(() => {
    sequenceStepIndex = getNextSequenceIndex();
    nextSequenceStep(el);
  }, step.time);
}

/**
 * Kill all active triplet animations and timers.
 */
export function stopTripletLoop() {
  clearAllTimers();
  cleanupOldTransitionLayers();
  cleanupTripletClasses();

  currentFrame = 0;
  sequenceStepIndex = 0;
  sequenceLoopStartIndex = 0;
  sequenceStrobeSpeed = 500;
  loopedPoseSteps = [];
}
