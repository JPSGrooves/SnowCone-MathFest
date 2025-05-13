function startMathTips() {
  console.log("🧠 Starting Math Tips...");
  document.getElementById('menuScreen').style.display = 'none';
  document.getElementById('tutorialContainer').style.display = 'block';
}

function startQuickServe() {
  console.log("🍧 Launching Quick Serve...");
  document.getElementById('menuScreen').style.display = 'none';
  document.getElementById('gameContainer').style.display = 'block';
  generateProblem();
}

function startInfinityMode() {
  console.log("♾️ Launching Infinity Mode...");
  document.getElementById('menuScreen').style.display = 'none';
  document.getElementById('infinityContainer').style.display = 'block';
}

function openMusicPlayer() {
  console.log("🎵 Opening music modal...");
  document.getElementById('menuScreen').style.display = 'none';
  document.getElementById('musicModal').style.display = 'flex';
}

