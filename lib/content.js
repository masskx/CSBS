'use strict';
// Loads site config, sections and projects from /content (plain JSON + files).
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'content');
const TTL = process.env.NODE_ENV === 'production' ? 30 * 1000 : 0;

let cache = null;
let loadedAt = 0;

const readJSON = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const isDir = (p) => { try { return fs.statSync(p).isDirectory(); } catch { return false; } };
const exists = (p) => { try { return fs.statSync(p).isFile(); } catch { return false; } };

function loadItem(section, slug) {
  const dir = path.join(ROOT, section.id, slug);
  const file = path.join(dir, 'project.json');
  if (!exists(file)) return null;
  const item = readJSON(file);
  if (item.draft) return null;
  item.slug = slug;
  item.section = section.id;
  item.order = Number.isFinite(item.order) ? item.order : 100;

  // Use the real file when it exists, otherwise a generated placeholder.
  const media = (name, fallbackName) =>
    name && exists(path.join(dir, name))
      ? `/media/${section.id}/${slug}/${encodeURIComponent(name)}`
      : `/gen/${section.id}/${slug}/${fallbackName}.svg`;

  item.coverUrl = media(item.cover, 'cover');
  item.shots = (item.screenshots || []).map((name, i) => media(name, `shot-${i + 1}`));

  const v = item.video || null;
  if (v && v.file) {
    item.videoInfo = exists(path.join(dir, v.file))
      ? { type: 'file', src: `/media/${section.id}/${slug}/${encodeURIComponent(v.file)}` }
      : null;
  } else if (v && v.embed) {
    item.videoInfo = { type: 'embed', src: v.embed };
  } else {
    item.videoInfo = null;
  }
  return item;
}

function load() {
  const site = readJSON(path.join(ROOT, 'site.json'));
  const sections = readJSON(path.join(ROOT, 'sections.json')).sections;
  for (const section of sections) {
    const dir = path.join(ROOT, section.id);
    const items = [];
    if (isDir(dir)) {
      for (const slug of fs.readdirSync(dir)) {
        if (slug.startsWith('_') || slug.startsWith('.') || !isDir(path.join(dir, slug))) continue;
        try {
          const item = loadItem(section, slug);
          if (item) items.push(item);
        } catch (err) {
          console.error(`[content] skipped ${section.id}/${slug}: ${err.message}`);
        }
      }
    }
    items.sort((a, b) => a.order - b.order || (b.year || 0) - (a.year || 0) || a.slug.localeCompare(b.slug));
    section.items = items;
  }
  return { site, sections };
}

function get() {
  if (!cache || Date.now() - loadedAt > TTL) {
    try {
      cache = load();
      loadedAt = Date.now();
    } catch (err) {
      if (!cache) throw err;
      console.error('[content] reload failed, serving previous copy:', err.message);
    }
  }
  return cache;
}

module.exports = { get, ROOT };
