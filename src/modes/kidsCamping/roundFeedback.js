export function showRoundMessage(resultType) {
  const zone = document.querySelector('.kc-ant-zone');
  if (!zone) return;

  const msg = document.createElement('div');
  msg.classList.add('kc-round-msg');

  const messages = {
    good: 'Good Save! +4',
    great: 'Great Save! +5',
    perfect: 'Perfect Pull! +6',
    loss: 'Food Lost! +3',
    snowcone: 'You got the EGG! +10' // 🍧 new special message
  };

  msg.textContent = messages[resultType] || 'Unknown Result';
  msg.classList.add(resultType ? `${resultType}-save` : 'unknown');

  zone.appendChild(msg);
  requestAnimationFrame(() => msg.classList.add('visible'));
  setTimeout(() => {
    msg.classList.remove('visible');
    setTimeout(() => msg.remove(), 1000);
  }, 1500);
}
