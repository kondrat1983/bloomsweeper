// Generates three original ink-garden drawings (style directions A, B, C) as standalone SVG assets.
import { writeFileSync } from 'node:fs';
const OUT = process.argv[2];
const W = 600, H = 920, INK = '#1f1d1a', PAPER = '#fffaf0';
const f = (n) => (Math.round(n * 10) / 10).toString();

function rng(seed) { return () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function smooth(pts) {
  const n = pts.length, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m = mid(pts[n - 1], pts[0]); let d = `M${f(m[0])} ${f(m[1])}`;
  for (let i = 0; i < n; i++) { const p = pts[i], q = mid(pts[i], pts[(i + 1) % n]); d += `Q${f(p[0])} ${f(p[1])} ${f(q[0])} ${f(q[1])}`; }
  return d + 'Z';
}
function openSmooth(pts) {
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) { const q = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2]; d += `Q${f(pts[i][0])} ${f(pts[i][1])} ${f(q[0])} ${f(q[1])}`; }
  const l = pts[pts.length - 1]; return d + `L${f(l[0])} ${f(l[1])}`;
}

function build(cfg) {
  const R = rng(cfg.seed), rand = (a, b) => a + R() * (b - a);
  const items = [];
  const fits = (x, y, r) => { if (x - r < 4 || y - r < 4 || x + r > W - 4 || y + r > H - 4) return false; for (const it of items) if (Math.hypot(it.x - x, it.y - y) < it.r + r + cfg.gap) return false; return true; };
  items.push({ kind: 'flower', type: cfg.focal, x: 300, y: 450, r: cfg.focalR, rot: 0.2 });
  for (const [lo, hi] of cfg.passes) for (let a = 0; a < 3000; a++) {
    const r = rand(lo, hi), x = rand(0, W), y = rand(0, H); if (!fits(x, y, r)) continue;
    if (R() < cfg.leafShare) items.push({ kind: 'leaf', type: R() < 0.65 ? 'lens' : (R() < 0.5 ? 'oak' : 'heart'), x, y, r, rot: rand(0, Math.PI), w: rand(0.4, 0.52) });
    else items.push({ kind: 'flower', type: cfg.flowers[Math.floor(R() * cfg.flowers.length)], x, y, r, rot: rand(0, 6.28) });
  }
  const wob = (v, i, k) => v * (1 + cfg.wobble * (Math.sin(i * 1.7 + k) * 0.6 + Math.sin(i * 0.53 + k * 3) * 0.4));
  function radius(it, t) {
    const c = (k, p) => Math.pow(Math.abs(Math.cos(k * (t + it.rot))), p);
    switch (it.type) {
      case 'five': return it.r * (0.56 + 0.44 * c(2.5, 0.7));
      case 'daisy': return it.r * (0.74 + 0.26 * c(6, 0.5));
      case 'star': return it.r * (0.52 + 0.48 * c(2.5, 1.6));
      case 'bell': return it.r * (0.7 + 0.3 * c(1.5, 1.2));
      case 'ruffle': return it.r * (0.82 + 0.1 * c(4, 0.8) + 0.08 * c(12, 1));
      default: return it.r * (0.86 + 0.14 * c(4, 0.8));
    }
  }
  const flowerPts = (it, s = 1) => { const N = 110, pts = []; for (let i = 0; i < N; i++) { const t = (i / N) * 6.2832, r = wob(radius(it, t) * s, i, it.x); pts.push([it.x + r * Math.cos(t), it.y + r * Math.sin(t)]); } return pts; };
  const tf = (it, p) => { const c = Math.cos(it.rot), s = Math.sin(it.rot); return [it.x + p[0] * c - p[1] * s, it.y + p[0] * s + p[1] * c]; };
  function leafPts(it) {
    const L = it.r * 0.98, w = it.r * it.w, N = 32, top = [], bot = [];
    for (let i = 0; i <= N; i++) { const t = (i / N) * Math.PI; let hw = w * Math.pow(Math.sin(t), 0.85);
      if (it.type === 'oak') hw *= 0.78 + 0.22 * Math.abs(Math.sin(t * 6));
      if (it.type === 'heart') hw *= 0.7 + 0.45 * Math.sin(t * 0.5 + 0.6) * (i < N / 2 ? 1.15 : 0.9);
      const x = -L + (2 * L * i) / N; top.push([x, -wob(hw, i, it.y)]); bot.push([x, wob(hw, i + 9, it.y)]); }
    return top.concat(bot.slice(1, -1).reverse()).map((p) => tf(it, p));
  }
  const cellPath = (it) => smooth(it.kind === 'leaf' ? leafPts(it) : flowerPts(it));
  function inner(it) {
    let s = '';
    if (it.kind === 'leaf') {
      const L = it.r * 0.9, a = tf(it, [-L, 0]), b = tf(it, [L, 0]); s += `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}"/>`;
      const veins = cfg.veins;
      for (let k = 1; k <= veins; k++) for (const sg of [-1, 1]) { const x0 = -L + (2 * L * k) / (veins + 1), p = tf(it, [x0, 0]), q = tf(it, [x0 + L * 0.25, sg * it.r * it.w * 0.62]); s += `<path d="M${f(p[0])} ${f(p[1])}L${f(q[0])} ${f(q[1])}"/>`; }
      return s;
    }
    s += `<circle cx="${f(it.x)}" cy="${f(it.y)}" r="${f(it.r * 0.2)}"/>`;
    if (it.type === 'five' || it.type === 'star') for (let k = 0; k < 5; k++) { const t = (k * 6.2832) / 5 - it.rot, a = [it.x + it.r * 0.26 * Math.cos(t), it.y + it.r * 0.26 * Math.sin(t)], b = [it.x + it.r * 0.64 * Math.cos(t), it.y + it.r * 0.64 * Math.sin(t)]; s += `<path d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}"/>`; if (cfg.detail) { for (const off of [-0.12, 0.12]) { const c2 = [it.x + it.r * 0.5 * Math.cos(t + off), it.y + it.r * 0.5 * Math.sin(t + off)]; s += `<path d="M${f(a[0])} ${f(a[1])}L${f(c2[0])} ${f(c2[1])}"/>`; } } }
    else if (it.type === 'daisy') { s += `<circle cx="${f(it.x)}" cy="${f(it.y)}" r="${f(it.r * 0.36)}"/>`; for (let k = 0; k < 9; k++) { const t = (k * 6.2832) / 9; s += `<circle cx="${f(it.x + it.r * 0.1 * Math.cos(t))}" cy="${f(it.y + it.r * 0.1 * Math.sin(t))}" r="1.2" fill="${INK}" stroke="none"/>`; } }
    else if (it.type === 'bell') { s += `<path d="${smooth(flowerPts(it, 0.55))}"/>`; }
    else { s += `<path d="${smooth(flowerPts(it, 0.64))}"/><path d="${smooth(flowerPts(it, 0.4))}"/>`; }
    if (cfg.detail && it.r > 30) for (let k = 0; k < 14; k++) { const t = R() * 6.28, rr = it.r * (0.24 + R() * 0.1); s += `<circle cx="${f(it.x + rr * Math.cos(t))}" cy="${f(it.y + rr * Math.sin(t))}" r="0.8" fill="${INK}" stroke="none"/>`; }
    return s;
  }
  const clearance = (x, y) => { let d = Infinity; for (const it of items) d = Math.min(d, Math.hypot(it.x - x, it.y - y) - it.r); return d; };

  // decoration
  let deco = ''; const pts = [];
  for (let a = 0; a < cfg.decoTries; a++) {
    const x = rand(4, W - 4), y = rand(4, H - 4), c = clearance(x, y); if (c < 5) continue;
    if (pts.some((p) => Math.hypot(p[0] - x, p[1] - y) < cfg.decoSpace)) continue; pts.push([x, y]);
    const roll = R();
    if (c > 17 && roll < cfg.curl) { const steps = 26, r0 = Math.min(c - 4, 14); const sp = []; for (let i = 0; i <= steps; i++) { const t = (i / steps) * 1.6 * 6.2832 + R() * cfg.wobble, rr = r0 * (1 - i / steps) + 1; sp.push([x + rr * Math.cos(t), y + rr * Math.sin(t)]); } deco += `<path d="${openSmooth(sp)}"/>`; }
    else if (c > 10 && roll < cfg.curl + cfg.berry) { for (let k = 0; k < 3; k++) { const t = (k * 6.2832) / 3 + R(); deco += `<circle cx="${f(x + 4 * Math.cos(t))}" cy="${f(y + 4 * Math.sin(t))}" r="2.6"/>`; } }
    else if (c > 9 && roll < cfg.curl + cfg.berry + cfg.hatch) { const ang = rand(0.5, 1.1), len = Math.min(c * 0.9, 14); for (let k = -2; k <= 2; k++) { const ox = x + k * 3.2, oy = y + k * 1.2; deco += `<path d="M${f(ox - len / 2 * Math.cos(ang))} ${f(oy - len / 2 * Math.sin(ang))}L${f(ox + len / 2 * Math.cos(ang))} ${f(oy + len / 2 * Math.sin(ang))}" stroke-width="0.8"/>`; } }
    else deco += `<circle cx="${f(x)}" cy="${f(y)}" r="${cfg.dotR}" fill="${INK}" stroke="none"/>`;
  }
  if (cfg.stipple) for (let a = 0; a < cfg.stipple; a++) { const x = rand(4, W - 4), y = rand(4, H - 4), c = clearance(x, y); if (c > 2 && c < 9) deco += `<circle cx="${f(x)}" cy="${f(y)}" r="0.7" fill="${INK}" stroke="none"/>`; }
  for (const it of items) { if (it.kind !== 'flower' || it.r < 26) continue; let best = null; for (let k = 0; k < 12; k++) { const t = (k * 6.2832) / 12, c = clearance(it.x + (it.r + 16) * Math.cos(t), it.y + (it.r + 16) * Math.sin(t)); if (!best || c > best.c) best = { t, c }; } if (!best || best.c < 6) continue; const t = best.t, a = [it.x + (radius(it, t) + 1) * Math.cos(t), it.y + (radius(it, t) + 1) * Math.sin(t)], b = [it.x + (it.r + best.c + 12) * Math.cos(t), it.y + (it.r + best.c + 12) * Math.sin(t)], m = [(a[0] + b[0]) / 2 + 9 * Math.cos(t + 1.57), (a[1] + b[1]) / 2 + 9 * Math.sin(t + 1.57)]; deco += `<path d="M${f(a[0])} ${f(a[1])}Q${f(m[0])} ${f(m[1])} ${f(b[0])} ${f(b[1])}"/>`; if (cfg.detail) deco += `<path d="M${f(m[0])} ${f(m[1])}q6 -8 12 -4"/>`; }

  // creatures on leaves
  const leaves = items.filter((i) => i.kind === 'leaf'), taken = new Set();
  const leafNear = (x, y) => { let best = null; for (const l of leaves) { if (taken.has(l) || l.r < 25 || l.x < 100 || l.x > W - 100 || l.y < 90 || l.y > 660) continue; const d = Math.hypot(l.x - x, l.y - y); if (!best || d < best.d) best = { l, d }; } taken.add(best.l); return best.l; };
  const beeA = leafNear(170, 260), beeB = leafNear(450, 610), beeC = leafNear(470, 170), rabbit = leafNear(160, 610);
  const bee = (it, s) => `<g transform="translate(${f(it.x)} ${f(it.y)}) rotate(${f(it.rot * 57.3)}) scale(${s})" fill="${PAPER}"><ellipse cx="-7" cy="-9" rx="7" ry="4.5" transform="rotate(-25 -7 -9)"/><ellipse cx="3" cy="-10" rx="7" ry="4.5" transform="rotate(20 3 -10)"/><ellipse cx="0" cy="0" rx="12" ry="7.5"/><path d="M-4 -7Q-6 0 -4 7M2 -7.4Q0 0 2 7.4" fill="none"/><circle cx="14" cy="0" r="4.5"/>${cfg.cute ? `<circle cx="15.5" cy="-1" r="1" fill="${INK}" stroke="none"/>` : ''}<path d="M-12 0L-16 0" fill="none"/></g>`;
  const rab = (it) => `<g transform="translate(${f(it.x)} ${f(it.y)}) rotate(-12)" fill="${PAPER}"><ellipse cx="-3" cy="5" rx="12" ry="9"/><circle cx="9" cy="-3" r="6.5"/><ellipse cx="7" cy="-16" rx="2.6" ry="8" transform="rotate(-12 7 -16)"/><ellipse cx="13" cy="-15" rx="2.6" ry="8" transform="rotate(14 13 -15)"/><circle cx="-15" cy="4" r="3.2"/><circle cx="11" cy="-4" r="1" fill="${INK}" stroke="none"/></g>`;
  let creatures = bee(beeA, cfg.beeScale) + bee(beeB, cfg.beeScale) + bee(beeC, cfg.beeScale) + rab(rabbit);
  let hex = ''; for (let k = 0; k < 6; k++) { const t = (k * Math.PI) / 3 + Math.PI / 6; hex += `${k ? 'L' : 'M'}${f(beeA.x + 4 + 21 * Math.cos(t))} ${f(beeA.y - 34 + 21 * Math.sin(t))}`; }
  const badge = `<circle cx="${f(beeA.x)}" cy="${f(beeA.y)}" r="31" fill="none" stroke="#b8913f" stroke-width="3"/><circle cx="${f(beeA.x)}" cy="${f(beeA.y)}" r="45" fill="none" stroke="#b8913f" stroke-width="2" opacity="0.4"/><path d="${hex}Z" fill="#f3e6c4" stroke="#b8913f" stroke-width="2.5"/><text x="${f(beeA.x + 4)}" y="${f(beeA.y - 25)}" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="26" text-anchor="middle" fill="${INK}">2</text>`;

  const cells = items.map((it) => `<path d="${cellPath(it)}"/>`).join('');
  const echo = cfg.echo ? `<g fill="none" stroke="${INK}" stroke-width="0.7" opacity="0.45" transform="translate(0.9 0.7)">${cells}</g>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="${PAPER}"/>`
    + `<g fill="none" stroke="${INK}" stroke-width="${cfg.decoW}" stroke-linecap="round" stroke-linejoin="round">${deco}</g>`
    + echo
    + `<g fill="${PAPER}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round">${cells}</g>`
    + `<g fill="none" stroke="${INK}" stroke-width="${cfg.innerW}" stroke-linecap="round">${items.map(inner).join('')}</g>`
    + `<g stroke="${INK}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${creatures}</g>`
    + badge + `</svg>`;
}

