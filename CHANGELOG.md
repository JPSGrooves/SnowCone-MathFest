<!-- SCMF 1.5.0 TOP CHANGELOG ENTRY START -->
# [1.5.0] — 2026-07-03 — QuickServe Pavilion Flagship + Infinity Lake Alignment RC 🍧⚡♾️

## Release Focus

Version **1.5.0** turns QuickServe Pavilion into a true flagship attraction beside Infinity Lake.

This release focuses on:

**QuickServe mode clarity, character selection, math lane structure, result-screen polish, scoring balance, and final Infinity Lake alignment.**

The build is now considered a strong iOS release candidate pending final human playtesting, native smoke testing, and App Store packaging.

---

## Added / Improved

### 🍧 QuickServe Pavilion Flagship Pass

- Rebuilt QuickServe into a clearer arcade math attraction.
- Added a stronger setup / preflight flow with:
  - character presentation
  - character selection
  - six math lanes
  - Easy / Medium / Hard difficulty entry
  - clearer Play Game path
  - cleaner Back control
- Added playable math lanes:
  - Add/Subtract
  - Multiply/Divide
  - Decimals/Money
  - Percents
  - Fractions
  - Mixed Bag
- Improved QuickServe character unlock presentation.
- Updated locked character cards to feel cleaner and easier to read.
- Reduced visual clutter while preserving the loud arcade-pavilion identity.

### 🧮 QuickServe MathBrain Pass

- Updated QuickServe math generation around the new lane + difficulty system.
- Confirmed broad terminal audit coverage across:
  - all six math modes
  - Easy / Medium / Hard
  - repeat behavior
  - decimal / money / percent / fraction readability
  - hard-mode friction
- Added soft repeat-prevention thinking for future tuning.
- Preserved spicy Hard math while watching for keypad friction.
- Kept money questions as an intentional adult-friendly math feature.
- Standardized QuickServe scoring direction:
  - Standard modes:
    - Easy = 3 points
    - Medium = 5 points
    - Hard = 7 points
  - Mixed Bag:
    - Easy = 4 points
    - Medium = 6 points
    - Hard = 8 points
- XP economy review started but intentionally left for a later balancing pass.

### 🏆 QuickServe Results Screen Redesign

- Reworked QuickServe results to better match the polished Infinity Lake result language.
- Replaced the old “Round Complete” feel with a clearer hierarchy:
  - small mode title
  - large Results title
  - character
  - mode name
  - score / high score
  - feedback line
  - Setup / Again buttons
- Updated Setup and Again buttons into stacked icon-label controls:
  - ← / SETUP
  - ↻ / AGAIN
- Tuned iPad result-screen sizing so QuickServe feels closer to Infinity Lake while keeping its arcade personality.
- Added first-pass cleanup for faint character PNG backplate artifacts.

### ♾️ Infinity Lake Final Alignment Pass

- Performed a restrained final Infinity Lake polish pass based on what QuickServe taught us.
- Improved Infinity Lake result-screen button consistency.
- Matched Setup / Again button label sizing more cleanly.
- Preserved Infinity Lake’s calmer, more professional cosmic identity.
- Kept the Infinity Lake result screen stable instead of over-polishing it.
- Confirmed Infinity Lake remains shippable as the first flagship attraction.

### 👁️ Infinity Lake Vision Flow Polish

- Improved Vision result flow and readability.
- Clarified completed vision tracking on results.
- Preserved the Setup → Play Again flow.
- Protected existing vision logic, scoring, and streak behavior.

### 📱 iOS-First Presentation Polish

- Continued iPhone / iPad layout tuning through the Capacitor iOS lane.
- Improved result screens for native iPad presentation.
- Noted tiny iPhone rounded-corner safe-area edge risk for later review.
- Confirmed real-device testing remains the source of truth over simulator-only presentation quirks.
- Preserved the current working layouts instead of chasing risky late visual rewrites.

---

## Fixed

- Fixed QuickServe result-screen hierarchy feeling disconnected from Infinity Lake.
- Fixed QuickServe result buttons being oversized compared to Infinity Lake on iPad.
- Fixed Infinity Lake Setup / Again result-button typography mismatch.
- Fixed Add/Sub scoring direction so it no longer feels underpaid compared to other QuickServe modes.
- Fixed ugly math display cases such as plus-negative formatting in generated prompts.
- Reduced exact-repeat pressure in QuickServe math testing direction.
- Rolled back an over-aggressive result typography pass that damaged the current visual balance.

---

## Dev Notes

> *1.5.0 is the QuickServe attraction release.*
>
> QuickServe now feels like a real SnowCone MathFest pavilion instead of an older arcade mode with polish layered on top.
>
> Infinity Lake remains the calm cosmic flagship.
>
> QuickServe becomes the loud neon math booth.
>
> The two modes are not identical, but they now speak the same design language:
>
> **small mode title, big result moment, clean stats, unified buttons, native iOS confidence.**
>
> The math system is also clearer now:
>
> **Easy = I can play.  
> Medium = I can grow.  
> Hard = I can chase.**
>
> The next major balance question is XP-per-minute across modes, but that belongs to a future progression pass.
>
> For now: QuickServe and Infinity Lake are both shippable, playable, musical, strange, and much more professional. 🍧⚡♾️✨

---

<!-- SCMF 1.5.0 TOP CHANGELOG ENTRY END -->

<!-- SCMF 1.4.0 TOP CHANGELOG ENTRY START -->
# [1.4.0] — 2026-06-24 — Infinity Lake Flagship + HUD Glass Release Candidate ♾️🍧

## Release Focus

Version **1.4.0** turns Infinity Lake into the first true flagship attraction inside SnowCone MathFest.

This release also establishes the new app-wide visual direction:

**theme-responsive HUD Glass, iOS-first polish, native audio confidence, and cleaner modal presentation.**

The build is now considered a publishable iOS candidate pending final smoke testing.

---

## Added / Improved

### ♾️ Infinity Lake Flagship Pass

- Rebuilt Infinity Lake into a more complete arcade-concert math attraction.
- Added a polished preflight screen with:
  - theme-responsive title treatment
  - Triplets stage presentation
  - Top Score / Top Streak / Visions board
  - difficulty selector
  - unified Play Game button
  - clean Back-to-Menu control
- Unified intro and results buttons into one consistent CTA system.
- Made preflight stat labels theme-responsive while keeping numbers bright white.
- Improved result popup presentation and button consistency.
- Preserved the dedicated Infinity Lake → Main Menu portal return transition.
- Last selected Infinity Lake difficulty now persists between visits.

### 🔊 Infinity Lake Native SFX Fixes

- Routed Infinity Lake SFX through the native iOS audio bridge first.
- Restored streak burst SFX on native iOS.
- Improved wrong-answer SFX timing and volume so misses cut through the lake music.
- Kept browser/Howler fallback behavior for preview testing.

### 🧊 HUD Glass UI Standard

- Established the restrained SCMF HUD Glass design rule:
  - existing surfaces only
  - thin borders
  - dark glass
  - subtle glow
  - theme-responsive accents
  - no extra boxes
- Applied the new visual standard to:
  - Infinity Lake
  - Startup welcome button
  - Options modal
  - Info / title-press modal

### ⚙️ Options Modal Polish

- Cleaned up the Options modal shell.
- Removed the unwanted tab-header box, grid texture, and circular X button.
- Made tabs stretch evenly and match the active theme.
- Gave the profile name input HUD Glass styling.
- Updated Data tab buttons with correct festival font styling.
- Made the SnowCone Radio scrubber theme-responsive.

### 🎯 Title Press / Info Modal Redesign

- Redesigned the title-press modal into a compact HUD Glass info panel.
- Replaced long static text with clean dropdown sections:
  - Quick Start
  - Play Zones
  - What’s New in 1.4.0
- Reduced the JPS Grooves link from a large CTA into a quieter credit link.
- Kept the modal JS behavior simple and stable.

### 🚀 Startup Polish

- Updated the Enter Festival button with theme-responsive HUD Glass styling.
- Connected startup button accent styling to the shared theme accent law.

---

## Fixed

- Fixed Infinity Lake SFX not firing correctly in the native iOS lane.
- Fixed wrong-answer SFX being too quiet or visually buried after streak moments.
- Fixed inconsistent button styling between Infinity Lake intro and results screens.
- Fixed Info modal feeling disconnected from the new HUD Glass standard.
- Fixed Options modal over-glass issues from earlier visual passes.

---

## Dev Notes

> *1.4.0 is the first attraction-era release.*
>
> Infinity Lake now feels like a real SnowCone MathFest destination instead of an older mode with polish layered on top.
>
> The visual language is clearer now:
>
> **dark glass, theme glow, thin borders, existing surfaces, no clutter.**
>
> This is the build where the lake starts to glow like the future of the whole festival. 🍧♾️✨

---

<!-- SCMF 1.4.0 TOP CHANGELOG ENTRY END -->


# 🍧 SnowCone MathFest — Changelog Reopened for the 1.4.0 → 2.0.0 Era

## Current Development Era — 2026-06-22

SnowCone MathFest has officially moved into its next major development arc.

The original launch-era changelog below is preserved as history, but development is now being tracked again from the current iOS-first production roadmap.

The app is now treated as a real iPhone / iPad product, not a browser-first experiment.

Primary production target:

**Capacitor iOS app → Xcode → real iPhone/iPad testing**

Use the native lane for serious testing:

```bash
cd ~/Developer/SnowCone-MathFest-clean
git status --short
npm run build:native
npx cap open ios
```

Browser preview is still useful, but App Store confidence comes from the native iOS build.

---

# [1.4.0] — Infinity Lake Flagship Pass — In Development ♾️

## Current Focus

Version **1.4.0** is now dedicated to finishing **Infinity Lake** as the first truly polished SnowCone MathFest attraction.

The goal is not simply to “fix” Infinity Lake.

The goal is to make Infinity Lake feel like a finished arcade-concert math attraction inside the SnowCone MathFest festival.

The intro/preflight screen is now close to final. It has a stronger visual identity, clearer difficulty entry, better stats presentation, and a much cleaner Back-to-Menu experience.

Next focus:

**Make the gameplay screen feel as intentional as the intro.**

---

## Recently Added / Improved

### Infinity Lake Preflight Screen

* Rebuilt Infinity Lake intro into a real preflight screen.
* Added clear mode identity:

  * title
  * short how-to line
  * Triplets stage art
  * Best Score
  * Best Streak
  * difficulty selection
  * Play Game button
  * Back button
* Added difficulty entry:

  * **Easy** — addition/subtraction
  * **Medium** — multiplication/division
  * **Hard** — algebra
