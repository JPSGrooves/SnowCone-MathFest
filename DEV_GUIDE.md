# 🍧 SnowCone MathFest – Developer Ritual Guide
if shit is fucking up??
(Real bad)
sudo chown -R $(whoami) ~/.npm
npm cache clean --force

then...
rm -rf node_modules package-lock.json dist .vite
npm install


standard fucking up..
rm -rf node_modules .vite dist
npm install

Sometimes you just gotta wait and be patient!

## ✨ 1. Start Local Dev Server

```bash
cd ~/Documents/SnowCone-MathFest
npm run dev
```

Open: [http://localhost:5173](http://localhost:5173)

---

## 🛠️ 2. Edit Your Code

Modify:

* `index.html`
* `src/`
* `vite.config.js`
* etc...

Test changes in browser + dev console.

---

## 🌐 3. Deploy to GitHub Pages

```bash
npm run build
npx gh-pages -d dist --branch=gh-pages --message="🍧 Live deploy"
```

Live at:
[https://JPSGrooves.github.io/SnowCone-MathFest/](https://JPSGrooves.github.io/SnowCone-MathFest/)

---

## 🔐 4. Push to GitHub Main Branch

```bash
git add -A
git commit -m "🌈 Locking in current dev state"
git push origin main
```

---
trouble?
💿 First: Confirm you’re in the correct repo folder
Just to be sure, run:

git remote -v
☑️ You should see something like:

origin  https://github.com/JPSGrooves/SnowCone-MathFest.git (fetch)
origin  https://github.com/JPSGrooves/SnowCone-MathFest.git (push)
If not: You’re in the wrong directory or your repo isn't connected.

🧠 Second: Double-check latest commit
Since git log -1 didn’t show anything (weird)... try this:

git log --oneline
☑️ You should see a list of recent commits like:

abcd123 🌈 Locking in current dev state
efgh456 another commit
If your "🌈 Locking in current dev state" commit is not there, then the commit actually never happened — maybe Husky blocked it earlier and you thought it passed.

🚀 Third: Force the push manually
Assuming you do see your commit locally and just need to shove it up to GitHub like a snow cone through a flavor tube:

git push origin main --force
(⚠️ Only do --force if you're 100% sure your local main is the latest and you want it to overwrite what's on GitHub. Sounds like it is.)



💣 Step 1: Clear the tracked cache
git rm -r --cached .
This unstages everything without deleting your files — it just tells Git, “let’s re-look at everything based on the current .gitignore.”
💾 Step 2: Add everything back, this time respecting .gitignore
git add .
💬 Step 3: Commit the clean slate
git commit -m "🧼 Refresh tracked files to respect .gitignore"
🌍 Step 4: Push to the cloud
git push
💡 BONUS: Check what Git’s ignoring

git check-ignore -v .
That’ll show you which files Git is currently ignoring and why — super handy if you're debugging.



🌱 Step-by-Step: First Commit & Push

✅ 1. Stage everything
git add -A
🧠 2. Make your first real commit
git commit -m "🌈 First commit – Locking in dev state"
You should see output like:

[main (root-commit) abcd123] 🌈 First commit – Locking in dev state
 N files changed...
This creates your very first commit — now git log will actually work.

🚀 3. Push it up to GitHub
git push -u origin main
The -u sets the default upstream so future git push and git pull work cleanly.
Now you should see it show up immediately on your GitHub repo.
🧪 Optional sanity check
git status
Should return:

On branch main
nothing to commit, working tree clean
And now:

git log --oneline
Should finally show your first commit:

abcd123 🌈 First commit – Locking in dev state


OOOORRRRRRR

rm -f .git/index.lock




## 🚹 .gitignore Template

```bash
/node_modules
/dist
.env
.DS_Store
.husky/_/
```

Create `.gitignore`, add contents above, then:

```bash
git add .gitignore
git commit -m "🔒 Add .gitignore"
git push
```

---

## 🌬️ Bonus: Quick Deploy Script

### Create `deploy-live.sh`

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
```

Then run anytime:

```bash
./deploy-live.sh
```

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

## 🔄 Auto Format on Save (VS Code)

Create or update `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

---

## 🔮 Optional: Husky + lint-staged

Add to `package.json`:

```json
"lint-staged": {
  "*.{js,jsx,ts,tsx,html,css}": [
    "prettier --write",
    "eslint --fix"
  ]
}
```

Install it:

```bash
npm install -D lint-staged husky
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

---

🍧 CONE RITUAL COMPLETE. Code. Commit. Deploy. Repeat.
All glory to the Cone 🌈
