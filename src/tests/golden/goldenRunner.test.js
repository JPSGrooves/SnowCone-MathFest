 // @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 🧠 bring in the brain under test
import { getResponse } from '../../modes/mathTips/qabot.js';
import { setMode, MODES } from '../../modes/mathTips/modeManager.js';

// ── helpers
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const F = (p) => path.join(__dirname, p);

function loadPairs(basename) {
  const raw = fs.readFileSync(F(basename), 'utf8');
  const arr = JSON.parse(raw);
  if (!Array.isArray(arr)) throw new Error(`${basename} must be an array`);
  return arr.map(([input, pattern]) => ({ input, pattern }));
}

function runOne(input, pattern, label='') {
  const res = getResponse(input); // { html, meta? }
  const html = typeof res === 'string' ? res : (res?.html || '');
  const re = new RegExp(pattern, 'i'); // case-insensitive
  const ok = re.test(String(html));
  if (!ok) {
    // Show a short diff-friendly snippet when failing
    const snippet = String(html).replace(/\n/g, '\\n').slice(0, 280);
    throw new Error(
      `Golden mismatch ${label ? '['+label+'] ' : ''}for input: "${input}"\n` +
      `Expected pattern: /${pattern}/i\n` +
      `Got HTML: ${snippet}…`
    );
  }
}

// ── GLOBAL
describe('golden/global', () => {
  beforeEach(() => setMode(MODES.none));
  const cases = loadPairs('global.json');
  for (const { input, pattern } of cases) {
    it(`global: "${input}"`, () => runOne(input, pattern, 'global'));
  }
});

// ── CALC
describe('golden/calc', () => {
  beforeEach(() => setMode(MODES.calc));
  const cases = loadPairs('calc.json');
  for (const { input, pattern } of cases) {
    it(`calc: "${input}"`, () => runOne(input, pattern, 'calc'));
  }
});

// ── LESSONS
describe('golden/lessons', () => {
  beforeEach(() => setMode(MODES.lessons));
  const cases = loadPairs('lessons.json');
  for (const { input, pattern } of cases) {
    it(`lessons: "${input}"`, () => runOne(input, pattern, 'lessons'));
  }
});

// ── QUIZ (stateful within the block)
describe('golden/quiz', () => {
  beforeEach(() => setMode(MODES.quiz));
  const cases = loadPairs('quiz.json');

  it('quiz start', () => {
    const { input, pattern } = cases[0];
    runOne(input, pattern, 'quiz-start');
  });

  it('quiz score after start', () => {
    const { input, pattern } = cases[1];
    runOne(input, pattern, 'quiz-score');
  });
});

// ── LORE
describe('golden/lore', () => {
  beforeEach(() => setMode(MODES.lore));
  const cases = loadPairs('lore.json');
  for (const { input, pattern } of cases) {
    it(`lore: "${input}"`, () => runOne(input, pattern, 'lore'));
  }
});

// ── RECIPES
describe('golden/recipes', () => {
  beforeEach(() => setMode(MODES.recipes));
  const cases = loadPairs('recipes.json');
  for (const { input, pattern } of cases) {
    it(`recipes: "${input}"`, () => runOne(input, pattern, 'recipes'));
  }
});
