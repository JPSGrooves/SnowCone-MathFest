// src/utils/iosLoupeKiller.js
export function enableIosLoupeKiller(scope = document.getElementById('game-container') || document) {
  const W = (globalThis.__KC_LOUPE__ ||= new WeakMap());
  if (W.has(scope)) return;

  const st = { lastTouchEnd: 0, handlers: [] };
  const add = (t, fn, opts) => { scope.addEventListener(t, fn, opts); st.handlers.push([t, fn, opts]); };

  const block = (e) => {
    // Allow explicit opt-in areas
    if (e.target.closest('.allow-select, input, textarea, [data-allow-select]')) return;
    e.preventDefault();
    e.stopPropagation();
  };

  // 1) Kill selection & context
  add('selectstart', block, { capture: true, passive: false });
  add('contextmenu', block, { capture: true, passive: false });

  // 2) Kill iOS gesture (pinch)
  add('gesturestart', block, { capture: true, passive: false });
  add('gesturechange', block, { capture: true, passive: false });
  add('gestureend', block, { capture: true, passive: false });

  // 3) Kill copy/cut in scope
  add('copy', block, { capture: true });
  add('cut',  block, { capture: true });

  // 4) Kill double-tap zoom
  add('touchend', (e) => {
    const now = e.timeStamp;
    if (now - st.lastTouchEnd < 350) block(e); // second tap within window → block
    st.lastTouchEnd = now;
  }, { capture: true, passive: false });

  // (Optional) If you still see a loupe, uncomment this—but test: it can block clicks on some setups.
  // add('touchstart', block, { capture: true, passive: false });

  W.set(scope, st);
}

export function disableIosLoupeKiller(scope = document.getElementById('game-container') || document) {
  const W = globalThis.__KC_LOUPE__;
  const st = W?.get(scope);
  if (!st) return;
  for (const [t, fn, opts] of st.handlers) scope.removeEventListener(t, fn, opts);
  W.delete(scope);
}
