let isTransitioning = false;

export function playTransition(callback) {
  if (isTransitioning) return;
  isTransitioning = true;

  // 🔍 Check if the transition overlay already exists
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
  const starfield = transition.querySelector('.starfield');

  if (!truck || !cone || !starfield) {
    console.error('🚨 Transition elements not found!');
    isTransitioning = false;
    return;
  }

  // 🌀 Reset transform positions
  truck.style.transition = 'none';
  cone.style.transition = 'none';
  truck.style.transform = 'translateX(-150%)';
  cone.style.transform = 'translateX(150%)';

  // ✨ Activate the overlay
  transition.classList.add('active');

  // ✅ Force reflow before starting animation
  void truck.offsetWidth;

  // 🏎️ Animate
  truck.style.transition = 'transform 0.8s ease-out';
  cone.style.transition = 'transform 0.8s ease-out 0.5s';
  truck.style.transform = 'translateX(150vw)';
  cone.style.transform = 'translateX(-150vw)';



  // ⏱️ After animations, trigger the scene
  setTimeout(() => {
    transition.classList.remove('active');
    isTransitioning = false;
    callback?.();
  }, 1400);
}
