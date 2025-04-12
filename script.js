let num1 = 5;
let num2 = 3;
let correctAnswer = num1 + num2;
let userAnswer = '';

const scoop = document.getElementById('scoop');
const correctSound = document.getElementById('correctSound');
const incorrectSound = document.getElementById('incorrectSound');
const submitButton = document.getElementById('submitButton');
const clearButton = document.getElementById('clearButton');
const answerDisplay = document.getElementById('answerDisplay');
const questionText = document.getElementById('question');

// Show the question
questionText.textContent = `${num1} + ${num2} = ?`;

function updateAnswerDisplay() {
  answerDisplay.textContent = userAnswer === '' ? '0' : userAnswer;
}

// Handle key presses
document.querySelectorAll('.key').forEach(key => {
  key.addEventListener('click', () => {
    const value = key.dataset.key;
    if (value !== undefined) {
      userAnswer += value;
      updateAnswerDisplay();
    }
  });
});

// Clear button
clearButton.addEventListener('click', () => {
  userAnswer = '';
  updateAnswerDisplay();
});

// Submit button
submitButton.addEventListener('click', () => {
  if (parseInt(userAnswer) === correctAnswer) {
    scoop.style.boxShadow = '0 0 20px #ff00cc, 0 0 40px #6600ff';
    correctSound.play().catch(e => console.log(e));
    setTimeout(() => {
      alert("Correct! Enjoy your snow cone!");
      userAnswer = '';
      updateAnswerDisplay();
    }, 500);
  } else {
    scoop.style.boxShadow = 'none';
    incorrectSound.play().catch(e => console.log(e));
    alert("Oops! Try again.");
  }
});
