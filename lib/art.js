'use strict';
// Flat, poster-like SVG placeholders used until a project has real images.

const PALETTES = [
  ['#d9441f', '#f4f0e8', '#171614'],
  ['#1f3a5f', '#f0c987', '#f4f0e8'],
  ['#2f5d50', '#efe3c8', '#d9441f'],
  ['#171614', '#d9441f', '#e9e2d3'],
  ['#e9b44c', '#171614', '#f4f0e8'],
  ['#8aa399', '#171614', '#f4f0e8'],
];

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 15; h = Math.imul(h, 2246822519); h ^= h >>> 13; h = Math.imul(h, 3266489917); h ^= h >>> 16;
  return h >>> 0;
}

const motifs = [
  (a, b) => `<circle cx="640" cy="640" r="300" fill="${a}"/><rect x="180" y="200" width="200" height="600" fill="${b}"/>`,
  (a, b) => `<rect x="160" y="260" width="620" height="70" fill="${a}"/><rect x="160" y="390" width="440" height="70" fill="${a}"/><rect x="160" y="520" width="540" height="70" fill="${a}"/><circle cx="760" cy="720" r="90" fill="${b}"/>`,
  (a, b) => `<path d="M200 200h300a300 300 0 0 1-300 300z" fill="${a}"/><path d="M800 800H500a300 300 0 0 1 300-300z" fill="${b}"/><circle cx="650" cy="350" r="150" fill="${a}"/>`,
  (a, b) => `<circle cx="500" cy="500" r="330" fill="${a}"/><circle cx="500" cy="500" r="210" fill="${b}"/><circle cx="500" cy="500" r="90" fill="${a}"/>`,
];

function placeholder(seed, name) {
  const h = hash(seed.split('/')[0]); // same palette & motif across a project's images
  const [bg, a, b] = PALETTES[(h >>> 3) % PALETTES.length];
  const open = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">`;
  if (name.startsWith('shot-')) {
    const n = parseInt(name.slice(5), 10) || 1;
    const bars = [0, 1, 2].map((i) => `<rect x="170" y="${470 + i * 54}" width="${520 - ((h >> i) % 4) * 90}" height="18" fill="${bg}" opacity=".22"/>`).join('');
    return `${open}<rect width="1000" height="1000" fill="${bg}"/>
<rect x="130" y="200" width="740" height="600" fill="#f4f0e8"/><rect x="130" y="200" width="740" height="46" fill="#171614" opacity=".9"/>
<rect x="170" y="290" width="${180 + n * 40}" height="130" fill="${a}"/><rect x="${400 + n * 40}" y="290" width="${290 - n * 40}" height="130" fill="${b}"/>
${bars}</svg>`;
  }
  return `${open}<rect width="1000" height="1000" fill="${bg}"/>${motifs[(h >>> 11) % motifs.length](a, b)}</svg>`;
}

module.exports = { placeholder };
