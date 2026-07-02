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
  const style = choice(['add', 'add', 'sub']);

  if (style === 'sub') {
    const a = getRandomInt(1, 20);
    const b = getRandomInt(0, a);

    return {
      equation: `${a} - ${b}`,
      answer: a - b,
      meta: {
        type: 'addSubEasy',
        op: '-',
        a,
        b,
        law: 'easy-second-grade',
      },
    };
  }

  const a = getRandomInt(0, 10);
  const b = getRandomInt(0, 10);

  return {
    equation: `${a} + ${b}`,
    answer: a + b,
    meta: {
      type: 'addSubEasy',
      op: '+',
      a,
      b,
      law: 'easy-second-grade',
    },
  };
}


function generateAddSubMedium() {
  const style = choice(['twoDigitAdd', 'twoDigitSub', 'lightThreeTerm']);

  if (style === 'twoDigitAdd') {
    const a = getRandomInt(10, 59);
    const b = getRandomInt(5, 40);

    return {
      equation: `${a} + ${b}`,
      answer: a + b,
      meta: {
        type: 'addSubMedium',
        op: '+',
        a,
        b,
        law: 'medium-fourth-grade',
      },
    };
  }

  if (style === 'twoDigitSub') {
    const a = getRandomInt(20, 99);
    const b = getRandomInt(1, Math.min(55, a));

    return {
      equation: `${a} - ${b}`,
      answer: a - b,
      meta: {
        type: 'addSubMedium',
        op: '-',
        a,
        b,
        law: 'medium-fourth-grade',
      },
    };
  }

  const a = getRandomInt(10, 35);
  const b = getRandomInt(5, 25);
  const c = getRandomInt(1, Math.min(18, a + b));

  return {
    equation: `${a} + ${b} - ${c}`,
    answer: a + b - c,
    meta: {
      type: 'addSubMediumTwoStep',
      a,
      b,
      c,
      law: 'medium-fourth-grade',
    },
  };
}


