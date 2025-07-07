// 🧠 mathBrain.js — Universal Math Engine

//////////////////////////////
// 📦 Problem Generator Entry
//////////////////////////////
export function generateProblem(mode = 'addSub') {
  switch (mode) {
    case 'addSub':
      return generateAddSub();
    case 'multiDiv':
      return generateMultiDiv();
    case 'algebra':
      return generateAlgebra();
    default:
      console.warn(`🤷 Unknown mode: ${mode}`);
      return generateAddSub();
  }
}

//////////////////////////////
// ➕➖ Add/Subtract Mode
//////////////////////////////
function generateAddSub() {
  const useSubtraction = Math.random() < 0.5;
  const a = getRandomInt(1, 15);
  const b = getRandomInt(1, 15);

  let equation = '';
  let answer = 0;

  if (useSubtraction) {
    if (Math.random() < 0.3) {
      equation = `${a} - ${b}`;
      answer = a - b;
    } else {
      const [hi, lo] = a > b ? [a, b] : [b, a];
      equation = `${hi} - ${lo}`;
      answer = hi - lo;
    }
  } else {
    equation = `${a} + ${b}`;
    answer = a + b;
  }

  return {
    equation,
    answer,
    xp: 3,
    points: 1
  };
}

//////////////////////////////
// ✖️➗ Multiply/Divide Mode
//////////////////////////////
function generateMultiDiv() {
  const useDivision = Math.random() < 0.5;
  let a, b, equation, answer;

  if (useDivision) {
    b = getRandomInt(2, 9);
    answer = getRandomInt(2, 12);
    a = b * answer;
    equation = `${a} ÷ ${b}`;
  } else {
    a = getRandomInt(2, 12);
    b = getRandomInt(2, 12);
    answer = a * b;
    equation = `${a} × ${b}`;
  }

  return {
    equation,
    answer,
    xp: 5,
    points: 3
  };
}

//////////////////////////////
// 🧩 Algebra Mode (x + - y) × or ÷ (w + - z)
//////////////////////////////
function generateAlgebra() {
  const x = getRandomInt(1, 15);
  const y = getRandomInt(1, 15);
  const w = getRandomInt(1, 15);
  const z = getRandomInt(1, 15);

  const sign1 = Math.random() < 0.5 ? '+' : '-';
  const sign2 = Math.random() < 0.5 ? '+' : '-';
  const op = Math.random() < 0.5 ? '×' : '÷';

  const left = sign1 === '+' ? x + y : x - y;
  const right = sign2 === '+' ? w + z : w - z;
  const equation = `(${x} ${sign1} ${y}) ${op} (${w} ${sign2} ${z})`;
  let answer;

  if (op === '×') {
    answer = left * right;
  } else {
    // Avoid divide by zero AND decimals
    if (right === 0 || left % right !== 0) return generateAlgebra();
    answer = left / right;
  }


  return {
    equation,
    answer,
    xp: 8,
    points: 5
  };
}

//////////////////////////////
// 🎲 Helper
//////////////////////////////
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
