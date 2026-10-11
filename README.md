# GradLab – 毕业设计展示 & 售卖站 / Graduation Project Showcase

Bilingual (中文 / English), mobile-friendly showcase + storefront. Node.js + Express + EJS, **no database, no build step**.
Content is plain files in `content/`. The sales link is shown on every page.

## Run

```bash
npm install
npm run dev          # http://localhost:3000  (content reloads on every request)
npm start            # production mode        (content cache refreshes every 30 s)
```
Env vars: `PORT` (default 3000), `DEFAULT_LANG` (`zh` or `en`, default `zh`).

## Customise the site
Edit `content/site.json`: site name, hero text, **`buyUrl`** (your sales link), WeChat/email, ICP number (备案号), public `url` (used for sitemap / SEO).

## Add a graduation project
Copy a folder in `content/projects/` (e.g. `campus-secondhand-market`), rename it (the folder name becomes the URL), then edit `project.json`.
Put real files **in the same folder**:

| file | purpose |
|---|---|
| `cover.jpg` + `"cover": "cover.jpg"` | tile image on the homepage (4:3 recommended) |
| `shot-1.png` … listed in `"screenshots"` | detail-page gallery |
| `demo.mp4` + `"video": {"file": "demo.mp4"}` | video tutorial (or `"video": {"embed": "https://player.bilibili.com/player.html?bvid=..."}`) |

Missing images fall back to generated placeholders. Folders starting with `_` or `"draft": true` are hidden. Per-project `"buyUrl"` overrides the global link.
All text fields are `{ "zh": "...", "en": "..." }`.

**Only images/videos are served publicly** (`/media`). Word / install docs / source code are listed as "what's included" but are *not* downloadable from the site – deliver them via your shop after payment. Don't put paid files in `content/` anyway.

**No prices are shown anywhere on the site** (by design): visitors see what's included and a "Get this project" button that goes to your shop, where the price is shown.

## Add a new section (research, modeling, …)
`content/sections.json` already defines `research` and `modeling` (shown as "Coming soon"). To fill one, create `content/research/<project>/project.json` – it appears automatically. Add more sections by adding an entry to `sections.json`.

## Languages
URLs are `/zh/...` and `/en/...`. Visiting `/` picks the language by: saved choice (cookie, set by the switcher) → browser `Accept-Language` → country header (`CF-IPCountry` / `X-Country-Code`, if your CDN/nginx supplies one; CN/HK/MO/TW → Chinese) → `DEFAULT_LANG`.
UI strings: `locales/zh.json`, `locales/en.json`.

## Deploy sketch (your server)
```bash
npm ci --omit=dev && pm2 start server.js --name gradlab --env production   # or: docker build -t gradlab . && docker run -d -p 3000:3000 gradlab
```
nginx: `proxy_pass http://127.0.0.1:3000;` with `proxy_set_header Host $host; proxy_set_header X-Forwarded-Proto $scheme;`, enable gzip, and add HTTPS (certbot). For servers in mainland China, the ICP filing is required; the site uses no external fonts/CDNs.
