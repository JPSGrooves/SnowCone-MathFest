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
  if (currentAnswer.length === 0 && num === 0 && correctAnswer !== 0) return; // prevent leading 0 unless 0 is correct answer
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
    scoop.classList.remove('pop');
    void scoop.offsetWidth; // re-trigger animation
    scoop.classList.add('pop');
    correctSound.play().catch(err => console.log(err));
    setTimeout(() => {
      alert("Correct!");
      loadNewQuestion();
    }, 600);
  } else {
    incorrectSound.play().catch(err => console.log(err));
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
