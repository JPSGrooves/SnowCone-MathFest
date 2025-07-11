let currentFrame = 0;
let animationTimer = null;
let sequenceTimer = null;
let loopedPoseSteps = [];
let sequenceStepIndex = 0;

/**
 * Loop 2-frame strobe between pose and poseLit
 */
export function startTripletLoop(poseId = 'intro', elementId = 'tripletSprite', speed = 500) {
  const el = document.getElementById(elementId);
  if (!el) return;

  stopTripletLoop();

  const frameList = [
    `${import.meta.env.BASE_URL}assets/img/characters/infinityLake/il_${poseId}.png`,
    `${import.meta.env.BASE_URL}assets/img/characters/infinityLake/il_${poseId}Lit.png`
  ];

  currentFrame = 0;
  animationTimer = setInterval(() => {
    el.src = frameList[currentFrame];
    currentFrame = (currentFrame + 1) % frameList.length;
  }, speed);
}

/**
 * Start a timed pose sequence with fade-in transitions
 */
export function startTripletSequence(poseSteps, elementId = 'tripletSprite', speed = 500) {
  const el = document.getElementById(elementId);
  if (!el || !Array.isArray(poseSteps)) return;

  stopTripletLoop();

  loopedPoseSteps = poseSteps;
  sequenceStepIndex = 0;

  nextSequenceStep(el, speed);
}

/**
 * Step to the next pose in the sequence
 */
function nextSequenceStep(el, speed) {
  const step = loopedPoseSteps[sequenceStepIndex];
  if (!step) return;

  const frameList = [
    `${import.meta.env.BASE_URL}assets/img/characters/infinityLake/il_${step.pose}.png`,
    `${import.meta.env.BASE_URL}assets/img/characters/infinityLake/il_${step.pose}Lit.png`
  ];

  currentFrame = 0;

  // ✨ Create fading clone overlay
  const fadeClone = el.cloneNode(true);
  fadeClone.src = el.src;
  fadeClone.style.position = 'absolute';
  fadeClone.style.top = el.offsetTop + 'px';
  fadeClone.style.left = el.offsetLeft + 'px';
  fadeClone.style.width = el.offsetWidth + 'px';
  fadeClone.style.height = el.offsetHeight + 'px';
  fadeClone.style.transition = 'opacity 0.4s ease';
  fadeClone.style.opacity = '1';
  fadeClone.style.pointerEvents = 'none';
  fadeClone.style.zIndex = '5';

  el.style.opacity = '0';
  el.src = frameList[0];
  el.style.zIndex = '10';

  el.parentElement.appendChild(fadeClone);

  // 🕓 Fade-in actual sprite after slight delay
  setTimeout(() => {
    el.style.transition = 'opacity 0.4s ease';
    el.style.opacity = '1';

    fadeClone.style.opacity = '0';
    setTimeout(() => fadeClone.remove(), 400);

    clearInterval(animationTimer);
    animationTimer = setInterval(() => {
      el.src = frameList[currentFrame];
      currentFrame = (currentFrame + 1) % frameList.length;
    }, speed);

    // ⏱ Schedule next pose
    sequenceTimer = setTimeout(() => {
      clearInterval(animationTimer);
      sequenceStepIndex = (sequenceStepIndex + 1) % loopedPoseSteps.length;
      nextSequenceStep(el, speed);
    }, step.time);
  }, 50);
}

/**
 * Kill all active triplet animations and timers
 */
export function stopTripletLoop() {
  clearInterval(animationTimer);
  clearTimeout(sequenceTimer);
  animationTimer = null;
  sequenceTimer = null;
  currentFrame = 0;
}
