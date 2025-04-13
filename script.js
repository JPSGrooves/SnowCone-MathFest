// script.js - core game logic for Snowcone Math

let score = 0;
let currentAnswer = "";
let correctAnswer = 0;
let currentProblemType = "+";
let mode = "addsub";
let isMuted = false;
let timerStarted = false;
let secondsElapsed = 0;
let timerInterval = null;

const correctTrack = document.getElementById("correctSound");
const incorrectTrack = document.getElementById("incorrectSound");
correctTrack.volume = 0.5;
incorrectTrack.volume = 0.5;

function openStoryModeModal() {
  document.getElementById("storyModeModal").style.display = "flex";
}

function closeStoryModeModal() {
  document.getElementById("storyModeModal").style.display = "none";
}

function setMode(newMode) {
  mode = newMode;
  showScoop(() => generateProblem());
  checkMilestones();
}

function appendNumber(num) {
  currentAnswer += num;
  document.getElementById("answerDisplay").textContent = currentAnswer;
}

function appendDecimal() {
  if (!currentAnswer.includes(".")) {
    currentAnswer += (currentAnswer === "" ? "0." : ".");
    document.getElementById("answerDisplay").textContent = currentAnswer;
  }
}

function toggleNegative() {
  currentAnswer = currentAnswer.startsWith("-") ? currentAnswer.slice(1) : "-" + currentAnswer;
  document.getElementById("answerDisplay").textContent = currentAnswer;
}

function clearAnswer() {
  currentAnswer = "";
  document.getElementById("answerDisplay").textContent = "0";
}

function toggleMute() {
  isMuted = !isMuted;
  document.getElementById("backgroundMusic1").muted = isMuted;
  correctTrack.muted = isMuted;
  incorrectTrack.muted = isMuted;
}

function submitAnswer() {
  let userAnswer = parseFloat(currentAnswer);
  if (userAnswer === correctAnswer) {
    if (!timerStarted) {
      timerStarted = true;
      const music = document.getElementById("backgroundMusic1");
      music.currentTime = 0;
      music.play().catch(e => console.warn("Music play failed:", e));
      timerInterval = setInterval(() => {
        secondsElapsed++;
        document.getElementById("timer").textContent = `Time: ${secondsElapsed}s`;
        if (secondsElapsed >= 105) {
          clearInterval(timerInterval);
          alert(`🍧 Time's up! You scored ${score} points!`);
        }
      }, 1000);
    }

    if (!isMuted) {
      try {
        correctTrack.pause();
        correctTrack.currentTime = 0;
        correctTrack.play().catch(e => console.warn("Play failed", e));
      } catch (e) {
        console.warn("Error playing sound", e);
      }
    }

    score += (currentProblemType === "hard" ? 15 : (currentProblemType === "×" || currentProblemType === "÷" ? 6 : 3));
    document.getElementById("score").textContent = score;

    showScoop(() => {
      generateProblem();
      checkMilestones();
    });
  } else {
    if (!isMuted) {
      incorrectTrack.currentTime = 0;
      incorrectTrack.play();
    }
    score -= 3;
    document.getElementById("score").textContent = score;
    alert("Incorrect! Try again.");
    clearAnswer();
  }
}

function generateProblem() {
  let a, b, c, op1, op2;
  if (mode === "addsub") {
    a = Math.floor(Math.random() * 10);
    b = Math.floor(Math.random() * 10);
    op1 = Math.random() > 0.5 ? "+" : "-";
    if (op1 === "-" && b > a) [a, b] = [b, a];
    correctAnswer = op1 === "+" ? a + b : a - b;
    currentProblemType = op1;
    document.getElementById("problem").textContent = `${a} ${op1} ${b} = 🍧`;
  } else if (mode === "multdiv") {
    if (Math.random() > 0.5) {
      a = Math.floor(Math.random() * 10);
      b = Math.floor(Math.random() * 10);
      correctAnswer = a * b;
      currentProblemType = "×";
      document.getElementById("problem").textContent = `${a} × ${b} = 🍧`;
    } else {
      b = Math.floor(Math.random() * 9) + 1;
      correctAnswer = Math.floor(Math.random() * 10);
      a = b * correctAnswer;
      currentProblemType = "÷";
      document.getElementById("problem").textContent = `${a} ÷ ${b} = 🍧`;
    }
  } else if (mode === "hard") {
    a = Math.floor(Math.random() * 10);
    b = Math.floor(Math.random() * 10);
    c = Math.floor(Math.random() * 9) + 1;
    op1 = Math.random() > 0.5 ? "+" : "-";
    op2 = Math.random() > 0.5 ? "×" : "÷";
    let inner = op1 === "+" ? a + b : a - b;
    correctAnswer = op2 === "×" ? inner * c : Math.floor(inner / c);
    currentProblemType = "hard";
    document.getElementById("problem").textContent = `(${a} ${op1} ${b}) ${op2} ${c} = 🍧`;
  }
  currentAnswer = "";
  document.getElementById("answerDisplay").textContent = "0";
}

function resetScore() {
  score = 0;
  document.getElementById("score").textContent = "0";
  showScoop(() => generateProblem());
  checkMilestones();
}

function showScoop(callback) {
  const scoop = document.getElementById("scoop");
  scoop.style.display = "block";
  setTimeout(() => {
    scoop.style.display = "none";
    if (typeof callback === "function") {
      callback();
    }
  }, 700);
}

function checkMilestones() {
  if (score >= 50 && !window.fiftyTriggered) {
    window.fiftyTriggered = true;
    launchConfetti();
  }
  if (score >= 100 && !window.hundredTriggered) {
    window.hundredTriggered = true;
    document.getElementById("cone").style.boxShadow = "0 0 30px #ffee00, 0 0 60px #ff00cc";
    document.getElementById("gameContainer").classList.add("flash");
    setTimeout(() => document.getElementById("gameContainer").classList.remove("flash"), 600);
    alert("🍧 You hit 100 points! That's some serious math mojo!");
  }
}

function launchConfetti() {
  const canvas = document.getElementById("confettiCanvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  let confetti = [];
  for (let i = 0; i < 100; i++) {
    confetti.push({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      r: Math.random() * 6 + 4,
      d: Math.random() * 10 + 10,
      color: `hsl(${Math.random() * 360}, 100%, 50%)`,
      tilt: Math.floor(Math.random() * 10) - 10,
      tiltAngleIncremental: Math.random() * 0.07 + 0.05,
      tiltAngle: 0
    });
  }
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    confetti.forEach(c => {
      ctx.beginPath();
      ctx.lineWidth = c.r;
      ctx.strokeStyle = c.color;
      ctx.moveTo(c.x + c.tilt + c.r/2, c.y);
      ctx.lineTo(c.x + c.tilt, c.y + c.tilt + c.r/2);
      ctx.stroke();
    });
    update();
  }
  function update() {
    for (let i = 0; i < confetti.length; i++) {
      confetti[i].tiltAngle += confetti[i].tiltAngleIncremental;
      confetti[i].y += (Math.cos(0.01 + confetti[i].d) + 3 + confetti[i].r/2) / 2;
      confetti[i].x += Math.sin(0.01);
      confetti[i].tilt = Math.sin(confetti[i].tiltAngle - (i/3)) * 15;
    }
  }
  (function loop() {
    draw();
    requestAnimationFrame(loop);
  })();
}

window.onload = () => {
  showScoop(() => generateProblem());
};
