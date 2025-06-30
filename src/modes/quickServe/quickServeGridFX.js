// 🍧 quickServeGridFX.js — Cosmic Grid Wiggle FX 🚦✨

let pulseActive = false;
let glowLines = [];
let rafId = null;
let lastTimestamp = null;

// 🎵 BPM — Default Pulse
let BPM = 105;
let pulseSpeed = calcPulseSpeed(BPM);

// ✨ Wiggle Intensity
const scaleIntensity = 0.08;
const opacityBase = 0.3;
const opacityBoost = 0.7;

//////////////////////////////
// 🔥 BPM Controls
//////////////////////////////
function calcPulseSpeed(bpm) {
  return (60 / bpm) * 1000;
}

export function setGridBPM(newBPM) {
  BPM = newBPM;
  pulseSpeed = calcPulseSpeed(BPM);
}

export function getGridBPM() {
  return BPM;
}

//////////////////////////////
// 🚦 Init + Start + Stop
//////////////////////////////
export function initGridGlow() {
  glowLines = Array.from(document.querySelectorAll('.glow-line'));
  if (!glowLines.length) {
    console.warn('⚠️ No glow lines found for QS grid.');
  }
}

export function startGridPulse() {
  if (pulseActive) return;
  pulseActive = true;
  lastTimestamp = null;
  rafId = requestAnimationFrame(pulseFrame);
}

export function stopGridPulse() {
  pulseActive = false;
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  resetGlowLines();
}

//////////////////////////////
// 🔄 Pulse Frame Loop
//////////////////////////////
function pulseFrame(timestamp) {
  if (!pulseActive) return;

  if (!lastTimestamp) lastTimestamp = timestamp;
  const elapsed = timestamp - lastTimestamp;
  const progress = (elapsed % pulseSpeed) / pulseSpeed;

  const wiggle = Math.sin(progress * Math.PI * 2);
  const scale = 1 + wiggle * scaleIntensity;
  const opacity = (opacityBase + Math.abs(wiggle) * opacityBoost).toFixed(2);

  glowLines.forEach(line => {
    line.style.opacity = opacity;
    line.style.transform = `scaleX(${scale})`;
  });

  rafId = requestAnimationFrame(pulseFrame);
}

//////////////////////////////
// 💥 Quick Bump
//////////////////////////////
export function bumpGridGlow(type = 'good') {
  glowLines.forEach(line => {
    line.style.transition = 'transform 0.15s ease, opacity 0.15s ease';
    line.style.transform = 'scaleX(1.25)';
    line.style.opacity = type === 'good' ? '1' : '0.4';

    setTimeout(() => {
      line.style.transition = '';
      line.style.transform = 'scaleX(1)';
      line.style.opacity = opacityBase;
    }, 150);
  });
}

//////////////////////////////
// ♻️ Reset
//////////////////////////////
function resetGlowLines() {
  glowLines.forEach(line => {
    line.style.opacity = opacityBase;
    line.style.transform = 'scaleX(1)';
    line.style.transition = '';
  });
}
