// /src/modes/kidsCamping/mosquitoGame.js
import { Howl } from 'howler';

const SFX_BASE = `${import.meta.env.BASE_URL}assets/audio/SFX/`;
const MOSQ_SFX  = SFX_BASE + 'mosquito.mp3';

export function initMosquitoGame(opts = {}) {
  const {
    // IMPORTANT: pass a concrete element (e.g., document.querySelector('#game-container'))
    // so the mosquito is confined AND auto-stops when that element is removed.
    zoneEl,
    spawnDelayMs = 7000,     // 7s initial spawn
    respawnDelayMs = 7000,   // 7s after splat
    baseSpeed = 80,          // festival chill
    noise = 14,              // random drift
    onSwat = null,
  } = opts;

  if (!zoneEl) {
    console.warn('[mosquitoGame] No zoneEl provided; mosquito will not start.');
    // Provide a safe no-op controller so callers don't have to null-check.
    return { enable(){}, disable(){}, cleanup(){} };
  }

  const ASSET_BASE = `${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/`;
  const MOSQ_SRC   = ASSET_BASE + 'mosquito.png';
  const SPLAT_SRC  = ASSET_BASE + 'splat.png';

  // Per-instance state (no globals)
  let running = false;
  let rafId = 0;
  const timers = [];

  let host = zoneEl;
  let holder = null;   // <div> we translate
  let mosq = null;     // <img> mosquito sprite
  let x = 0, y = -80;
  let vx = 0, vy = 0;
  let lastT = 0;
  let swatted = false;

  // Generation token — cancels late callbacks from previous runs.
  let gen = 0;

  // Watch host removal so we can self-destruct if the mode is torn down
  let hostObserver = null;

  ensureMosquitoStyles();
  ensureZonePositioned(host);

  function enable() {
    if (running || !hostIsValid()) return;
    running = true;
    gen++; // new life
    schedule(spawnDelayMs, spawnOnce, gen);
    watchHostDetach();
  }

  function disable() {
    running = false;
    gen++; // invalidate any in-flight callbacks
    stopRAF();
    clearTimers();
    unwatchHostDetach();
    despawn();
  }

  function cleanup() {
    disable();
    // nothing else to clean; all DOM lived under host
  }

  // ── internals ────────────────────────────────────────────────────────────────
  function hostIsValid() {
    return !!host && host.isConnected;
  }

  function ensureZonePositioned(el) {
    if (!el) return;
    const cs = getComputedStyle(el);
    if (cs.position === 'static') el.style.position = 'relative';
    // We do NOT set pointer-events here; container stays “transparent”.
  }

  function watchHostDetach() {
    if (hostObserver || !hostIsValid()) return;
    hostObserver = new MutationObserver(() => {
      // If host is removed, or its subtree nuked between frames, bail hard.
      if (!hostIsValid()) disable();
    });
    // Observe document for subtree changes so we can notice when host leaves DOM
    hostObserver.observe(document.documentElement, { childList: true, subtree: true });
  }

  function unwatchHostDetach() {
    try { hostObserver?.disconnect(); } catch {}
    hostObserver = null;
  }

  function schedule(ms, fn, bornGen) {
    const id = setTimeout(() => {
      removeTimer(id);
      if (!running || !hostIsValid() || bornGen !== gen) return;
      fn(bornGen);
    }, ms);
    timers.push(id);
  }

  function clearTimers() {
    while (timers.length) {
      const id = timers.pop();
      clearTimeout(id);
    }
  }

  function removeTimer(id) {
    const idx = timers.indexOf(id);
    if (idx >= 0) timers.splice(idx, 1);
  }

  function startRAF(loop) {
    const bornGen = gen;
    const step = () => {
      if (!running || !hostIsValid() || bornGen !== gen) return;
      rafId = requestAnimationFrame(step);
      loop();
    };
    rafId = requestAnimationFrame(step);
  }

  function stopRAF() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function bounds() {
    // We always constrain to the host's content box
    const r = host.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  }

  function spawnOnce(bornGen = gen) {
    if (!running || !hostIsValid() || bornGen !== gen) return;
    despawn(); // safety (cleans prior holder/mosq if any)

    const b = bounds();

    // Holder we translate around inside host
    holder = document.createElement('div');
    holder.className = 'mosq-holder';
    holder.style.position = 'absolute'; // relative to host (host is positioned)
    holder.style.left = '0';
    holder.style.top = '0';
    holder.style.width = '0';
    holder.style.height = '0';
    holder.style.zIndex = '9999';
    holder.style.willChange = 'transform';
    holder.style.pointerEvents = 'auto';

    // The flying sprite
    mosq = document.createElement('img');
    mosq.src = MOSQ_SRC;
    mosq.alt = 'Mosquito';
    mosq.className = 'mosq-sprite';
    mosq.draggable = false;
    mosq.style.width = '42px';
    mosq.style.height = '42px';
    mosq.style.objectFit = 'contain';
    mosq.style.filter = 'drop-shadow(0 0 6px rgba(0,0,0,.35))';
    mosq.style.userSelect = 'none';
    mosq.style.webkitUserDrag = 'none';
    mosq.style.touchAction = 'manipulation';
    mosq.style.cursor = 'pointer';

    holder.appendChild(mosq);
    host.appendChild(holder);

    // Initial position/velocity: start above the top, slide in
    const margin = 24;
    x = Math.random() * Math.max(1, (b.w - 2 * margin)) + margin;
    y = -60;
    vx = (Math.random() * 2 - 1) * (baseSpeed * 0.6);
    vy = baseSpeed * (0.9 + Math.random() * 0.4);
    swatted = false;

    // Set transform BEFORE first RAF to avoid flash at (0,0)
    holder.style.transform =
      `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;

    // Cute entry pop (on IMG only)
    mosq.classList.add('mosq-enter');

    // Tap to splat
    mosq.onpointerdown = (e) => {
      if (swatted || !running || !hostIsValid() || bornGen !== gen) return;
      swatted = true;

      stopRAF();
      playMosquitoSplatSfx();

      spawnSplatAtPointer(host, e, SPLAT_SRC);

      mosq.classList.remove('mosq-enter');
      mosq.classList.add('mosq-splat');
      mosq.style.pointerEvents = 'none';

      mosq.addEventListener('animationend', () => {
        // Guard against late-calls after disable()
        if (bornGen !== gen) return;
        despawn();
        try { onSwat?.(); } catch {}
        if (running && hostIsValid() && bornGen === gen) {
          schedule(respawnDelayMs, spawnOnce, bornGen);
        }
      }, { once: true });
    };

    lastT = performance.now();
    startRAF(tick);
  }

  function despawn() {
    if (mosq) {
      mosq.onpointerdown = null;
    }
    if (holder && holder.parentNode) {
      holder.remove();
    }
    holder = null;
    mosq = null;
  }

  function tick() {
    // Bail if mode ended / host gone
    if (!running || !hostIsValid()) { stopRAF(); despawn(); return; }

    const now = performance.now();
    const dt = Math.max(0.001, (now - lastT) / 1000);
    lastT = now;

    const b = bounds();

    // Wobbly drift
    vx += (Math.random() * 2 - 1) * noise;
    vy += (Math.random() * 2 - 1) * noise;

    // Clamp speed
    const maxV = baseSpeed * 1.4;
    const s = Math.hypot(vx, vy);
    if (s > maxV) { const k = maxV / s; vx *= k; vy *= k; }

    // Move
    x += vx * dt; y += vy * dt;

    // Bounce within host
    const pad = 20;
    const W = b.w, H = b.h;
    if (x < pad)     { x = pad;     vx = Math.abs(vx); }
    if (x > W - pad) { x = W - pad; vx = -Math.abs(vx); }
    if (y < pad)     { y = pad;     vy = Math.abs(vy); }
    if (y > H - pad) { y = H - pad; vy = -Math.abs(vy); }

    if (holder) {
      holder.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
    }
  }

  function ensureMosquitoStyles() {
    if (document.getElementById('mosquito-style-block')) return;
    const style = document.createElement('style');
    style.id = 'mosquito-style-block';
    style.textContent = `
      .mosq-holder { will-change: transform; transform: translateZ(0); }
      .mosq-sprite { will-change: transform, opacity; animation: mosqBobble 1.2s ease-in-out infinite; }
      .mosq-enter  { animation: mosqPop 220ms ease-out; }
      .mosq-splat  { animation: mosqFade 420ms ease forwards; }

      @keyframes mosqBobble {
        0% { transform: translateY(0) rotate(0) }
        25%{ transform: translateY(-2px) rotate(-3deg) }
        50%{ transform: translateY(0) rotate(2deg) }
        75%{ transform: translateY(-1px) rotate(3deg) }
        100%{transform: translateY(0) rotate(0) }
      }
      @keyframes mosqPop { from { transform: scale(.88); opacity: 0 } to { transform: scale(1); opacity: 1 } }
      @keyframes mosqFade { 0% { transform: scale(1); opacity: 1 } 60% { transform: scale(1.05); opacity:.9 } 100% { transform: scale(.92); opacity: 0 } }

      .kc-splat {
        width: clamp(40px, 8vh, 72px);
        height: auto;
        pointer-events: none;
        position: absolute; /* positioned within host */
        transform: translate(-50%, -50%) scale(0.7);
        opacity: 0;
        filter: drop-shadow(0 0 6px rgba(0,0,0,.35));
        transition: transform 120ms ease, opacity 120ms ease;
        z-index: 1000;
      }
      .kc-splat.in  { transform: translate(-50%, -50%) scale(1);   opacity: 1; }
      .kc-splat.out { transform: translate(-50%, -50%) scale(0.9); opacity: 0; }

      @media (prefers-reduced-motion: reduce) {
        .mosq-sprite { animation-duration: 2.4s !important; }
      }
    `;
    document.head.appendChild(style);
  }

  // Helpers
  function getPointerXY(evt) {
    if (evt.touches && evt.touches.length) {
      return { x: evt.touches[0].clientX, y: evt.touches[0].clientY };
    }
    return { x: evt.clientX, y: evt.clientY };
  }

  function spawnSplatAtPointer(zone, evt, src) {
    const { x: clientX, y: clientY } = getPointerXY(evt);
    const r = zone.getBoundingClientRect();

    const splat = document.createElement('img');
    splat.src = src;
    splat.alt = 'splat!';
    splat.className = 'kc-splat';
    splat.style.left = `${clientX - r.left}px`;
    splat.style.top  = `${clientY - r.top}px`;
    zone.appendChild(splat);

    requestAnimationFrame(() => splat.classList.add('in'));
    setTimeout(() => {
      splat.classList.add('out');
      setTimeout(() => splat.remove(), 500);
    }, 350);
  }

  function playMosquitoSplatSfx() {
    try {
      const sfx = new Howl({ src: [MOSQ_SFX], volume: 0.14 }); // -50%
      sfx.play();
    } catch {}
  }

  // Public API
  return { enable, disable, cleanup };
}
