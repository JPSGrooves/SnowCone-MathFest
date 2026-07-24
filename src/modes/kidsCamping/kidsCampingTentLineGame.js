import { Howl } from 'howler';
import { isMuted } from '../../managers/musicManager.js';
import { hapticSuccess } from '../../utils/haptics.js';

// 🧠 Module-scoped state (replace your globals at the top)
const GRID_SIZE = 24; // 4x6
let selectedTents = new Set();

/*
  Tent Frenzy route state.

  activeLine:
    Ordered visual SVG path.
    May repeat the starting tent at the end to close a shape.

  activeTargets:
    Unique tents the player actually has to light.

  This separation lets a square draw:
    A → B → C → D → A

  while the player only needs:
    A, B, C, D
*/
let activePattern = null;
let activeLine = [];
let activeTargets = [];
let activeRouteFamily = 'straight';

let linesWalked = 0;
let lastPatternId = null;

/* SCMF_TENT_BIG_LOT_V1 */
const BIG_LOT_ROWS = 8;
const BIG_LOT_COLS = 6;
const BIG_LOT_SIZE = 48;
let bigLotActive = false;

let gridEls = [];
let onScoreCallback = null;

// keep strong refs so cleanup actually works
let refs = {
  wrapper: null,
  grid: null,
  svg: null,
  mo: null,
  resizeObs: null,
  listeners: {
    onResize: null,
    onOrient: null,
    onScroll: null,
    onTransitionEnd: null,
  },
  pendingRAF: 0,
};

const KC_DEBUG = true;
function dbg(...args){ if (KC_DEBUG) console.log('[kc-line]', ...args); }


// 🔺 add these near your other module-scoped vars
let isResolving = false; // prevents double-firing while we handle success

// swipe state lives here so multiple mounts don't collide
let swipeState = {
  pointerDown: false,
  startX: 0,
  startY: 0,
  tentRects: new Map(),     // index -> DOMRect
  touchedIndices: new Set() // dedupe while dragging
};

let swipeTracking = {
  pointerDown: false,
  touchedIndices: new Set()
};


// keep the path object but allow reset in cleanup
let guidePath = null;

// ============================================================
// SCMF_TENT_FESTIVAL_CURRENT_V1
//
// Tent Frenzy visual escalation.
//
// Gameplay stays exactly the same.
//
// Lines 1–5:
//   classic green
//
// Lines 6–10:
//   charged green / cyan
//   small correct-hit sparks
//
// Lines 11–20:
//   true color-changing neon begins
//
// Lines 21–34:
//   stronger festival current
//
// Lines 35–49:
//   hot neon
//
// Lines 50+:
//   full Festival Neon mode
//
// This intentionally has NO unlock popup.
// The campground simply becomes stranger as the walk continues.
// ============================================================

const TENT_LINE_NEON_PALETTES =
  Object.freeze([

    Object.freeze([
      '#00f5ff',
      '#4dffb8',
      '#ff4fd8',
      '#00f5ff'
    ]),

    Object.freeze([
      '#ff4fd8',
      '#9b6cff',
      '#62d7ff',
      '#ff4fd8'
    ]),

    Object.freeze([
      '#ffe95a',
      '#79ff63',
      '#00f5ff',
      '#ffe95a'
    ]),

    Object.freeze([
      '#62d7ff',
      '#ffffff',
      '#9b6cff',
      '#62d7ff'
    ]),

    Object.freeze([
      '#ff6b45',
      '#ffe95a',
      '#ff4fd8',
      '#ff6b45'
    ]),

    Object.freeze([
      '#7dff8a',
      '#00f5ff',
      '#9b6cff',
      '#7dff8a'
    ])
  ]);


function rotateTentLineColors(
  colors,
  offset
) {

  if (
    !Array.isArray(colors) ||
    colors.length === 0
  ) {
    return [];
  }


  const normalized =
    (
      offset %
      colors.length
      +
      colors.length
    )
    %
    colors.length;


  return [
    ...colors.slice(normalized),
    ...colors.slice(0, normalized)
  ];
}


function makeTentLineColorSequence(
  colors,
  offset = 0
) {

  const rotated =
    rotateTentLineColors(
      colors,
      offset
    );


  if (
    rotated.length === 0
  ) {
    return '#00ff66';
  }


  /*
    Repeat the first color at the end.

    That lets the SVG stop-color animation loop smoothly
    instead of visibly snapping back to frame one.
  */
  return [
    ...rotated,
    rotated[0]
  ].join(';');
}


function getTentLineFxProfile() {

  /*
    linesWalked is the number already completed.

    Therefore:
      linesWalked 0 = currently walking Line 1
      linesWalked 10 = currently walking Line 11
  */
  const lineNumber =
    linesWalked + 1;


  if (
    lineNumber <= 5
  ) {

    return {
      id: 'calm',

      lineNumber,

      colors: [
        '#00ff66',
        '#66ff99',
        '#00ffaa'
      ],

      accent:
        '#00ff88',

      cycleDuration:
        '1.4s',

      dashDuration:
        '1.2s',

      widthValues:
        '8;11;8',

      blurValues:
        '3;6;3',

      sparkCount:
        0
    };
  }


  if (
    lineNumber <= 10
  ) {

    return {
      id: 'charged',

      lineNumber,

      colors: [
        '#00ff66',
        '#00ffaa',
        '#58e8ff',
        '#00ff66'
      ],

      accent:
        '#00ffaa',

      cycleDuration:
        '1.65s',

      dashDuration:
        '1.08s',

      widthValues:
        '8;12;8',

      blurValues:
        '3;7;3',

      sparkCount:
        4
    };
  }


  const palette =
    TENT_LINE_NEON_PALETTES[
      (
        lineNumber - 11
      )
      %
      TENT_LINE_NEON_PALETTES.length
    ];


  if (
    lineNumber <= 20
  ) {

    return {
      id: 'neon',

      lineNumber,

      colors:
        palette,

      accent:
        palette[0],

      cycleDuration:
        '2.5s',

      dashDuration:
        '0.98s',

      widthValues:
        '8;12.5;8',

      blurValues:
        '3.5;8;3.5',

      sparkCount:
        6
    };
  }


  if (
    lineNumber <= 34
  ) {

    return {
      id: 'festival',

      lineNumber,

      colors:
        palette,

      accent:
        palette[1] ??
        palette[0],

      cycleDuration:
        '2.05s',

      dashDuration:
        '0.84s',

      widthValues:
        '8.5;13.5;8.5',

      blurValues:
        '4;9;4',

      sparkCount:
        8
    };
  }


  if (
    lineNumber <= 49
  ) {

    return {
      id: 'hot',

      lineNumber,

      colors:
        palette,

      accent:
        palette[2] ??
        palette[0],

      cycleDuration:
        '1.62s',

      dashDuration:
        '0.72s',

      widthValues:
        '9;14;9',

      blurValues:
        '4;10;4',

      sparkCount:
        10
    };
  }


  /*
    Line 50+ becomes full Festival Neon.

    Instead of one small palette, the route now rolls through
    the whole SCMF neon spectrum.
  */
  return {
    id: 'festival-max',

    lineNumber,

    colors: [
      '#00f5ff',
      '#ff4fd8',
      '#ffe95a',
      '#79ff63',
      '#9b6cff',
      '#ff6b45',
      '#00f5ff'
    ],

    accent:
      '#ffffff',

    cycleDuration:
      '1.42s',

    dashDuration:
      '0.62s',

    widthValues:
      '9;15;9',

    blurValues:
      '4;11;4',

    sparkCount:
      12
  };
}


function applyTentLineVisualProgression() {

  const svg =
    refs.svg;

  if (
    !svg
  ) {
    return;
  }


  const profile =
    getTentLineFxProfile();


  if (
    refs.wrapper
  ) {

    refs.wrapper.dataset.tentFxTier =
      profile.id;

    refs.wrapper.dataset.tentFxLine =
      String(
        profile.lineNumber
      );


    refs.wrapper.style.setProperty(
      '--kc-tent-fx-accent',
      profile.accent
    );
  }


  ensureGuideDefs(
    svg
  );

  ensureGuidePath(
    svg
  );


  const gradient =
    svg.querySelector(
      '#kcPulseGrad'
    );


  if (
    gradient
  ) {

    const stops =
      Array.from(
        gradient.querySelectorAll(
          'stop'
        )
      );


    stops.forEach(
      (
        stop,
        index
      ) => {

        const colorOffset =
          index * 2;


        const sequence =
          makeTentLineColorSequence(
            profile.colors,
            colorOffset
          );


        const firstColor =
          rotateTentLineColors(
            profile.colors,
            colorOffset
          )[0]
          ??
          profile.accent;


        stop.setAttribute(
          'stop-color',
          firstColor
        );


        const animation =
          stop.querySelector(
            'animate[attributeName="stop-color"]'
          );


        if (
          animation
        ) {

          animation.setAttribute(
            'values',
            sequence
          );


          animation.setAttribute(
            'dur',
            profile.cycleDuration
          );
        }
      }
    );
  }


  const glowBlur =
    svg.querySelector(
      '#kcGlow feGaussianBlur'
    );


  const glowAnimation =
    glowBlur?.querySelector(
      'animate[attributeName="stdDeviation"]'
    );


  if (
    glowAnimation
  ) {

    glowAnimation.setAttribute(
      'values',
      profile.blurValues
    );


    glowAnimation.setAttribute(
      'dur',
      profile.dashDuration
    );
  }


  if (
    guidePath
  ) {

    guidePath.setAttribute(
      'stroke',
      'url(#kcPulseGrad)'
    );


    guidePath.setAttribute(
      'filter',
      'url(#kcGlow)'
    );


    const dashAnimation =
      guidePath.querySelector(
        'animate[attributeName="stroke-dashoffset"]'
      );


    if (
      dashAnimation
    ) {

      dashAnimation.setAttribute(
        'dur',
        profile.dashDuration
      );
    }


    const widthAnimation =
      guidePath.querySelector(
        'animate[attributeName="stroke-width"]'
      );


    if (
      widthAnimation
    ) {

      widthAnimation.setAttribute(
        'values',
        profile.widthValues
      );


      widthAnimation.setAttribute(
        'dur',
        profile.dashDuration
      );
    }
  }


  dbg(
    'festival current',
    {
      lineNumber:
        profile.lineNumber,

      tier:
        profile.id,

      colors:
        profile.colors
    }
  );
}


// ============================================================
// CORRECT-TENT SPARKS
// ============================================================

function burstTentSparks(
  index,
  multiplier = 1
) {

  const profile =
    getTentLineFxProfile();


  if (
    profile.sparkCount <= 0
  ) {
    return;
  }


  const wrapper =
    refs.wrapper;

  const cell =
    gridEls[index]
      ?.cell;


  if (
    !wrapper ||
    !cell
  ) {
    return;
  }


  const wrapperRect =
    wrapper.getBoundingClientRect();


  const cellRect =
    cell.getBoundingClientRect();


  if (
    wrapperRect.width <= 0 ||
    wrapperRect.height <= 0 ||
    cellRect.width <= 0 ||
    cellRect.height <= 0
  ) {
    return;
  }


  const centerX =
    (
      cellRect.left -
      wrapperRect.left
    )
    +
    (
      cellRect.width /
      2
    );


  const centerY =
    (
      cellRect.top -
      wrapperRect.top
    )
    +
    (
      cellRect.height /
      2
    );


  const count =
    Math.max(
      1,

      Math.round(
        profile.sparkCount *
        multiplier
      )
    );


  for (
    let i = 0;
    i < count;
    i += 1
  ) {

    const spark =
      document.createElement(
        'span'
      );


    spark.className =
      'kc-tent-spark';


    const angle =
      Math.random() *
      Math.PI *
      2;


    const distance =
      (
        12 +
        Math.random() * 22
      )
      *
      (
        0.82 +
        multiplier * 0.22
      );


    const x =
      Math.cos(
        angle
      )
      *
      distance;


    const y =
      Math.sin(
        angle
      )
      *
      distance;


    const size =
      2 +
      Math.random() * 4;


    const duration =
      280 +
      Math.random() * 260;


    spark.style.left =
      `${centerX}px`;


    spark.style.top =
      `${centerY}px`;


    spark.style.setProperty(
      '--kc-spark-x',
      `${x}px`
    );


    spark.style.setProperty(
      '--kc-spark-y',
      `${y}px`
    );


    spark.style.setProperty(
      '--kc-spark-size',
      `${size}px`
    );


    spark.style.setProperty(
      '--kc-spark-duration',
      `${duration}ms`
    );


    spark.style.setProperty(
      '--kc-spark-color',
      profile.colors[
        Math.floor(
          Math.random() *
          profile.colors.length
        )
      ]
      ??
      profile.accent
    );


    wrapper.appendChild(
      spark
    );


    spark.addEventListener(
      'animationend',
      () => {

        spark.remove();

      },
      {
        once:
          true
      }
    );


    /*
      Defensive cleanup if WKWebView ever skips animationend.
    */
    setTimeout(
      () => {

        spark.remove();

      },
      duration + 180
    );
  }
}


// ============================================================
// SOLVED-ROUTE ENERGY SWEEP
//
// One broad flash
// +
// one bright tracer racing through the completed route.
//
// The existing 800ms solve pause gives this enough time to finish
// before pickNewLine() generates the next route.
// ============================================================

function pulseSolvedRoute() {

  const svg =
    refs.svg;


  if (
    !svg ||
    !guidePath
  ) {
    return;
  }


  const d =
    guidePath.getAttribute(
      'd'
    );


  if (
    !d
  ) {
    return;
  }


  const profile =
    getTentLineFxProfile();


  const NS =
    'http://www.w3.org/2000/svg';


  const flash =
    document.createElementNS(
      NS,
      'path'
    );


  flash.classList.add(
    'kc-route-solve-pulse',
    'kc-route-solve-flash'
  );


  flash.setAttribute(
    'd',
    d
  );


  flash.setAttribute(
    'fill',
    'none'
  );


  flash.setAttribute(
    'stroke',
    profile.accent
  );


  flash.setAttribute(
    'stroke-width',
    '14'
  );


  flash.setAttribute(
    'stroke-linecap',
    'round'
  );


  flash.setAttribute(
    'stroke-linejoin',
    'round'
  );


  flash.setAttribute(
    'filter',
    'url(#kcGlow)'
  );


  flash.style.opacity =
    '0';


  svg.appendChild(
    flash
  );


  const tracer =
    document.createElementNS(
      NS,
      'path'
    );


  tracer.classList.add(
    'kc-route-solve-pulse',
    'kc-route-solve-tracer'
  );


  tracer.setAttribute(
    'd',
    d
  );


  tracer.setAttribute(
    'fill',
    'none'
  );


  tracer.setAttribute(
    'stroke',
    '#ffffff'
  );


  tracer.setAttribute(
    'stroke-width',
    '7'
  );


  tracer.setAttribute(
    'stroke-linecap',
    'round'
  );


  tracer.setAttribute(
    'stroke-linejoin',
    'round'
  );


  tracer.setAttribute(
    'filter',
    'url(#kcGlow)'
  );


  svg.appendChild(
    tracer
  );


  let routeLength =
    0;


  try {

    routeLength =
      tracer.getTotalLength();

  } catch {

    routeLength =
      0;
  }


  if (
    Number.isFinite(
      routeLength
    )
    &&
    routeLength > 0
  ) {

    const tracerLength =
      Math.max(
        26,
        routeLength * 0.22
      );


    tracer.style.strokeDasharray =
      `${tracerLength} ${routeLength}`;


    tracer.style.strokeDashoffset =
      `${routeLength}`;


    try {

      tracer.animate(
        [
          {
            strokeDashoffset:
              `${routeLength}`,

            opacity:
              0
          },

          {
            offset:
              0.12,

            opacity:
              1
          },

          {
            offset:
              0.82,

            opacity:
              1
          },

          {
            strokeDashoffset:
              `${-routeLength}`,

            opacity:
              0
          }
        ],
        {
          duration:
            620,

          easing:
            'cubic-bezier(.2,.75,.25,1)',

          fill:
            'forwards'
        }
      );

    } catch {

      tracer.style.opacity =
        '0';
    }
  }


  try {

    flash.animate(
      [
        {
          opacity:
            0,

          strokeWidth:
            '8px'
        },

        {
          offset:
            0.22,

          opacity:
            0.92,

          strokeWidth:
            '18px'
        },

        {
          offset:
            0.58,

          opacity:
            0.56,

          strokeWidth:
            '13px'
        },

        {
          opacity:
            0,

          strokeWidth:
            '24px'
        }
      ],
      {
        duration:
          620,

        easing:
          'ease-out',

        fill:
          'forwards'
      }
    );

  } catch {

    flash.style.opacity =
      '0';
  }


  /*
    Small endpoint celebrations.

    We do not spark every tent again because a long route
    could otherwise create dozens of DOM particles at once.
  */
  const firstTarget =
    activeTargets[0];


  const lastTarget =
    activeTargets[
      activeTargets.length - 1
    ];


  if (
    Number.isInteger(
      firstTarget
    )
  ) {

    burstTentSparks(
      firstTarget,
      1.35
    );
  }


  if (
    Number.isInteger(
      lastTarget
    )
    &&
    lastTarget !==
      firstTarget
  ) {

    burstTentSparks(
      lastTarget,
      1.75
    );
  }


  setTimeout(
    () => {

      flash.remove();
      tracer.remove();

    },
    760
  );
}

// ============================================================
// SCMF_TENT_ROUTE_ENGINE_V2
// Tent Frenzy handcrafted route library.
//
// Grid:
//  0   1   2   3
//  4   5   6   7
//  8   9  10  11
// 12  13  14  15
// 16  17  18  19
// 20  21  22  23
//
// path    = SVG travel order
// targets = unique tents required for solving
// ============================================================

function makeRoutePattern(id, family, label, path) {
  return Object.freeze({
    id,
    family,
    label,
    path: Object.freeze([...path]),
    targets: Object.freeze([...new Set(path)])
  });
}


// ============================================================
// SCMF_TENT_ROUTE_ZOO_V3
//
// Canonical Tent Frenzy route library.
//
// These are the intentional base shapes.
//
// The variant engine below will:
//   - mirror them
//   - rotate them 180°
//   - place them in every legal position
//   - remove duplicate geometry
//
// Grid:
//  0   1   2   3
//  4   5   6   7
//  8   9  10  11
// 12  13  14  15
// 16  17  18  19
// 20  21  22  23
//
// path    = visual SVG travel order
// targets = unique tents required to solve
// ============================================================


// ============================================================
// SCMF_TENT_FRENZY_MASTER_LOOP_V1
//
// 1–25  : original Tent Frenzy teaching arc
// 25    : FIELD EXPANDED!
// 26+   : repeating 20-round macro cycle
//           10 Tent Frenzy DJ rounds
//           10 Dino Frenzy adventure rounds
//
// Dino chapters escalate forever:
//   I   teach connect / walls / fire
//   II  introduce moving patrol creature
//   III combine patrol + fire
//   IV+ patrol pressure + boss round, boss speed increases by chapter
// ============================================================

// SCMF_TENT_SECOND_ACT_V1
const BIG_LOT_UNLOCK_LINE = 25;
const MYSTERY_TRAIL_START_LINE = 26;
const MYSTERY_TRAIL_CHANCE = 0.32;

let activeTrailMode = 'follow';
let mysteryCheckpoints = [];
let mysteryProgress = 0;
let mysteryRevealPath = null;

const TENT_CONTOUR_CHANCE = 0.55;
const TENT_FRENZY_GOAL_HITS = 8;

const TENT_FRENZY_LOOP_START_LINE = 26;
const TENT_FRENZY_SET_ROUNDS = 10;
const DINO_FRENZY_ROUNDS = 10;
const TENT_FRENZY_MACRO_CYCLE =
  TENT_FRENZY_SET_ROUNDS +
  DINO_FRENZY_ROUNDS;

// Kept for old helpers / debug readability.
const BIG_FIELD_PLAYGROUND_START_LINE = 26;
const BIG_FIELD_PLAYGROUND_END_LINE = 35;
const DINO_FRENZY_START_LINE = 36;

let tentFrenzySetDecks = new Map();
let tentDjRecentVisuals = [];
let tentDjRecentContourIds = [];
let tentDjLastMode = null;

let connectStartIndex = -1;
let connectGoalIndex = -1;
let connectGoalIcon = '🍓';
let connectPath = [];
let blockedTentIndexes = new Set();
let hazardTentIndexes = new Set();

let dinoAdventureRound = 0;
let dinoChapterNumber = 0;
let dinoNudgeIndex = -1;

let dinoPatrolTimerId = 0;
let dinoPatrolPath = [];
let dinoPatrolCursor = 0;
let dinoPatrolDirection = 1;
let dinoPatrolCreatureIndex = -1;
let dinoPatrolSpeedMs = 900;
let dinoPatrolBossActive = false;
let dinoPatrolCreatureEl = null;

