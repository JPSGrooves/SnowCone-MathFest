// /js/sceneManager.js

// 👋 Optional: import supporting modules
// import { playSound, stopMusic } from './sound.js'; // if needed
// import { saveData, getData } from './dataManager.js'; // if needed

// 🔒 Hide all major app screens (except menu)
function hideAllScreens() {
  document.querySelectorAll('main > section').forEach(el => {
    el.style.display = 'none';
  });
  document.querySelector('.menu-wrapper').style.display = 'none';
}

// 🏁 Launch app into main menu
function loadInitialView() {
  hideAllScreens();
  document.querySelector('.menu-wrapper').style.display = 'flex';
}

// 🚀 Start a specific mode (e.g., "quickServe", "story", "infinity")
function startMode(modeName) {
  hideAllScreens();

  const id = `${modeName}Container`; // ex: "quickServeContainer"
  const container = document.getElementById(id);
  if (container) container.style.display = 'block';

  if (modeName === "quickServe") {
    if (typeof generateProblem === 'function') generateProblem();
  }

  if (modeName === "infinity") {
    if (typeof initInfinityMode === 'function') initInfinityMode();
  }

  if (modeName === "story") {
    if (typeof loadStory === 'function') loadStory();
  }
}

// 🔄 Return to menu screen from any mode
function exitToMenu() {
  hideAllScreens();
  // Optional cleanup logic (stop music, reset vars)
  // stopMusic?.();
  document.querySelector('.menu-wrapper').style.display = 'flex';
}

// 🍦 Trigger a transition animation before switching
function loadTransition(targetMode) {
  // Optional: split-cone or fade effect
  console.log(`🌀 Transitioning to: ${targetMode}`);
  
  // Placeholder: delay and then switch
  setTimeout(() => {
    startMode(targetMode);
  }, 400); // Adjust timing to match transition animation
}

// 🔁 Reset active mode (clear score, timers, etc.)
function resetModeState() {
  // Customize as needed per mode
  console.log("Resetting current mode state...");
  // E.g., reset score, stop intervals, etc.
}

// 🔗 Attach to window for testing
window.startMode = startMode;
window.exitToMenu = exitToMenu;
window.loadTransition = loadTransition;
window.resetModeState = resetModeState;
window.loadInitialView = loadInitialView;
window.hideAllScreens = hideAllScreens;