* Difficulty choice now correctly sets the starting gameplay mode.
* Label finalized as: **Choose Difficulty**
* Back button redesigned into a cleaner HUD-style button.

### Infinity Lake Return Portal

* Added a dedicated Infinity Lake → Main Menu return transition.
* Replaced the old truck/cone transition for Infinity Lake exits.
* Return transition now uses the same Ghost Portal language as Menu → Mode.
* Return timing matched to the 2.5-second portal feel.
* Cone now aligns with the real main-menu cone before the menu fades back in.
* Result: returning to the menu feels like the festival world is pulling the player back home instead of abruptly reloading.

### Theme Accent Direction

* Central theme-accent law is now active.
* Infinity Lake, modal UI, and future mode polish should follow shared theme-responsive accent rules.
* Difficulty/answer colors remain fixed by gameplay meaning:

  * yellow
  * cyan/blue
  * magenta

### iOS-First Presentation

* Infinity Lake work is now judged through the native iOS build.
* iPhone and iPad layout are the priority.
* Browser parity is secondary unless specifically needed.
* WKWebView / Capacitor behavior is treated as the real production environment.

---

## Immediate 1.4.0 Goals

### Gameplay State Polish

* Make in-game mode buttons match the intro difficulty language.
* Use:

  * Easy / +/- = yellow
  * Medium / ×÷ = cyan
  * Hard / x = magenta
* Selected mode should glow clearly.
* Unselected modes should dim but remain readable.
* Do not over-animate mode buttons if dimming communicates selection clearly.

### Answer Button Feedback

* Add subtle life to the three answer buttons under the equation.
* The answer buttons are the best place for pulse/pop feedback.
* Goal:

  * subtle breathing/pulse while waiting
  * clean pop on correct answer
  * possible shake/flicker on wrong answer later
* Keep the answer colors fixed and readable.

### Bottom Control Pad Polish

* Main Menu button needs to be iPad-safe.
* Visible label may become shorter, likely **Menu**, while accessibility can still say “Main Menu.”
* Main Menu button should visually match the cleaner intro Back button language.
* Mute can remain simple.
* Results button can remain special.
* Control pad should feel less like a static button grid and more like a small arcade console.

### Results / Exit Flow

Future improvement after the visual pass:

When tapping Main Menu during a run, consider showing a popup:

**See results before you go?**

Buttons:

* **See Results**
* **Exit to Menu**

Purpose:

* prevent accidental exits
* let players see score/streak before leaving
* keep Results button available
* preserve score commitment safety

This should wait until the core gameplay presentation is stable.

---

## Infinity Lake Animation Vision

Infinity Lake should eventually feel like a pinball machine, arcade cabinet, and concert stage combined.

The Triplets remain the stars of the lake.

Future animation should be tied to gameplay events, not random decoration.

Potential animation triggers:

* correct answer
* wrong answer
* streak trigger
* mode switch
* score milestone
* high score
* result screen
* badge moment

The current streak/SFX rhythm already has an important pattern and should guide the animation system. Future visual rewards should build from that system instead of inventing unrelated numbers.

Long-term dream:

* moving cartoon-style Triplet moments
* stage lighting reactions
* score bursts
* streak escalation
* lake spotlight moments
* animated PNG/sprite sequences
* Fibonacci / geometry / math-inspired rhythm language
* a performance feeling where the Triplets react to the player’s flow

This is a major future piece of 1.4.0, but first the gameplay UI needs to be clean.

---

# Road to 2.0.0

## 1.4.0 — Infinity Lake

Finish Infinity Lake as the first flagship attraction.

## 1.5.0 — QuickServe Pavilion

Redo QuickServe preflight, difficulty entry, gameplay presentation, and shell polish.

## 1.6.0 — Kids Camping

Rebuild Kids Camping presentation and clarify Parking, Tent Line, and Ant Attack as stronger camp activities.

## 1.7.0 — Story Mode

Simplify Story Mode flow and improve chapter presentation.

## 1.8.0 — MathTips / Grampy P

Complete MathTips Village redo into the Grampy P Cards era.

## 1.9.0 — Truck Era

Add truck-era popups, connective tissue, hub flavor, and mode connections.

## 2.0.0 — Festival Complete Again

Revisit badges, achievements, Game Center, progression, final polish, and all-mode cohesion.

---

## Development Law

No new mode yet.

No Truck Office yet.

No Daily Tasks yet.

No shop/economy system yet.

No badge rewrite yet.

No global CSS cave purge unless absolutely necessary.

No five-mode mega-commit.

Work one version lane at a time.

Current law:

**1.4.0 = Infinity Lake.**

Finish the lake first.

Then move to QuickServe.

---

## Dev Notes

> *SnowCone MathFest is entering the attraction era.*
>
> The game already exists.
> Now each mode needs to feel like it belongs inside one polished, strange, musical, iOS-native festival.
>
> Infinity Lake goes first.
>
> Make the lake glow.
> Make the Triplets perform.
> Make the math feel like an arcade concert.
>
> Then keep walking the road to 2.0.0. 🍧♾️✨


Concise list of adds since v1.2.1:
	•	iPad startup layout polish.
	•	SnowCone Radio scrubber centering.
	•	Options tab header centering.
	•	iPad presentation audit / wide-screen notes.
	•	Main menu full-screen background plate system.
	•	menubackgroundPlate_default.png.
	•	Old starfield floater removed from menu.
	•	menuBackdropPlate DOM image layer.
	•	plate-ready fallback behavior.
	•	Menu actor slots:
	◦	truckBack
	◦	character
	◦	truckFront
	◦	themeProp
	◦	centerCone
	•	Default actor asset package folder.
	•	menuVisualManager.js.
	•	menuThemePackages.js.
	•	Theme package data model.
	•	Label colors moved into theme package data.
	•	Theme vibe metadata added.
	•	Theme package path/folder plan.
	•	Screen-safe menu label layer.
	•	CSS variable “dial pad” for menu positioning.
	•	Shared iPhone/iPad menu composition direction.
	•	Theme cone/background packet plan.
	•	New theme art/cone concepts:
	◦	Spring
	◦	RVA
	◦	Party/New Year/disco
	◦	Cosmic
	◦	fancy pink cone
	◦	Cloud/Nick-style
	◦	menu sign prop
	•	Theme emoji picks:
	◦	🍧 Default
	◦	🌉 RVA
	◦	🎸 Concert
	◦	🇺🇸 Freedom
	◦	☁️ Clouds
	•	Spring label color fix.
	•	Label shadow/glow strategy.
	•	Theme-reactive title glow plan / patch design.
	•	titleGlowMap concept.
	•	Future Living Truck / Festival Office direction clarified.

* ✅ **v0.5.0 – QuickServe Mode Almost Complete (Jukebox Miracle Included)**
* ✅ **v0.5.6 – QuickServe Keyboard Ascension**
* ✅ **v0.6.0 – Infinity Mode Complete**
* ✅ **v0.6.6 – TentsUpCarsParked**
* ✅ **v0.7.0 – Kids Mode Complete**
* ✅ **v0.7.7 – Prologuing the Inevitable**
* ✅ **v0.8.0 – Story Mode Prologue Finished**
* ✅ **v0.8.8 – The Grampy P Badge**
* ✅ **v0.9.0 – Legendary Badges/Badge/Theme Implemented****
* ✅ **v0.9.0.5 – MathTips Village Kitty Paws**
* ✅ **v0.9.1 – QuickServe Pavilion Complete/Polished**
* ✅ **v0.9.2 – Infinity Lake Complete/Polished**
* ✅ **v0.9.3 – Camping Games Complete/Polished**
* ✅ **v0.9.4 – Story Mode Forest Complete/Polished**
* ✅ **v0.9.5 – MathTips Village Complete/Polished**
* ✅ **v0.9.6 – Badges Complete/Polished**
* ✅ **v0.9.7 – Music/SFX Complete/Polished**
* ✅ **v0.9.8 – Celebrations Complete/Polished**
* ✅ **v0.9.9 – Just Small Details Now**
* ✅ **v1.0.0 – Final Polish + Launch Ready✨**
* ✅ **v1.1.0 – Chapter 1: It Has Begun✨**
* ✅ **v1.2.0 – Chapter 2 in Story Mode✨**
* ✅ **v1.3.0 – v1.3.0 — Story CYOA, Badges & Credits**
* ✅ **v1.4.0 – High Score Release**
* ✅ **v1.5.0 – iOS Review Ready✨**


# [1.5.0] – 2025-12-14 — iOS Review Ready ✨

## Added

### Truck-Tap High Score HUD (Main Menu)

- Invisible, accessible hitbox placed directly over the festival truck.
- Scales perfectly inside the **11:16 stage** across phones and desktop.
- Tap or keyboard-focus to open stats instantly — no new mode required.

### High Score Overlay (Meta Stats Card)

- New neon overlay displays:
  - **Kids Camping:** best overall score
  - **QuickServe Pavilion:** best single shift
  - **Infinity Lake:** high score + longest streak
- Uses the existing cosmic dimmer for visual consistency.
- Fully mobile-safe — no scrolling, no clipping, no accidental background taps.

### App-Wide Music Visibility Guard

- Global `visibilitychange` handling ensures:
  - Music pauses when the app backgrounds or locks.
  - Only the previously playing track resumes on return.
- Prevents “ghost music” and restores native-app behavior on iOS.

### QuickServe Private Booth Audio Guard

- QuickServe now manages its own playback state independently.
- Prevents music from restarting after results screens or fighting the global guard.

### Infinity Lake — Record-Safe Scoring Pipeline

- End-of-run logic now:
  - Updates score, streak, longest streak, and solve count cleanly.
  - Awards badges based on score + elapsed time.
  - Only updates high score or longest streak when a true record is beaten.
- Eliminates score drift and false record bumps.

### Story Credits Safety & Layout Pass

- Credits viewport now has a guaranteed minimum height.
- Credits reveal is protected by both animation listeners and a timed fallback.
- Ensures the finale always resolves correctly on iOS Safari and WKWebView.

### Celebration & Toast Re-Anchoring

- XP and pickup toasts are anchored above the bottom bar.
- Celebrations remain visible without covering credits or blocking interaction.

---

## Changed

- Menu now acts as a true launcher hub — background themes apply once, overlays layer cleanly, and modal focus stays contained.
- Story credits behave more like a short film outro, with fewer UI distractions.

---

## Fixed

- Resolved rare cases where credits could fail to appear after Chapter 5.
- Fixed Infinity Lake cases where displayed stats didn’t match the just-finished run.
- Eliminated music continuing or resurrecting after app backgrounding.
- Improved overlay focus handling in native iOS builds.

