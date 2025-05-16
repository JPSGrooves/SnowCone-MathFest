function hideAllScreens() {
  document.querySelectorAll('main > section').forEach(el => {
    el.style.display = 'none';
  });
}
function startMathTips() {
  hideAllScreens();
  document.getElementById('tutorialContainer').style.display = 'block';
}

function startQuickServe() {
  hideAllScreens();
  document.getElementById('gameContainer').style.display = 'block';
  generateProblem();
}

function startInfinityMode() {
  hideAllScreens();
  document.getElementById('infinityContainer').style.display = 'block';
}

function openMusicPlayer() {
  hideAllScreens();
  document.getElementById('musicModal').style.display = 'flex';
}
function updateLabelOverlay() {
  const image = document.getElementById("menuMap");
  const overlay = document.getElementById("labelOverlay");

  const rect = image.getBoundingClientRect();

  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;
  overlay.style.left = `${rect.left + window.scrollX}px`;
  overlay.style.top = `${rect.top + window.scrollY}px`;
  overlay.style.position = 'absolute';
}

window.addEventListener("load", updateLabelOverlay);
window.addEventListener("resize", updateLabelOverlay);


