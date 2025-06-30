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
