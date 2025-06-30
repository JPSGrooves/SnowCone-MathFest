import Fuse from 'fuse.js';

////////////////////////////////////
// 🧠 Phrase Map — Master Key
////////////////////////////////////
export const phraseMap = {
  greetings: ['hello', 'hi', 'hey', 'yo', 'greetings', 'sup', 'what’s up', 'howdy', 'hola', 'bonjour'],

  how_are_you: ['how are you', 'how you doing', 'what’s up', 'you good', 'how you feeling', 'feeling good', 'how’s it going', 'vibe check', 'what’s your vibe'],

  mood_check: ['mood', 'vibe', 'how you feel', 'what’s your mood', 'vibe check', 'feeling today', 'feel'],

  farewells: ['bye', 'goodbye', 'later', 'see ya', 'take care', 'farewell', 'peace out', 'catch you later', 'adios', 'ciao'],

  who_are_you: ['who are you', 'your name', 'what are you', 'who is this', 'what is your name', 'tell me about yourself', 'who u', 'who r u'],

  lore_cones: ['cone', 'cones', 'syrup', 'flavor', 'ice cream', 'scoop'],
  lore_snowcone: ['snowcone', 'snowcones'],
  lore_festival: ['festival', 'mathfest', 'the fest', 'festival lore', 'festival story', 'festival history'],
  lore_badges: ['badge', 'badges', 'xp', 'level up', 'achievement', 'achievements'],

  math_arithmetic: ['arithmetic', 'add', 'subtract', 'multiply', 'divide', 'basic math'],
  math_algebra: ['algebra', 'solve for x', 'equation', 'variable', 'polynomial', 'quadratic', 'linear'],
  math_geometry: ['geometry', 'shape', 'area', 'perimeter', 'angle', 'triangle', 'circle', 'rectangle', 'polygon'],
  math_calculus: ['calculus', 'derivative', 'integral', 'limit', 'slope', 'function', 'differential'],
  math_trigonometry: ['trigonometry', 'sine', 'cosine', 'tangent', 'hypotenuse', 'trig identity'],
  math_general: ['math', 'pattern', 'tip', 'help', 'problem', 'number', 'solution', 'calculate', 'solve'],

  jokes: ['joke', 'funny', 'laugh', 'humor', 'comedy', 'make me laugh'],
  easter_eggs: ['unlock the secret of cones', 'hidden message', 'easter egg', 'secret', 'hidden', 'surprise']
};

////////////////////////////////////
// 🔥 Fuse Matcher Map
////////////////////////////////////
const fuseMap = {};
Object.entries(phraseMap).forEach(([key, phrases]) => {
  fuseMap[key] = new Fuse(
    phrases.map(p => ({ phrase: p })),
    { threshold: 0.35, keys: ['phrase'] }
  );
});

////////////////////////////////////
// 🔍 Universal Matcher (Main Export)
////////////////////////////////////
export function matcher(input, category) {
  const lowerInput = input.trim().toLowerCase();
  const phrases = phraseMap[category];

  // ✅ Substring check (fast path)
  if (phrases?.some(phrase => lowerInput.includes(phrase))) {
    return true;
  }

  // 🔍 Fuzzy check
  const result = fuseMap[category]?.search(lowerInput);
  return result && result.length > 0;
}

////////////////////////////////////
// ➕ Math Category Bulk Matcher
////////////////////////////////////
export function matcherAnyMath(input) {
  return [
    'math_arithmetic',
    'math_algebra',
    'math_geometry',
    'math_calculus',
    'math_trigonometry',
    'math_general'
  ].some(category => matcher(input, category));
}
