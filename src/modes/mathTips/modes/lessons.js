// Simple lessons booth — lightweight help + tiny demos

function menu() {
  return `
    <div class="mt-lecture-card">
      <h3>Lessons Menu</h3>
      <ul class="mt-lecture-bullets">
        <li>fractions — try: <code>simplify 12/18</code></li>
        <li>percent — try: <code>25% of 40</code></li>
        <li>equations — ask about <code>y = mx + b</code></li>
      </ul>
      <div class="mt-lecture-foot mt-dim">Say: fractions · percent · equations</div>
    </div>
  `;
}

export function handle(text = '', _ctx = {}) {
  const t = String(text).toLowerCase().trim();
  if (!t || t === 'help' || t === 'menu') {
    return { html: menu() };
  }

  // tiny fraction simplifier
  const simp = /simplify\s+(-?\d+)\s*\/\s*(-?\d+)/i.exec(t);
  if (simp) {
    const a = Math.abs(parseInt(simp[1], 10));
    const b = Math.abs(parseInt(simp[2], 10));
    const g = ((x, y) => { while (y) [x, y] = [y, x % y]; return x || 1; })(a, b);
    return { html: `<p>${a}/${b} → ${a/g}/${b/g}</p>` };
  }

  // tiny percent helper
  const p = /(-?\d+(?:\.\d+)?)\s*%\s*of\s*(-?\d+(?:\.\d+)?)/i.exec(t);
  if (p) {
    const ans = (parseFloat(p[1]) / 100) * parseFloat(p[2]);
    return { html: `<p>${p[1]}% of ${p[2]} = ${ans}</p>` };
  }

  if (/\bequations?\b/.test(t)) {
    return { html: `<p>Equations basics: <code>y = mx + b</code> (slope-intercept). Ask about slope or intercept!</p>` };
  }

  if (/\bfractions?\b/.test(t) || /\bpercent\b/.test(t)) {
    return { html: menu() };
  }

  return { html: `<p>Lessons booth didn’t catch that. Try: <code>simplify 12/18</code> or <code>25% of 40</code> or say <code>menu</code>.</p>` };
}
