import { appState } from '../data/appState.js';

let isTransitioning = false;

const TRANSITION_THEME_MAP = {
  menubackground: {
    tint: 'rgba(0, 255, 238, 0.14)',
    glow: 'rgba(0, 255, 238, 0.34)',
  },
  default: {
    tint: 'rgba(0, 255, 238, 0.14)',
    glow: 'rgba(0, 255, 238, 0.34)',
  },
  spring: {
    tint: 'rgba(255, 150, 210, 0.14)',
    glow: 'rgba(255, 170, 220, 0.32)',
  },
  summer: {
    tint: 'rgba(0, 245, 255, 0.14)',
    glow: 'rgba(255, 235, 90, 0.32)',
  },
  fall: {
    tint: 'rgba(210, 115, 35, 0.16)',
    glow: 'rgba(255, 165, 65, 0.34)',
  },
  winter: {
    tint: 'rgba(150, 220, 255, 0.14)',
    glow: 'rgba(180, 235, 255, 0.32)',
  },
  halloween: {
    tint: 'rgba(255, 95, 20, 0.16)',
    glow: 'rgba(190, 90, 255, 0.34)',
  },
  harvest: {
    tint: 'rgba(200, 120, 30, 0.16)',
    glow: 'rgba(255, 210, 95, 0.32)',
  },
  christmas: {
    tint: 'rgba(40, 210, 120, 0.14)',
    glow: 'rgba(255, 80, 80, 0.30)',
  },
  freedom: {
    tint: 'rgba(80, 150, 255, 0.14)',
    glow: 'rgba(255, 255, 255, 0.30)',
  },
  newyear: {
    tint: 'rgba(180, 220, 255, 0.14)',
    glow: 'rgba(255, 235, 150, 0.34)',
  },
  valentine: {
    tint: 'rgba(255, 95, 180, 0.16)',
    glow: 'rgba(255, 140, 205, 0.34)',
  },
};

function getTransitionTheme() {
  const themeId = appState.settings?.theme || 'menubackground';

  if (themeId.startsWith('cosmic')) {
    return {
      tint: 'rgba(120, 90, 255, 0.16)',
      glow: 'rgba(0, 255, 238, 0.34)',
    };
  }

  return TRANSITION_THEME_MAP[themeId] || TRANSITION_THEME_MAP.menubackground;
}

function applyTransitionThemeVars(transition) {
  const theme = getTransitionTheme();

  transition.style.setProperty('--scmf-transition-tint', theme.tint);
  transition.style.setProperty('--scmf-transition-glow', theme.glow);
}

function resetTransitionObjects(truck, cone) {
  truck.style.transition = 'none';
  cone.style.transition = 'none';

  truck.style.transform = 'translateX(-155vw)';
  cone.style.transform = 'translateX(155vw)';

  truck.style.opacity = '0';
  cone.style.opacity = '0';
}

function launchTransitionObjects(truck, cone) {
  truck.style.transition =
    'transform 0.82s cubic-bezier(0.16, 0.84, 0.24, 1), opacity 0.22s ease-out';

  cone.style.transition =
    'transform 0.82s cubic-bezier(0.16, 0.84, 0.24, 1) 0.42s, opacity 0.22s ease-out 0.42s';

  truck.style.opacity = '1';
  cone.style.opacity = '1';

  truck.style.transform = 'translateX(155vw)';
  cone.style.transform = 'translateX(-155vw)';
}

