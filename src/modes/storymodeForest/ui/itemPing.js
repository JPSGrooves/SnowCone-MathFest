// /src/modes/storyMode/ui/itemPing.js
export function pingItem({ emoji = '✨', name = 'Item', qty = 1 } = {}) {
  const root = document.body; // fixed toast
  if (!root) return;

  // reuse a single node if one is already mid-flight
  const el = document.createElement('div');
  el.className = 'sm-item-ping';
  el.innerHTML = `
    <span class="sm-item-ping__emoji">${String(emoji)}</span>
    <span class="sm-item-ping__text">${String(name)}${
      qty > 1 ? ` <span class="sm-item-ping__qty">×${qty}</span>` : ''
    }</span>
  `;
  root.appendChild(el);

  // auto-remove after animation
  const kill = () => el.remove();
  el.addEventListener('animationend', kill, { once: true });
  setTimeout(kill, 1200); // safety

  // bag pulse
  const bag = document.getElementById('smInv');
  if (bag) {
    bag.classList.add('is-pulsing');
    setTimeout(() => bag.classList.remove('is-pulsing'), 900);
  }
}
