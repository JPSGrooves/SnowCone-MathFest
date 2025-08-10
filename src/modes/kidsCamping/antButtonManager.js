// src/modes/kidsCamping/antButtonManager.js
let readyAnts = 10;
const maxAnts = 10;

// Update DOM refs to match class, not ID
const antButton = document.getElementById('kc-ant-button');
const antOverlay = document.querySelector('.ant-count'); // Changed to class

export function initAntButtonManager() {
  if (!antOverlay) {
    console.error('Ant count overlay not found!');
    return;
  }
  updateAntOverlay();
  antButton.addEventListener('click', onAntClick);
}

function onAntClick() {
  if (readyAnts <= 0) return;
  readyAnts--;
  updateAntOverlay();
  const event = new CustomEvent('deployAnt', { detail: { team: 'black', count: 1 } });
  dispatchEvent(event);
  if (readyAnts === 0) antButton.classList.add('disabled');
}

function updateAntOverlay() {
  antOverlay.textContent = `${readyAnts}/10`; // Update to show current count
  antButton.classList.toggle('disabled', readyAnts <= 0);
}

export function regenAnts(resultType) {
  let bonus = { great: 5, good: 4, loss: 3 }[resultType] || 0;
  readyAnts = Math.min(maxAnts, readyAnts + bonus); // Cap at 10
  updateAntOverlay();
}

export function resetAntPool() {
  readyAnts = maxAnts;
  updateAntOverlay();
}