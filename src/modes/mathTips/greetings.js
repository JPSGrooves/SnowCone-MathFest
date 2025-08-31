
// /src/modes/mathTips/greetings.js
import { displayName } from './displayName.js';

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomGreeting(appStateLike) {
  const name = displayName(appStateLike);

  const GREETS = [
    `Hey ${name}! I’m Grampy P — anything I can help out with?`,
    `Welcome back, ${name}. Let’s keep those math skills sharp!`,
    `Yo ${name}! Tried any tasty cones lately?`,
  ];

  return pick(GREETS);
}
