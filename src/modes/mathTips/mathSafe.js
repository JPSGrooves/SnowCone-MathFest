// /src/modes/mathTips/mathSafe.js
// Math-safe helpers + "wordy" number/fraction normalizers.
// Keep this file dependency-free and importable from anywhere in MathTips.

// ──────────────────────────────────────────────────────────────────────────────
// Safety-gated arithmetic
// ──────────────────────────────────────────────────────────────────────────────
export const SAFE_EXPR = /^[\d\s+\-*/^().]+$/;

export function evalSafeExpression(expr){
  const raw = String(expr).trim();
  if (!raw || raw.length > 120) throw new Error('Too long');
  if (!SAFE_EXPR.test(raw)) throw new Error('Unsafe chars');
  const js = raw.replaceAll('^','**');
  if (/[*\/+]{2,}/.test(js)) throw new Error('Bad operator seq');
  // eslint-disable-next-line no-new-func
  const v = Function(`"use strict"; return (${js});`)();
  if (!Number.isFinite(v)) throw new Error('Not finite');
  return v;
}

export function tryPercentOf(text){
  const m = /(-?\d+(?:\.\d+)?)\s*%\s*of\s*(-?\d+(?:\.\d+)?)/i.exec(text);
  if (!m) return null;
  const p = parseFloat(m[1]), n = parseFloat(m[2]);
  if (!Number.isFinite(p) || !Number.isFinite(n)) return null;
  return { p, n, ans: (p/100)*n };
}

// ──────────────────────────────────────────────────────────────────────────────
export function gcd(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){ [a,b]=[b,a%b]; } return a||1; }
export function lcm(a,b){ return Math.abs(a*b)/gcd(a,b); }

export function simplifyFractionText(a,b){
  if(!Number.isFinite(a)||!Number.isFinite(b)||b===0) return "That fraction is undefined, amigo.";
  const g=gcd(a,b); return `${a}/${b} → ${a/g}/${b/g}`;
}

// ──────────────────────────────────────────────────────────────────────────────
// Fraction core (parsing + ops)
// ──────────────────────────────────────────────────────────────────────────────

// Parse tokens like:
//   "1/2", " 3 / 5 ", "2 3/4" (mixed), "-7/3", "0.75", "75%"
// Returns { n, d } with d>0 (sign on numerator).
export function parseLooseFraction(tokenRaw) {
  const s = String(tokenRaw).trim();

  // percent → decimal → fraction
  if (/^-?\d+(\.\d+)?%$/.test(s)) {
    const p = parseFloat(s.replace('%',''));
    return decimalToFraction(p / 100);
  }

  // decimal → fraction
  if (/^-?\d+\.\d+$/.test(s)) {
    return decimalToFraction(parseFloat(s));
  }

  // mixed number "a b/c"
  const mixed = s.match(/^(-?\d+)\s+(-?\d+)\s*\/\s*(-?\d+)$/);
  if (mixed) {
    const whole = parseInt(mixed[1], 10);
    const num   = parseInt(mixed[2], 10);
    const den   = parseInt(mixed[3], 10);
    if (!Number.isFinite(whole) || !Number.isFinite(num) || !Number.isFinite(den) || den === 0) {
      throw new Error('Bad mixed number.');
    }
    const sign = whole < 0 ? -1 : 1;
    const n = (Math.abs(whole) * Math.abs(den) + Math.abs(num)) * sign;
    return simplifyFraction(sign * n, Math.abs(den));
  }

  // simple fraction "a/b"
  const frac = s.match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
  if (frac) {
    const a = parseInt(frac[1], 10);
    const b = parseInt(frac[2], 10);
    if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) throw new Error('Bad fraction.');
    return simplifyFraction(a, b);
  }

  // integer
  if (/^-?\d+$/.test(s)) {
    return { n: parseInt(s, 10), d: 1 };
  }

  throw new Error('Could not parse number.');
}

export function decimalToFraction(x) {
  if (!Number.isFinite(x)) throw new Error('Bad decimal.');
  const neg = x < 0 ? -1 : 1;
  const abs = Math.abs(x);
  if (Number.isInteger(abs)) return { n: neg * abs, d: 1 };

  // scale by power of 10
  const s = String(abs);
  const dec = (s.split('.')[1] || '').length;
  const den = 10 ** dec;
  const num = Math.round(abs * den);
  return simplifyFraction(neg * num, den);
}

export function simplifyFraction(n, d) {
  if (d === 0) throw new Error('Zero denominator.');
  const sign = d < 0 ? -1 : 1;
  n *= sign; d *= sign;
  const g = gcd(Math.abs(n), Math.abs(d));
  return { n: n / g, d: d / g };
}

