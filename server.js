'use strict';
const path = require('path');
const express = require('express');
const content = require('./lib/content');
const { LANGS, COOKIE, detectLang, makeHelpers } = require('./lib/i18n');
const { placeholder } = require('./lib/art');

const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', true); // running behind nginx
app.disable('x-powered-by');

app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'SAMEORIGIN',
  });
  next();
});

// ---- static assets -------------------------------------------------------
app.use('/static', express.static(path.join(__dirname, 'public'), { maxAge: isProd ? '7d' : 0 }));

// Only images and videos are public. Documents (Word / install guides / source) are what you sell,
// and project.json is never exposed.
const MEDIA_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.mp4', '.webm']);
app.use('/media', (req, res, next) => (MEDIA_EXT.has(path.extname(req.path).toLowerCase()) ? next() : res.sendStatus(404)),
  express.static(content.ROOT, { maxAge: isProd ? '7d' : 0, index: false, dotfiles: 'ignore' }));

const findSection = (id) => content.get().sections.find((s) => s.id === id);
const findItem = (section, slug) => section && section.items.find((i) => i.slug === slug);

app.get('/gen/:section/:slug/:name.svg', (req, res) => {
  const { section, slug, name } = req.params;
  if (!findItem(findSection(section), slug) || !/^(cover|shot-\d{1,2})$/.test(name)) return res.sendStatus(404);
  res.type('image/svg+xml').set('Cache-Control', 'public, max-age=86400').send(placeholder(`${slug}/${name}`, name, slug));
});

// ---- language entry points ----------------------------------------------
app.get('/', (req, res) => {
  res.set({ 'Cache-Control': 'no-store', Vary: 'Accept-Language, Cookie' });
  res.redirect(302, `/${detectLang(req)}/`);
});

// Manual switch: remember the choice, then go back to the same page in the new language.
app.get('/lang/:lang', (req, res) => {
  const lang = LANGS.includes(req.params.lang) ? req.params.lang : detectLang(req);
  res.cookie(COOKIE, lang, { maxAge: 365 * 24 * 3600 * 1000, sameSite: 'lax', path: '/' });
  const to = String(req.query.to || '');
  const safe = /^\/[^/\\]/.test(to) || to === '/' ? to : `/${lang}/`;
  res.set('Cache-Control', 'no-store').redirect(302, safe);
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nSitemap: ${origin(req)}/sitemap.xml\n`);
});

app.get('/sitemap.xml', (req, res) => {
  const base = origin(req);
  const urls = [];
  for (const lang of LANGS) {
    urls.push(`/${lang}/`);
    for (const s of content.get().sections) {
      urls.push(`/${lang}/${s.id}`);
      for (const i of s.items) urls.push(`/${lang}/${s.id}/${i.slug}`);
    }
  }
  res.type('application/xml').send(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${base}${u}</loc></url>`).join('\n') + '\n</urlset>\n');
});

function origin(req) {
  const { site } = content.get();
  return (site.url || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
}

// ---- pages ---------------------------------------------------------------
const pages = express.Router();

pages.use((req, res, next) => {
  const lang = req.baseUrl.slice(1);
  const { site, sections } = content.get();
  const other = lang === 'zh' ? 'en' : 'zh';
  const swap = (l) => req.originalUrl.replace(/^\/(zh|en)/, `/${l}`);
  Object.assign(res.locals, makeHelpers(lang), {
    lang, other, site, sections,
    origin: origin(req),
    path: req.path,
    switchHref: `/lang/${other}?to=${encodeURIComponent(swap(other))}`,
    altPaths: Object.fromEntries(LANGS.map((l) => [l, swap(l).split('?')[0]])),
    canonical: req.originalUrl.split('?')[0],
    buyUrlFor: (item) => (item && item.buyUrl) || site.buyUrl,
  });
  next();
});

pages.get('/', (req, res) => res.render('home'));

pages.get('/:section', (req, res, next) => {
  const section = findSection(req.params.section);
  if (!section) return next();
  const cats = section.categories || [];
  const cat = cats.find((c) => c.id === req.query.cat);
  const items = cat ? section.items.filter((i) => i.category === cat.id) : section.items;
  const counts = Object.fromEntries(cats.map((c) => [c.id, section.items.filter((i) => i.category === c.id).length]));
  res.render('section', { section, items, cats, activeCat: cat ? cat.id : '', counts });
});

pages.get('/:section/:slug', (req, res, next) => {
  const section = findSection(req.params.section);
  const item = findItem(section, req.params.slug);
  if (!item) return next();
  const related = section.items.filter((i) => i.slug !== item.slug)
    .sort((a, b) => (b.category === item.category) - (a.category === item.category)).slice(0, 3);
  res.render('project', { section, item, related });
});

LANGS.forEach((l) => app.use(`/${l}`, pages));

// ---- errors --------------------------------------------------------------
app.use((req, res) => {
  const m = req.path.match(/^\/(zh|en)\b/);
  const lang = m ? m[1] : detectLang(req);
  const { site, sections } = content.get();
  Object.assign(res.locals, makeHelpers(lang), {
    lang, other: lang === 'zh' ? 'en' : 'zh', site, sections, origin: origin(req), path: '/', canonical: '',
    switchHref: `/lang/${lang === 'zh' ? 'en' : 'zh'}?to=/`, altPaths: { zh: '/zh/', en: '/en/' },
    buyUrlFor: () => site.buyUrl,
  });
  res.status(404).render('error', { code: 404 });
});

app.use((err, req, res, _next) => { // eslint-disable-line no-unused-vars
  console.error(err);
  res.status(500).type('text/plain').send('Internal Server Error');
});

app.listen(PORT, () => console.log(`Showcase running on http://localhost:${PORT} (${isProd ? 'production' : 'development'})`));
