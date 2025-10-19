// ch2.js
import { SlideRole } from '../../../data/storySchema.js';
const BASE = import.meta.env.BASE_URL;
const PRO_IMG = (n) => `${BASE}assets/img/characters/storyMode/${n}`;

export const Chapter2 = {
  id: 'ch2',
  title: 'Shift: Four Customers',
  slides: [{
    title: 'The Ropes',
    img: PRO_IMG('jehnk.png'),
    text: 'You step past the ropes. The night air tastes like neon and sugar.',
    mode: 'solo',
    role: SlideRole.ADVANCE,
  }],
};
