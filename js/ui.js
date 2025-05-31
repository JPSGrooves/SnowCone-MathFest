// /js/ui.js

/**
 * Shows an element by ID
 */
function showEl(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'block';
}

/**
 * Hides an element by ID
 */
function hideEl(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

/**
 * Toggle visibility of an element
 */
function toggleEl(id) {
  const el = document.getElementById(id);
  if (el) {
    const isHidden = getComputedStyle(el).display === 'none';
    el.style.display = isHidden ? 'block' : 'none';
  }
}

/**
 * Replace content inside a container
 */
function setHTML(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

/**
 * Add a glow effect to an element
 */
function addGlow(id, color = 'white') {
  const el = document.getElementById(id);
  if (el) {
    el.style.filter = `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 12px ${color})`;
  }
}

// Expose utilities globally if needed
window.showEl = showEl;
window.hideEl = hideEl;
window.toggleEl = toggleEl;
window.setHTML = setHTML;
window.addGlow = addGlow;

