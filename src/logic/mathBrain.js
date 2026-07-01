// 🧠 mathBrain.js — Universal Math Engine
// SCMF QuickServe 1.5.x
//
// New law:
// mode = math lane
// difficulty = challenge level inside that lane
//
// generateProblem(mode, difficulty)
//   addSub    + easy / medium / hard
//   multiDiv  + easy / medium / hard
//   decimals  + easy / medium / hard
//   fractions + easy / medium / hard
//   mixed     + easy / medium / hard

//////////////////////////////
// 📦 Problem Generator Entry
//////////////////////////////
export function generateProblem(mode = 'addSub', difficulty = 'easy') {
  const safeMode = normalizeMode(mode);
  const safeDifficulty = normalizeDifficulty(difficulty);

  switch (safeMode) {
    case 'addSub':
      return generateAddSub(safeDifficulty);

    case 'multiDiv':
      return generateMultiDiv(safeDifficulty);

    case 'decimals':
      return generateDecimalsPercentsMoney(safeDifficulty);

    case 'fractions':
      return generateFractionsWords(safeDifficulty);

    case 'mixed':
      return generateMixedBag(safeDifficulty);

    // Legacy bridge: old QS hard mode used "algebra".
    // Mixed Bag is the new home for that "anything can happen" feeling.
    case 'algebra':
      return generateMixedBag(safeDifficulty);

    default:
      console.warn(`🤷 Unknown mode: ${mode}`);
      return generateAddSub(safeDifficulty);
  }
}

//////////////////////////////
// 🎚️ Rewards
//////////////////////////////
const REWARDS = {
  addSub: {
    easy:   { xp: 3, points: 1 },
    medium: { xp: 4, points: 2 },
    hard:   { xp: 5, points: 3 },
  },
  multiDiv: {
    easy:   { xp: 5, points: 3 },
    medium: { xp: 6, points: 4 },
    hard:   { xp: 7, points: 5 },
  },
  decimals: {
    easy:   { xp: 5, points: 3 },
    medium: { xp: 7, points: 5 },
    hard:   { xp: 9, points: 7 },
  },
  fractions: {
    easy:   { xp: 5, points: 3 },
    medium: { xp: 7, points: 5 },
    hard:   { xp: 9, points: 7 },
  },
  mixed: {
    easy:   { xp: 6, points: 4 },
    medium: { xp: 8, points: 6 },
    hard:   { xp: 10, points: 8 },
  },
};

function attachRewards(problem, mode, difficulty, extraMeta = {}) {
  const safeMode = normalizeMode(mode);
  const safeDifficulty = normalizeDifficulty(difficulty);
  const reward = REWARDS[safeMode]?.[safeDifficulty] || REWARDS.addSub.easy;

  return {
    equation: problem.equation,
    answer: normalizeAnswer(problem.answer),
    xp: reward.xp,
    points: reward.points,
    meta: {
      ...(problem.meta || {}),
      ...extraMeta,
      mode: safeMode,
      difficulty: safeDifficulty,
    },
  };
}

//////////////////////////////
// ➕➖ Add/Sub Mode
//////////////////////////////
function generateAddSub(difficulty = 'easy') {
  switch (normalizeDifficulty(difficulty)) {
    case 'medium':
      return attachRewards(generateAddSubMedium(), 'addSub', 'medium');

    case 'hard':
      return attachRewards(generateAddSubHard(), 'addSub', 'hard');

    case 'easy':
    default:
      return attachRewards(generateAddSubEasy(), 'addSub', 'easy');
  }
}

function generateAddSubEasy() {
  const useSubtraction = Math.random() < 0.45;
  const a = getRandomInt(1, 20);
  const b = getRandomInt(1, 20);

  if (useSubtraction) {
    const [hi, lo] = a > b ? [a, b] : [b, a];

    return {
      equation: `${hi} - ${lo}`,
      answer: hi - lo,
      meta: {
        type: 'addSub',
        op: '-',
        a: hi,
        b: lo,
      },
    };
  }

  return {
    equation: `${a} + ${b}`,
    answer: a + b,
    meta: {
      type: 'addSub',
      op: '+',
      a,
      b,
    },
  };
}

