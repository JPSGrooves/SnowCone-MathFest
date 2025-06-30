// 🍧 quickServePhil.js — Cosmic Pose Engine Refactor 💀✨

let philEl = null;
let currentPose = 'idle';
let poseTimer = null;
let reactionTimeout = null;

const poseMap = {
  idle: 'phil_01_idle',
  focus: 'phil_02_focus',
  groove: 'phil_03_groove',
  lockin: 'phil_04_lockin',
  crank: 'phil_05_crank',
  hype: 'phil_06_hype',
  cosmic: 'phil_07_cosmic',
  glitch: 'phil_glitch',
  jams: 'phil_jams', // 🎸 Celebration pose
};

//////////////////////////////
// 🚀 Init
//////////////////////////////
export function initPhil() {
  philEl = document.getElementById('philSprite');
  if (!philEl) {
    console.warn('⚠️ Cosmic Phil not found in DOM!');
    return;
  }
  philEl.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
  setPose('idle');
}

//////////////////////////////
// 🔥 Set Pose
//////////////////////////////
export function setPose(poseName) {
  if (!philEl) return;
  if (!poseMap[poseName]) {
    console.warn(`⚠️ Unknown pose: "${poseName}"`);
    return;
  }
  if (poseName === currentPose) return;

  currentPose = poseName;
  philEl.style.opacity = '0';

  setTimeout(() => {
    philEl.src = `${import.meta.env.BASE_URL}assets/img/characters/quickServe/${poseMap[poseName]}.png`;
    philEl.style.opacity = '1';
  }, 250);
}

//////////////////////////////
// ⏳ Pose Timelines
//////////////////////////////
export function startPhilPoseTimer() {
  clearPhilTimer();
  setPose('focus');

  const timeline = ['groove', 'lockin', 'crank', 'hype', 'cosmic'];
  let index = 0;

  poseTimer = setInterval(() => {
    if (index < timeline.length) {
      setPose(timeline[index]);
      index++;
    } else {
      clearPhilTimer();
    }
  }, 15000);

  console.log('💀 Phil timeline started');
}

export function clearPhilTimer() {
  clearInterval(poseTimer);
  poseTimer = null;
  clearTimeout(reactionTimeout);
  reactionTimeout = null;
}

//////////////////////////////
// 💥 Reactions (Glitch & Jam)
//////////////////////////////
function temporaryPose(newPose, duration = 500) {
  if (!philEl) return;
  const cached = currentPose;

  setPose(newPose);
  clearTimeout(reactionTimeout);

  reactionTimeout = setTimeout(() => {
    setPose(cached);
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
  setPose('focus');

  setTimeout(() => {
    setPose('groove');
  }, 1000);
}

export function philCelebrate() {
  clearPhilTimer();
  setPose('jams');
}

//////////////////////////////
// ♻️ Reset
//////////////////////////////
export function resetPhil() {
  clearPhilTimer();
  setPose('idle');
}
