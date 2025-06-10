# 📦 SnowCone MathFest – Changelog

---

## v0.1.0 – “Grid Lock” Release (June 9, 2025)

### 🧠 Core Systems
- CDMS (Central Data Management System) initialized:
  - Local save with theme, mute, XP, badges, profile name, and story progress
- Background Manager loads theme from saved data
- Title click opens independent Info Modal (non-shared UI)

### 🎨 UI & Layout
- Background PNGs fully integrated and stretch safely across devices
- Labels lock in place via CSS Grid with consistent mobile/desktop alignment
- Starfield fills screen when aspect-ratio causes black bars
- Menu labels support dynamic color per background theme
- Modal now scrolls and hides scroll bar for smooth feel

### 🎛️ Console Dev Tools
- `swapBackground("themeName")` to preview background changes
- `getData()` to inspect save data
- `setSetting('theme', 'fall')` to persist theme
- `window.devFlags.build` now reports active build version

---

## Coming Soon
- Options menu that allows background switching in-app
- Profile system polish + name entry
- XP system and badge unlocking
- Scene transitions and game mode logic
- Actual math...

---