---

## Dev Notes

> *“v1.5.0 isn’t about new modes — it’s about trust.  
> Scores are honest. Music respects the device. Credits land every time.  
> This is the build you hand to Apple.”* 🍧



## [1.4.0] – 2025-11-30 — **High Score Release + Credits & Music Guard ✨**

### Added

#### Invisible High Score Truck Button (Main Menu)

- New `<button class="menu-highscore-hitbox">` sits invisibly over the festival truck on the main menu.
- Scales inside the **11:16 stage** so the hitbox stays locked to the truck on phones and desktop.
- Keyboard-focusable with a visible outline for accessibility.

#### High Score Overlay Card (Meta HUD)

- New `#highScoreOverlay` dialog shows top stats without leaving the menu:
  - **Camping Games:** current Camping Score.
  - **QuickServe Pavilion:** best run.
  - **Infinity Lake:** high score + longest streak.
- Uses a compact neon card (`.hs-card`) centered on screen; no scrolling needed, fits on small phones.
- Reuses your existing `#cosmicOverlay` dimmer:
  - Clicking the truck → opens overlay.
  - Clicking the ❌ or dimmer → closes overlay and restores background scroll.

#### App-wide Music Visibility Guard

- New `wireMusicVisibilityGuard()` in `main.js` listens for `document.visibilitychange`.
- On **hide**: pauses whatever track was playing (Story, Kids, Infinity, Jukebox, etc.) and remembers which one.
- On **show**: resumes only the track that was playing when the tab/app got hidden.
- Gives the whole app “native app” behavior: lock phone → music pauses; unlock → music continues if it was actually playing.

#### QuickServe “Private Booth” Visibility Guard

- `quickServeMusic.js` now has its own `attachQuickServeVisibilityGuard()` with:
  - `qsWasPlayingOnHide` + `qsVisibilityGuardAttached` state.
- On **hide**: pauses QS music and flags that it was playing.
- On **show**: resumes only if QS paused itself; never fights the global guard.
- Result: QuickServe finally follows the same “pause on background / resume on foreground” rhythm as the other modes.

#### Infinity Lake — High Score + Badge Pipeline

- End-of-run handler now:
  - Updates score, streak, longest streak, solved count in `appState`.
  - Calls `checkInfinityBadgesByScore()` to award Infinity badges off **score + elapsed time**.
- High Score and Longest Streak fields:
  - First run → both match that run.
  - Later runs → only update when you beat your previous record.
- Clean separation:
  - One function for ending the run.
  - One for drawing the popup.
  - One for XP/time/badge bookkeeping.

#### Story Credits “Thank You” Block (Soft Promo)

- `THANK_YOU_TEXT` now carries a short, text-only outro:
  - Thanks players for spending real life at SnowCone MathFest.
  - Invites them to tell friends who’d love “weird math, neon nights, and too many SnowCones.”
  - Suggests searching **“SnowCone MathFest”** and **“JPS Grooves”** for soundtrack + updates.
- Kept as data, not layout, so you can keep editing copy without touching CSS or JS.

---

### Changed

#### Story Credits Roll — Layout & Flow

- Credits viewport `.sm-credits-list` now has a real vertical footprint:
  - `min-height: clamp(200px, 40vh, 360px);` so the last lines don’t get chopped at the bottom of the window.
- Credits overlay (`.sm-credits-overlay`) stays as a fixed, centered panel over a soft radial gradient and blackout, tuned for the 11:16 stage.

#### Credits Blackout — Mobile-Safe Guardrail

- `fadeToStoryCreditsFromCh5()` now:
  - Listens for `animationend` / `webkitAnimationEnd` on `.sm-blackout`.
  - Adds a **600ms timeout** fallback that calls `showStoryCredits()` if the animation event never fires (mobile Safari safety net).
- Prevents the rare case of “blackout fades but credits never appear,” especially on iOS.

#### Pickup Toasts & XP Popups — Moved for Story Credits

- Inventory pickup toasts + XP pop stack have been moved to the lower screen, just above the story bottom bar:
  - `.pickup-stack` now anchors near the bottom using `bottom: calc(var(--sm-bbar-h) + safe-area + 8px)`.
- XP popups (`.sm-xp-popup`) have their animation nuked to avoid flicker over credits and other overlays.

#### Menu as Launcher — Cleaner Scene Manager Hand-off

- `setupMenu()` now:
  - Calls `applyBackgroundTheme()` once.
  - Installs both the mushroom popper and the new High Score hitbox before wiring the mode labels.
- Static per-mode imports are being phased out in favor of a central scene manager controlling mode loading and teardown.

---

### Fixed

#### Credits vs. Toasts Stacking Weirdness (Mobile)

- Prior behavior: `.pickup-stack` lived at a huge `z-index`, so XP / pickup toasts could float above the credits overlay on mobile during chapter completion.
- Now:
  - Credits overlay owns the visual top.
  - Toasts sit lower and animate without stealing focus from the “movie ending” moment.

#### Infinity Lake End-Of-Run Drift

- Fixed cases where:
  - End button felt spooky / no-op, or
  - High Score / Streak didn’t match the just-finished run.
- Sanity path now guaranteed:
  - Play 5–10 problems → score & streak tick as before.
  - End ♾️ → popup shows correct stats.
  - High Score / Longest Streak only bump when you truly beat your record.

#### Music Zombies After Backgrounding

- Global + QuickServe visibility guards prevent:
  - Tracks continuing after you lock the phone or switch apps.
  - Dead runs suddenly resuming music after you’ve already stopped them from a result popup.

---

### Dev Notes (why we coded it this way)

#### High Scores as Meta HUD, Not a New Mode

- Invisible truck hitbox + small overlay card means you get a **“pro app” stats peek** without cluttering the map or adding a new scene to maintain.

#### Visibility Guards = Respect the Player’s Device

- Centralized tab/lock logic avoids every mode reinventing “pause on background.”
- QS gets a local guard right next to its Howl, so it never conflicts with the global music manager but still feels first-class.

#### Credits as Mini Film Outro

- Bigger scroll window + `THANK_YOU_TEXT` promo block gives the ending a proper “sit with it” beat.
- Toasts and popups are pushed down so the credits can own the emotional top of the screen.


## [1.3.0] – 2025-11-25 — **Story CYOA, Badges & Credits ✨**

### Added

- **Story Mode • Branch Spine for Chapters 3–5**
  - Locked in the core branching mechanics for **Ch.3 → Ch.4 → Ch.5** using a consistent pattern:
    - **Flags** = soft memory (what you chose).
    - **Items** = hard state (what you actually have).
    - **Router slides** = `ADVANCE` slides that jump by `id` instead of trusting linear order.
  - This now drives:
    - The CYOA **“Trade”** choice in **Chapter 3**.
    - The **portal + phone call** lanes in **Chapter 4**.
    - The **two big endings** in **Chapter 5**.

- **Chapter 3 • First Real CYOA Node — _The Trade_**
  - Trade slide wired as a true choice fork:
    - **On trade:**
      - Sets `flags.ch3_tradeChoice = 'trade'`.
      - Consumes the Perfect SnowCone (`MASTER_SIGIL`) via `consumeItems()` fallback → `removeItem()` if needed.
      - Grants `BEATUP_PHONE` once, with a `pickupPing` only if we actually add it.
    - **On keep:**
      - Sets `flags.ch3_tradeChoice = 'keep'`.
      - Leaves inventory alone (Perfect SnowCone stays), but the flag marks the path.
  - Result: the story remembers **what you did** and your items reflect **what you actually have**.

- **Chapter 4 • Portal Inventory Tug + Phone Call Router**
  - New `c4_portal_inventory_tug` slide:
    - Reads `flags.ch3_tradeChoice` + inventory to decide whether you’re in the **KEEP lane** (cone gets stolen here) or **TRADE lane** (you already have the phone).
  - Portal “drop” variants:
    - `c4_portal_phone_keep` — hooded dino **steals the cone** and drops the phone.
    - `c4_portal_phone_trade` — makes sure `BEATUP_PHONE` exists (for weird saves) and routes you into the call.
  - Phone call router:
    - Records `flags.ch4_phoneChoice = 'yes' | 'no'`.
    - Uses a router slide to branch into:
      - `c4_post_call_jehnk_approaches_yes`
      - `c4_post_call_jehnk_approaches_no`

- **Chapter 5 • Endings Router + Story Badge**
  - A dedicated entry router now looks at:
    - `hasItem(PERFECT_CONE)` and the branch flags to pick which ending lane you see (**carry-the-festival** vs **new-driver** vibe).
  - `Chapter5.onFinish` now:
    - Calls `awardBadge('story_ch5')` so finishing Ch.5 always awards the new story badge.
    - Saves via `saveToStorage`.
    - Arms the credits overlay with `scheduleStoryCredits(800)` (see below).

- **Story Credits Overlay**
  - New `storyCredits` overlay helper (in `storyCredits.js`) that:
    - Mounts inside `.sm-game-frame` when it exists; falls back to `document.body` as a safety.
    - Is idempotent (won’t stack multiple overlays).
    - Uses pointer-through styling so it never blocks UI.
  - Chapter 5 now calls `scheduleStoryCredits(800)` from `onFinish`:
    - Credits appear **~0.8s after** the chapter truly ends instead of from random manual triggers.

- **ChapterEngine • Quest `onComplete` Hook**
  - `chapterEngine`’s quest system now supports a `quest.onComplete(appState, engine)` hook:
    - First pays out normal `quest.reward` / `completionReward` via `grantReward`.
    - Then runs `quest.onComplete(...)` for “big” logic like crafting or item fusion.

- **Chapter 1 • Forge Flow on Quest Completion**
  - Chapter 1 forge now uses that new quest hook instead of a giant `onAdvance` blob:
    - Side quests grant the shards.
    - **Pocket Check** quest:
      - Checks for all three shards.
      - Crafts the Perfect SnowCone at exactly the right story moment (only if you don’t already have it).
      - Triggers `pickupPing` just once.
  - Chapter completion badge + credits are kept separate from forge logic.

- **Completion System • XP / Badges / Legend Blend**
  - Added `computeCompletionBreakdown(store)` and `getCompletionPercent(store)`:
    - **XP bucket:** 70% of the bar (normalized over caps).
    - **Badges bucket:** 25% (non-legend badge fraction).
    - **Legend bucket:** 5% (only when XP is full **and** all non-legend badges are done and the `legend` badge is owned).
  - Profile tab now calls `appState.getCompletionPercent()` instead of doing its own math.

