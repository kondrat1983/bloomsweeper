// Generates three original ink-garden drawings (style directions A, B, C) as standalone SVG assets.
import { writeFileSync } from 'node:fs';
import { creatureGroup } from './creatures.mjs';
const OUT = process.argv[2];
const PALETTES = {
  spring: { flowers: ['#f2a7b8', '#f6c27a', '#c7a8e0', '#f08f7a', '#9cc7ec', '#f7dc7c'], leaves: ['#a9cf94', '#7fb17a', '#c9dc9a', '#8fbfa6'] },
  meadow: { flowers: ['#e86a5c', '#f4b942', '#8e7cc3', '#f5e6a8', '#e79ab0', '#6fa8dc'], leaves: ['#6e9e58', '#95b86a', '#4f7f55', '#b9cf7a'] },
  dusk: { flowers: ['#c9708a', '#e39b6b', '#8c6ba8', '#5f7fb0', '#e8c5a0', '#b84e5d'], leaves: ['#6f8f7a', '#4e6e64', '#93a98a', '#7c8e5c'] },
  gold: { flowers: ['#c9a24b', '#e7d29a', '#b0874a', '#f1e6c8', '#8c6a3b', '#d9b86a'], leaves: ['#5e6b5a', '#7d8a72', '#3f4a3e', '#a3ae96'] },
  pastel: { flowers: ['#f9c6d3', '#fce1b6', '#dccff2', '#c9e4f5', '#fdf1b8', '#f7cfc2'], leaves: ['#cfe6c3', '#b7d8c4', '#ddebc3', '#c2ddd2'] },
};
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
  if (cfg.grass) for (let a = 0; a < cfg.grass; a++) { const x = rand(6, W - 6), y = rand(6, H - 6), c = clearance(x, y); if (c < 9) continue; if (pts.some((p) => Math.hypot(p[0] - x, p[1] - y) < 7)) continue; pts.push([x, y]); for (let k = 0; k < 3; k++) { const ox = x + (k - 1) * 2.6, h = 3.2 + R() * 2.2; deco += `<path d="M${f(ox)} ${f(y)}l${f((R() - 0.5) * 1.2)} ${f(-h)}" stroke-width="0.9"/>`; } }
  if (cfg.stipple) for (let a = 0; a < cfg.stipple; a++) { const x = rand(4, W - 4), y = rand(4, H - 4), c = clearance(x, y); if (c > 2 && c < 9) deco += `<circle cx="${f(x)}" cy="${f(y)}" r="0.7" fill="${INK}" stroke="none"/>`; }
  for (const it of items) { if (it.kind !== 'flower' || it.r < 26) continue; let best = null; for (let k = 0; k < 12; k++) { const t = (k * 6.2832) / 12, c = clearance(it.x + (it.r + 16) * Math.cos(t), it.y + (it.r + 16) * Math.sin(t)); if (!best || c > best.c) best = { t, c }; } if (!best || best.c < 6) continue; const t = best.t, a = [it.x + (radius(it, t) + 1) * Math.cos(t), it.y + (radius(it, t) + 1) * Math.sin(t)], b = [it.x + (it.r + best.c + 12) * Math.cos(t), it.y + (it.r + best.c + 12) * Math.sin(t)], m = [(a[0] + b[0]) / 2 + 9 * Math.cos(t + 1.57), (a[1] + b[1]) / 2 + 9 * Math.sin(t + 1.57)]; deco += `<path d="M${f(a[0])} ${f(a[1])}Q${f(m[0])} ${f(m[1])} ${f(b[0])} ${f(b[1])}"/>`; if (cfg.detail) deco += `<path d="M${f(m[0])} ${f(m[1])}q6 -8 12 -4"/>`; }

  // creatures on leaves
  const leaves = items.filter((i) => i.kind === 'leaf'), taken = new Set();
  const leafNear = (x, y) => { let best = null; for (const l of leaves) { if (taken.has(l) || l.r < 25 || l.x < 100 || l.x > W - 100 || l.y < 90 || l.y > 660) continue; const d = Math.hypot(l.x - x, l.y - y); if (!best || d < best.d) best = { l, d }; } taken.add(best.l); return best.l; };
  const beeA = leafNear(170, 260), beeB = leafNear(450, 610), beeC = leafNear(470, 170), rabbit = leafNear(160, 610);
  const fox = leafNear(400, 330);
  let creatures = creatureGroup('bee-pose1', f(beeA.x), f(beeA.y), 1.0, 0) + creatureGroup('bee-pose2', f(beeB.x), f(beeB.y), 0.95, -10) + creatureGroup('bee-pose1', f(beeC.x), f(beeC.y), 0.9, 160) + creatureGroup('rabbit-pose1', f(rabbit.x), f(rabbit.y + 4), 0.95, 0);
  const mothSpots = []; for (let a = 0; a < 4000 && mothSpots.length < 3; a++) { const x = rand(40, W - 40), y = rand(40, H - 40); if (clearance(x, y) > 16 && !mothSpots.some((m) => Math.hypot(m[0] - x, m[1] - y) < 200)) mothSpots.push([x, y]); }
  for (const [x, y] of mothSpots) creatures += creatureGroup('moth', f(x), f(y), 0.7, rand(-30, 30), 1.4);
  const state = cfg.state || 'find';
  const near = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r + 16;
  const nbs = (it) => items.filter((o) => o !== it && near(it, o));
  const quiet = new Set([rabbit, ...nbs(rabbit), fox, ...nbs(fox), ...nbs(fox).flatMap(nbs)]);
  for (const it of items) it.bloom = it.kind === 'flower' && !quiet.has(it);
  nbs(beeB).filter((o) => o.kind === 'flower').sort((a, b) => b.r - a.r).slice(2).forEach((o) => { o.bloom = false; });
  const nOf = (b) => nbs(b).filter((o) => o.bloom).length;
  const marks = new Map(), painted = new Map(), outline = new Set();
  let victim = null;
  if (state !== 'find' && state !== 'plain') {
    nbs(beeA).forEach((o) => marks.set(o, o.bloom ? 'B' : 'G')); marks.set(beeA, 'G');
    [rabbit, ...nbs(rabbit)].forEach((o) => marks.set(o, 'G'));
    marks.set(beeB, 'G'); nbs(beeB).filter((o) => o.bloom).forEach((o) => marks.set(o, 'B'));
  }
  if (state === 'deduce') {
    victim = nbs(rabbit).find((o) => o.kind === 'flower' && !near(o, beeB)) || null; if (victim) marks.delete(victim);
    nbs(beeB).filter((o) => !marks.has(o)).forEach((o) => outline.add(o));
  }
  const pal = PALETTES[cfg.palette || 'spring']; let fi = 0, li = 0;
  if (state === 'paint') {
    nbs(beeB).forEach((o) => marks.set(o, o.bloom ? 'B' : 'G')); [fox, ...nbs(fox)].forEach((o) => marks.set(o, 'G'));
    for (const it of items) if (it.x < 430 && !marks.has(it)) marks.set(it, it.bloom ? 'B' : 'G');
    for (const [it, m] of marks) if (it.x < 470) painted.set(it, m === 'B' ? pal.flowers[fi++ % 6] : pal.leaves[li++ % 4]);
  }
  if (state === 'complete') for (const it of items) { marks.set(it, it.bloom ? 'B' : 'G'); painted.set(it, it.bloom ? pal.flowers[fi++ % 6] : pal.leaves[li++ % 4]); }
  if (state === 'paint' || state === 'complete') creatures += creatureGroup('fox-pose2', f(fox.x), f(fox.y + 2), 0.95, 0);
  const hexBadge = (x, y, n) => { let d = ''; for (let k = 0; k < 6; k++) { const t = (k * Math.PI) / 3 + Math.PI / 6; d += `${k ? 'L' : 'M'}${f(x + 21 * Math.cos(t))} ${f(y + 21 * Math.sin(t))}`; } return `<path d="${d}Z" fill="#f3e6c4" stroke="#b8913f" stroke-width="2.5"/><text x="${f(x)}" y="${f(y + 9)}" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="26" text-anchor="middle" fill="${INK}">${n}</text>`; };
  const roundBadge = (x, y, ico) => `<circle cx="${f(x)}" cy="${f(y)}" r="20" fill="#f3e6c4" stroke="#b8913f" stroke-width="2.5"/><g transform="translate(${f(x)} ${f(y)})" fill="${INK}">${ico}</g>`;
  const rabbitIco = '<circle cx="0" cy="5" r="6"/><ellipse cx="-3" cy="-6" rx="2.2" ry="7"/><ellipse cx="3" cy="-6" rx="2.2" ry="7"/>';
  const pawIco = '<ellipse cx="0" cy="5" rx="6" ry="5"/><circle cx="-7" cy="-3" r="2.6"/><circle cx="-2.5" cy="-8" r="2.6"/><circle cx="2.5" cy="-8" r="2.6"/><circle cx="7" cy="-3" r="2.6"/>';
  let overlays = '';
  if (state === 'find') overlays += `<circle cx="${f(beeA.x)}" cy="${f(beeA.y)}" r="31" fill="none" stroke="#b8913f" stroke-width="3"/><circle cx="${f(beeA.x)}" cy="${f(beeA.y)}" r="45" fill="none" stroke="#b8913f" stroke-width="2" opacity="0.4"/>` + hexBadge(beeA.x + 4, beeA.y - 34, nOf(beeA));
  if (state === 'deduce' || state === 'paint') { overlays += hexBadge(beeA.x + 4, beeA.y - 34, nOf(beeA)) + hexBadge(beeB.x + 4, beeB.y - 34, nOf(beeB)) + roundBadge(rabbit.x + 2, rabbit.y - 38, rabbitIco); }
  if (state === 'deduce') {
    for (const it of outline) overlays += `<path d="${cellPath(it)}" fill="none" stroke="#b8913f" stroke-width="4.5" stroke-dasharray="10 7" stroke-linecap="round"/>`;
    if (victim) { const bp = []; for (let i = 0; i < 18; i++) { const t = (i / 18) * 6.2832, r = 15 * (1 + 0.28 * Math.sin(3 * t + 0.4) + 0.16 * Math.sin(7 * t + 1.3)); bp.push([victim.x + r * Math.cos(t), victim.y + r * Math.sin(t)]); } overlays += `<g fill="${INK}" opacity="0.86"><path d="${smooth(bp)}"/><circle cx="${f(victim.x + 22)}" cy="${f(victim.y - 9)}" r="3"/><circle cx="${f(victim.x - 19)}" cy="${f(victim.y + 14)}" r="2.2"/></g>`; }
  }
  if (state === 'paint') { overlays += `<circle cx="${f(fox.x)}" cy="${f(fox.y)}" r="150" fill="none" stroke="#b8913f" stroke-width="2" stroke-dasharray="3 8" opacity="0.7"/>` + roundBadge(fox.x + 2, fox.y - 40, pawIco); for (let k = 0; k < 6; k++) { const t = (k * Math.PI) / 3 + 0.3; overlays += `<path d="M${f(fox.x + 34 * Math.cos(t))} ${f(fox.y + 34 * Math.sin(t))}L${f(fox.x + 44 * Math.cos(t))} ${f(fox.y + 44 * Math.sin(t))}" stroke="#b8913f" stroke-width="3" stroke-linecap="round"/>`; } }
  const cellFill = (it) => painted.has(it) ? painted.get(it) : marks.get(it) === 'B' ? 'url(#bloomDots)' : marks.get(it) === 'G' ? 'url(#greenHatch)' : PAPER;
  let hex = ''; for (let k = 0; k < 6; k++) { const t = (k * Math.PI) / 3 + Math.PI / 6; hex += `${k ? 'L' : 'M'}${f(beeA.x + 4 + 21 * Math.cos(t))} ${f(beeA.y - 34 + 21 * Math.sin(t))}`; }
  const badge = `<circle cx="${f(beeA.x)}" cy="${f(beeA.y)}" r="31" fill="none" stroke="#b8913f" stroke-width="3"/><circle cx="${f(beeA.x)}" cy="${f(beeA.y)}" r="45" fill="none" stroke="#b8913f" stroke-width="2" opacity="0.4"/><path d="${hex}Z" fill="#f3e6c4" stroke="#b8913f" stroke-width="2.5"/><text x="${f(beeA.x + 4)}" y="${f(beeA.y - 25)}" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="26" text-anchor="middle" fill="${INK}">2</text>`;

  const cells = items.map((it) => `<path d="${cellPath(it)}" fill="${cellFill(it)}"/>`).join('');
  const echo = cfg.echo ? `<g fill="none" stroke="${INK}" stroke-width="0.7" opacity="${cfg.echoOpacity ?? 0.45}" transform="translate(0.9 0.7)">${cells}</g>` : '';
  const lineOpacity = state === 'complete' ? 0.8 : 1;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs><pattern id="bloomDots" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#fbe1e7"/><circle cx="5" cy="5" r="2" fill="#c9506f"/></pattern><pattern id="greenHatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="#e3efd8"/><line x1="0" y1="0" x2="0" y2="7" stroke="#6f9b5f" stroke-width="1.6"/></pattern></defs><rect width="${W}" height="${H}" fill="${PAPER}"/><g opacity="${lineOpacity}">`
    + `<g fill="none" stroke="${INK}" stroke-width="${cfg.decoW}" stroke-linecap="round" stroke-linejoin="round">${deco}</g>`
    + echo
    + `<g stroke="${INK}" stroke-width="1.6" stroke-linejoin="round">${cells}</g>`
    + `<g fill="none" stroke="${INK}" stroke-width="${cfg.innerW}" stroke-linecap="round">${items.map(inner).join('')}</g>`
    + creatures + `</g>`
    + overlays + `</svg>`;
}