const dirs = {
  'dir-a-clean-pen': { seed: 11, gap: 5, focal: 'rosette', focalR: 86, passes: [[44, 56], [34, 44], [26, 34]], leafShare: 0.45, flowers: ['five', 'daisy', 'rosette', 'five', 'bell'], wobble: 0, veins: 2, detail: false, decoTries: 2600, decoSpace: 14, curl: 0.35, berry: 0.35, hatch: 0, dotR: 1.4, stipple: 0, decoW: 1.0, innerW: 0.9, echo: false, cute: true, beeScale: 1.05 },
  'dir-b-living-ink': { seed: 23, gap: 3, focal: 'ruffle', focalR: 90, passes: [[42, 54], [32, 42], [24, 32], [20, 24]], leafShare: 0.5, flowers: ['five', 'daisy', 'ruffle', 'star', 'bell'], wobble: 0.05, veins: 3, detail: false, decoTries: 5000, decoSpace: 9, curl: 0.45, berry: 0.25, hatch: 0.1, dotR: 1.5, stipple: 0, decoW: 1.1, innerW: 0.9, echo: true, cute: true, beeScale: 1 },
  'dir-c-etched-botanical': { seed: 37, gap: 3, focal: 'rosette', focalR: 96, passes: [[40, 50], [30, 40], [23, 30], [20, 23]], leafShare: 0.5, flowers: ['five', 'daisy', 'star', 'rosette', 'bell'], wobble: 0.012, veins: 4, detail: true, decoTries: 7000, decoSpace: 7, curl: 0.25, berry: 0.15, hatch: 0.45, dotR: 0.9, stipple: 9000, decoW: 0.8, innerW: 0.8, echo: false, cute: false, beeScale: 0.95 },
};
for (const [name, cfg] of Object.entries(dirs)) { const svg = build(cfg); writeFileSync(`${OUT}/${name}.svg`, svg); console.log(name, (svg.length / 1024).toFixed(0) + ' KB'); }
