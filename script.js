let num1 = 5;
let num2 = 3;
let correctAnswer = num1 + num2;
let currentAnswer = [];

const scoop = document.getElementById('scoop');
const question = document.getElementById('question');
const answerDisplay = document.getElementById('answerDisplay');
const correctSound = document.getElementById('correctSound');
const incorrectSound = document.getElementById('incorrectSound');

function appendNumber(num) {
  if (currentAnswer.length === 0 && num === 0 && correctAnswer !== 0) return; // Prevent leading 0 unless correct answer is 0
  currentAnswer.push(num);
  updateDisplay();
}

function clearAnswer() {
  currentAnswer = [];
  updateDisplay();
}

function updateDisplay() {
  if (currentAnswer.length === 0) {
    answerDisplay.textContent = "0";
  } else {
    answerDisplay.textContent = currentAnswer.join('');
  }
}

function checkAnswer() {
  const userAnswer = parseInt(currentAnswer.join("") || "0", 10);

  if (userAnswer === correctAnswer) {
    scoop.style.display = 'block';
    scoop.style.boxShadow = '0 0 20px #ff00cc, 0 0 40px #6600ff';
    correctSound.play().catch(err => console.log('Audio error:', err));
    setTimeout(() => {
      alert("Correct! Enjoy your snow cone!");
      loadNewQuestion();
    }, 500);
  } else {
    incorrectSound.play().catch(err => console.log('Audio error:', err));
    alert("Oops! Try again.");
    clearAnswer();
  }
}

function loadNewQuestion() {
  scoop.style.display = 'none';
  num1 = Math.floor(Math.random() * 10);
  num2 = Math.floor(Math.random() * 10);
  correctAnswer = num1 + num2;
  question.textContent = `${num1} + ${num2} = ?`;
  clearAnswer();
}

loadNewQuestion();