function generateAddSubHard() {
  const style = choice(['negative', 'negative', 'threeTerm', 'parentheses']);

  if (style === 'negative') {
    const a = getRandomInt(-30, 60);
    const b = getRandomInt(-25, 45);
    const op = choice(['+', '-']);
    const answer = op === '+' ? a + b : a - b;

    return {
      equation: `${a} ${op} ${b}`,
      answer,
      meta: {
        type: 'addSubHardNegative',
        op,
        a,
        b,
        law: 'hard-tricky-readable',
      },
    };
  }

  if (style === 'parentheses') {
    const a = getRandomInt(8, 45);
    const b = getRandomInt(3, 20);
    const c = getRandomInt(1, b);

    return {
      equation: `${a} + (${b} - ${c})`,
      answer: a + (b - c),
      meta: {
        type: 'addSubHardParentheses',
        a,
        b,
        c,
        law: 'hard-tricky-readable',
      },
    };
  }

  const a = getRandomInt(40, 120);
  const b = getRandomInt(15, 70);
  const c = getRandomInt(10, 80);

  return {
    equation: `${a} + ${b} - ${c}`,
    answer: a + b - c,
    meta: {
      type: 'addSubHardTwoStep',
      a,
      b,
      c,
      law: 'hard-tricky-readable',
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
  const style = choice(['tinyMultiply', 'tinyMultiply', 'cleanDivide']);

  if (style === 'cleanDivide') {
    const divisor = choice([2, 5, 10]);
    const answer = getRandomInt(1, 5);
    const product = divisor * answer;

    return {
      equation: `${product} ÷ ${divisor}`,
      answer,
      meta: {
        type: 'multiDivEasy',
        op: '÷',
        a: product,
        b: divisor,
        law: 'easy-second-grade',
      },
    };
  }

  const a = choice([0, 1, 2, 3, 4, 5, 10]);
  const b = getRandomInt(0, 5);

  return {
    equation: `${a} × ${b}`,
    answer: a * b,
    meta: {
      type: 'multiDivEasy',
      op: '×',
      a,
      b,
      law: 'easy-second-grade',
    },
  };
}


function generateMultiDivMedium() {
  const style = choice(['cleanMultiply', 'cleanMultiply', 'cleanDivide']);

  if (style === 'cleanDivide') {
    const divisor = getRandomInt(2, 12);
    const answer = getRandomInt(2, 12);
    const product = divisor * answer;

    return {
      equation: `${product} ÷ ${divisor}`,
      answer,
      meta: {
        type: 'multiDivMedium',
        op: '÷',
        a: product,
        b: divisor,
        law: 'medium-fourth-grade',
      },
    };
  }

  const a = getRandomInt(2, 12);
  const b = getRandomInt(2, 12);

  return {
    equation: `${a} × ${b}`,
    answer: a * b,
    meta: {
      type: 'multiDivMedium',
      op: '×',
      a,
      b,
      law: 'medium-fourth-grade',
    },
  };
}


function generateMultiDivHard() {
  const style = choice(['fairMultiply', 'cleanDivide', 'lightTwoStep']);

  if (style === 'fairMultiply') {
    const a = Math.random() < 0.42 ? getRandomInt(13, 16) : getRandomInt(6, 12);
    const b = Math.random() < 0.42 ? getRandomInt(2, 9) : getRandomInt(6, 12);

    return {
      equation: `${a} × ${b}`,
      answer: a * b,
      meta: {
        type: 'multiDivHard',
        op: '×',
        a,
        b,
        law: 'hard-tricky-readable',
      },
    };
  }

  if (style === 'cleanDivide') {
    const factorA = Math.random() < 0.42 ? getRandomInt(13, 16) : getRandomInt(6, 12);
    const factorB = getRandomInt(2, 12);
    const product = factorA * factorB;
    const divisor = Math.random() < 0.5 ? factorA : factorB;

    return {
      equation: `${product} ÷ ${divisor}`,
      answer: product / divisor,
      meta: {
        type: 'multiDivHard',
        op: '÷',
        a: product,
        b: divisor,
        factorA,
        factorB,
        law: 'hard-tricky-readable',
      },
    };
  }

  const a = getRandomInt(6, 12);
  const b = getRandomInt(4, 12);
  const c = getRandomInt(2, 12);

  return {
    equation: `${a} × ${b} + ${c}`,
    answer: a * b + c,
    meta: {
      type: 'multiDivHardTwoStep',
      a,
      b,
      c,
      law: 'hard-tricky-readable',
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
  const style = choice(['wholeMoneyAdd', 'wholeMoneyAdd', 'wholeMoneySub', 'friendlyPercent']);

  if (style === 'friendlyPercent') {
    const percent = choice([50, 10]);
    const whole = percent === 50
      ? choice([2, 4, 6, 8, 10, 12, 20])
      : choice([10, 20, 30, 40, 50]);

    return {
      equation: `${percent}% of ${whole}`,
      answer: Math.round((percent / 100) * whole * 100) / 100,
      meta: {
        type: 'decimalEasyPercent',
        percent,
        whole,
        law: 'easy-second-grade',
      },
    };
  }

  if (style === 'wholeMoneySub') {
    const a = getRandomInt(2, 10);
    const b = getRandomInt(1, a);

    return {
      equation: `$${a} - $${b}`,
      answer: a - b,
      meta: {
        type: 'decimalEasyMoney',
        op: '-',
        a,
        b,
        wholeDollarsOnly: true,
        law: 'easy-second-grade',
      },
    };
  }

  const a = getRandomInt(1, 10);
  const b = getRandomInt(1, 10);

  return {
    equation: `$${a} + $${b}`,
    answer: a + b,
    meta: {
      type: 'decimalEasyMoney',
      op: '+',
      a,
      b,
      wholeDollarsOnly: true,
      law: 'easy-second-grade',
    },
  };
}



function generateDecimalMedium() {
  const style = choice(['friendlyPercent', 'friendlyPercent', 'moneyChange', 'decimalAdd', 'tipFriendly']);

  if (style === 'friendlyPercent') {
    const percent = choice([10, 25, 50, 75]);
    const whole = choice([20, 40, 60, 80, 100, 200]);

    return {
      equation: `${percent}% of ${whole}`,
      answer: Math.round((percent / 100) * whole * 100) / 100,
      meta: {
        type: 'decimalMediumPercent',
        percent,
        whole,
        law: 'medium-fourth-grade',
      },
    };
  }

  if (style === 'moneyChange') {
    const price = choice([5, 7.5, 8.5, 10, 12.5, 15, 17.5, 22.5]);
    const paid = choice([20, 25, 30, 40, 50].filter((value) => value > price));

    return {
      equation: `$${paid} - $${price}`,
      answer: Math.round((paid - price) * 100) / 100,
      meta: {
        type: 'decimalMediumMoney',
        paid,
        price,
        law: 'medium-fourth-grade',
      },
    };
  }

  if (style === 'decimalAdd') {
    const a = choice([1.5, 2.5, 3.5, 4.5, 5.5]);
    const b = choice([0.5, 1.5, 2.5, 3.5]);

    return {
      equation: `${a} + ${b}`,
      answer: Math.round((a + b) * 100) / 100,
      meta: {
        type: 'decimalMediumAdd',
        a,
        b,
        law: 'medium-fourth-grade',
      },
    };
  }

  const percent = choice([10, 15, 20]);
  const bill = choice([10, 15, 20, 25, 30, 40]);

  return {
    equation: `${percent}% tip $${bill}`,
    answer: Math.round((bill * percent) / 100 * 100) / 100,
    meta: {
      type: 'decimalMediumTip',
      percent,
      bill,
      readableTip: true,
      law: 'medium-fourth-grade',
    },
  };
}



function generateDecimalHard() {
  const style = choice(['tip', 'percentOff', 'decimalTwoStep']);

  if (style === 'percentOff') {
    const percent = choice([10, 15, 20, 25, 30]);
    const price = choice([40, 50, 60, 80, 100, 120]);

    return {
      equation: `${percent}% off $${price}`,
      answer: Math.round((price * (1 - percent / 100)) * 100) / 100,
      meta: {
        type: 'decimalHardPercentOff',
        percent,
        price,
        law: 'hard-tricky-readable',
      },
    };
  }

  if (style === 'decimalTwoStep') {
    const a = Math.round(getRandomInt(20, 89)) / 10;
    const b = getRandomInt(3, 8);
    const c = Math.round(getRandomInt(5, 39)) / 10;

    return {
      equation: `${a} × ${b} + ${c}`,
      answer: Math.round((a * b + c) * 100) / 100,
      meta: {
        type: 'decimalHardTwoStep',
        a,
        b,
        c,
        law: 'hard-tricky-readable',
      },
    };
  }

  const percent = choice([15, 18, 20, 22, 25]);
  const bill = choice([24, 30, 36, 40, 50, 60, 80]);

  return {
    equation: `${percent}% tip $${bill}`,
    answer: Math.round((bill * percent) / 100 * 100) / 100,
    meta: {
      type: 'decimalHardTip',
      percent,
      bill,
      readableTip: true,
      law: 'hard-tricky-readable',
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
  const denominator = choice([2, 2, 3, 4]);
  const answer = getRandomInt(1, denominator === 4 ? 5 : 8);
  const whole = denominator * answer;

  return {
    equation: `1/${denominator} of ${whole}`,
    answer,
    meta: {
      type: 'fractionEasy',
      numerator: 1,
      denominator,
      whole,
      law: 'easy-second-grade',
    },
  };
}


function generateFractionMedium() {
  const style = choice(['fractionOf', 'fractionOf', 'fractionAnswer']);

  if (style === 'fractionAnswer') {
    const denominator = choice([2, 3, 4, 5, 6, 8]);
    const left = getRandomInt(1, denominator - 1);
    const right = getRandomInt(1, Math.max(1, denominator - left));
    const numerator = left + right;

    return {
      equation: `${left}/${denominator} + ${right}/${denominator}`,
      answer: Math.round((numerator / denominator) * 10000) / 10000,
      meta: {
        type: 'fractionAnswer',
        op: '+',
        numerator,
        denominator,
        answerText: `${numerator}/${denominator}`,
        law: 'medium-fourth-grade',
      },
    };
  }

  const denominator = choice([2, 3, 4, 5, 6, 8]);
  const numerator = getRandomInt(1, denominator - 1);
  const unit = getRandomInt(2, 8);
  const whole = denominator * unit;

  return {
    equation: `${numerator}/${denominator} of ${whole}`,
    answer: numerator * unit,
    meta: {
      type: 'fractionMediumOf',
      numerator,
      denominator,
      whole,
      law: 'medium-fourth-grade',
    },
  };
}



function generateFractionHard() {
  const style = choice(['fractionAnswer', 'fractionTwoStep', 'fractionProduct']);

  if (style === 'fractionAnswer') {
    const denominator = choice([4, 5, 6, 8, 10, 12]);
    const left = getRandomInt(1, denominator - 1);
    const right = getRandomInt(1, denominator - 1);
    const op = choice(['+', '-']);

    const top = op === '+'
      ? left + right
      : Math.abs(left - right) || 1;

    const a = op === '-' && right > left ? right : left;
    const b = op === '-' && right > left ? left : right;

    return {
      equation: `${a}/${denominator} ${op} ${b}/${denominator}`,
      answer: Math.round((top / denominator) * 10000) / 10000,
      meta: {
        type: 'fractionAnswer',
        op,
        numerator: top,
        denominator,
        answerText: `${top}/${denominator}`,
        law: 'hard-tricky-readable',
      },
    };
  }

  if (style === 'fractionProduct') {
    const denominator = choice([2, 3, 4, 5]);
    const numerator = getRandomInt(1, denominator - 1);
    const a = getRandomInt(3, 9);
    const b = denominator * getRandomInt(2, 6);

    return {
      equation: `${numerator}/${denominator} of ${a}×${b}`,
      answer: Math.round((numerator / denominator) * a * b * 100) / 100,
      meta: {
        type: 'fractionHardProduct',
        numerator,
        denominator,
        a,
        b,
        law: 'hard-tricky-readable',
      },
    };
  }

  const denominator = choice([3, 4, 5, 6, 8]);
  const numerator = getRandomInt(1, denominator - 1);
  const whole = denominator * getRandomInt(3, 10);
  const extra = getRandomInt(2, 12);
  const op = choice(['+', '-']);
  const base = (numerator / denominator) * whole;

  return {
    equation: `${numerator}/${denominator} of ${whole} ${op} ${extra}`,
    answer: Math.round((op === '+' ? base + extra : base - extra) * 100) / 100,
    meta: {
      type: 'fractionHardTwoStep',
      numerator,
      denominator,
      whole,
      extra,
      op,
      law: 'hard-tricky-readable',
    },
  };
}



//////////////////////////////
// 🎲 Mixed Bag Mode
//////////////////////////////
function generateMixedBag(difficulty = 'easy') {
  const safeDifficulty = normalizeDifficulty(difficulty);

  const pools = {
    easy: [
      generateAddSubEasy,
      generateAddSubEasy,
      generateMultiDivEasy,
      generateDecimalEasy,
      generateFractionEasy,
    ],
    medium: [
      generateAddSubMedium,
      generateMultiDivMedium,
      generateDecimalMedium,
      generateFractionMedium,
    ],
    hard: [
      generateAddSubHard,
      generateMultiDivHard,
      generateDecimalHard,
      generateFractionHard,
    ],
  };

  const generator = choice(pools[safeDifficulty] || pools.easy);
  const problem = generator();

  return attachRewards(problem, 'mixed', safeDifficulty, {
    mixedBag: true,
    sourceType: problem?.meta?.type || 'mixed',
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

  if (Number.isInteger(num)) return num;

  // Keep enough precision for slash input like 1/3 or 3/8.
  // Money/decimal generators already round themselves to 2 decimals.
  return Math.round(num * 10000) / 10000;
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
