// modal.js — Cosmic Modal Core Logic

function openCosmicModal() {
  document.getElementById('cosmicModal')?.classList.remove('hidden');
}

function closeCosmicModal() {
  document.getElementById('cosmicModal')?.classList.add('hidden');
}

function setupModalUI() {
  const closeModalBtn = document.querySelector('.close-modal');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeCosmicModal);
  }

  const tabButtons = document.querySelectorAll('.tab-header button');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');

      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
      });

      document.getElementById(`tab-${tab}`)?.classList.remove('hidden');
    });
  });
}



window.openCosmicModal = openCosmicModal;
window.closeCosmicModal = closeCosmicModal;
window.setupModalUI = setupModalUI;
