# 📦 SnowCone MathFest – Changelog

---

## v0.1 – Menu & Core Systems Locked (May 2025)

### 🧠 Infrastructure
- Implemented Central Data Management System (CDMS)
  - Stores XP, badges, scores, story progress, settings, music favorites
  - Handles unlocks and profile logic
- Scene Manager added to control screen transitions and mode entry
  - Clean switching between Quick Serve, Story Mode, Infinity, Tutorial

### 🎨 UI & Layout
- Menu now fully CSS Grid–based and anchored to real background PNG
- Responsive layout with min/max size limits for mobile scaling
- Title glow animation and emoji-labeled buttons for all five zones

### 💾 Storage
- localStorage-based persistence for all user data
- Global functions exposed for testing in console

### 🔧 Dev Tools
- Added `devFlags.build = "v0.1"` to track internal version
- Helper: `setBuildVersion("vX.Y")` function for updates

---

Next Target: v0.2 – Transition
