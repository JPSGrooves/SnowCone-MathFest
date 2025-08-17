// utils/gestureCage.js
export function enableGestureCage() {
  const S = (globalThis.__KC_CAGE__ ||= {});
  if (S.on) return;
  S.on = true;

  // 1) viewport lock (kills dbl-tap/pinch zoom on iOS)
  S.vp = document.querySelector('meta[name="viewport"]');
  S.prev = S.vp?.getAttribute('content') ?? null;
  if (!S.vp) {
    S.vp = document.createElement('meta');
    S.vp.setAttribute('name', 'viewport');
    document.head.appendChild(S.vp);
  }
  S.vp.setAttribute(
    'content',
    'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
  );

  // 2) css toggles
  document.documentElement.classList.add('kc-no-zoom', 'kc-no-select', 'kc-no-drag');
  document.body.classList.add('kc-no-zoom');

  // 3) event-level blocks
  let lastTouchTime = 0;
  S.blockCtx = e => e.preventDefault();                          // no context menu
  S.blockSelect = e => {
    const t = e.target;
    if (t.closest('.allow-select, input, textarea')) return;
    e.preventDefault();
  };
  S.blockDrag = e => e.preventDefault();
  S.blockGesture = e => e.preventDefault();                      // iOS pinch
  S.blockDblClick = e => e.preventDefault();                     // desktop dbl-click
  S.blockDoubleTap = e => {                                      // iOS dbl-tap
    const now = e.timeStamp;
    if (now - lastTouchTime < 350) { e.preventDefault(); e.stopPropagation(); }
    lastTouchTime = now;
  };

  // ⛔️ stop copying entirely while in kids mode
  S.blockCopy = e => { e.preventDefault(); };
  S.blockCut  = e => { e.preventDefault(); };

  document.addEventListener('contextmenu', S.blockCtx);
  document.addEventListener('selectstart', S.blockSelect, { passive: false });
  document.addEventListener('dragstart', S.blockDrag, { passive: false });
  document.addEventListener('gesturestart', S.blockGesture, { passive: false });
  document.addEventListener('gesturechange', S.blockGesture, { passive: false });
  document.addEventListener('gestureend', S.blockGesture, { passive: false });
  document.addEventListener('touchend', S.blockDoubleTap, { passive: false, capture: true });
  document.addEventListener('dblclick', S.blockDblClick, true);
  document.addEventListener('copy', S.blockCopy);  // 👈 new
  document.addEventListener('cut',  S.blockCut);   // 👈 new
}

export function disableGestureCage() {
  const S = globalThis.__KC_CAGE__;
  if (!S?.on) return;
  S.on = false;

  document.documentElement.classList.remove('kc-no-zoom', 'kc-no-select', 'kc-no-drag');
  document.body.classList.remove('kc-no-zoom');

  try {
    document.removeEventListener('contextmenu', S.blockCtx);
    document.removeEventListener('selectstart', S.blockSelect);
    document.removeEventListener('dragstart', S.blockDrag);
    document.removeEventListener('gesturestart', S.blockGesture);
    document.removeEventListener('gesturechange', S.blockGesture);
    document.removeEventListener('gestureend', S.blockGesture);
    document.removeEventListener('touchend', S.blockDoubleTap, true);
    document.removeEventListener('dblclick', S.blockDblClick, true);
    document.removeEventListener('copy', S.blockCopy);
    document.removeEventListener('cut',  S.blockCut);
  } catch {}

  if (S.vp) {
    if (S.prev) S.vp.setAttribute('content', S.prev);
    else S.vp.remove();
  }

  for (const k of Object.keys(S)) S[k] = null;
}
