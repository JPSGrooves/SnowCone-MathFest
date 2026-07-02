// 🍧 quickServeGridFX.js — Cosmic Grid Waves 🌊✨

let pulseActive = false;
let rafId = null;
let lastTs = null;

let BPM = 105; // same API
const calcPulseMs = bpm => (120 / bpm) * 1000;
const isConnected = el => !!(el && el.isConnected);


// ── canvas + sizing ───────────────────────────────────────────
let container;         // .glow-lines
let canvas, ctx;
let dpr = 1;
let W = 0, H = 0;

// ── wave params ───────────────────────────────────────────────
const baselines = [0.22, 0.5, 0.78];   // 22%, 50%, 78% height
let k = 0;                              // spatial frequency (recalc on resize)
let baseAmp = 10;                       // px, scaled on resize
let phase = 0;                          // global phase
let bumpAmt = 0;                        // extra amplitude from bumps
let bumpEnd = 0;                        // timestamp
let scoreValue = 0;                     // current QS score for tier color
let tint = 'base';                      // base/tier/bad color key
let scoreTint = 'base';                 // current score-tier color key
let tintOverrideEnd = 0;                // bad pulse color timeout
let pulseMs = calcPulseMs(BPM);

// visuals
const QS_BAD_TINT_MS = 3000;

const COLORS = {
  base: 'rgba(255, 255, 255, 1)',     // start/base white
  tier25: 'rgba(255, 221, 85, 1)',    // yellow
  tier50: 'rgba(0, 255, 238, 1)',     // cyan
  tier75: 'rgba(178, 93, 255, 1)',    // purple
  tier100: 'rgba(80, 255, 139, 1)',   // green
  bad: 'rgba(255, 77, 255, 1)',       // magenta wrong/clear pulse
};

export function setGridBPM(newBPM) {
  BPM = newBPM;
  pulseMs = calcPulseMs(BPM);
}
export function getGridBPM() { return BPM; }

function getGridTierTint(nextScore = scoreValue) {
  const n = Math.max(0, Number(nextScore) || 0);

  if (n >= 100) return 'tier100';
  if (n >= 75) return 'tier75';
  if (n >= 50) return 'tier50';
  if (n >= 25) return 'tier25';

  return 'base';
}

function isBadTintOverrideActive(now = performance.now()) {
  return tintOverrideEnd > 0 && now < tintOverrideEnd;
}

function returnToScoreTint() {
  tintOverrideEnd = 0;
  tint = scoreTint;
}

export function setGridScore(nextScore = 0) {
  scoreValue = Math.max(0, Number(nextScore) || 0);
  scoreTint = getGridTierTint(scoreValue);

  if (!isBadTintOverrideActive()) {
    tint = scoreTint;
  }
}


// ── lifecycle ─────────────────────────────────────────────────
export function initGridGlow() {
  const nextContainer = document.querySelector('.glow-lines');
  if (!nextContainer) {
    console.warn('⚠️ No .glow-lines container found for QS grid.');
    return;
  }

  container = nextContainer;
  resetGridVisualState();

  // Hide old straight lines (fallback stays in markup)
  container.querySelectorAll('.glow-line').forEach(el => (el.style.display = 'none'));

  // Create the canvas once
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.className = 'qs-waves';
    canvas.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:0;';
    ctx = canvas.getContext('2d');
    // one global listener is fine; guarded by !canvas check
    window.addEventListener('resize', resize, { passive: true });
  }

  // ⬅️ KEY FIX: if the canvas isn't in the DOM (new scene), re-append it
  if (!isConnected(canvas) || canvas.parentNode !== container) {
    container.appendChild(canvas);
  }

  resize();
}


export function startGridPulse() {
  if (pulseActive || !canvas) return;
  resetGridVisualState();
  clear();
  pulseActive = true;
  lastTs = null;
  rafId = requestAnimationFrame(frame);
}

export function stopGridPulse() {
  pulseActive = false;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
  lastTs = null;
  resetGridVisualState();
  clear();
}

function resize() {
  if (!container || !canvas) return;
  const rect = container.getBoundingClientRect();

  // If the container is hidden just this tick, try again next frame.
  if (!rect.width || !rect.height) {
    requestAnimationFrame(resize);
    return;
  }

  W = Math.max(1, Math.floor(rect.width));
  H = Math.max(1, Math.floor(rect.height));
  dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.floor(W * dpr);
  canvas.height = Math.floor(H * dpr);
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // scale params with height/width
  baseAmp = Math.max(6, H * 0.035);
  const cyclesAcross = 1.8;
  k = (Math.PI * 2 * cyclesAcross) / W;

  clear();
}


function clear() {
  if (!ctx) return;
  ctx.clearRect(0, 0, W, H);
}

function resetGridVisualState() {
  scoreValue = 0;
  scoreTint = 'base';
  tint = 'base';
  tintOverrideEnd = 0;
  bumpAmt = 0;
  bumpEnd = 0;
}


// ── animation ─────────────────────────────────────────────────
function frame(ts) {
  if (!pulseActive) return;

  if (!lastTs) lastTs = ts;
  const dt = Math.min(64, ts - lastTs); // clamp for perf spikes
  lastTs = ts;

  // phase speed ≈ BPM; tweak factor for vibe
  const beatsPerSec = BPM / 60;
  const twoPi = Math.PI * 2;
  phase += dt * beatsPerSec * 0.35 * (twoPi / 1000); // 0.5 cycles per beat

  // soft pulse on alpha based on the same beat
  const pulse = (1 + Math.sin((ts % pulseMs) / pulseMs * twoPi)) * 0.5;
  const alpha = 0.25 + pulse * 0.55; // 0.25 → 0.8

  // bad/clear-wrong magenta holds briefly, then returns to score tier
  if (tintOverrideEnd > 0 && ts >= tintOverrideEnd) {
    returnToScoreTint();
  }

  // bump decay
  if (bumpAmt > 0 && ts > bumpEnd) bumpAmt = 0;
  const amp = baseAmp + bumpAmt;

  drawWaves(alpha, amp);

  rafId = requestAnimationFrame(frame);
}

function drawWaves(alpha, amp) {
  clear();
  if (!ctx) return;

  ctx.globalCompositeOperation = 'lighter';

  baselines.forEach((b, idx) => {
    const y0 = b * H;
    const localAmp = amp * (1 - 0.1 * idx); // tiny taper
    const localPhase = phase + idx * 1.2;

    ctx.beginPath();
    for (let x = 0; x <= W; x += 2) {
      const y = y0 + localAmp * Math.sin(k * x - localPhase);
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }

    // glow + stroke
    ctx.lineWidth = 2;
    ctx.globalAlpha = alpha * (0.95 - idx * 0.18); // back lines a tad dimmer
    ctx.strokeStyle = COLORS[tint];
    ctx.shadowColor = COLORS[tint];
    ctx.shadowBlur = 14;

    ctx.stroke();
    ctx.shadowBlur = 0;
  });

  ctx.globalCompositeOperation = 'source-over';
}

// ── feedback "bump" from game events ─────────────────────────
export function bumpGridGlow(type = 'good') {
  const now = performance.now();
  const isBad = type === 'bad';

  if (isBad) {
    tint = 'bad';
    tintOverrideEnd = now + QS_BAD_TINT_MS;
  } else {
    returnToScoreTint();
  }

  // amplitude pop that eases out
  const duration = isBad ? 650 : 420;
  const peak = baseAmp * (isBad ? 0.62 : 0.95);

  bumpAmt = peak;
  bumpEnd = now + duration;

  // Color is handled in frame(); bad/clear-wrong returns after QS_BAD_TINT_MS.
}
