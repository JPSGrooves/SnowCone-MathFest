// src/modes/storyMode/chapters/ch4.js
import { SlideRole, ItemIds } from '../../../data/storySchema.js';
import { appState as globalAppState } from '../../../data/appState.js';
import { pickupPing } from '../ui/pickupPing.js'; // 👈 add this
import { awardBadge } from '../../../managers/badgeManager.js';

const BASE = import.meta.env.BASE_URL;
const PRO_IMG      = (n) => `${BASE}assets/img/characters/storyMode/${n}`;
const PRO_MED_IMG  = (n) => `${BASE}assets/img/characters/storyMode/${n}?md=1`;
const PRO_BIG_IMG  = (n) => `${BASE}assets/img/characters/storyMode/${n}?lg=1`;

const SCN_IMG      = (n) => `${BASE}assets/img/modes/storymodeForest/${n}`;
const SCN_MED_IMG  = (n) => `${BASE}assets/img/modes/storymodeForest/${n}?md=1`;
const SCN_BIG_IMG  = (n) => `${BASE}assets/img/modes/storymodeForest/${n}?lg=1`;

// Canonical ids:
//   MASTER_SIGIL  = Perfect SnowCone
//   BEATUP_PHONE  = Dino's phone from ch3
const PERFECT_CONE = ItemIds.MASTER_SIGIL;
const BEATUP_PHONE = ItemIds.BEATUP_PHONE;

// 🧺 Forge ingredient item ids
// ❗TODO: swap these four to the ACTUAL ItemIds you are using in storySchema
// for the "recipe scraps, ratio card, ledger corner, truck artifact" etc.
// 🧺 Forge ingredient item ids – the four "truck tools" from Chapter 2
// Wooden Time Piece, Flashlight, Bottle of Water, Jehnk's Ledger
// 🧺 Forge ingredient item ids – the four "truck tools" from Chapter 2:
// Wooden Time Piece, Flashlight, Bottle of Water, Jehnk's Ledger
const FORGE_INGREDIENT_IDS = [
  ItemIds.BANNEKER_TOKEN,
  ItemIds.NOETHER_TOKEN,
  ItemIds.ARCHIMEDES_TOKEN,
  ItemIds.PACIOLI_TOKEN,
];



// pull username once at module load
const playerName = (() => {
  try {
    const raw = globalAppState.profile?.username;
    const name = (raw && String(raw).trim()) || 'friend';
    return name;
  } catch {
    return 'friend';
  }
})();

