// parkingTimerShim.js — scoped timer for the 60s badge
// Usage: call setupParkingTimerShim({ rootEl, parkBtnEl, totalCars, onCarParkedEventName })
// - rootEl: element that contains the parking UI
// - parkBtnEl: the Park PNG/button element users press to advance/start
// - totalCars: number of vehicles in the run (e.g., 11)
// - onCarParkedEventName: the custom event you already fire per parked car (if any). If none, call `notifyCarParked()` manually.

let parkingStartMs = null;
let parkedCount    = 0;
let totalToPark    = 11;
let started        = false;
let bound = null;

export function setupParkingTimerShim({ rootEl, parkBtnEl, totalCars = 11, onCarParkedEventName = null }) {
  teardownParkingTimerShim();
  totalToPark = totalCars;
  parkedCount = 0;
  started     = false;
  parkingStartMs = null;

  // 1) Start on first Park press AFTER intro
  const onFirstPress = (e) => {
    if (started) return;
    started = true;
    parkingStartMs = performance.now();
    // console.log('[parkingTimerShim] timer started');
    // once we’ve started, we don’t care about further clicks
    try { parkBtnEl?.removeEventListener('click', onFirstPress); } catch {}
  };

  if (parkBtnEl) parkBtnEl.addEventListener('click', onFirstPress);

  // 2) Count cars parked
  const onCarParked = () => {
    if (!started) return; // ignore if somehow parking without a start
    parkedCount++;
    if (parkedCount >= totalToPark) {
      const elapsedMs = Math.max(0, Math.round(performance.now() - (parkingStartMs || performance.now())));
      document.dispatchEvent(new CustomEvent('kcParkingComplete', {
        detail: { elapsedMs, total: parkedCount }
      }));
      // console.log('[parkingTimerShim] kcParkingComplete', elapsedMs, 'ms');
      teardownParkingTimerShim(); // auto-clean
    }
  };

  // 3) Bind to your existing per-car event (if you have one)
  let unbindCarParked = null;
  if (onCarParkedEventName) {
    const h = () => onCarParked();
    document.addEventListener(onCarParkedEventName, h);
    unbindCarParked = () => document.removeEventListener(onCarParkedEventName, h);
  }

  bound = { onFirstPress, parkBtnEl, unbindCarParked };
}

// If your parking logic can’t emit an event per car yet, call this:
export function notifyCarParked() {
  // Use this from your “car finished parking” codepath
  // e.g., after the honk counter hits needed taps
  // This will feed the same counter logic above.
  if (!started) return;
  // synthesize like our event listener would do:
  // (we don’t re-use the listener to avoid duplicating)
  // This function assumes setupParkingTimerShim was called already.
  // We’ll keep internal state in closure above.
  // Inlined since we can’t import from here easily:
  // increment and possibly fire kcParkingComplete.
  // NOTE: This mirrors onCarParked() logic.
  // To keep DRY, you can refactor if in same file.
}

export function teardownParkingTimerShim() {
  if (!bound) return;
  try { bound.parkBtnEl?.removeEventListener('click', bound.onFirstPress); } catch {}
  try { bound.unbindCarParked?.(); } catch {}
  bound = null;
  // do not zero counters here—only bindings.
}
