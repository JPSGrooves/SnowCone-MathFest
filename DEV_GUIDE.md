# 🍧 SnowCone MathFest – Developer Ritual Guide

rm -rf node_modules .vite dist
npm install
if shit is fucking up??


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