function generateAddSubMedium() {
  const style = choice(['twoDigitAdd', 'twoDigitSub', 'threeTerm']);

  if (style === 'twoDigitAdd') {
    const a = getRandomInt(18, 85);
    const b = getRandomInt(12, 75);

    return {
      equation: `${a} + ${b}`,
      answer: a + b,
      meta: {
        type: 'addSub',
        op: '+',
        a,
        b,
      },
    };
  }

  if (style === 'twoDigitSub') {
    const a = getRandomInt(30, 120);
    const b = getRandomInt(10, a - 1);

    return {
      equation: `${a} - ${b}`,
      answer: a - b,
      meta: {
        type: 'addSub',
        op: '-',
        a,
        b,
      },
    };
  }

  const a = getRandomInt(8, 35);
  const b = getRandomInt(8, 35);
  const c = getRandomInt(3, 25);

  return {
    equation: `${a} + ${b} - ${c}`,
    answer: a + b - c,
    meta: {
      type: 'addSubThreeTerm',
      a,
      b,
      c,
      steps: [
        { expr: `${a} + ${b}`, value: a + b },
        { expr: `${a + b} - ${c}`, value: a + b - c },
      ],
    },
  };
}

function generateAddSubHard() {
  const style = choice(['signedSub', 'largerThreeTerm', 'negativeMix']);

  if (style === 'signedSub') {
    const a = getRandomInt(5, 70);
    const b = getRandomInt(a + 5, a + 75);

    return {
      equation: `${a} - ${b}`,
      answer: a - b,
      meta: {
        type: 'addSub',
        op: '-',
        a,
        b,
        signed: true,
      },
    };
  }

  if (style === 'negativeMix') {
    const a = getRandomInt(-30, 30);
    const b = getRandomInt(-30, 30);
    const sign = b >= 0 ? '+' : '-';
    const shownB = Math.abs(b);

    return {
      equation: `${a} ${sign} ${shownB}`,
      answer: a + b,
      meta: {
        type: 'addSub',
        op: sign,
        a,
        b,
        signed: true,
      },
    };
  }

  const a = getRandomInt(35, 140);
  const b = getRandomInt(20, 95);
  const c = getRandomInt(10, 90);

  return {
    equation: `${a} + ${b} - ${c}`,
    answer: a + b - c,
    meta: {
      type: 'addSubThreeTerm',
      a,
      b,
      c,
      steps: [
        { expr: `${a} + ${b}`, value: a + b },
        { expr: `${a + b} - ${c}`, value: a + b - c },
      ],
    },
  };
}

//////////////////////////////
// ✖️➗ Mult/Div Mode
//////////////////////////////
function generateMultiDiv(difficulty = 'easy') {
  switch (normalizeDifficulty(difficulty)) {
    case 'medium':
      return attachRewards(generateMultiDivMedium(), 'multiDiv', 'medium');

    case 'hard':
      return attachRewards(generateMultiDivHard(), 'multiDiv', 'hard');

    case 'easy':
    default:
      return attachRewards(generateMultiDivEasy(), 'multiDiv', 'easy');
  }
}

function generateMultiDivEasy() {
  const useDivision = Math.random() < 0.45;

  if (useDivision) {
    const b = getRandomInt(2, 9);
    const answer = getRandomInt(2, 12);
    const a = b * answer;

    return {
      equation: `${a} ÷ ${b}`,
      answer,
      meta: {
        type: 'multiDiv',
        op: '÷',
        a,
        b,
      },
    };
  }

  const a = getRandomInt(2, 12);
  const b = getRandomInt(2, 12);

  return {
    equation: `${a} × ${b}`,
    answer: a * b,
    meta: {
      type: 'multiDiv',
      op: '×',
      a,
      b,
    },
  };
}

