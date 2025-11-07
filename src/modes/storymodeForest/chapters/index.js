// src/modes/storyMode/chapters/index.js
import { Chapter1 } from './ch1.js';
import { Chapter2 } from './ch2.js';   // <-- ADD THIS

export const Chapters = {
  [Chapter1.id]: Chapter1,
  [Chapter2.id]: Chapter2,             // <-- AND THIS
};
