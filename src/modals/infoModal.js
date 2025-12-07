// 🧊 Import styles FIRST so Vite injects them early
import './infoModal.css';

// 🧊 Info Modal Controls
function openInfoModal() {
  const modal = document.getElementById('infoModal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  }
}

function closeInfoModal() {
  const modal = document.getElementById('infoModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
}

// ✅ DOM Ready check to make sure title exists before binding
document.addEventListener('DOMContentLoaded', () => {
  const title = document.querySelector('.menu-title-top');
  if (!title) {
    console.warn('⚠️ .menu-title-top not found!');
  } else {
    console.log('🎯 Title found. Binding click.');
    title.addEventListener('click', () => {
      console.log('🎯 Title click detected');
      openInfoModal();
    });
  }

  // 🕳 Outside-click-to-close for Info Modal
  const modal = document.getElementById('infoModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      // Only close if you click directly on the overlay background,
      // not on inner content.
      if (e.target === modal) {
        console.log('🕳 Info modal background clicked – closing');
        closeInfoModal();
      }
    });
  }
});

// Escape key closes modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeInfoModal();
});

console.log('🍧 infoModal.js loaded');

// 🔓 Optional: expose globally
window.openInfoModal = openInfoModal;
window.closeInfoModal = closeInfoModal;