let frenzyTargetIndex = -1;
let frenzyHits = 0;
let frenzyHitPath = [];
let frenzyTimerId = 0;

/*
  Stage transition lock.

  This prevents old delayed WKWebView SVG redraw retries from
  painting the previous route onto a newly resized/rebuilt grid.
*/
let tentStageTransitionActive = false;

const ROUTE_PATTERNS = Object.freeze({

  // ==========================================================
  // STRAIGHT
  // ==========================================================

  straight: Object.freeze([

    // Full horizontal lines
    makeRoutePattern(
      'straight-row-1',
      'straight',
      'STRAIGHT',
      [0, 1, 2, 3]
    ),

    makeRoutePattern(
      'straight-row-2',
      'straight',
      'STRAIGHT',
      [4, 5, 6, 7]
    ),

    makeRoutePattern(
      'straight-row-3',
      'straight',
      'STRAIGHT',
      [8, 9, 10, 11]
    ),

    makeRoutePattern(
      'straight-row-4',
      'straight',
      'STRAIGHT',
      [12, 13, 14, 15]
    ),

    makeRoutePattern(
      'straight-row-5',
      'straight',
      'STRAIGHT',
      [16, 17, 18, 19]
    ),

    makeRoutePattern(
      'straight-row-6',
      'straight',
      'STRAIGHT',
      [20, 21, 22, 23]
    ),


    // Full vertical lines
    makeRoutePattern(
      'straight-column-1',
      'straight',
      'STRAIGHT',
      [0, 4, 8, 12, 16, 20]
    ),

    makeRoutePattern(
      'straight-column-2',
      'straight',
      'STRAIGHT',
      [1, 5, 9, 13, 17, 21]
    ),

    makeRoutePattern(
      'straight-column-3',
      'straight',
      'STRAIGHT',
      [2, 6, 10, 14, 18, 22]
    ),

    makeRoutePattern(
      'straight-column-4',
      'straight',
      'STRAIGHT',
      [3, 7, 11, 15, 19, 23]
    ),


    // Diagonals
    makeRoutePattern(
      'straight-diagonal-a',
      'straight',
      'STRAIGHT',
      [0, 5, 10, 15]
    ),

    makeRoutePattern(
      'straight-diagonal-b',
      'straight',
      'STRAIGHT',
      [4, 9, 14, 19]
    ),

    makeRoutePattern(
      'straight-diagonal-c',
      'straight',
      'STRAIGHT',
      [8, 13, 18, 23]
    ),

    makeRoutePattern(
      'straight-diagonal-d',
      'straight',
      'STRAIGHT',
      [3, 6, 9, 12]
    ),

    makeRoutePattern(
      'straight-diagonal-e',
      'straight',
      'STRAIGHT',
      [7, 10, 13, 16]
    ),

    makeRoutePattern(
      'straight-diagonal-f',
      'straight',
      'STRAIGHT',
      [11, 14, 17, 20]
    ),


    // Shorter clean lines.
    // Variant engine will move these all over the board.
    makeRoutePattern(
      'straight-short-horizontal',
      'straight',
      'STRAIGHT',
      [0, 1, 2]
    ),

    makeRoutePattern(
      'straight-short-vertical',
      'straight',
      'STRAIGHT',
      [0, 4, 8]
    ),

    makeRoutePattern(
      'straight-short-diagonal-down',
      'straight',
      'STRAIGHT',
      [0, 5, 10]
    ),

    makeRoutePattern(
      'straight-short-diagonal-up',
      'straight',
      'STRAIGHT',
      [8, 5, 2]
    ),

    makeRoutePattern(
      'straight-medium-vertical',
      'straight',
      'STRAIGHT',
      [0, 4, 8, 12, 16]
    )
  ]),


  // ==========================================================
  // TRIANGLE
  //
  // Closed shapes may repeat the starting tent visually.
  // targets remains unique automatically.
  // ==========================================================

  triangle: Object.freeze([

    makeRoutePattern(
      'triangle-wide-top',
      'triangle',
      'TRIANGLE',
      [
        0, 1, 2, 3,
        6, 9, 12,
        8, 4,
        0
      ]
    ),

    makeRoutePattern(
      'triangle-wide-bottom',
      'triangle',
      'TRIANGLE',
      [
        8, 12, 16, 20,
        21, 22, 23,
        18, 13,
        8
      ]
    ),

    makeRoutePattern(
      'triangle-small-left',
      'triangle',
      'TRIANGLE',
      [
        4, 5, 6,
        9, 12, 8,
        4
      ]
    ),

    makeRoutePattern(
      'triangle-small-right',
      'triangle',
      'TRIANGLE',
      [
        10, 13, 16,
        17, 18, 19,
        14,
        10
      ]
    ),

    makeRoutePattern(
      'triangle-mid-large',
      'triangle',
      'TRIANGLE',
      [
        1,
        4, 8, 12,
        13, 14, 15,
        10, 5,
        1
      ]
    ),


    // Perfect right-isosceles triangle
    makeRoutePattern(
      'triangle-right-small',
      'triangle',
      'TRIANGLE',
      [
        4,
        8,
        12, 13, 14,
        9,
        4
      ]
    ),

    // Larger right-isosceles triangle
    makeRoutePattern(
      'triangle-right-large',
      'triangle',
      'TRIANGLE',
      [
        0,
        4,
        8,
        12, 13, 14, 15,
        10,
        5,
        0
      ]
    ),

    // Top/right orientation
    makeRoutePattern(
      'triangle-corner-top-right',
      'triangle',
      'TRIANGLE',
      [
        0, 1, 2, 3,
        7,
        11,
        15,
        10,
        5,
        0
      ]
    ),

    // Compact 2-row triangle
    makeRoutePattern(
      'triangle-compact',
      'triangle',
      'TRIANGLE',
      [
        1,
        4, 5, 6,
        1
      ]
    )
  ]),


  // ==========================================================
  // BOX
  //
  // Square + rectangle family.
  // ==========================================================

  box: Object.freeze([

    makeRoutePattern(
      'box-upper-large',
      'box',
      'BOX',
      [
        0, 1, 2, 3,
        7, 11, 15,
        14, 13, 12,
        8, 4,
        0
      ]
    ),

    makeRoutePattern(
      'box-upper-small',
      'box',
      'BOX',
      [
        4, 5, 6,
        10, 14,
        13, 12,
        8,
        4
      ]
    ),

    makeRoutePattern(
      'box-right-tall',
      'box',
      'BOX',
      [
        5, 6, 7,
        11, 15, 19,
        18, 17,
        13, 9,
        5
      ]
    ),

    makeRoutePattern(
      'box-lower-large',
      'box',
      'BOX',
      [
        8, 9, 10, 11,
        15, 19, 23,
        22, 21, 20,
        16, 12,
        8
      ]
    ),

    makeRoutePattern(
      'box-center-small',
      'box',
      'BOX',
      [
        9, 10,
        14, 18,
        17, 13,
        9
      ]
    ),


    // Tiny square
    makeRoutePattern(
      'box-mini-square',
      'box',
      'BOX',
      [
        0, 1,
        5, 4,
        0
      ]
    ),

    // Short wide rectangle
    makeRoutePattern(
      'box-wide-short',
      'box',
      'BOX',
      [
        4, 5, 6, 7,
        11,
        10, 9, 8,
        4
      ]
    ),

    // Tall skinny rectangle
    makeRoutePattern(
      'box-tall-skinny',
      'box',
      'BOX',
      [
        0, 1,
        5, 9, 13, 17, 21,
        20,
        16, 12, 8, 4,
        0
      ]
    ),

    // Medium 3x3-ish rectangle
    makeRoutePattern(
      'box-medium',
      'box',
      'BOX',
      [
        5, 6, 7,
        11, 15,
        14, 13,
        9,
        5
      ]
    ),

    // Compact tall rectangle
    makeRoutePattern(
      'box-compact-tall',
      'box',
      'BOX',
      [
        5, 6,
        10, 14, 18,
        17,
        13, 9,
        5
      ]
    ),

    // Wide middle rectangle
    makeRoutePattern(
      'box-middle-wide',
      'box',
      'BOX',
      [
        8, 9, 10, 11,
        15, 19,
        18, 17, 16,
        12,
        8
      ]
    )
  ]),


  // ==========================================================
  // CRAZY
  //
  // Festival-lot wandering routes.
  //
  // These intentionally include:
  //   snakes
  //   hooks
  //   stairs
  //   loops
  //   diamonds
  //   perimeter walks
  //   zigzags
  // ==========================================================

  crazy: Object.freeze([

    makeRoutePattern(
      'crazy-zig-left',
      'crazy',
      'CRAZY',
      [
        0, 5, 8, 13, 16, 21
      ]
    ),

    makeRoutePattern(
      'crazy-zig-right',
      'crazy',
      'CRAZY',
      [
        3, 6, 11, 14, 19, 22
      ]
    ),

    makeRoutePattern(
      'crazy-snake',
      'crazy',
      'CRAZY',
      [
        4, 5, 6, 7,
        11, 10, 9, 8,
        12, 13, 14, 15
      ]
    ),

    makeRoutePattern(
      'crazy-lightning',
      'crazy',
      'CRAZY',
      [
        1, 6, 5, 10, 9,
        14, 13, 18, 17, 22
      ]
    ),

    makeRoutePattern(
      'crazy-festival-walk',
      'crazy',
      'CRAZY',
      [
        0, 1,
        6, 5,
        10, 11,
        14, 13,
        18, 19,
        22, 21
      ]
    ),


    // U shape
    makeRoutePattern(
      'crazy-u',
      'crazy',
      'CRAZY',
      [
        0, 4, 8, 12, 16, 20,
        21, 22, 23,
        19, 15, 11, 7, 3
      ]
    ),

    // Upside-down U
    makeRoutePattern(
      'crazy-inverted-u',
      'crazy',
      'CRAZY',
      [
        20, 16, 12, 8, 4, 0,
        1, 2, 3,
        7, 11, 15, 19, 23
      ]
    ),

    // Full perimeter loop
    makeRoutePattern(
      'crazy-perimeter',
      'crazy',
      'CRAZY',
      [
        0, 1, 2, 3,
        7, 11, 15, 19, 23,
        22, 21, 20,
        16, 12, 8, 4,
        0
      ]
    ),

    // Stair steps
    makeRoutePattern(
      'crazy-staircase',
      'crazy',
      'CRAZY',
      [
        0, 1,
        5, 6,
        10, 11,
        15
      ]
    ),

    // Spiral-ish inward walk
    makeRoutePattern(
      'crazy-spiral',
      'crazy',
      'CRAZY',
      [
        0, 1, 2, 3,
        7, 11, 15,
        14, 13,
        9, 5, 6, 10
      ]
    ),

    // C-shaped route
    makeRoutePattern(
      'crazy-c',
      'crazy',
      'CRAZY',
      [
        3, 2, 1, 0,
        4, 8, 12, 16, 20,
        21, 22, 23
      ]
    ),

    // Diamond
    makeRoutePattern(
      'crazy-diamond',
      'crazy',
      'CRAZY',
      [
        1,
        6,
        11,
        14,
        17,
        12,
        9,
        4,
        1
      ]
    ),

    // Ladder
    makeRoutePattern(
      'crazy-ladder',
      'crazy',
      'CRAZY',
      [
        0, 1,
        5, 4,
        8, 9,
        13, 12,
        16, 17,
        21, 20
      ]
    ),

    // W-ish walk
    makeRoutePattern(
      'crazy-walk-w',
      'crazy',
      'CRAZY',
      [
        0,
        5,
        8,
        13,
        16,
        21,
        18,
        15,
        10,
        7,
        2
      ]
    ),

    // Long hook
    makeRoutePattern(
      'crazy-hook',
      'crazy',
      'CRAZY',
      [
        0, 4, 8, 12, 16, 20,
        21, 22,
        18, 14, 10, 6
      ]
    ),

    // S bend
    makeRoutePattern(
      'crazy-s',
      'crazy',
      'CRAZY',
      [
        0, 1, 2, 3,
        7, 6, 5, 4,
        8, 9, 10, 11
      ]
    ),

    // Z bend
    makeRoutePattern(
      'crazy-z',
      'crazy',
      'CRAZY',
      [
        0, 1, 2, 3,
        6, 9,
        12, 13, 14, 15
      ]
    ),

    // Big diagonal wave
    makeRoutePattern(
      'crazy-wave',
      'crazy',
      'CRAZY',
      [
        0, 5, 2, 7,
        10, 15, 18, 23
      ]
    ),

    // Small alternating weave
    makeRoutePattern(
      'crazy-weave',
      'crazy',
      'CRAZY',
      [
        4, 9, 6, 11,
        14, 17, 22
      ]
    ),

    // Long switchback
    makeRoutePattern(
      'crazy-switchback',
      'crazy',
      'CRAZY',
      [
        0, 1, 6, 7,
        10, 9,
        12, 13,
        18, 19,
        22, 21
      ]
    ),

    // Center wandering loop
    makeRoutePattern(
      'crazy-center-loop',
      'crazy',
      'CRAZY',
      [
        5, 6, 10, 14,
        18, 17, 13, 9,
        5
      ]
    )
  ])
});

// ============================================================
// Tent Frenzy — Second Act / Mystery Trails
// SCMF_TENT_SECOND_ACT_V1
// ============================================================

function getMysteryRouteEntries() {
  if (!Array.isArray(activeLine)) return [];

  const seen = new Set();
  const entries = [];

  activeLine.forEach((cellIndex, routeIndex) => {
    if (!Number.isInteger(cellIndex)) return;

    // Closed shapes often return to their starting cell.
    // We only need the first visit for a numbered checkpoint.
    if (seen.has(cellIndex)) return;

    seen.add(cellIndex);

    entries.push({
      cellIndex,
      routeIndex,
    });
  });

  return entries;
}

function buildMysteryCheckpoints() {
  const entries = getMysteryRouteEntries();

  if (entries.length < 2) {
    return [];
  }

  // Keep the iPhone board readable.
  // Short routes get 3-ish checkpoints.
  // Large routes cap at 6.
  const desiredCount = Math.max(
    3,
    Math.min(6, Math.round(entries.length / 2))
  );

  const checkpointCount = Math.min(
    entries.length,
    desiredCount
  );

  const chosen = [];
  const usedRouteIndexes = new Set();

  for (let i = 0; i < checkpointCount; i += 1) {
    const ratio =
      checkpointCount <= 1
        ? 0
        : i / (checkpointCount - 1);

    const entryIndex = Math.round(
      ratio * (entries.length - 1)
    );

    const entry = entries[entryIndex];

    if (!entry) continue;
    if (usedRouteIndexes.has(entry.routeIndex)) continue;

    usedRouteIndexes.add(entry.routeIndex);

    chosen.push({
      ...entry,
      order: chosen.length + 1,
    });
  }

  return chosen;
}

function shouldUseMysteryTrail() {
  const lineNumber = linesWalked + 1;

  if (lineNumber < MYSTERY_TRAIL_START_LINE) {
    return false;
  }

  // Make the first Mystery Trail guaranteed.
  // The player immediately understands that the expanded lot
  // introduced a new game wrinkle.
  if (lineNumber === MYSTERY_TRAIL_START_LINE) {
    return true;
  }

  return Math.random() < MYSTERY_TRAIL_CHANCE;
}

function clearMysteryTrailPresentation() {
  mysteryProgress = 0;
  mysteryCheckpoints = [];

  refs.wrapper?.querySelectorAll(
    '.kc-mystery-order'
  ).forEach((el) => el.remove());

  refs.wrapper?.querySelectorAll(
    '.kc-mystery-checkpoint-cell'
  ).forEach((el) => {
    el.classList.remove(
      'kc-mystery-checkpoint-cell',
      'kc-mystery-checkpoint-complete',
      'kc-mystery-checkpoint-wrong'
    );
  });

  mysteryRevealPath?.remove();
  mysteryRevealPath = null;

  if (guidePath) {
    guidePath.style.opacity = '1';
  }

  if (refs.wrapper) {
    refs.wrapper.dataset.trailMode = 'follow';
  }
}

function renderMysteryCheckpointBadges() {
  mysteryCheckpoints.forEach((checkpoint) => {
    const cell = gridEls?.[checkpoint.cellIndex]?.cell;

    if (!cell) return;

    cell.classList.add(
      'kc-mystery-checkpoint-cell'
    );

    const badge = document.createElement('span');

    badge.className = 'kc-mystery-order';
    badge.dataset.mysteryOrder =
      String(checkpoint.order);

    badge.textContent =
      String(checkpoint.order);

    cell.appendChild(badge);
  });
}

function configureTrailModeForCurrentLine() {
  clearMysteryTrailPresentation();
  clearTentVarietyPresentation();

  activeTrailMode =
    chooseTentTrailMode();

  if (refs.wrapper) {
    refs.wrapper.dataset.trailMode =
      activeTrailMode;
  }

  if (isDinoFrenzyMode()) {
    const configured =
      configureDinoFrenzyMode(
        getDinoAdventureRoundForLine()
      );

    if (!configured) {
      /*
        Safety fallback:
        never strand the player on a bad generated adventure board.
      */
      activeTrailMode = 'follow';

      if (refs.wrapper) {
        refs.wrapper.dataset.trailMode =
          'follow';
      }
    }

    return;
  }

  if (
    activeTrailMode === 'connect' ||
    activeTrailMode === 'blocked-connect'
  ) {
    const configured =
      configureConnectTrailMode(
        activeTrailMode === 'blocked-connect'
      );

    if (!configured) {
      activeTrailMode = 'follow';

      if (refs.wrapper) {
        refs.wrapper.dataset.trailMode =
          'follow';
      }
    }

    return;
  }

  if (activeTrailMode === 'frenzy') {
    configureFrenzyMode();
    return;
  }

  if (activeTrailMode !== 'mystery') {
    return;
  }

  mysteryCheckpoints =
    buildMysteryCheckpoints();

  if (mysteryCheckpoints.length < 2) {
    activeTrailMode = 'follow';

    if (refs.wrapper) {
      refs.wrapper.dataset.trailMode =
        'follow';
    }

    return;
  }

  mysteryProgress = 0;

  activeTargets =
    mysteryCheckpoints.map(
      checkpoint =>
        checkpoint.cellIndex
    );

  renderMysteryCheckpointBadges();

  if (guidePath) {
    guidePath.style.opacity = '0';
  }

  dbg(
    'mystery trail',
    {
      lineNumber:
        linesWalked + 1,

      checkpoints:
        mysteryCheckpoints.map(
          checkpoint => ({
            order:
              checkpoint.order,

            cellIndex:
              checkpoint.cellIndex,

            routeIndex:
              checkpoint.routeIndex
          })
        )
    }
  );
}


// ============================================================
// SCMF_TENT_SECOND_ACT_WIRING_V1
// Keep Mystery Trail answers hidden through every delayed
// WKWebView SVG retry. The completed route becomes visible only
// after the final numbered checkpoint is reached.
// ============================================================
function syncGuidePathForTrailMode() {
  if (!guidePath) {
    return;
  }

  if (tentStageTransitionActive) {
    guidePath.style.opacity =
      '0';

    return;
  }

  const mysteryIsComplete =
    activeTrailMode === 'mystery' &&
    mysteryCheckpoints.length > 0 &&
    mysteryProgress >=
      mysteryCheckpoints.length;

  const shouldHideAnswer =
    activeTrailMode === 'mystery' &&
    !mysteryIsComplete;

  guidePath.style.opacity =
    shouldHideAnswer
      ? '0'
      : '1';
}

function ensureMysteryRevealPath() {
  if (!refs.svg) return null;

  if (
    mysteryRevealPath &&
    mysteryRevealPath.isConnected
  ) {
    return mysteryRevealPath;
  }

  const NS =
    'http://www.w3.org/2000/svg';

  mysteryRevealPath =
    document.createElementNS(NS, 'path');

  mysteryRevealPath.classList.add(
    'kc-mystery-reveal-path'
  );

  mysteryRevealPath.setAttribute(
    'fill',
    'none'
  );

  mysteryRevealPath.setAttribute(
    'stroke',
    'url(#kcPulseGrad)'
  );

  mysteryRevealPath.setAttribute(
    'stroke-width',
    '10'
  );

  mysteryRevealPath.setAttribute(
    'stroke-linecap',
    'round'
  );

  mysteryRevealPath.setAttribute(
    'stroke-linejoin',
    'round'
  );

  mysteryRevealPath.setAttribute(
    'filter',
    'url(#kcGlow)'
  );

  refs.svg.appendChild(
    mysteryRevealPath
  );

  return mysteryRevealPath;
}

