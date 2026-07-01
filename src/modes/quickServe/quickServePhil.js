// 🍧 quickServePhil.js — QS Act Pose Engine 💀✨

let philEl = null;
let currentPose = 'idle';
let currentTimedPose = 'idle';
let poseTimer = null;
let reactionTimeout = null;
let poseSerial = 0;
let activePerformer = null;

const QS_SHIFT_DURATION_MS = 105000;

const timedPoseProgression = [
  'idle',
  'focus',
  'groove',
  'lockin',
  'crank',
  'hype',
];

const legacyPoseMap = {
  idle: 'phil_intro',
  focus: 'phil_01_idle',
  groove: 'phil_02_focus',
  lockin: 'phil_03_groove',
  crank: 'phil_05_crank',
  hype: 'phil_06_hype',
  cosmic: 'phil_07_cosmic',
  glitch: 'phil_glitch',
  jams: 'phil_jams',
};

const poseFrameKeyMap = {
  idle: 'idle',
  focus: 'buildYellow1',
  groove: 'buildYellow2',
  lockin: 'buildGreen1',
  crank: 'buildGreen2',
  hype: 'buildGreen3',
  cosmic: 'correct',
  glitch: 'incorrect',
  jams: 'correct',
};

function getLegacyPoseSrc(poseName) {
  const file = legacyPoseMap[poseName] || legacyPoseMap.idle;
  return `${import.meta.env.BASE_URL}assets/img/characters/quickServe/${file}.png`;
}

function getPerformerPoseSrc(poseName) {
  const frameKey = poseFrameKeyMap[poseName] || poseFrameKeyMap.idle;
  const src = activePerformer?.frames?.[frameKey];

  if (src && typeof src === 'string') {
    return src;
  }

  return getLegacyPoseSrc(poseName);
}

function getPoseStepMs() {
  return QS_SHIFT_DURATION_MS / timedPoseProgression.length;
}

export function setQuickServePerformer(performer) {
  activePerformer = performer || null;

  if (philEl) {
    setPose(currentPose || currentTimedPose || 'idle', { force: true });
  }
}

//////////////////////////////
// 🚀 Init
//////////////////////////////
export function initPhil() {
  philEl = document.getElementById('philSpriteInGame');

  if (!philEl) {
    return;
  }

  philEl.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
  currentTimedPose = 'idle';
  setPose('idle', { force: true });
}

//////////////////////////////
// 🔥 Set Pose
//////////////////////////////
export function setPose(poseName, options = {}) {
  if (!philEl) return;

  const { force = false } = options;
  const nextSrc = getPerformerPoseSrc(poseName);

  if (!nextSrc) {
    console.warn(`⚠️ Unknown QuickServe pose: "${poseName}"`);
    return;
  }

  if (!force && poseName === currentPose && philEl.getAttribute('src') === nextSrc) {
    return;
  }

  currentPose = poseName;
  poseSerial += 1;

  const thisPoseSerial = poseSerial;

  philEl.style.opacity = '0';

  window.setTimeout(() => {
    if (!philEl || thisPoseSerial !== poseSerial) return;

    philEl.src = nextSrc;
    philEl.style.opacity = '1';
  }, 250);
}

//////////////////////////////
// ⏳ Pose Timeline
//////////////////////////////
export function startPhilPoseTimer() {
  clearPhilTimer();

  currentTimedPose = 'idle';
  setPose(currentTimedPose, { force: true });

  let index = 1;
  const stepMs = getPoseStepMs();

  poseTimer = window.setInterval(() => {
    if (index >= timedPoseProgression.length) {
      clearInterval(poseTimer);
      poseTimer = null;
      return;
    }

    currentTimedPose = timedPoseProgression[index];
    setPose(currentTimedPose, { force: true });
    index += 1;
  }, stepMs);

  console.log(
    `[QuickServe] Performer timeline started: ${activePerformer?.id || 'legacyPhil'}; step=${Math.round(stepMs)}ms`
  );
}

export function clearPhilTimer() {
  clearInterval(poseTimer);
  poseTimer = null;

  clearTimeout(reactionTimeout);
  reactionTimeout = null;
}

//////////////////////////////
// 💥 Reactions
//////////////////////////////
function temporaryPose(newPose, duration = 500) {
  if (!philEl) return;

  setPose(newPose, { force: true });
  clearTimeout(reactionTimeout);

  reactionTimeout = window.setTimeout(() => {
    setPose(currentTimedPose || 'idle', { force: true });
  }, duration);
}

export function triggerGlitch() {
  temporaryPose('glitch', 500);
}

export function bumpJam() {
  temporaryPose('jams', 800);
}

//////////////////////////////
// 🎬 Special Flows
//////////////////////////////
export function philIntro() {
  clearPhilTimer();
  currentTimedPose = 'focus';
  setPose('focus', { force: true });

  window.setTimeout(() => {
    currentTimedPose = 'groove';
    setPose('groove', { force: true });
  }, 1000);
}

export function philCelebrate() {
  clearPhilTimer();
  currentTimedPose = 'jams';
  setPose('jams', { force: true });
}

//////////////////////////////
// ♻️ Reset
//////////////////////////////
export function resetPhil() {
  clearPhilTimer();
  currentTimedPose = 'idle';
  setPose('idle', { force: true });
}