export function playTransition(callback) {
  if (isTransitioning) return;

  isTransitioning = true;
  appState.uiState.transitioning = true;

  let transition = document.getElementById('scene-transition');

  if (!transition) {
    transition = document.createElement('div');
    transition.id = 'scene-transition';

    const base = import.meta.env.BASE_URL;

    transition.innerHTML = `
      <img
        class="starfield"
        src="${base}assets/img/transitions/transitionStars.png"
        alt=""
        aria-hidden="true"
      />
      <div class="transition-cosmic-wash" aria-hidden="true"></div>
      <img
        class="transition-truck"
        src="${base}assets/img/transitions/snowConeTruck.png"
        alt="Truck"
      />
      <img
        class="transition-cone"
        src="${base}assets/img/transitions/snowCone.png"
        alt="Snow Cone"
      />
    `;

    document.body.appendChild(transition);
  }

applyTransitionThemeVars(transition);

  const truck = transition.querySelector('.transition-truck');
  const cone = transition.querySelector('.transition-cone');

  if (!truck || !cone) {
    console.error('🚨 Transition elements not found!');
    isTransitioning = false;
    appState.uiState.transitioning = false;
    return;
  }

  transition.classList.remove('active', 'leaving');
  resetTransitionObjects(truck, cone);

  // Force reflow so WKWebView restarts the transition cleanly.
  void transition.offsetWidth;

  transition.classList.add('active');

  // Small lead-in: lets the screen soften before the truck/cone fly.
  window.setTimeout(() => {
    launchTransitionObjects(truck, cone);
  }, 130);

  // Run the mode swap while the transition is still covering the screen.
  window.setTimeout(() => {
    try {
      callback?.();
    } catch (err) {
      console.error('🚨 Transition callback failed:', err);
    }
  }, 980);

  // Fade the transition layer away after the swap has had a beat to settle.
  window.setTimeout(() => {
    transition.classList.add('leaving');
    transition.classList.remove('active');
  }, 1380);

  window.setTimeout(() => {
    transition.classList.remove('leaving');

    resetTransitionObjects(truck, cone);

    isTransitioning = false;
    appState.uiState.transitioning = false;
  }, 1700);
}

let isMenuModeTransitioning = false;

export function playMenuModeTransition(callback) {
  if (isMenuModeTransitioning) return;

  isMenuModeTransitioning = true;
  appState.uiState.transitioning = true;

  const base = import.meta.env.BASE_URL;

  let layer = document.getElementById('menu-mode-transition');

  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'menu-mode-transition';

    layer.innerHTML = `
      <div class="menu-mode-transition-bg" aria-hidden="true"></div>
      <img class="menu-mode-transition-cone" alt="" aria-hidden="true" />
      <div class="menu-mode-transition-black" aria-hidden="true"></div>
    `;

    document.body.appendChild(layer);
  }

  const cone = layer.querySelector('.menu-mode-transition-cone');

  const liveCone =
    document.getElementById('menuCenterCone') ||
    document.querySelector('.menu-center-cone') ||
    document.querySelector('.transition-cone');

  const liveRect = liveCone?.getBoundingClientRect?.();
  const liveSrc =
    liveCone?.getAttribute?.('src') ||
    `${base}assets/img/transitions/snowCone.png`;

  if (cone) {
    cone.src = liveSrc;

    if (liveRect && liveRect.width > 10 && liveRect.height > 10) {
      cone.style.left = `${liveRect.left + liveRect.width / 2}px`;
      cone.style.top = `${liveRect.top + liveRect.height / 2}px`;
      cone.style.width = `${liveRect.width}px`;
    } else {
      cone.style.left = '50vw';
      cone.style.top = '58vh';
      cone.style.width = 'clamp(110px, 24vw, 220px)';
    }
  }

  layer.classList.remove('active', 'to-black', 'leaving');

  // Force reflow so WKWebView/browser restarts cleanly.
  void layer.offsetWidth;

  // 0.00s — stars/cone fade in
  layer.classList.add('active');

  // 1.25s — cone begins fading fully out under a soft veil
  window.setTimeout(() => {
    layer.classList.add('to-black');
  }, 1250);

  // 1.82s — mode swaps only AFTER cone has faded out
  window.setTimeout(() => {
    try {
      callback?.();
    } catch (err) {
      console.error('🚨 Menu mode transition callback failed:', err);
    }
  }, 1820);

  // 1.96s — transition layer crossfades away into the mode intro
  window.setTimeout(() => {
    layer.classList.add('leaving');
  }, 1960);

  // 2.50s — cleanup
  window.setTimeout(() => {
    layer.classList.remove('active', 'to-black', 'leaving');
    isMenuModeTransitioning = false;
    appState.uiState.transitioning = false;
  }, 2500);
}

let isModeReturnTransitioning = false;

function ensureMenuModeTransitionLayer() {
  let layer = document.getElementById('menu-mode-transition');

  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'menu-mode-transition';

    layer.innerHTML = `
      <div class="menu-mode-transition-bg" aria-hidden="true"></div>
      <img class="menu-mode-transition-cone" alt="" aria-hidden="true" />
      <div class="menu-mode-transition-black" aria-hidden="true"></div>
    `;

    document.body.appendChild(layer);
  }

  return layer;
}

function applyModeReturnConeMetrics(cone, metrics) {
  if (!cone || !metrics) return;

  cone.src = metrics.src;
  cone.style.left = `${metrics.left}px`;
  cone.style.top = `${metrics.top}px`;
  cone.style.width = `${metrics.width}px`;
}

