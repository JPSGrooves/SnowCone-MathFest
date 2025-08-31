# 🍧 SnowCone MathFest – Developer Ritual Guide

---

## ⚡️ WHEN SHIT IS FUCKING UP (REAL BAD):

```bash
sudo chown -R $(whoami) ~/.npm
npm cache clean --force

rm -rf node_modules package-lock.json dist .vite
npm install
```

---

## ⚠️ WHEN SHIT IS JUST KIND OF FUCKED:

```bash
rm -rf node_modules .vite dist
npm install
```

> 🚤 Sometimes you just gotta wait and be patient!

---

## ✨ 1. Start Local Dev Server

```bash
cd ~/Documents/SnowCone-MathFest
npm run dev
```

Open: [http://localhost:5173](http://localhost:5173)

---

## 🛠️ 2. Edit Your Code

Modify core files like:

* `index.html`
* `src/`
* `vite.config.js`
* `main.js`
* `versionTab.js`

---


// Theme swap
appState.setTheme('summer'); appState.profile.badges.includes('theme_swap');

// Music
scTest.playJukebox(); appState.profile.badges.includes('listened_music');

// Mode tour (touch all)
scTest.award('quick_25');
scTest.award('inf_25_1min');
scTest.award('kids_mosquito');
appState.addStoryXP(5);
scTest.award('talk_grampy');
appState.profile.badges.includes('mode_tour');

// Completion breakdown (watch buckets fill + total%)
scTest.breakdown();


## 🌐 3. Deploy to GitHub Pages

```bash
npm run build
npx gh-pages -d dist --branch=gh-pages --message="🍧 Live deploy"
```

Live at: [https://JPSGrooves.github.io/SnowCone-MathFest/](https://JPSGrooves.github.io/SnowCone-MathFest/)

---

## 🔐 4. Push to GitHub Main Branch

```bash
git add -A
git commit -m "🌈 Locking in current dev state"
git push origin main
```
feat: transition system + startup screen + mode launch polish
---

## 🚨 GIT TROUBLESHOOTING

### 📏 First: Confirm You're in the Right Repo

```bash
git remote -v
```

You should see:

```
origin  https://github.com/JPSGrooves/SnowCone-MathFest.git (fetch)
origin  https://github.com/JPSGrooves/SnowCone-MathFest.git (push)
```

---

### 🧠 Second: Double-check Latest Commit

```bash
git log --oneline
```

If your latest commit isn’t there, re-commit:

```bash
git add -A
git commit -m "🌈 Locking in current dev state"
```

---

### 🚀 Third: Force Push (ONLY IF YOU'RE SURE)

```bash
git push origin main --force
```

---

## 💣 Reset Tracked Files + .gitignore Respect

```bash
git rm -r --cached .
git add .
git commit -m "🧼 Refresh tracked files to respect .gitignore"
git push
```

Check what’s being ignored:

```bash
git check-ignore -v .
```

---

## 🌱 First Time Commit & Push Ritual

```bash
git add -A
git commit -m "🌈 First commit – Locking in dev state"
git push -u origin main
```

---

## 🔒 .gitignore Template

```bash
/node_modules
/dist
.env
.DS_Store
.husky/_/
```

---

## 🌬️ Bonus: Quick Deploy Script

**deploy-live.sh**

```bash
#!/bin/bash
echo "🍧 Building SnowCone..."
npm run build

echo "🚀 Deploying to GitHub Pages..."
npx gh-pages -d dist --branch=gh-pages --message="🍧 Live deploy $(date)"

echo "✅ Done! Your cone is now LIVE!"
```

Make it executable:

```bash
chmod +x deploy-live.sh
./deploy-live.sh
```

---

## 🧠 Dev Versioning Reminders

* [ ] Update `devFlags.build` in `main.js` or `dataManager.js`
* [ ] Update text & HTML in `versionTab.js`
* [ ] Add section to `CHANGELOG.md`
* [ ] Push with matching version in commit msg

---

## 🔧 ESLint Setup: `.eslintrc.json`

```json
{
  "env": {
    "browser": true,
    "es2021": true
  },
  "extends": ["eslint:recommended", "prettier"],
  "plugins": ["import"],
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "rules": {
    "no-unused-vars": "warn",
    "import/no-unresolved": "warn",
    "import/named": "warn"
  }
}
```

---

## 📃 Prettier Setup: `.prettierrc.cjs`

```js
module.exports = {
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindConfig: "./tailwind.config.js",
  semi: true,
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
  trailingComma: "none"
};
```

---

## 🌀 Auto Format on Save (VS Code)

`.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

---

## 🛡️ Optional: Husky + lint-staged

**In `package.json`:**

```json
"lint-staged": {
  "*.{js,jsx,ts,tsx,html,css}": [
    "prettier --write",
    "eslint --fix"
  ]
}
```

**Install + Hook:**

```bash
npm install -D lint-staged husky
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

---

🍧 **CONE RITUAL COMPLETE**
Code. Commit. Deploy. Chill.
🌈 All glory to the Cone.
