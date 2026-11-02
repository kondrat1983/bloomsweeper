// Phase 3: motif library and a complete sample page that passes tools/validate.
// Run from the repo root: node art/phase3/tools/gen-page.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { parseClosedPolygon, distance, bbox } from '../../../src/page/geometry.mjs';
import { computeAdjacency } from '../../../src/page/graph.mjs';
import { creatureRule } from '../../../src/rules/creatures.mjs';
import { BLOOM, GREEN, UNKNOWN } from '../../../src/rules/cells.mjs';
import { deduce } from '../../../src/solver/deduce.mjs';
import { countSolutions } from '../../../src/solver/count.mjs';
import { analyze } from '../../../src/page/analyze.mjs';
import { creatureGroup, creatures as CREATURES, INK, PAPER } from './creatures.mjs';

const W = 1200, H = 1600;
const f = (n) => (Math.round(n * 10) / 10).toString();
function rng(seed) { return () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const R = rng(Number(process.env.SEED || 7)), rand = (a, b) => a + R() * (b - a);

// ---------- motif shapes (absolute, smooth Q outlines) ----------
function smooth(pts) { const n = pts.length, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; const m = mid(pts[n - 1], pts[0]); let d = `M ${f(m[0])} ${f(m[1])}`; for (let i = 0; i < n; i++) { const p = pts[i], q = mid(pts[i], pts[(i + 1) % n]); d += ` Q ${f(p[0])} ${f(p[1])} ${f(q[0])} ${f(q[1])}`; } return d + ' Z'; }
const wob = (v, i, k) => v * (1 + 0.03 * (Math.sin(i * 1.7 + k) * 0.6 + Math.sin(i * 0.53 + k * 3) * 0.4));
function radiusOf(it, t) {
  const c = (k, p) => Math.pow(Math.abs(Math.cos(k * (t + it.rot))), p);
  switch (it.type) {
    case 'five': return it.r * (0.6 + 0.4 * c(2.5, 0.7));
    case 'daisy': return it.r * (0.8 + 0.2 * c(6, 0.5));
    case 'star': return it.r * (0.58 + 0.42 * c(2.5, 1.4));
    case 'bell': return it.r * (0.74 + 0.26 * c(1.5, 1.2));
    default: return it.r * (0.88 + 0.12 * c(4, 0.8));
  }
}
function flowerPts(it, s = 1) { const N = 48, pts = []; for (let i = 0; i < N; i++) { const t = (i / N) * 2 * Math.PI, r = wob(radiusOf(it, t) * s, i, it.x * 0.01); pts.push([it.x + r * Math.cos(t), it.y + r * Math.sin(t)]); } return pts; }
const tf = (it, p) => { const c = Math.cos(it.rot), s = Math.sin(it.rot); return [it.x + p[0] * c - p[1] * s, it.y + p[0] * s + p[1] * c]; };
function leafPts(it) {
  const L = it.r, w = it.r * it.w, N = 24, top = [], bot = [];
  for (let i = 0; i <= N; i++) { const t = (i / N) * Math.PI; let hw = w * Math.pow(Math.sin(t), 0.85);
    if (it.type === 'oak') hw *= 0.8 + 0.2 * Math.abs(Math.sin(t * 6));
    if (it.type === 'fern') hw *= 0.82 + 0.18 * Math.abs(Math.sin(t * 9));
    if (it.type === 'heart') hw *= i < N / 2 ? 1.12 : 0.88;
    const x = -L + (2 * L * i) / N; top.push([x, -wob(hw, i, it.y * 0.01)]); bot.push([x, wob(hw, i + 9, it.y * 0.01)]); }
  return top.concat(bot.slice(1, -1).reverse()).map((p) => tf(it, p));
}
const cellD = (it) => smooth(it.kind === 'leaf' ? leafPts(it) : flowerPts(it));
function innerDeco(it) {
  if (it.kind === 'leaf') { const L = it.r * 0.88, a = tf(it, [-L, 0]), b = tf(it, [L, 0]); let s = `<path d="M ${f(a[0])} ${f(a[1])} L ${f(b[0])} ${f(b[1])}"/>`; for (let k = 1; k <= 2; k++) for (const sg of [-1, 1]) { const x0 = -L + (2 * L * k) / 3, p = tf(it, [x0, 0]), q = tf(it, [x0 + L * 0.25, sg * it.r * it.w * 0.6]); s += `<path d="M ${f(p[0])} ${f(p[1])} L ${f(q[0])} ${f(q[1])}"/>`; } return s; }
  let s = `<circle cx="${f(it.x)}" cy="${f(it.y)}" r="${f(it.r * 0.2)}"/>`;
  if (it.type === 'five' || it.type === 'star') for (let k = 0; k < 5; k++) { const t = (k * 2 * Math.PI) / 5 - it.rot, a = [it.x + it.r * 0.27 * Math.cos(t), it.y + it.r * 0.27 * Math.sin(t)], b = [it.x + it.r * 0.62 * Math.cos(t), it.y + it.r * 0.62 * Math.sin(t)]; s += `<path d="M ${f(a[0])} ${f(a[1])} L ${f(b[0])} ${f(b[1])}"/>`; }
  else if (it.type === 'daisy') { s += `<circle cx="${f(it.x)}" cy="${f(it.y)}" r="${f(it.r * 0.4)}"/>`; for (let k = 0; k < 8; k++) { const t = (k * 2 * Math.PI) / 8; s += `<circle cx="${f(it.x + it.r * 0.1 * Math.cos(t))}" cy="${f(it.y + it.r * 0.1 * Math.sin(t))}" r="1.4" fill="${INK}" stroke="none"/>`; } }
  else { s += `<path d="${smooth(flowerPts(it, 0.62))}"/>`; if (it.type !== 'bell') s += `<path d="${smooth(flowerPts(it, 0.38))}"/>`; }
  return s;
}

// ---------- motif library files ----------
const LIB = 'art/phase3/motifs';
for (const dir of ['flowers', 'leaves', 'deco']) mkdirSync(`${LIB}/${dir}`, { recursive: true });
const motifFile = (it, half) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-half} ${-half} ${2 * half} ${2 * half}" data-size="${it.size || 'm'}"><g id="cell" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"><path d="${cellD(it)}"/></g><g id="deco" fill="none" stroke="${INK}" stroke-width="0.8" stroke-linecap="round">${innerDeco(it)}</g></svg>\n`;
const sizes = { s: 20, m: 35, l: 55 };
const library = [];
for (const type of ['five', 'daisy', 'bell', 'rosette', 'star']) for (const [sz, r] of Object.entries(sizes)) { const it = { kind: 'flower', type, x: 0, y: 0, r, rot: 0.3, size: sz }; const name = `${type === 'five' ? 'five-petal' : type}-${sz}`; writeFileSync(`${LIB}/flowers/${name}.svg`, motifFile(it, r + 4)); library.push({ name, it }); }
for (const type of ['lens', 'oak', 'fern', 'heart']) { const it = { kind: 'leaf', type, x: 0, y: 0, r: 38, rot: 0, w: 0.46 }; const name = type === 'fern' ? 'fern-tip' : type; writeFileSync(`${LIB}/leaves/${name}.svg`, motifFile(it, 42)); library.push({ name, it }); }
// decoration motifs
const curl = (r0, turns, k) => { let d = ''; const steps = 30; for (let i = 0; i <= steps; i++) { const t = (i / steps) * turns * 2 * Math.PI + k, rr = r0 * (1 - i / steps) + 1; d += `${i ? ' L' : 'M'} ${f(rr * Math.cos(t))} ${f(rr * Math.sin(t))}`; } return d; };
const decoLib = {};
for (let i = 1; i <= 6; i++) decoLib[`curl-${i}`] = `<path d="${curl(8 + i * 1.5, 1.3 + i * 0.12, i)}"/>`;
for (let i = 1; i <= 6; i++) { let s = ''; for (let k = 0; k < 2 + (i % 3); k++) { const t = (k * 2 * Math.PI) / (2 + (i % 3)) + i; s += `<circle cx="${f(4.5 * Math.cos(t))}" cy="${f(4.5 * Math.sin(t))}" r="2.6"/>`; } decoLib[`berries-${i}`] = s; }
for (let i = 1; i <= 6; i++) { let s = ''; for (let k = 0; k < 5 + i; k++) { const a = k * 2.4 + i, rr = 2 + (k % 4) * 2.5; s += `<circle cx="${f(rr * Math.cos(a))}" cy="${f(rr * Math.sin(a))}" r="0.9" fill="${INK}" stroke="none"/>`; } decoLib[`dots-${i}`] = s; }
for (let i = 1; i <= 6; i++) { const len = 26 + i * 6, bend = (i % 2 ? 1 : -1) * (6 + i); decoLib[`stem-${i}`] = `<path d="M 0 ${f(len / 2)} Q ${f(bend)} 0 0 ${f(-len / 2)}"/><path d="M ${f(bend * 0.4)} ${f(-len * 0.1)} Q ${f(bend * 0.9 + 8)} ${f(-len * 0.2)} ${f(bend * 0.6 + 12)} ${f(-len * 0.32)}"/>`; }
for (let i = 1; i <= 3; i++) decoLib[`moth-${i}`] = `<g fill="${PAPER}">${CREATURES.moth.join('')}</g>`;
for (const [name, body] of Object.entries(decoLib)) writeFileSync(`${LIB}/deco/${name}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-24 -24 48 48"><g id="deco" fill="none" stroke="${INK}" stroke-width="${name.startsWith('moth') ? 1.4 : 1}" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>\n`);

