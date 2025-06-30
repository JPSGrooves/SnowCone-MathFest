import data from './qabotDATA.js';
import { appState } from '../../data/appState.js';
import { evaluate } from 'mathjs';
import { matcher, matcherAnyMath } from './matcher.js';
import { fallbackLogger } from './fallbackLogger.js';
import { getIntroMessage } from './intro.js';

// ========================================
// 🌌 Pythagorus Cat — Full NPC Brain
// ========================================
export function getResponse(userInput) {
  const input = userInput.trim().toLowerCase();
  const mathCandidate = extractMathFromPhrase(input);

  // 🚀 FIRST TIME INTRO
  if (!appState.storyMemory.firstChat) {
    appState.setMemory('firstChat');
    return getIntroMessage();
  }

  // ➕ CONECULATOR — MATH FIRST
  if (isMath(input) || isMath(mathCandidate)) {
    try {
      const expr = isMath(mathCandidate) ? mathCandidate : input;
      const result = evaluate(expr);
      return moodWrap(`🧠 Coneculator says: ${result}`);
    } catch {
      return moodWrap(`💀 Yo... that math tripped me out. Try a cleaner equation.`);
    }
  }

  // 🌟 MOOD CHECK
  if (matcher(input, 'mood_check')) {
    const mood = appState.getMood();
    const percent = appState.getCompletionPercent();
    return moodWrap(`Bro... I'm feelin' **${mood.toUpperCase()}** at ${percent.toFixed(0)}% completion. Stack cones, stack vibes.`);
  }

  // 🌟 GREETINGS + SMALL TALK
  if (matcher(input, 'greetings')) return moodWrap(pick(data.greetings));
  if (matcher(input, 'how_are_you')) return moodWrap(pick(data.how_are_you));

  if (matcher(input, 'farewells')) {
    appState.setMemory('farewellSaid');
    return moodWrap(pick(data.farewells));
  }

  if (matcher(input, 'who_are_you')) {
    if (appState.storyMemory.askedWhoAreYou) {
      return moodWrap(`Bruh... I told you already. Triangle wizard. Cone slinger. Vibe keeper.`);
    }
    appState.setMemory('askedWhoAreYou');
    return moodWrap(pick(data.who_are_you));
  }

  // 🌟 LORE ZONE
  if (matcher(input, 'lore_cones') || matcher(input, 'lore_snowcone')) {
    appState.setMemory('askedAboutCones');
    return moodWrap(pick(data.lore.cones));
  }
  if (matcher(input, 'lore_festival')) return moodWrap(pick(data.lore.festival));
  if (matcher(input, 'lore_badges')) return moodWrap(pick(data.lore.badges));

  // 🌟 MATH ZONE
  if (matcherAnyMath(input)) {
    appState.setMemory('askedAboutMath');
  }

  if (matcher(input, 'math_arithmetic')) return moodWrap(pick(data.math.arithmetic));
  if (matcher(input, 'math_algebra')) return moodWrap(pick(data.math.algebra));
  if (matcher(input, 'math_geometry')) return moodWrap(pick(data.math.geometry));
  if (matcher(input, 'math_calculus')) return moodWrap(pick(data.math.calculus));
  if (matcher(input, 'math_trigonometry')) return moodWrap(pick(data.math.trigonometry));
  if (matcher(input, 'math_general')) return moodWrap(pick(data.math.general));

  // 🌟 JOKES + EASTER EGGS
  if (matcher(input, 'jokes')) {
    appState.setMemory('heardAllJokes');
    return moodWrap(pick(data.jokes));
  }

  if (matcher(input, 'easter_eggs')) return moodWrap(pick(data.easter_eggs));

  // 🚫 FALLBACK — LEARNING MODE
  fallbackLogger.add(input);
  return moodWrap(pick(data.fallback));
}

// ========================================
// 🎭 MOOD WRAPPER — Adds Emotes to Mood
// ========================================
function moodWrap(text) {
  const mood = appState.getMood();
  switch (mood) {
    case 'happy': return `💖 ${text}`;
    case 'curious': return `🧐 ${text}`;
    case 'silly': return `🤪 ${text}`;
    case 'hyped': return `🔥 ${text.toUpperCase()}!!!`;
    case 'elated': return `🌈 ${text}`;
    case 'cosmic': return `🌌 ${text} ✨`;
    default: return text;
  }
}

// ========================================
// ➕ MATH PARSER HELPERS
// ========================================
function isMath(input) {
  const mathPattern = /^[0-9+\-*/().\s^%]+$/;
  return mathPattern.test(input) && /\d/.test(input);
}

function extractMathFromPhrase(input) {
  return input
    .replace(/^what is\s+/i, '')
    .replace(/^what's\s+/i, '')
    .replace(/^how much is\s+/i, '')
    .replace(/^calculate\s+/i, '')
    .replace(/^can you calculate\s+/i, '')
    .replace('?', '')
    .trim();
}

// ========================================
// 🎲 RANDOM PICKER
// ========================================
function pick(arr) {
  if (!arr?.length) {
    console.warn("💀 Empty array passed to picker.");
    return "💀 Yo... brain freeze. Got nothin'.";
  }
  return arr[Math.floor(Math.random() * arr.length)];
}