function buildMysteryRevealD(endRouteIndex) {
  if (!refs.svg) return '';

  if (!Array.isArray(activeLine)) {
    return '';
  }

  const svgRect =
    refs.svg.getBoundingClientRect();

  const routeSlice =
    activeLine.slice(
      0,
      endRouteIndex + 1
    );

  const points = [];

  routeSlice.forEach((cellIndex) => {
    const cell =
      gridEls?.[cellIndex]?.cell;

    if (!cell) return;

    const rect =
      cell.getBoundingClientRect();

    if (
      rect.width <= 0 ||
      rect.height <= 0
    ) {
      return;
    }

    points.push({
      x:
        rect.left -
        svgRect.left +
        rect.width / 2,

      y:
        rect.top -
        svgRect.top +
        rect.height / 2,
    });
  });

  if (!points.length) {
    return '';
  }

  return points
    .map((point, index) => {
      const command =
        index === 0 ? 'M' : 'L';

      return `${command} ${point.x} ${point.y}`;
    })
    .join(' ');
}

function revealMysteryTrailThrough(
  checkpoint
) {
  if (!checkpoint) return;

  const path =
    ensureMysteryRevealPath();

  if (!path) return;

  const d =
    buildMysteryRevealD(
      checkpoint.routeIndex
    );

  if (!d) return;

  path.setAttribute('d', d);

  // Animate the revealed path like energy
  // racing out from the starting checkpoint.
  try {
    const length =
      path.getTotalLength();

    if (length > 0) {
      path.style.transition = 'none';

      path.style.strokeDasharray =
        `${length}`;

      path.style.strokeDashoffset =
        `${length}`;

      // Force WKWebView to commit the initial state.
      path.getBoundingClientRect();

      requestAnimationFrame(() => {
        if (!path.isConnected) return;

        path.style.transition =
          'stroke-dashoffset 360ms cubic-bezier(.2,.8,.2,1)';

        path.style.strokeDashoffset =
          '0';
      });
    }
  } catch {
    // Path still remains visible even if the
    // dash animation cannot initialize.
  }
}

function flashMysteryWrongTent(index) {
  const cell =
    gridEls?.[index]?.cell;

  if (!cell) return;

  cell.classList.remove(
    'kc-mystery-checkpoint-wrong'
  );

  // Restart animation reliably.
  void cell.offsetWidth;

  cell.classList.add(
    'kc-mystery-checkpoint-wrong'
  );

  setTimeout(() => {
    cell.classList.remove(
      'kc-mystery-checkpoint-wrong'
    );
  }, 340);
}

function prepareMysteryTentTap(index) {
  if (
    activeTrailMode !== 'mystery'
  ) {
    return true;
  }

  const expected =
    mysteryCheckpoints[
      mysteryProgress
    ];

  if (!expected) {
    return false;
  }

  if (
    index !== expected.cellIndex
  ) {
    flashMysteryWrongTent(index);
    return false;
  }

  const cell =
    gridEls?.[index]?.cell;

  cell?.classList.add(
    'kc-mystery-checkpoint-complete'
  );

  const badge =
    cell?.querySelector(
      '.kc-mystery-order'
    );

  badge?.classList.add(
    'is-complete'
  );

  mysteryProgress += 1;

  revealMysteryTrailThrough(
    expected
  );

  const completed =
    mysteryProgress >=
    mysteryCheckpoints.length;

  if (completed) {
    // Reveal the true complete route immediately
    // before the existing success pulse fires.
    if (guidePath) {
      guidePath.style.opacity = '1';
    }

    if (mysteryRevealPath) {
      mysteryRevealPath.style.opacity =
        '0';
    }
  }

  return true;
}


// ============================================================
// POST-25 VARIETY ENGINE
//
// FOLLOW          = existing visible route
// MYSTERY         = numbered checkpoints reveal route
// CONNECT         = free draw from Dino to destination
// BLOCKED-CONNECT = free draw with visible obstacles
// FRENZY          = whack-a-tent bonus rhythm
// ============================================================

function getActiveTentGridDimensions() {
  return bigLotActive
    ? { rows: BIG_LOT_ROWS, cols: BIG_LOT_COLS }
    : { rows: ROUTE_GRID_ROWS, cols: ROUTE_GRID_COLS };
}

function getActiveTentNeighbors(index) {
  const { rows, cols } =
    getActiveTentGridDimensions();

  const row =
    Math.floor(index / cols);

  const col =
    index % cols;

  const neighbors = [];

  for (let rowDelta = -1; rowDelta <= 1; rowDelta += 1) {
    for (let colDelta = -1; colDelta <= 1; colDelta += 1) {
      if (rowDelta === 0 && colDelta === 0) continue;

      const nextRow = row + rowDelta;
      const nextCol = col + colDelta;

      if (
        nextRow < 0 || nextRow >= rows ||
        nextCol < 0 || nextCol >= cols
      ) {
        continue;
      }

      neighbors.push(
        nextRow * cols + nextCol
      );
    }
  }

  return neighbors;
}

function setTentLitForVariety(index, lit) {
  const tent = gridEls[index];
  if (!tent) return;

  tent.img.src =
    `${import.meta.env.BASE_URL}` +
    `assets/img/characters/kidsCamping/${lit ? 'tentLit.png' : 'tent.png'}`;
}

function wobbleTentChoice(index) {
  flashMysteryWrongTent(index);
}

function clearTentVarietyPresentation() {
  if (frenzyTimerId) {
    clearInterval(frenzyTimerId);
    frenzyTimerId = 0;
  }

  stopDinoPatrol();

  refs.wrapper?.querySelectorAll(
    [
      '.kc-connect-endpoint',
      '.kc-trail-blocker',
      '.kc-dino-fire',
      '.kc-frenzy-count-finale',
      '.kc-frenzy-pow',
      '.kc-dino-patrol-mark',
      '.kc-dino-patrol-creature'
    ].join(', ')
  ).forEach(el => el.remove());

  refs.wrapper?.querySelectorAll(
    [
      '.kc-connect-start-cell',
      '.kc-connect-goal-cell',
      '.kc-trail-blocked',
      '.kc-dino-hazard-cell',
      '.kc-dino-nudge',
      '.kc-dino-fire-hit',
      '.kc-dino-patrol-cell',
      '.kc-dino-patrol-hit',
      '.kc-dino-boss-lane',
      '.kc-frenzy-target'
    ].join(', ')
  ).forEach(el => {
    el.classList.remove(
      'kc-connect-start-cell',
      'kc-connect-goal-cell',
      'kc-trail-blocked',
      'kc-dino-hazard-cell',
      'kc-dino-nudge',
      'kc-dino-fire-hit',
      'kc-dino-patrol-cell',
      'kc-dino-patrol-hit',
      'kc-dino-boss-lane',
      'kc-frenzy-target'
    );
  });

  connectStartIndex = -1;
  connectGoalIndex = -1;
  connectGoalIcon = '🍓';
  connectPath = [];
  blockedTentIndexes = new Set();
  hazardTentIndexes = new Set();

  dinoAdventureRound = 0;
  dinoChapterNumber = 0;
  dinoNudgeIndex = -1;

  if (refs.wrapper) {
    delete refs.wrapper.dataset.dinoFrenzy;
    delete refs.wrapper.dataset.dinoFrenzyRound;
    delete refs.wrapper.dataset.dinoFrenzyChapter;
  }

  frenzyTargetIndex = -1;
  frenzyHits = 0;
  frenzyHitPath = [];
}

function resetTentVarietyState() {
  clearTentVarietyPresentation();

  tentFrenzySetDecks = new Map();
  tentDjRecentVisuals = [];
  tentDjRecentContourIds = [];
  tentDjLastMode = null;
  tentStageTransitionActive = false;
}

function shuffledTentModes(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex =
      Math.floor(Math.random() * (index + 1));

    [copy[index], copy[swapIndex]] =
      [copy[swapIndex], copy[index]];
  }

  return copy;
}

function tentRomanNumeral(value) {
  const map = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];

  let number = Math.max(1, Math.floor(value || 1));
  let result = '';

  for (const [amount, numeral] of map) {
    while (number >= amount) {
      result += numeral;
      number -= amount;
    }
  }

  return result;
}

function getTentFrenzyPhaseForLine(
  lineNumber = linesWalked + 1
) {
  if (lineNumber < TENT_FRENZY_LOOP_START_LINE) {
    return {
      kind: 'opening',
      lineNumber,
      round: lineNumber,
      setIndex: 0,
      chapter: 0
    };
  }

  const offset =
    lineNumber -
    TENT_FRENZY_LOOP_START_LINE;

  const cycleIndex =
    Math.floor(
      offset /
      TENT_FRENZY_MACRO_CYCLE
    );

  const withinCycle =
    offset %
    TENT_FRENZY_MACRO_CYCLE;

  if (withinCycle < TENT_FRENZY_SET_ROUNDS) {
    return {
      kind: 'tent-set',
      lineNumber,
      setIndex: cycleIndex + 1,
      chapter: cycleIndex + 1,
      round: withinCycle + 1
    };
  }

  return {
    kind: 'dino',
    lineNumber,
    setIndex: cycleIndex + 1,
    chapter: cycleIndex + 1,
    round:
      withinCycle -
      TENT_FRENZY_SET_ROUNDS +
      1
  };
}

function chooseTentSurpriseContourId() {
  const ids = [
    'big-contour-tent',
    'big-contour-arrow-up',
    'big-contour-diamond',
    'big-contour-tree',
    'big-contour-snowcone',
    'big-contour-crown',
    'big-contour-lightning'
  ];

  const cooled = ids.filter(
    id =>
      !tentDjRecentContourIds
        .slice(-3)
        .includes(id)
  );

  const pool =
    cooled.length
      ? cooled
      : ids;

  const chosen =
    pool[
      Math.floor(
        Math.random() *
        pool.length
      )
    ];

  tentDjRecentContourIds.push(chosen);

  if (tentDjRecentContourIds.length > 6) {
    tentDjRecentContourIds.shift();
  }

  return chosen;
}

function scoreTentSetDeck(deck) {
  let score = 0;

  for (let index = 0; index < deck.length; index += 1) {
    const current = deck[index];
    const previous = deck[index - 1];

    if (!previous) {
      if (
        tentDjLastMode &&
        current.mode === tentDjLastMode
      ) {
        score -= 5;
      }

      continue;
    }

    if (
      current.mode === 'frenzy' &&
      previous.mode === 'frenzy'
    ) {
      return -Infinity;
    }

    if (
      current.mode === 'mystery' &&
      previous.mode === 'mystery'
    ) {
      return -Infinity;
    }

    if (
      current.mode !== 'follow' &&
      previous.mode !== 'follow'
    ) {
      score -= 2;
    }

    if (
      current.followKind === 'shape' &&
      previous.followKind === 'shape'
    ) {
      return -Infinity;
    }

    if (
      index >= 2 &&
      deck[index - 1].mode === 'follow' &&
      deck[index - 2].mode === 'follow' &&
      current.mode === 'follow'
    ) {
      score -= 4;
    }

    if (current.mode !== previous.mode) {
      score += 1;
    }
  }

  return score;
}

function buildTentFrenzySetDeck(setIndex) {
  const shapeEntries = [
    {
      mode: 'follow',
      followKind: 'shape',
      shapeId: 'big-contour-heart-up'
    },
    {
      mode: 'follow',
      followKind: 'shape',
      shapeId: 'big-contour-castle'
    },
    {
      mode: 'follow',
      followKind: 'shape',
      shapeId: chooseTentSurpriseContourId()
    }
  ];

  const routeEntries = [
    { mode: 'follow', followKind: 'route' },
    { mode: 'follow', followKind: 'route' },
    { mode: 'follow', followKind: 'route' }
  ];

  const base = [
    ...shapeEntries,
    ...routeEntries,
    { mode: 'mystery' },
    { mode: 'mystery' },
    { mode: 'frenzy' },
    { mode: 'frenzy' }
  ];

  let best = null;
  let bestScore = -Infinity;

  for (let attempt = 0; attempt < 500; attempt += 1) {
    const candidate =
      shuffledTentModes(base);

    const score =
      scoreTentSetDeck(candidate) +
      Math.random() * 0.15;

    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  const deck =
    (best ?? base).map(
      (entry, index) => ({
        ...entry,
        setIndex,
        round: index + 1
      })
    );

  tentDjLastMode =
    deck[deck.length - 1]?.mode ??
    tentDjLastMode;

  dbg(
    'tent frenzy DJ deck',
    {
      setIndex,
      deck: deck.map(entry => ({
        mode: entry.mode,
        followKind: entry.followKind ?? null,
        shapeId: entry.shapeId ?? null
      }))
    }
  );

  return deck;
}

function ensureTentFrenzySetDeck(setIndex) {
  if (!tentFrenzySetDecks.has(setIndex)) {
    tentFrenzySetDecks.set(
      setIndex,
      buildTentFrenzySetDeck(setIndex)
    );
  }

  return tentFrenzySetDecks.get(setIndex);
}

function getTentFrenzySetEntryForLine(
  lineNumber = linesWalked + 1
) {
  const phase =
    getTentFrenzyPhaseForLine(lineNumber);

  if (phase.kind !== 'tent-set') {
    return null;
  }

  const deck =
    ensureTentFrenzySetDeck(
      phase.setIndex
    );

  return (
    deck[phase.round - 1] ??
    null
  );
}

function isDinoFrenzyMode(mode = activeTrailMode) {
  return (
    mode === 'dino-connect' ||
    mode === 'dino-wall' ||
    mode === 'dino-danger' ||
    mode === 'dino-patrol' ||
    mode === 'dino-danger-patrol' ||
    mode === 'dino-boss'
  );
}

function isDinoPatrolMode(mode = activeTrailMode) {
  return (
    mode === 'dino-patrol' ||
    mode === 'dino-danger-patrol' ||
    mode === 'dino-boss'
  );
}

function isConnectTrailMode(mode = activeTrailMode) {
  return (
    mode === 'connect' ||
    mode === 'blocked-connect' ||
    isDinoFrenzyMode(mode)
  );
}

function getDinoAdventureRoundForLine(
  lineNumber = linesWalked + 1
) {
  const phase =
    getTentFrenzyPhaseForLine(lineNumber);

  return (
    phase.kind === 'dino'
      ? phase.round
      : 0
  );
}

function getDinoChapterForLine(
  lineNumber = linesWalked + 1
) {
  const phase =
    getTentFrenzyPhaseForLine(lineNumber);

  return (
    phase.kind === 'dino'
      ? phase.chapter
      : 0
  );
}

function getDinoModeForChapterRound(
  chapter,
  round
) {
  if (chapter <= 1) {
    if (round <= 3) return 'dino-connect';
    if (round <= 6) return 'dino-wall';
    return 'dino-danger';
  }

  if (chapter === 2) {
    if (round <= 3) return 'dino-wall';
    if (round <= 6) return 'dino-danger';
    if (round <= 8) return 'dino-patrol';
    return 'dino-danger-patrol';
  }

  if (chapter === 3) {
    if (round <= 3) return 'dino-danger';
    if (round <= 6) return 'dino-patrol';
    return 'dino-danger-patrol';
  }

  if (round <= 5) return 'dino-patrol';
  if (round <= 9) return 'dino-danger-patrol';
  return 'dino-boss';
}

function chooseTentTrailMode() {
  const lineNumber =
    linesWalked + 1;

  if (
    !bigLotActive ||
    lineNumber < TENT_FRENZY_LOOP_START_LINE
  ) {
    return 'follow';
  }

  const phase =
    getTentFrenzyPhaseForLine(lineNumber);

  if (phase.kind === 'tent-set') {
    return (
      getTentFrenzySetEntryForLine(
        lineNumber
      )?.mode ??
      'follow'
    );
  }

  if (phase.kind === 'dino') {
    return getDinoModeForChapterRound(
      phase.chapter,
      phase.round
    );
  }

  return 'follow';
}

function pickConnectEndpoints() {
  const { rows, cols } =
    getActiveTentGridDimensions();

  const horizontal =
    Math.random() < 0.5;

  if (horizontal) {
    const startRow =
      Math.floor(Math.random() * rows);

    const goalRow =
      Math.floor(Math.random() * rows);

    return {
      start: startRow * cols,
      goal: goalRow * cols + (cols - 1)
    };
  }

  const startCol =
    Math.floor(Math.random() * cols);

  const goalCol =
    Math.floor(Math.random() * cols);

  return {
    start: startCol,
    goal: (rows - 1) * cols + goalCol
  };
}

function connectLayoutHasPath(start, goal, blockers) {
  const queue = [start];
  const visited = new Set([start]);

  while (queue.length) {
    const current = queue.shift();

    if (current === goal) {
      return true;
    }

    for (const neighbor of getActiveTentNeighbors(current)) {
      if (visited.has(neighbor)) continue;
      if (blockers.has(neighbor)) continue;

      visited.add(neighbor);
      queue.push(neighbor);
    }
  }

  return false;
}

function findConnectPath(
  start,
  goal,
  blockedIndexes = new Set()
) {
  const queue = [start];
  const visited = new Set([start]);
  const previous = new Map();

  while (queue.length) {
    const current = queue.shift();

    if (current === goal) {
      const path = [];
      let cursor = goal;

      while (cursor !== undefined) {
        path.push(cursor);

        if (cursor === start) {
          break;
        }

        cursor =
          previous.get(cursor);
      }

      path.reverse();

      return (
        path[0] === start
          ? path
          : []
      );
    }

    for (
      const neighbor
      of getActiveTentNeighbors(current)
    ) {
      if (visited.has(neighbor)) {
        continue;
      }

      if (blockedIndexes.has(neighbor)) {
        continue;
      }

      visited.add(neighbor);
      previous.set(neighbor, current);
      queue.push(neighbor);
    }
  }

  return [];
}

function pickDinoFrenzyEndpoints(
  forceHorizontal = false
) {
  const { rows, cols } =
    getActiveTentGridDimensions();

  const horizontalTravel =
    forceHorizontal ||
    Math.random() < 0.5;

  if (horizontalTravel) {
    const startRow =
      Math.floor(Math.random() * rows);

    let goalRow =
      Math.floor(Math.random() * rows);

    if (goalRow === startRow) {
      goalRow =
        (goalRow + 2 + Math.floor(Math.random() * 3))
        % rows;
    }

    return {
      start: startRow * cols,
      goal: goalRow * cols + (cols - 1),
      horizontalTravel: true
    };
  }

  const startCol =
    Math.floor(Math.random() * cols);

  let goalCol =
    Math.floor(Math.random() * cols);

  if (goalCol === startCol) {
    goalCol =
      (goalCol + 2 + Math.floor(Math.random() * 2))
      % cols;
  }

  return {
    start: startCol,
    goal: (rows - 1) * cols + goalCol,
    horizontalTravel: false
  };
}

function tryAddStraightDinoBarrier(
  blockers,
  start,
  goal,
  horizontalTravel
) {
  const { rows, cols } =
    getActiveTentGridDimensions();

  const protectedIndexes =
    new Set([
      start,
      goal,
      ...getActiveTentNeighbors(start),
      ...getActiveTentNeighbors(goal)
    ]);

  for (
    let attempt = 0;
    attempt < 50;
    attempt += 1
  ) {
    const candidateCells = [];

    if (horizontalTravel) {
      /*
        Dino is travelling left ↔ right.
        Create a vertical wall segment with open space around it.
      */
      const col =
        1 +
        Math.floor(
          Math.random() *
          Math.max(1, cols - 2)
        );

      const length =
        3 +
        Math.floor(
          Math.random() * 3
        );

      const maxStart =
        Math.max(
          1,
          rows - length - 1
        );

      const startRow =
        1 +
        Math.floor(
          Math.random() *
          maxStart
        );

      for (
        let offset = 0;
        offset < length;
        offset += 1
      ) {
        const row =
          startRow + offset;

        if (row >= rows) {
          break;
        }

        candidateCells.push(
          row * cols + col
        );
      }
    } else {
      /*
        Dino is travelling top ↕ bottom.
        Create a horizontal wall segment.
      */
      const row =
        1 +
        Math.floor(
          Math.random() *
          Math.max(1, rows - 2)
        );

      const length =
        3 +
        Math.floor(
          Math.random() * 2
        );

      const maxStart =
        Math.max(
          1,
          cols - length - 1
        );

      const startCol =
        1 +
        Math.floor(
          Math.random() *
          maxStart
        );

      for (
        let offset = 0;
        offset < length;
        offset += 1
      ) {
        const col =
          startCol + offset;

        if (col >= cols) {
          break;
        }

        candidateCells.push(
          row * cols + col
        );
      }
    }

    if (
      candidateCells.length < 3 ||
      candidateCells.some(
        index =>
          protectedIndexes.has(index) ||
          blockers.has(index)
      )
    ) {
      continue;
    }

    const proposed =
      new Set([
        ...blockers,
        ...candidateCells
      ]);

    if (
      findConnectPath(
        start,
        goal,
        proposed
      ).length < 2
    ) {
      continue;
    }

    candidateCells.forEach(
      index =>
        blockers.add(index)
    );

    return true;
  }

  return false;
}

function buildDinoPatrolPath({
  blockers,
  hazards,
  start,
  goal,
  horizontalTravel,
  boss = false
}) {
  const { rows, cols } =
    getActiveTentGridDimensions();

  if (boss) {
    const middleColumns =
      cols >= 4
        ? [2, 3]
        : [Math.floor(cols / 2)];

    const col =
      middleColumns[
        Math.floor(
          Math.random() *
          middleColumns.length
        )
      ];

    return Array.from(
      { length: rows },
      (_, row) =>
        row * cols + col
    );
  }

  const forbidden =
    new Set([
      ...blockers,
      ...hazards,
      start,
      goal
    ]);

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const path = [];

    // Patrol tends to cross the natural direction of travel.
    if (horizontalTravel) {
      const col =
        1 +
        Math.floor(
          Math.random() *
          Math.max(1, cols - 2)
        );

      const length =
        Math.min(
          rows - 1,
          4 + Math.floor(Math.random() * 2)
        );

      const startRow =
        Math.floor(
          Math.random() *
          Math.max(1, rows - length + 1)
        );

      for (let offset = 0; offset < length; offset += 1) {
        path.push(
          (startRow + offset) * cols + col
        );
      }
    } else {
      const row =
        1 +
        Math.floor(
          Math.random() *
          Math.max(1, rows - 2)
        );

      const length =
        Math.min(
          cols - 1,
          4
        );

      const startCol =
        Math.floor(
          Math.random() *
          Math.max(1, cols - length + 1)
        );

      for (let offset = 0; offset < length; offset += 1) {
        path.push(
          row * cols + startCol + offset
        );
      }
    }

    if (
      path.length >= 3 &&
      !path.some(index => forbidden.has(index))
    ) {
      return path;
    }
  }

  return [];
}