// ---------- page layout: touching (gap 0.5 to 3) or clearly apart (gap 12+) ----------
const items = [];
const polyOf = (it) => (it.poly ??= parseClosedPolygon(cellD(it)));
// placement uses the control points (within 0.2 px of the smooth outline): much faster
const rawOf = (it) => (it.raw ??= (it.kind === 'leaf' ? leafPts(it) : flowerPts(it)));
function newItem(kind) {
  if (kind === 'flower') return { kind, type: ['five', 'daisy', 'rosette', 'bell', 'star'][Math.floor(R() * 5)], r: rand(62, 98), rot: rand(0, 6.28) };
  return { kind, type: ['lens', 'lens', 'oak', 'fern', 'heart'][Math.floor(R() * 5)], r: rand(70, 98), rot: rand(0, 3.14), w: rand(0.4, 0.48) };
}
function okAgainstAll(it) {
  const P = rawOf(it), b = bbox(P);
  if (b.x0 < 30 || b.y0 < 30 || b.x1 > W - 30 || b.y1 > H - 30) return false;
  let touches = 0;
  for (const o of items) {
    if (Math.hypot(o.x - it.x, o.y - it.y) > o.r + it.r + 40) continue;
    let d = distance(P, rawOf(o));
    if (d < 16) d = distance(polyOf(it), polyOf(o));
    if (d < 0.5) return false;
    if (d <= 3) { touches++; continue; }
    if (d < 12) return false;
  }
  return touches;
}
items.push({ kind: 'flower', type: 'rosette', x: 600, y: 800, r: 140, rot: 0.2 });
function tryPlace(kind) {
  const a = items[Math.floor(R() * items.length)];
  const it = newItem(kind);
  const ang = rand(0, 6.28);
  let lo = 0, hi = a.r + it.r + 60;
  for (let k = 0; k < 22; k++) {
    const mid = (lo + hi) / 2; it.x = a.x + mid * Math.cos(ang); it.y = a.y + mid * Math.sin(ang); it.poly = null; it.raw = null;
    let d = distance(rawOf(it), rawOf(a));
    if (d < 16) d = distance(polyOf(it), polyOf(a));
    if (d < 0.8) lo = mid; else if (d > 2.4) hi = mid; else { const t = okAgainstAll(it); return t ? { it, t } : null; }
  }
  return null;
}
for (let round = 0; round < 400 && items.length < 64; round++) {
  const kind = R() < 0.52 ? 'leaf' : 'flower';
  let best = null;
  for (let k = 0; k < 30; k++) { const c = tryPlace(kind); if (c && (!best || c.t > best.t)) best = c; }
  if (best) items.push(best.it);
}
items.forEach((it, i) => { it.id = `c${String(i + 1).padStart(3, '0')}`; });
const polys = items.map(polyOf);
const adj = computeAdjacency(polys);
let gapBad = 0, minSide = Infinity;
for (let i = 0; i < items.length; i++) { const b = bbox(polys[i]); minSide = Math.min(minSide, b.width, b.height); for (let j = i + 1; j < items.length; j++) { const d = distance(polys[i], polys[j]); if (d > 3 && d < 12) gapBad++; } }

