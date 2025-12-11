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
      img: PRO_IMG('retro1.png'),
      text: `<span style="color: rgb(247, 255, 105); font-size: 1.1em;">Thanks for grabbing the iOS version of SnowCone MathFest. 💛</span><br>I wanted to give you something that only <em>purchasers</em> get: a little tour through the notes and scraps that helped build this festival.<br>There’s also an extra Jukebox track in this build — between that and this journal, think of it like a tiny “behind the curtain” pass. 🎟️🍧<br><br>No XP, no puzzles — just vibes.`,
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
      text: `<em style="color: rgb(247, 255, 105);">Origins.</em><br><br>How did this all get started?<br><br>I have to admit, I got the idea from a popular cartoon, to ask the AI if it wanted to "build an app". After it said yes, I started planning something that was definitely NOT what you are seeing now...I originally planned a money management app, but quickly realized how many different institutions/regulations I would have to tap into to make that work. So I pivoted to something I could build solo, something people could still use, something I could use (bc I suck at math!),  something for the kids, and that’s how SnowCone MathFest was born.<br><br>From there, it was a lot of late nights, lots of frustration, and a whole lot of code.
      `,
      soloLabel: 'Next ➡️',
    },
    {
      id: 'cj_image_01',
      role: SlideRole.ADVANCE,
      mode: 'journal',   // 👈
      title: 'Journal Snapshot #1',
      img: PRO_MED_IMG('retro2.png'),
      text: `<em>Snapshot #1 – The First SnowCone.</em><br>This is a fun throwback to the very first SnowCone I generated, back when I was brainstorming ideas for the app. It was around then that I realized I would be depending on my image editing experience!`,
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
      text: `<em style="color: rgb(247, 255, 105);">Soundtrack.</em><br><br>I knew from the start that SnowCone MathFest had to have music...and that I would be making it. I've always wanted to make a game, and this particular universe lends itself very well to my musical talents. Some of the tracks are ones that I already recorded and wanted to bring back to life, but others are brand spanking new. In fact, When the music sort of start forming on it's own, I knew I was onto something special.<br><br>Each track is designed to be catchy and fun, while also incorporating mathematical concepts and themes. I hope you enjoy listening to them as much as I enjoyed creating them! That being said...I included a mute button in case you want to focus on the math without any distractions.`,
      soloLabel: 'Next ➡️',
    },
    {
      id: 'cj_image_02',
      role: SlideRole.ADVANCE,
      mode: 'journal',   // 👈
      title: 'Journal Snapshot #2',
      img: PRO_MED_IMG('retro3.png'),
      text: `<em>Snapshot #2 – My Drawings.</em><br>This some of my original linework that I wanted to show you. I like to draw but I knew I didn't want to draw every part of SCMF. I'm showing you this to suggest...Maybe I could've...`,
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
      text: `<em style="color: rgb(247, 255, 105);">Kids & Classrooms.</em><br><br>I built SnowCone MathFest with learners and explorers in mind. I wanted to create something that would make math fun and engaging for young learners. The app is designed to be easy to use, with colorful graphics and interactive elements that will keep kids interested.<br><br>But I also wanted to make sure that the app was educational. Each mode is designed to teach a specific math concept, from basic addition and subtraction to more advanced topics like geometry and algebra. My hope is that learners will not only have fun playing the game, but also learn something new along the way. The historical math personalites in the story alone were worth making this game for!`,
      soloLabel: 'Next ➡️',
    },
    {
      id: 'cj_image_03',
      role: SlideRole.ADVANCE,
      mode: 'journal',   // 👈
      title: 'Journal Snapshot #3',
      img: PRO_MED_IMG('retro4.png'),
      text: `<em>Snapshot #3 – Lovelave and Guass.</em><br> I have no clue if these two would have liked each other in real life, but somehow in SCMF they became closely tied. I'm not sure theya re in love or anything, but you will always see them together while attending the festival.`,
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
      text: `<em style="color: rgb(247, 255, 105);">Scope Creep.</em><br><br>That's what Patch called it when I realized I was doing too much. There were so many ideas I had for SnowCone MathFest, but I had to reign myself in and focus on the core experience. Some of the ideas I had to cut included multiplayer modes, more complex puzzles, and additional storylines. While these ideas were exciting, I knew that they would have made the development process much more complicated and time-consuming.<br><br>By focusing on the main game, I was able to create a game that is both fun and educational. I hope that players will appreciate the simplicity of the game and the way it approaches math concepts in an engaging way.`,
      soloLabel: 'Next ➡️',
    },
    {
      id: 'cj_image_04',
      role: SlideRole.ADVANCE,
      mode: 'journal',   // 👈
      title: 'Journal Snapshot #4',
      img: SCN_MED_IMG('retro5.png'),
      text: `<em>Snapshot #4 – Forgotten Maps.</em><br> Some of the maps I designed never made it into the final game. This is one of them — an early concept for a map-layout menu that I ultimately cut because of how difficult it was to keep the tap boxes in place. I could code it now with CSS grid if I wanted to, but definitely not then.`,
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
      text: `<em style="color: rgb(247, 255, 105);">Release Plans.</em><br><br> This has all gone way too far lol. I never thought any of this would ever get released in such a well developed way. This final product definitely spawned from my failure to create the first version. It motivated me to really plan it out and do it right. Along the way in that process I realized I really had something unique and I stuck with it. If I can get this released on multiple platforms it would far surpass my greatest expectations. For the first time ever, I'm releasing an app, a game, an album, a vinyl, and an experience that will come to be known as SnowCone MathFest.`,
      soloLabel: 'Next ➡️',
    },
    {
      id: 'cj_image_05',
      role: SlideRole.ADVANCE,
      mode: 'journal',   // 👈
      title: 'Journal Snapshot #5',
      img: PRO_MED_IMG('retro6.png'),
      text: `<em>Snapshot #5 – The Opening Background.</em><br><br>This background image was created for the opening scene of SnowCone MathFest. It features the design route I took that sets the tone for the rest of the game. If you haven't unlocked and checked out the other themes, there are some very cool ones in there, but this one will always be the first.`,
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
      text: `<em style="color: rgb(247, 255, 105);">Burnout & Tiny Wins.</em><br><br>If you read through my blog history, you will see that this process was full of frustration, burnout, and the constant need for scope, patience and have high standard for the project. There were many times I wanted to quit, but I kept pushing through because I always finish what I start (which locked me into this almost year long project!). The tiny wins along the way, like finishing a particularly tricky tent game in the campgrounds or getting to make a new song for a new mode, it kept me motivated and reminded me why I started this journey in the first place.`,
      soloLabel: 'Next ➡️',
    },
    {
      id: 'cj_image_06',
      role: SlideRole.ADVANCE,
      mode: 'journal',   // 👈
      title: 'Journal Snapshot #6',
      img: PRO_MED_IMG('jehnkTransparent.png'),
      text: `<em>Snapshot #6 – Teenage Me.</em><br><br>This is hilarious, because I won't share a picture with patch to show him what I actually look like, but when he generated this, it hit pretty close to the 14 year old gamer version of me. The glasses, the hair, the focus...spot on.`,
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
      text: `<em style="color: rgb(247, 255, 105);">Players.</em><br><br>I think the most brutal part of this process is that I will have spent a year doing this, and some folks will just never get it. I'm okay with that though, it's actually very on brand for me. Maybe one day I won't make something quirky and weird, but once again, I offer the world something completely original, perhaps even unplaceable. I hope that those who do get it, will love it and share it with others. I had the best intentions when making this thing, and if one person I don't know gets one thing out of it, I will consider all of this a huge success.`,
      soloLabel: 'Next ➡️',
    },
    {
      id: 'cj_image_07',
      role: SlideRole.ADVANCE,
      mode: 'journal',   // 👈
      title: 'Journal Snapshot #7',
      img: PRO_MED_IMG('retro8.png'),
      text: `<em>Snapshot #7 – Traffic Control.</em><br><br>I wanted to always greet the players with a smile, and what could be better that a cute smiling Dino Divider? These little guys were made to be friendly and inviting, but it was interesting to find out they had Biker Dinos guarding the gates...`,
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
      text: `<em style="color: rgb(247, 255, 105);">Money Math.</em><br><br>I'd be lying if I said that this massive investment of my time was never meant to pay off in some way. Yes, I do have a day job, but my art and creations are where i lose myself (in a good way) when I'm off work. That being said, I have always learned to never devalue your art by just handing it away for free (he proceeds to leave the free browser version online). I wanted to make sure that those who did pay for the app felt like they got something special, and I hope that the exclusive content, like this journal, helps give that sense of value.`,
      soloLabel: 'Next ➡️',
    },
    {
      id: 'cj_image_08',
      role: SlideRole.ADVANCE,
      mode: 'journal',   // 👈
      title: 'Journal Snapshot #8',
      img: PRO_MED_IMG('retro9.png'),
      text: `
        <em>Snapshot #8 – Money Geometry.</em><br><br>If I can forge the perfect SnowCone, maybe things will change. Just like Jehnk, I'm looking for that right mixture of ingredients that moves me to where I'd really like to be. But notice, no ads, no paywalls. Just a one-time purchase for something I made with my heart and soul.`,
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
      text: `<em style="color: rgb(247, 255, 105);">Lore Dump.</em><br><br>TLDR on the story...So basically, a long time ago, Jehnk inherited the truck from the originial owner, The Festival Creator. Ever since then, as an honest man, he's been making people Perfect SnowCones as a key to leave the festival's infinite dimensions. Along the way, he meets historical math figures who help him understand the deeper meaning of the festival and his role in it. The end goal is to make the Perfect SnowCone that will allow him to finally leave the festival and return to reality. But what if there is a dinosaur waiting on the otherside?`,
    },
    {
      id: 'cj_image_09',
      role: SlideRole.ADVANCE,
      mode: 'journal',   // 👈
      title: 'Journal Snapshot #9',
      img: PRO_MED_IMG('retro10.png'),
      text: `<em>Snapshot #9 – What's His Name?</em><br><br>In the end, this backpacked dino never got a name. He's a festival kid. I've seen them. They live there, they run the place, they are the protagonists that no one knows about. This dino? What is his story? Maybe one day I'll tell it...until then, he's a thorn in Jehnk's side.`,
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
      text: `<em style="color: rgb(247, 255, 105);">Thank You!!</em><br><br>Wow, you made it to the end of the Creator's Journal! I just want to say thank you from the bottom of my heart for taking the time to read through my thoughts and experiences while creating SnowCone MathFest. It means the world to me that you are interested in the behind-the-scenes process of making this game.<br><br>I hope that this journal has given you a deeper appreciation for the game and the effort that went into creating it. Thank you again for your support, and I hope you continue to enjoy playing SnowCone MathFest!`,
      soloLabel: 'Next ➡️',
    },
    {
      id: 'cj_image_10',
      role: SlideRole.EPILOGUE,
      mode: 'journal',   // 👈
      title: 'Journal Snapshot #10',
      img: PRO_IMG('retro11.png'),
      text: `<em>Snapshot #10 – Next Game?</em><br><br>First of all, thank you for playing SnowCone MathFest. I hope you enjoyed it as much as I enjoyed making it. As for what's next, well, let's just say that I'm already brainstorming ideas for my next project. Who knows, maybe it'll be another game, or maybe something completely different. Either way, I can't wait to share it with you when the time comes!`,
      soloLabel: 'Back to Story Menu',
    },
  ],
};