// ============================================================
// SCMF_TENT_FRENZY_PASS_A_V1
//
// Final non-art Dino Frenzy fairness pass.
//
// Non-boss boards must:
//   - have a valid Dino -> fruit route
//   - give start/fruit breathing room
//   - remain solvable even if the ENTIRE patrol lane is treated
//     like a solid obstacle
//
// Boss is intentionally different:
//   open field + timed vertical crossing.
// ============================================================
function validateDinoFrenzyLayout({
  start,
  goal,
  blockers,
  hazards,
  patrolPath = [],
  boss = false
}) {

  const staticBlocked =
    new Set([
      ...blockers,
      ...hazards
    ]);


  if (
    staticBlocked.has(start) ||
    staticBlocked.has(goal)
  ) {
    return null;
  }


  const startOptions =
    getActiveTentNeighbors(start)
      .filter(
        index =>
          !staticBlocked.has(index)
      );


  const goalOptions =
    getActiveTentNeighbors(goal)
      .filter(
        index =>
          !staticBlocked.has(index)
      );


  /*
    Avoid visually trapped Dino / fruit endpoints.
  */
  if (
    startOptions.length < 2 ||
    goalOptions.length < 2
  ) {
    return null;
  }


  const staticSafePath =
    findConnectPath(
      start,
      goal,
      staticBlocked
    );


  if (
    staticSafePath.length < 2
  ) {
    return null;
  }


  /*
    Boss is deliberately a timing puzzle.
    No walls/fire are used there.
  */
  if (boss) {
    return staticSafePath;
  }


  /*
    Patrol fairness rule:

    Pretend the WHOLE patrol route is permanently blocked.

    Dino must still have a valid path to fruit.

    That means the moving creature can create danger and shortcuts,
    but cannot make the board fundamentally impossible.
  */
  if (
    Array.isArray(patrolPath) &&
    patrolPath.length
  ) {

    const permanentBlocked =
      new Set([
        ...staticBlocked,
        ...patrolPath
      ]);


    const permanentSafePath =
      findConnectPath(
        start,
        goal,
        permanentBlocked
      );


    if (
      permanentSafePath.length < 2
    ) {
      return null;
    }


    return permanentSafePath;
  }


  return staticSafePath;
}


function buildDinoFrenzyLayout(
  adventureRound,
  mode = activeTrailMode,
  chapterNumber = getDinoChapterForLine()
) {
  const boss =
    mode === 'dino-boss';

  for (let attempt = 0; attempt < 140; attempt += 1) {
    const {
      start,
      goal,
      horizontalTravel
    } =
      pickDinoFrenzyEndpoints(
        boss
      );

    const blockers = new Set();
    const hazards = new Set();

    let barrierCount = 0;

    if (mode === 'dino-wall') {
      barrierCount = 1;
    } else if (mode === 'dino-danger') {
      barrierCount =
        chapterNumber <= 1 && adventureRound < 9
          ? 1
          : 2;
    } else if (mode === 'dino-patrol') {
      barrierCount = 1;
    } else if (mode === 'dino-danger-patrol') {
      barrierCount =
        chapterNumber >= 3
          ? 2
          : 1;
    }

    if (!boss) {
      let barrierOK = true;

      for (let barrier = 0; barrier < barrierCount; barrier += 1) {
        const added =
          tryAddStraightDinoBarrier(
            blockers,
            start,
            goal,
            barrier === 0
              ? horizontalTravel
              : !horizontalTravel
          );

        if (!added) {
          barrierOK = false;
          break;
        }
      }

      if (!barrierOK) {
        continue;
      }
    }

    let safePath =
      findConnectPath(
        start,
        goal,
        blockers
      );

    if (safePath.length < 2) {
      continue;
    }

    const needsFire =
      mode === 'dino-danger' ||
      mode === 'dino-danger-patrol';

    if (needsFire) {
      const baseHazards =
        chapterNumber <= 1
          ? (adventureRound >= 9 ? 4 : 2 + Math.floor(Math.random() * 2))
          : Math.min(
              6,
              3 + Math.floor((chapterNumber - 2) / 2)
            );

      const protectedIndexes =
        new Set([
          start,
          goal,
          ...safePath,
          ...getActiveTentNeighbors(start),
          ...getActiveTentNeighbors(goal)
        ]);

      const candidates =
        gridEls
          .map((_, index) => index)
          .filter(
            index =>
              !blockers.has(index) &&
              !protectedIndexes.has(index)
          );

      while (
        hazards.size < baseHazards &&
        candidates.length
      ) {
        const pickIndex =
          Math.floor(
            Math.random() *
            candidates.length
          );

        const [candidate] =
          candidates.splice(
            pickIndex,
            1
          );

        hazards.add(candidate);
      }

      const dangerBlocked =
        new Set([
          ...blockers,
          ...hazards
        ]);

      safePath =
        findConnectPath(
          start,
          goal,
          dangerBlocked
        );

      if (safePath.length < 2) {
        continue;
      }
    }

    const patrolNeeded =
      isDinoPatrolMode(mode);

    const patrolPath =
      patrolNeeded
        ? buildDinoPatrolPath({
            blockers,
            hazards,
            start,
            goal,
            horizontalTravel,
            boss
          })
        : [];

    if (
      patrolNeeded &&
      patrolPath.length < 3
    ) {
      continue;
    }


    const validatedSafePath =
      validateDinoFrenzyLayout({
        start,
        goal,
        blockers,
        hazards,
        patrolPath,
        boss
      });


    /*
      Bad board?

      Throw it away and let the existing generation loop
      make another one before the player ever sees it.
    */
    if (!validatedSafePath) {
      continue;
    }


    safePath =
      validatedSafePath;


    return {
      start,
      goal,
      blockers,
      hazards,
      safePath,
      patrolPath,
      boss
    };
  }

  return null;
}

function renderDinoFrenzyObstacles() {
  blockedTentIndexes.forEach(
    index => {
      const cell =
        gridEls[index]?.cell;

      if (!cell) {
        return;
      }

      cell.classList.add(
        'kc-trail-blocked'
      );

      const blocker =
        document.createElement(
          'span'
        );

      blocker.className =
        'kc-trail-blocker kc-dino-wall';

      blocker.textContent =
        '🪵';

      cell.appendChild(
        blocker
      );
    }
  );

  hazardTentIndexes.forEach(
    index => {
      const cell =
        gridEls[index]?.cell;

      if (!cell) {
        return;
      }

      cell.classList.add(
        'kc-dino-hazard-cell'
      );

      const fire =
        document.createElement(
          'span'
        );

      fire.className =
        'kc-dino-fire';

      fire.textContent =
        '🔥';

      cell.appendChild(
        fire
      );
    }
  );
}

function configureDinoFrenzyMode(
  adventureRound
) {
  dinoChapterNumber =
    getDinoChapterForLine();

  const layout =
    buildDinoFrenzyLayout(
      adventureRound,
      activeTrailMode,
      dinoChapterNumber
    );

  if (!layout) {
    return false;
  }

  dinoAdventureRound =
    adventureRound;

  connectStartIndex =
    layout.start;

  connectGoalIndex =
    layout.goal;

  blockedTentIndexes =
    layout.blockers;

  hazardTentIndexes =
    layout.hazards;

  const fruitGoals =
    ['🍓', '🍎', '🍊', '🍌', '🍇', '🍉'];

  connectGoalIcon =
    fruitGoals[
      Math.floor(
        Math.random() *
        fruitGoals.length
      )
    ];

  connectPath = [];
  selectedTents.clear();
  activeLine = [];
  activeTargets = [];

  guidePath?.setAttribute(
    'd',
    ''
  );

  renderConnectEndpoints();
  renderDinoFrenzyObstacles();

  if (
    dinoChapterNumber === 1 &&
    adventureRound === 1 &&
    layout.safePath.length >= 2
  ) {
    dinoNudgeIndex =
      layout.safePath[1];

    gridEls[dinoNudgeIndex]
      ?.cell
      ?.classList
      .add('kc-dino-nudge');
  }

  if (isDinoPatrolMode()) {
    startDinoPatrol(
      layout.patrolPath,
      {
        boss: layout.boss,
        chapterNumber:
          dinoChapterNumber
      }
    );
  }

  if (refs.wrapper) {
    refs.wrapper.dataset.dinoFrenzy =
      'on';

    refs.wrapper.dataset.dinoFrenzyRound =
      String(adventureRound);

    refs.wrapper.dataset.dinoFrenzyChapter =
      String(dinoChapterNumber);
  }

  dbg(
    'dino frenzy board',
    {
      chapter:
        dinoChapterNumber,
      adventureRound,
      mode: activeTrailMode,
      start: connectStartIndex,
      goal: connectGoalIndex,
      fruit: connectGoalIcon,
      walls: [...blockedTentIndexes],
      fires: [...hazardTentIndexes],
      patrolPath: layout.patrolPath,
      boss: layout.boss,
      safePath: layout.safePath
    }
  );

  return true;
}

function clearDinoNudge() {
  if (dinoNudgeIndex >= 0) {
    gridEls[
      dinoNudgeIndex
    ]
      ?.cell
      ?.classList
      .remove(
        'kc-dino-nudge'
      );
  }

  dinoNudgeIndex = -1;
}

function resetDinoTrailAfterFire(
  fireIndex
) {
  const fireCell =
    gridEls[fireIndex]?.cell;

  fireCell?.classList.add(
    'kc-dino-fire-hit'
  );

  burstTentSparks(
    fireIndex,
    1.5
  );

  connectPath.forEach(
    index => {
      setTentLitForVariety(
        index,
        false
      );
    }
  );

  connectPath = [];
  selectedTents.clear();
  activeLine = [];
  activeTargets = [];

  guidePath?.setAttribute(
    'd',
    ''
  );

  window.setTimeout(
    () => {
      fireCell?.classList.remove(
        'kc-dino-fire-hit'
      );
    },
    420
  );

  dbg(
    'dino fire reset',
    {
      round:
        dinoAdventureRound,
      fireIndex
    }
  );
}

function stopDinoPatrol() {
  if (dinoPatrolTimerId) {
    clearInterval(dinoPatrolTimerId);
    dinoPatrolTimerId = 0;
  }

  dinoPatrolCreatureEl?.remove();
  dinoPatrolCreatureEl = null;

  refs.wrapper?.querySelectorAll(
    '.kc-dino-patrol-mark'
  ).forEach(el => el.remove());

  refs.wrapper?.querySelectorAll(
    '.kc-dino-patrol-cell, .kc-dino-boss-lane'
  ).forEach(el => {
    el.classList.remove(
      'kc-dino-patrol-cell',
      'kc-dino-boss-lane'
    );
  });

  dinoPatrolPath = [];
  dinoPatrolCursor = 0;
  dinoPatrolDirection = 1;
  dinoPatrolCreatureIndex = -1;
  dinoPatrolSpeedMs = 900;
  dinoPatrolBossActive = false;
}

function renderDinoPatrolCreature() {
  if (
    dinoPatrolCreatureIndex < 0 ||
    !gridEls[dinoPatrolCreatureIndex]?.cell
  ) {
    return;
  }

  if (!dinoPatrolCreatureEl) {
    dinoPatrolCreatureEl =
      document.createElement('span');

    dinoPatrolCreatureEl.className =
      'kc-dino-patrol-creature';
  }

  dinoPatrolCreatureEl.textContent =
    dinoPatrolBossActive
      ? '👹'
      : '👾';

  dinoPatrolCreatureEl.classList.toggle(
    'is-boss',
    dinoPatrolBossActive
  );

  gridEls[dinoPatrolCreatureIndex]
    .cell
    .appendChild(
      dinoPatrolCreatureEl
    );
}

function resetDinoTrailAfterPatrol(
  collisionIndex
) {
  const collisionCell =
    gridEls[collisionIndex]?.cell;

  collisionCell?.classList.add(
    'kc-dino-patrol-hit'
  );

  burstTentSparks(
    collisionIndex,
    dinoPatrolBossActive
      ? 2.1
      : 1.45
  );

  connectPath.forEach(index => {
    setTentLitForVariety(index, false);
  });

  connectPath = [];
  selectedTents.clear();
  activeLine = [];
  activeTargets = [];

  guidePath?.setAttribute('d', '');

  window.setTimeout(
    () => {
      collisionCell?.classList.remove(
        'kc-dino-patrol-hit'
      );
    },
    420
  );

  dbg(
    'dino patrol reset',
    {
      chapter: dinoChapterNumber,
      round: dinoAdventureRound,
      boss: dinoPatrolBossActive,
      collisionIndex
    }
  );
}

function advanceDinoPatrol() {
  if (
    !isDinoPatrolMode() ||
    isResolving ||
    dinoPatrolPath.length < 2
  ) {
    return;
  }

  let nextCursor =
    dinoPatrolCursor +
    dinoPatrolDirection;

  if (
    nextCursor >= dinoPatrolPath.length ||
    nextCursor < 0
  ) {
    dinoPatrolDirection *= -1;

    nextCursor =
      dinoPatrolCursor +
      dinoPatrolDirection;
  }

  dinoPatrolCursor =
    Math.max(
      0,
      Math.min(
        dinoPatrolPath.length - 1,
        nextCursor
      )
    );

  dinoPatrolCreatureIndex =
    dinoPatrolPath[
      dinoPatrolCursor
    ];

  renderDinoPatrolCreature();

  if (
    connectPath.length > 0 &&
    connectPath.includes(
      dinoPatrolCreatureIndex
    )
  ) {
    resetDinoTrailAfterPatrol(
      dinoPatrolCreatureIndex
    );
  }
}

function startDinoPatrol(
  path,
  {
    boss = false,
    chapterNumber = 1
  } = {}
) {
  stopDinoPatrol();

  if (!Array.isArray(path) || path.length < 2) {
    return;
  }

  dinoPatrolPath = [...path];
  dinoPatrolBossActive = boss;
  dinoPatrolCursor =
    Math.floor(
      dinoPatrolPath.length / 2
    );
  dinoPatrolDirection =
    Math.random() < 0.5
      ? -1
      : 1;

  dinoPatrolCreatureIndex =
    dinoPatrolPath[dinoPatrolCursor];

  dinoPatrolSpeedMs =
    boss
      ? Math.max(
          180,
          700 -
          Math.max(0, chapterNumber - 4) *
          75
        )
      : Math.max(
          480,
          880 -
          Math.max(0, chapterNumber - 2) *
          55
        );

  dinoPatrolPath.forEach(index => {
    const cell =
      gridEls[index]?.cell;

    if (!cell) return;

    cell.classList.add(
      'kc-dino-patrol-cell'
    );

    if (boss) {
      cell.classList.add(
        'kc-dino-boss-lane'
      );
    }

    const mark =
      document.createElement('span');

    mark.className =
      'kc-dino-patrol-mark';

    mark.textContent =
      boss ? '↕' : '•';

    cell.appendChild(mark);
  });

  renderDinoPatrolCreature();

  dinoPatrolTimerId =
    window.setInterval(
      advanceDinoPatrol,
      dinoPatrolSpeedMs
    );

  dbg(
    'dino patrol start',
    {
      chapterNumber,
      boss,
      speedMs: dinoPatrolSpeedMs,
      path: dinoPatrolPath
    }
  );
}




function buildConnectLayout(withBlockers) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const { start, goal } =
      pickConnectEndpoints();

    const blockers = new Set();

    if (withBlockers) {
      const protectedCells = new Set([
        start,
        goal,
        ...getActiveTentNeighbors(start),
        ...getActiveTentNeighbors(goal)
      ]);

      const blockerGoal =
        7 + Math.floor(Math.random() * 5);

      const candidates =
        gridEls
          .map((_, index) => index)
          .filter(index => !protectedCells.has(index));

      while (
        blockers.size < blockerGoal &&
        candidates.length
      ) {
        const pickIndex =
          Math.floor(Math.random() * candidates.length);

        const [candidate] =
          candidates.splice(pickIndex, 1);

        blockers.add(candidate);
      }

      if (!connectLayoutHasPath(start, goal, blockers)) {
        continue;
      }
    }

    return {
      start,
      goal,
      blockers
    };
  }

  return null;
}

function renderConnectEndpoints() {
  const startCell =
    gridEls[connectStartIndex]?.cell;

  const goalCell =
    gridEls[connectGoalIndex]?.cell;

  if (startCell) {
    startCell.classList.add('kc-connect-start-cell');

    const startBadge =
      document.createElement('span');

    startBadge.className =
      'kc-connect-endpoint kc-connect-start';

    startBadge.textContent = '🦖';
    startCell.appendChild(startBadge);
  }

  if (goalCell) {
    goalCell.classList.add('kc-connect-goal-cell');

    const goalBadge =
      document.createElement('span');

    goalBadge.className =
      'kc-connect-endpoint kc-connect-goal';

    goalBadge.textContent =
      connectGoalIcon;

    goalCell.appendChild(goalBadge);
  }
}

function renderTrailBlockers() {
  const blockerIcons =
    ['🪨', '🪵', '🔥'];

  blockedTentIndexes.forEach((index, order) => {
    const cell = gridEls[index]?.cell;
    if (!cell) return;

    cell.classList.add('kc-trail-blocked');

    const blocker =
      document.createElement('span');

    blocker.className =
      'kc-trail-blocker';

    blocker.textContent =
      blockerIcons[order % blockerIcons.length];

    cell.appendChild(blocker);
  });
}

function configureConnectTrailMode(withBlockers) {
  const layout =
    buildConnectLayout(withBlockers);

  if (!layout) {
    return false;
  }

  connectStartIndex =
    layout.start;

  connectGoalIndex =
    layout.goal;

  blockedTentIndexes =
    layout.blockers;

  hazardTentIndexes =
    new Set();

  const fruitGoals =
    [
      '🍓',
      '🍎',
      '🍊',
      '🍌',
      '🍇',
      '🍉'
    ];

  connectGoalIcon =
    fruitGoals[
      Math.floor(
        Math.random() *
        fruitGoals.length
      )
    ];

  connectPath = [];
  selectedTents.clear();
  activeLine = [];
  activeTargets = [];

  guidePath?.setAttribute(
    'd',
    ''
  );

  renderConnectEndpoints();

  if (withBlockers) {
    renderTrailBlockers();
  }

  return true;
}

function updateConnectRoutePresentation() {
  activeLine = [...connectPath];
  activeTargets = [...new Set(connectPath)];

  if (connectPath.length < 2) {
    guidePath?.setAttribute('d', '');
    return;
  }

  requestAnimationFrame(() => {
    drawLineWhenReady();
  });
}

