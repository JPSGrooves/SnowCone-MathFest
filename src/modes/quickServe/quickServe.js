import './quickServe.css'; // 🍦 QuickServe styles
import { swapModeBackground, applyBackgroundTheme } from '../../managers/backgroundManager.js';
import { playTransition } from '../../managers/transitionManager.js';
import { appState } from '../../data/appState.js';

export function loadQuickServe() {
  console.log("🍧 Loading QuickServe Mode");

  appState.stats.quickServe.sessions++;

  const menuWrapper = document.querySelector('.menu-wrapper');
  const gameContainer = document.getElementById('game-container');

  menuWrapper?.classList.add('hidden');

  gameContainer.classList.remove('hidden');
  gameContainer.style.display = 'flex';

  gameContainer.innerHTML = `
    <div class="game-frame">
      <img id="modeBackground" class="background-fill" src="assets/img/modes/quickServe/quickserveBG.png" alt="QuickServe Background" loading="eager" />
      <div class="qs-grid">
        <div class="qs-header">
          <h1>🍧 QuickServe Pavilion</h1>
        </div>
        <div class="qs-content">
          <div class="score-box">
            <span>Score: </span><span id="qsScore">0</span>
          </div>

          <div class="math-stack">
            <span id="mathProblem">12 + 7 = ?</span>
            <input id="mathInput" type="number" placeholder="Answer..." />
            <button id="submitAnswer">✔️ Submit</button>
          </div>

          <div class="cone-status">
            <span id="coneResultMsg"></span>
          </div>
        </div>

        <div class="qs-footer">
          <button id="returnToMenu" class="btn-return">💙 Return to Menu</button>
        </div>
      </div>
    </div>
  `;

  requestAnimationFrame(() => {
    setTimeout(() => {
      const img = document.getElementById('modeBackground');
      if (img) {
        img.src = img.src; // force repaint
        img.style.pointerEvents = 'none';
        console.log('🤊 Forced mobile refresh + pointer fix');
      }
    }, 10);
  });

  const returnBtn = document.getElementById('returnToMenu');
  returnBtn?.addEventListener('click', () => {
    playTransition(() => {
      gameContainer.classList.add('hidden');
      gameContainer.innerHTML = '';
      menuWrapper?.classList.remove('hidden');
      requestAnimationFrame(() => {
        applyBackgroundTheme();
      });
    });
  });

  // 🧮 Mini game logic
  let score = 0;

  const problemEl = document.getElementById('mathProblem');
  const inputEl = document.getElementById('mathInput');
  const submitBtn = document.getElementById('submitAnswer');
  const scoreDisplay = document.getElementById('qsScore');
  const resultMsg = document.getElementById('coneResultMsg');

  function newProblem() {
    const a = Math.floor(Math.random() * 20) + 1;
    const b = Math.floor(Math.random() * 20) + 1;
    problemEl.textContent = `${a} + ${b} = ?`;
    problemEl.dataset.answer = a + b;
    inputEl.value = '';
    inputEl.focus();
  }

  function submitAnswer() {
    const guess = parseInt(inputEl.value.trim(), 10);
    const correct = parseInt(problemEl.dataset.answer, 10);

    if (guess === correct) {
      score += 1;
      scoreDisplay.textContent = score;
      appState.addXP(3); // 🧠 XP via MobX
      resultMsg.textContent = '✅ Nice! +3 XP';
      resultMsg.style.color = '#00ffee';

      if (appState.profile.xp >= 100 && !appState.profile.badges.includes('cone_master')) {
        appState.unlockBadge('cone_master');
        console.log('🏅 Badge unlocked: cone_master');
      }

      setTimeout(() => resultMsg.textContent = '', 1500);
      newProblem();
    } else {
      resultMsg.textContent = '❌ Try again!';
      resultMsg.style.color = '#ff5555';
      setTimeout(() => resultMsg.textContent = '', 1500);
    }
  }

  submitBtn?.addEventListener('click', submitAnswer);
  inputEl?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitAnswer();
  });

  newProblem(); // 🧠 Fire up first problem
}