// ---------- puzzle: solution and clues ----------
const n = items.length;
const leafSet = new Set(items.map((it, i) => (it.kind === 'leaf' ? i : -1)).filter((i) => i >= 0));
// flowers that share a leaf get the same state, so every bee reads cleanly (small page: L1 only)
const parent = items.map((_, i) => i); const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
for (const l of leafSet) { const fl = adj[l].filter((j) => !leafSet.has(j)); for (let k = 1; k < fl.length; k++) parent[find(fl[k])] = find(fl[0]); }
const compBloom = new Map();
for (let i = 0; i < items.length; i++) { const it = items[i]; const covered = adj[i].some((j) => leafSet.has(j)); if (it.kind !== 'flower' || !covered) { it.bloom = false; continue; } const r = find(i); if (!compBloom.has(r)) compBloom.set(r, R() < 0.5); it.bloom = compBloom.get(r); }
const sol = items.map((it) => (it.bloom ? BLOOM : GREEN));
const total = sol.filter((v) => v === BLOOM).length;
const leaves = items.map((it, i) => i).filter((i) => items[i].kind === 'leaf');
const cand = [];
for (const c of leaves) {
  const bees = adj[c].filter((x) => sol[x] === BLOOM).length;
  cand.push({ type: 'bee', cell: c, n: bees });
  for (const type of ['rabbit', 'fox']) { const r = creatureRule({ id: 't', type, cell: c }, adj); if (r.constraint.cells.every((x) => sol[x] !== BLOOM)) cand.push({ type, cell: c, n: null }); }
}
const asModel = (list) => ({ cells: items.map((it) => ({ id: it.id })), adjacency: adj, totalBlooms: total, creatures: list.map((k, i) => ({ id: `k${String(i + 1).padStart(2, '0')}`, type: k.type, n: k.n, cell: k.cell, reveal: k.reveal || [] })) });
function determinedBy(list) { const st = new Uint8Array(n); const rules = list.map((k) => creatureRule({ id: 'x', ...k }, adj)); for (const r of rules) for (const c of r.green) st[c] = GREEN; try { return deduce({ state: st, constraints: rules.map((r) => r.constraint), total }).state; } catch { return null; } }
const unknownCount = (st) => st.filter((v) => v === UNKNOWN).length;
const chosen = [];
const usedCells = new Set();
const pickBest = (pool) => { let best = null; for (const k of pool) { if (usedCells.has(k.cell)) continue; const st = determinedBy([...chosen, k]); if (!st) continue; const u = unknownCount(st); if (!best || u < best.u) best = { k, u }; } return best; };
for (const type of ['rabbit', 'fox']) { const b = pickBest(cand.filter((k) => k.type === type)); if (b) { chosen.push(b.k); usedCells.add(b.k.cell); } }
for (let guard = 0; guard < 40; guard++) { const st = determinedBy(chosen); if (st && unknownCount(st) === 0) break; const b = pickBest(cand.filter((k) => k.type === 'bee')); if (!b) break; chosen.push(b.k); usedCells.add(b.k.cell); }
const unique = (list) => { const rules = list.map((k) => creatureRule({ id: 'x', ...k }, adj)); return countSolutions({ cellCount: n, constraints: rules.map((r) => r.constraint), total, greenCells: rules.flatMap((r) => r.green) }).count === 1; };
// prune redundant clues, keep at least one rabbit and one fox
for (let i = chosen.length - 1; i >= 0; i--) { const k = chosen[i]; if (k.type !== 'bee') continue; const rest = chosen.filter((_, j) => j !== i); const st = determinedBy(rest); if (st && unknownCount(st) === 0 && unique(rest)) chosen.splice(i, 1); }
// make one creature a reveal: its listed cells get solved first, and it is still needed when it appears
let revealOk = false;
for (const k of [...chosen].sort((a, b) => (a.type === 'fox' ? -1 : 1))) {
  const others = chosen.filter((x) => x !== k);
  const st = determinedBy(others); if (!st) continue;
  const around = adj[k.cell].filter((c) => st[c] !== UNKNOWN);
  if (around.length < 2 || unknownCount(st) === 0) continue;
  k.reveal = [k.cell, ...around.slice(0, 3)].filter((c) => st[c] !== UNKNOWN);
  if (!k.reveal.length) { k.reveal = undefined; continue; }
  const a = analyze(asModel(chosen));
  if (!a.error && a.allDetermined && a.stages.length > 1) { revealOk = true; break; }
  k.reveal = undefined;
}
const finalA = analyze(asModel(chosen));

