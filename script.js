function submitAnswer() {
  const input = document.getElementById('answerInput').value.trim();
  const snowCone = document.getElementById('snowCone');
  const hand = document.getElementById('neonHand');

  // Simple test: the answer must be "8"
  if (input === "8") {
    // Correct: turn cone on, hand slides in
    snowCone.classList.remove('dark');
    hand.classList.add('slide-in');

    setTimeout(() => {
      // Slide hand and cone out
      snowCone.style.opacity = 0;
      hand.style.left = '400px';

      setTimeout(() => {
        // Reset
        snowCone.style.opacity = 1;
        snowCone.classList.remove('dark');
        hand.classList.remove('slide-in');
        hand.style.left = '-200px';
        document.getElementById('answerInput').value = '';
      }, 1000);
    }, 800);
  } else {
    // Incorrect: darken cone
    snowCone.classList.add('dark');
  }
}
