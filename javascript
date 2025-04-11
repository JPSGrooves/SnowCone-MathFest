// Math problems
const problems = [
    { question: "3 + 2", answer: 5 },
    { question: "4 + 6", answer: 10 },
    { question: "7 - 3", answer: 4 },
    { question: "8 - 5", answer: 3 },
    { question: "2 * 3", answer: 6 },
];

// Pick a random problem
let currentProblem = problems[Math.floor(Math.random() * problems.length)];

document.getElementById("math-problem").textContent = currentProblem.question;

// Function to check the answer
function checkAnswer() {
    const userAnswer = parseInt(document.getElementById("answer-input").value);
    const resultMessage = document.getElementById("result-message");
    const cone = document.getElementById("cone");
    
    if (userAnswer === currentProblem.answer) {
        resultMessage.textContent = "Correct! You've built the snow cone!";
        cone.style.backgroundColor = "#81c784"; // Greenish for a good snow cone
    } else {
        resultMessage.textContent = "Oops! Try again!";
        cone.style.backgroundColor = "#f44336"; // Red for incorrect
    }
    
    // Pick a new problem after checking the answer
    setTimeout(() => {
        currentProblem = problems[Math.floor(Math.random() * problems.length)];
        document.getElementById("math-problem").textContent = currentProblem.question;
        document.getElementById("answer-input").value = "";
    }, 1000);
}
