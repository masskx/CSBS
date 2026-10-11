'use strict';
const fs = require('fs');
const path = require('path');

const LANGS = ['zh', 'en'];
const DEFAULT_LANG = process.env.DEFAULT_LANG && LANGS.includes(process.env.DEFAULT_LANG) ? process.env.DEFAULT_LANG : 'zh';
const COOKIE = 'lang';

const dict = {};
for (const l of LANGS) dict[l] = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'locales', `${l}.json`), 'utf8'));

// Countries whose visitors default to Chinese when the browser sends no usable language.
const ZH_COUNTRIES = new Set(['CN', 'HK', 'MO', 'TW']);

function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function fromAcceptLanguage(header = '') {
  const items = header.split(',').map((s) => {
    const [tag, ...params] = s.trim().split(';');
    const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
    return { tag: tag.toLowerCase(), q: q ? parseFloat(q.slice(2)) : 1 };
  }).filter((x) => x.tag && x.tag !== '*' && x.q > 0).sort((a, b) => b.q - a.q);
  for (const { tag } of items) {
    if (tag === 'zh' || tag.startsWith('zh-')) return 'zh';
    if (tag === 'en' || tag.startsWith('en-')) return 'en';
  }
  return null;
}

// Country comes from a header set by nginx / a CDN (Cloudflare, etc.). Optional.
function fromCountry(req) {
  const c = (req.get('cf-ipcountry') || req.get('x-country-code') || req.get('x-vercel-ip-country') || '').toUpperCase();
  if (!c || c === 'XX' || c === 'T1') return null;
  return ZH_COUNTRIES.has(c) ? 'zh' : 'en';
}

// Priority: saved choice > browser language > IP country header > default.
function detectLang(req) {
  const saved = parseCookies(req.headers.cookie)[COOKIE];
  if (LANGS.includes(saved)) return saved;
  return fromAcceptLanguage(req.get('accept-language')) || fromCountry(req) || DEFAULT_LANG;
}

function makeHelpers(lang) {
  const t = (key, vars) => {
    let s = dict[lang][key] ?? dict.en[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
    return s;
  };
  // Pick the current language out of {zh, en}; falls back to the other one.
  const L = (v) => {
    if (v == null) return '';
    if (typeof v !== 'object' || Array.isArray(v)) return v;
    return v[lang] ?? v.en ?? v.zh ?? '';
  };
  return { t, L };
}

module.exports = { LANGS, COOKIE, detectLang, makeHelpers };
