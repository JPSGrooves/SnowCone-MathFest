import { appState } from '../data/appState.js';

let isTransitioning = false;

export function playTransition(callback) {
  if (isTransitioning) return;
  isTransitioning = true;
  appState.uiState.transitioning = true; // 🧠 MobX-aware flag

  let transition = document.getElementById('scene-transition');
  if (!transition) {
    transition = document.createElement('div');
    transition.id = 'scene-transition';
    const base = import.meta.env.BASE_URL;

    transition.innerHTML = `
      <img class="starfield" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:1; animation:fade-in 0.25s ease-in;" src="${base}assets/img/transitions/transitionStars.png" />
      <img class="transition-truck" src="${base}assets/img/transitions/snowConeTruck.png" alt="Truck" />
      <img class="transition-cone" src="${base}assets/img/transitions/snowCone.png" alt="Snow Cone" />
    `;

    document.body.appendChild(transition);
  }

  const truck = transition.querySelector('.transition-truck');
  const cone = transition.querySelector('.transition-cone');

  if (!truck || !cone) {
    console.error('🚨 Transition elements not found!');
    isTransitioning = false;
    appState.uiState.transitioning = false;
    return;
  }

  // Reset transform positions
  truck.style.transition = 'none';
  cone.style.transition = 'none';
  truck.style.transform = 'translateX(-150%)';
  cone.style.transform = 'translateX(150%)';

  transition.classList.add('active');

  // Force reflow to restart animation
  void truck.offsetWidth;

  truck.style.transition = 'transform 0.8s ease-out';
  cone.style.transition = 'transform 0.8s ease-out 0.5s';
  truck.style.transform = 'translateX(150vw)';
  cone.style.transform = 'translateX(-150vw)';

  setTimeout(() => {
    transition.classList.remove('active');
    isTransitioning = false;
    appState.uiState.transitioning = false; // ✅ MobX update
    callback?.();
  }, 1400);
}
