// modal.js — Cosmic Modal Core Logic

function openCosmicModal() {
  document.getElementById('cosmicModal')?.classList.remove('hidden');
}

function closeCosmicModal() {
  document.getElementById('cosmicModal')?.classList.add('hidden');
}

function setupModalUI() {
  // 🔒 Close Button
  document.querySelector('.close-modal')?.addEventListener('click', closeCosmicModal);

  // 🔄 Tab Switching
  document.querySelectorAll('.tab-header button').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      document.querySelectorAll('.tab-header button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
      document.getElementById(`tab-${tab}`)?.classList.remove('hidden');
    });
  });
}

window.openCosmicModal = openCosmicModal;
window.closeCosmicModal = closeCosmicModal;
window.setupModalUI = setupModalUI;