- **Story Badge Data + Grouping**
  - Story badges (including the new **Ch.5** badge) are defined in `data/badges.js`:
    - Master list lives in one place; `badgeManager` + profile UI both read from it.
    - Updated grouping arrays so Story badges sit in their own section and the **“how to reach 100%”** copy pulls from the same definitions.

---

### Changed

- **Router Pattern Everywhere (Story)**
  - All critical branches (Ch.3 Trade, Ch.4 portal and post-call, Ch.5 endings) now:
    - Jump by slide `id` instead of assuming fixed indices.
    - Look up `chapter.slides.findIndex(s => s.id === targetId)` and then render.
  - You can now insert art slides or reorder content around those points **without blowing up the logic**.

- **Chapter 4 • Phone Call Aftermath**
  - Fixed the bug where players could see both Jehnk reactions in sequence:
    - The new `c4_post_call_router` reads `flags.ch4_phoneChoice` and jumps to exactly **one** follow-up slide.
    - Default flavor is the **NO** path if the flag is missing (defensive against weird saves).

- **Story Chapter Completion Flow**
  - `_onAdvance` in the story engine now:
    - Grants normal slide rewards.
    - Detects if a chapter actually finished.
    - Dispatches a `sm:chapterComplete` event with `{ chapterId, nextChapterId, mode: 'to_next' }`.
    - Calls `chapter.onFinish(appState, engine)` once.
    - Unlocks and starts the next chapter when appropriate.
  - This centralizes:
    - **+100 XP** chapter-completion bonus.
    - Chapter-completion SFX (short ding for Ch.1–Ch.4; Ch.5 intentionally silent).
    - Badge awards (like `story_ch5`) and credits scheduling.

- **Badge/Completion UI**
  - Profile tab:
    - Reads unified badge data from `data/badges.js`.
    - Uses `getCompletionPercent` for the bar instead of its own custom fraction.
    - Keeps the **“100% game”** explanation aligned with the real badge list and weights.

---

### Fixed

- **Post-call Double-Reaction Bug (Ch.4)**
  - Previously possible to see both Jehnk reactions after the phone call.
  - Now impossible: the `c4_post_call_router` picks one lane based on `flags.ch4_phoneChoice` and jumps there; no second reaction path is ever queued.

- **Story State Drift Around Trade/Portal**
  - Ensured that:
    - Trading the cone always removes `MASTER_SIGIL` and grants `BEATUP_PHONE` once.
    - KEEP path steals the cone and drops the phone later at the portal.
    - TRADE path makes sure the phone exists but never double-grants it.
  - Inventory, flags, and narrative finally stay in sync across **Chapter 3 and 4**.

---

### Dev Notes (why we coded it this way)

- **Flags + Items + Routers = Future-Proof Story**
  - Flags remember what you chose; items describe what you’re actually carrying; routers jump by `id`.
  - That combo means Future-You can shuffle slides, add art, or tweak pacing **without breaking the branch math**.

- **Quest `onComplete` Keeps Forge Clean**
  - Moving the forge into `quest.onComplete` keeps Chapter 1’s slide code readable:
    - Quest system handles the “you did all the things.”
    - Forge hook handles the “craft the cone now.”
    - Credits, badges, and XP stay in their own lanes.

- **Centralized Completion Math**
  - Storing the **70/25/5** breakdown in helpers keeps every completion bar honest:
    - One definition of **“100% game.”**
    - Profile, grids, and future UI all read from the same calculation.

- **Credits as a Scheduled Overlay**
  - Using `scheduleStoryCredits(800)` instead of hand-triggering credits makes the emotional beat predictable:
    - You finish Ch.5, breathe on the last line, *then* the credits roll in.
    - No more “sometimes it pops, sometimes it doesn’t” energy.


# [1.2.0] – 2025-11-10 — **Shift: Four Customers — Chapter 2 Live** 🌌

## Added

- **Story Mode • Chapter 2: _Shift: Four Customers_**
  - **Four-legend run:** **Benjamin Banneker**, **Emmy Noether**, **Archimedes**, **Luca Pacioli** — each arrives with **bio → lore → puzzle → happy slide** flow, then drops a **token**.
  - **Token grants:** `BANNEKER_TOKEN`, `NOETHER_TOKEN`, `ARCHIMEDES_TOKEN`, `PACIOLI_TOKEN` (one-shot, idempotent; inventory-driven for future gates).
  - **Portrait pipeline (retina-friendly):** new **`PRO_BIG_IMG()` / `SCN_BIG_IMG()`** helpers for high-res portraits/backgrounds (clean art swaps without layout thrash).
  - **XP flow (Story-parity):** +25 XP per reveal; +500 XP at chapter finish (before nav), with soft toasts anchored to the pressed control.
  - **Hand-off:** “Shift Complete” slide routes cleanly toward **Chapter 3** (`nextChapterId: 'ch3'`).

- **Puzzles (tight, 2025-practical phrasing)**
  - **Banneker (time & reckoning):** minute/ledger vibe to set the shift’s rhythm.
  - **Noether (stage-light invariant):** 2:3 light loop framed as “**pattern runs _N_ times**”; reveals **2/5 vs 3/5** split against any total.
  - **Archimedes (Infinity Lake):** dunk test; **3.0 L displaced → 3000 cm³** submerged volume (1 L = 1000 cm³).
  - **Pacioli (Cone Coins double-entry):** one cone paid entirely with **Cone Coins** + **$1 cash tip** →  
    **Debits:** Unearned Cone Coins $5; Cash $1 · **Credits:** Sales Revenue $5; Tips Payable $1.  
    *(Focus stays on the Cone Coin liability, not syrup inventories.)*

## Changed

- **Copy discipline:** short pre-reveals; the **Reveal** carries the heavy answer prose (consistent with Ch.1).
- **Portrait band & scaling:** enlarged legend band, safe **11:16** framing, no underlap with text or bottom bar.
- **Music & mute parity:** Howler state mirrors UI across the chapter slides; one-tap unlock held from Prologue/Ch.1.

## Fixed

- **One-shot grants & toasts:** no double-award on re-enter; toasts are **pointer-through** and auto-dismiss.
- **Slide unwire:** all RAF/timers/listeners tear down on exit; no ghost handlers between customers.
- **Image repaint hiccups:** big-img helpers + background repaint nudge prevent stale frames on mobile.

## QA (fast pass)

- Run full chapter → **four tokens land exactly once**; XP ticks (+25 per reveal, +500 on finish).
- Toggle mute anywhere → state reflects **every** slide; no surprise audio starts.
- Tiny phones → bottom bar never overlaps text; portraits never crop; lights puzzle scales clean.
- Re-enter Ch.2 mid-run → no duplicate listeners; no repeat grants.

## Dev Notes (why we coded it this way)

- **Event-driven tokens:** hooking grants to the **happy slide** keeps narrative beats atomic and idempotent—no imports firing side-effects, no double awards on HMR.
- **Big-image helpers:** `PRO_BIG_IMG/SCN_BIG_IMG` give us a **single switching seam** for art quality (and future `?lg=1` variants) without touching slide logic.
- **Ledger puzzle focus:** centering on **Cone Coins** modernizes the Pacioli beat and teaches liabilities/revenue in the player’s actual economy—less theme drag, more literacy.
- **Toast pointer-through:** celebrations shouldn’t block play; we keep the hype visible while the UI stays interactive. 😎

## Next

- Chapter 2 completion badge & award hook (after all four customers).
- Optional tiny SFX set: timepiece tick (Banneker), light scanner chirp (Noether), water plunk (Archimedes), ledger page flip (Pacioli) — respecting global mute.


## [1.1.0] – 2025-10-26 — **It Has Begun — Chapter 1 Complete**

### Added

* **Story Mode Forest:** **Prologue + Chapter 1 (*The Gates of Dawn*) complete.**
* **Lore loop — “Question the Recipes”:** single-screen exposition teeing up Red/Green/Purple flavor stories.
* **Quest — “Pocket Check”:** have-all branch forges the perfect cone and advances progression.
* **Chapter finish drip** and **clean hand-off to Chapter 2** from “Back to the Truck.”
* **Forge flow & rewards (Chapter 1):**

  * When player holds **Triangle Shard**, **Mint Square**, and **MoonChain**, grant **Master Sigil** and currency; badge hook wired for the forge moment.

### Changed

* **Pocket Check copy discipline:** short pre-reveal blurbs; the **Reveal** carries the big prose (no “double wall of text”).
* **Version tab copy:** updated to call out **Chapter 1 complete** alongside the Save Tools note.

### Fixed

* **Loop “undefined” blip:** loop renderer expects `loop.text`; ensured it’s present even when experimenting with steps.
* **Loop bounce after first page:** collapsed the loop to **one slide (exposition)** to match the engine’s loop model; no accidental return to options.


## [1.0.0] – 2025-10-26 — **Final Polish + Launch Ready ✨**

### Added

* **Save Tools (rock-solid):**

  * Robust **Download Save** with delayed URL revoke + in-DOM anchor for Safari compliance.
  * **iOS PWA Share** fallback (`navigator.share({ files })`) and **data-URL** backup.
  * Clipboard failover (copies JSON) when downloads aren’t permitted.
* **Export snapshot guardrails:** prefers `appState.toJSON()`, then `structuredClone` → JSON round-trip → minimal curated snapshot to avoid MobX cycles.
* **Import hardening:** reads as ArrayBuffer + TextDecoder → JSON; calls `appState.importFromJSON()` when present; sets `forceWelcomeReload` and nudges reload; optionally persists via `appState.saveToStorage?.()`.

### Changed

* Final copy pass across About/Info and headings; **JPSGrooves.com** featured first; credit line louder: *Built end-to-end by JPS Grooves*.
* Subtle presentation nips/tucks for consistency with the polished v0.9.9 UI.

### Fixed

* Rare Safari/PWA cases where downloads silently failed due to early URL revocation or detached anchors.
* Reset now clears both `localStorage` and `sessionStorage`, ensuring a truly fresh start.

> ✅ **Smoke test:** Reset → Import → full state restore (themes/badges/XP) confirmed.

## v0.9.9 — Just Small Details Now (October 11, 2025)

### 🧊 UI Consistency & Safe-Area Polish

* 11:16 stage locked across modes; backgrounds center/contain (no crops).
* Safe-area padding unified; bottom bars (Back/Mute/etc.) never overlap content.
* Text clamping + responsive type scales prevent tiny-screen spill.

### 🧼 Event Wiring & Stability

* Single screen-level handlers per mode with full unwire on exit.
* Background “repaint nudge” prevents stale paints when swapping modes.
* Pointer-events audit: overlays/celebrations never block gameplay.

### 🧠 Navigation & Flow

