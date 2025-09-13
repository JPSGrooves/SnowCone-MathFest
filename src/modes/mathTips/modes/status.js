// Minimal status booth + helper used by older code
export function renderBoothsHelp() {
  return `
    <ul class="mt-menu">
      <li>lessons booth</li>
      <li>quiz booth</li>
      <li>lore booth</li>
      <li>recipes booth</li>
      <li>calculator booth</li>
    </ul>
  `;
}

export function handle() {
  return {
    html: `<div class="mt-response-card"><p>Status booth: badges coming soon. ${renderBoothsHelp()}</p></div>`
  };
}
