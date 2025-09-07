// /src/modes/mathTips/tiles/tiles.core.js
// 🍧 Tile banks — data-only. Add more tiles freely without touching engine.

const predictive = [
  {
    key: 'percent_basics',
    triggers: ['percent','percentage', /(\d+(\.\d+)?)\s*%\s*of\b/i],
    teach: {
      insight: 'Percent means “per 100”. Multiply the number by p/100.',
      examples: [{ in: '15% of 80', out: 12 }, { in: '7.5% of 120', out: 9 }]
    },
    flavor: ['cool.', 'right on.', 'solid.'],
    invite: ['want 2 more like that?', 'say “percent 3” for quick reps.'],
    cooldownTurns: 3, weight: 1, qOK: true
  },
  // Addition teach
  {
    key: 'addition_teach',
    triggers: [
      'addition',
      /how\s+do\s+(?:i|you)\s+add\??/i,
      /teach\s+me\s+to\s+add/i,
      /\badding\s+numbers\b/i
    ],
    teach: {
      insight: 'Line up place values. Start from the right; carry when a column ≥ 10.',
      examples: [{ in: '38 + 47', out: 85 }, { in: '560 + 240', out: 800 }]
    },
    flavor: ['stack and carry.'],
    invite: ['toss me two to add.'],
    cooldownTurns: 3, weight: 1.05, qOK: true
  },

  // Multiplication teach (typo + correct)
  {
    key: 'multiplication_teach',
    triggers: [
      'multiplication',
      /how\s+do\s+(?:i|you)\s+do\s+multiplication\??/i,
      /how\s+do\s+(?:i|you)\s+multiply\??/i,   // ← correct spelling
      /\bmultipl(?:y|ication)\b/i,
      /\bmulitply\b/i                          // ← common typo
    ],
    teach: {
      insight: 'Use partial products or a table; memorize 1–12 facts to fly.',
      examples: [{ in: '7×8', out: 56 }, { in: '12×15', out: 180 }]
    },
    flavor: ['facts fuel speed.'],
    invite: ['say `deal 3` for a mini fact set.'],
    cooldownTurns: 3, weight: 1.05, qOK: true
  },

  // Progress check
  {
    key: 'progress_check',
    triggers: [
      /how\s+am\s+i\s+doing\??/i,
      /can\s+you\s+tell\s+me\s+how\s+i'?m\s+doing\??/i,
      /am\s+i\s+doing\s+(ok|okay|well|good)\??/i
    ],
    teach: {
      insight: 'You’re showing up — that’s the hardest part. Tiny reps stack.',
      examples: [{ in: 'fractions 3', out: null }, { in: 'percent 3', out: null }]
    },
    flavor: ['proud of you.'],
    invite: ['want me to deal a mini set? say `deal 3`.'],
    cooldownTurns: 3, weight: 1.0
  },

  // Practice N prompt catcher
  {
    key: 'practice_n',
    triggers: [
      /practice\s+(\d+)\s+reps?\b/i,
      /practice\s+set\b/i,
      /let'?s\s+practice\b/i
    ],
    teach: {
      insight: 'Pick a lane and I’ll deal a tiny set.',
      examples: [{ in: 'fractions 2', out: null }, { in: 'percent 2', out: null }]
    },
    flavor: ['micro-set ready.'],
    invite: ['say `fractions 2` or `percent 2`, or `deal 2` for randoms.'],
    cooldownTurns: 2, weight: 1.05
  },

  // ADD: addition teaching
  {
    key: 'addition_teach',
    triggers: [
      'addition',
      /how\s+do\s+(?:i|you)\s+add\??/i,
      /teach\s+me\s+to\s+add/i,
      /\badding\s+numbers\b/i
    ],
    teach: {
      insight: 'Line up place values. Start from the right; carry when a column ≥ 10.',
      examples: [{ in: '38 + 47', out: 85 }, { in: '560 + 240', out: 800 }]
    },
    flavor: ['stack and carry.'],
    invite: ['toss me two to add.'],
    cooldownTurns: 3, weight: 1.05, qOK: true
  },

  // ADD/PATCH: multiplication teaching (catch “mulitply” typo too)
  {
    key: 'multiplication_teach',
    triggers: [
      'multiplication',
      /how\s+do\s+(?:i|you)\s+do\s+multiplication\??/i,
      /how\s+do\s+(?:i|you)\s+multiply\??/i,
      /\bmultipl(?:y|ication)\b/i,
      /\bmulitply\b/i // common typo
    ],
    teach: {
      insight: 'Use partial products or a table; memorize 1–12 facts to fly.',
      examples: [{ in: '7×8', out: 56 }, { in: '12×15', out: 180 }]
    },
    flavor: ['facts fuel speed.'],
    invite: ['say `deal 3` for a mini fact set.'],
    cooldownTurns: 3, weight: 1.05, qOK: true
  },

  // ADD: progress check (so “can you tell me how I’m doing?” doesn’t fall through)
  {
    key: 'progress_check',
    triggers: [
      /how\s+am\s+i\s+doing\??/i,
      /can\s+you\s+tell\s+me\s+how\s+i'?m\s+doing\??/i,
      /am\s+i\s+doing\s+(ok|okay|well|good)\??/i
    ],
    teach: {
      insight: 'You’re showing up — that’s the hardest part. Tiny reps stack.',
      examples: [{ in: 'fractions 3', out: null }, { in: 'percent 3', out: null }]
    },
    flavor: ['proud of you.'],
    invite: ['want me to deal a mini set? say `deal 3`.'],
    cooldownTurns: 3, weight: 1.0
  },

  // ADD: practice N reps (“practice 2 reps” → menu)
  {
    key: 'practice_n',
    triggers: [
      /practice\s+(\d+)\s+reps?\b/i,
      /practice\s+set\b/i,
      /let'?s\s+practice\b/i
    ],
    teach: {
      insight: 'Pick a lane and I’ll deal a tiny set.',
      examples: [
        { in: 'fractions 2', out: null },
        { in: 'percent 2',   out: null }
      ]
    },
    flavor: ['micro-set ready.'],
    invite: ['say `fractions 2` or `percent 2`, or `deal 2` for randoms.'],
    cooldownTurns: 2, weight: 1.05
  },

  {
    key: 'fractions_intro',
    triggers: ['fraction','simplify','reduce', /(\d+)\s*\/\s*(\d+)/i],
    teach: {
      insight: 'To simplify a fraction, divide top & bottom by their GCF.',
      examples: [{ in: '12/18', out: '2/3' }, { in: '45/60', out: '3/4' }]
    },
    flavor: ['mmm fractions… crunchy.'],
    invite: ['say `simplify 12/18` or toss me one.'],
    cooldownTurns: 3, weight: 1
  },
  {
    key: 'gcf_intro',
    triggers: ['gcf','greatest common factor','common factor'],
    teach: {
      insight: 'GCF is the biggest number that divides both.',
      examples: [{ in: 'gcf 18 24', out: 6 }, { in: 'gcf 21 28', out: 7 }]
    },
    flavor: ['factor party.'],
    invite: ['want an LCM next?', 'throw me two numbers.'],
    cooldownTurns: 2, weight: 1
  },
  {
    key: 'lcm_intro',
    triggers: ['lcm','least common multiple','common multiple'],
    teach: {
      insight: 'LCM = (a × b)/GCF(a, b).',
      examples: [{ in: 'lcm 6 8', out: 24 }, { in: 'lcm 12 18', out: 36 }]
    },
    flavor: ['multiples marching…'],
    invite: ['try `lcm 6 8`.'],
    cooldownTurns: 2, weight: 1
  },
  {
    key: 'calc_how',
    triggers: ['calculator','calc','compute','evaluate','math'],
    teach: {
      insight: 'You can type math straight up. I allow + − × ÷ ( ) ^.',
      examples: [{ in: '7*8+12', out: 68 }, { in: '(3^3 + 2)/5', out: 5 }]
    },
    flavor: ['straight to the numbers.'],
    invite: ['wanna try one right now?'],
    cooldownTurns: 2, weight: 0.9, qOK: true
  },

  // NEW — addition teaching
  {
    key: 'addition_teach',
    triggers: [
      'addition',
      /how\s+do\s+(?:i|you)\s+add\??/i,
      /teach\s+me\s+to\s+add/i,
      /\badding\s+numbers\b/i
    ],
    teach: {
      insight: 'Line up place values. Start from the right; carry when a column ≥ 10.',
      examples: [{ in: '38 + 47', out: 85 }, { in: '560 + 240', out: 800 }]
    },
    flavor: ['stack and carry.'],
    invite: ['toss me two to add.'],
    cooldownTurns: 3, weight: 1.05, qOK: true
  },

  // NEW — multiplication teaching
  {
    key: 'multiplication_teach',
    triggers: [
      'multiplication',
      /how\s+do\s+(?:i|you)\s+do\s+multiplication\??/i,
      /how\s+do\s+(?:i|you)\s+multiply\??/i,
      /\bmultipl(y|ication)\b/i
    ],
    teach: {
      insight: 'Use partial products or a table; memorize 1–12 facts to fly.',
      examples: [{ in: '7×8', out: 56 }, { in: '12×15', out: 180 }]
    },
    flavor: ['facts fuel speed.'],
    invite: ['say `deal 3` for a mini fact set.'],
    cooldownTurns: 3, weight: 1.05, qOK: true
  },

  // revised convert → fraction (add "you" and plurals)
  {
    key: 'convert_to_fraction_teach',
    triggers: [
      'turn into fraction','to fraction','as a fraction','as fraction',
      'make it a fraction','convert to fraction',
      /how\s+do\s+(?:i|you)\s+(?:turn|make|convert).+fraction/i
    ],
    teach: {
      insight: 'Read the decimal as “over a power of 10”, then simplify.',
      examples: [
        { in: '0.75 → 75/100', out: '3/4' },
        { in: '1.2 → 12/10',    out: '6/5' },
        { in: '30% → 30/100',   out: '3/10' }
      ]
    },
    flavor: ['mmm conversions… crunchy.'],
    invite: ['try `0.125 as fraction` or `30% as fraction`.'],
    cooldownTurns: 3, weight: 1.1, qOK: true
  },

  // revised convert → decimal (add "you" and plurals)
  {
    key: 'convert_to_decimal_teach',
    triggers: [
      'turn into decimals','turn into decimal',
      'to decimals','to decimal','as decimals','as a decimal','as decimal',
      'make it a decimal','convert to decimal',
      /how\s+do\s+(?:i|you)\s+(?:turn|make|convert).+decimals?/i
    ],
    teach: {
      insight: 'To get a decimal from a fraction, divide top by bottom. From a percent, divide by 100.',
      examples: [
        { in: '3/8 → 3 ÷ 8', out: '0.375' },
        { in: '1/4 → 1 ÷ 4', out: '0.25' },
        { in: '30% → 30 ÷ 100', out: '0.3' }
      ]
    },
    flavor: ['decimal drip.'],
    invite: ['try `3/8 as decimal` or `30% as decimal`.'],
    cooldownTurns: 3, weight: 1.1, qOK: true
  },

  // strengthened "how to use" (cover "what can I ask you")
  {
    key: 'how_to_use',
    triggers: [
      'how do i use you','what can you do','help me use','teach me to use',
      /what\s+can\s+i\s+ask\s+you\??/i
    ],
    teach: {
      insight: 'Keep it tiny. Ask, calculate, or practice 2 reps.',
      examples: [{ in: '15% of 80', out: 12 }, { in: 'gcf 18 24', out: 6 }]
    },
    flavor: ['i’m chill, but exact.'],
    invite: ['or say `help` for options.'],
    cooldownTurns: 2, weight: 1
  },

  {
    key: 'study_plan_micro',
    triggers: ['what should i study','study plan','what to study','plan study'],
    teach: {
      insight: 'Pick one lane for 3 reps: fractions, % or linear.',
      examples: [{ in: 'fractions 3', out: null }, { in: 'percent 3', out: null }]
    },
    flavor: ['tiny plan, big moves.'],
    invite: ['say “fractions 3” to start.'],
    cooldownTurns: 2, weight: 1.1
  },
  {
    key: 'motivation_micro',
    triggers: ['motivate me','pep talk','encourage me','inspire me'],
    teach: {
      insight: 'One tiny rep beats a perfect plan. 60 seconds: one problem.',
      examples: [{ in: 'simplify 12/18', out: '2/3' }]
    },
    flavor: ['you got this.'],
    invite: ['want me to deal 2?'],
    cooldownTurns: 3, weight: 1
  },
  {
    key: 'speed_micro',
    triggers: ['get faster','how do i get faster','speed','faster'],
    teach: {
      insight: 'Speed comes from short, loud bursts. Do 3 mental reps aloud.',
      examples: [{ in: '7*8', out: 56 }, { in: '25% of 40', out: 10 }]
    },
    flavor: ['tempo up.'],
    invite: ['say “deal 3” and I’ll drop a mini set.'],
    cooldownTurns: 3, weight: 1
  },

  // fractions division (add "you")
  {
    key: 'frac_div_teach',
    triggers: [
      'divide fractions','how do i divide fractions','how do you divide fractions',
      'fraction division', /divide\s+fractions?/i
    ],
    teach: {
      insight: 'Divide fractions with K-C-F: Keep the first, Change to ×, Flip the second.',
      examples: [
        { in: '1/2 ÷ 1/3', out: '1/2 × 3/1 = 3/2 = 1 1/2' },
        { in: '3/4 ÷ 2/5', out: '3/4 × 5/2 = 15/8 = 1 7/8' }
      ]
    },
    flavor: ['flip it and rip it.'],
    invite: ['toss me one to divide.'],
    cooldownTurns: 3, weight: 1.1, qOK: true
  },

  // roots teach stays (your original)
  {
    key: 'sqrt_teach',
    topic: 'roots',
    triggers: [
      'square root','sqrt','root of',
      /know anything about square roots/i,
      /how (?:do|to).+square root/i
    ],
    teach: {
      insight: 'Perfect squares hit clean: 1, 4, 9, 16, 25, 36, 49, 64, 81, 100… If it’s not perfect, use a decimal.',
      examples: [{ in: 'sqrt 81', out: '9' }, { in: 'square root of 49', out: '7' }, { in: '√50', out: '≈ 7.071' }]
    },
    flavor: ['root rituals.'],
    invite: ['try `sqrt 169` or `square root of 72`.'],
    cooldownTurns: 3, weight: 1.1, qOK: true
  },

  // quesadilla tiles (unchanged from yours)
  {
    key: 'quesadilla_intro',
    topic: 'quesadilla',
    triggers: [
      'quesadilla','quesa','make a quesadilla','how do i make a quesadilla',
      /how (?:do|to).+quesadilla/i, /quesadilla recipe/i
    ],
    teach: {
      insight: 'pan medium heat → tortilla → cheese → fold → golden both sides (2–3 min/side).',
      examples: [
        { in: 'ratio', out: '1 tortilla : 1/2 cup cheese' },
        { in: 'add-ins', out: 'beans, onion, pepper — small handful' }
      ]
    },
    flavor: ['quesa calculus.'],
    invite: [
      'say `quesadilla 3` and I’ll scale for 3 friends.',
      'want the mathy version? say `quesa math`.'
    ],
    cooldownTurns: 4, weight: 1.15, qOK: true
  },
  {
    key: 'quesadilla_math_tease',
    topic: 'quesadilla',
    triggers: ['quesa math','quesadilla math','recipe math','scale quesadilla'],
    teach: {
      insight: 'per person ≈ 1 tortilla + 1/2 cup cheese (~56 g). multiply by people, round to halves.',
      examples: [
        { in: 'quesadilla 2', out: '2 tortillas • 1 cup cheese (~112 g)' },
        { in: 'quesadilla 5', out: '5 tortillas • 2.5 cups (~280 g)' }
      ]
    },
    flavor: ['cheese theorem.'],
    invite: ['try `quesadilla 4` and I’ll scale it.'],
    cooldownTurns: 3, weight: 1
  },

  // NEW — progress check
  {
    key: 'progress_check',
    triggers: [
      /how\s+am\s+i\s+doing\??/i,
      /can\s+you\s+tell\s+me\s+how\s+i'?m\s+doing\??/i,
      /am\s+i\s+doing\s+(ok|okay|well|good)\??/i
    ],
    teach: {
      insight: 'You’re showing up — that’s the hardest part. Tiny reps stack.',
      examples: [{ in: 'fractions 3', out: null }, { in: 'percent 3', out: null }]
    },
    flavor: ['proud of you.'],
    invite: ['want me to deal a mini set? say `deal 3`.'],
    cooldownTurns: 3, weight: 1.0
  },

  // small fun stuff
  {
    key: 'who_are_you',
    triggers: ['who are you','what are you','your name'],
    teach: { insight: 'triangle whisperer. snowcone sage. your study cat.', examples: [] },
    flavor: ['meowth is right.'],
    invite: ['want a quick % rep?'],
    cooldownTurns: 4, weight: 0.8
  },
  {
    key: 'lore_festival',
    triggers: ['festival','mathfest','festival story','festival history'],
    teach: { insight: 'The Math Festival is part rave, part math retreat, all cones.', examples: [] },
    flavor: ['neon & numbers.'],
    invite: ['earn a badge later? keep practicing.'],
    cooldownTurns: 6, weight: 0.6
  },
  {
    key: 'jokes_micro',
    triggers: ['joke','funny','laugh'],
    teach: { insight: 'parallel lines have so much in common… shame they’ll never meet.', examples: [] },
    flavor: ['ba-dum-tss.'],
    invite: ['one more or a % rep?'],
    cooldownTurns: 3, weight: 0.8
  },
  {
    key: 'gratitude_ack',
    triggers: ['thanks','thank you','thx','ty','appreciate it'],
    teach: { insight: '', examples: [] },
    flavor: ['anytime.', 'you got it.', 'locked.'],
    invite: ['want a quick % rep?', 'need one more tiny problem?'],
    cooldownTurns: 2, weight: 1.2
  },
  {
    key: 'affirmation_move',
    triggers: ['ok','okay','yea','yeah','yup','sure','k','cool'],
    teach: {
      insight: 'tiny move time: pick one and fire.',
      examples: [{ in: '15% of 80', out: 12 }, { in: 'simplify 12/18', out: '2/3' }]
    },
    flavor: ['right on.'],
    invite: ['or say “deal 3” and I’ll drop a mini set.'],
    cooldownTurns: 2, weight: 1
  }
];

const eggs = [
  {
    key: 'egg_cone_spiral',
    triggers: ['cone spiral','spiral cone', /unlock the syrup/i],
    teach: { insight: 'yo… you unlocked the secret of the infinite cone. shh.', examples: [] },
    flavor: ['vip vibes unlocked.'],
    invite: ['carry on, traveler.'],
    cooldownTurns: 12, weight: 0.3
  },
  {
    key: 'egg_fractal',
    triggers: ['fractal cone','fractals'],
    teach: { insight: 'cones are just triangles dreaming in circles.', examples: [] },
    flavor: ['whoa.'],
    invite: ['back to earth: want a quick rep?'],
    cooldownTurns: 10, weight: 0.3
  }
];

export default { predictive, eggs, threshold: 0.55 };