export function addFrac(a, b) {
  const n = a.n * b.d + b.n * a.d;
  const d = a.d * b.d;
  return simplifyFraction(n, d);
}
export function subFrac(a, b) {
  const n = a.n * b.d - b.n * a.d;
  const d = a.d * b.d;
  return simplifyFraction(n, d);
}
export function mulFrac(a, b) {
  const n = a.n * b.n;
  const d = a.d * b.d;
  return simplifyFraction(n, d);
}
export function divFrac(a, b) {
  if (b.n === 0) throw new Error('Division by zero.');
  const n = a.n * b.d;
  const d = a.d * b.n;
  return simplifyFraction(n, d);
}

export function toMixedString({ n, d }) {
  const sign = n < 0 ? -1 : 1;
  const A = Math.abs(n);
  const whole = Math.floor(A / d);
  const rem = A % d;
  if (rem === 0) return String(sign * whole);
  const frac = `${rem}/${d}`;
  return whole ? `${sign * whole} ${frac}` : (sign < 0 ? `-${frac}` : frac);
}

export function toSimpleString({ n, d }) {
  if (d === 1) return String(n);
  return `${n}/${d}`;
}

// ──────────────────────────────────────────────────────────────────────────────
// 🗣️ Number-word & wordy-fraction normalizers
//   - We export three helpers:
//       1) normalizeNumberWordFractions(text)   → "one half" → "1/2"
//       2) normalizeNumberWords(text)           → "ten" → "10", "a hundred" → "100"
//       3) normalizeWordsAndFractions(text)     → fraction-first, then numbers
// ──────────────────────────────────────────────────────────────────────────────

// ——— numerators we’ll accept in "wordy fraction" phrases
const WORD_NUM = {
  'a':1,'an':1,
  'one':1,'two':2,'three':3,'four':4,'five':5,'six':6,'seven':7,'eight':8,'nine':9,'ten':10,
  'eleven':11,'twelve':12,'thirteen':13,'fourteen':14,'fifteen':15,'sixteen':16,'seventeen':17,'eighteen':18,'nineteen':19
};

// ——— denominators ("third(s)"→3, "quarters/fourths"→4, … up to twelfth)
const DENOM = {
  'half':2,'halves':2,
  'third':3,'thirds':3,
  'quarter':4,'quarters':4,'fourth':4,'fourths':4,
  'fifth':5,'fifths':5,'sixth':6,'sixths':6,'seventh':7,'sevenths':7,'eighth':8,'eighths':8,
  'ninth':9,'ninths':9,'tenth':10,'tenths':10,'eleventh':11,'elevenths':11,'twelfth':12,'twelfths':12
};

// e.g. "two-thirds", "two thirds", "a half", "three quarters"
const WORDY_FRAC_RE = new RegExp(
  String.raw`\b(a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen)[\s-]+(halves|half|thirds|third|quarters|quarter|fourths|fourth|fifths|fifth|sixths|sixth|sevenths|seventh|eighths|eighth|ninths|ninth|tenths|tenth|elevenths|eleventh|twelfths|twelfth)\b`,
  'gi'
);

// Mixed wordy: "two and three quarters" → "2 3/4", "one and a half" → "1 1/2"
const WORDY_MIXED_RE = new RegExp(
  String.raw`\b(a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen)\s+and\s+(a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen)[\s-]+(halves|half|thirds|third|quarters|quarter|fourths|fourth|fifths|fifth|sixths|sixth|sevenths|seventh|eighths|eighth|ninths|ninth|tenths|tenth|elevenths|eleventh|twelfths|twelfth)\b`,
  'gi'
);

function _numBase(word) {
  return WORD_NUM[String(word).toLowerCase()] ?? null;
}
function _denBase(word) {
  return DENOM[String(word).toLowerCase()] ?? null;
}

// Replace wordy mixed numbers first, then simple wordy fractions
export function normalizeNumberWordFractions(text) {
  if (!text || !text.replace) return text;

  // Mixed: "X and Y <denom>" → "X Y/D"
  let out = text.replace(WORDY_MIXED_RE, (_, wWhole, wNum, wDen) => {
    const whole = _numBase(wWhole);
    const n = _numBase(wNum);
    const d = _denBase(wDen);
    if (!whole || !n || !d) return `${wWhole} and ${wNum} ${wDen}`;
    return `${whole} ${n}/${d}`;
  });

  // Simple: "N <denom>" → "N/D"
  out = out.replace(WORDY_FRAC_RE, (_, wNum, wDen) => {
    const n = _numBase(wNum);
    const d = _denBase(wDen);
    if (!n || !d) return `${wNum} ${wDen}`;
    return `${n}/${d}`;
  });

  return out;
}

