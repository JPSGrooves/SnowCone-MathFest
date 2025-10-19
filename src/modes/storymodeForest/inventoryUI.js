// inventoryUI.js
import { appState } from '../../data/appState.js';

export function mountInventoryButton(rootEl){
  // create button in bottom bar if absent
  let btn = rootEl.querySelector('#smInv');
  if (!btn) {
    const bar = rootEl.querySelector('.sm-bottom-bar');
    if (!bar) return; // nothing to do
    btn = document.createElement('button');
    btn.id = 'smInv';
    btn.className = 'sm-square-btn';
    btn.textContent = '👜';
    btn.style.justifySelf = 'center';
    bar.appendChild(btn);
  }
}

export function toggleInventorySheet(){
  let sheet = document.querySelector('.sm-inventory-sheet');
  if (sheet){ sheet.remove(); return; }

  sheet = document.createElement('div');
  sheet.className = 'sm-inventory-sheet';
  sheet.innerHTML = `
    <div class="sm-inv-head">
      <div class="sm-inv-title">Inventory</div>
      <div class="sm-inv-cash">${appState.getCurrency()} ${' ' + (appState.purse?.label || 'Scrip')}</div>
    </div>
    <div class="sm-inventory-grid">
      ${appState.listItems().map(it=>`
        <button class="sm-item" data-id="${it.id}">
          <span class="sm-item-emoji">${it.meta?.emoji ?? '📦'}</span>
          <span class="sm-item-name">${it.name}</span>
          ${it.qty>1 ? `<span class="sm-item-qty">×${it.qty}</span>`:``}
        </button>
      `).join('') || `<div class="sm-empty">You’ve got pockets, but no treasures yet.</div>`}
    </div>`;
  document.body.appendChild(sheet);
  sheet.addEventListener('click', e=>{
    if (e.target.classList.contains('sm-inventory-sheet')) sheet.remove();
  }, { once: true });
}

export function renderCurrencyChip(rootEl, label='Scrip'){
  let chip = rootEl.querySelector('#smCash');
  if (!chip) {
    const bar = rootEl.querySelector('.sm-bottom-bar');
    if (!bar) return;
    chip = document.createElement('div');
    chip.id = 'smCash';
    chip.className = 'sm-cash-chip';
    bar.insertBefore(chip, bar.firstChild);
  }
  chip.textContent = `${appState.getCurrency()} ${label}`;
}
