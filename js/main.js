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

function handleTitleClick() {
  console.log("Title clicked! Future feature coming...");
  // TODO: Open credits, music player, or tutorial
}

function lockGridToImage() {
  const bgImg = document.getElementById("bg-measure");
  const grid = document.querySelector(".menu-grid");

  if (!bgImg || !grid) return;

  const rect = bgImg.getBoundingClientRect();
  const minHeight = 600;

  const height = Math.max(rect.height, minHeight);
  const width = rect.width;

  grid.style.height = `${height}px`;
  grid.style.width = `${width}px`;
}

window.addEventListener("load", lockGridToImage);
window.addEventListener("resize", lockGridToImage);
