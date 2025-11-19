// /src/modes/storyMode/ui/pickupPing.js
let __pickupStyleInjected = false;
let __pickupStack = null;

function injectPickupStyle() {
  if (__pickupStyleInjected) return;
  const css = `
  .pickup-stack {
    position: fixed;
    left: 50%;
    top: 10vh;
    transform: translateX(-50%);
    z-index: 999999;
    display: grid;
    grid-auto-rows: auto;
    gap: 8px;
    pointer-events: none;
  }
  .pickup-lane { display: grid; gap: 8px; justify-items: center; }
  .pickup-lane.item { }
  .pickup-lane.cash { margin-top: 10px; }

  .pickup-toast {
    font-family: "Orbitron", system-ui, sans-serif;
    background: rgba(0,16,16,0.92);
    color: #9ff;
    border: 2px solid rgba(0,255,238,0.6);
    box-shadow: 0 12px 24px rgba(0,255,238,0.25), inset 0 0 16px rgba(0,255,238,0.25);
    border-radius: 14px;
    padding: .55rem .85rem;
    display: inline-flex;
    align-items: center;
    gap: .55rem;
    opacity: 0;
    transform-origin: center top;
    will-change: transform, opacity, filter;
    pointer-events: none;
  }
  .pickup-toast.show { animation: pickup-pop 140ms ease-out forwards; }
  /* epic = bigger, glowier */
  .pickup-toast.epic {
    font-size: 1.15em;
    border-width: 3px;
    box-shadow:
      0 16px 30px rgba(0,255,238,0.35),
      inset 0 0 22px rgba(0,255,238,0.35),
      0 0 60px rgba(0,255,238,0.25);
    filter: saturate(1.15);
  }
  .pickup-emoji { font-size: 1.35rem; filter: drop-shadow(0 0 10px rgba(0,255,238,0.45)); }
  .pickup-text { font-weight: 900; text-shadow: 0 0 10px rgba(0,255,238,0.45); letter-spacing: .02em; white-space: nowrap; }

  @keyframes pickup-pop {
    0% { opacity: 0; transform: translateY(-6px) scale(0.98); filter: brightness(0.9); }
    100%{ opacity: 1; transform: translateY(0)     scale(1);    filter: brightness(1); }
  }
  /* we’ll apply fade dynamically based on durationMs */
  @keyframes pickup-fade {
    0% { opacity: 1; transform: translateY(0) }
    100%{ opacity: 0; transform: translateY(-14px) }
  }

  .pickup-bag-pulse { animation: pickup-bag 820ms ease both; }
  @keyframes pickup-bag {
    0% { transform: scale(1); box-shadow: 0 0 0 rgba(0,255,238,0); }
    30%{ transform: scale(1.08); box-shadow: 0 0 18px rgba(0,255,238,0.45); }
    100%{ transform: scale(1); box-shadow: 0 0 0 rgba(0,255,238,0); }
  }`;
  const tag = document.createElement('style');
  tag.id = 'pickupPingStyles';
  tag.textContent = css;
  document.head.appendChild(tag);
  __pickupStyleInjected = true;
}

function ensureStack() {
  if (__pickupStack) return __pickupStack;
  const stack = document.createElement('div');
  stack.className = 'pickup-stack';
  stack.innerHTML = `
    <div class="pickup-lane item" data-kind="item"></div>
    <div class="pickup-lane cash" data-kind="cash"></div>
  `;
  document.body.appendChild(stack);
  __pickupStack = stack;
  return stack;
}

/**
 * pickupPing
 * @param {Object} opts
 * @param {'item'|'cash'} [opts.kind='item']
 * @param {string} [opts.emoji='✨']
 * @param {string} [opts.name='Item']
 * @param {number} [opts.qty=1]
 * @param {boolean} [opts.enableCash=true]
 * @param {'normal'|'epic'} [opts.variant='normal']
 * @param {number} [opts.durationMs=1700]
 */
export function pickupPing({
  kind='item',
  emoji='✨',
  name='Item',
  qty=1,
  enableCash=true,
  variant='normal',
  durationMs=6600
} = {}) {
  try {
    injectPickupStyle();
    const stack = ensureStack();

    if (kind === 'cash' && !enableCash) return;

    const lane = stack.querySelector(`.pickup-lane.${kind === 'cash' ? 'cash' : 'item'}`) || stack;

    const toast = document.createElement('div');
    toast.className = 'pickup-toast';
    if (variant === 'epic') toast.classList.add('epic');
    toast.innerHTML = `
      <span class="pickup-emoji">${emoji}</span>
      <span class="pickup-text">+${qty > 1 ? qty+' ' : ''}${name}</span>
    `;

    // dynamic fade timing (pop is always 140ms, then fade runs afterward)
    const fade = document.createElement('style');
    fade.textContent = `
      .pickup-toast.__fade-${durationMs} { animation: pickup-fade ${Math.max(600, durationMs)}ms ease ${140}ms forwards; }
    `;
    document.head.appendChild(fade);
    toast.classList.add(`__fade-${durationMs}`);

    lane.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    if (kind !== 'cash') {
      const bag = document.getElementById('smInv');
      if (bag) {
        bag.classList.add('pickup-bag-pulse');
        setTimeout(() => bag.classList.remove('pickup-bag-pulse'), 820);
      }
    }

    setTimeout(() => {
      toast.remove();
      fade.remove();
    }, 140 + Math.max(600, durationMs) + 60);
  } catch (e) {
    console.warn('[pickupPing] failed:', e);
  }
}

if (typeof window !== 'undefined') window.__pickupPing = pickupPing;
