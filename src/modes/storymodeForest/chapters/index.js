// src/modes/storyMode/chapters/index.js
import { Chapter1 } from './ch1.js';
import { Chapter2 } from './ch2.js';
import { Chapter3 } from './ch3.js';
import { Chapter4 } from './ch4.js';
import { Chapter5 } from './ch5.js';
import { CreatorsJournal } from './chJournal.js'; // 👈 NEW

export const Chapters = {
  [Chapter1.id]: Chapter1,
  [Chapter2.id]: Chapter2,
  [Chapter3.id]: Chapter3,
  [Chapter4.id]: Chapter4,
  [Chapter5.id]: Chapter5,
  [CreatorsJournal.id]: CreatorsJournal, // 👈 NEW
};
