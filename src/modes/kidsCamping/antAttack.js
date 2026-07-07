// /src/modes/kidsCamping/antAttack.js
// Ant Attack 1.6.0 — Choose Ant v1 + existing battle bridge
// Keeps the current tug-of-war core alive while adding the new setup screen.

import { gsap } from 'gsap';
import { appState } from '../../data/appState.js';
import { showRoundMessage } from './roundFeedback.js';

// ────────────────────────────────────────────────────────────────────────────────
// Runtime singletons / module state
// ────────────────────────────────────────────────────────────────────────────────
const ANT = (globalThis.__KC_ANT__ ||= { session: 0, alive: false, root: null });

const ASSET_BASE = `${import.meta.env.BASE_URL}assets/img/characters/kidsCamping/`;

const ANT_ATTACK_SAVE_KEY = 'scmf.kidsCamping.antAttack.v1';

const ANT_ROSTER = Object.freeze([
  {
    id: 'black',
    name: 'Black Ant',
    shortName: 'Black',
    waveName: 'Night Wave',
    wavePower: 3,
    unlockText: 'Starter ant',
    basePng: 'aa_ant_black_base.png',
    poweredPng: 'aa_ant_black_powered.png',
    royalPng: 'aa_ant_black_royal.png',
    soldierPng: 'aa_blackAnt.png',
  },
  {
    id: 'blue',
    name: 'Blue Water Ant',
    shortName: 'Blue',
    waveName: 'Water Wave',
    wavePower: 4,
    unlockText: 'Beat Blue Ant',
    basePng: 'aa_ant_blue_base.png',
    poweredPng: 'aa_ant_blue_powered.png',
    royalPng: 'aa_ant_blue_royal.png',
    soldierPng: 'aa_blueAnt.png',
  },
  {
    id: 'pink',
    name: 'Pink Flower Ant',
    shortName: 'Pink',
    waveName: 'Flower Wave',
    wavePower: 5,
    unlockText: 'Beat Pink Ant',
    basePng: 'aa_ant_pink_base.png',
    poweredPng: 'aa_ant_pink_powered.png',
    royalPng: 'aa_ant_pink_royal.png',
    soldierPng: 'aa_pinkAnt.png',
  },
  {
    id: 'white',
    name: 'White Cloud Ant',
    shortName: 'White',
    waveName: 'Cloud Wave',
    wavePower: 6,
    unlockText: 'Beat White Ant',
    basePng: 'aa_ant_white_base.png',
    poweredPng: 'aa_ant_white_powered.png',
    royalPng: 'aa_ant_white_royal.png',
    soldierPng: 'aa_whiteAnt.png',
  },
  {
    id: 'yellow',
    name: 'Yellow Sun Ant',
    shortName: 'Yellow',
    waveName: 'Sun Wave',
    wavePower: 7,
    unlockText: 'Beat Yellow Ant',
    basePng: 'aa_ant_yellow_base.png',
    poweredPng: 'aa_ant_yellow_powered.png',
    royalPng: 'aa_ant_yellow_royal.png',
    soldierPng: 'aa_yellowAnt.png',
  },
  {
    id: 'red',
    name: 'Red Fire Ant',
    shortName: 'Red',
    waveName: 'Fire Wave',
    wavePower: 8,
    unlockText: 'Beat Red Ant',
    basePng: 'aa_ant_red_base.png',
    poweredPng: 'aa_ant_red_powered.png',
    royalPng: 'aa_ant_red_royal.png',
    soldierPng: 'aa_redAnt.png',
  },
]);

const QUEEN_SNACKJACKET = Object.freeze({
  id: 'queen',
  name: 'Queen SnackJacket',
  shortName: 'Queen',
  waveName: 'Pollen Storm',
  wavePower: 9,
  basePng: 'aa_ant_queen_snackjacket_base.png',
  poweredPng: 'aa_ant_queen_snackjacket_powered.png',
  soldierPng: 'aa_yellowJacket.png',
  fallbackSoldierPng: 'aa_yellowAnt.png',
});

const STORY_RIVAL_ORDER = Object.freeze(['blue', 'pink', 'white', 'yellow', 'red', 'queen']);
const STORY_UNLOCK_CHAIN = Object.freeze(['black', 'blue', 'pink', 'white', 'yellow', 'red', 'queen']);

const BATTLE_TARGET_SCORE = 10;
const BOSS_BATTLE_TARGET_SCORE = 20;
// Kept as a future fallback knob if we want optional auto-start again.
const VS_AUTO_START_MS = 4700;


const foodCatalog = Object.freeze([
  { name: 'grapes',   label: 'Grapes',   emoji: '🍇', weight: 2, src: 'aa_grapes.png',   fallback: 'grapes.png' },
  { name: 'orange',   label: 'Orange',   emoji: '🍊', weight: 3, src: 'aa_orange.png',   fallback: 'orange.png' },
  { name: 'egg',      label: 'Egg',      emoji: '🥚', weight: 4, src: 'aa_egg.png',      fallback: 'egg.png' },
  { name: 'pizza',    label: 'Pizza',    emoji: '🍕', weight: 5, src: 'aa_pizza.png',    fallback: 'pizza.png' },
  { name: 'snowcone', label: 'SnowCone', emoji: '🍧', weight: 6, src: 'aa_snowcone.png', fallback: 'snowcone.png' },
  { name: 'burger',   label: 'Burger',   emoji: '🍔', weight: 7, src: 'aa_burger.png',   fallback: 'burger.png' },
]);

let playerAntPool = 10;
let aiAntPool      = Infinity;
let playerScore    = 0;
let aiScore        = 0;
let playerAntsAttached = 0;
let aiAntsAttached     = 0;
let currentFood        = null;
let roundInProgress    = false;
let currentDirection   = null; // 'player' | 'ai'
let foodTween          = null;

let updatePopUICallback = null;

let currentPhase = 'choose'; // choose | storyIntro | versus | battle | results | ending
let selectedAntId = 'black';
let currentBattleMode = 'story';
let currentPlayerAnt = ANT_ROSTER[0];
let currentRivalAnt = ANT_ROSTER[1];

const activeAnts = [];
let redAntTimeouts = [];
let phaseTimeouts = [];


let _resizeObs   = null;
let _domObs      = null;
const _boundHandlers = new WeakMap(); // container -> { onPointerDown, onBackCapture }

