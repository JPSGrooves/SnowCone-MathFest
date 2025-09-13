export function handle(text = '') {
  const t = text.toLowerCase();
  if (t.includes('quesadilla')) {
    return { html: `<p>Quesadilla wisdom: low heat, patience, flip once, rest 60s. Math fuel.</p>` };
  }
  if (t.includes('snowcone') || t.includes('mango')) {
    return { html: `<p>Mango snowcone: shave ice fine, mango puree + pinch of lime + tiny salt. Stir, vibe.</p>` };
  }
  return { html: `<p>Recipes booth: try <code>quesadilla wisdom</code> or <code>mango snowcone mode</code>.</p>` };
}