* Help/Exit consistent everywhere; one-tap returns to each mode’s center.
* Dialog/menus share one template—no double-wrapped cards.
* Router edge-cases trimmed (typos, shorthands, booth switches) for clean handoffs.

### 🏕️ Kids Camping — Final Touches

* Honk/park flow stable; Park button always visible; celebration overlay fades cleanly.
* Mobile zoom prevention tightened; hitboxes padded; stacked honk label format locked.

### ♾️ Infinity Lake & ⚡ QuickServe

* Bottom bar pinned and protected on small phones.
* Combo/readability tweaks: glow timing + lightweight textures for smoother reads.

### 📖 Story Mode Forest & 🐱 Math Tips Village

* Typewriter intro (Skip / I’m Ready) & slide deck keys finalized.
* iOS PWA true-full-height fix (`100svh` + safe-area); single chat scroller owns overflow.
* Response cards refined (`.mt-response-card`, `.mt-response-list`, `.mt-lecture-card`); softer pop-in animations.

### 🎵 Soundtrack — Remaster Pass Complete

* All tracks **remastered** for loudness/clarity; loop points tightened.
* Mute/loop UI stays in sync; one-tap Howler unlock preserved.

### ♿️ Accessibility & Copy

* ALT text/labels for key UI and badges; contrast nudges on dark headers.
* About/Info: louder credit line (*Built end-to-end by JPS Grooves*), **jpsgrooves.com** first.

### 🐛 Misc Cleanups

* Button hitboxes normalized; safe CSS dedupe; micro-jank on resize eliminated.

### 🧪 Quick QA

* Mode swap spam → no lingering handlers or blocked taps.
* Any celebration → gameplay remains interactive; overlay fades on schedule.
* Tiny-screen mobile → bottom bar visible, text wraps safely, no overlap.
* OST loops → no clicks/pops; mute/loop reflect true state across screens.

> *“Nothing flashy left — just that glassy feel. Every mode behaves, every track sings.”*

**Next:** **v1.0.0 — Final Polish + Launch Ready ✨**


----

## v0.9.6 — Badges Pass, Touch-Through Toasts, Router That Doesn’t Get Lost (October 8, 2025)

### 🏅 Badge System — Phase 3 polish

* **Play Music** routes through a single `sc:jukebox-play` event — awards once on the first successful ▶️, never on auto-play.
* **Alias guard** (`play_music → listened_music`) and **unknown-id bailouts** prevent phantom awards.
* **Grid renderer** groups badges (Core, Camping, QuickServe, Infinity, Story, Completion) with locked/earned art and alt text.
* **Theme unlocks** gated by badge metadata; themes push into `profile.unlockedThemes` idempotently.
* **Autoruns** redraw the grid on badge count change and show a one-shot banner when a new badge lands.

### 🧃 Touch-through badge banner

* The celebration banner now **never blocks gameplay** — it’s visible but **click-/tap-through** (`pointer-events: none`), auto-dismisses after 5s, and uses a subtle frosted backdrop.
* Result: you keep playing QuickServe/Kids/Infinity **without waiting** for a toast to fade.

### 🧠 Math Tips Village — router, quiz, and small-talk tune-up

* **“Quiz me” actually starts a quiz** from anywhere; quiz mode holds input focus until ended.
* **Calculator no longer hijacks** while quizzing; inline math is allowed elsewhere (percent-of, simple expressions).
* **Pending booth switch** flow: natural **yes/no** confirms, with a quick “what is that booth?” explainer on ask.
* **Typos & shorthands** normalized: `claculator`, `staus`, `calc`, `recipes` topics, and “go/open/send me to …” all route cleanly.
* **Lore/Recipes** get clean, single-card outputs; layered cards don’t double-wrap.
* **Small-talk fixes**: “I’m good” normalization, festival chat now answers **that Grampy P loves festivals and SCMF is home**, weather stays cozy (“peek your app, then we’ll do a quick problem”), and boundaries stay school-friendly.

### 🧊 UI & stability

* **Auto-scroller** respects user scroll; sticks to bottom only when pinned; handles resize/mutation reflows.
* **Layered output guards** (`alreadyHasCard`) stop double cards; menus share a single booth-style template.
* **Help/Exit** are global and predictable; returning to the village center is one tap.

### 🐛 Notables

* Fixed a path where **“quiz me” in Lessons** looped the menu instead of starting a deck.
* Fixed the “You ever been to a music festival?” prompt to deliver the intended Grampy-P vibe.
* Tightened algebra intercepts (slope-intercept & Pythagorean) to avoid false positives.

### 🧪 Quick QA

* Start a quiz from Lessons → **Q1 appears**; calculator input doesn’t steal focus.
* Unlock a badge during any game → **banner shows**, but taps pass through; gameplay uninterrupted.
* Say “recipe snowcone” / “calc booth” with typos → correct booth opens, single clean card.
* “Exit” / “leave booth” returns to the **village center** with the map prompt.

> *“Badges feel earned, not noisy; toasts celebrate without getting in the way; and Grampy P finally routes like a festival pro.”*

**Next:** v0.9.7 — Music/SFX polish (mix pass, celebration cues, and loop discipline across modes).



---
## v0.9.4 — More Kitty Fixes, Louder About, Quick Polishes (October 6, 2025)

### 📖 Story Mode Forest — playable & polished

* KC-style **11:16 stage**; background center/contain (no crops) + larger portrait band.
* **Prologue flow**: typewriter intro → **Skip / I’m Ready** → slide deck with **Prev/Next** and keyboard (**Enter/←/→/Esc**).
* **Practice slides**: one-shot “Reveal” blocks + **Pythagoras fretboard** mini-sim (fraction readout, interval tag, soft WebAudio beep).
* **Rewards**: +25 XP per reveal, **+500 XP on Finish**, and a new **`story_prologue` badge** with a subtle toast near the tapped button.
* **Bottom bar** pinned (Back/Mute), safe-area aware; answers/images no longer push the buttons around.
* **Audio**: one-tap Howler unlock; Prologue track loops; mute state stays in sync across screens.
* **Stability**: single click/keydown handler per screen; full unwire on exit; background repaint helper to bust stale paints.

### 🧠 Math Tips Village — iOS “Add-to-Home” hotfix

* **True full-height** after the intro (uses `100svh`/safe-area); chat no longer “scrunches.”
* **One scroller** owns overflow (the chat window); intro overlay releases input on fade-out.
* Pinned bottom bar (Back/Mute + Copy/Export); **touch-action: pan-y** restores smooth scrolling.
* Music start/mute stays tidy when re-entering Tips.

### 🧊 Info Modal — creator-forward & cleaner

* New hero blurb: **“Neon math. Real music. Zero fluff.”**
* Clear credit line: **Built end-to-end by JPS Grooves — developer • musician • educator • illustrator.**
* **Primary CTA first**: **Visit JPSGrooves.com**, then SoundCloud / Spotify / Apple Music.
* Buttons **stack in a column** on narrow screens; removed the fullscreen warning; header text fixed (no invisible black).

### 🧪 Quick QA

* Story: BG never crops, buttons don’t jump, XP/badge award once, keys work.
* Tips: On iOS PWA, chat fills the screen and scrolls smoothly; bottom bar never overlaps input.
* Modal: Links feel primary, layout stacks cleanly on phones.

> *“Forest tells the tale, Tips fills the screen, and the About finally points people straight to the music, the site, and the work.”*

---

## v0.9.0.5 — *“Math Tips Village: Kitty Paws & Polish”* (September 16, 2025)

### 🧠 Math Tips Village — UI/UX Refresh

* **Full-bleed background** restored (11:16 aspect wrapper; intro + main share center/contain rules).
* **Single chat scroller** that hugs the bottom (no nested scroll areas); `min-height: 0` grid fix prevents scroll-trap.
* **Header cleanup:** title is **text-only** (“Math Tips Village”) — no panel/border — neon glow preserved.
* **Response patterns:** added `.mt-response-card`, `.mt-response-list`, `.mt-lecture-card`; tidy inline `code` styling.
* **Softer motion:** bottom-up pop animation, tightened spacing, consistent Orbitron font; mobile scrollbars hidden when appropriate.
* **Safe-area polish:** respects `env(safe-area-inset-bottom)`; tap targets sized with `clamp()`.

### 🎛️ Bottom Utility Bar (Story-Parity)

* Pinned **Back** (left), **Mute** (right), **Copy/Export** centered.
* Fixed pointer-events so center actions are clickable on **intro** and **main** screens.
* Chat input never overlaps the bar on short devices.

### 🎵 “Kitty Paws” Music Flow

* **Reliable re-entry playback**: one-tap Howler unlock + guarded `__mtMusicStarted`; auto-resume on entering Math Tips.
* **Loop discipline:** loop enabled on enter; **stop only if** current track is Math Tips; loop state reset on exit.
* **Mute UI** stays in sync with Howler’s mute state.

### 📖 Lore Additions

* **Festival lore** (Hypotenuse Gate beat) delivered via mini-lecture card.
* **“Who is Grampy P?”** identity blurb aligned to the new response layout.
* Light **lore joke** path; shared “Would you like to know more?” footer.

### 🧼 Dedupe & Cleanup

* **CSS deduped**: single source of truth for `.mt-grid`, `.mt-content`, `.chat-window`.
* **One scroller owns overflow**; grid parents use `min-height: 0`.
* **Event wiring hardened**: single global Back/Mute handler, full unwire on exit, HMR-safe guards.

### 🧪 QA Checklist (v0.9.0.5)

* Background shows on **intro and main**; header has **no box**.
* Enter Tips → **Kitty Paws** plays; leave & re-enter → **plays once** (no double-start).
* Mute toggles icon/state correctly from both screens.
* Chat stacks top→bottom, smooth pop-in; scroller stays at bottom for short logs.
* **Copy** copies transcript text; **Export** calls `appState.exportChatLogs()`.

### 📌 Dev Notes

> *“One scroller, a real bottom bar, and music that respects your vibe on re-entry. Cards and lists give lessons + lore a steady voice, and the header is finally just glow on night.”*


____

## v0.9.0 — *“Legendary Badges”* (September 4, 2025)

### 🏆 Legendary Badge & Completion Overhaul

* **Legend badge**: auto-awards once **all non-legend badges** are unlocked (95%), adds the final **+5%** for 100% completion.
* **Completion percent**: now **badge-driven only** → 95% from non-legend badge progress + 5% from the Legend badge.
* **XP caps** (Story 800, Camping 1000, QS 500, Infinity 1000, Extra 1700) remain in place for **levels & score pacing**, but no longer affect the completion bar.

---

### 🎖️ Badge System — Phase 2

