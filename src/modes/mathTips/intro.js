import { appState } from '../../data/appState.js';
import data from './qabotDATA.js';
import { pick } from './utils.js';

/////////////////////////////
// 🚀 Smart Intro Generator
/////////////////////////////
export function getIntroMessage() {
  const mood = appState.getMood();
  const percent = appState.getCompletionPercent();
  const badges = appState.profile.badges.length;
  const theme = appState.settings.theme;

  // 🌟 Cosmic First-Time Intro
  if (!appState.profile.seenIntro) {
    appState.setSeenIntro(true); // ✅ Lock it as seen

    return [
      `🌌 Yo traveler... welcome to **MathTips Village!**`,
      `🍧 This is my cosmic chill zone where math, vibes, and cones collide.`,
      `🤙 I'm **Pythagorus Cat**, triangle sorcerer, vibe curator, and snowcone ambassador.`,
      `💡 You can ask me stuff like **"tell me about cones"**, **"help with algebra"**, or **"what's your vibe?"**`,
      `✨ Let’s stack some cones... and some knowledge.`
    ].join('\n\n');
  }

  // 🔮 If they've never asked "who are you"
  if (!appState.storyMemory.askedWhoAreYou) {
    return [
      pick(data.greetings),
      `👀 Yo... just so you know... I'm **Pythagorus Cat.** Triangle wizard. Cone slinger. Keeper of crunch.`,
      vibeLine(mood, percent),
      badgeLine(badges),
      themeLine(theme),
      suggestionLine()
    ].join('\n\n');
  }

  // 🔥 Regular Intro Check-In Vibe
  return [
    pick(data.greetings),
    vibeLine(mood, percent),
    badgeLine(badges),
    themeLine(theme),
    suggestionLine()
  ].join('\n\n');
}

/////////////////////////////
// 🔥 Helper Builders
/////////////////////////////
function vibeLine(mood, percent) {
  return `🌈 I’m vibin' at **${percent.toFixed(0)}%** completion — feelin' **${mood.toUpperCase()}**.`;
}

function badgeLine(badges) {
  return badges === 0
    ? `👾 No badges yet... but yo, they’re waiting for you.`
    : `🏅 You got **${badges} badge${badges > 1 ? 's' : ''}** stacked. Crunchy progress.`;
}

function themeLine(theme) {
  return theme !== 'menubackground'
    ? `🎨 You're rockin' the **${theme}** theme. Lookin' fresh.`
    : `🎨 You’re vibin' with the default festival glow.`;
}

function suggestionLine() {
  return pick([
    `🤙 Ask me about math, the festival, or snowcones.`,
    `💡 Hit me with math questions or lore vibes.`,
    `🎲 Wanna hear a joke? Or ask about cones, badges, or the fest.`,
    `🚀 You can type stuff like **“tell me about cones”**, **“help with algebra”**, or **“what's your vibe”**.`,
    `🔮 I'm always down to drop a math tip... or a quesadilla recipe.`
  ]);
}