function handleConnectTrailTap(index) {
  if (!isConnectTrailMode()) {
    return false;
  }

  if (
    isDinoPatrolMode() &&
    index === dinoPatrolCreatureIndex
  ) {
    if (connectPath.length > 0) {
      resetDinoTrailAfterPatrol(index);
    } else {
      wobbleTentChoice(index);
    }

    return true;
  }

  if (blockedTentIndexes.has(index)) {
    wobbleTentChoice(index);
    return true;
  }

  if (hazardTentIndexes.has(index)) {
    if (connectPath.length > 0) {
      resetDinoTrailAfterFire(index);
    } else {
      wobbleTentChoice(index);
    }

    return true;
  }

  if (connectPath.length === 0) {
    if (index === connectStartIndex) {
      clearDinoNudge();

      connectPath.push(index);
      selectedTents.add(index);
      setTentLitForVariety(index, true);
      burstTentSparks(index, 0.9);
      updateConnectRoutePresentation();

      return true;
    }

    /*
      Kid-friendly onboarding:

      In Dino Frenzy, a child can tap the first valid tent beside
      Dino without first tapping the Dino cell itself.

      We silently seed Dino as the route start, then accept the
      adjacent tent. This preserves both tap-tap and drag play.
    */
    if (
      isDinoFrenzyMode() &&
      getActiveTentNeighbors(
        connectStartIndex
      ).includes(index)
    ) {
      clearDinoNudge();

      connectPath.push(
        connectStartIndex
      );

      selectedTents.add(
        connectStartIndex
      );

      setTentLitForVariety(
        connectStartIndex,
        true
      );

      connectPath.push(index);
      selectedTents.add(index);
      setTentLitForVariety(index, true);
      burstTentSparks(index, 0.9);
      updateConnectRoutePresentation();

      if (index === connectGoalIndex) {
        checkIfSolved();
      }

      return true;
    }

    wobbleTentChoice(index);
    return true;
  }

  const lastIndex =
    connectPath[
      connectPath.length - 1
    ];

  if (index === lastIndex) {
    return true;
  }

  /*
    Friendly undo:
    tapping the previous tent backs up one step.
  */
  if (
    connectPath.length >= 2 &&
    index ===
      connectPath[
        connectPath.length - 2
      ]
  ) {
    const removed =
      connectPath.pop();

    if (
      removed !==
      connectStartIndex
    ) {
      selectedTents.delete(
        removed
      );

      setTentLitForVariety(
        removed,
        false
      );
    }

    updateConnectRoutePresentation();

    return true;
  }

  if (connectPath.includes(index)) {
    wobbleTentChoice(index);
    return true;
  }

  if (
    !getActiveTentNeighbors(
      lastIndex
    ).includes(index)
  ) {
    wobbleTentChoice(index);
    return true;
  }

  connectPath.push(index);
  selectedTents.add(index);
  setTentLitForVariety(index, true);
  burstTentSparks(index, 0.9);
  updateConnectRoutePresentation();

  if (index === connectGoalIndex) {
    checkIfSolved();
  }

  return true;
}

function spawnFrenzyTarget() {
  if (
    activeTrailMode !== 'frenzy' ||
    isResolving ||
    gridEls.length === 0
  ) {
    return;
  }

  if (frenzyTargetIndex >= 0) {
    const previous =
      gridEls[frenzyTargetIndex];

    previous?.cell?.classList.remove(
      'kc-frenzy-target'
    );

    if (!selectedTents.has(frenzyTargetIndex)) {
      setTentLitForVariety(frenzyTargetIndex, false);
    }
  }

  let nextIndex = frenzyTargetIndex;

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate =
      Math.floor(Math.random() * gridEls.length);

    if (candidate !== frenzyTargetIndex) {
      nextIndex = candidate;
      break;
    }
  }

  frenzyTargetIndex = nextIndex;

  const next =
    gridEls[frenzyTargetIndex];

  next?.cell?.classList.add(
    'kc-frenzy-target'
  );

  setTentLitForVariety(
    frenzyTargetIndex,
    true
  );
}


// ============================================================
// SCMF_TENT_FRENZY_POW_V1
// SCMF_TENT_FRENZY_COUNTUP_V1
// Immediate visual confirmation for a successful Frenzy whack.
//
// One hit now communicates three things at once:
//   1. the tent squash-pops
//   2. two neon shockwave rings blast outward
//   3. a quick POW! stamp rises from the exact hit location
//
// Event-only DOM. Everything self-removes in under one second.
// ============================================================
function playFrenzyHitConfirmation(index, hitNumber) {
  const wrapper =
    refs.wrapper;

  const cell =
    gridEls[index]?.cell;

  if (!wrapper || !cell) {
    return;
  }

  const wrapperRect =
    wrapper.getBoundingClientRect();

  const cellRect =
    cell.getBoundingClientRect();

  if (
    wrapperRect.width <= 0 ||
    wrapperRect.height <= 0 ||
    cellRect.width <= 0 ||
    cellRect.height <= 0
  ) {
    return;
  }

  cell.classList.remove(
    'kc-frenzy-hit-pop'
  );

  void cell.offsetWidth;

  cell.classList.add(
    'kc-frenzy-hit-pop'
  );

  const centerX =
    cellRect.left -
    wrapperRect.left +
    cellRect.width / 2;

  const centerY =
    cellRect.top -
    wrapperRect.top +
    cellRect.height / 2;

  const pow =
    document.createElement(
      'div'
    );

  pow.className =
    'kc-frenzy-pow';

  pow.style.left =
    `${centerX}px`;

  pow.style.top =
    `${centerY}px`;

  const ringOne =
    document.createElement(
      'span'
    );

  ringOne.className =
    'kc-frenzy-pow-ring kc-frenzy-pow-ring-a';

  const ringTwo =
    document.createElement(
      'span'
    );

  ringTwo.className =
    'kc-frenzy-pow-ring kc-frenzy-pow-ring-b';

  const stamp =
    document.createElement(
      'span'
    );

  stamp.className =
    'kc-frenzy-pow-stamp';

  stamp.textContent =
    String(hitNumber);

  pow.appendChild(ringOne);
  pow.appendChild(ringTwo);
  pow.appendChild(stamp);
  wrapper.appendChild(pow);

  if (
    hitNumber >=
    TENT_FRENZY_GOAL_HITS
  ) {
    refs.wrapper
      ?.querySelector(
        '.kc-frenzy-count-finale'
      )
      ?.remove();

    const finale =
      document.createElement(
        'div'
      );

    finale.className =
      'kc-frenzy-count-finale';

    const topLine =
      document.createElement(
        'span'
      );

    topLine.textContent =
      'TENT';

    const bottomLine =
      document.createElement(
        'strong'
      );

    bottomLine.textContent =
      'FRENZY!';

    finale.appendChild(
      topLine
    );

    finale.appendChild(
      bottomLine
    );

    wrapper.appendChild(
      finale
    );

    /*
      Full two-second payoff.

      Resolution timing also holds the next round for two seconds,
      so this title is never yanked out from underneath the player.
    */
    window.setTimeout(
      () => {
        finale.remove();
      },
      2050
    );
  }

  window.setTimeout(
    () => {
      cell.classList.remove(
        'kc-frenzy-hit-pop'
      );
    },
    380
  );

  window.setTimeout(
    () => {
      pow.remove();
    },
    760
  );
}

function configureFrenzyMode() {
  selectedTents.clear();
  activeLine = [];
  activeTargets = [];
  frenzyHits = 0;
  frenzyHitPath = [];
  frenzyTargetIndex = -1;

  guidePath?.setAttribute('d', '');

  spawnFrenzyTarget();

  frenzyTimerId =
    window.setInterval(
      spawnFrenzyTarget,
      900
    );
}

function handleFrenzyTap(index) {
  if (activeTrailMode !== 'frenzy') {
    return false;
  }

  if (index !== frenzyTargetIndex) {
    wobbleTentChoice(index);
    return true;
  }

  const hitIndex = index;

  // Stop the roaming timer for one readable hit beat.
  // We re-arm it after the POW so a timer tick cannot silently
  // move the next target underneath the confirmation animation.
  if (frenzyTimerId) {
    clearInterval(frenzyTimerId);
    frenzyTimerId = 0;
  }

  gridEls[hitIndex]
    ?.cell
    ?.classList
    .remove('kc-frenzy-target');

  frenzyTargetIndex = -1;
  frenzyHits += 1;
  frenzyHitPath.push(hitIndex);

  burstTentSparks(hitIndex, 1.65);
  playFrenzyHitConfirmation(hitIndex, frenzyHits);
  setTentLitForVariety(hitIndex, true);

  updateTentLineHud();

  if (frenzyHits >= TENT_FRENZY_GOAL_HITS) {
    activeTargets =
      [...new Set(frenzyHitPath)];

    activeTargets.forEach(targetIndex => {
      selectedTents.add(targetIndex);
      setTentLitForVariety(targetIndex, true);
    });

    checkIfSolved();
    return true;
  }

  // Give the successful whack enough screen time to read as
  // cause -> effect before the next glowing tent appears.
  window.setTimeout(() => {
    if (
      activeTrailMode !== 'frenzy' ||
      isResolving
    ) {
      return;
    }

    if (!selectedTents.has(hitIndex)) {
      setTentLitForVariety(hitIndex, false);
    }

    spawnFrenzyTarget();

    frenzyTimerId =
      window.setInterval(
        spawnFrenzyTarget,
        900
      );
  }, 260);

  return true;
}

function handleTentVarietyTap(index) {
  if (handleConnectTrailTap(index)) {
    return true;
  }

  if (handleFrenzyTap(index)) {
    return true;
  }

  return false;
}

function getTentLineHudLabel() {
  if (activeTrailMode === 'mystery') {
    return 'WALK 1 → 2 → 3';
  }

  if (isDinoFrenzyMode()) {
    return (
      `DINO ${tentRomanNumeral(dinoChapterNumber || 1)} ` +
      `${dinoAdventureRound}/${DINO_FRENZY_ROUNDS}`
    );
  }

  if (activeTrailMode === 'connect') {
    return `CONNECT 🦖 → ${connectGoalIcon}`;
  }

  if (activeTrailMode === 'blocked-connect') {
    return `SAFE TRAIL 🦖 → ${connectGoalIcon}`;
  }

  if (activeTrailMode === 'frenzy') {
    return (
      `TENT FRENZY ` +
      `${frenzyHits}/${TENT_FRENZY_GOAL_HITS}`
    );
  }

  return (
    activePattern?.label ??
    activeRouteFamily?.toUpperCase() ??
    'TRAIL'
  );
}

function getTentLineSuccessMessage(
  expandingLotNow,
  solvedByAll
) {
  /*
    FIELD EXPANDED, TENT FRENZY finale and ADVENTURE COMPLETE
    use dedicated center-stage overlays with their own timing.
  */
  if (
    expandingLotNow ||
    activeTrailMode === 'frenzy'
  ) {
    return '';
  }

  if (activeTrailMode === 'mystery') {
    return '✨ TRAIL REVEALED!';
  }

  if (isDinoFrenzyMode()) {
    return `🍓 FOUND!`;
  }

  if (activeTrailMode === 'connect') {
    return '🦖 TRAIL CONNECTED!';
  }

  if (
    activeTrailMode ===
    'blocked-connect'
  ) {
    return '🪨 SAFE TRAIL!';
  }

  if (
    activeRouteFamily ===
    'contour'
  ) {
    return (
      `✨ ` +
      `${activePattern?.label ?? 'SHAPE'}!`
    );
  }

  if (solvedByAll) {
    return '🌟 Everything Lit! Nice!';
  }

  return '✅ Good Job!';
}

/*
  SCMF_TENT_ROUTE_VARIANTS_V1
  upgraded by ROUTE_ZOO_V3 below.
*/

/*
  SCMF_TENT_ROUTE_VARIANTS_V1

  Increase visual variety without inventing messy geometry.

  We take the existing approved route shapes and make legal
  translated copies:

      one row UP
      one row DOWN
      one column LEFT
      one column RIGHT

  Every point moves by the exact same offset.

  Therefore:
    triangle stays the exact same triangle
    box stays the exact same box
    crazy path stays the exact same path

  Only its LOCATION changes.

  Any translation that would leave the 4x6 board is rejected.

  Duplicate paths are removed automatically.
*/
const ROUTE_GRID_ROWS = 6;
const ROUTE_GRID_COLS = 4;


/*
  Shape-preserving transforms.

  No 90° rotation because the board is 4x6 rather than square.

  These all preserve the exact geometry safely:
    identity
    horizontal mirror
    vertical mirror
    180° rotation
*/
const ROUTE_TRANSFORMS =
  Object.freeze([

    Object.freeze({
      id: 'base',

      apply(row, col) {
        return {
          row,
          col
        };
      }
    }),

    Object.freeze({
      id: 'mirror-h',

      apply(row, col) {
        return {
          row,
          col:
            ROUTE_GRID_COLS - 1 - col
        };
      }
    }),

    Object.freeze({
      id: 'mirror-v',

      apply(row, col) {
        return {
          row:
            ROUTE_GRID_ROWS - 1 - row,

          col
        };
      }
    }),

    Object.freeze({
      id: 'rotate-180',

      apply(row, col) {
        return {
          row:
            ROUTE_GRID_ROWS - 1 - row,

          col:
            ROUTE_GRID_COLS - 1 - col
        };
      }
    })
  ]);


function transformRoutePattern(
  pattern,
  transform
) {

  const transformedPath =
    pattern.path.map(index => {

      const row =
        Math.floor(
          index / ROUTE_GRID_COLS
        );

      const col =
        index % ROUTE_GRID_COLS;

      const next =
        transform.apply(
          row,
          col
        );

      return (
        next.row *
        ROUTE_GRID_COLS
      ) + next.col;
    });


  return makeRoutePattern(
    `${pattern.id}-${transform.id}`,
    pattern.family,
    pattern.label,
    transformedPath
  );
}


function translateRoutePattern(
  pattern,
  rowOffset,
  colOffset,
  suffix
) {

  if (
    rowOffset === 0 &&
    colOffset === 0
  ) {

    return makeRoutePattern(
      `${pattern.id}-${suffix}`,
      pattern.family,
      pattern.label,
      pattern.path
    );
  }


  const shiftedPath = [];

  for (
    const index
    of pattern.path
  ) {

    const row =
      Math.floor(
        index / ROUTE_GRID_COLS
      );

    const col =
      index %
      ROUTE_GRID_COLS;

    const nextRow =
      row + rowOffset;

    const nextCol =
      col + colOffset;


    if (
      nextRow < 0 ||
      nextRow >= ROUTE_GRID_ROWS ||
      nextCol < 0 ||
      nextCol >= ROUTE_GRID_COLS
    ) {
      return null;
    }


    shiftedPath.push(
      (
        nextRow *
        ROUTE_GRID_COLS
      ) + nextCol
    );
  }


  return makeRoutePattern(
    `${pattern.id}-${suffix}`,
    pattern.family,
    pattern.label,
    shiftedPath
  );
}


/*
  Geometry key.

  We compare:
    unique tents
    +
    undirected line segments

  Therefore the SAME visual shape does not get duplicated
  just because it was traversed:
    backwards
    from a different starting point
    by another canonical source pattern
*/
function makeRouteGeometryKey(
  path
) {

  const vertices =
    [...new Set(path)]
      .sort(
        (a, b) =>
          a - b
      );


  const edges = [];

  for (
    let i = 1;
    i < path.length;
    i += 1
  ) {

    const a =
      path[i - 1];

    const b =
      path[i];

    const low =
      Math.min(a, b);

    const high =
      Math.max(a, b);

    edges.push(
      `${low}-${high}`
    );
  }


  edges.sort();


  return (
    vertices.join('.')
    +
    '|'
    +
    edges.join('.')
  );
}


/*
  Expand every intentional base shape into every legal
  equivalent placement.

  Example:

      □

  can become:

      □      □
             □

  wherever it fits.

  Same geometry.
  Different festival-lot location.
*/
function expandRouteFamilyWithTranslations(
  patterns
) {

  const expanded = [];

  const seenGeometry =
    new Set();


  for (
    const pattern
    of patterns
  ) {

    for (
      const transform
      of ROUTE_TRANSFORMS
    ) {

      const transformed =
        transformRoutePattern(
          pattern,
          transform
        );


      const rows =
        transformed.path.map(
          index =>
            Math.floor(
              index /
              ROUTE_GRID_COLS
            )
        );

      const cols =
        transformed.path.map(
          index =>
            index %
            ROUTE_GRID_COLS
        );


      const minRow =
        Math.min(...rows);

      const maxRow =
        Math.max(...rows);

      const minCol =
        Math.min(...cols);

      const maxCol =
        Math.max(...cols);


      /*
        Calculate EVERY offset that keeps the shape
        inside the 4x6 board.
      */
      const minRowOffset =
        -minRow;

      const maxRowOffset =
        (
          ROUTE_GRID_ROWS - 1
        ) - maxRow;

      const minColOffset =
        -minCol;

      const maxColOffset =
        (
          ROUTE_GRID_COLS - 1
        ) - maxCol;


      for (
        let rowOffset =
          minRowOffset;

        rowOffset <=
          maxRowOffset;

        rowOffset += 1
      ) {

        for (
          let colOffset =
            minColOffset;

          colOffset <=
            maxColOffset;

          colOffset += 1
        ) {

          const translated =
            translateRoutePattern(

              transformed,

              rowOffset,

              colOffset,

              `r${rowOffset}`
              +
              `c${colOffset}`
            );


          if (!translated) {
            continue;
          }


          const geometryKey =
            makeRouteGeometryKey(
              translated.path
            );


          if (
            seenGeometry.has(
              geometryKey
            )
          ) {
            continue;
          }


          seenGeometry.add(
            geometryKey
          );

          expanded.push(
            translated
          );
        }
      }
    }
  }


  return Object.freeze(
    expanded
  );
}

/*
  These become the actual gameplay pools.

  The original ROUTE_PATTERNS remain untouched as the
  canonical shape library.
*/
const ROUTE_POOLS =
  Object.freeze({

    /*
      SCMF_TENT_FULL_SPAN_STRAIGHTS_V1
      Straight means edge-to-edge. No shorties.
    */
    straight:
      Object.freeze(
        ROUTE_PATTERNS.straight.filter(
          pattern =>
            !pattern.id.includes('short') &&
            !pattern.id.includes('medium')
        )
      ),

    triangle:
      expandRouteFamilyWithTranslations(
        ROUTE_PATTERNS.triangle
      ),

    box:
      expandRouteFamilyWithTranslations(
        ROUTE_PATTERNS.box
      ),

    crazy:
      expandRouteFamilyWithTranslations(
        ROUTE_PATTERNS.crazy
      )
  });


const ALL_ROUTE_PATTERNS =
  Object.freeze([
    ...ROUTE_POOLS.straight,
    ...ROUTE_POOLS.triangle,
    ...ROUTE_POOLS.box,
    ...ROUTE_POOLS.crazy
  ]);

dbg(
  'route zoo ready',
  {
    straight:
      ROUTE_POOLS
        .straight
        .length,

    triangle:
      ROUTE_POOLS
        .triangle
        .length,

    box:
      ROUTE_POOLS
        .box
        .length,

    crazy:
      ROUTE_POOLS
        .crazy
        .length,

    curatedTotal:
      ALL_ROUTE_PATTERNS
        .length,

    endlessProcedural:
      true
  }
);


/*
  Progression:

  1–5    STRAIGHT
  6–10   TRIANGLE
  11–15  BOX
  16–20  CRAZY
  21+    entire handcrafted library
*/
function getRoutePoolForNextLine() {
  const nextLineNumber = linesWalked + 1;

  if (nextLineNumber <= 5) {
    return ROUTE_POOLS.straight;
  }

  if (nextLineNumber <= 10) {
    return ROUTE_POOLS.triangle;
  }

  if (nextLineNumber <= 15) {
    return ROUTE_POOLS.box;
  }

  if (nextLineNumber <= 20) {
    return ROUTE_POOLS.crazy;
  }

  return ALL_ROUTE_PATTERNS;
}


function chooseRoutePattern(pool) {

  if (
    !Array.isArray(pool) ||
    pool.length === 0
  ) {

    return (
      ROUTE_POOLS
        ?.straight
        ?.[0]
      ??
      ROUTE_PATTERNS
        .straight[0]
    );
  }


  /*
    Avoid immediate exact repeat.
  */
  const choices =
    pool.length > 1

      ? pool.filter(
          pattern =>
            pattern.id !==
            lastPatternId
        )

      : pool;


  const safeChoices =
    choices.length > 0
      ? choices
      : pool;


  return safeChoices[
    Math.floor(
      Math.random() *
      safeChoices.length
    )
  ];
}


// ============================================================
// ENDLESS PROCEDURAL CRAZY ROUTES
//
// Used only after Line 20.
//
// This does NOT randomly connect arbitrary tents.
//
// Every generated step moves to a neighboring tent:
//
//   horizontal
//   vertical
//   diagonal
//
// Therefore the route always reads as one continuous walk.
// ============================================================

let proceduralRouteSerial =
  0;


let recentProceduralRouteKeys =
  [];


function getTentNeighbors(
  index
) {

  const row =
    Math.floor(
      index /
      ROUTE_GRID_COLS
    );

  const col =
    index %
    ROUTE_GRID_COLS;


  const neighbors =
    [];


  for (
    let rowDelta = -1;
    rowDelta <= 1;
    rowDelta += 1
  ) {

    for (
      let colDelta = -1;
      colDelta <= 1;
      colDelta += 1
    ) {

      if (
        rowDelta === 0 &&
        colDelta === 0
      ) {
        continue;
      }


      const nextRow =
        row + rowDelta;

      const nextCol =
        col + colDelta;


      if (
        nextRow < 0 ||
        nextRow >= ROUTE_GRID_ROWS ||
        nextCol < 0 ||
        nextCol >= ROUTE_GRID_COLS
      ) {
        continue;
      }


      neighbors.push(
        (
          nextRow *
          ROUTE_GRID_COLS
        ) + nextCol
      );
    }
  }


  return neighbors;
}