* **Ant streak badge**: corrected ID → `kids_ants_streak10`; now fires properly when margin ≥10.
* **Grampy P**: still awarded on first chat send in Math Tips Village.
* **Play Music**: tied to first manual jukebox ▶️ press (not auto-play).
* **Change Theme**: awarded on first non-default theme (MobX reaction).
* **Tour**: awarded after sampling all major modes (QS, Infinity, Kids, Story, MathTips).
* **Kids Camping set** (all event-backed, one-shot):

  * `kids_cars_speed`: park all cars ≤60s (`kcParkingComplete`).
  * `kids_camp_10k`: Camping Score ≥10,000 (reaction on `popCount`).
  * `kids_mosquito`: first mosquito swat.
  * `kids_ants_streak10`: ant streak margin ≥10.
  * `kids_tents_all`: all tents lit (`kc:tents-all`).

---

### 🛠️ Stability & Cleanup

* **Unified completion percent** across Math Tips, profile tab, and Grampy P → all call `appState.getCompletionPercent()`.
* **Parking mini-game**: celebration flow fixed; `finalElapsedMs` frozen correctly; dispatch of `kcParkingComplete` stable.
* **Event unwiring**: Kids mode disposers guaranteed on exit; no dangling listeners.
* **Autosave**: badges and progress persist cleanly via MobX autorun.

---

### 🧪 QA Checklist (Legendary Pass)

* Unlock all non-legend badges → completion shows **95%**.
* After Legend auto-awards → completion shows **100%**.
* Ant streak ≥10 margin → `kids_ants_streak10` unlocks once.
* Verify persistence: reload after unlocking → badges remain unlocked.

---

### 📌 Dev Notes

> *“Completion is now pure badge-alchemy. 95% comes from the grind, 5% from the crown. XP still keeps the vibes flowing for levels, but the bar belongs to the badges. Ant Nemesis now fires true, and the Legend unlock finally feels earned.”*

---

### ⭐ Next

* Wire **Infinity** & **QuickServe** milestone badges (end-of-run triggers).
* Add **confetti/banner polish** for badge unlocks (rate-limited).
* Begin polish passes for MathTips Village (v0.9.1).


___



## v0.8.8 — *“The Grampy P Badge”* (August 30, 2025)

### 🎖️ Badges — Phase 1 (Event-Driven & One-Shot)

* **Grampy P**: awarded on the **first chat send** in Math Tips Village (`talk_grampy`).
* **Play Music**: awarded **only** when the **Jukebox ▶️ button** successfully starts playback the first time (`play_music`). (Not tied to auto-play or track-select.)
* **Change Theme**: awarded on the **first non-default theme** selection (`change_theme`) via a MobX reaction.
* **Try Modes**: lightweight “first visit” unlocks when entering a mode for the first time (per-mode ids like `try_qs`, `try_infinity`, `try_kids`, `try_story`, `try_mathtips`).
* **Kids Camping set** (all event-backed, idempotent):

  * `kids_cars_speed`: all cars parked **≤ 60s** (emits `kcParkingComplete` with `elapsedMs`).
  * `kids_camp_10k`: Camping Score **≥ 10,000** (MobX reaction on `appState.popCount`).
  * `kids_mosquito`: first mosquito swat (`onSwat()` callback).
  * `kids_ants_streak10`: red-ant win streak **≥ 10** (`kcAntStreak` event).
  * `kids_tents_all`: all tents lit (`kcTentsAllLit` event).

> Implementation notes: awards now happen **inside game/UI events**, not at module top level. Every badge check is guarded so it can’t double-award or throw on undefined vars.

---

### 🎧 Jukebox UX (Play/Pause Now Snappy)

* **Immediate button flip** on first Play: the ▶️ → ⏸️ label updates **right away**, then re-syncs on Howler `play/pause` events.
* “Now Playing” label updates reliably on play/pause/skip.
* Badge hook lives **in the Jukebox Play handler** and fires only on the first successful play.

---

### 🅿️ Parking Mini-Game Integration

* Fixed `initParkingGame` **named export** and wiring from `kidsCamping.js`.
* Parking emits **`kcParkingComplete`** with `{ elapsedMs }`; Kids mode listens and awards `kids_cars_speed` when `elapsedMs ≤ 60000`.

---

### 🛡️ Stability & Cleanup

* Removed stray, top-level `awardBadge(...)` calls that referenced **undefined** values (`count`, `seconds`, etc.).
* Centralized ambient unlocks in a tiny **achievements watcher**; disposers run on mode exit/HMR.
* Kids mode: all badge listeners are scoped to the Kids canvas and unwired on teardown.

---

### 🧪 QA Checklist (fast pass)

* **Math Tips**: send one message → “Grampy P” badge appears once.
* **Jukebox**: press ▶️ once → playback starts, button flips to ⏸️, “Play Music” badge appears. (Track-select alone should **not** award.)
* **Themes**: switch off default once → “Change Theme” badge.
* **Modes**: entering each mode once → “Try \*” badge for that mode.
* **Kids**:

  * Park all cars in < 60s → `kids_cars_speed`.
  * Reach 10,000 Camping Score (any mix) → `kids_camp_10k`.
  * Swat a mosquito once → `kids_mosquito`.
  * Hit ant streak 10 → `kids_ants_streak10`.
  * Light all tents → `kids_tents_all`.

---

### 📌 Dev Notes

> *“Badges were noisy; now they’re musical. Everything unlocks from real events, exactly once, and never at import time. The Jukebox play hook finally feels right — and yes, the button flips on the very first click.”*

---

### ⭐ Next

* End-of-run milestone badges for **Infinity** & **QuickServe** (score, streak, time buckets).
* Optional **confetti/banner** per unlock with rate-limit.
---
---

## v0.8.0 — *“Story Mode Prologue Finished”* (August 24, 2025)

### 📖 Story Mode — Prologue, Locked

* Typewriter intro ➜ slides flow with clean **Prev/Next**.
* Centered **Chapter Menu** with “Story Mode Forest” title; safe-area bottom bar (**Back/Mute**).
* Background **contain/center** inside 11:16 stage; portrait band enlarged; no weird crops.

### 🧮 XP & Toasts (new!)

* **+25 XP per Reveal** (practice items).
* **+500 XP on “Finish”** (last slide), awarded **before navigation** via capture listener.
* **Single subtle toast**, anchored to the pressed button (no duplicate bottom-screen pop).
* Central helpers:

  * `awardXP(amount, { anchor, reason })`
  * `showXPPopup(text, anchor)`
* XP writes to `appState.addXP(...)`; console logs `✨ +XP` for traceability.

### 🧩 Practice Slides

* Reveal buttons open answers once (double-fire guarded).
* Per-item SFX (`smDing`, `smDing2`) play on first reveal.
* Optional **fretboard mini-sim**: simplified fraction readout + interval labels; **interval-beep** with throttle.

### 🖼️ Legend Image System

* New `.sm-slide-legend` sizing with tuned margins; **Galileo bump** option.
* Special image rules: `.sm-cosmic`, `.sm-slide-image-bram`, Euclid cone tweaks.
* Title→image spacing and text underlap fixes.

### 📱 Viewport & CSS Polish

* Clamp-driven typography; no scroll needed, no line-clamp truncation.
* Bottom bar respects `env(safe-area-inset-bottom)`.
* iOS tap-highlight off; double-tap zoom prevention on core wrappers.
* Director portrait pinned to bottom; shoes never cropped.

### 🔊 Audio

* Howler **one-tap unlock** retained.
* Mute sync across canvases.
* Interval beep uses WebAudio with short, clickless envelope.

### ⚙️ Cleanup & Stability

* Global handlers (click/keydown) **unwired on exit**; no leaks between Kids/Story.
* Background repaint helper avoids layout thrash.
* Lazy slide rendering with minimal DOM churn.

### 🐛 Fixes

* Removed duplicate XP popup path (no second toast near bottom).
* Guarded reveal buttons from re-award/rehit.
* Final “Finish” XP fires exactly once.

### ⭐ Coming Next

* **Completion badge** for Prologue finish.
* Chapter 1 unlock prep (target per chapter menu note).
* v0.9.0: **Math Tips Mode Complete**.

___

## v0.7.7 — *“Prologue Sparks, Legends Awake.”* (August 23, 2025)

### 📖 Story Mode — First Steps

* ✅ **Prologue complete** — narrative flow locked in, typewriter intro, clean Prev/Next navigation.  
* ✅ **Chapter menu polish** — centered vertically, bigger “Story Mode Forest” title, buttons tidy + responsive.  
* ✅ **Legend portraits** — Galileo, Newton, Bram, Ada, Gauss, Jehnk all wired in; new `.sm-slide-legend` scaling system makes them shine.  
* ✅ **Spacing fixes** — title→image padding, bottom margins, and no underlapping text.  

### 🖼️ Art Integration

* Cosmic festival portraits generated + dropped in:  
  * Galileo night sky 🌌  
  * Newton’s force-laden ballet 🪐⚙️  
  * Ada storm spiral ⚡🎶  
  * Gauss tracing rain-arcs 🌧️➗  
  * Jehnk 2-Cones 🍧🍧 (tie-dye, sunnies)  
* Transparent-edge festival art for surreal storm moments — fades clean into the void.  
* Bram asset re-exported at 2× resolution — no more blur on retina.  

### 🧩 Practice Slides

* SnowCone art pinned absolutely with reserved space — no more button push-downs on mobile.  
* Reveal answers show cleanly with cone inline, buttons stable across devices.  

### 📱 Viewport Prep

* Clamp/vh audits for text + buttons across slides.  
* iOS double-tap zoom suppression still solid.  
* Bottom bar pinned (Back/Mute), safe-area padding respected.  

### 🔊 Audio

* Howler sync + mute toggle steady across Kids + Story.  
* AudioContext auto-unlocks on first touch/click.  
* SFX placeholders scoped for Story (no leaks).  

### 🧼 Cleanup Discipline

* RAF, timers, event handlers unwired on exit.  
* Legend image scaling + preload optimized; no ghost listeners.  

---

### 📌 Dev Notes  

> *“Story Mode breathes now. Galileo whispers, Newton counters, Ada storms, Gauss arcs — and Jehnk hands out cones like wisdom. Phone looks good. Desktop scaling’s the last puzzle before v0.8.0. The forest is alive.”*  

---

## v0.7.0 — *“Bugs Swatted, Snacks Won.”* (August 8, 2025)

### 🏕️ Kids Camping — Mode Complete

* ✅ **Three (and mosquito) mini-games live & linked**: Tent Lines, Parking, Ant Attack — unified UI, shared score, clean transitions.
* ✅ **Mosquito mini-game added** — drifts into the play area, tap to splat, exact-touch splat graphic, +50 Camping Score.