function generateMultiDivMedium() {
  const useDivision = Math.random() < 0.5;

  if (useDivision) {
    const b = getRandomInt(3, 12);
    const answer = getRandomInt(6, 20);
    const a = b * answer;

    return {
      equation: `${a} ÷ ${b}`,
      answer,
      meta: {
        type: 'multiDiv',
        op: '÷',
        a,
        b,
      },
    };
  }

  const a = getRandomInt(6, 20);
  const b = getRandomInt(3, 12);

  return {
    equation: `${a} × ${b}`,
    answer: a * b,
    meta: {
      type: 'multiDiv',
      op: '×',
      a,
      b,
    },
  };
}

function generateMultiDivHard() {
  const style = choice(['bigMultiply', 'bigDivide', 'twoStep']);

  if (style === 'bigMultiply') {
    const a = getRandomInt(12, 25);
    const b = getRandomInt(6, 14);

    return {
      equation: `${a} × ${b}`,
      answer: a * b,
      meta: {
        type: 'multiDiv',
        op: '×',
        a,
        b,
      },
    };
  }

  if (style === 'bigDivide') {
    const b = getRandomInt(6, 16);
    const answer = getRandomInt(8, 25);
    const a = b * answer;

    return {
      equation: `${a} ÷ ${b}`,
      answer,
      meta: {
        type: 'multiDiv',
        op: '÷',
        a,
        b,
      },
    };
  }

  const a = getRandomInt(4, 12);
  const b = getRandomInt(4, 12);
  const c = getRandomInt(2, 9);

  return {
    equation: `${a} × ${b} + ${c}`,
    answer: a * b + c,
    meta: {
      type: 'multiDivTwoStep',
      a,
      b,
      c,
      steps: [
        { expr: `${a} × ${b}`, value: a * b },
        { expr: `${a * b} + ${c}`, value: a * b + c },
      ],
    },
  };
}

//////////////////////////////
// 💵 Decimals / Percents / Money Mode
//////////////////////////////
function generateDecimalsPercentsMoney(difficulty = 'easy') {
  switch (normalizeDifficulty(difficulty)) {
    case 'medium':
      return attachRewards(generateDecimalMedium(), 'decimals', 'medium');

    case 'hard':
      return attachRewards(generateDecimalHard(), 'decimals', 'hard');

    case 'easy':
    default:
      return attachRewards(generateDecimalEasy(), 'decimals', 'easy');
  }
}

function generateDecimalEasy() {
  const style = choice(['moneyAdd', 'moneySub', 'decimalAdd']);

  if (style === 'moneyAdd') {
    const a = centsToMoney(getRandomInt(125, 950));
    const b = centsToMoney(getRandomInt(50, 650));

    return {
      equation: `${money(a)} + ${money(b)}`,
      answer: round2(a + b),
      meta: {
        type: 'decimalMoney',
        op: '+',
        a,
        b,
      },
    };
  }

  if (style === 'moneySub') {
    const a = centsToMoney(getRandomInt(500, 2000));
    const b = centsToMoney(getRandomInt(100, Math.floor(a * 100) - 25));

    return {
      equation: `${money(a)} - ${money(b)}`,
      answer: round2(a - b),
      meta: {
        type: 'decimalMoney',
        op: '-',
        a,
        b,
      },
    };
  }

  const a = round1(getRandomInt(10, 95) / 10);
  const b = round1(getRandomInt(10, 95) / 10);

  return {
    equation: `${a.toFixed(1)} + ${b.toFixed(1)}`,
    answer: round2(a + b),
    meta: {
      type: 'decimalAddSub',
      op: '+',
      a,
      b,
    },
  };
}