function getRouteDirection(
  from,
  to
) {

  const fromRow =
    Math.floor(
      from /
      ROUTE_GRID_COLS
    );

  const fromCol =
    from %
    ROUTE_GRID_COLS;

  const toRow =
    Math.floor(
      to /
      ROUTE_GRID_COLS
    );

  const toCol =
    to %
    ROUTE_GRID_COLS;


  return {
    row:
      Math.sign(
        toRow -
        fromRow
      ),

    col:
      Math.sign(
        toCol -
        fromCol
      )
  };
}


function countRouteTurns(
  path
) {

  if (
    path.length < 3
  ) {
    return 0;
  }


  let turns =
    0;


  let previousDirection =
    getRouteDirection(
      path[0],
      path[1]
    );


  for (
    let i = 2;
    i < path.length;
    i += 1
  ) {

    const direction =
      getRouteDirection(
        path[i - 1],
        path[i]
      );


    if (
      direction.row !==
        previousDirection.row
      ||
      direction.col !==
        previousDirection.col
    ) {

      turns += 1;
    }


    previousDirection =
      direction;
  }


  return turns;
}


function isNeighborTent(
  a,
  b
) {

  return (
    getTentNeighbors(a)
      .includes(b)
  );
}


function rememberProceduralRoute(
  geometryKey
) {

  recentProceduralRouteKeys.push(
    geometryKey
  );


  /*
    Avoid obvious recent repeats,
    but do not grow memory forever.
  */
  if (
    recentProceduralRouteKeys.length >
    24
  ) {

    recentProceduralRouteKeys.shift();
  }
}



/*
  Reject routes whose segments cross in open space.

  Lines may meet at a real tent.

  They may NOT visually cross between tents.
*/
function routeHasOpenSpaceCrossover(
  path
) {

  function pointForTent(
    index
  ) {

    return {
      x:
        index %
        ROUTE_GRID_COLS,

      y:
        Math.floor(
          index /
          ROUTE_GRID_COLS
        )
    };
  }


  function orientation(
    a,
    b,
    c
  ) {

    return (
      (
        b.x -
        a.x
      )
      *
      (
        c.y -
        a.y
      )
    )
    -
    (
      (
        b.y -
        a.y
      )
      *
      (
        c.x -
        a.x
      )
    );
  }


  function segmentsCross(
    aIndex,
    bIndex,
    cIndex,
    dIndex
  ) {

    /*
      Meeting at a real tent is legal.
    */
    if (
      aIndex === cIndex ||
      aIndex === dIndex ||
      bIndex === cIndex ||
      bIndex === dIndex
    ) {
      return false;
    }


    const a =
      pointForTent(
        aIndex
      );

    const b =
      pointForTent(
        bIndex
      );

    const c =
      pointForTent(
        cIndex
      );

    const d =
      pointForTent(
        dIndex
      );


    const o1 =
      orientation(
        a,
        b,
        c
      );

    const o2 =
      orientation(
        a,
        b,
        d
      );

    const o3 =
      orientation(
        c,
        d,
        a
      );

    const o4 =
      orientation(
        c,
        d,
        b
      );


    /*
      Proper interior intersection.

      Procedural routes use neighboring tents and unique
      visited tents, so collinear-overlap cases are already
      structurally avoided.
    */
    return (
      (
        (
          o1 > 0 &&
          o2 < 0
        )
        ||
        (
          o1 < 0 &&
          o2 > 0
        )
      )
      &&
      (
        (
          o3 > 0 &&
          o4 < 0
        )
        ||
        (
          o3 < 0 &&
          o4 > 0
        )
      )
    );
  }


  for (
    let first = 0;
    first <
      path.length - 1;
    first += 1
  ) {

    for (
      let second =
        first + 1;

      second <
        path.length - 1;

      second += 1
    ) {

      if (
        segmentsCross(
          path[first],
          path[first + 1],
          path[second],
          path[second + 1]
        )
      ) {

        return true;
      }
    }
  }


  return false;
}


function createProceduralCrazyPattern() {

  /*
    Try several candidate walks.

    Most succeed immediately.

    Retries let us reject:
      tiny boring walks
      nearly-straight paths
      trapped dead ends
      recent duplicates
  */
  for (
    let attempt = 0;
    attempt < 60;
    attempt += 1
  ) {

    const desiredLength =
      6
      +
      Math.floor(
        Math.random() *
        7
      );
      // 6–12 unique tents


    const start =
      Math.floor(
        Math.random() *
        GRID_SIZE
      );


    const path =
      [start];


    const used =
      new Set(
        [start]
      );


    while (
      path.length <
      desiredLength
    ) {

      const current =
        path[
          path.length - 1
        ];


      const candidates =
        getTentNeighbors(
          current
        )
        .filter(
          index =>
            !used.has(index)
        );


      if (
        candidates.length === 0
      ) {
        break;
      }


      const previous =
        path.length >= 2
          ? path[
              path.length - 2
            ]
          : null;


      const previousDirection =
        previous !== null

          ? getRouteDirection(
              previous,
              current
            )

          : null;


      /*
        Prefer turns slightly.

        This prevents procedural mode from accidentally
        becoming mostly boring straight-ish walks.

        Randomness still matters strongly.
      */
      const scored =
        candidates.map(
          candidate => {

            let score =
              Math.random() *
              2;


            const direction =
              getRouteDirection(
                current,
                candidate
              );


            if (
              previousDirection
              &&
              (
                direction.row !==
                  previousDirection.row
                ||
                direction.col !==
                  previousDirection.col
              )
            ) {

              score +=
                1.25;
            }


            /*
              Tiny diagonal preference helps generate
              festival-walk geometry instead of boxy mazes.
            */
            if (
              direction.row !== 0 &&
              direction.col !== 0
            ) {

              score +=
                0.25;
            }


            return {
              candidate,
              score
            };
          }
        )
        .sort(
          (a, b) =>
            b.score -
            a.score
        );


      /*
        Usually choose the strongest candidate,
        but sometimes pick #2 for organic variety.
      */
      const choiceIndex =
        (
          scored.length > 1 &&
          Math.random() <
            0.28
        )
          ? 1
          : 0;


      const next =
        scored[
          choiceIndex
        ].candidate;


      path.push(
        next
      );

      used.add(
        next
      );
    }


    /*
      Reject incomplete attempts.
    */
    if (
      path.length <
      desiredLength
    ) {
      continue;
    }


    const rows =
      path.map(
        index =>
          Math.floor(
            index /
            ROUTE_GRID_COLS
          )
      );


    const cols =
      path.map(
        index =>
          index %
          ROUTE_GRID_COLS
      );


    const rowSpan =
      Math.max(...rows)
      -
      Math.min(...rows);


    const colSpan =
      Math.max(...cols)
      -
      Math.min(...cols);


    /*
      A "crazy" route should actually travel around.
    */
    if (
      rowSpan < 2 &&
      colSpan < 2
    ) {
      continue;
    }


    if (
      countRouteTurns(path) <
      2
    ) {
      continue;
    }


    /*
      Occasionally close the route into a loop when
      the final tent naturally neighbors the first.

      targets stays unique automatically.
    */
    if (
      path.length >= 7
      &&
      isNeighborTent(
        path[
          path.length - 1
        ],
        path[0]
      )
      &&
      Math.random() <
        0.24
    ) {

      path.push(
        path[0]
      );
    }


    /*
      Keep generated Crazy routes visually clean.

      If two route segments cross between tents,
      throw this candidate away and generate another.
    */
    if (
      routeHasOpenSpaceCrossover(
        path
      )
    ) {
      continue;
    }


    const geometryKey =
      makeRouteGeometryKey(
        path
      );


    if (
      recentProceduralRouteKeys
        .includes(
          geometryKey
        )
    ) {
      continue;
    }


    rememberProceduralRoute(
      geometryKey
    );


    proceduralRouteSerial +=
      1;


    return makeRoutePattern(
      `procedural-crazy-${proceduralRouteSerial}`,
      'crazy',
      'CRAZY',
      path
    );
  }


  /*
    Extremely defensive fallback.

    Never block gameplay if procedural generation fails.
  */
  return chooseRoutePattern(
    ROUTE_POOLS.crazy
  );
}


function makeBigLotStraightPattern() {
  const routes = [];

  for (let row = 0; row < BIG_LOT_ROWS; row += 1) {
    routes.push(makeRoutePattern(
      `big-row-${row}`, 'straight', 'STRAIGHT',
      Array.from(
        { length: BIG_LOT_COLS },
        (_, col) => row * BIG_LOT_COLS + col
      )
    ));
  }

  for (let col = 0; col < BIG_LOT_COLS; col += 1) {
    routes.push(makeRoutePattern(
      `big-col-${col}`, 'straight', 'STRAIGHT',
      Array.from(
        { length: BIG_LOT_ROWS },
        (_, row) => row * BIG_LOT_COLS + col
      )
    ));
  }

  for (
    let startRow = 0;
    startRow <= BIG_LOT_ROWS - BIG_LOT_COLS;
    startRow += 1
  ) {
    routes.push(makeRoutePattern(
      `big-diag-down-${startRow}`, 'straight', 'STRAIGHT',
      Array.from(
        { length: BIG_LOT_COLS },
        (_, step) =>
          (startRow + step) * BIG_LOT_COLS + step
      )
    ));
  }

  for (
    let startRow = BIG_LOT_COLS - 1;
    startRow < BIG_LOT_ROWS;
    startRow += 1
  ) {
    routes.push(makeRoutePattern(
      `big-diag-up-${startRow}`, 'straight', 'STRAIGHT',
      Array.from(
        { length: BIG_LOT_COLS },
        (_, step) =>
          (startRow - step) * BIG_LOT_COLS + step
      )
    ));
  }

  return chooseRoutePattern(routes);
}

function remapPatternToBigLot(pattern) {
  const rows =
    pattern.path.map(
      index => Math.floor(index / ROUTE_GRID_COLS)
    );

  const cols =
    pattern.path.map(
      index => index % ROUTE_GRID_COLS
    );

  const minRow = Math.min(...rows);
  const maxRow = Math.max(...rows);
  const minCol = Math.min(...cols);
  const maxCol = Math.max(...cols);

  const rowOffset =
    Math.floor(
      Math.random() *
      (BIG_LOT_ROWS - (maxRow - minRow))
    );

  const colOffset =
    Math.floor(
      Math.random() *
      (BIG_LOT_COLS - (maxCol - minCol))
    );

  const path =
    pattern.path.map(index => {
      const row =
        Math.floor(index / ROUTE_GRID_COLS)
        - minRow
        + rowOffset;

      const col =
        index % ROUTE_GRID_COLS
        - minCol
        + colOffset;

      return row * BIG_LOT_COLS + col;
    });

  return makeRoutePattern(
    `big-${pattern.id}-r${rowOffset}c${colOffset}`,
    pattern.family,
    pattern.label,
    path
  );
}


// ============================================================
// BIG LOT CONTOUR ART
// 6 columns × 8 rows
//
// These routes are intentionally recognizable silhouettes.
// They remain normal Tent Frenzy routes: follow, light, celebrate.
// ============================================================
const BIG_LOT_CONTOUR_PATTERNS = Object.freeze([
  makeRoutePattern(
    'big-contour-heart-up',
    'contour',
    'HEART',
    [44,37,30,24,18,12,7,1,8,15,10,4,11,17,23,29,34,39,44]
  ),

  makeRoutePattern(
    'big-contour-tent',
    'contour',
    'TENT',
    [44,37,30,24,18,13,8,3,10,17,23,29,35,41,47,46,45,44]
  ),

  makeRoutePattern(
    'big-contour-arrow-up',
    'contour',
    'ARROW',
    [2,7,12,13,19,25,31,37,43,44,38,32,26,20,14,15,16,11]
  ),

  makeRoutePattern(
    'big-contour-diamond',
    'contour',
    'DIAMOND',
    [2,9,16,23,28,33,38,43,36,31,24,19,12,7,2]
  ),

  makeRoutePattern(
    'big-contour-tree',
    'contour',
    'TREE',
    [2,7,12,13,8,14,19,24,25,20,26,31,36,37,38,39,40,34,28,29,23,17,11,10,5]
  ),

  makeRoutePattern(
    'big-contour-snowcone',
    'contour',
    'SNOWCONE',
    [1,2,3,4,10,16,22,28,34,39,44,37,30,24,18,12,6,1]
  ),

  makeRoutePattern(
    'big-contour-crown',
    'contour',
    'CROWN',
    [42,36,30,24,18,12,6,1,8,3,10,5,11,17,23,29,35,41,47,46,45,44,43,42]
  ),

  makeRoutePattern(
    'big-contour-lightning',
    'contour',
    'LIGHTNING',
    [1,8,14,20,26,32,27,34,40,46,39,33,28,22,16,10,4]
  )
]);

function chooseBigLotContourPattern() {
  return chooseRoutePattern(
    BIG_LOT_CONTOUR_PATTERNS
  );
}

function getBigLotContourPatternById(id) {
  return (
    BIG_LOT_CONTOUR_PATTERNS.find(
      pattern => pattern.id === id
    ) ??
    null
  );
}

function getTentVisualKey(pattern) {
  if (!pattern) return '';

  return String(pattern.id ?? '')
    .replace(/^big-/, '')
    .replace(/-r\d+c\d+$/, '');
}

function rememberTentDjPattern(pattern) {
  if (!pattern) return;

  tentDjRecentVisuals.push({
    id: pattern.id,
    key: getTentVisualKey(pattern),
    family: pattern.family,
    label: pattern.label,
    length: pattern.path?.length ?? 0
  });

  if (tentDjRecentVisuals.length > 10) {
    tentDjRecentVisuals.shift();
  }
}

function makeRandomBigLotRouteCandidate() {
  const families =
    ['straight', 'triangle', 'box', 'crazy'];

  const family =
    families[
      Math.floor(
        Math.random() *
        families.length
      )
    ];

  if (family === 'straight') {
    return makeBigLotStraightPattern();
  }

  const pool =
    ROUTE_PATTERNS[family];

  const source =
    pool[
      Math.floor(
        Math.random() *
        pool.length
      )
    ];

  return remapPatternToBigLot(source);
}

function scoreTentDjCandidate(pattern) {
  if (!pattern) return -Infinity;

  let score =
    Math.random() * 1.5;

  const recent =
    tentDjRecentVisuals;

  const last =
    recent[recent.length - 1];

  const key =
    getTentVisualKey(pattern);

  if (last) {
    if (pattern.id === last.id) {
      score -= 100;
    }

    if (key === last.key) {
      score -= 36;
    }

    if (pattern.family === last.family) {
      score -= 13;
    } else {
      score += 7;
    }

    if (pattern.label === last.label) {
      score -= 7;
    }

    const lengthDifference =
      Math.abs(
        (pattern.path?.length ?? 0) -
        (last.length ?? 0)
      );

    score +=
      Math.min(10, lengthDifference) *
      0.65;
  }

  const recentKeys =
    recent
      .slice(-5)
      .map(item => item.key);

  if (recentKeys.includes(key)) {
    score -= 24;
  }

  const recentFamilies =
    recent
      .slice(-2)
      .map(item => item.family);

  if (!recentFamilies.includes(pattern.family)) {
    score += 5;
  }

  return score;
}

function chooseSmartBigLotRoutePattern() {
  let best = null;
  let bestScore = -Infinity;

  for (let attempt = 0; attempt < 18; attempt += 1) {
    const candidate =
      makeRandomBigLotRouteCandidate();

    const score =
      scoreTentDjCandidate(candidate);

    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return (
    best ??
    makeBigLotStraightPattern()
  );
}

function chooseBigLotPattern() {
  const phase =
    getTentFrenzyPhaseForLine(
      linesWalked + 1
    );

  if (phase.kind === 'tent-set') {
    const entry =
      getTentFrenzySetEntryForLine(
        linesWalked + 1
      );

    if (
      entry?.mode === 'follow' &&
      entry.followKind === 'shape'
    ) {
      const shape =
        getBigLotContourPatternById(
          entry.shapeId
        ) ??
        chooseBigLotContourPattern();

      rememberTentDjPattern(shape);
      return shape;
    }

    if (
      entry?.mode === 'follow' ||
      entry?.mode === 'mystery'
    ) {
      const route =
        chooseSmartBigLotRoutePattern();

      rememberTentDjPattern(route);
      return route;
    }

    // Frenzy does not expose a guide route, so do not pollute
    // the DJ memory with an invisible pattern.
    return makeRandomBigLotRouteCandidate();
  }

  // Dino rounds replace the guide route entirely.
  if (phase.kind === 'dino') {
    return makeRandomBigLotRouteCandidate();
  }

  if (Math.random() < TENT_CONTOUR_CHANCE) {
    const shape = chooseBigLotContourPattern();
    rememberTentDjPattern(shape);
    return shape;
  }

  const route = chooseSmartBigLotRoutePattern();
  rememberTentDjPattern(route);
  return route;
}

function expandTentLinesLot() {
  if (bigLotActive || !refs.grid) return;

  bigLotActive = true;

  selectedTents.clear();
  swipeState.tentRects.clear();

  refs.grid
    .querySelectorAll('.kc-tent-inner-cell')
    .forEach(cell => cell.remove());

  gridEls = [];

  refs.grid.style.setProperty(
    'grid-template-columns',
    'repeat(6, minmax(0, 1fr))',
    'important'
  );

  refs.grid.style.setProperty(
    'grid-template-rows',
    'repeat(8, minmax(0, 1fr))',
    'important'
  );

  refs.grid.style.setProperty(
    'aspect-ratio',
    '6 / 8',
    'important'
  );

  refs.grid.classList.add(
    'kc-tent-grid-big-lot'
  );

  for (
    let index = 0;
    index < BIG_LOT_SIZE;
    index += 1
  ) {
    const cell =
      document.createElement('div');

    cell.className =
      'kc-tent-inner-cell';

    cell.dataset.index =
      index;

    const img =
      document.createElement('img');

    img.className =
      'kc-tent-img';

    img.src =
      `${import.meta.env.BASE_URL}` +
      'assets/img/characters/kidsCamping/tent.png';

    img.alt = 'Tent';

    cell.appendChild(img);
    refs.grid.appendChild(cell);

    gridEls.push({
      cell,
      img,
      index
    });
  }

  guidePath?.setAttribute('d', '');

  refs.wrapper?.setAttribute(
    'data-tent-lot',
    'big'
  );

  try {
    refs.grid.animate(
      [
        {
          transform: 'scale(0.94)',
          opacity: 0.45
        },
        {
          transform: 'scale(1)',
          opacity: 1
        }
      ],
      {
        duration: 420,
        easing: 'cubic-bezier(.2,.9,.3,1)'
      }
    );
  } catch {}

  dbg(
    'festival lot expanded',
    {
      rows: 8,
      cols: 6,
      tents: 48,
      linesWalked
    }
  );
}

function updateTentLineHud() {
  const linesEl =
    refs.wrapper?.querySelector('#kcTentLinesWalked');

  const routeEl =
    refs.wrapper?.querySelector('#kcTentRouteName');

  if (linesEl) {
    linesEl.textContent = String(linesWalked);
  }

  if (routeEl) {
    routeEl.textContent =
      getTentLineHudLabel();
  }

  if (refs.wrapper) {
    refs.wrapper.dataset.routeFamily =
      activeRouteFamily;

    refs.wrapper.dataset.linesWalked =
      String(linesWalked);
  }
}



export function createTentLineGame(onScore) {
  onScoreCallback = onScore;
  selectedTents.clear();
  gridEls = [];

  const wrapper = document.createElement('div');
  wrapper.className = 'kc-tent-wrap';
  refs.wrapper = wrapper;

  const grid = document.createElement('div');
  grid.className = 'kc-tent-grid';
  wrapper.appendChild(grid);
  refs.grid = grid;

  // SVG overlay (scoped inside this grid)
  const svgOverlay = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svgOverlay.classList.add('kc-glow-overlay');
  svgOverlay.setAttribute('width', '100%');
  svgOverlay.setAttribute('height', '100%');
  svgOverlay.setAttribute('preserveAspectRatio', 'none');
  svgOverlay.style.pointerEvents = 'none';
  grid.appendChild(svgOverlay);
  refs.svg = svgOverlay;

  ensureGuideDefs(svgOverlay);
  ensureGuidePath(svgOverlay);

  // Below-the-grid Tent Frenzy status area.
  // Pass 1 is presentation-only:
  // - Dino lives on the left.
  // - Tent Frenzy status card lives on the right.
  // - Values stay static until the route-progression pass.
  const spaceBelow = document.createElement('div');
  spaceBelow.className = 'kc-tent-space-below';

  const successMsg = document.createElement('div');
  successMsg.className = 'kc-success-msg';

  const dinoSlot = document.createElement('div');
  dinoSlot.className = 'kc-tent-dino-slot';

  const dinoIcon = document.createElement('img');
  dinoIcon.className = 'kc-dino-icon';
  dinoIcon.src = `${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/stegoVider.png`;
  dinoIcon.alt = 'Dino Divider';

  dinoSlot.appendChild(dinoIcon);

  const infoCard = document.createElement('div');
  infoCard.className = 'kc-tent-info-card';
  infoCard.setAttribute('aria-label', 'Tent Frenzy status');

  const linesGroup = document.createElement('div');
  linesGroup.className = 'kc-tent-info-group';

  const linesLabel = document.createElement('span');
  linesLabel.className = 'kc-tent-info-label';
  linesLabel.textContent = 'LINES WALKED';

  const linesValue = document.createElement('strong');
  linesValue.className = 'kc-tent-info-value';
  linesValue.id = 'kcTentLinesWalked';
  linesValue.textContent = '0';

  linesGroup.appendChild(linesLabel);
  linesGroup.appendChild(linesValue);

  const routeGroup = document.createElement('div');
  routeGroup.className = 'kc-tent-info-group kc-tent-route-group';

  const routeLabel = document.createElement('span');
  routeLabel.className = 'kc-tent-info-label';
  routeLabel.textContent = 'ROUTE';

  const routeValue = document.createElement('strong');
  routeValue.className = 'kc-tent-route-value';
  routeValue.id = 'kcTentRouteName';
  routeValue.textContent = 'STRAIGHT';

  routeGroup.appendChild(routeLabel);
  routeGroup.appendChild(routeValue);

  infoCard.appendChild(linesGroup);
  infoCard.appendChild(routeGroup);

  spaceBelow.appendChild(successMsg);
  spaceBelow.appendChild(dinoSlot);
  spaceBelow.appendChild(infoCard);
  wrapper.appendChild(spaceBelow);

  // Cells
  for (let i = 0; i < (bigLotActive ? BIG_LOT_SIZE : GRID_SIZE); i++) {
    const cell = document.createElement('div');
    cell.className = 'kc-tent-inner-cell';
    cell.dataset.index = i;

    const img = document.createElement('img');
    img.className = 'kc-tent-img';
    img.src = `${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/tent.png`;
    img.alt = 'Tent';

    cell.appendChild(img);
    grid.appendChild(cell);
    gridEls.push({ cell, img, index: i });
  }

  setupSwipeHandlers(grid);

  // ✅ keep *references* for cleanup
  refs.listeners.onTransitionEnd = () => drawLineWhenReady();
  grid.addEventListener('transitionend', refs.listeners.onTransitionEnd);

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => drawLineWhenReady());
  }

  refs.listeners.onScroll = () => drawLineWhenReady();
  window.addEventListener('scroll', refs.listeners.onScroll, { passive: true });

  // mutation observer scoped to the grid
  const mo = new MutationObserver(() => drawLineWhenReady());
  mo.observe(grid, { attributes: true, attributeFilter: ['class', 'style'] });
  refs.mo = mo;

  // Resize observer
  const ro = new ResizeObserver(() => {
    if (grid.getBoundingClientRect().height > 0 && activeLine.length) {
      drawLineWhenReady();
    }
  });
  ro.observe(grid);
  refs.resizeObs = ro;

  // window listeners (store refs so we can remove them)
  refs.listeners.onResize = () => redrawLineSoon();
  refs.listeners.onOrient = () => redrawLineSoon();
  window.addEventListener('resize', refs.listeners.onResize, { passive: true });
  window.addEventListener('orientationchange', refs.listeners.onOrient, { passive: true });

  return wrapper;
}

