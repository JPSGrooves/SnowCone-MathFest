// src/modes/storyMode/chapters/chJournal.js
import { SlideRole } from '../../../data/storySchema.js';

const BASE = import.meta.env.BASE_URL;

const PRO_IMG     = (n) => `${BASE}assets/img/characters/storyMode/${n}`;
const PRO_MED_IMG = (n) => `${BASE}assets/img/characters/storyMode/${n}?md=1`;
const SCN_MED_IMG = (n) => `${BASE}assets/img/modes/storymodeForest/${n}?md=1`;

export const CreatorsJournal = {
  id: 'chJournal',
  title: `Creator's Journal (iOS Exclusive)`,
  slides: [
    // ──────────────────────────
    // Intro
    // ──────────────────────────
    {
      id: 'cj_intro',
      role: SlideRole.ADVANCE,
      mode: 'journal',   // 👈 changed from 'solo'
      title: `iOS Exclusive: Creator's Journal`,
      img: PRO_IMG('boredJehnk.png'),
      text: `<span style="color: rgb(247, 255, 105); font-size: 1.1em;">Thanks for grabbing the iOS version of SnowCone MathFest. 💛</span><br>I wanted to give you something that only <em>purchasers</em> get:a little tour through the notes and scraps that helped build this festival.<br>There’s also an extra Jukebox track in this build — between that and this journal, think of it like a tiny “behind the curtain” pass. 🎟️🍧<br><br>No XP, no puzzles — just vibes.`,
      soloLabel: 'Start reading ➡️',
    },

    // ──────────────────────────
    // Pair 1 – Words + Image
    // ──────────────────────────
    {
      id: 'cj_words_01',
      role: SlideRole.ADVANCE,
      mode: 'journal',   // 👈
      title: 'Journal Entry #1',
      text: `<em style="color: rgb(247, 255, 105);">Origins.</em><br><br>How did this all get started?<br><br>I have to admit, I got the idea from a popular cartoon to ask the AI if it wanted to "build an app". After it said yes, I started planning something that was definitely NOT what you are seeing now...I originally planned a money management app, but thought quickly realized how many institutions I would have to tap into to make it work. So I pivoted to something I could build solo, something people could still use, something for the kids, and that’s how SnowCone MathFest was born.<br><br>From there, it was a lot of late nights, lots of coffee, and a whole lot of code.
      `,
      soloLabel: 'Next ➡️',
    },
    {
      id: 'cj_image_01',
      role: SlideRole.ADVANCE,
      mode: 'journal',   // 👈
      title: 'Journal Snapshot #1',
      img: PRO_MED_IMG('iceyTruck.png'),
      text: `
        <em>Snapshot #1 – The truck.</em><br>
        Swap this later for a notebook photo, first logo pass, or a rougher sketch
        if you want, but it’s a good “this whole thing is real” anchor.
      `,
      soloLabel: 'Next ➡️',
    },

    // ──────────────────────────
    // Pair 2 – Music
    // ──────────────────────────
    {
      id: 'cj_words_02',
      role: SlideRole.ADVANCE,
      mode: 'journal',   // 👈
      title: 'Journal Entry #2',
      text: `
        <em style="color: rgb(247, 255, 105);">Soundtrack.</em><br><br>
        (Replace this later.)<br><br>
        Slot for music talk: which track came first, which one almost broke you,
        how certain songs lined up with QuickServe, Infinity, Story, or Kids Camping,
        and how it felt hearing your own loops inside the game for the first time.
      `,
      soloLabel: 'Next ➡️',
    },
    {
      id: 'cj_image_02',
      role: SlideRole.ADVANCE,
      mode: 'journal',   // 👈
      title: 'Journal Snapshot #2',
      img: PRO_MED_IMG('lovelacegausspicture.png'),
      text: `
        <em>Snapshot #2 – Big scene art.</em><br>
        Good place for a scrapped environment, UI experiment,
        or an alternate background that never shipped.
      `,
      soloLabel: 'Next ➡️',
    },

    // ──────────────────────────
    // Pair 3 – Teaching / kids
    // ──────────────────────────
    {
      id: 'cj_words_03',
      role: SlideRole.ADVANCE,
      mode: 'journal',   // 👈
      title: 'Journal Entry #3',
      text: `
        <em style="color: rgb(247, 255, 105);">Kids & Classrooms.</em><br><br>
        (Replace this later.)<br><br>
        Talk about students, teaching, or why making a math game felt worth the grind:
        the gap between “worksheet math” and “festival math,” and what you hope kids feel
        the first time they solve something in this world.
      `,
      soloLabel: 'Next ➡️',
    },
    {
      id: 'cj_image_03',
      role: SlideRole.ADVANCE,
      mode: 'journal',   // 👈
      title: 'Journal Snapshot #3',
      img: PRO_MED_IMG('turingbrahmaguptapicture.png'),
      text: `
        <em>Snapshot #3 – Quiet thinkers.</em><br>
        Maybe later this becomes classroom-flavored art,
        or gets swapped for a sketch about kids actually playing.
      `,
      soloLabel: 'Next ➡️',
    },

    // ──────────────────────────
    // Pair 4 – Cut ideas
    // ──────────────────────────
    {
      id: 'cj_words_04',
      role: SlideRole.ADVANCE,
      mode: 'journal',   // 👈
      title: 'Journal Entry #4',
      text: `
        <em style="color: rgb(247, 255, 105);">Almost Cut.</em><br><br>
        (Replace this later.)<br><br>
        A slot for ideas that almost made it:
        a mode you scoped out, a feature that fought you,
        or a story beat that moved around before it finally landed.
      `,
      soloLabel: 'Next ➡️',
    },
    {
      id: 'cj_image_04',
      role: SlideRole.ADVANCE,
      mode: 'journal',   // 👈
      title: 'Journal Snapshot #4',
      img: SCN_MED_IMG('portalGlow.png'),
      text: `
        <em>Snapshot #4 – Portal sketch.</em><br>
        Map scribbles, flowcharts, or cursed prototype screenshots would also fit here later.
      `,
      soloLabel: 'Next ➡️',
    },

    // ──────────────────────────
    // Pair 5 – Release & soundtrack
    // ──────────────────────────
    {
      id: 'cj_words_05',
      role: SlideRole.ADVANCE,
      mode: 'journal',   // 👈
      title: 'Journal Entry #5',
      text: `
        <em style="color: rgb(247, 255, 105);">Release Plans.</em><br><br>
        (Replace this later.)<br><br>
        Use this for how the soundtrack release lines up with the app:
        weekly drops, big launch, or what you hope people do with the music
        when they’re not playing.
      `,
      soloLabel: 'Next ➡️',
    },
    {
      id: 'cj_image_05',
      role: SlideRole.ADVANCE,
      mode: 'journal',   // 👈
      title: 'Journal Snapshot #5',
      img: PRO_MED_IMG('cosmicCone.png'),
      text: `
        <em>Snapshot #5 – Music vibes.</em><br>
        DAW screenshots, cover mockups, or tracklist scribbles
        can all live here once you have them.
      `,
      soloLabel: 'Next ➡️',
    },

    // ──────────────────────────
    // Pair 6 – Burnout & doubt
    // ──────────────────────────
    {
      id: 'cj_words_06',
      role: SlideRole.ADVANCE,
      mode: 'journal',   // 👈
      title: 'Journal Entry #6',
      text: `
        <em style="color: rgb(247, 255, 105);">Burnout & Tiny Wins.</em><br><br>
        (Replace this later.)<br><br>
        Space for the rough patches: money stress, time stress,
        nights where you almost quit, and the tiny victories that pulled you back in.
      `,
      soloLabel: 'Next ➡️',
    },
    {
      id: 'cj_image_06',
      role: SlideRole.ADVANCE,
      mode: 'journal',   // 👈
      title: 'Journal Snapshot #6',
      img: PRO_MED_IMG('jehnkTransparent.png'),
      text: `
        <em>Snapshot #6 – Dev ghost.</em><br>
        Could be swapped for todo stacks, sticky notes,
        or any “I almost gave up here” image later.
      `,
      soloLabel: 'Next ➡️',
    },

    // ──────────────────────────
    // Pair 7 – Real players
    // ──────────────────────────
    {
      id: 'cj_words_07',
      role: SlideRole.ADVANCE,
      mode: 'journal',   // 👈
      title: 'Journal Entry #7',
      text: `
        <em style="color: rgb(247, 255, 105);">Players.</em><br><br>
        (Replace this later.)<br><br>
        Talk about how real kids, friends, or coworkers reacted
        vs what you imagined in your head. What surprised you?
      `,
      soloLabel: 'Next ➡️',
    },
    {
      id: 'cj_image_07',
      role: SlideRole.ADVANCE,
      mode: 'journal',   // 👈
      title: 'Journal Snapshot #7',
      img: PRO_MED_IMG('galileonewtonpicture.png'),
      text: `
        <em>Snapshot #7 – Reactions.</em><br>
        Later you could swap this for table photos, classroom boards, or festival pics.
      `,
      soloLabel: 'Next ➡️',
    },

    // ──────────────────────────
    // Pair 8 – Money & value
    // ──────────────────────────
    {
      id: 'cj_words_08',
      role: SlideRole.ADVANCE,
      mode: 'journal',   // 👈
      title: 'Journal Entry #8',
      text: `
        <em style="color: rgb(247, 255, 105);">Money Math.</em><br><br>
        (Replace this later.)<br><br>
        Here you can be honest about pricing stress, loans, wanting the app
        to pay for itself, and how you decided what a “fair” price felt like.
      `,
      soloLabel: 'Next ➡️',
    },
    {
      id: 'cj_image_08',
      role: SlideRole.ADVANCE,
      mode: 'journal',   // 👈
      title: 'Journal Snapshot #8',
      img: PRO_MED_IMG('bombellieuclidpicture.png'),
      text: `
        <em>Snapshot #8 – Money geometry.</em><br>
        Could be replaced with banner mocks, pricing charts, or promo flyers later.
      `,
      soloLabel: 'Next ➡️',
    },

    // ──────────────────────────
    // Pair 9 – Lore dump
    // ──────────────────────────
    {
      id: 'cj_words_09',
      role: SlideRole.ADVANCE,
      mode: 'journal',   // 👈
      title: 'Journal Entry #9',
      text: `
        <em style="color: rgb(247, 255, 105);">Lore Dump.</em><br><br>
        (Replace this later.)<br><br>
        A slot for pure lore, but in your own voice:
        ghosts, dinos, portals, the long loop — why this specific fiction feels right
        for how your brain sees math.
      `,
      soloLabel: 'Next ➡️',
    },
    {
      id: 'cj_image_09',
      role: SlideRole.ADVANCE,
      mode: 'journal',   // 👈
      title: 'Journal Snapshot #9',
      img: PRO_MED_IMG('infinity.png'),
      text: `
        <em>Snapshot #9 – Lore symbol.</em><br>
        Perfect for weird art that was “too much” for the main story,
        or deeper SnowCone MathFest symbology.
      `,
      soloLabel: 'Next ➡️',
    },

    // ──────────────────────────
    // Pair 10 – Thank-you + final art
    // ──────────────────────────
    {
      id: 'cj_words_10',
      role: SlideRole.ADVANCE,
      mode: 'journal',   // 👈
      title: 'Journal Entry #10',
      text: `
        <em style="color: rgb(247, 255, 105);">Thanks.</em><br><br>
        (Replace this later.)<br><br>
        Final note directly to the player who bought the app:
        why their support matters, what you hope they carry away from this world,
        and where you’d love to take SnowCone MathFest next.
      `,
      soloLabel: 'Next ➡️',
    },
    {
      id: 'cj_image_10',
      role: SlideRole.EPILOGUE,
      mode: 'journal',   // 👈
      title: 'Journal Snapshot #10',
      img: PRO_MED_IMG('finalsnowconepicture.png'),
      text: `
        <em>Snapshot #10 – Festival at 2am.</em><br>
        End with something strong here later — a favorite shot, composite,
        or pure “festival at 2am” energy.<br><br>
        Thanks again for picking up the iOS version and spending time in this story. 🍧
      `,
      soloLabel: 'Back to Story Menu',
    },
  ],
};
