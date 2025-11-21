// src/modes/storyMode/chapters/ch4.js
import { SlideRole, ItemIds } from '../../../data/storySchema.js';
import { appState as globalAppState } from '../../../data/appState.js';

const BASE = import.meta.env.BASE_URL;
const PRO_IMG = (n) => `${BASE}assets/img/characters/storyMode/${n}`;
const SCN_IMG = (n) => `${BASE}assets/img/modes/storymodeForest/${n}`;

// Canonical ids:
//   MASTER_SIGIL  = Perfect SnowCone
//   BEATUP_PHONE  = Dino's phone from ch3
const PERFECT_CONE = ItemIds.MASTER_SIGIL;
const BEATUP_PHONE = ItemIds.BEATUP_PHONE;

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
    // 0) Portal appears, dino jumps, phone drops.
    {
      id: 'c4_portal_appears',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'The Glowing Doorway',
      img: SCN_IMG('portalGlow.png'),
      text: `You step past the last row of tents and the air thins, cool and electric.<br><br>
A glowing doorway hangs in the dark like a rip in the festival, light spilling out in colors you don’t have names for.<br><br>
Something tugs at your inventory. If you ever carried The Perfect SnowCone, you can almost feel the empty space where it used to rest—like a missing tooth in the line of your pockets.<br><br>
Before you can call out, a blur of motion flips into view: the tiny hooded dino, landing in a clean front handspring at the edge of the portal.<br><br>
They grin, eyes reflecting the portal light, and in one easy motion they snatch whatever echo of perfection you were holding onto, then toss a beat-up cell phone at your feet and dive through the doorway like it was always meant for them.`,
      soloLabel: 'Pick up the phone…',
      onAdvance: ({ appState }) => {
        const a = appState || globalAppState;
        if (!a) return;

        // If you somehow still had the Perfect SnowCone, it goes with the dino.
        try {
          if (a.hasItem?.(PERFECT_CONE)) {
            a.removeItem?.(PERFECT_CONE);
          }
        } catch (e) {
          console.warn('[ch4] failed to remove Perfect SnowCone at portal:', e);
        }

        // Make sure the player has the beat-up phone.
        try {
          if (!a.hasItem?.(BEATUP_PHONE)) {
            a.addItem?.(BEATUP_PHONE, {
              qty: 1,
              meta: {
                emoji: '📱',
                note: 'Cracked screen. Somehow full bars.',
              },
            });
          }
          a.saveToStorage?.();
        } catch (e) {
          console.warn('[ch4] failed to grant Beat-Up Phone at portal:', e);
        }
      },
    },

    // 1) Phone call with tiny dino – choice3 style, but flavor only
    {
      id: 'c4_phone_call',
      role: SlideRole.ADVANCE,
      mode: 'choice3',
      title: 'The Call',
      img: PRO_IMG('tinyDinoHood.png'),
      text: `You thumb the cracked screen. The call connects with a click and a little burst of static.<br><br>
<span style="color: rgb(143, 190, 255);">“Whoa, it actually worked!”</span> The voice is tiny but unmistakable—the hooded dino.<br><br>
<span style="color: rgb(143, 190, 255);">“I wasn’t sure the portal would sync up right, but I’m back. My original timeline, my original loop.”</span><br><br>
You hear festival noise on their side—same party, different angle.<br><br>
<span style="color: rgb(143, 190, 255);">“SnowCone MathFest isn’t just a place,”</span> they say. <span style="color: rgb(143, 190, 255);">“It’s an in-between. Past, present, future—they all line up here when the symmetry’s just right.”</span><br><br>
There’s a quiet moment between ringtones and bass drops.<br>
<span style="color: rgb(143, 190, 255);">“So… ${playerName}, you ready to go home?”</span>`,
      choices: [
        {
          id: 'yes',
          label: '“Yeah. I think I’m ready to go home.”',
          praise: `<span style="color: rgb(143, 190, 255);">“Honestly? Best plan,”</span> the dino says. <span style="color: rgb(143, 190, 255);">“Make another Perfect SnowCone, ride the symmetry out. Clean exit.”</span>`,
        },
        {
          id: 'no',
          label: '“No. I’m not done here yet.”',
          praise: `<span style="color: rgb(143, 190, 255);">“I’m gonna have to advise against that,”</span> they sigh. <span style="color: rgb(143, 190, 255);">“You don’t know Jehnk like I do…”</span>`,
        },
      ],
      choiceAdvanceLabel: 'Hang up the call ➡️',
    },

    // 2) Jehnk shows up at the portal
    {
      id: 'c4_post_call_jehnk_approaches',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'The Truck Driver',
      img: PRO_IMG('jehnkPortal.png'),
      text: `The call drops. The portal hums.<br><br>
Behind you, footsteps crunch on the grass.<br><br>
<span style="color: rgb(247, 255, 105);">“Ahh… I see you found the portal,”</span> a familiar voice says.<br><br>
You turn. Jehnk stands there, hands in his pockets, neon from the doorway tracing the edge of his hoodie.<br><br>
<span style="color: rgb(247, 255, 105);">“Did the tiny dino in the hood lead you here?”</span><br>
He shakes his head, half-smiling. <span style="color: rgb(247, 255, 105);">“They’ve been a menace ever since I got this place started.”</span><br><br>
You catch yourself staring at him differently now, like you can finally see the edges of something he’s been hiding.<br><br>
<span style="color: rgb(247, 255, 105);">“Look,”</span> he says. <span style="color: rgb(247, 255, 105);">“I’d walk you back to the truck myself. But now that you’re here… you can know the truth.”</span>`,
      soloLabel: '“Tell me the truth.”',
    },

    // 3) Jehnk’s loop confession
    {
      id: 'c4_jehnk_trapped_story',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Looped Roads',
      img: PRO_IMG('jehnkNightDrive.png'),
      text: `“When I first started SnowCone MathFest,” Jehnk says, “it was all fun, music, and games.<br>
I thought I’d just roll in, serve cones, catch sets, ride the good vibes forever.”<br><br>
He looks past you, out at the portal.<br><br>
<span style="color: rgb(247, 255, 105);">“But after a while, I noticed something. No matter how far down the road I drove,
no matter how many exits I took… the road always circled back here.”</span><br><br>
He laughs once, but there’s no joy in it.<br>
<span style="color: rgb(247, 255, 105);">“I’m trapped, ${playerName}. I’ve been trapped here as long as I can remember.”</span><br><br>
He nods toward the doorway.<br>
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
      img: PRO_IMG('jehnkRecipe.png'),
      text: `“You know how he got me?” Jehnk asks. “Fractions. Same old truck, same old recipes.<br>
I just couldn’t see the splits.”<br><br>
He sketches a ghost of an order in the air between you, invisible cups lining up in rows.<br><br>
<span style="color: rgb(247, 255, 105);">“He hit me with a question kind of like this…”</span>`,
      soloLabel: 'Hear the question ➡️',
    },

    // 5) Fractions quiz – modeled just like ch3’s quiz3
    {
      id: 'c4_fractions_quiz',
      role: SlideRole.ADVANCE,
      mode: 'quiz3',
      title: 'Fraction Trap',
      img: PRO_IMG('mixCard.png'),
      text: `“Order comes in,” Jehnk says. “Six cones, all the same size.<br>
Half the order is for a regular flavor band, half is for a special remix flavor.”<br><br>
He leans on an imaginary counter.<br><br>
<span style="color: rgb(247, 255, 105);">“If the remix flavor is \\(\\tfrac{2}{3}\\) of each cone,
what fraction of the entire batch is remix flavor?”</span><br><br>
You think of the total cones, the piece per cone, and how it all stacks together.`,
      quiz: {
        options: [
          {
            id: 'c4_frac_opt_wrong_1',
            label: '2/3',
            correct: false,
            praise: `That’s just the share *inside each cone*, not across all six. Think about the whole batch.`,
          },
          {
            id: 'c4_frac_opt_correct',
            label: 'Half of 2/3 → 2/6 of the batch',
            correct: true,
            praise: `Exactly. Half the cones are remix, and each remix cone is 2/3 remix.<br>
So that’s (1/2) × (2/3) of the whole batch = 2/6 of the total volume.`,
          },
          {
            id: 'c4_frac_opt_wrong_2',
            label: '4/3',
            correct: false,
            praise: `Too big—this would be *more* than the total batch. Remix can’t overflow reality (yet).`,
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
      img: PRO_IMG('jehnkThinking.png'),
      text: `“Always know your fractions,” Jehnk says. “They’re how the truck keeps its balance.”<br><br>
He looks back at you, thoughtful.<br><br>
<span style="color: rgb(247, 255, 105);">“So tell me, ${playerName}… do you still have the stuff from when you worked the truck?”</span><br><br>
Recipe scraps, ratio cards, ledger notes, all the little artifacts you’ve picked up over the night—they’re still rattling around in your pockets.<br><br>
<span style="color: rgb(247, 255, 105);">“I think we can use them to forge another Perfect SnowCone.”</span>`,
      soloLabel: 'Forge the new cone ➡️',
    },

    // 7) Forge another – actual creation, grant MASTER_SIGIL back
    {
      id: 'c4_no_cone_forge_action',
      role: SlideRole.ADVANCE,
      mode: 'solo',
      title: 'Reforged',
      img: PRO_IMG('perfectConeGlow.png'),
      text: `You spread your truck tools out in the glow of the portal:<br>
sticky recipe cards, ratio scribbles, a ledger corner stained with syrup.<br><br>
Piece by piece, you rebuild the sequence—measure, pour, swirl, freeze.<br>
The air thickens with mint and neon.<br><br>
<span style="color: rgb(247, 255, 105);">“There we go,”</span> Jehnk says as the cone locks into place,
colors cycling in impossible gradients.<br>
<span style="color: rgb(247, 255, 105);">“I never cease to amaze myself with my ability to make these things.”</span>`,
      soloLabel: '“Okay… what now?”',
      onAdvance: ({ appState }) => {
        const a = appState || globalAppState;
        if (!a) return;

        try {
          if (!a.hasItem?.(PERFECT_CONE)) {
            a.addItem?.(PERFECT_CONE, {
              qty: 1,
            });
          }
          a.saveToStorage?.();
        } catch (e) {
          console.warn('[ch4] failed to grant Perfect SnowCone during forge:', e);
        }
      },
    },

    // 8) Alignment choice – keep it or serve Jehnk, then jump to ch5
        // 8) Alignment choice – keep it or serve Jehnk, then jump to ch5
        // 8) Alignment choice – keep it or serve Jehnk, then jump to ch5
    {
      id: 'c4_alignment_choice',
      role: SlideRole.ADVANCE,
      mode: 'choice3',
      title: 'Moment of Truth',
      img: SCN_IMG('portalDecision.png'),
      text: `The portal crackles brighter as you hold the Perfect SnowCone up to it.
Every color in the cone answers back in shimmering waves.<br><br>

<span style="color: rgb(247, 255, 105);">“Okay, ${playerName}, here comes the moment of truth.”</span><br><br>

<span style="color: rgb(247, 255, 105);">“The Perfect SnowCone only works if you’re being served.
I could make a million of these things and still never pass through that portal myself.”</span><br><br>

He looks from the cone to the doorway, then back to you.<br><br>

<span style="color: rgb(247, 255, 105);">“So the choice is yours. You can walk through that portal and go home…</span><br><br>

<span style="color: rgb(247, 255, 105);">…or you can save me from this loop and serve me that snowcone.”</span>`,
      choices: [
        {
          id: 'c4_choice_keep_cone',
          label: 'Keep the SnowCone and step toward the portal.',
          nextChapterId: 'ch5',
          nextId: 'c5_keep_cone_ending',
        },
        {
          id: 'c4_choice_give_cone',
          label: 'Hand Jehnk the SnowCone.',
          nextChapterId: 'ch5',
          nextId: 'c5_give_cone_ending',
        },
      ],
      choiceAdvanceLabel: 'Lock in your choice ➡️',
    },

  ],
};
