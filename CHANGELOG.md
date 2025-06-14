# 📦 SnowCone MathFest – Changelog

---

## v0.1.9 – “Cosmic Modal” Release (June 10, 2025)

### 🌌 Modal Overhaul
- Introduced **Cosmic Modal System** with animated tabbed interface
- Fully working tabs:
  - 🧑‍🚀 **Profile** – Name input, XP bar, and earned badge grid  
  - 🎨 **Themes** – Choose unlocked background themes visually  
  - 🎧 **Music** – Mute toggle + custom track selector  
  - 🧠 **Version** – View build, changelog, and manage local save
- Modal scrolls cleanly on both mobile and desktop
- Modal respects saved settings and updates reactively

### 🎨 UI & Layout
- Cosmic modal window uses consistent aspect-ratio and font scaling
- Responsive grid sizing for theme tiles with larger previews
- Tab buttons highlight and animate between views
- Close button re-binds on each tab load to prevent bugs
- Font scaling adapts to screen size for better mobile support

### 🎶 Sound & Tracks
- Track buttons wired to play and loop selected music
- Audio respects mute toggle and updates volume live
- First track added: `Infinity Addition ♾️` for menu mode chill

### 🧠 Version Tab Features
- Export current save data as `.json`
- Reset and wipe progress with confirmation prompt
- Build string shown via `window.devFlags.build`
- Inline changelog for in-app progress notes

### 💾 Data Management
- `cdms.js` now drives state for all modal tabs
- LocalStorage data is persistent across reloads

---

## v0.1.0 – “Grid Lock” Release (June 9, 2025)

### 🧠 Core Systems
- CDMS (Central Data Management System) initialized:
  - Save/load: theme, mute, XP, badges, profile, and story flags
- Background Manager pulls theme on load
- Title click opens Info Modal (separate from tab modal)

### 🎨 UI & Layout
- Background PNGs stretch across screens without crop
- Labels pinned with CSS Grid on both mobile and desktop
- Starfield background fills behind letterbox borders
- Label colors adapt per background theme
- Info modal scrolls with hidden scrollbar

### 🎛️ Dev Console Tools
- `swapBackground('themeName')` swaps backgrounds
- `getData()` logs all local progress
- `setSetting('theme', 'fall')` persists a new theme
- `window.devFlags.build` exposes current build label

---

## Coming Soon
- XP + badge system integrated into game logic
- In-game background switching (Quick Serve/Story)
- Transition screen polish
- Story Mode intro chapter
- Real math content... at last 💀📊🧮