function setupSwipeHandlers(grid) {
  const seen = new Set();

  const onPointerDown = (e) => {
    swipeState.pointerDown = true;
    seen.clear();
    swipeState.touchedIndices.clear();
    swipeState.startX = e.clientX;
    swipeState.startY = e.clientY;

    swipeState.tentRects.clear();
    gridEls.forEach(({ cell }, index) => {
      swipeState.tentRects.set(index, cell.getBoundingClientRect());
    });

    processHit(e); // immediate hit
  };

  const onPointerMove = (e) => {
    if (!swipeState.pointerDown) return;
    const dx = Math.abs(e.clientX - swipeState.startX);
    const dy = Math.abs(e.clientY - swipeState.startY);
    if (Math.hypot(dx, dy) > 5) processHit(e);
  };

  const endSwipe = () => {
    swipeState.pointerDown = false;
    seen.clear();
    swipeState.touchedIndices.clear();
  };

  const processHit = (e) => {
    if (!swipeState.pointerDown) return;
    const x = e.clientX, y = e.clientY;

    for (const [index, rect] of swipeState.tentRects.entries()) {
      const marginX = rect.width * 0.15;
      const marginY = rect.height * 0.15;
      const inside =
        x >= rect.left + marginX && x <= rect.right - marginX &&
        y >= rect.top + marginY && y <= rect.bottom - marginY;

      if (inside && !seen.has(index)) {
        seen.add(index);
        toggleTent(index);
        break;
      }
    }
  };

  grid.addEventListener('pointerdown', onPointerDown);
  grid.addEventListener('pointermove', onPointerMove);
  grid.addEventListener('pointerup', endSwipe);
  const onDocUp = () => endSwipe();
  const onDocCancel = () => endSwipe();
  document.addEventListener('pointerup', onDocUp);
  document.addEventListener('pointercancel', onDocCancel);

  // save refs for cleanup
  refs.listeners.swipe_onPointerDown = onPointerDown;
  refs.listeners.swipe_onPointerMove = onPointerMove;
  refs.listeners.swipe_onPointerUp   = endSwipe;
  refs.listeners.swipe_docUp         = onDocUp;
  refs.listeners.swipe_docCancel     = onDocCancel;
}



function ensureGuideDefs(svg) {
  if (!svg) return;

  const NS =
    'http://www.w3.org/2000/svg';


  // --------------------------------------------------------
  // One shared <defs>
  // --------------------------------------------------------

  let defs =
    svg.querySelector(
      'defs'
    );


  if (!defs) {

    defs =
      document.createElementNS(
        NS,
        'defs'
      );


    svg.appendChild(
      defs
    );
  }


  // --------------------------------------------------------
  // Animated route gradient
  // --------------------------------------------------------

  let gradient =
    svg.querySelector(
      '#kcPulseGrad'
    );


  if (!gradient) {

    gradient =
      document.createElementNS(
        NS,
        'linearGradient'
      );


    gradient.setAttribute(
      'id',
      'kcPulseGrad'
    );


    gradient.setAttribute(
      'x1',
      '0%'
    );


    gradient.setAttribute(
      'y1',
      '0%'
    );


    gradient.setAttribute(
      'x2',
      '100%'
    );


    gradient.setAttribute(
      'y2',
      '0%'
    );


    const stopA =
      document.createElementNS(
        NS,
        'stop'
      );


    stopA.setAttribute(
      'offset',
      '0%'
    );


    stopA.setAttribute(
      'stop-color',
      '#00ff66'
    );


    stopA.dataset.kcTentStop =
      'a';


    const stopAAnimation =
      document.createElementNS(
        NS,
        'animate'
      );


    stopAAnimation.setAttribute(
      'attributeName',
      'stop-color'
    );


    stopAAnimation.setAttribute(
      'values',
      '#00ff66;#66ff99;#00ffaa;#00ff66'
    );


    stopAAnimation.setAttribute(
      'dur',
      '1.4s'
    );


    stopAAnimation.setAttribute(
      'repeatCount',
      'indefinite'
    );


    stopA.appendChild(
      stopAAnimation
    );


    const stopB =
      document.createElementNS(
        NS,
        'stop'
      );


    stopB.setAttribute(
      'offset',
      '100%'
    );


    stopB.setAttribute(
      'stop-color',
      '#00ffaa'
    );


    stopB.dataset.kcTentStop =
      'b';


    const stopBAnimation =
      document.createElementNS(
        NS,
        'animate'
      );


    stopBAnimation.setAttribute(
      'attributeName',
      'stop-color'
    );


    stopBAnimation.setAttribute(
      'values',
      '#00ffaa;#99ffcc;#00ff66;#00ffaa'
    );


    stopBAnimation.setAttribute(
      'dur',
      '1.4s'
    );


    stopBAnimation.setAttribute(
      'repeatCount',
      'indefinite'
    );


    stopB.appendChild(
      stopBAnimation
    );


    gradient.appendChild(
      stopA
    );


    gradient.appendChild(
      stopB
    );


    defs.appendChild(
      gradient
    );
  }


  // --------------------------------------------------------
  // Shared route glow
  // --------------------------------------------------------

  let filter =
    svg.querySelector(
      '#kcGlow'
    );


  if (!filter) {

    filter =
      document.createElementNS(
        NS,
        'filter'
      );


    filter.setAttribute(
      'id',
      'kcGlow'
    );


    filter.setAttribute(
      'x',
      '-50%'
    );


    filter.setAttribute(
      'y',
      '-50%'
    );


    filter.setAttribute(
      'width',
      '200%'
    );


    filter.setAttribute(
      'height',
      '200%'
    );


    filter.setAttribute(
      'filterUnits',
      'userSpaceOnUse'
    );


    const blur =
      document.createElementNS(
        NS,
        'feGaussianBlur'
      );


    blur.setAttribute(
      'in',
      'SourceGraphic'
    );


    blur.setAttribute(
      'stdDeviation',
      '3'
    );


    blur.setAttribute(
      'result',
      'blur'
    );


    const blurAnimation =
      document.createElementNS(
        NS,
        'animate'
      );


    blurAnimation.setAttribute(
      'attributeName',
      'stdDeviation'
    );


    blurAnimation.setAttribute(
      'values',
      '3;6;3'
    );


    blurAnimation.setAttribute(
      'dur',
      '1.2s'
    );


    blurAnimation.setAttribute(
      'repeatCount',
      'indefinite'
    );


    blur.appendChild(
      blurAnimation
    );


    const merge =
      document.createElementNS(
        NS,
        'feMerge'
      );


    const blurNode =
      document.createElementNS(
        NS,
        'feMergeNode'
      );


    blurNode.setAttribute(
      'in',
      'blur'
    );


    const sourceNode =
      document.createElementNS(
        NS,
        'feMergeNode'
      );


    sourceNode.setAttribute(
      'in',
      'SourceGraphic'
    );


    merge.appendChild(
      blurNode
    );


    merge.appendChild(
      sourceNode
    );


    filter.appendChild(
      blur
    );


    filter.appendChild(
      merge
    );


    defs.appendChild(
      filter
    );
  }
}

function ensureGuidePath(svg) {
  if (!svg) return;

  // if we had a previous path from another mount, re-home it
  if (guidePath && guidePath.ownerSVGElement !== svg) {
    try { svg.appendChild(guidePath); } catch {}
  }

  // create a new one if missing or detached
  if (!guidePath || !svg.contains(guidePath)) {
    guidePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    guidePath.setAttribute("stroke", "url(#kcPulseGrad)");
    guidePath.setAttribute("stroke-width", "8");
    guidePath.setAttribute("fill", "none");
    guidePath.setAttribute("stroke-linecap", "round");
    guidePath.setAttribute("filter", "url(#kcGlow)");
    guidePath.setAttribute("stroke-dasharray", "14 10");

    const dashAnim = document.createElementNS("http://www.w3.org/2000/svg", "animate");
    dashAnim.setAttribute("attributeName", "stroke-dashoffset");
    dashAnim.setAttribute("values", "0;-48");
    dashAnim.setAttribute("dur", "1.2s");
    dashAnim.setAttribute("repeatCount", "indefinite");
    guidePath.appendChild(dashAnim);

    const widthAnim = document.createElementNS("http://www.w3.org/2000/svg", "animate");
    widthAnim.setAttribute("attributeName", "stroke-width");
    widthAnim.setAttribute("values", "8;11;8");
    widthAnim.setAttribute("dur", "1.2s");
    widthAnim.setAttribute("repeatCount", "indefinite");
    guidePath.appendChild(widthAnim);

    svg.appendChild(guidePath);
  }
}


function drawLineWhenReady() {
  /*
    During FIELD EXPANDED / DINO FRENZY / ADVENTURE COMPLETE
    stage beats, route drawing is intentionally frozen.

    Do not queue an old route through the transition.
  */
  if (tentStageTransitionActive) {
    return;
  }

  if (isResolving) {
    if (refs.pendingRAF) {
      cancelAnimationFrame(
        refs.pendingRAF
      );
    }

    refs.pendingRAF =
      requestAnimationFrame(
        () =>
          drawLineWhenReady()
      );

    return;
  }

  if (refs.pendingRAF) {
    cancelAnimationFrame(
      refs.pendingRAF
    );
  }

  refs.pendingRAF =
    requestAnimationFrame(
      async () => {
        await waitForImages();

        if (
          tentStageTransitionActive
        ) {
          return;
        }

        drawLineBurst(36);
      }
    );
}



// double-rAF helper stays
function redrawLineSoon() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      drawLineWhenReady();
    });
  });
}

// 🔒 take one stab, return true on success
function drawLineWhenReadyOnce() {
  if (tentStageTransitionActive) {
    return false;
  }

  const svg  = refs.svg;
  const grid = refs.grid;

  if (!svg)  { dbg('no svg');  return false; }
  if (!grid) { dbg('no grid'); return false; }
  if (!activeLine?.length) { dbg('no activeLine'); return false; }

  ensureGuideDefs(svg);
  ensureGuidePath(svg);

  if (!guidePath || !svg.contains(guidePath)) {
    dbg('guidePath missing/DETACHED, re-creating');
    ensureGuidePath(svg);

    if (!guidePath) {
      return false;
    }
  }

  const rect1 =
    grid.getBoundingClientRect?.();

  if (!rect1) {
    dbg('no rect1');
    return false;
  }

  if (
    rect1.width <= 0 ||
    rect1.height <= 0
  ) {
    dbg('grid size 0', rect1);
    return false;
  }

  const rect2 =
    grid.getBoundingClientRect();

  const unsettled =
    (
      Math.abs(
        rect2.width -
        rect1.width
      ) > 0.1
    )
    ||
    (
      Math.abs(
        rect2.height -
        rect1.height
      ) > 0.1
    );

  if (unsettled) {
    dbg(
      'layout unsettled',
      rect1,
      rect2
    );

    return false;
  }

  const points =
    activeLine.map(
      index => {
        const rect =
          gridEls[index]
            ?.cell
            ?.getBoundingClientRect?.();

        if (!rect) {
          return null;
        }

        return {
          x:
            rect.left -
            rect1.left +
            rect.width / 2,

          y:
            rect.top -
            rect1.top +
            rect.height / 2
        };
      }
    );

  if (!points.length) {
    dbg('no points');
    return false;
  }

  if (
    points.some(
      point =>
        !point ||
        !isFinite(point.x) ||
        !isFinite(point.y)
    )
  ) {
    dbg('bad points', points);
    return false;
  }

  const cs =
    getComputedStyle(svg);

  if (
    cs.display === 'none' ||
    cs.opacity === '0' ||
    cs.visibility === 'hidden'
  ) {
    dbg(
      'svg hidden by CSS',
      {
        display:
          cs.display,

        opacity:
          cs.opacity,

        visibility:
          cs.visibility
      }
    );

    return false;
  }

  svg.setAttribute(
    'viewBox',
    `0 0 ${rect1.width} ${rect1.height}`
  );

  if (
    guidePath.ownerSVGElement !==
    svg
  ) {
    try {
      svg.appendChild(
        guidePath
      );
    } catch {}

    dbg('re-homed guidePath');
  }

  guidePath.setAttribute(
    'stroke',
    'url(#kcPulseGrad)'
  );

  guidePath.setAttribute(
    'filter',
    'url(#kcGlow)'
  );

  syncGuidePathForTrailMode();

  let d =
    `M ${points[0].x} ${points[0].y}`;

  for (
    let index = 1;
    index < points.length;
    index += 1
  ) {
    d +=
      ` L ${points[index].x} ${points[index].y}`;
  }

  guidePath.setAttribute(
    'd',
    d
  );

  let bboxOK =
    true;

  try {
    const bb =
      guidePath.getBBox();

    bboxOK =
      bb &&
      bb.width > 0 &&
      bb.height > 0;
  } catch {
    bboxOK =
      false;
  }

  if (!bboxOK) {
    dbg(
      'bbox empty -> forcing repaint'
    );

    forceRepaintPath(
      svg,
      guidePath
    );

    try {
      const bb2 =
        guidePath.getBBox();

      bboxOK =
        bb2 &&
        bb2.width > 0 &&
        bb2.height > 0;
    } catch {
      bboxOK =
        false;
    }
  }

  if (!bboxOK) {
    dbg(
      'still empty -> refreshing defs'
    );

    refreshDefs(svg);

    guidePath.setAttribute(
      'stroke',
      'url(#kcPulseGrad)'
    );

    guidePath.setAttribute(
      'filter',
      'url(#kcGlow)'
    );

    forceRepaintPath(
      svg,
      guidePath
    );

    try {
      const bb3 =
        guidePath.getBBox();

      if (
        !(
          bb3 &&
          bb3.width > 0 &&
          bb3.height > 0
        )
      ) {
        dbg(
          'final fallback -> solid stroke, no filter'
        );

        guidePath.removeAttribute(
          'filter'
        );

        guidePath.setAttribute(
          'stroke',
          '#00ffaa'
        );
      }
    } catch {
      dbg(
        'final fallback -> solid stroke, no filter (exception path)'
      );

      guidePath.removeAttribute(
        'filter'
      );

      guidePath.setAttribute(
        'stroke',
        '#00ffaa'
      );
    }
  }

  syncGuidePathForTrailMode();

  dbg('draw ok');

  return true;
}




function drawLineGlow({ svgOverlay, activeLine, gridEls }) {
  if (!svgOverlay || !activeLine.length) return;

  ensureGuideDefs(svgOverlay);
  ensureGuidePath(svgOverlay);

  const gridRect = svgOverlay.parentElement.getBoundingClientRect();
  if (!gridRect || gridRect.width === 0 || gridRect.height === 0) return;

  svgOverlay.setAttribute('viewBox', `0 0 ${gridRect.width} ${gridRect.height}`);

  const points = activeLine.map(i => {
    const rect = gridEls[i]?.cell?.getBoundingClientRect();
    return rect
      ? { x: rect.left - gridRect.left + rect.width / 2, y: rect.top - gridRect.top + rect.height / 2 }
      : { x: 0, y: 0 };
  });

  if (points.length === 0 || points.every(p => p.x === 0 && p.y === 0)) {
    requestAnimationFrame(() => drawLineGlow({ svgOverlay, activeLine, gridEls }));
    return;
  }

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) d += ` L ${points[i].x} ${points[i].y}`;
  guidePath.setAttribute('d', d);
  syncGuidePathForTrailMode();
}


function pickNewLine() {

  const pool =
    getRoutePoolForNextLine();


  let pattern;


  if (
    bigLotActive
  ) {

    pattern =
      chooseBigLotPattern();

  } else if (
    linesWalked < 20
  ) {

    /*
      Lines 1–20 keep the teaching progression:

        1–5    Straight
        6–10   Triangle
        11–15  Box
        16–20  Crazy
    */
    pattern =
      chooseRoutePattern(
        pool
      );

  } else {

    /*
      ENDLESS WALK

      Choose FAMILY first so Straight does not disappear
      because another transformed family contains more entries.

        25% STRAIGHT
        25% TRIANGLE
        25% BOX
        25% CRAZY
    */

    const families =
      [
        'straight',
        'triangle',
        'box',
        'crazy'
      ];


    const family =
      families[
        Math.floor(
          Math.random() *
          families.length
        )
      ];


    if (
      family ===
      'crazy'
    ) {

      /*
        Crazy remains extra unpredictable.

        Half curated.
        Half procedural.
      */
      pattern =
        Math.random() <
          0.5

          ? createProceduralCrazyPattern()

          : chooseRoutePattern(
              ROUTE_POOLS.crazy
            );

    } else {

      pattern =
        chooseRoutePattern(
          ROUTE_POOLS[
            family
          ]
        );
    }
  }


  activePattern =
    pattern;


  activeRouteFamily =
    pattern.family;


  /*
    Visual path and solve targets intentionally diverge.

    Closed shapes may repeat the starting tent visually
    without requiring the player to toggle it twice.
  */
  activeLine =
    [
      ...pattern.path
    ];


  activeTargets =
    [
      ...pattern.targets
    ];


  lastPatternId =
    pattern.id;


  clearTentGrid();

  configureTrailModeForCurrentLine();

  updateTentLineHud();


  /*
    NEW:

    The currently active line number now determines the
    visual Festival Current state.

    Because linesWalked is incremented BEFORE pickNewLine(),
    progression naturally changes on:

      Line 6
      Line 11
      Line 21
      Line 35
      Line 50+
  */
  applyTentLineVisualProgression();


  dbg(
    'route',
    {
      lineNumber:
        linesWalked + 1,

      family:
        activeRouteFamily,

      pattern:
        pattern.id,

      path:
        activeLine,

      targets:
        activeTargets
    }
  );


  // Phase A
  requestAnimationFrame(
    () =>
      drawLineWhenReady()
  );


  // Phase B
  redrawLineSoon();


  // Phase C
  setTimeout(
    () => {

      dbg(
        'late retry'
      );

      drawLineWhenReady();

    },
    120
  );


  // Phase D
  setTimeout(
    () => {

      dbg(
        'very late retry'
      );

      drawLineBurst(
        60
      );

    },
    1000
  );
}