const BASE = { seed: 11, gap: 5, focal: 'rosette', focalR: 86, passes: [[44, 56], [34, 44], [26, 34]], leafShare: 0.45, flowers: ['five', 'daisy', 'rosette', 'five', 'bell'], wobble: 0.03, veins: 2, detail: false, decoTries: 2600, decoSpace: 14, curl: 0.3, berry: 0.3, hatch: 0, dotR: 1.3, grass: 900, stipple: 5000, decoW: 1.05, innerW: 0.9, echo: true, echoOpacity: 0.3, cute: true };
const dirs = {
  'p2-find': { ...BASE, state: 'find', palette: 'spring' },
  'p2-deduce': { ...BASE, state: 'deduce', palette: 'spring' },
  'p2-paint': { ...BASE, state: 'paint', palette: 'spring' },
  'p2-complete-spring': { ...BASE, state: 'complete', palette: 'spring' },
  'p2-complete-meadow': { ...BASE, state: 'complete', palette: 'meadow' },
  'p2-complete-dusk': { ...BASE, state: 'complete', palette: 'dusk' },
  'p2-complete-pastel': { ...BASE, state: 'complete', palette: 'pastel' },
  'p2-complete-gold': { ...BASE, state: 'complete', palette: 'gold' },
  'p2-plain': { ...BASE, state: 'plain', palette: 'spring' }
};
for (const [name, cfg] of Object.entries(dirs)) { const svg = build(cfg); writeFileSync(`${OUT}/${name}.svg`, svg); console.log(name, (svg.length / 1024).toFixed(0) + ' KB'); }