export const Chapter4 = {
  id: 'ch4',
  title: 'Beyond the Veil',
  slides: [
    // 0) Portal appears – shorter, vibe only
    {
      id: 'c4_portal_appears',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'The Glowing Doorway',
      img: PRO_MED_IMG('forestPath.png'),
      text: `You step past the last row of tents and the air thins, cool and electric.<br><br>
A glowing doorway hangs in the dark like a rip in the festival, light spilling out in colors you don’t have names for.`,
      soloLabel: 'Next ➡️',
    },

    // 0A) Tug + router into the correct phone slide
    {
      id: 'c4_portal_inventory_tug',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'The Glowing Doorway',
      img: PRO_MED_IMG('portalGlow.png'),
      text: `Something tugs at your inventory.<br><br>
If you ever carried <span style="color: rgb(247, 255, 105);">The Perfect SnowCone</span>, you feel that same pocket go strange again—like a tooth that’s either already missing or about to fall out.<br><br>
Whatever you chose back on the path, the symmetry here definitely noticed.`,
      soloLabel: 'Step closer to the doorway ➡️',
      onAdvance: ({ appState, engine }) => {
        const a = appState || globalAppState;
        if (!a || !engine) return;

        try {
          const flags  = a.flags || {};
          const choice = flags.ch3_tradeChoice; // 'trade' | 'keep' | undefined

          // Decide which Drop variant to show.
          // Default to TRADE flavor if we somehow have no flag.
          const targetId =
            choice === 'keep'
              ? 'c4_portal_phone_keep'
              : 'c4_portal_phone_trade';

          // 🧭 Route using the SAME pattern as c5_entry_router
          const chapter = engine.registry[engine.state.chapterId];
          if (!chapter) return;

          const idx = chapter.slides.findIndex((s) => s.id === targetId);
          if (idx >= 0) {
            engine.state.idx = idx;
            engine._renderSlide();
            return 'handled';
          }

          // fallback: let engine advance linearly if something’s weird
          return false;
        } catch (e) {
          console.warn('[ch4] portal phone routing failed:', e);
        }
      },
    },

        // 0B-1) Variant: you KEPT the cone in ch3 → forced swap happens *here*.
    {
      id: 'c4_portal_phone_keep',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'The Drop',
      img: PRO_IMG('portalGlow.png'),
      text: `Before you can call out, a blur of motion flips into view: the tiny hooded dino, landing in a clean front handspring at the edge of the portal.<br><br>
They grin, eyes reflecting the portal light, and in one easy swipe they steal <span style="color: rgb(247, 255, 105);">The Perfect SnowCone</span> right out of your hands—out of your pockets, out of your story.<br><br>
Something heavy and familiar drops by your feet instead: a <b>beat-up cell phone</b>, already buzzing like it’s been waiting for this moment the whole time—cracked screen, dented sides, bars somehow full.`,
      soloLabel: 'Pick up the phone…',
      onAdvance: ({ appState, engine }) => {
        const a = appState || globalAppState;
        if (!a) return;

        try {
          // 🧊 1) Steal the cone if it's still there
          if (a.hasItem?.(PERFECT_CONE)) {
            a.removeItem?.(PERFECT_CONE);
          }

          // 📱 2) Grant the phone if you don't already have it
          let grantedPhone = false;
          if (!a.hasItem?.(BEATUP_PHONE)) {
            a.addItem?.(BEATUP_PHONE, {
              qty: 1,
              meta: {
                emoji: '📱',
                note: 'Cracked screen. Somehow full bars.',
              },
            });
            grantedPhone = true;
          }

          // ✨ 3) Fire pickupPing only when we actually *grant* it here
          if (grantedPhone) {
            try {
              pickupPing({ emoji: '📱', name: 'Beat-Up Phone', qty: 1 });
            } catch (e) {
              console.warn('[ch4 keep-drop] pickupPing failed:', e);
            }
          }

          a.saveToStorage?.();
        } catch (e) {
          console.warn('[ch4 keep-drop] inventory trade failed:', e);
        }

        // 📞 4) Route into the shared phone call intro
        if (!engine) return;
        const chapter = engine.registry[engine.state.chapterId];
        if (!chapter) return;

        const idx = chapter.slides.findIndex((s) => s.id === 'c4_phone_call_intro1');
        if (idx >= 0) {
          engine.state.idx = idx;
          engine._renderSlide();
          return 'handled';
        }
        return false;
      },
    },


    // 0B-2) Variant: you TRADED in ch3 → phone is old, not new.
    {
      id: 'c4_portal_phone_trade',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'The Drop',
      img: PRO_IMG('portalGlow.png'),
      text: `Before you can call out, the tiny hooded dino flips into view at the edge of the portal.<br><br>
They spot the <b>beat-up cell phone</b> you already traded for and tap two claws against the cracked screen like they’re tuning a radio that’s finally on the right station.<br><br>
The phone buzzes in your hand—battery icon full, signal bars pegged. Whatever you gave up back on the path stays gone; this is just the signal catching up.`,
      soloLabel: 'Hold the phone closer…',
      onAdvance: ({ appState, engine }) => {
        const a = appState || globalAppState;

        // Just sanity-check the phone in case of weird saves.
        try {
          if (!a?.hasItem?.(BEATUP_PHONE)) {
            a?.addItem?.(BEATUP_PHONE, {
              qty: 1,
              meta: {
                emoji: '📱',
                note: 'Cracked screen. Somehow full bars.',
              },
            });
          }
          a?.saveToStorage?.();
        } catch (e) {
          console.warn('[ch4 trade-drop] ensure phone failed:', e);
        }

        if (!engine) return;
        const chapter = engine.registry[engine.state.chapterId];
        if (!chapter) return;

        const idx = chapter.slides.findIndex((s) => s.id === 'c4_phone_call_intro1');
        if (idx >= 0) {
          engine.state.idx = idx;
          engine._renderSlide();
          return 'handled';
        }
        return false;
      },
    },

    // 🔻 from here down, keep everything you already have:
    // c4_phone_call_intro1, c4_phone_call_intro2, c4_phone_call,
    // Jehnk portal speech, fractions trap, forge, alignment, etc.


    // 1) Phone call with tiny dino – choice3 style, flavor only
    {
      id: 'c4_phone_call_intro1',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'The Call',
      img: PRO_MED_IMG('tinyDinoHood.png'),
      text: `You thumb the cracked screen. The call connects with a click and a little burst of static.<br><br>
<span style="color: rgb(143, 190, 255);">“Whoa, it actually worked!”</span> The voice is tiny but unmistakable—the hooded dino.<br><br>
<span style="color: rgb(143, 190, 255);">“I wasn’t sure the portal would sync up right, but I’m back. My original timeline, my original loop.”</span>`,
      soloLabel: 'Next ➡️',
    },

    {
      id: 'c4_phone_call_intro2',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'The Call',
      img: PRO_MED_IMG('tinyDinoHood.png'),
      text: `You hear festival noise on their side—same party, different angle.<br><br>
<span style="color: rgb(143, 190, 255);">“SnowCone MathFest isn’t just a place,”</span> they say.
<span style="color: rgb(143, 190, 255);">“It’s an in-between. Past, present, future—they all line up here when the symmetry’s just right.”</span>`,
      soloLabel: 'Next ➡️',
    },

    {
    id: 'c4_phone_call',
    role: SlideRole.ADVANCE,
    mode: 'choice3',
    title: 'The Call',
    img: PRO_IMG('tinyDinoHood.png'),
    text: `There’s a quiet moment between ringtones and bass drops.<br>
    <span style="color: rgb(143, 190, 255);">“So… ${playerName}, you ready to go home?”</span>`,
    choices: [
        {
        id: 'yes',
        label: '“Yeah. I think I’m ready to go home.”',
        praise: `<span style="color: rgb(143, 190, 255);">“Honestly? Best plan,”</span> the dino says. <span style="color: rgb(143, 190, 255);">“Make another Perfect SnowCone, ride the symmetry out. Clean exit.”</span>`,
        onSelect: ({ appState }) => {
            const a = appState || globalAppState;
            try {
            a.flags = a.flags || {};
            a.flags.ch4_phoneChoice = 'yes';
            a.saveToStorage?.();
            } catch (e) {
            console.warn('[ch4 phone] failed to record YES choice:', e);
            }
        },
        },
        {
        id: 'no',
        label: '“No. I’m not done here yet.”',
        praise: `<span style="color: rgb(143, 190, 255);">“I’m gonna have to advise against that,”</span> they sigh. <span style="color: rgb(143, 190, 255);">“You don’t know Jehnk like I do…”</span>`,
        onSelect: ({ appState }) => {
            const a = appState || globalAppState;
            try {
            a.flags = a.flags || {};
            a.flags.ch4_phoneChoice = 'no';
            a.saveToStorage?.();
            } catch (e) {
            console.warn('[ch4 phone] failed to record NO choice:', e);
            }
        },
        },
    ],
    choiceAdvanceLabel: 'Hang up the call ➡️',
    },

    // 2) Jehnk shows up at the portal
        {
    id: 'c4_post_call_router',
    role: SlideRole.ADVANCE,
    mode: 'solo',
    title: 'The Truck Driver',
    img: PRO_MED_IMG('jehnkPortal.png'),
    text: `The call drops. The portal hums.<br><br>
    Behind you, footsteps crunch on the grass.<br><br>`,
    soloLabel: 'Next ➡️',
    onAdvance: ({ appState, engine }) => {
        const a = appState || globalAppState;
        if (!a || !engine) return;

        const chapter = engine.registry[engine.state.chapterId];
        if (!chapter) return;

        const flags = a.flags || {};
        const choice = flags.ch4_phoneChoice; // 'yes' | 'no' | undefined

        // Default to NO flavor if somehow unset
        const targetId =
        choice === 'yes'
            ? 'c4_post_call_jehnk_approaches_yes'
            : 'c4_post_call_jehnk_approaches_no';

        const idx = chapter.slides.findIndex((s) => s.id === targetId);
        if (idx >= 0) {
        engine.state.idx = idx;
        engine._renderSlide();
        return 'handled';
        }
        return false;
    },
    },
        {
    id: 'c4_post_call_jehnk_approaches_yes',
    role: SlideRole.ADVANCE,
    mode: 'solo',
    title: 'The Truck Driver',
    img: PRO_MED_IMG('jehnkPortal.png'),
    text: `A shadow leans into the portal glow as the last bit of static fades from your ear.<br><br>
    <span style="color: rgb(247, 255, 105);">“Ahh… I see you found the portal,”</span> a familiar voice says.<br><br>
    <span style="color: rgb(247, 255, 105);">“If you’re really ready to go home…”</span> he adds, stepping closer, <span style="color: rgb(247, 255, 105);">“maybe there’s still a way out for me too.”</span>`,
    soloLabel: 'Next ➡️',
    onAdvance: ({ engine }) => {
        if (!engine) return;
        const chapter = engine.registry[engine.state.chapterId];
        if (!chapter) return;

        const idx = chapter.slides.findIndex(
        (s) => s.id === 'c4_post_call_jehnk_approaches_2'
        );
        if (idx >= 0) {
        engine.state.idx = idx;
        engine._renderSlide();
        return 'handled';
        }
        return false;
    },
    },
    {
    id: 'c4_post_call_jehnk_approaches_no',
    role: SlideRole.ADVANCE,
    mode: 'solo',
    title: 'The Truck Driver',
    img: PRO_MED_IMG('jehnkPortal.png'),
    text: `A shadow leans into the portal glow as the last bit of static fades from your ear.<br><br>
    <span style="color: rgb(247, 255, 105);">“Ahh… I see you found the portal,”</span> a familiar voice says.<br><br>
    <span style="color: rgb(247, 255, 105);">“Glad to hear you’re starting to like this place,”</span> he adds with a half-smile. <span style="color: rgb(247, 255, 105);">“I sounded like that once.”</span>`,
    soloLabel: 'Next ➡️',
    onAdvance: ({ engine }) => {
        if (!engine) return;
        const chapter = engine.registry[engine.state.chapterId];
        if (!chapter) return;

        const idx = chapter.slides.findIndex(
        (s) => s.id === 'c4_post_call_jehnk_approaches_2'
        );
        if (idx >= 0) {
        engine.state.idx = idx;
        engine._renderSlide();
        return 'handled';
        }
        return false;
    },
    },


    {
      id: 'c4_post_call_jehnk_approaches_2',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'The Truck Driver',
      img: PRO_MED_IMG('jehnkPortal2.png'),
      text: `You turn. Jehnk stands there, hands in his pockets, neon from the doorway tracing the edge of his hoodie.<br><br>
<span style="color: rgb(247, 255, 105);">“Did the tiny dino in the hood lead you here?”</span><br>
He shakes his head, half-smiling. <span style="color: rgb(247, 255, 105);">“They’ve been a menace ever since I got this place started.”</span>`,
      soloLabel: 'Next ➡️',
    },

    {
      id: 'c4_post_call_jehnk_approaches',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'The Truck Driver',
      img: PRO_IMG('portalDecision.png'),
      text: `You catch yourself staring at him differently now, like you can finally see the edges of something he’s been hiding.<br><br>
<span style="color: rgb(247, 255, 105);">“Look,”</span> he says. <span style="color: rgb(247, 255, 105);">“I’d walk you back to the truck myself. But now that you’re here… you can know the truth.”</span>`,
      soloLabel: '“Tell me the truth.”',
    },

    // 3) Jehnk’s loop confession – part 1
    {
      id: 'c4_jehnk_trapped_story_1',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Looped Roads',
      img: PRO_BIG_IMG('itsAllGood.png'),
      text: `“When I first started SnowCone MathFest,” Jehnk says, “it was all good, fun, music, and games.<br>
I thought I’d just roll in, serve cones, catch sets, ride the good vibes forever.”`,
      soloLabel: 'Next ➡️',
    },

    // 3) Jehnk’s loop confession – part 2
    {
      id: 'c4_jehnk_trapped_story_2',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Looped Roads',
      img: PRO_MED_IMG('jehnkNightDrive.png'),
      text: `He looks past you, out at the portal.<br><br>
<span style="color: rgb(247, 255, 105);">“But after a while, I noticed something. No matter how far down the road I drove,
no matter how many exits I took… the road always circled back here.”</span><br><br>
He laughs once, but there’s no joy in it.<br>
<span style="color: rgb(247, 255, 105);">“I’m trapped, ${playerName}. I’ve been trapped here as long as I can remember.”</span>`,
      soloLabel: 'Next ➡️',
    },

    // 3) Jehnk’s loop confession – part 3
    {
      id: 'c4_jehnk_trapped_story',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Looped Roads',
      img: PRO_MED_IMG('jehnkNightDrive2.png'),
      text: `He nods toward the doorway.<br>
<span style="color: rgb(247, 255, 105);">“The old driver? They didn’t warn me. They tricked me into taking over the truck.
Handed me the keys with a smile… and a fractions question I couldn’t answer.”</span>`,
      soloLabel: '“What do fractions have to do with this?”',
    },

    // 4) Fractions quiz setup
    {
      id: 'c4_fractions_quiz_intro',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'How He Got Me',
      img: PRO_MED_IMG('fractions.png'),
      text: `“You know how he got me?” Jehnk asks. “Fractions. Same old truck, same old recipes.<br>I just couldn’t see the splits.”<br>He sketches a ghost of an order in the air between you, invisible cups lining up in rows.<br><span style="color: rgb(247, 255, 105);">“He hit me with a question kind of like this…”</span>`,
      soloLabel: 'Hear the question ➡️',
    },

    // 5) Fractions quiz – modeled just like ch3’s quiz3
    {
      id: 'c4_fractions_quiz',
      role: SlideRole.ADVANCE,
      mode: 'quiz3',
      title: 'Fraction Trap',
      text: `“<span style="color: rgb(247, 255, 105);">“If the remix flavor is \\(\\tfrac{2}{3}\\) of each cone, what fraction of the entire batch is remix flavor?”</span><br><br>You think of the total cones, the piece per cone, and how it all stacks together.`,
      quiz: {
        options: [
          {
            id: 'c4_frac_opt_wrong_1',
            label: '2/3',
            correct: false,
            praise: `That’s just the share...Think about the whole batch.`,
          },
          {
            id: 'c4_frac_opt_correct',
            label: 'Half of 2/3 → 2/6 of the batch',
            correct: true,
            praise: `Exactly. Half the cones are remix, and each remix cone is 2/3 remix.`,
          },
          {
            id: 'c4_frac_opt_wrong_2',
            label: '4/3',
            correct: false,
            praise: `Too big—this would be *more* than the total batch.`,
          },
        ],
        advanceLabel: 'Okay… so what now? ➡️',
      },
    },

    // 6) Forge another Perfect SnowCone – intro
    {
      id: 'c4_no_cone_forge_intro',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Forge Another',
      img: PRO_MED_IMG('portalDecision.png'),
      text: `“Always know your fractions,” Jehnk says. “They’re how the truck keeps its balance.”<br>He looks back at you, thoughtful.<br><span style="color: rgb(247, 255, 105);">“So tell me, ${playerName}… do you still have the stuff from when you worked the truck?”</span><br>Recipe scraps, ratio cards, ledger notes, all the little artifacts you’ve picked up over the night—they’re still rattling around in your pockets.<br><span style="color: rgb(247, 255, 105);">“I think we can use them to forge another Perfect SnowCone.”</span>`,
      soloLabel: 'Forge the new cone ➡️',
    },

    // 7) Forge another – setup, no item yet
    {
  id: 'c4_no_cone_forge_action',
  role: SlideRole.ADVANCE,
  mode: 'solo',
  title: 'Reforged',
  img: PRO_MED_IMG('essentialsTrio3.png'),
  text: `The air thickens with mint and neon.<br><br>
<span style="color: rgb(247, 255, 105);">“There we go,”</span> Jehnk says as the cone locks into place,
colors cycling in impossible gradients.<br>
<span style="color: rgb(247, 255, 105);">“I never cease to amaze myself with my ability to make these things.”</span>`,
  soloLabel: 'Take the Perfect SnowCone ➡️',
  onAdvance: ({ appState }) => {
    const a = appState || globalAppState;
    if (!a) return;

    try {
      // 🔥 1) Consume one of each forge ingredient if present.
      for (const ingredientId of FORGE_INGREDIENT_IDS) {
        try {
          if (a.hasItem?.(ingredientId)) {
            a.removeItem?.(ingredientId); // same single-arg remove you use elsewhere
          }
        } catch (e) {
          console.warn('[ch4] failed to consume forge ingredient', ingredientId, e);
        }
      }

      // 🍧 2) Grant the Perfect SnowCone if you somehow don't have it yet.
      let grantedCone = false;

      if (!a.hasItem?.(PERFECT_CONE)) {
        a.addItem?.(PERFECT_CONE, { qty: 1 });
        grantedCone = true;
      }

      // ✨ 3) Fire pickup ping only if we actually forged a new cone here.
      if (grantedCone) {
        try {
          pickupPing({
            emoji: '🍧',
            name: 'The Perfect SnowCone',
            qty: 1,
          });
        } catch (e) {
          console.warn('[ch4] pickupPing failed during forge:', e);
        }
      }

      // 💾 4) Persist the new inventory state.
      a.saveToStorage?.();
      window.dispatchEvent(new CustomEvent('sm:inventoryChanged'));
    } catch (e) {
      console.warn('[ch4] failed to grant Perfect SnowCone during forge:', e);
    }
  },
},



    // 8) Alignment choice – setup part 1
    {
      id: 'c4_alignment_choice_1',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Moment of Truth',
      img: PRO_MED_IMG('portalGlow2.png'),
      text: `The portal crackles brighter as you hold the Perfect SnowCone up to it.
Every color in the cone answers back in shimmering waves.<br><br>

<span style="color: rgb(247, 255, 105);">“Okay, ${playerName}, here comes the moment of truth.”</span>`,
      soloLabel: 'Next ➡️',
    },

    // 8) Alignment choice – setup part 2
    {
      id: 'c4_alignment_choice_2',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Moment of Truth',
      img: PRO_MED_IMG('portalDecision.png'),
      text: `<span style="color: rgb(247, 255, 105);">“The Perfect SnowCone only works if you’re being served.
            I could make a million of these things and still never pass through that portal myself.”</span> Then he serves you the SnowCone`,
      soloLabel: 'Next ➡️',
    },

    // 8) Alignment choice – keep it or serve Jehnk, then jump to ch5
    {
      id: 'c4_alignment_choice',
      role: SlideRole.ADVANCE,
      mode: 'choice3',
      title: 'Moment of Truth',
      img: PRO_IMG('essentialsTrio3.png'),
      text: `He looks from the cone to the doorway, then back to you.<br><br><span style="color: rgb(247, 255, 105);">“So the choice is yours. You can walk through that portal and go home…</span><br><span style="color: rgb(247, 255, 105);">…or you can save me from this loop and serve me that snowcone.”</span>`,
      choices: [
        {
          id: 'c4_choice_keep_cone',
          label: 'Keep the SnowCone and step toward the portal.',
          nextChapterId: 'ch5',
          nextId: 'c5_keep_cone_ending_1',
          onSelect: ({ appState }) => {
            try {
              appState?.saveToStorage?.();
            } catch (e) {
              console.warn('[ch4 alignment] save after KEEP failed:', e);
            }
          },
        },
        {
          id: 'c4_choice_give_cone',
          label: 'Hand Jehnk the SnowCone.',
          nextChapterId: 'ch5',
          nextId: 'c5_give_cone_ending_1',
          onSelect: ({ appState }) => {
            try {
              if (appState?.hasItem?.(PERFECT_CONE)) {
                appState.removeItem?.(PERFECT_CONE);
              }
              appState?.saveToStorage?.();
            } catch (e) {
              console.warn('[ch4 alignment] remove cone on GIVE failed:', e);
            }
          },
        },
      ],
      choiceAdvanceLabel: 'Lock in your choice ➡️',
    },
  ],
  onFinish: ({ appState }) => {
    const a = appState || globalAppState;
    try {
      awardBadge('story_ch4');
      a.saveToStorage?.();
    } catch (e) {
      console.warn('[ch4] onFinish failed', e);
    }
  },
};