function generateDecimalMedium() {
  const style = choice(['percentFriendly', 'decimalMultiply', 'moneyChange']);

  if (style === 'percentFriendly') {
    const percent = choice([10, 20, 25, 50, 75]);
    const whole = choice([20, 40, 60, 80, 100, 120, 200]);

    return {
      equation: `${percent}% of ${whole}`,
      answer: round2((percent / 100) * whole),
      meta: {
        type: 'percentOf',
        percent,
        whole,
      },
    };
  }

  if (style === 'decimalMultiply') {
    const a = choice([1.5, 2.5, 3.5, 4.5, 5.5]);
    const b = getRandomInt(2, 9);

    return {
      equation: `${a.toFixed(1)} × ${b}`,
      answer: round2(a * b),
      meta: {
        type: 'decimalMultiply',
        a,
        b,
      },
    };
  }

  const price = centsToMoney(getRandomInt(800, 3000));
  const paid = Math.ceil((price + getRandomInt(2, 10)) / 5) * 5;

  return {
    equation: `${money(paid)} - ${money(price)}`,
    answer: round2(paid - price),
    meta: {
      type: 'moneyChange',
      paid,
      price,
    },
  };
}

function generateDecimalHard() {
  const style = choice(['percentLess', 'tip', 'decimalTwoStep']);

  if (style === 'percentLess') {
    const price = choice([24, 36, 40, 48, 60, 80, 120]);
    const percent = choice([10, 15, 20, 25, 30]);

    return {
      equation: `${percent}% off ${money(price)}`,
      answer: round2(price * (1 - percent / 100)),
      meta: {
        type: 'percentOff',
        percent,
        price,
      },
    };
  }

  if (style === 'tip') {
    const bill = choice([18, 24, 30, 36, 42, 50, 60]);
    const percent = choice([10, 15, 20, 25]);

    return {
      equation: `${percent}% tip on ${money(bill)}`,
      answer: round2(bill * (percent / 100)),
      meta: {
        type: 'percentTip',
        percent,
        bill,
      },
    };
  }

  const a = round1(getRandomInt(15, 95) / 10);
  const b = getRandomInt(2, 8);
  const c = round1(getRandomInt(5, 45) / 10);

  return {
    equation: `${a.toFixed(1)} × ${b} + ${c.toFixed(1)}`,
    answer: round2(a * b + c),
    meta: {
      type: 'decimalTwoStep',
      a,
      b,
      c,
      steps: [
        { expr: `${a.toFixed(1)} × ${b}`, value: round2(a * b) },
        { expr: `${round2(a * b)} + ${c.toFixed(1)}`, value: round2(a * b + c) },
      ],
    },
  };
}

//////////////////////////////
// 🍕 Fractions / Word Mode
//////////////////////////////
function generateFractionsWords(difficulty = 'easy') {
  switch (normalizeDifficulty(difficulty)) {
    case 'medium':
      return attachRewards(generateFractionMedium(), 'fractions', 'medium');

    case 'hard':
      return attachRewards(generateFractionHard(), 'fractions', 'hard');

    case 'easy':
    default:
      return attachRewards(generateFractionEasy(), 'fractions', 'easy');
  }
}

function generateFractionEasy() {
  const denom = choice([2, 3, 4]);
  const multiplier = getRandomInt(2, 10);
  const whole = denom * multiplier;

  return {
    equation: `1/${denom} of ${whole}`,
    answer: whole / denom,
    meta: {
      type: 'fractionOf',
      numerator: 1,
      denominator: denom,
      whole,
    },
  };
}

function generateFractionMedium() {
  const denom = choice([3, 4, 5, 6, 8]);
  const numerator = getRandomInt(2, denom - 1);
  const multiplier = getRandomInt(2, 9);
  const whole = denom * multiplier;

  return {
    equation: `${numerator}/${denom} of ${whole}`,
    answer: round2((numerator / denom) * whole),
    meta: {
      type: 'fractionOf',
      numerator,
      denominator: denom,
      whole,
    },
  };
}

