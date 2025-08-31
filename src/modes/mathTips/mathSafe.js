// /src/modes/mathTips/mathSafe.js
export const SAFE_EXPR = /^[\d\s+\-*/^().]+$/;

export function evalSafeExpression(expr){
  const raw=String(expr).trim();
  if(!raw || raw.length>120) throw new Error('Too long');
  if(!SAFE_EXPR.test(raw)) throw new Error('Unsafe chars');
  const js = raw.replaceAll('^','**');
  if (/[*\/+]{2,}/.test(js)) throw new Error('Bad operator seq');
  // eslint-disable-next-line no-new-func
  const v = Function(`"use strict"; return (${js});`)();
  if(!Number.isFinite(v)) throw new Error('Not finite');
  return v;
}

export function tryPercentOf(text){
  const m=/(-?\d+(?:\.\d+)?)\s*%\s*of\s*(-?\d+(?:\.\d+)?)/i.exec(text);
  if(!m) return null;
  const p=parseFloat(m[1]), n=parseFloat(m[2]);
  if(!Number.isFinite(p)||!Number.isFinite(n)) return null;
  return { p, n, ans:(p/100)*n };
}

export function gcd(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){[a,b]=[b,a%b];} return a||1; }
export function lcm(a,b){ return Math.abs(a*b)/gcd(a,b); }
export function simplifyFractionText(a,b){
  if(!Number.isFinite(a)||!Number.isFinite(b)||b===0) return "That fraction is undefined, amigo.";
  const g=gcd(a,b); return `${a}/${b} → ${a/g}/${b/g}`;
}
