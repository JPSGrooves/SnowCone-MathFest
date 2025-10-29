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
* 🎯 **v1.2.0 – Chapter 2 in Story Mode✨**

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