function generateFractionHard() {
  const style = choice(['fractionTwoStep', 'wordSlices']);

  if (style === 'wordSlices') {
    const boxes = getRandomInt(3, 8);
    const perBox = choice([6, 8, 10, 12]);
    const denom = choice([2, 3, 4]);
    const total = boxes * perBox;

    return {
      equation: `1/${denom} of ${boxes}×${perBox} slices`,
      answer: round2(total / denom),
      meta: {
        type: 'fractionWord',
        boxes,
        perBox,
        numerator: 1,
        denominator: denom,
        total,
      },
    };
  }

  const denom = choice([4, 5, 6, 8]);
  const numerator = getRandomInt(2, denom - 1);
  const multiplier = getRandomInt(4, 12);
  const whole = denom * multiplier;
  const extra = getRandomInt(3, 15);
  const op = Math.random() < 0.5 ? '+' : '-';
  const base = round2((numerator / denom) * whole);
  const answer = op === '+' ? base + extra : base - extra;

  return {
    equation: `${numerator}/${denom} of ${whole} ${op} ${extra}`,
    answer: round2(answer),
    meta: {
      type: 'fractionTwoStep',
      numerator,
      denominator: denom,
      whole,
      extra,
      op,
      steps: [
        { expr: `${numerator}/${denom} of ${whole}`, value: base },
        { expr: `${base} ${op} ${extra}`, value: round2(answer) },
      ],
    },
  };
}

//////////////////////////////
// 🎲 Mixed Bag Mode
//////////////////////////////
function generateMixedBag(difficulty = 'easy') {
  const sourceMode = choice(['addSub', 'multiDiv', 'decimals', 'fractions']);
  const safeDifficulty = normalizeDifficulty(difficulty);

  let problem;

  switch (sourceMode) {
    case 'multiDiv':
      problem = generateMultiDiv(safeDifficulty);
      break;

    case 'decimals':
      problem = generateDecimalsPercentsMoney(safeDifficulty);
      break;

    case 'fractions':
      problem = generateFractionsWords(safeDifficulty);
      break;

    case 'addSub':
    default:
      problem = generateAddSub(safeDifficulty);
      break;
  }

  return attachRewards(problem, 'mixed', safeDifficulty, {
    ...(problem.meta || {}),
    requestedMode: 'mixed',
    sourceMode,
  });
}

//////////////////////////////
// 🧹 Normalizers
//////////////////////////////
function normalizeMode(mode = 'addSub') {
  const raw = String(mode || '').trim();

  const aliases = {
    easy: 'addSub',
    medium: 'multiDiv',
    hard: 'mixed',
    algebra: 'mixed',
    decimal: 'decimals',
    decimalsPercentsMoney: 'decimals',
    fraction: 'fractions',
    fractionsWords: 'fractions',
    mixedReview: 'mixed',
  };

  const normalized = aliases[raw] || raw;

  return ['addSub', 'multiDiv', 'decimals', 'fractions', 'mixed'].includes(normalized)
    ? normalized
    : 'addSub';
}

function normalizeDifficulty(difficulty = 'easy') {
  const raw = String(difficulty || '').trim();

  const aliases = {
    med: 'medium',
    normal: 'medium',
    spicy: 'hard',
  };

  const normalized = aliases[raw] || raw;

  return ['easy', 'medium', 'hard'].includes(normalized)
    ? normalized
    : 'easy';
}

function normalizeAnswer(value) {
  const num = Number(value);

  if (!Number.isFinite(num)) return 0;

  return Number.isInteger(num) ? num : round2(num);
}

//////////////////////////////
// 🎲 Helpers
//////////////////////////////
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function choice(items = []) {
  return items[Math.floor(Math.random() * items.length)];
}

function round1(value) {
  return Math.round(Number(value) * 10) / 10;
}

function round2(value) {
  return Math.round(Number(value) * 100) / 100;
}

function centsToMoney(cents) {
  return round2(Number(cents) / 100);
}

function money(value) {
  return `$${round2(value).toFixed(2)}`;
}