// Number words → digits (conservative English cardinals up to thousands)
const WORD_UNITS = {
  'zero':0,'one':1,'two':2,'three':3,'four':4,'five':5,'six':6,'seven':7,'eight':8,'nine':9,
  'ten':10,'eleven':11,'twelve':12,'thirteen':13,'fourteen':14,'fifteen':15,'sixteen':16,
  'seventeen':17,'eighteen':18,'nineteen':19
};
const WORD_TENS = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90
};

const WORD_SCALES = { 'hundred':100, 'thousand':1000 };

// Match runs of number-ish words (hyphens/spaces)
const NUMBER_WORD_SEQ = new RegExp(
  String.raw`\b(?:a|an|and|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand)(?:[\s-]+(?:a|an|and|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand))*\b`,
  'gi'
);

function wordsToNumber(seq) {
  const parts = seq.toLowerCase().split(/[\s-]+/).filter(Boolean);
  let total = 0, current = 0, seen = false;

  for (let i = 0; i < parts.length; i++) {
    const w = parts[i];
    if (w === 'and') continue;

    if (w === 'a' || w === 'an') {
      // treat as 1 if it precedes a scale or unit
      const next = parts[i+1];
      if (next && (WORD_SCALES[next] || WORD_UNITS[next] != null || WORD_TENS[next] != null)) {
        current += 1; seen = true;
      } else {
        return null; // dangling "a"
      }
      continue;
    }

    if (w in WORD_UNITS) { current += WORD_UNITS[w]; seen = true; continue; }
    if (w in WORD_TENS)  { current += WORD_TENS[w];  seen = true; continue; }

    if (w in WORD_SCALES) {
      const scale = WORD_SCALES[w];
      if (current === 0) current = 1; // "hundred" after "a" or alone → 100
      current *= scale;
      if (scale === 1000) { total += current; current = 0; }
      seen = true;
      continue;
    }

    // unknown token inside sequence → bail
    return null;
  }

  if (!seen) return null;
  const value = total + current;
  if (!Number.isFinite(value)) return null;
  // Avoid turning bare "and" chunks into 0
  if (value === 0 && !/zero/.test(seq.toLowerCase())) return null;
  return String(value);
}

export function normalizeNumberWords(text) {
  if (!text || !text.replace) return text;
  return text.replace(NUMBER_WORD_SEQ, (m) => {
    const val = wordsToNumber(m);
    return (val == null) ? m : val;
  });
}

// One-pass helper: run fraction-first, then numbers.
// This ensures "one half" → "1/2" BEFORE "one" becomes "1".
// One-pass helper: split concatenated words → fraction words → number words.
export function normalizeWordsAndFractions(text) {
  const step0 = expandConcatenatedNumberWords(String(text));
  const step1 = normalizeNumberWordFractions(step0); // "one half" → 1/2
  const step2 = normalizeNumberWords(step1);         // "twenty two" → 22
  return step2.replace(/\s+/g, ' ').trim();
}

// Legacy alias (if any code still imports the old name)
export function normalizeWordsForMath(text) {
  return normalizeWordsAndFractions(text);
}
// === ✂️ Split concatenated number-words (e.g., "twentytwo" → "twenty two") ===
// Greedy longest-match segmentation using the same vocabulary as our normalizers.
// Only splits a token if it can be fully segmented; otherwise leaves it unchanged.

const _NUMWORD_TOKENS = new Set([
  // fillers
  'a','an','and',
  // units
  'zero','one','two','three','four','five','six','seven','eight','nine',
  'ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen',
  // tens
  'twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety',
  // scales
  'hundred','thousand'
]);

const _NUMWORD_TOKEN_LIST = Array.from(_NUMWORD_TOKENS).sort((a,b)=>b.length - a.length);

function _splitNumWord(wordLower) {
  let i = 0;
  const parts = [];
  while (i < wordLower.length) {
    let matched = null;
    for (const tok of _NUMWORD_TOKEN_LIST) {
      if (wordLower.startsWith(tok, i)) { matched = tok; break; }
    }
    if (!matched) return null; // cannot fully segment
    parts.push(matched);
    i += matched.length;
  }
  return parts;
}

export function expandConcatenatedNumberWords(text) {
  if (!text || !text.replace) return text;
  return text.replace(/\b[a-zA-Z]+\b/g, (w) => {
    const lower = w.toLowerCase();
    // quick reject: tiny words or ones already in vocab -> leave as-is
    if (lower.length < 6 && !_NUMWORD_TOKENS.has(lower)) return w;
    const parts = _splitNumWord(lower);
    return parts ? parts.join(' ') : w;
  });
}
