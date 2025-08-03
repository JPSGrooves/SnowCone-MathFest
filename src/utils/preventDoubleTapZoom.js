// utils/preventDoubleTapZooom.js

let lastTapTime = 0;

export function preventDoubleTapZoom(el) {
  el.addEventListener('pointerdown', (e) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime;
    lastTapTime = now;

    // If tap happened within 300ms, block zoom
    if (timeSinceLastTap < 300) {
      e.preventDefault();
    }
  }, { passive: false });
}