// ---------- decoration in the gaps ----------
const clearance = (x, y) => { let d = Infinity; for (const it of items) d = Math.min(d, Math.hypot(it.x - x, it.y - y) - it.r * 1.02); return d; };
let deco = ''; const pts = [];
for (let a = 0; a < 9000; a++) { const x = rand(12, W - 12), y = rand(12, H - 12), c = clearance(x, y); if (c < 8) continue; if (pts.some((p) => Math.hypot(p[0] - x, p[1] - y) < 18)) continue; pts.push([x, y]); const roll = R();
  if (c > 26 && roll < 0.3) deco += `<g transform="translate(${f(x)} ${f(y)})">${decoLib[`curl-${1 + Math.floor(R() * 6)}`]}</g>`;
  else if (c > 14 && roll < 0.55) deco += `<g transform="translate(${f(x)} ${f(y)})">${decoLib[`berries-${1 + Math.floor(R() * 6)}`]}</g>`;
  else if (c > 12 && roll < 0.8) { for (let k = 0; k < 3; k++) deco += `<path d="M ${f(x + (k - 1) * 3.4)} ${f(y)} l ${f((R() - 0.5) * 1.6)} ${f(-4.4 - R() * 2.6)}"/>`; }
  else deco += `<circle cx="${f(x)}" cy="${f(y)}" r="1.5" fill="${INK}" stroke="none"/>`; }
