// Math question variables
let num1 = 5;
let num2 = 3;
let correctAnswer = num1 + num2;
let userAnswer = '';

// Get DOM elements
const scoop = document.getElementById('scoop');
const correctSound = document.getElementById('correctSound');
const incorrectSound = document.getElementById('incorrectSound');
const submitButton = document.getElementById('submitButton');
const questionBox = document.getElementById('questionBox');

// Listen to keypad button clicks
const keys = document.querySelectorAll('.key');
keys.forEach((key) => {
  key.addEventListener('click', () => {
    userAnswer += key.dataset.key;
    document.getElementById('question').textContent = userAnswer;
  });
});

// Check the answer when the submit button is clicked
function checkAnswer() {
  if (parseInt(userAnswer) === correctAnswer) {
    scoop.style.boxShadow = '0 0 20px #ff00cc, 0 0 40px #6600ff'; // Glow effect on correct answer
    correctSound.play().catch(error => console.log('Audio error: ', error)); // Play the correct guitar sound
    setTimeout(() => {
      alert("Correct! Enjoy your snow cone!");
      userAnswer = '';  // Reset answer
      document.getElementById('question').textContent = '5 + 3 = ?'; // Reset question
    }, 500);
  } else {
    scoop.style.boxShadow = 'none'; // Reset glow on wrong answer
    incorrectSound.play().catch(error => console.log('Audio error: ', error)); // Play the incorrect guitar sound
    alert("Oops! Try again.");
  }
}

// Add event listener to play sound on button click
submitButton.addEventListener('click', function() {
  checkAnswer();
});