### 🚗 Parking Game — Final Polish

* Smooth, festival-pace **drive-offs** (move holder, not img; eased; longer travel off-screen).
* All **11 cars** with ordinal flow; **+50** for correct order; **+100** if all parked **< 1 minute**.
* **Honk engine v2**: sequential `honk1–honk5`, progress remembered per car, victory honk on park.
* **Sprite preloader** eliminates first-load stutter; intro lane drive-by cancels on first input.

### 🐜 Ant Attack — Count Wins

* Pure **count-based tug-of-war**: food moves when weight met; **player wins ties**; direction can flip mid-pull.
* Every round ends with a score; **no ghost rounds**; late AI spawns cleared on round end.
* Weight overlay & “big snowcone” visual polish; UI synced with score updates.

### ⛺ Tent Lines — Resilient Glow

* Scoped SVG overlay per grid; retry & filter refresh for GPU hiccups; **solid-stroke fallback** if effects fail.
* “Solve-all” path awards **+100** and regenerates; mobile scaling & layout locks tightened.

### 🦟 Mosquito — Scoped, Chill, and Killable

* **Spawns every \~7s** (initial + respawn), gentle drift with bounce-bounds inside the **Kids canvas only**.
* **30% SFX volume** on `mosquito.mp3`, respects global mute; AudioContext unlock on first touch/click.
* Hard **kill-switch on mode exit** (timers, RAFs, DOM, and global registry cleared) — no more hauntings.

### 🧠 Scoring & XP

* Camping Score unified across minigames.
* **+100 XP per 1000 Camping Score** (MobX reaction; batches safely; no double awards).
* Score pop animation and HUD kept stable on small viewports.

### 🔊 Audio & Controls

* Mute button **synced with Howler**; keyboard/touch friendly.
* Double-tap-zoom prevention across core wrappers; buttons sized via `vh`/`clamp()` for phone comfort.

### 📱 Mobile Polish

* Background image truly centered; grid rows locked (no layout jumps).
* Hit-areas tuned; animations reduced gracefully with `prefers-reduced-motion`.

---

### 📌 Dev Notes

> *“Kids Mode finally feels like a campsite: cars cruise in, ants brawl over snacks, and that mosquito learns respect. Clean loops, no leaks, tight scaling, buttery exits. Ship it.”*


---

## v0.6.6 — *“Tents Up, Cars Parked!”* (August 2, 2025)

### 🏕️ Kids Camping Parking Game — Complete

* ✅ **Full gameplay loop implemented and polished** — from "Park the Cars!" intro to full 11-car celebration.
* ✅ **PNG car sprites scale perfectly** — center-aligned, with honk label on the left and Park button on the right.
* ✅ **Honk Counter & UI**:

  * Responsive stacked layout — displays `X / Y` honks and ordinal parking order ("Park 3rd")
  * Prevents over-honking — no longer awards extra points after limit
* ✅ **Final overlay (“All Parked!”)**:

  * Holds visibly for 2.5s, then resets the game cleanly
  * Confetti and fade logic handled via manual overlay animation stack
  * Honk label and park button are hidden during this sequence

### 🧠 Scoring + XP Logic

* +1 pt per Park button press
* +10 pts for completing a car (regardless of order)
* +50 pts for correct ordinal match
* +100 pts if all cars parked in under one minute
* ✅ **XP batches**: +20 XP for every 100 points
* ✅ **Points now match visual feedback and game loop**

### 🔊 Honk Audio Engine (New!)

* 🔊 **Sequential SFX plays as cars require more honks:**

  * `honk1.mp3`, `honk2.mp3`, `...` up to `honk5.mp3`
  * Pattern loops after 5: 1 → 12 → 123 → 1234 → 12345 → 123451 → ...
* ✅ SFX progress is stored per car — returns to correct spot if user revisits car mid-sequence
* ✅ **Victory honk (honk1.mp3)** plays after successful parking
* 🔇 Fully respects global mute toggle (`Howler` synced)

### 📦 Asset & Layout Enhancements

* 🖼️ All car PNGs preloaded on game init via `preloadParkingSprites()`
* 🎨 Fixed snapping and layout jumping between car transitions
* 🔍 Added padding and alignment fixes for consistent vertical locking on mobile and desktop
* ✅ Fade/transition stacking logic cleanly scopes overlay events (no stuck honk or park buttons)

### 📱 Mobile Polish

* ✅ Touch-friendly Park button scaling
* ✅ Car press + park button responsiveness tweaked for fast tapping
* ✅ Smaller viewports no longer push car below screen or snap layout
* ✅ Double-tap zoom prevention applied to parking zone

---

### 📌 Dev Notes

> *“It actually works. The game is responsive, musical, and smooth — and yeah, you gotta honk 66 times if you want that final car parked. But it’s worth it. Preloading, scaling, hiding, scoring, syncing... it all paid off. This is what done feels like.”*


---

## v0.6.0 — *“Infinity Mode Complete”* (July 10, 2025)

### 🚀 Major New Features

🎵 **Infinity Lake Mode — FULL GAMEPLAY LOOP COMPLETE**  
- ✅ Intro sequence with the Triplets — full character intro, sprite animation, and start-show button with fade-out and transition to the game grid.  
- ✅ Math Mode switching (J/K/L or on-screen buttons) — instantly swaps between Add/Subtract, Multiply/Divide, and Algebra — streak is preserved between modes!  
- ✅ Problem generator supports all three math types:
  - Clean division logic  
  - Algebra with variable isolation  
  - Alternating toggle patterns for variety  
- ✅ XP and Point System wired in:
  - Add/Subtract → +1 pt, +3 XP  
  - Multiply/Divide → +3 pt, +4 XP  
  - Algebra → +4 pt, +5 XP  
  - All tracked in appState and reflected live!

---

### 🔊 Audio SFX & Music Engine Enhancements

💥 **3–6–9 SFX BURST SYSTEM**  
- ✅ Custom reward sounds play at streak 3, 6, 9, 12, and 15:  
  - `QuikServemilestone.mp3` (streaks 3, 9, 15...)  
  - `QuikServepoints100.mp3` (streaks 6, 12...)  
  - Alternates automatically via `streakFlipFlop`  
  - Console logs: `💥 Triggering SFX burst!`

🎶 **Infinity Music Looping Engine**  
- ✅ `playInfinityLoop()` shuffles a curated list of tracks  
- ✅ Tracks reshuffle after full loop — infinite jam session  
- ✅ `stopTrack()` halts playback cleanly when leaving mode  
- ✅ Mute toggle works from click or keyboard — visually synced

---

### 🌟 UI & UX Enhancements

- 🌈 Mode buttons now highlight the current math type  
- ✨ Result popup added:
  - Score  
  - High Score (personal best)  
  - Longest Streak (personal best)  
  - Time Played  
  - Confetti for new records  
- ✅ Mute toggle label now says "Mute" or "Unmute" correctly  
- 🌀 Smooth fade-ins for game grid and sprite upon start

---

### 🐛 Critical Fixes

- 🐛 Fixed Add/Sub mode answer button bug — answers now populate correctly  
- 🐛 Patched `Howl` load errors preventing SFX from playing  
- 🧽 Scoped audio logic to avoid ghost tracks  
- 🔧 Bracket fix after `playStreakBurst()` — prevented Vite crash

---

### ⚡ Performance & Stability

- 🧼 Event handlers cleaned up on mode exit  
- ✅ DOM references now safely cached  
- ⏱️ Sprite animation sequencer is smooth and non-blocking  
- 🎶 Music logic guarantees only one loop active at a time

---

### 📌 Dev Notes

> *“Infinity Mode finally breathes — and it breathes in triplets.  
> The rhythm is real. The rewards are cosmic. The game is alive.  
> We’re no longer testing the mode… we’re listening to it.”*


## v0.5.6 — *“QuickServe Keyboard Ascension”* (July 9, 2025)

### 🚀 Major New Features

🎹 **Universal Keyboard Input Integration for QuickServe Mode**

* ✅ **Full keybind system activated** for QuickServe Mode, now handles:

  * Numbers `0–9`
  * Decimal `.` and Negation `-`
  * `Enter`, `Backspace`, and `Shift + R` to reset game
  * `Shift + E` to end the game early
  * `M` to mute / unmute — *instantly from the keyboard*

* ✅ **Mode switching with J / K / L** keys — now hot-swaps between:

  * `J` = Add/Subtract
  * `K` = Multiply/Divide
  * `L` = Algebra
  * All with ✨ no streak reset ✨

* ✅ **Reset via `Shift + R`** fully wipes the board and restarts the timer, math mode, and music — *you’re back in the zone instantly.*

---

### 🌟 UI & UX Enhancements

* 🎯 **Mode button glow now reflects current math type** — keyboard and on-screen buttons sync up their visual state perfectly.
* 💡 **Negation via keypad now matches keyboard behavior**, allowing negative answers *before* any digits are entered.
* ✨ **Mute button now responds visually** when toggled via the `M` key or button press — synced to Howler’s internal state.
* 🌀 **Refactored keypad setup to use safeBind** — now totally resilient to layout changes, pointer event quirks, and DOM timing.

---

### 🐛 Critical Fixes

* 🐛 **Fixed bug where reset (Shift + R) crashed** due to missing imports.
* 🐛 **Fixed mute button not updating when triggered via keyboard** — now fully in sync with Howler mute state.
* 🧼 **Patched rare race condition where `stopQS()` was called after `playQSRandomTrack()`** — now resolved with promise chaining and async order logic.

---

### ⚡ Performance & Stability

* 🧠 **Reduced likelihood of double music starts or ghost tracks** by enforcing stop-before-start on QuickServe tracks.
* 🧃 **Phil’s stage performance now starts exactly once per game loop**, preventing duplicate timeline bugs or animation stack leaks.
* ✅ **QuickServe is now stable across all input methods** — mouse, keyboard, or touchscreen.

---

### 📌 Dev Notes

> "*This update felt like dropping a MIDI controller into a math dimension and watching it light up in sync with reality. Keyboard support wasn’t an afterthought — it’s now a core part of the QuickServe rhythm.*"

---

## v0.5.5 — *“QuickServe Pavilion Complete”* (July 7, 2025)

### 🚀 Major New Features

🍦 **QuickServe Game Mode — Final Form Achieved**

