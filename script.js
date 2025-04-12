// Math question variables
let num1 = 5;
let num2 = 3;
let correctAnswer = num1 + num2;
let userAnswer = ''; // Keep track of the user's input

// Get DOM elements
const scoop = document.getElementById('scoop');
const questionBox = document.getElementById('questionBox');
const correctSound = document.getElementById('correctSound');
const incorrectSound = document.getElementById('incorrectSound');
const submitButton = document.getElementById('submitButton');
const clearButton = document.getElementById('keyClear');
const keypadButtons = document.querySelectorAll('.key');
const answerDisplay = document.createElement('div');  // To display current input
questionBox.appendChild(answerDisplay);

// Handle button presses on the keypad
keypadButtons.forEach(button => {
  button.addEventListener('click', (e) => {
    const value = e.target.innerText;

    if (value === 'Clear') {
      userAnswer = ''; // Clear the answer
      answerDisplay.textContent = ''; // Update the display
    } else {
      userAnswer += value; // Append the pressed number to the answer
      answerDisplay.textContent = userAnswer; // Update the display
    }
  });
});

// Check if the answer is correct
function checkAnswer() {
  const userAnswerParsed = parseInt(userAnswer);

  if (userAnswerParsed === correctAnswer) {
    scoop.style.boxShadow = '0 0 20px #ff00cc, 0 0 40px #6600ff'; // Glow effect on correct answer
    correctSound.play().catch(error => console.log('Audio error: ', error)); // Play the correct sound
    setTimeout(() => {
      alert("Correct! Enjoy your snow cone!");
    }, 500); // After a short delay, show the correct message
  } else {
    scoop.style.boxShadow = 'none'; // Reset glow on wrong answer
    incorrectSound.play().catch(error => console.log('Audio error: ', error)); // Play the incorrect sound
    alert("Oops! Try again.");
  }

  // Clear input after submit
  userAnswer = '';
  answerDisplay.textContent = ''; // Reset the display
}

// Add event listener for submit button
submitButton.addEventListener('click', checkAnswer);