function getFallbackReturnConeMetrics(base) {
  return {
    src: `${base}assets/img/transitions/snowCone.png`,
    left: window.innerWidth * 0.5,
    top: window.innerHeight * 0.54,
    width: Math.min(Math.max(window.innerWidth * 0.34, 130), 280),
  };
}

function measureMenuConeForReturn(base) {
  const fallback = getFallbackReturnConeMetrics(base);

  const menuWrapper = document.querySelector('.menu-wrapper');
  const liveCone =
    document.getElementById('menuCenterCone') ||
    document.querySelector('.menu-center-cone');

  if (!menuWrapper || !liveCone) {
    console.warn('🌌 [Transition] Menu cone measurement fallback: missing menu/cone');
    return fallback;
  }

  const wasHidden = menuWrapper.classList.contains('hidden');

  const previousInline = {
    visibility: menuWrapper.style.visibility,
    pointerEvents: menuWrapper.style.pointerEvents,
    opacity: menuWrapper.style.opacity,
  };

  try {
    // The menu is usually display:none via .hidden during modes.
    // We briefly reveal it invisibly so WebKit can calculate the real cone rect.
    if (wasHidden) {
      menuWrapper.style.visibility = 'hidden';
      menuWrapper.style.pointerEvents = 'none';
      menuWrapper.style.opacity = '0';
      menuWrapper.classList.remove('hidden');

      // Force layout while invisible.
      void menuWrapper.offsetWidth;
      void liveCone.offsetWidth;
    }

    const rect = liveCone.getBoundingClientRect?.();
    const src =
      liveCone.getAttribute?.('src') ||
      liveCone.src ||
      fallback.src;

    if (rect && rect.width > 10 && rect.height > 10) {
      return {
        src,
        left: rect.left + rect.width / 2,
        top: rect.top + rect.height / 2,
        width: rect.width,
      };
    }

    console.warn('🌌 [Transition] Menu cone measurement fallback: bad rect', rect);
    return {
      ...fallback,
      src,
    };
  } finally {
    if (wasHidden) {
      menuWrapper.classList.add('hidden');
    }

    menuWrapper.style.visibility = previousInline.visibility;
    menuWrapper.style.pointerEvents = previousInline.pointerEvents;
    menuWrapper.style.opacity = previousInline.opacity;
  }
}

export function playModeReturnTransition(callback) {
  if (isModeReturnTransitioning || isMenuModeTransitioning || isTransitioning) return;

  console.log('🌌 [Transition] playModeReturnTransition fired');

  isModeReturnTransitioning = true;
  appState.uiState.transitioning = true;

  const base = import.meta.env.BASE_URL;
  const layer = ensureMenuModeTransitionLayer();
  const cone = layer.querySelector('.menu-mode-transition-cone');

  // Critical: measure the real menu cone BEFORE the visual transition begins.
  // That prevents the center-position cone snap.
  const coneMetrics = measureMenuConeForReturn(base);
  applyModeReturnConeMetrics(cone, coneMetrics);

  layer.classList.remove(
    'active',
    'to-black',
    'leaving',
    'returning',
    'return-cone-ready',
    'return-menu-ready'
  );

  // Force reflow so WKWebView restarts the classes cleanly.
  void layer.offsetWidth;

  // 0.00s — transitionStars fades in alone.
  layer.classList.add('returning', 'active');

  // 0.62s — cone fades in already at the exact menu cone position/size.
  window.setTimeout(() => {
    layer.classList.add('return-cone-ready');
  }, 620);

  // 1.38s — restore menu behind the opaque starfield.
  window.setTimeout(() => {
    try {
      callback?.();
    } catch (err) {
      console.error('🚨 Mode return transition callback failed:', err);
    }

    console.log('🌌 [Transition] menu restored behind return portal');
  }, 1380);

  // 1.78s — begin the blend into the restored menu.
  window.setTimeout(() => {
    layer.classList.add('return-menu-ready', 'leaving');
  }, 1780);

  // 2.50s — cleanup.
  window.setTimeout(() => {
    layer.classList.remove(
      'active',
      'to-black',
      'leaving',
      'returning',
      'return-cone-ready',
      'return-menu-ready'
    );

    isModeReturnTransitioning = false;
    appState.uiState.transitioning = false;

    console.log('🌌 [Transition] playModeReturnTransition cleaned up');
  }, 2500);
}