// ────────────────────────────────────────────────────────────────────────────────
// Utilities / guards
// ────────────────────────────────────────────────────────────────────────────────
function assetUrl(filename) {
  return `${ASSET_BASE}${filename}`;
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function aliveGuard(container) {
  return ANT.alive && ANT.root === container && document.body.contains(container);
}

function markAntAttackShell(container) {
  container?.classList?.add('aa-ant-root');

  const stage = container?.closest?.('.kc-activity-stage');
  const grid = container?.closest?.('.kc-activity-grid');

  stage?.classList?.add('aa-ant-stage-root');
  grid?.classList?.add('aa-ant-grid-root');
}

function unmarkAntAttackShell(container) {
  container?.classList?.remove('aa-ant-root');

  const stage = container?.closest?.('.kc-activity-stage');
  const grid = container?.closest?.('.kc-activity-grid');

  stage?.classList?.remove('aa-ant-stage-root');
  grid?.classList?.remove('aa-ant-grid-root');
}


function getAntById(id) {
  if (id === QUEEN_SNACKJACKET.id) return QUEEN_SNACKJACKET;
  return ANT_ROSTER.find((ant) => ant.id === id) || ANT_ROSTER[0];
}

function getAnyAntById(id) {
  return getAntById(id);
}

function getNormalAntIds() {
  return ANT_ROSTER.map((ant) => ant.id);
}

function getKnownAntIds() {
  return [...getNormalAntIds(), QUEEN_SNACKJACKET.id];
}

function isKnownAntId(antId) {
  return getKnownAntIds().includes(antId);
}

function getChooserRoster() {
  const save = readAntAttackSave();

  return isAntUnlockedInSave(save, QUEEN_SNACKJACKET.id)
    ? [...ANT_ROSTER, QUEEN_SNACKJACKET]
    : [...ANT_ROSTER];
}

function getStoryRouteForAnt(antId) {
  const id = getAntById(antId).id;

  if (id === QUEEN_SNACKJACKET.id) {
    return ['black', 'blue', 'pink', 'white', 'yellow', 'red'];
  }

  const startIndex = Math.max(0, STORY_RIVAL_ORDER.indexOf(id) + 1);
  const route = STORY_RIVAL_ORDER.slice(startIndex).filter((rivalId) => rivalId !== id);

  return route.length ? route : ['queen'];
}

function getFirstStoryRivalId(antId) {
  return getStoryRouteForAnt(antId)[0] || null;
}

function isStoryRivalValidForAnt(antId, rivalId) {
  return !!rivalId && getStoryRouteForAnt(antId).includes(rivalId);
}

function inferWinsFromNextRival(antId, nextRivalId) {
  const route = getStoryRouteForAnt(antId);
  const index = route.indexOf(nextRivalId);

  return index > 0 ? index : 0;
}

function createAntStoryState(antId, existing = {}) {
  const id = getAntById(antId).id;
  const route = getStoryRouteForAnt(id);
  const firstRivalId = route[0] || null;

  const existingNext = existing?.nextRivalId;
  const nextRivalId = isStoryRivalValidForAnt(id, existingNext)
    ? existingNext
    : firstRivalId;

  const inferredWins = inferWinsFromNextRival(id, nextRivalId);
  const wins = Number.isFinite(+existing?.wins)
    ? Math.max(0, +existing.wins)
    : inferredWins;

  return {
    started: !!existing?.started,
    prologueSeen: !!existing?.prologueSeen,
    missionSeen: !!existing?.missionSeen,
    complete: !!existing?.complete,
    nextRivalId,
    wins,
  };
}

function normalizeStorySave(parsedStory = {}, fallbackStory = {}) {
  const parsed = parsedStory && typeof parsedStory === 'object' ? parsedStory : {};
  const sourceStories = {
    ...(fallbackStory?.storyByAnt || {}),
    ...(fallbackStory?.antStories || {}),
    ...(parsed?.storyByAnt || {}),
    ...(parsed?.antStories || {}),
  };

  // Migration from the older single global story path into Black Ant's story.
  if (parsed?.nextRivalId && !sourceStories.black) {
    sourceStories.black = {
      started: !!parsed.started,
      prologueSeen: !!parsed.prologueSeen,
      missionSeen: !!parsed.missionSeen,
      complete: !!parsed.complete,
      nextRivalId: parsed.nextRivalId,
      wins: inferWinsFromNextRival('black', parsed.nextRivalId),
    };
  }

  const storyByAnt = {};
  getKnownAntIds().forEach((antId) => {
    storyByAnt[antId] = createAntStoryState(antId, sourceStories[antId]);
  });

  return {
    nextRivalId: storyByAnt.black.nextRivalId,
    complete: !!storyByAnt.black.complete,
    antStories: storyByAnt,
    storyByAnt,
  };
}

function getAntStoryState(antId, save = readAntAttackSave()) {
  const id = getAntById(antId).id;
  return createAntStoryState(
    id,
    save?.story?.storyByAnt?.[id] || save?.story?.antStories?.[id]
  );
}

function writeAntStoryState(antId, nextState) {
  const id = getAntById(antId).id;
  const save = readAntAttackSave();

  save.story.storyByAnt[id] = createAntStoryState(id, nextState);
  save.story.antStories = { ...save.story.storyByAnt };

  if (id === 'black') {
    save.story.nextRivalId = save.story.storyByAnt.black.nextRivalId;
    save.story.complete = !!save.story.storyByAnt.black.complete;
  }

  writeAntAttackSave(save);
}

function isStoryFresh(antId, save = readAntAttackSave()) {
  const state = getAntStoryState(antId, save);
  const wins = Number(state.wins) || 0;

  // Fresh means the player has not actually WON a story battle yet.
  // Peeking at the prologue / royal mission / rival talk should not turn
  // Start Story into Continue Story.
  return !state.complete && wins === 0;
}


function getStoryUnlockTextForAnt(antId) {
  const id = getAntById(antId).id;
  if (id === 'black') return 'Starter ant';

  const index = STORY_UNLOCK_CHAIN.indexOf(id);
  const previousId = index > 0 ? STORY_UNLOCK_CHAIN[index - 1] : 'black';
  const previousAnt = getAntById(previousId);

  return `Complete ${previousAnt.name} Story`;
}

function isAntUnlockedInSave(save, antId) {
  return antId === 'black' || !!save?.unlockedAnts?.[antId];
}

function canPlayStory(antId) {
  const save = readAntAttackSave();
  return isAntUnlockedInSave(save, getAntById(antId).id);
}

function isAntStoryComplete(antId, save = readAntAttackSave()) {
  return !!getAntStoryState(antId, save).complete;
}

function canPlayArcade(antId) {
  const id = getAntById(antId).id;
  const save = readAntAttackSave();

  return isAntUnlockedInSave(save, id) && isAntStoryComplete(id, save);
}

function getStoryButtonText(antId = selectedAntId) {
  if (!canPlayStory(antId)) return 'Story Mode';

  const state = getAntStoryState(antId);

  if (state.complete) return 'Replay Story';
  if (isStoryFresh(antId)) return 'Start Story';

  return 'Continue Story';
}

function getStoryButtonSubtitle(antId = selectedAntId) {
  if (!canPlayStory(antId)) {
    return getStoryUnlockTextForAnt(antId);
  }

  const state = getAntStoryState(antId);
  const nextRival = getNextStoryRival(antId);

  if (state.complete) return 'Story complete';
  return nextRival ? `Next: ${nextRival.name}` : 'Final snack path';
}

function getArcadeButtonSubtitle(antId = selectedAntId) {
  const ant = getAntById(antId);

  if (!canPlayStory(ant.id)) {
    return getStoryUnlockTextForAnt(ant.id);
  }

  if (!canPlayArcade(ant.id)) {
    return `Complete ${ant.name} Story`;
  }

  return ant.id === 'queen' ? 'Royal rivals' : 'Random rival';
}

function getNextStoryRival(playerAntId = selectedAntId) {
  const playerId = getAntById(playerAntId).id;
  const state = getAntStoryState(playerId);
  const nextId = state.complete
    ? getFirstStoryRivalId(playerId)
    : state.nextRivalId;

  return getAnyAntById(nextId || getFirstStoryRivalId(playerId) || 'blue');
}

function getNextUnlockAntId(completedAntId) {
  const index = STORY_UNLOCK_CHAIN.indexOf(completedAntId);
  if (index < 0 || index >= STORY_UNLOCK_CHAIN.length - 1) return null;
  return STORY_UNLOCK_CHAIN[index + 1];
}

function markStoryPrologueSeen(antId) {
  const id = getAntById(antId).id;
  const state = getAntStoryState(id);

  writeAntStoryState(id, {
    ...state,
    started: true,
    prologueSeen: true,
  });
}

function shouldShowStoryPrologue(antId) {
  const state = getAntStoryState(antId);
  const wins = Number(state.wins) || 0;

  // Show the selected-ant prologue until the first actual story win.
  // After that, Continue Story should resume directly at the next rival mission.
  return !state.complete && wins === 0;
}


function markStoryMissionSeen(antId) {
  const id = getAntById(antId).id;
  const state = getAntStoryState(id);

  writeAntStoryState(id, {
    ...state,
    started: true,
    missionSeen: true,
  });
}

function markAntNewlyUnlocked(antId) {
  if (!isKnownAntId(antId) || antId === 'black') return;

  const save = readAntAttackSave();
  save.unlockedAnts[antId] = true;
  save.newAntIds[antId] = true;
  save.story.storyByAnt[antId] = createAntStoryState(
    antId,
    save.story.storyByAnt?.[antId]
  );
  save.story.antStories = { ...save.story.storyByAnt };

  writeAntAttackSave(save);
}

function applyStoryVictoryProgress(playerAntId, defeatedRivalId) {
  const playerId = getAntById(playerAntId).id;
  const rivalId = getAnyAntById(defeatedRivalId).id;

  const save = readAntAttackSave();
  const state = getAntStoryState(playerId, save);
  const route = getStoryRouteForAnt(playerId);
  const currentIndex = route.indexOf(rivalId);

  if (currentIndex < 0) {
    console.warn('[antAttack] story victory ignored; invalid rival for route', {
      playerId,
      rivalId,
      route,
    });

    return {
      advanced: false,
      storyComplete: !!state.complete,
      nextRivalId: state.nextRivalId,
      unlockedAntId: null,
      unlockedAntName: '',
    };
  }

  const nextRivalId = route[currentIndex + 1] || null;
  const storyComplete = !nextRivalId;

  const nextWins = Math.max(Number(state.wins) || 0, currentIndex + 1);

  save.story.storyByAnt[playerId] = createAntStoryState(playerId, {
    ...state,
    started: true,
    prologueSeen: true,
    missionSeen: true,
    complete: storyComplete,
    nextRivalId: storyComplete ? getFirstStoryRivalId(playerId) : nextRivalId,
    wins: nextWins,
  });
  save.story.antStories = { ...save.story.storyByAnt };

  if (playerId === 'black') {
    save.story.nextRivalId = save.story.storyByAnt.black.nextRivalId;
    save.story.complete = !!save.story.storyByAnt.black.complete;
  }

  let unlockedAntId = null;
  let unlockedAntName = '';

  if (storyComplete) {
    unlockedAntId = getNextUnlockAntId(playerId);

    if (unlockedAntId && !save.unlockedAnts?.[unlockedAntId]) {
      save.unlockedAnts[unlockedAntId] = true;
      save.newAntIds[unlockedAntId] = true;
      save.story.storyByAnt[unlockedAntId] = createAntStoryState(
        unlockedAntId,
        save.story.storyByAnt?.[unlockedAntId]
      );
      save.story.antStories = { ...save.story.storyByAnt };
      unlockedAntName = getAntById(unlockedAntId).name;
    }
  }

  writeAntAttackSave(save);

  console.log('[antAttack] story victory saved', {
    playerId,
    defeatedRivalId: rivalId,
    nextRivalId,
    storyComplete,
    unlockedAntId,
    wins: nextWins,
  });

  return {
    advanced: true,
    storyComplete,
    nextRivalId,
    unlockedAntId,
    unlockedAntName,
  };
}

function getBattleTargetScore(mode = currentBattleMode, rivalId = currentRivalAnt?.id) {
  return mode === 'story' && rivalId === 'queen'
    ? BOSS_BATTLE_TARGET_SCORE
    : BATTLE_TARGET_SCORE;
}

function getBattleWinnerKind() {
  const targetScore = getBattleTargetScore();

  if (playerScore >= targetScore) return 'player';
  if (aiScore >= targetScore) return 'rival';

  return null;
}

function getAntPortraitPng(ant, variant = 'base') {
  if (!ant) return 'aa_ant_black_base.png';

  if (variant === 'powered') return ant.poweredPng || ant.basePng || 'aa_ant_black_base.png';
  if (variant === 'royal') return ant.royalPng || ant.poweredPng || ant.basePng || 'aa_ant_black_base.png';

  return ant.basePng || 'aa_ant_black_base.png';
}

function getStoryIntroCopy(playerAnt, rivalAnt) {
  const playerName = playerAnt?.shortName || 'Ant';
  const rivalName = rivalAnt?.shortName || 'Rival';

  if (rivalAnt?.id === 'queen') {
    return {
      royalLine: 'Queen SnackJacket guards the final snack.',
      playerLine: `${playerName} marches in. First to twenty wins the crown.`,
      missionLine: 'Boss snack battle incoming.',
    };
  }

  return {
    royalLine: `${rivalName} blocks the blanket road.`,
    playerLine: `${playerName} takes the mission. First to ten snacks wins.`,
    missionLine: 'Pull hard. Save snacks. Keep marching.',
  };
}

function getArcadeRival(playerId) {
  const player = getAntById(playerId);
  const save = readAntAttackSave();

  if (player.id === 'queen') {
    const queenPool = ANT_ROSTER.filter((ant) => ant.id !== player.id);
    return queenPool[Math.floor(Math.random() * queenPool.length)] || ANT_ROSTER[0];
  }

  const completedNormal = ANT_ROSTER.filter((ant) => {
    return ant.id !== player.id && isAntStoryComplete(ant.id, save);
  });

  if (completedNormal.length) {
    return completedNormal[Math.floor(Math.random() * completedNormal.length)];
  }

  const fallback = ANT_ROSTER.filter((ant) => ant.id !== player.id);
  return fallback[Math.floor(Math.random() * fallback.length)] || ANT_ROSTER[1];
}

function createDefaultAntAttackSave() {
  const storyByAnt = {};
  getKnownAntIds().forEach((antId) => {
    storyByAnt[antId] = createAntStoryState(antId);
  });

  return {
    selectedAntId: 'black',
    lastPlayedAntId: 'black',
    unlockedAnts: { black: true },
    newAntIds: {},

    story: {
      nextRivalId: storyByAnt.black.nextRivalId,
      complete: false,
      antStories: storyByAnt,
      storyByAnt,
    },
  };
}


function normalizeAntAttackSave(rawSave = {}) {
  const fallback = createDefaultAntAttackSave();
  const parsed = rawSave && typeof rawSave === 'object' ? rawSave : {};

  const unlockedAnts = {
    ...fallback.unlockedAnts,
    ...(parsed.unlockedAnts || {}),
  };
  unlockedAnts.black = true;

  const newAntIds = {
    ...(parsed.newAntIds || {}),
  };
  delete newAntIds.black;

  Object.keys(newAntIds).forEach((antId) => {
    if (!isKnownAntId(antId) || !isAntUnlockedInSave({ unlockedAnts }, antId)) {
      delete newAntIds[antId];
    }
  });

  const legacySelected = isKnownAntId(parsed.selectedAntId) ? parsed.selectedAntId : 'black';
  const lastPlayedCandidate = isKnownAntId(parsed.lastPlayedAntId)
    ? parsed.lastPlayedAntId
    : legacySelected;

  const lastPlayedAntId = isAntUnlockedInSave({ unlockedAnts }, lastPlayedCandidate)
    ? lastPlayedCandidate
    : 'black';

  const selectedCandidate = isKnownAntId(parsed.selectedAntId)
    ? parsed.selectedAntId
    : lastPlayedAntId;

  const story = normalizeStorySave(parsed.story, fallback.story);

  return {
    ...fallback,
    ...parsed,
    selectedAntId: selectedCandidate,
    lastPlayedAntId,
    unlockedAnts,
    newAntIds,
    story,
  };
}


function readAntAttackSave() {
  try {
    const raw = localStorage.getItem(ANT_ATTACK_SAVE_KEY);
    if (!raw) return createDefaultAntAttackSave();

    return normalizeAntAttackSave(JSON.parse(raw));
  } catch (err) {
    console.warn('[antAttack] failed to read save:', err);
    return createDefaultAntAttackSave();
  }
}

function writeAntAttackSave(nextSave) {
  try {
    localStorage.setItem(
      ANT_ATTACK_SAVE_KEY,
      JSON.stringify(normalizeAntAttackSave(nextSave || readAntAttackSave()))
    );
  } catch (err) {
    console.warn('[antAttack] failed to write save:', err);
  }
}

function isAntUnlocked(antId) {
  const save = readAntAttackSave();
  return isAntUnlockedInSave(save, antId);
}

function isAntNew(antId) {
  const save = readAntAttackSave();
  return isAntUnlockedInSave(save, antId) && !!save.newAntIds?.[antId];
}



function previewAntId(antId) {
  // Browsing the carousel is not the same as playing the ant.
  // This intentionally does NOT write to localStorage.
  selectedAntId = getAntById(antId).id;
}

function markAntPlayed(antId) {
  const id = getAntById(antId).id;
  selectedAntId = id;

  const save = readAntAttackSave();
  save.selectedAntId = id;
  save.lastPlayedAntId = id;

  if (save.newAntIds?.[id]) {
    delete save.newAntIds[id];
  }

  writeAntAttackSave(save);
}

function resolveInitialAntIdFromSave(save = readAntAttackSave()) {
  const candidate = isKnownAntId(save.lastPlayedAntId)
    ? save.lastPlayedAntId
    : save.selectedAntId;

  return isAntUnlockedInSave(save, candidate) ? candidate : 'black';
}

function getSelectedRosterIndex() {
  const roster = getChooserRoster();
  return Math.max(0, roster.findIndex((ant) => ant.id === selectedAntId));
}


// Dev/debug helper for later unlock testing from Safari/Xcode console.
// Example:
// window.__SCMF_unlockAntAttackAnt?.('blue')
globalThis.__SCMF_unlockAntAttackAnt = markAntNewlyUnlocked;
globalThis.__SCMF_readAntAttackSave = readAntAttackSave;
globalThis.__SCMF_resetAntAttackSave = () => {
  try {
    localStorage.removeItem(ANT_ATTACK_SAVE_KEY);
    console.log('[antAttack] save reset');
  } catch {}
};








function setImgSrcWithFallback(img, primaryName, fallbackName = null) {
  if (!img || !primaryName) return;

  const primary = assetUrl(primaryName);
  const fallback = fallbackName ? assetUrl(fallbackName) : '';

  img.onerror = () => {
    if (fallback && img.src !== fallback) {
      img.onerror = null;
      img.src = fallback;
    }
  };

  img.src = primary;
}

function clearAllRedTimeouts() {
  try { redAntTimeouts.forEach(clearTimeout); } catch {}
  redAntTimeouts = [];
}

function clearPhaseTimeouts() {
  try { phaseTimeouts.forEach(clearTimeout); } catch {}
  phaseTimeouts = [];
}

function setPhaseTimeout(fn, delayMs) {
  const timeoutId = setTimeout(() => {
    phaseTimeouts = phaseTimeouts.filter((id) => id !== timeoutId);
    fn();
  }, delayMs);

  phaseTimeouts.push(timeoutId);
  return timeoutId;
}

function killFoodTween() {
  try { foodTween?.kill?.(); } catch {}
  foodTween = null;
}

function resetBattleRuntimeCounters() {
  clearPhaseTimeouts();

  playerAntPool = TOTAL_ANT_POOL;
  aiAntPool = Infinity;
  playerScore = 0;
  aiScore = 0;
  playerAntsAttached = 0;
  aiAntsAttached = 0;
  currentFood = null;
  roundInProgress = false;
  currentDirection = null;
  killFoodTween();
  clearAllRedTimeouts();
  try { gsap.killTweensOf(activeAnts); } catch {}
  activeAnts.forEach((ant) => {
    stopCrawlWiggle(ant);
    try { ant.remove(); } catch {}
  });
  activeAnts.length = 0;
}

// center of the food within THIS container
function getFoodCenterCoords(container) {
  const wrapper = container.querySelector('.food-with-overlay');
  const zone    = container.querySelector('.kc-ant-zone');
  if (!wrapper || !zone) return { centerX: 0, centerY: 0 };

  const wrapperRect = wrapper.getBoundingClientRect();
  const zoneRect    = zone.getBoundingClientRect();
  const centerX     = wrapperRect.left - zoneRect.left + wrapperRect.width  / 2;
  const centerY     = wrapperRect.top  - zoneRect.top  + wrapperRect.height / 2;
  return { centerX, centerY };
}

// regen rules (win bonus refill)
function getPlayerRegenBonus(foodName, requiredAnts, usedAnts) {
  if (foodName === 'snowcone') return 10;
  if (usedAnts === requiredAnts) return 6;
  if (usedAnts === requiredAnts + 1) return 5;
  return 4;
}

// wiggle helpers
function getAntBaseRotation(ant) {
  return ant?.dataset?.team === 'player' ? 180 : 0;
}

function startCrawlWiggle(ant, fromX, fromY, toX, toY) {
  const dx = toX - fromX, dy = toY - fromY;
  const len = Math.hypot(dx, dy) || 1;
  const ux = -dy / len, uy = dx / len;
  const amplitude = 6, freq = 8, rotAmp = 5;
  const baseRot = getAntBaseRotation(ant);

  const wiggleFn = () => {
    const t = gsap.ticker.time * freq * Math.PI * 2;
    const s = Math.sin(t);
    const offX = ux * amplitude * s;
    const offY = uy * amplitude * s;
    ant.style.transform = `translate(${offX}px, ${offY}px) rotate(${baseRot + (s * rotAmp)}deg)`;
  };
  ant._wiggleFn = wiggleFn;
  gsap.ticker.add(wiggleFn);
}

function stopCrawlWiggle(ant) {
  if (ant?._wiggleFn) {
    gsap.ticker.remove(ant._wiggleFn);
    ant._wiggleFn = null;
  }

  if (ant) {
    const baseRot = getAntBaseRotation(ant);
    ant.style.transform = `translate(0px,0px) rotate(${baseRot}deg)`;
  }
}

// UI helpers (scoped to container)
function updateScores(container) {
  const p = container.querySelector('#playerScore');
  const a = container.querySelector('#aiScore');
  const playerLabel = container.querySelector('#aaPlayerScoreLabel');
  const rivalLabel = container.querySelector('#aaRivalScoreLabel');

  if (p) p.textContent = playerScore;
  if (a) a.textContent = aiScore;
  if (playerLabel) playerLabel.textContent = currentPlayerAnt?.shortName || 'Player';
  if (rivalLabel) rivalLabel.textContent = currentRivalAnt?.shortName || 'Rival';
}

function updateAntCount(container) {
  const el = container.querySelector('.ant-count');
  const btn = container.querySelector('#kc-ant-button');
  if (el)  el.textContent = `${playerAntPool}/10`;
  if (btn) btn.classList.toggle('disabled', playerAntPool <= 0);
}

function renderSnackCostGrid() {
  return foodCatalog.map((food) => `
    <span class="aa-snack-cost">
      <span aria-hidden="true">${food.emoji}</span>
      <strong>${food.weight}</strong>
    </span>
  `).join('');
}

// ────────────────────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────────────────────
export function initAntAttackGame(container, updatePopUICallbackParam) {
  // prevent double init / cross-container confusion
  if (ANT.alive && ANT.root === container) return;
  if (ANT.alive && ANT.root && ANT.root !== container) {
    try { destroyAntAttackGame(ANT.root); } catch {}
  }

  ANT.session++;
  ANT.alive = true;
  ANT.root  = container;

  updatePopUICallback = updatePopUICallbackParam || null;

  markAntAttackShell(container);

  const save = readAntAttackSave();
  selectedAntId = resolveInitialAntIdFromSave(save);

  resetBattleRuntimeCounters();
  wireBackCapture(container);
  wireContainerDeathWatcher(container);

  renderChooseScreen(container);
}

export function destroyAntAttackGame(container) {
  unmarkAntAttackShell(container);
  clearPhaseTimeouts();
  // stop spawns / tweens
  roundInProgress = false;
  killFoodTween();
  clearAllRedTimeouts();

  // kill GSAP + DOM ants
  try { gsap.killTweensOf(activeAnts); } catch {}
  activeAnts.forEach(a => { stopCrawlWiggle(a); try { a.remove(); } catch {} });
  activeAnts.length = 0;

  // observers
  if (_resizeObs) { try { _resizeObs.disconnect(); } catch {} _resizeObs = null; }
  if (_domObs)    { try { _domObs.disconnect(); } catch {} _domObs = null;   }

  // button / back capture
  const antButton = container?.querySelector?.('#kc-ant-button');
  const bound = _boundHandlers.get(container);
  if (antButton && bound?.onPointerDown) {
    antButton.removeEventListener('pointerdown', bound.onPointerDown);
  }
  if (bound?.onBackCapture) {
    document.removeEventListener('click', bound.onBackCapture, true);
  }
  _boundHandlers.delete(container);

  // food UI
  const fc = container?.querySelector?.('.food-container');
  if (fc) fc.innerHTML = '';

  // reset counters
  playerAntPool = TOTAL_ANT_POOL;
  aiAntPool = Infinity;
  playerScore = aiScore = 0;
  playerAntsAttached = aiAntsAttached = 0;
  currentDirection = null;
  currentPhase = 'choose';
}

export function resetAntAttackGame(container) {
  if (!aliveGuard(container)) return;
  destroyAntAttackGame(container);
  initAntAttackGame(container, updatePopUICallback);
}

export function forceKillAntAttack() {
  // global hard stop (no container required)
  clearPhaseTimeouts();
  killFoodTween();
  clearAllRedTimeouts();
  try { gsap.killTweensOf(activeAnts); } catch {}
  activeAnts.forEach(stopCrawlWiggle);
  activeAnts.length = 0;
  roundInProgress = false;
  currentPhase = 'choose';
  ANT.session++;   // invalidate any scheduled timeouts
  ANT.alive   = false;
  ANT.root    = null;

  if (_resizeObs) { try { _resizeObs.disconnect(); } catch {} _resizeObs = null; }
  if (_domObs)    { try { _domObs.disconnect(); } catch {} _domObs    = null; }
}

// ────────────────────────────────────────────────────────────────────────────────
// Choose screen
// ────────────────────────────────────────────────────────────────────────────────
function renderChooseScreen(container) {
  if (!aliveGuard(container)) return;

  currentPhase = 'choose';
  resetBattleRuntimeCounters();

  const selectedAnt = getAntById(selectedAntId);
  const unlocked = isAntUnlocked(selectedAnt.id);
  const isNew = unlocked && isAntNew(selectedAnt.id);
  const storyPlayable = canPlayStory(selectedAnt.id);
  const arcadePlayable = canPlayArcade(selectedAnt.id);
  const storyButtonText = getStoryButtonText(selectedAnt.id);
  const storyButtonSubtitle = getStoryButtonSubtitle(selectedAnt.id);
  const arcadeButtonSubtitle = getArcadeButtonSubtitle(selectedAnt.id);

  container.innerHTML = `
    <div class="aa-choose-screen">
      <section class="aa-choose-card ${unlocked ? '' : 'is-locked'} ${isNew ? 'has-new' : ''}" aria-label="Choose your Ant Attack character">
        <header class="aa-choose-header">
          <h2>Choose Your Ant</h2>
        </header>

        <div class="aa-ant-carousel">
          <button id="aaPrevAnt" class="aa-arrow-btn" type="button" aria-label="Previous ant">←</button>

          <div class="aa-ant-preview">
            ${unlocked && isNew ? '<span class="aa-new-badge" aria-label="New ant">NEW</span>' : ''}
            ${unlocked ? '' : '<span class="aa-lock-badge" aria-label="Locked">🔒</span>'}
            <img
              id="aaSelectedAntImg"
              class="aa-selected-ant-img"
              src="${assetUrl(selectedAnt.basePng)}"
              alt="${selectedAnt.name}"
              draggable="false"
            />
          </div>

          <button id="aaNextAnt" class="aa-arrow-btn" type="button" aria-label="Next ant">→</button>
        </div>

        <div class="aa-ant-meta">
          <h3>${selectedAnt.name}</h3>
          <p class="aa-wave-line">${selectedAnt.waveName}: +${selectedAnt.wavePower}</p>
          <p class="aa-lock-line ${unlocked ? 'unlocked' : 'locked'}">
            ${unlocked ? 'Unlocked' : `🔒 ${getStoryUnlockTextForAnt(selectedAnt.id)}`}
          </p>
        </div>

        <div class="aa-snack-panel" aria-label="Snack costs">
          <span class="aa-snack-title">Snack Cost</span>
          <div class="aa-snack-grid">
            ${renderSnackCostGrid()}
          </div>
        </div>

        <p class="aa-rule-line">First to 10 snacks wins.</p>

        <div class="aa-mode-buttons">
          <button
            id="aaStoryModeBtn"
            class="aa-mode-btn aa-story-btn"
            type="button"
            ${storyPlayable ? '' : 'disabled'}
          >
            ${storyButtonText}
            <small>${storyButtonSubtitle}</small>
          </button>

          <button
            id="aaArcadeModeBtn"
            class="aa-mode-btn aa-arcade-btn"
            type="button"
            ${arcadePlayable ? '' : 'disabled'}
          >
            Arcade Mode
            <small>${arcadeButtonSubtitle}</small>
          </button>
        </div>
      </section>
    </div>
  `;

  wireChooseScreen(container);
}


function wireChooseScreen(container) {
  const prev = container.querySelector('#aaPrevAnt');
  const next = container.querySelector('#aaNextAnt');
  const story = container.querySelector('#aaStoryModeBtn');
  const arcade = container.querySelector('#aaArcadeModeBtn');

  prev?.addEventListener('click', () => {
    const roster = getChooserRoster();
    const current = getSelectedRosterIndex();
    const nextIndex = (current - 1 + roster.length) % roster.length;
    previewAntId(roster[nextIndex].id);
    renderChooseScreen(container);
  });

  next?.addEventListener('click', () => {
    const roster = getChooserRoster();
    const current = getSelectedRosterIndex();
    const nextIndex = (current + 1) % roster.length;
    previewAntId(roster[nextIndex].id);
    renderChooseScreen(container);
  });

  story?.addEventListener('click', () => {
    const player = getAntById(selectedAntId);
    if (!canPlayStory(player.id)) return;

    markAntPlayed(player.id);

    const rival = getNextStoryRival(player.id);

    if (shouldShowStoryPrologue(player.id)) {
      renderStoryPrologueScreen(container, {
        playerAntId: player.id,
        rivalAntId: rival.id,
      });
      return;
    }

    renderStoryMissionScreen(container, {
      playerAntId: player.id,
      rivalAntId: rival.id,
    });
  });

  arcade?.addEventListener('click', () => {
    const player = getAntById(selectedAntId);
    if (!canPlayArcade(player.id)) return;

    markAntPlayed(player.id);

    renderVersusScreen(container, {
      mode: 'arcade',
      playerAntId: player.id,
      rivalAntId: getArcadeRival(player.id).id,
    });
  });
}



function renderStoryPrologueScreen(container, { playerAntId = selectedAntId, rivalAntId = getNextStoryRival(playerAntId).id } = {}) {
  if (!aliveGuard(container)) return;

  clearPhaseTimeouts();
  currentPhase = 'storyIntro';
  currentBattleMode = 'story';
  currentPlayerAnt = getAntById(playerAntId);
  currentRivalAnt = getAnyAntById(rivalAntId);

  resetBattleRuntimeCounters();

  const royalPng = getAntPortraitPng(currentPlayerAnt, 'royal');
  const basePng = getAntPortraitPng(currentPlayerAnt, 'base');

  container.innerHTML = `
    <div class="aa-prologue-screen aa-cinematic-screen">
      <section class="aa-cinematic-card aa-prologue-card" aria-label="Ant Attack story prologue">
        <header class="aa-cinematic-header">
          <span class="aa-cinematic-kicker">Story Mode</span>
          <h2>Royal Mission</h2>
        </header>

        <div class="aa-prologue-stage">
          <figure class="aa-prologue-character aa-prologue-royal">
            <img
              src="${assetUrl(royalPng)}"
              alt="Royal Ant"
              draggable="false"
            />
            <figcaption>Royal Ant</figcaption>
          </figure>

          <figure class="aa-prologue-character aa-prologue-player">
            <img
              src="${assetUrl(basePng)}"
              alt="${escapeHtml(currentPlayerAnt.name)}"
              draggable="false"
            />
            <figcaption>${escapeHtml(currentPlayerAnt.name)}</figcaption>
          </figure>
        </div>

        <div class="aa-dialogue-box aa-prologue-dialogue" aria-live="polite">
          <p class="aa-dialogue-line aa-speaker-royal">
            The blanket has fallen into snack chaos.
          </p>
          <p class="aa-dialogue-line aa-speaker-player">
            Collect every snack and prove your story.
          </p>
          <p class="aa-dialogue-mission">
            Win each battle to unlock the next ant.
          </p>
        </div>

        <button id="aaPrologueContinueBtn" class="aa-cinematic-btn" type="button">
          Continue
        </button>
      </section>
    </div>
  `;

  container.querySelector('#aaPrologueContinueBtn')?.addEventListener('click', () => {
    markStoryPrologueSeen(currentPlayerAnt.id);

    renderStoryMissionScreen(container, {
      playerAntId: currentPlayerAnt.id,
      rivalAntId: currentRivalAnt.id,
    });
  });
}

function renderStoryMissionScreen(container, { playerAntId = selectedAntId, rivalAntId = getNextStoryRival(playerAntId).id } = {}) {
  if (!aliveGuard(container)) return;

  clearPhaseTimeouts();
  currentPhase = 'storyIntro';
  currentBattleMode = 'story';
  currentPlayerAnt = getAntById(playerAntId);
  currentRivalAnt = getAnyAntById(rivalAntId);

  resetBattleRuntimeCounters();

  const guideLabel = currentRivalAnt?.id === 'queen' ? currentRivalAnt.name : 'Royal Ant';
  const guidePng = getAntPortraitPng(
    currentRivalAnt,
    currentRivalAnt?.id === 'queen' ? 'base' : 'royal'
  );

  container.innerHTML = `
    <div class="aa-mission-screen aa-cinematic-screen">
      <section class="aa-cinematic-card aa-mission-card" aria-label="Ant Attack rival royal briefing">
        <header class="aa-cinematic-header">
          <span class="aa-cinematic-kicker">Story Mode</span>
          <h2>Royal Mission</h2>
        </header>

        <figure class="aa-mission-royal">
          <img
            src="${assetUrl(guidePng)}"
            alt="${escapeHtml(guideLabel)}"
            draggable="false"
          />
          <figcaption>${escapeHtml(guideLabel)}</figcaption>
        </figure>

        <div class="aa-dialogue-box aa-mission-dialogue" aria-live="polite">
          <p class="aa-dialogue-line aa-speaker-royal">
            My worker guards the next snack road.
          </p>
          <p class="aa-dialogue-line aa-speaker-player">
            Face the challenge and keep marching.
          </p>
          <p class="aa-dialogue-mission">
            First to ${getBattleTargetScore('story', currentRivalAnt.id)} snacks wins.
          </p>
        </div>

        <button id="aaMissionContinueBtn" class="aa-cinematic-btn" type="button">
          Continue
        </button>
      </section>
    </div>
  `;

  container.querySelector('#aaMissionContinueBtn')?.addEventListener('click', () => {
    markStoryMissionSeen(currentPlayerAnt.id);

    renderStoryIntroScreen(container, {
      playerAntId: currentPlayerAnt.id,
      rivalAntId: currentRivalAnt.id,
    });
  });
}

function renderStoryIntroScreen(container, { playerAntId = selectedAntId, rivalAntId = getNextStoryRival(playerAntId).id } = {}) {
  if (!aliveGuard(container)) return;

  clearPhaseTimeouts();
  currentPhase = 'storyIntro';
  currentBattleMode = 'story';
  currentPlayerAnt = getAntById(playerAntId);
  currentRivalAnt = getAnyAntById(rivalAntId);

  resetBattleRuntimeCounters();

  const copy = getStoryIntroCopy(currentPlayerAnt, currentRivalAnt);
  const rivalPng = getAntPortraitPng(currentRivalAnt);

  container.innerHTML = `
    <div class="aa-story-screen aa-cinematic-screen">
      <section class="aa-cinematic-card aa-story-card" aria-label="Ant Attack story battle">
        <header class="aa-cinematic-header">
          <span class="aa-cinematic-kicker">Story Mode</span>
          <h2>Snack Mission</h2>
        </header>

        <div class="aa-story-stage">
          <figure class="aa-story-character aa-story-rival">
            <img
              src="${assetUrl(rivalPng)}"
              alt="${escapeHtml(currentRivalAnt.name)}"
              draggable="false"
            />
            <figcaption>${escapeHtml(currentRivalAnt.name)}</figcaption>
          </figure>

          <figure class="aa-story-character aa-story-player">
            <img
              src="${assetUrl(getAntPortraitPng(currentPlayerAnt))}"
              alt="${escapeHtml(currentPlayerAnt.name)}"
              draggable="false"
            />
            <figcaption>${escapeHtml(currentPlayerAnt.name)}</figcaption>
          </figure>
        </div>

        <div class="aa-dialogue-box" aria-live="polite">
          <p class="aa-dialogue-line aa-speaker-royal">${escapeHtml(copy.royalLine)}</p>
          <p class="aa-dialogue-line aa-speaker-player">${escapeHtml(copy.playerLine)}</p>
          <p class="aa-dialogue-mission">${escapeHtml(copy.missionLine)}</p>
        </div>

        <button id="aaStoryToVersusBtn" class="aa-cinematic-btn" type="button">
          Face ${escapeHtml(currentRivalAnt.name)}
        </button>
      </section>
    </div>
  `;

  container.querySelector('#aaStoryToVersusBtn')?.addEventListener('click', () => {
    renderVersusScreen(container, {
      mode: 'story',
      playerAntId: currentPlayerAnt.id,
      rivalAntId: currentRivalAnt.id,
    });
  });
}

function renderVersusScreen(container, { mode = 'story', playerAntId = selectedAntId, rivalAntId = getNextStoryRival(playerAntId).id } = {}) {
  if (!aliveGuard(container)) return;

  clearPhaseTimeouts();
  currentPhase = 'versus';
  currentBattleMode = mode;
  currentPlayerAnt = getAntById(playerAntId);
  currentRivalAnt = getAnyAntById(rivalAntId);

  resetBattleRuntimeCounters();

  const targetScore = getBattleTargetScore(mode, currentRivalAnt.id);

  container.innerHTML = `
    <div class="aa-versus-screen aa-cinematic-screen" data-aa-mode="${escapeHtml(mode)}">
      <section class="aa-cinematic-card aa-versus-card" aria-label="Ant Attack versus screen">
        <div class="aa-versus-fighter aa-versus-rival">
          <img
            src="${assetUrl(getAntPortraitPng(currentRivalAnt))}"
            alt="${escapeHtml(currentRivalAnt.name)}"
            draggable="false"
          />
          <strong>${escapeHtml(currentRivalAnt.name)}</strong>
        </div>

        <div class="aa-versus-center">
          <span class="aa-versus-vs">VS</span>
        </div>

        <div class="aa-versus-fighter aa-versus-player">
          <img
            src="${assetUrl(getAntPortraitPng(currentPlayerAnt))}"
            alt="${escapeHtml(currentPlayerAnt.name)}"
            draggable="false"
          />
          <strong>${escapeHtml(currentPlayerAnt.name)}</strong>
        </div>

        <div class="aa-versus-bottom">
          <span class="aa-versus-rule">First to ${targetScore} Snacks Wins!</span>
          <button
            id="aaVersusStartBtn"
            class="aa-cinematic-btn aa-versus-battle-btn"
            type="button"
            aria-label="Start battle"
          >
            Battle
          </button>
        </div>
      </section>
    </div>
  `;

  const startBattleFromVersus = () => {
    if (!aliveGuard(container) || currentPhase !== 'versus') return;

    startBattle(container, {
      mode,
      playerAntId: currentPlayerAnt.id,
      rivalAntId: currentRivalAnt.id,
    });
  };

  container.querySelector('#aaVersusStartBtn')?.addEventListener('click', startBattleFromVersus);
}

function renderResultsScreen(container, { winnerKind = getBattleWinnerKind() } = {}) {
  if (!aliveGuard(container)) return;

  clearPhaseTimeouts();
  currentPhase = 'results';
  roundInProgress = false;
  killFoodTween();
  clearAllRedTimeouts();

  const playerWon = winnerKind === 'player';
  const storyResult = currentBattleMode === 'story' && playerWon
    ? applyStoryVictoryProgress(currentPlayerAnt.id, currentRivalAnt.id)
    : null;

  const winnerAnt = playerWon ? currentPlayerAnt : currentRivalAnt;
  const title = `${winnerAnt.name} Wins!`;

  const unlockLine = storyResult?.unlockedAntName
    ? `${storyResult.unlockedAntName} Unlocked!`
    : '';

  const storyCompleteLine = storyResult?.storyComplete
    ? `${currentPlayerAnt.name} Story Complete!`
    : '';

  const primaryLabel = currentBattleMode === 'arcade'
    ? 'Again'
    : playerWon
      ? (storyResult?.storyComplete ? 'Ending' : 'Continue')
      : 'Try Again';

  container.innerHTML = `
    <div class="aa-results-screen aa-cinematic-screen">
      <section class="aa-cinematic-card aa-results-card" aria-label="Ant Attack results">
        <header class="aa-cinematic-header">
          <span class="aa-cinematic-kicker">${currentBattleMode === 'story' ? 'Story Result' : 'Arcade Result'}</span>
          <h2>${escapeHtml(title)}</h2>
        </header>

        <div class="aa-results-winner">
          <img
            src="${assetUrl(getAntPortraitPng(winnerAnt, playerWon ? 'powered' : 'base'))}"
            alt="${escapeHtml(winnerAnt.name)}"
            draggable="false"
          />
        </div>

        <div class="aa-results-scoreline">
          <span>${escapeHtml(currentPlayerAnt.shortName)}: <strong>${playerScore}</strong></span>
          <span>${escapeHtml(currentRivalAnt.shortName)}: <strong>${aiScore}</strong></span>
        </div>

        <p class="aa-results-copy">
          ${
            unlockLine
              ? escapeHtml(unlockLine)
              : storyCompleteLine
                ? escapeHtml(storyCompleteLine)
                : playerWon
                  ? 'Snack route secured. The picnic path opens.'
                  : 'The rival held the snack line. Run it back.'
          }
        </p>

        <div class="aa-results-actions">
          <button id="aaResultsBackBtn" class="aa-cinematic-btn aa-secondary-btn" type="button">Back</button>
          <button id="aaResultsPrimaryBtn" class="aa-cinematic-btn" type="button">${primaryLabel}</button>
        </div>
      </section>
    </div>
  `;

  container.querySelector('#aaResultsBackBtn')?.addEventListener('click', () => {
    renderChooseScreen(container);
  });

  container.querySelector('#aaResultsPrimaryBtn')?.addEventListener('click', () => {
    if (currentBattleMode === 'arcade') {
      renderVersusScreen(container, {
        mode: 'arcade',
        playerAntId: currentPlayerAnt.id,
        rivalAntId: getArcadeRival(currentPlayerAnt.id).id,
      });
      return;
    }

    if (!playerWon) {
      renderVersusScreen(container, {
        mode: 'story',
        playerAntId: currentPlayerAnt.id,
        rivalAntId: currentRivalAnt.id,
      });
      return;
    }

    if (storyResult?.storyComplete) {
      renderEndingScreen(container);
      return;
    }

    const nextRivalId = storyResult?.nextRivalId || getNextStoryRival(currentPlayerAnt.id).id;

    renderStoryMissionScreen(container, {
      playerAntId: currentPlayerAnt.id,
      rivalAntId: nextRivalId,
    });
  });
}

function renderEndingScreen(container) {
  if (!aliveGuard(container)) return;

  clearPhaseTimeouts();
  currentPhase = 'ending';

  const heroPng = getAntPortraitPng(currentPlayerAnt, 'powered');

  container.innerHTML = `
    <div class="aa-ending-screen aa-cinematic-screen">
      <section class="aa-cinematic-card aa-ending-card" aria-label="Ant Attack ending">
        <header class="aa-cinematic-header">
          <span class="aa-cinematic-kicker">Victory Snack</span>
          <h2>${escapeHtml(currentPlayerAnt.name)} Finished the Story!</h2>
        </header>

        <div class="aa-ending-art">
          <img
            src="${assetUrl(heroPng)}"
            alt="${escapeHtml(currentPlayerAnt.name)} powered up"
            draggable="false"
          />
        </div>

        <p class="aa-results-copy">
          The blanket is quiet. The snack crown glows. Final art goes here later.
        </p>

        <button id="aaEndingBackBtn" class="aa-cinematic-btn" type="button">Back to Ants</button>
      </section>
    </div>
  `;

  container.querySelector('#aaEndingBackBtn')?.addEventListener('click', () => {
    renderChooseScreen(container);
  });
}


function wireBackCapture(container) {
  const existing = _boundHandlers.get(container) || {};
  if (existing.onBackCapture) return;

  const onBackCapture = (ev) => {
    if (!aliveGuard(container)) return;

    const target = ev.target;
    const backBtn = target?.closest?.('#kcBack');
    if (!backBtn) return;

    // On Ant internal screens, Back returns to Ant Attack setup.
    // On choose screen, allow Kids Camping shell to handle Back to Camping setup.
    if (currentPhase !== 'choose') {
      ev.preventDefault();
      ev.stopPropagation();
      ev.stopImmediatePropagation();

      renderChooseScreen(container);
    }
  };

  document.addEventListener('click', onBackCapture, true);
  _boundHandlers.set(container, { ...existing, onBackCapture });
}

function wireContainerDeathWatcher(container) {
  // If the container leaves the DOM, auto-kill.
  if (_domObs) { try { _domObs.disconnect(); } catch {} }

  _domObs = new MutationObserver(() => {
    if (!document.body.contains(container)) {
      try { forceKillAntAttack(); } catch {}
    }
  });

  _domObs.observe(document.body, { childList: true, subtree: true });
}

// ────────────────────────────────────────────────────────────────────────────────
// Battle render / core loop
// ────────────────────────────────────────────────────────────────────────────────
const MAX_ANTS_PER_SIDE     = 10;
const TOTAL_ANT_POOL        = 10;
const RED_SPAWN_INTERVAL_MS = 1000;

function startBattle(container, { mode = 'story', playerAntId = 'black', rivalAntId = 'blue' } = {}) {
  if (!aliveGuard(container)) return;

  clearPhaseTimeouts();
  currentPhase = 'battle';
  currentBattleMode = mode;
  currentPlayerAnt = getAntById(playerAntId);
  currentRivalAnt = rivalAntId === 'queen' ? QUEEN_SNACKJACKET : getAntById(rivalAntId);

  resetBattleRuntimeCounters();

  renderBattleScreen(container);
  startNewRound(container);
}

function renderBattleScreen(container) {
  container.innerHTML = `
    <div class="ant-attack-wrapper aa-battle-wrapper" data-aa-mode="${currentBattleMode}">
      <div class="kc-ant-zone">
        <div class="score-overlay aa-score-overlay" style="position:absolute;bottom:-10px;left:-10px;">
          <span id="aaRivalScoreLabel">${currentRivalAnt.shortName}</span>: <span id="aiScore">0</span><br/>
          <span id="aaPlayerScoreLabel">${currentPlayerAnt.shortName}</span>: <span id="playerScore">0</span>
        </div>

        <div class="ant-base red">
          <img class="ant-hill-img" src="${assetUrl('aa_antBase.png')}" alt="${currentRivalAnt.name} base"/>
          <img class="ant2-img" src="${assetUrl(currentRivalAnt.basePng)}" alt="${currentRivalAnt.name}"/>
        </div>

        <div class="food-zone"><div class="food-container"></div></div>

        <div class="ant-base black">
          <img class="ant-hill-img" src="${assetUrl('aa_antBase.png')}" alt="${currentPlayerAnt.name} base"/>
        </div>

        <button id="kc-ant-button" class="ant-btn aa-send-ant-btn" type="button" aria-label="Send ant">
          <img src="${assetUrl(currentPlayerAnt.basePng)}" alt="Deploy ${currentPlayerAnt.name}"/>
          <span class="ant-count">10/10</span>
        </button>
      </div>
    </div>
  `;

  // background with fallback
  const zone = container.querySelector('.kc-ant-zone');
  const picnic = assetUrl('aa_picnicBlanket.png');
  const fallbackPicnic = assetUrl('picnicBlanket.png');
  const img = new Image();

  img.onload = () => {
    zone?.style.setProperty('--kc-ant-bg', `url(${picnic})`);
  };
  img.onerror = () => {
    zone?.style.setProperty('--kc-ant-bg', `url(${fallbackPicnic})`);
  };
  img.src = picnic;

  // Button handler (pointerdown for mobile snappiness)
  const antButton = container.querySelector('#kc-ant-button');
  const onPointerDown = (e) => {
    e.preventDefault();
    deployPlayerAnt(container);
  };

  antButton?.addEventListener('pointerdown', onPointerDown);

  const existing = _boundHandlers.get(container) || {};
  if (existing.onPointerDown && existing.onPointerDown !== onPointerDown) {
    try { antButton?.removeEventListener('pointerdown', existing.onPointerDown); } catch {}
  }
  _boundHandlers.set(container, { ...existing, onPointerDown });

  // simple glows
  antButton?.querySelector('img')?.classList.add('glow-white');
  container.querySelector('.ant2-img')?.classList.add('ant-glow-pink');

  // initial UI
  updateScores(container);
  updateAntCount(container);

  // Resize observer keeps ants anchored to food on layout change
  if (_resizeObs) { try { _resizeObs.disconnect(); } catch {} }
  _resizeObs = new ResizeObserver(() => {
    if (!aliveGuard(container) || currentPhase !== 'battle') return;

    const { centerX, centerY } = getFoodCenterCoords(container);
    activeAnts.forEach(ant => {
      const offsetX = parseFloat(ant.dataset.offsetX) || 0;
      const offsetY = parseFloat(ant.dataset.offsetY) || 0;
      gsap.set(ant, { left: centerX + offsetX - 16, top: centerY + offsetY - 16 });
    });
  });
  _resizeObs.observe(document.body);
}

function startNewRound(container) {
  if (!aliveGuard(container) || currentPhase !== 'battle') return;

  // wipe ants
  try { gsap.killTweensOf(activeAnts); } catch {}
  activeAnts.forEach(a => { stopCrawlWiggle(a); try { a.remove(); } catch {} });
  activeAnts.length = 0;

  if (playerAntPool <= 0) playerAntPool = TOTAL_ANT_POOL;
  playerAntsAttached = aiAntsAttached = 0;
  roundInProgress = true;
  currentDirection = null;

  updateAntCount(container);

  const foodContainer = container.querySelector('.food-container');
  if (!foodContainer) return;
  foodContainer.innerHTML = '';

  currentFood = foodCatalog[Math.floor(Math.random() * foodCatalog.length)];

  const foodEl = document.createElement('img');
  foodEl.className = 'food-plate-img';
  foodEl.id = 'antFood';
  foodEl.alt = currentFood.label;
  setImgSrcWithFallback(foodEl, currentFood.src, currentFood.fallback);

  if (currentFood.name === 'snowcone') foodEl.classList.add('big-snowcone');

  const overlay = document.createElement('div');
  overlay.className = 'food-weight-overlay';
  overlay.textContent = currentFood.weight;

  const wrapper = document.createElement('div');
  wrapper.className = 'food-with-overlay';
  wrapper.appendChild(foodEl);
  wrapper.appendChild(overlay);
  foodContainer.appendChild(wrapper);

  gsap.set(wrapper, { y: 0 });

  spawnRedAntLoop(container, currentFood.weight);
}

function deployPlayerAnt(container) {
  if (!aliveGuard(container) || currentPhase !== 'battle') return;
  if (playerAntPool <= 0 || !roundInProgress || playerAntsAttached >= MAX_ANTS_PER_SIDE) return;

  const zone = container.querySelector('.kc-ant-zone');
  const { centerX, centerY } = getFoodCenterCoords(container);
  const spawnFrom = zone.querySelector('.ant-base.black');
  const baseRect = spawnFrom.getBoundingClientRect();
  const zoneRect = zone.getBoundingClientRect();
  const spawnX = baseRect.left - zoneRect.left + baseRect.width / 2;
  const spawnY = baseRect.top  - zoneRect.top  + baseRect.height / 2;

  const ant = document.createElement('img');
  ant.src = assetUrl(currentPlayerAnt.soldierPng);
  ant.className = `ant-sprite player-ant-soldier ${currentPlayerAnt.id}-ant ant-glow-white`;
  ant.dataset.team = 'player';
  zone.appendChild(ant);

  const i = playerAntsAttached;
  const row = Math.floor(i / 5), col = i % 5;
  const offsetX = (col - 2) * 20;
  const offsetY = row * 20;
  ant.dataset.offsetX = offsetX;
  ant.dataset.offsetY = offsetY;

  gsap.set(ant, { left: spawnX, top: spawnY });
  stopCrawlWiggle(ant);

  activeAnts.push(ant);
  playerAntsAttached++;
  playerAntPool--;
  updateAntCount(container);

  // 🔔 milestone: full team attached
  if (playerAntsAttached >= MAX_ANTS_PER_SIDE) {
    container?.dispatchEvent(new CustomEvent('kcAntsFull', { bubbles: true }));
  }

  const targetX = centerX + offsetX - 16;
  const targetY = centerY + offsetY - 16;
  startCrawlWiggle(ant, spawnX, spawnY, targetX, targetY);

  gsap.to(ant, {
    left: targetX,
    top: targetY,
    duration: 0.5,
    ease: 'power2.out',
    onComplete: () => {
      stopCrawlWiggle(ant);
      triggerFoodMotion(container.querySelector('#antFood'), container);
      if (!foodTween) checkEndOfPlayWinner(container);
    },
    onInterrupt: () => stopCrawlWiggle(ant)
  });
}

function spawnRedAntLoop(container, requiredWeight) {
  if (!aliveGuard(container) || currentPhase !== 'battle') return;
  const session = ANT.session;
  const zone = container.querySelector('.kc-ant-zone');
  const { centerX, centerY } = getFoodCenterCoords(container);
  const spawnFrom = zone.querySelector('.ant-base.red');
  const baseRect = spawnFrom.getBoundingClientRect();
  const zoneRect  = zone.getBoundingClientRect();
  const spawnX = baseRect.left - zoneRect.left + baseRect.width / 2;
  const spawnY = baseRect.top  - zoneRect.top  + baseRect.height / 2;

  let i = 0;
  const maxRedAnts = Math.min(requiredWeight + Math.floor(Math.random() * 3) + 1, MAX_ANTS_PER_SIDE);

  function scheduleNext() {
    if (!aliveGuard(container) || session !== ANT.session || !roundInProgress || currentPhase !== 'battle' || i >= maxRedAnts) return;
    const tid = setTimeout(deployOneRedAnt, RED_SPAWN_INTERVAL_MS);
    redAntTimeouts.push(tid);
  }

  function deployOneRedAnt() {
    if (!aliveGuard(container) || session !== ANT.session || !roundInProgress || currentPhase !== 'battle' || i >= maxRedAnts) return;

    const ant = document.createElement('img');
    const primarySoldier = currentRivalAnt.soldierPng || 'aa_redAnt.png';
    const fallbackSoldier = currentRivalAnt.fallbackSoldierPng || 'aa_redAnt.png';
    ant.className = `ant-sprite rival-ant-soldier ${currentRivalAnt.id}-ant ant-glow-pink`;
    ant.dataset.team = 'rival';
    ant.style.position = 'absolute';
    ant.style.zIndex = '10';
    setImgSrcWithFallback(ant, primarySoldier, fallbackSoldier);
    zone.appendChild(ant);

    const row = Math.floor(i / 5), col = i % 5;
    const offsetX = (col - 2) * 20;
    const offsetY = -row * 20;
    ant.dataset.offsetX = offsetX;
    ant.dataset.offsetY = offsetY;

    gsap.set(ant, { left: spawnX, top: spawnY });

    const targetX = centerX + offsetX - 16;
    const targetY = centerY + offsetY - 16;

    startCrawlWiggle(ant, spawnX, spawnY, targetX, targetY);

    gsap.to(ant, {
      left: targetX,
      top: targetY,
      duration: 0.5,
      ease: 'power2.out',
      rotation: (Math.random() * 10) - 5,
      onComplete: () => {
        stopCrawlWiggle(ant);
        activeAnts.push(ant);
        aiAntsAttached++;
        triggerFoodMotion(container.querySelector('#antFood'), container);
        i++;
        if (roundInProgress && i < maxRedAnts) scheduleNext();
      },
      onInterrupt: () => stopCrawlWiggle(ant)
    });
  }

  // start now, then schedule 1/sec
  deployOneRedAnt();
}

function triggerFoodMotion(foodEl, container, forcedDirection = null) {
  if (!aliveGuard(container) || currentPhase !== 'battle') return;
  const foodWrapper = foodEl?.parentElement;
  if (!foodEl || !foodWrapper || !roundInProgress) return;

  const playerAnts = playerAntsAttached;
  const aiAnts     = aiAntsAttached;

  let direction = forcedDirection;
  if (!direction) {
    if (playerAnts > aiAnts) direction = 'player';
    else if (aiAnts > playerAnts) direction = 'ai';
    else direction = 'player'; // ties → player
  }

  // weight gate
  if (direction === 'player' && playerAnts < currentFood.weight) return;
  if (direction === 'ai'     && aiAnts     < currentFood.weight) return;

  if (currentDirection === direction && foodTween && foodTween.isActive()) return;
  currentDirection = direction;

  const zone = container.querySelector('.kc-ant-zone');
  const zoneHeight = zone.getBoundingClientRect().height;
  const targetY = zoneHeight * 0.5 * (direction === 'player' ? 1 : -1);
  const totalDistance = Math.abs(targetY - 0);
  const currentY = gsap.getProperty(foodWrapper, 'y') || 0;
  const remaining = Math.abs(targetY - currentY);

  let duration = (remaining / totalDistance) * currentFood.weight;
  duration = Math.max(duration, 0.15);

  activeAnts.forEach(stopCrawlWiggle);
  gsap.killTweensOf(foodWrapper);

  foodTween = gsap.to(foodWrapper, {
    y: targetY,
    duration,
    ease: 'linear',
    onComplete: () => endRound(container, direction === 'player' ? 'win' : 'loss', foodWrapper)
  });

  const sign = (direction === 'player') ? 1 : -1;
  const moveBy = sign * remaining;
  gsap.killTweensOf(activeAnts);
  gsap.to(activeAnts, { top: `+=${moveBy}`, duration, ease: 'linear' });
}

function checkEndOfPlayWinner(container) {
  if (!aliveGuard(container) || currentPhase !== 'battle') return;
  const foodEl = container.querySelector('#antFood');
  if (!foodEl || !roundInProgress || foodTween) return;

  const playerOut = playerAntPool <= 0;
  const aiOut     = aiAntsAttached >= MAX_ANTS_PER_SIDE;
  if (!(playerOut && aiOut)) return;

  let direction = 'player';
  if (aiAntsAttached > playerAntsAttached) direction = 'ai';
  triggerFoodMotion(foodEl, container, direction);
}

function endRound(container, result, foodWrapper) {
  if (!aliveGuard(container) || currentPhase !== 'battle') return;

  roundInProgress = false;
  killFoodTween();
  clearAllRedTimeouts();

  const playerAnts = playerAntsAttached;
  const required   = currentFood.weight;

  if (result === 'win') {
    playerScore++;
    let scoreBonus = 0;
    if (currentFood.name === 'snowcone') {
      scoreBonus = (playerAnts === required) ? 300 : (playerAnts === required + 1) ? 200 : 100;
      showRoundMessage('snowcone');
    } else if (playerAnts === required) {
      scoreBonus = 300; showRoundMessage('perfect');
    } else if (playerAnts === required + 1) {
      scoreBonus = 200; showRoundMessage('great');
    } else {
      scoreBonus = 100; showRoundMessage('good');
    }

    const regen = getPlayerRegenBonus(currentFood.name, required, playerAnts);
    playerAntPool = Math.min(playerAntPool + regen, TOTAL_ANT_POOL);

    appState.incrementPopCount(scoreBonus);
    updatePopUICallback?.();
  } else {
    aiScore++;
    playerAntPool = Math.min(playerAntPool + 3, TOTAL_ANT_POOL);
    showRoundMessage('loss');
  }

  // 🔔 Broadcast round result & running margin.
  try {
    const margin = playerScore - aiScore;
    document.dispatchEvent(new CustomEvent('kcAntRoundResult', {
      detail: {
        result,
        playerWins: playerScore,
        aiWins: aiScore,
        margin
      }
    }));
  } catch {}

  updateScores(container);
  updateAntCount(container);

  const battleWinnerKind = getBattleWinnerKind();

  if (battleWinnerKind) {
    clearAllRedTimeouts();
    killFoodTween();
  }

  gsap.to(activeAnts, {
    opacity: 0,
    duration: 0.5,
    onComplete: () => {
      activeAnts.forEach(a => { stopCrawlWiggle(a); try { a.remove(); } catch {} });
      activeAnts.length = 0;
    }
  });

  gsap.to(foodWrapper, {
    opacity: 0,
    duration: 0.5,
    onComplete: () => {
      const fc = container.querySelector('.food-container');
      if (fc) { fc.innerHTML = ''; gsap.set(fc, { opacity: 1 }); }

      const session = ANT.session;

      setTimeout(() => {
        if (session !== ANT.session || !aliveGuard(container) || currentPhase !== 'battle') return;

        if (battleWinnerKind) {
          renderResultsScreen(container, { winnerKind: battleWinnerKind });
          return;
        }

        if (!roundInProgress) {
          startNewRound(container);
        }
      }, battleWinnerKind ? 700 : 1000);
    }
  });
}

// ────────────────────────────────────────────────────────────────────────────────
// HMR safety
// ────────────────────────────────────────────────────────────────────────────────
if (import.meta?.hot) {
  import.meta.hot.dispose(() => {
    try { forceKillAntAttack(); } catch {}
  });
}
