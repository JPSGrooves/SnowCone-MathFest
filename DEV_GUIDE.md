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

jeremy@Jeremys-MacBook-Pro-2 SnowCone-MathFest % 


AI TESTER!!!!


> snowcone-mathfest@0.1.0 test:mt
> NODE_ENV=test node --import ./scripts/dom-shim.mjs ./scripts/mt_golden_test.mjs

❌ what's your name 
   got: meowth is right.<br>triangle whisperer. snowcone sage. your study cat.<br>want a quick % rep? 
   exp: Grampy P 

❌ .345345 * 1/7 
   got: 345345 * 1/7 = <strong>49335</strong> 
   exp: 0.0493349 

❌ 1/2 / 1/2 
   got: 1/2 / 1/2 = <strong>0.25</strong> 
   exp:  = 1 

✅ 7 passed, ❌ 3 failed, total 10
jeremy@Jeremys-MacBook-Pro-2 SnowCone-MathFest % 

```bash
npm run test:mt
```


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

```bash
git add -A
git commit -m "🌈 Locking in current dev state" --no-verify
git push origin main --no-verify
```

Re-run:
```bash
npm run build:native
npx cap copy ios
npx cap sync ios
```
1. Lock in the native build pipeline

From now on, whenever you change the game code and want it in Xcode, you’ll use two builds:

Web / GitHub Pages build (what you already do):
```bash
npm run build        # uses --mode web  (base = /SnowCone-MathFest/)
npm run live         # if you’re deploying to gh-pages
```
```bash
npm run build 
npm run live
```

iOS / Capacitor build:
```bash
npm run build:native   # vite build --mode ios   (base = '/')
npx cap copy ios       # copy fresh dist into ios/App/App/public
```
```bash
npm run build:native 
npx cap copy ios
```




I guess we are in dev repo now...
```bash
cd /Users/jeremy/dev/SnowCone-MathFest
npm run build:native
npx cap open ios
```





🔁 Fresh iOS sync without guessing

In your project root:

# 1) Build fresh web bundle
npm run build

# 2) Push updated assets into ios/App/public
npx cap copy ios
# or
npx cap sync ios


Then in Xcode:

Product → Clean Build Folder…

Rebuild & run on device, not just simulator (haptics won’t feel on sim).

If after that you still see the 📖 [Story] iOS test build – v2025-12-10-01 log, we’re definitely on the right bundle.



# (optional) npx cap open ios   # if Xcode isn’t already open

You can go back to main and:

delete mathTips golden test

fix ant game lifecycle

tweak story

push to GitHub

deploy to gh-pages
➜ Nothing about iOS breaks.

When you want to refresh the iOS build:

Merge those changes into store-wrap-ios (later).



Then Build/Run in Xcode again.

So yeah: keep treating the web version like normal. Capacitor is just a sidecar. It doesn’t poison your gh-pages setup.










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
