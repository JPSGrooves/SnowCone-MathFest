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

  const resizeAndLock = () => {
    const rect = bgImg.getBoundingClientRect();

    // You can adjust this value as needed for visual usability
    const minHeight = 600;
    const height = Math.max(rect.height, minHeight);
    const width = rect.width;

    grid.style.height = `${height}px`;
    grid.style.width = `${width}px`;
  };

  resizeAndLock(); // Initial sizing

  // 👁 Use ResizeObserver to track size changes more precisely
  const observer = new ResizeObserver(resizeAndLock);
  observer.observe(bgImg);

  // 👂 Also fall back to window resize for edge cases
  window.addEventListener("resize", resizeAndLock);
}

let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallLabel();
});

function isIOS() {
  return /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
}

function showInstallLabel() {
  const label = document.querySelector('.menu-label.install');
  if (label) label.style.display = 'flex';
}

function handleInstallClick() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choice) => {
      if (choice.outcome === 'accepted') console.log('Installed 🎉');
      deferredPrompt = null;
    });
  } else if (isIOS()) {
    alert("To install on iPhone:\n1. Tap the Share icon (⬆️)\n2. Choose 'Add to Home Screen'");
  } else {
    alert("Install not supported on this browser.");
  }
}

window.handleInstallClick = handleInstallClick;

