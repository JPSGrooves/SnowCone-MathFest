import confetti from 'canvas-confetti';

export function launchConfetti() {
  confetti({
    particleCount: 40,       // 🍃 Way fewer particles
    spread: 50,              // 🌈 Moderate spread
    origin: { y: 0.6 },
    scalar: 0.9,             // 🔬 Smaller particles
    ticks: 120               // ⏳ Slower decay
  });
}