function forceRepaintPath(svg, path) {
  // poke the renderer
  path.style.transition = 'none';
  const prevFilter = path.getAttribute('filter');
  path.removeAttribute('filter');
  path.getBoundingClientRect(); // flush
  if (prevFilter) path.setAttribute('filter', prevFilter);

  // nudge dasharray a hair (no visual change)
  const da = path.getAttribute('stroke-dasharray') || '14 10';
  path.setAttribute('stroke-dasharray', da === '14 10' ? '14.01 10' : '14 10');
}

function refreshDefs(svg) {

  /*
    Re-create gradient/filter to break stale GPU state.

    After rebuilding, immediately restore the CURRENT
    Tent Frenzy Festival Current profile.

    Otherwise a rare WKWebView repaint recovery could
    temporarily revert a later neon route back to green.
  */

  const defs =
    svg.querySelector(
      'defs'
    )
    ||
    svg.insertBefore(
      document.createElementNS(
        svg.namespaceURI,
        'defs'
      ),
      svg.firstChild
    );


  const oldGradient =
    svg.querySelector(
      '#kcPulseGrad'
    );


  if (
    oldGradient
  ) {

    oldGradient.remove();
  }


  const oldGlow =
    svg.querySelector(
      '#kcGlow'
    );


  if (
    oldGlow
  ) {

    oldGlow.remove();
  }


  ensureGuideDefs(
    svg
  );


  applyTentLineVisualProgression();
}


// ============================================================
// TENT FRENZY BIG LOT — LINE 25 IMPACT
//
// Event effects only:
//   - old 24-tent field slams once
//   - a few milestone sparks fire
//   - existing expansion rebuild follows afterward
//
// No constant background particles.
// ============================================================
function playBigLotExpansionBeat() {
  const wrapper = refs.wrapper;

  if (!wrapper) return;

  wrapper.classList.remove(
    'kc-tent-lot-expansion-beat'
  );

  void wrapper.offsetWidth;

  gridEls.forEach((entry, index) => {
    entry?.cell?.style.setProperty(
      '--kc-tent-slam-index',
      String(index)
    );
  });

  wrapper.classList.add(
    'kc-tent-lot-expansion-beat'
  );

  const totalCells = gridEls.length;

  const burstIndexes = [
    0,
    Math.floor(totalCells * 0.2),
    Math.floor(totalCells * 0.4),
    Math.floor(totalCells * 0.6),
    Math.floor(totalCells * 0.8),
    totalCells - 1
  ];

  [...new Set(burstIndexes)]
    .filter(index =>
      index >= 0 &&
      index < totalCells
    )
    .forEach(index => {
      burstTentSparks(index, 0.78);
    });

  setTimeout(() => {
    wrapper.classList.remove(
      'kc-tent-lot-expansion-beat'
    );
  }, 740);
}

function showTentStageFlash(
  topLine,
  bottomLine,
  durationMs = 2000
) {
  const wrapper =
    refs.wrapper;

  if (!wrapper) {
    return Promise.resolve();
  }

  wrapper
    .querySelectorAll(
      '.kc-tent-stage-flash'
    )
    .forEach(
      element =>
        element.remove()
    );

  const overlay =
    document.createElement(
      'div'
    );

  overlay.className =
    'kc-tent-stage-flash';

  const top =
    document.createElement(
      'span'
    );

  top.textContent =
    topLine;

  const bottom =
    document.createElement(
      'strong'
    );

  bottom.textContent =
    bottomLine;

  overlay.appendChild(top);
  overlay.appendChild(bottom);
  wrapper.appendChild(overlay);

  return new Promise(
    resolve => {
      window.setTimeout(
        () => {
          overlay.classList.add(
            'is-leaving'
          );
        },
        Math.max(
          0,
          durationMs - 220
        )
      );

      window.setTimeout(
        () => {
          overlay.remove();
          resolve();
        },
        durationMs
      );
    }
  );
}



function checkIfSolved() {
  if (isResolving) {
    return;
  }

  const selected =
    Array.from(
      selectedTents
    )
    .sort(
      (a, b) =>
        a - b
    );

  const targets =
    [...activeTargets]
      .sort(
        (a, b) =>
          a - b
      );

  const completedMode =
    activeTrailMode;

  const connectMode =
    isConnectTrailMode(
      completedMode
    );

  const frenzyMode =
    completedMode ===
    'frenzy';

  const completedDinoRound =
    isDinoFrenzyMode(
      completedMode
    );

  const solvedByAll =
    !connectMode &&
    !frenzyMode &&
    selectedTents.size ===
      (
        bigLotActive
          ? BIG_LOT_SIZE
          : GRID_SIZE
      );

  const solvedByLine =
    connectMode
      ? (
          connectPath.length >= 2 &&
          connectPath[
            connectPath.length - 1
          ] === connectGoalIndex
        )
      : frenzyMode
        ? (
            frenzyHits >=
            TENT_FRENZY_GOAL_HITS
          )
        : (
            selected.length ===
              targets.length
            &&
            selected.every(
              (value, index) =>
                value ===
                targets[index]
            )
          );

  if (
    !(
      solvedByAll ||
      solvedByLine
    )
  ) {
    return;
  }

  isResolving =
    true;

  if (solvedByLine) {
    flashLineSuccess();
  } else {
    gridEls.forEach(
      ({ img }) => {
        img.classList.remove(
          'tent-flash'
        );

        void img.offsetWidth;

        img.classList.add(
          'tent-flash'
        );
      }
    );
  }

  pulseSolvedRoute();
  playCorrect();

  onScoreCallback?.(
    100
  );

  linesWalked +=
    1;

  const expandingLotNow =
    linesWalked ===
      BIG_LOT_UNLOCK_LINE
    &&
    !bigLotActive;

  const completedPhase =
    getTentFrenzyPhaseForLine(
      linesWalked
    );

  const nextPhase =
    getTentFrenzyPhaseForLine(
      linesWalked + 1
    );

  const startingDinoFrenzyNext =
    nextPhase.kind === 'dino' &&
    nextPhase.round === 1;

  const nextDinoChapter =
    startingDinoFrenzyNext
      ? nextPhase.chapter
      : 0;

  const completedDinoAdventureNow =
    completedDinoRound &&
    completedPhase.kind === 'dino' &&
    completedPhase.round === DINO_FRENZY_ROUNDS;

  const completedDinoChapter =
    completedDinoAdventureNow
      ? completedPhase.chapter
      : 0;

  if (expandingLotNow) {
    playBigLotExpansionBeat();
  }

  updateTentLineHud();

  dbg(
    'route solved',
    {
      linesWalked,

      completedMode,

      completedFamily:
        activeRouteFamily,

      completedPattern:
        activePattern
          ?.id
        ??
        null,

      solvedByAll,

      expandingLotNow,

      startingDinoFrenzyNext,

      nextDinoChapter,

      completedDinoAdventureNow,

      completedDinoChapter
    }
  );

  const msg =
    refs.wrapper
      ?.querySelector(
        '.kc-success-msg'
      );

  const dinoIcon =
    refs.wrapper
      ?.querySelector(
        '.kc-dino-icon'
      );

  const regularMessage =
    getTentLineSuccessMessage(
      expandingLotNow,
      solvedByAll
    );

  if (msg) {
    msg.textContent =
      regularMessage;

    if (
      regularMessage &&
      dinoIcon
    ) {
      dinoIcon.style.opacity =
        '0';
    }

    window.setTimeout(
      () => {
        if (msg) {
          msg.textContent =
            '';
        }

        if (dinoIcon) {
          dinoIcon.style.opacity =
            '1';
        }
      },
      800
    );
  }

  if (solvedByAll) {
    requestAnimationFrame(
      () => {
        setTimeout(
          () => {
            refs.wrapper
              ?.dispatchEvent(
                new CustomEvent(
                  'kc:tents-all',
                  {
                    bubbles:
                      true
                  }
                )
              );
          },
          0
        );
      }
    );
  }

  /*
    Tent Frenzy tap rounds get a true two-second finale.

    Every other normal solve keeps the existing 800ms beat.
  */
  const initialHoldMs =
    frenzyMode
      ? 2000
      : 800;

  window.setTimeout(
    async () => {
      selectedTents.clear();

      /*
        LINE 25 ACT BREAK

        The old route is destroyed BEFORE rebuilding the grid.
        This is what fixes the ghost route drawing across the
        freshly expanded 48-tent field.
      */
      if (expandingLotNow) {
        tentStageTransitionActive =
          true;

        activeLine = [];
        activeTargets = [];

        guidePath?.setAttribute(
          'd',
          ''
        );

        clearMysteryTrailPresentation();
        clearTentVarietyPresentation();

        expandTentLinesLot();

        await showTentStageFlash(
          'FIELD',
          'EXPANDED!',
          2000
        );

        tentStageTransitionActive =
          false;

        isResolving =
          false;

        pickNewLine();
        redrawLineSoon();

        window.setTimeout(
          drawLineWhenReady,
          120
        );

        return;
      }

      /*
        After the ten expanded-field Tent Frenzy rounds,
        announce the slower ten-round Dino chapter BEFORE
        creating its first board.
      */
      if (startingDinoFrenzyNext) {
        tentStageTransitionActive =
          true;

        activeLine = [];
        activeTargets = [];

        guidePath?.setAttribute(
          'd',
          ''
        );

        clearMysteryTrailPresentation();
        clearTentVarietyPresentation();
        clearTentGrid();

        await showTentStageFlash(
          'DINO',
          `FRENZY ${tentRomanNumeral(nextDinoChapter)}!`,
          2000
        );

        tentStageTransitionActive =
          false;

        isResolving =
          false;

        pickNewLine();
        redrawLineSoon();

        window.setTimeout(
          drawLineWhenReady,
          120
        );

        return;
      }

      /*
        Every Dino Frenzy chapter ends after exactly ten adventure rounds.
      */
      if (completedDinoAdventureNow) {
        tentStageTransitionActive =
          true;

        activeLine = [];
        activeTargets = [];

        guidePath?.setAttribute(
          'd',
          ''
        );

        clearMysteryTrailPresentation();
        clearTentVarietyPresentation();
        clearTentGrid();

        await showTentStageFlash(
          'ADVENTURE',
          'COMPLETE!',
          2000
        );

        tentStageTransitionActive =
          false;

        isResolving =
          false;

        pickNewLine();
        redrawLineSoon();

        window.setTimeout(
          drawLineWhenReady,
          120
        );

        return;
      }

      isResolving =
        false;

      pickNewLine();
      redrawLineSoon();

      window.setTimeout(
        drawLineWhenReady,
        120
      );
    },
    initialHoldMs
  );
}

function toggleTent(index) {

  if (isResolving) {
    return;
  }

  if (handleTentVarietyTap(index)) {
    return;
  }

  if (!prepareMysteryTentTap(index)) {
    return;
  }

  const tent =
    gridEls[index];


  if (
    !tent
  ) {
    return;
  }


  const isSelected =
    selectedTents.has(
      index
    );


  if (
    isSelected
  ) {

    selectedTents.delete(
      index
    );


    tent.img.src =
      `${import.meta.env.BASE_URL}` +
      'assets/img/characters/kidsCamping/tent.png';

  } else {

    selectedTents.add(
      index
    );


    tent.img.src =
      `${import.meta.env.BASE_URL}` +
      'assets/img/characters/kidsCamping/tentLit.png';


    /*
      Festival Current feedback.

      Only correct route tents spark.

      Wrong / extra tents remain normal so the visual feedback
      quietly reinforces the puzzle instead of rewarding noise.

      Lines 1–5 deliberately return sparkCount 0.
    */
    if (
      activeTargets.includes(
        index
      )
    ) {

      burstTentSparks(
        index
      );
    }
  }


  checkIfSolved();
}

// Try to draw every frame for N frames, or until success
function drawLineBurst(frames = 90) { // ~1.5s safety
  let left = frames;
  const tick = () => {
    if (drawLineWhenReadyOnce()) return; // success -> stop early
    if (--left > 0) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
// One attempt; returns true if we actually set a path

function flashLineSuccess() {
  /*
    Flash each required tent once.

    activeLine may repeat the first tent to visually close
    triangles/boxes, so animation uses activeTargets instead.
  */
  activeTargets.forEach(index => {
    const el = gridEls[index]?.img;

    if (!el) return;

    el.classList.remove('tent-flash');

    void el.offsetWidth;

    el.classList.add('tent-flash');
  });
}

function clearTentGrid() {
  gridEls.forEach(({ img }) => {
    img.src = `${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/tent.png`;
  });
}

/*
  SCMF_TENT_LINES_SENSORY_V1

  One solved route:
    gentle success tone
    +
    one success haptic

  iOS production:
    WKWebView
      -> scmfAudioBridge
      -> Swift native SFX

  Browser preview:
    cached Howler fallback

  Keep this restrained because Tent Frenzy solves happen often.
*/
const TENT_LINE_SUCCESS_SFX =
  Object.freeze({
    id: 'tentSuccess',
    file: 'tentSuccess.mp3',
    volume: 0.22
  });


let tentLineSuccessFallback =
  null;


function playCorrect() {

  /*
    AUDIO
    Respect SCMF's global mute.

    Haptics are intentionally handled separately below,
    so muting sound does not disable physical feedback.
  */
  let muted = false;

  try {
    muted = Boolean(
      isMuted()
    );
  } catch (err) {
    console.warn(
      '[tentLines] mute-state check failed',
      err
    );
  }


  if (!muted) {

    let playedNatively = false;


    // ------------------------------------------------------
    // iOS-native production lane
    // ------------------------------------------------------

    try {
      const nativeBridge =
        globalThis
          ?.webkit
          ?.messageHandlers
          ?.scmfAudioBridge;

      if (
        nativeBridge &&
        typeof nativeBridge.postMessage ===
          'function'
      ) {

        nativeBridge.postMessage({
          type: 'playSfx',
          id: TENT_LINE_SUCCESS_SFX.id,
          file: TENT_LINE_SUCCESS_SFX.file,
          volume: TENT_LINE_SUCCESS_SFX.volume
        });

        playedNatively = true;
      }

    } catch (err) {
      console.warn(
        '[tentLines] native SFX bridge failed',
        err
      );
    }


    // ------------------------------------------------------
    // Browser / preview fallback only
    // ------------------------------------------------------

    if (!playedNatively) {

      try {

        if (!tentLineSuccessFallback) {

          tentLineSuccessFallback =
            new Howl({
              src: [
                `${import.meta.env.BASE_URL}` +
                `assets/audio/SFX/` +
                `${TENT_LINE_SUCCESS_SFX.file}`
              ],

              volume:
                TENT_LINE_SUCCESS_SFX.volume
            });
        }


        /*
          Prevent stacked copies if a future solve happens
          while the tiny success tone is still alive.
        */
        tentLineSuccessFallback.stop();
        tentLineSuccessFallback.play();

      } catch (err) {

        console.warn(
          '[tentLines] fallback SFX failed',
          err
        );
      }
    }
  }


  // --------------------------------------------------------
  // HAPTIC
  //
  // Exactly one haptic for every actual solved route.
  //
  // This function is called from the already-proven
  // checkIfSolved() success branch.
  // --------------------------------------------------------

  try {

    hapticSuccess();

  } catch (err) {

    console.warn(
      '[tentLines] solve haptic failed',
      err
    );
  }
}


export function initGameLine() {
  console.log('🍧 initGameLine() triggered');

  /*
    Tent Frenzy is an infinite session.

    Re-entering the activity starts a fresh walk at Line 1.
    Camping Score itself remains global and untouched.
  */
  selectedTents.clear();

  activePattern = null;
  activeLine = [];
  activeTargets = [];
  activeRouteFamily = 'straight';

  linesWalked = 0;
  lastPatternId = null;
  bigLotActive = false;

  activeTrailMode = 'follow';
  mysteryCheckpoints = [];
  mysteryProgress = 0;
  mysteryRevealPath?.remove();
  mysteryRevealPath = null;

  resetTentVarietyState();

  updateTentLineHud();

  pickNewLine();
  drawLineWhenReady();
}

function registerTentFromCoords(x, y) {
  for (let [index, rect] of swipeState.tentRects.entries()) {
    if (
      x >= rect.left && x <= rect.right &&
      y >= rect.top && y <= rect.bottom &&
      !swipeState.touchedIndices.has(index)
    ) {
      swipeState.touchedIndices.add(index);
      toggleTent(index);
      break;
    }
  }
}



export function cleanupTentLineGame() {
  // cancel any scheduled draw
  if (refs.pendingRAF) cancelAnimationFrame(refs.pendingRAF);
  refs.pendingRAF = 0;

  // remove listeners safely
  if (refs.grid && refs.listeners.onTransitionEnd) {
    refs.grid.removeEventListener('transitionend', refs.listeners.onTransitionEnd);
  }
  if (refs.listeners.onScroll) window.removeEventListener('scroll', refs.listeners.onScroll);
  if (refs.listeners.onResize) window.removeEventListener('resize', refs.listeners.onResize);
  if (refs.listeners.onOrient) window.removeEventListener('orientationchange', refs.listeners.onOrient);
  // swipe listeners
  // ...existing removes...
  if (refs.grid && refs.listeners.swipe_onPointerDown) {
    refs.grid.removeEventListener('pointerdown', refs.listeners.swipe_onPointerDown);
    refs.grid.removeEventListener('pointermove',  refs.listeners.swipe_onPointerMove);
    refs.grid.removeEventListener('pointerup',    refs.listeners.swipe_onPointerUp);
  }
  if (refs.listeners.swipe_docUp)     document.removeEventListener('pointerup',     refs.listeners.swipe_docUp);
  if (refs.listeners.swipe_docCancel) document.removeEventListener('pointercancel', refs.listeners.swipe_docCancel);

  


  // observers
  refs.mo?.disconnect();
  refs.resizeObs?.disconnect();

  // nuke svg contents in this instance only
  if (refs.svg) refs.svg.innerHTML = '';

  // clear game state
  gridEls = [];
  selectedTents.clear();

  activePattern = null;
  activeLine = [];
  activeTargets = [];
  activeRouteFamily = 'straight';

  linesWalked = 0;
  lastPatternId = null;
  bigLotActive = false;

  activeTrailMode = 'follow';
  mysteryCheckpoints = [];
  mysteryProgress = 0;
  mysteryRevealPath?.remove();
  mysteryRevealPath = null;

  resetTentVarietyState();

  // ❗ reset the path so the next mount creates a fresh one
  guidePath = null;

  // drop refs
  refs = {
    wrapper: null, grid: null, svg: null, mo: null, resizeObs: null,
    listeners: {
      onResize: null, onOrient: null, onScroll: null, onTransitionEnd: null,
      swipe_onPointerDown: null, swipe_onPointerMove: null, swipe_onPointerUp: null,
      swipe_docUp: null, swipe_docCancel: null,
    },
    pendingRAF: 0, 
  };


}

// ✅ Award 100 points and regenerate, just like a line solve
export function solveAllTents() {
  if (isResolving) return; // don't double-trigger during resolve
  // fill state first (canonical source of truth)
  selectedTents.clear();
  for (let i = 0; i < GRID_SIZE; i++) {
    selectedTents.add(i);
  }
  // sync visuals (so kids see them all lit)
  gridEls.forEach(({ img }) => {
    img.src = `${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/tentLit.png`;
  });
  // run the shared solver path (this gives 100 points + regen)
  checkIfSolved();
}


function waitForImages() {
  const imgs = gridEls.map(g => g.img).filter(Boolean);
  const pending = imgs.filter(img => !(img.complete && img.naturalWidth > 0));
  if (pending.length === 0) return Promise.resolve();

  return new Promise(resolve => {
    let left = pending.length;
    const done = () => { if (--left <= 0) resolve(); };
    pending.forEach(img => {
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true }); // don't hang on errors
    });
    // hard timeout in case browser never fires a load (cache oddities)
    setTimeout(resolve, 600);
  });
}