* ✅ **Full gameplay loop complete** — intro screen → timer countdown → math problems → XP tracking → result popup.
* ✅ **All math types supported** — Add/Sub, Mult/Div, and Algebra, with XP and score rewards scaling by mode.
* ✅ **XP system and live score tracking integrated** — synced with appState and visual feedback.
* ✅ **Keypad and keyboard input fully functional** — input is smooth, snappy, and accurate.
* ✅ **Result popup now tracks and displays high scores** — all-time best score stored in `appState.profile.qsHighScore`.
* ✅ **“New High Score!” message appears on record-breaker runs** — bright glow animation included.
* ✅ **Confetti celebration added** for high score runs — throttled for performance, still festival-level hype.

---

### 🌟 UI & UX Enhancements

* 🍣 **Result popup now fades in gracefully** and is perfectly vertically centered using `translate(-50%, -50%)`.
* 🌟 **Score and timer boxes remain square and locked to grid** across all screen sizes.
* 🎹 **Keypad layout tuned for clean responsiveness** — aligned spacing, working decimal, and negation button.
* 🧠 **Correct and incorrect feedback messages float in with color-coded clarity** — timed and hidden automatically.

---

### 🐛 Critical Fixes

* 🧽 Removed **duplicate `toggleNegative()` function** — was causing Vite build crash.
* 🔁 Refactored `showResultScreen()` into modular structure:

  * `buildResultHTML()`, `handlePlayAgain()`, and `handleReturnToMenu()` for cleaner flow.
* 🧼 Scoped button IDs using `popup.querySelector()` to prevent DOM collisions across scenes.

---

### ⚡ Performance & Stability

* 🪄 **Confetti particle count reduced** — now smooth even on older hardware.
* ✅ **Popup alignment locked** — no more visual cropping or off-screen issues.
* 🧣 \*\*QuickServe mode now fully stable and performance-tuned on both desktop and mobile.

## v0.5.0 — *“Neon Jukebox Ascension”* (June 30, 2025)

### 🚀 Major New Features

🎶 **Jukebox Complete — Sacred Final Form**  
- ✅ True **shuffle mode works perfectly** — skips the current track, no repeats until needed.  
- ✅ **Smooth fade between tracks** — works on skip, next, prev, shuffle, and auto-play end.  
- ✅ **Track progress scrubbing enabled** — drag the progress bar to seek anywhere in the track.  
- ✅ **Neon Mode toggle** — glows up the progress bar with full cosmic flair — toggleable at will.  
- ✅ **Track label now displays “Now Playing”** with fully accurate updates on every action.  
- ✅ **Loop toggle, shuffle toggle, and mute toggle fully functional**, persistent, and synced with app state.  
- ✅ **Tracklist dropdown auto-selects the current track** when switching or changing songs.  

---

### 🌟 UI & UX Enhancements

- 🔊 **Scrubbing fixed:** Progress bar no longer locked. Works perfectly for seeking.  
- 🌠 **Neon toggle applies on load** — no more weird desync — UI reflects toggle state immediately.  
- 🚫 **Audio auto-stops when entering any mode except Math Tips Village.**  
- 🎚️ **Track timeline scrubbing is accurate, smooth, and error-free.**  
- 🔥 **Added glowing thumb and animated progress trail when Neon Mode is active.**  

---

### 🐛 Critical Fixes

- 🪲 Fixed bug where **shuffle mode wasn’t actually shuffling.** Now fully random and skips current.  
- 🪲 Fixed **mute toggle not syncing to appState** on load sometimes.  
- 🪲 Fixed **Neon Mode toggle desync** (was checked but visually off on startup — now fixed).  
- 🪲 Fixed **all progress bar errors**, including seek failures, NaN durations, and broken timeline dragging.  

---

### ⚡ Performance & Stability

- 🧠 Added **cleanup hooks** to prevent multiple `requestAnimationFrame()` loops from stacking.  
- 🔥 Howler playback state now **perfectly synced with UI at all times.**  
- 💪 **Jukebox is now rock-solid and fully robust across desktop and mobile.**  

---

### 📌 Dev Notes  
> "*It wasn’t just a bug fix… it was the door to a better reality. The jukebox isn’t just fixed — it’s the best version it ever was. Fade between tracks wasn’t optional… it was destiny.*"  

---

## 🔮 Version Roadmap (2025)  

- ✅ **v0.5.0 – QuickServe Mode Complete (Jukebox Miracle Included)**  
- 🔜 **v0.6.0 – Infinity Mode Complete**  
- 🔜 **v0.7.0 – Math Tips Mode Complete**  
- 🔜 **v0.8.0 – Kids Mode Complete**  
- 🔜 **v0.9.0 – Story Mode + Narratives**  
- 🎯 **v1.0.0 – Final Polish + Launch Ready ✨**  

---


## v0.4.1 — “Stacking Scoops and Spooked Cats” (June 21, 2025)

### 🚨 Major Fixes
- Fixed critical z-index issue where Math Tips mode rendered *beneath* its background image.
- Updated `.game-frame`, `.mt-grid`, and `#modeBackground` hierarchy to enforce proper stacking.
- Backgrounds now consistently use `z-index: 1`, with mode UI layers at `z-index: 2` and `position: relative`.

### 🧠 Math Tips Mode Enhancements
- Created dedicated `.mt-grid` layout, separating it cleanly from `.qs-grid`.
- Scoped all Math Tips CSS to avoid bleed from other modes.
- Implemented scrollable `.chatbox` with height cap and internal layout stability.
- Refactored Pythagoras Cat chat logic with thematic responses and clear visual formatting.

### 🧪 Experimental Discoveries
- Confirmed that `img.src = img.src` helps repaint on mobile but does not fix layer order.
- Discovered shared grid styles between modes can cause fatal visual bugs — all modes now require isolated grid class names.
- General CSS styles can unintentionally override mode-specific layout unless scoped.

### 📌 Dev Notes
> "The cat was behind the curtain, the grid wasn’t real, and the background laughed at your assumptions. But now it works. You earned this one."


## v0.3.0 – Transition System & Startup Screen (June 21, 2025)

### 🌠 New Startup Experience

* Added **startup screen sequence**:
  * Starfield background fades in
  * SnowCone PNG fades in slightly above center
  * Entire screen fades out, revealing main menu
  * Coordinated timing for a smooth, welcoming vibe

### 🌀 Scene Transition System Finalized

* Built full `playTransition()` animation:
  * Truck drives across top → Cone slides across bottom
  * Overlays starfield during transition
  * Delays mode entry until animations complete
* Used consistently across all mode labels and return buttons
* Modes supported: `kids`, `quickServe`, `mathtips`, `story`, `infinity`

### 🎯 Refactors & Bug Fixes

* Switched menu label click handlers to use `playTransition()`
* Corrected "mathTips" to lowercase "mathtips" for sceneManager routing
* Modularized `setupMenu()` logic for cleaner flow
* Fixed info modal bug where clicking title PNG opened the cosmic modal incorrectly
* Ensured `menu-wrapper` visibility state resets on transition completion

### 🎨 Visual Polish

* Re-centered SnowCone PNG vertically in startup screen
* Slight speed-up in transition + startup animations for better pacing
* Verified main menu alignment still stable on desktop
* Info Modal and Cosmic Modal no longer overlap or misfire

### 🚀 Coming Up

* Mobile validation for startup + transitions
* Build out actual content in QuickServe and other modes

---

## v0.2.5 – Dev Log Update (June 15, 2025)

### 🌀 Transition Experiments

* Built `transitionManager.js` to control scene fades
  * Included `fadeIn`, `fadeOut`, and `transitionToHTML` utilities
  * Used `requestAnimationFrame` and class-based transitions
* Attempted smooth fade between menu and game modes
* Encountered persistent issues:
  * Game container fading to blank
  * Background PNG flashing briefly, then disappearing
  * Mode content failing to mount in time for visibility
* After deep debugging, **removed all fades** and reverted to instant transitions
* Plan to revisit transitions later with `GSAP` and cone-split animation

### 🍧 QuickServe Mode Launches

* Built fully self-contained **QuickServe scene**
  * Injected PNG background into `.game-frame`
  * Used `.qs-grid` layout with header, content, footer
  * PNG now vertically centered and matched to grid proportions
* `game-container` now overlays properly with `z-index: 2`
* Grid system matches vertical alignment goals, not stretched horizontally

### ✅ Refactors + Fixes

* Removed broken fade logic from QuickServe
* Simplified background image application per-mode
* Confirmed QuickServe works with manual background PNG injection
* Confirmed `return to menu` fully restores main view

### 🎯 Dev Learnings

* Background PNGs should be **injected per mode** unless there's a solid reason to manage globally
* Scene transitions are better **handled separately** from content injection
* Grid overlay matched to PNG is viable with careful CSS planning
* Sometimes instant swap is better than subtle fade (for now)

### 📦 Folder Thoughts

* `fadeIn` and `fadeOut` likely not needed in current form
* `transitionManager.js` kept for future GSAP-powered transitions
* All assets for QuickServe kept scoped under `/modes/quickServe/`

---

## v0.2.0 – Modal Polish & Return of QuickServe (June 1–14, 2025)

### 🎛️ Modal Enhancements

* Rewired modal tab switching dynamically
* Refactored save + reset logic
* Fixed scroll behavior and responsive issues

### 🍧 QuickServe Returns

* Injected PNG background for QuickServe
* Aligned layout with `.qs-grid`
* Created basic mode switching logic using `sceneManager.js`

---

## v0.1.5 – Main Menu + Cosmic Modal Begins (May 14–16, 2025)

### 🧊 Main Menu Overhaul

* Implemented full-screen background PNG scaling
* Locked in label positions using `CSS Grid`
* Added glowing ethereal label styling

### 🛸 Cosmic Modal V1

* Introduced modal system with tabs: Profile, Music, Themes, Version
* Used `clamp()` + responsive sizing for all modal content
* First use of persistent save settings with CDMS (localStorage wrapper)

---

## v0.1.0 – Project Reboot & Clean Slate (May 12, 2025)

### 🎯 Core Direction Set

* Reset SnowCone MathFest project from scratch
* Switched to **Vite** for blazing-fast builds and modular structure
* Established new folder structure:
  * `/src` for all app logic
  * `/public` for assets
* Decided on vertical-fit backgrounds for all scenes
* CSS Grid selected as the layout anchor for the entire app

---

## 🔮 Version Roadmap (2025)  

- ✅ **v0.5.0 – QuickServe Mode Almost Complete (Jukebox Miracle Included)**  
- 🔜 **v0.6.0 – Infinity Mode Complete**  
- 🔜 **v0.7.0 – Math Tips Mode Complete**  
- 🔜 **v0.8.0 – Kids Mode Complete**  
- 🔜 **v0.9.0 – Story Mode + Narratives**  
- 🎯 **v1.0.0 – Final Polish + Launch Ready ✨**  

---

---
