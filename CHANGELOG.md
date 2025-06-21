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

### 🔮 Version Roadmap

- **v0.4.0** – QuickServe Mode Complete
- **v0.5.0** – Infinity Mode Complete
- **v0.6.0** – Math Tips Mode Complete
- **v0.7.0** – Kids Mode Complete
- **v0.8.0** – Story Mode + Narratives
- **v0.9.0** – XP, Badges, Themes, Popups
- **v1.0.0** – Final Polish + Launch Ready ✨

---

v0.3.0 marks a major **UX milestone**. The game now *feels* like it starts. It's finally fun to click around 🔥
