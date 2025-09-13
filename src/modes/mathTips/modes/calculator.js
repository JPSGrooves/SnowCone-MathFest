const SAFE = /^[\d\s+\-*/^().]+$/;

function evalSafe(expr) {
  const raw = String(expr).trim();
  if (!raw || raw.length > 120) throw new Error('too long');
  if (!SAFE.test(raw)) throw new Error('unsafe chars');
  const js = raw.replaceAll('^', '**');
  if (/[*\/+]{2,}/.test(js)) throw new Error('bad ops');
  const val = Function(`"use strict";return(${js})`)();
  if (!Number.isFinite(val)) throw new Error('not finite');
  return val;
}

export function handle(text = '') {
  const p = /(-?\d+(?:\.\d+)?)\s*%\s*of\s*(-?\d+(?:\.\d+)?)/i.exec(text);
  if (p) {
    const ans = (parseFloat(p[1]) / 100) * parseFloat(p[2]);
    return { html: `<p>${p[1]}% of ${p[2]} = ${ans}</p>` };
  }
  try {
    const v = evalSafe(text);
    return { html: `<p>${text} = ${v}</p>` };
  } catch {
    return { html: `<p>Couldn’t parse. Try <code>15% of 80</code> or <code>(2+3)^3</code>.</p>` };
  }
}
