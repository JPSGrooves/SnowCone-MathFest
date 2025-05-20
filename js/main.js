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

  overlay.style.position = 'absolute';
  overlay.style.width = `${rect.width}px`;
  overlay.style.height = `${rect.height}px`;
  overlay.style.left = `${rect.left + window.scrollX}px`;
  overlay.style.top = `${rect.top + window.scrollY}px`;
}

// Run it on load and resize
window.addEventListener("load", updateLabelOverlay);
window.addEventListener("resize", updateLabelOverlay);

function handleTitleClick() {
  console.log("Title clicked! Future feature coming...");
  // TODO: Open credits, music player, or tutorial
}
function positionTitleOverImage() {
  const image = document.getElementById('menuMap');
  const title = document.querySelector('.menu-title-top');

  const rect = image.getBoundingClientRect();
  title.style.top = `${rect.top + rect.height * 0.13}px`; // 13% down the image
}
window.addEventListener('load', positionTitleOverImage);
window.addEventListener('resize', positionTitleOverImage);


function lockGridToImage() {
  const bgImg = document.getElementById("bg-measure");
  const grid = document.querySelector(".menu-grid");

  if (!bgImg || !grid) return;

  const rect = bgImg.getBoundingClientRect();
  const minHeight = 600; // You can adjust this if your PNG is taller or shorter

  grid.style.height = `${Math.max(rect.height, minHeight)}px`;
}

window.addEventListener("load", lockGridToImage);
window.addEventListener("resize", lockGridToImage);




