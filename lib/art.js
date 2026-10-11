'use strict';
// Generates colourful SVG placeholders so the site looks complete before real images exist.

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function placeholder(seed, name, label) {
  const h = hash(seed);
  const h1 = h % 360;
  const h2 = (h1 + 40 + (h >> 8) % 60) % 360;
  const isShot = name.startsWith('shot-');
  const w = 800, h_ = 600;
  const text = esc(label.replace(/-/g, ' ').toUpperCase().slice(0, 28));
  const blobs = [0, 1, 2].map((i) => {
    const r = 90 + ((h >> (i * 5)) % 120);
    const cx = (h >> (i * 7)) % w;
    const cy = (h >> (i * 3 + 2)) % h_;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" opacity=".10"/>`;
  }).join('');
  const frame = isShot
    ? `<g transform="translate(110 110)">
         <rect width="580" height="380" rx="14" fill="#fff" opacity=".94"/>
         <rect width="580" height="38" rx="14" fill="#000" opacity=".07"/>
         <circle cx="22" cy="19" r="5" fill="#ff5f57"/><circle cx="40" cy="19" r="5" fill="#febc2e"/><circle cx="58" cy="19" r="5" fill="#28c840"/>
         <rect x="28" y="62" width="150" height="14" rx="7" fill="hsl(${h1} 70% 55%)"/>
         <rect x="28" y="92" width="300" height="10" rx="5" fill="#000" opacity=".12"/>
         <rect x="28" y="112" width="240" height="10" rx="5" fill="#000" opacity=".12"/>
         <rect x="28" y="150" width="160" height="100" rx="10" fill="hsl(${h1} 80% 90%)"/>
         <rect x="208" y="150" width="160" height="100" rx="10" fill="hsl(${h2} 80% 90%)"/>
         <rect x="388" y="150" width="160" height="100" rx="10" fill="hsl(${h1} 60% 92%)"/>
         <rect x="28" y="274" width="520" height="12" rx="6" fill="#000" opacity=".10"/>
         <rect x="28" y="298" width="420" height="12" rx="6" fill="#000" opacity=".10"/>
         <rect x="28" y="322" width="340" height="12" rx="6" fill="#000" opacity=".10"/>
       </g>`
    : `<g fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" opacity=".9">
         <path d="M330 270 L270 330 L330 390"/><path d="M470 270 L530 330 L470 390"/><path d="M425 250 L375 410"/>
       </g>
       <text x="400" y="500" text-anchor="middle" font-family="system-ui,sans-serif" font-size="30" font-weight="700" fill="#fff" opacity=".92" letter-spacing="3">${text}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h_}" role="img" aria-label="${text}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="hsl(${h1} 75% 52%)"/><stop offset="1" stop-color="hsl(${h2} 75% 42%)"/>
  </linearGradient></defs>
  <rect width="${w}" height="${h_}" fill="url(#g)"/>${blobs}${frame}
</svg>`;
}

module.exports = { placeholder };
