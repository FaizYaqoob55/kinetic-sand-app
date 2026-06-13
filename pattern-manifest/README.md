# Pattern manifest for patterns-zanvora-sand

## 1. Clone patterns repo (pehli dafa)

```bash
npm run patterns:clone
```

Ye `patterns-zanvora-sand/` folder banayega (782 .thr + 782 .svg).

## 2. Manifest generate karo

```bash
npm run patterns:manifest
```

Output:
- `pattern-manifest/manifest.json` (app backup)
- `patterns-zanvora-sand/manifest.json` (GitHub push ke liye)

## 3. GitHub par push

```bash
cd patterns-zanvora-sand
git add manifest.json
git commit -m "Update pattern manifest"
git push
```

## 4. Naye patterns add karne par

```bash
cd patterns-zanvora-sand
git pull
# naye files patterns/ aur previews/ mein add karo
cd ..
npm run patterns:manifest
cd patterns-zanvora-sand && git add . && git commit -m "Add patterns" && git push
```

## Repo layout

```
patterns-zanvora-sand/          ← alag repo (cloned locally)
├── manifest.json
├── patterns/*.thr
└── previews/*.svg
```

`patterns-zanvora-sand/` app git mein track nahi hota (.gitignore) — alag repo hai.

