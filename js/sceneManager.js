// /js/sceneManager.js

// 🔒 Hide all major app screens (except menu)
function hideAllScreens() {
  document.querySelectorAll('main > section').forEach(el => {
    el.style.display = 'none';
  });
  document.querySelector('.menu-wrapper')?.style.display = 'none';
}

// 🏁 Launch app into main menu
function loadInitialView() {
  hideAllScreens();
  document.querySelector('.menu-wrapper')?.style.display = 'flex';
}

// 🚀 Start a specific mode (e.g., "quickServe", "story", "infinity")
function startMode(modeName) {
  hideAllScreens();
  const container = document.getElementById(`${modeName}Container`);
  if (container) container.style.display = 'block';

  switch (modeName) {
    case "quickServe":
      if (typeof generateProblem === 'function') generateProblem();
      break;
    case "infinity":
      if (typeof initInfinityMode === 'function') initInfinityMode();
      break;
    case "story":
      if (typeof loadStory === 'function') loadStory();
      break;
  }
}

// 🔄 Return to menu screen from any mode
function exitToMenu() {
  hideAllScreens();
  document.querySelector('.menu-wrapper')?.style.display = 'flex';
}

// 🍦 Trigger a transition animation before switching
function loadTransition(targetMode) {
  console.log(`🌀 Transitioning to: ${targetMode}`);
  setTimeout(() => startMode(targetMode), 400); // Match animation timing
}

// 🔁 Reset active mode (clear score, timers, etc.)
function resetModeState() {
  console.log("Resetting current mode state...");
  // TODO: implement per-mode cleanup
}

// 🔗 Attach to window for testing
window.startMode = startMode;
window.exitToMenu = exitToMenu;
window.loadTransition = loadTransition;
window.resetModeState = resetModeState;
window.loadInitialView = loadInitialView;
window.hideAllScreens = hideAllScreens;