for (let a = 0; a < 22000; a++) { const x = rand(6, W - 6), y = rand(6, H - 6), c = clearance(x, y); if (c > 3 && c < 14) deco += `<circle cx="${f(x)}" cy="${f(y)}" r="0.8" fill="${INK}" stroke="none"/>`; }

// ---------- write the page ----------
const OUT = 'pages/garden/sample-p3';
mkdirSync(OUT, { recursive: true });
const cellsSvg = items.map((it) => `  <path id="${it.id}" data-kind="${it.kind}" d="${cellD(it)}"/>`).join('\n');
const inner = items.map(innerDeco).join('');
const art = { bee: 'bee-pose1', rabbit: 'rabbit-pose1', fox: 'fox-pose2' };
const creaturesSvg = chosen.map((k, i) => { const it = items[k.cell]; const attrs = [`id="k${String(i + 1).padStart(2, '0')}"`, `data-type="${k.type}"`, `data-cell="${it.id}"`].concat(k.type === 'bee' ? [`data-n="${k.n}"`] : []).concat(k.reveal ? [`data-reveal="${k.reveal.map((c) => items[c].id).join(',')}"`] : []).join(' '); return `  <g ${attrs}>${creatureGroup(art[k.type], f(it.x), f(it.y + 2), 1.6, 0, 1.6)}</g>`; }).join('\n');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1600" data-blooms="${total}">
<title>Garden sample page (phase 3)</title>
<g id="deco" fill="none" stroke="${INK}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">${deco}</g>
<g id="cells" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round">
${cellsSvg}
</g>
<g id="deco-top" fill="none" stroke="${INK}" stroke-width="0.8" stroke-linecap="round" pointer-events="none">${inner}</g>
<g id="creatures">
${creaturesSvg}
</g>
</svg>
`;
writeFileSync(`${OUT}/page.svg`, svg);
writeFileSync(`${OUT}/page.solution.json`, JSON.stringify(Object.fromEntries(items.map((it) => [it.id, it.bloom ? 'BLOOM' : 'GREEN'])), null, 2) + '\n');
const report = { cells: n, flowers: items.filter((i) => i.kind === 'flower').length, leaves: leaves.length, blooms: total, creatures: chosen.map((k) => k.type + (k.reveal ? ' (revealed)' : '')), stages: finalA.stages.map((s) => ({ stage: s.stage, determined: s.determined })), allDetermined: finalA.allDetermined, revealOk, unique: unique(chosen), gapsBetween3and12: gapBad, minCellSide: Math.round(minSide), degree: { min: Math.min(...adj.map((a) => a.length)), max: Math.max(...adj.map((a) => a.length)), avg: +(adj.reduce((s, a) => s + a.length, 0) / n).toFixed(2) }, difficulty: finalA.difficulty };
writeFileSync('art/phase3/report.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
