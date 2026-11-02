// Page generator (SPEC section 5): draws a garden from the motif shapes, places cells so they
// either touch (gap 0.5 to 3 px) or stay 12 px apart, chooses a solution and clue creatures,
// prunes clues while the page stays valid, and writes page.svg, page.solution.json and page.json.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseClosedPolygon, distance, bbox } from '../page/geometry.mjs';
import { computeAdjacency } from '../page/graph.mjs';
import { creatureRule } from '../rules/creatures.mjs';
import { BLOOM, GREEN, UNKNOWN } from '../rules/cells.mjs';
import { deduce } from '../solver/deduce.mjs';
import { analyze } from '../page/analyze.mjs';
import { loadPage } from '../page/model.mjs';
import { buildPageJson } from '../page/pagejson.mjs';
import { validatePage } from '../page/validate.mjs';
import { HIT_R, MIN_BLOOM_SHARE } from '../limits.mjs';
import { creatureGroup, creatures as CREATURE_ART, INK, PAPER } from './creature-art.mjs';

export const PROFILES = {
  'teach-rabbit': { cells: 15, flowerR: [120, 160], leafR: [130, 170], focalR: 0, mode: 'teach', teach: 'rabbit', reveal: false, maxCreatures: 4 },
  'teach-fox': { cells: 15, flowerR: [120, 160], leafR: [130, 170], focalR: 0, mode: 'teach', teach: 'fox', reveal: false, maxCreatures: 4 },
  small: { cells: 60, flowerR: [62, 98], leafR: [70, 98], focalR: 140, mode: 'l1', reveal: true, maxCreatures: 12 },
  medium: { dense: true, cells: 150, flowerR: [42, 62], leafR: [48, 64], focalR: 96, mode: 'mixed', reveal: true, needL2: true, maxCreatures: 28 },
  large: { dense: true, cells: 250, flowerR: [34, 50], leafR: [40, 52], focalR: 80, mode: 'mixed', reveal: true, needL2: true, maxCreatures: 50 },
};

const W = 1200, H = 1600;
const f = (n) => (Math.round(n * 10) / 10).toString();
function rng(seed) { let s = seed | 0; return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------- shapes ----------
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
const rawPts = (it) => (it.kind === 'leaf' ? leafPts(it) : flowerPts(it));
const cellD = (it) => smooth(rawPts(it));
function innerDeco(it) {
  if (it.kind === 'leaf') { const L = it.r * 0.88, a = tf(it, [-L, 0]), b = tf(it, [L, 0]); let s = `<path d="M ${f(a[0])} ${f(a[1])} L ${f(b[0])} ${f(b[1])}"/>`; for (let k = 1; k <= 2; k++) for (const sg of [-1, 1]) { const x0 = -L + (2 * L * k) / 3, p = tf(it, [x0, 0]), q = tf(it, [x0 + L * 0.25, sg * it.r * it.w * 0.6]); s += `<path d="M ${f(p[0])} ${f(p[1])} L ${f(q[0])} ${f(q[1])}"/>`; } return s; }
  let s = `<circle cx="${f(it.x)}" cy="${f(it.y)}" r="${f(it.r * 0.2)}"/>`;
  if (it.type === 'five' || it.type === 'star') for (let k = 0; k < 5; k++) { const t = (k * 2 * Math.PI) / 5 - it.rot, a = [it.x + it.r * 0.27 * Math.cos(t), it.y + it.r * 0.27 * Math.sin(t)], b = [it.x + it.r * 0.62 * Math.cos(t), it.y + it.r * 0.62 * Math.sin(t)]; s += `<path d="M ${f(a[0])} ${f(a[1])} L ${f(b[0])} ${f(b[1])}"/>`; }
  else if (it.type === 'daisy') { s += `<circle cx="${f(it.x)}" cy="${f(it.y)}" r="${f(it.r * 0.4)}"/>`; for (let k = 0; k < 8; k++) { const t = (k * 2 * Math.PI) / 8; s += `<circle cx="${f(it.x + it.r * 0.1 * Math.cos(t))}" cy="${f(it.y + it.r * 0.1 * Math.sin(t))}" r="1.4" fill="${INK}" stroke="none"/>`; } }
  else { s += `<path d="${smooth(flowerPts(it, 0.62))}"/>`; if (it.type !== 'bell') s += `<path d="${smooth(flowerPts(it, 0.38))}"/>`; }
  return s;
}

// ---------- layout ----------
function layout(P, R) {
  const rand = (a, b) => a + R() * (b - a);
  const items = [];
  const polyOf = (it) => (it.poly ??= parseClosedPolygon(cellD(it)));
  const rawOf = (it) => (it.raw ??= rawPts(it));
  const reset = (it) => { it.poly = null; it.raw = null; };
  const exactDist = (a, b) => { const d = distance(rawOf(a), rawOf(b)); return d < 16 ? distance(polyOf(a), polyOf(b)) : d; };
  function newItem(kind) {
    if (kind === 'flower') return { kind, type: ['five', 'daisy', 'rosette', 'bell', 'star'][Math.floor(R() * 5)], r: rand(...P.flowerR), rot: rand(0, 6.28) };
    return { kind, type: ['lens', 'lens', 'oak', 'fern', 'heart'][Math.floor(R() * 5)], r: rand(...P.leafR), rot: rand(0, 3.14), w: rand(0.44, 0.5) };
  }
  function touches(it) {
    const b = bbox(rawOf(it));
    if (b.x0 < 30 || b.y0 < 30 || b.x1 > W - 30 || b.y1 > H - 30) return 0;
    let t = 0;
    for (const o of items) {
      if (Math.hypot(o.x - it.x, o.y - it.y) > o.r + it.r + 30) continue;
      const d = exactDist(it, o);
      if (d < 0.5) return 0;
      if (d <= 2.4) { t++; continue; }
      if (d < 12) return 0;
    }
    return t;
  }
  function viaRay(kind) {
    const a = items[Math.floor(R() * items.length)], it = newItem(kind), ang = rand(0, 6.28);
    let lo = 0, hi = a.r + it.r + 60;
    for (let k = 0; k < 22; k++) {
      const mid = (lo + hi) / 2; it.x = a.x + mid * Math.cos(ang); it.y = a.y + mid * Math.sin(ang); reset(it);
      const d = exactDist(it, a);
      if (d < 0.8) lo = mid; else if (d > 2.2) hi = mid; else return it;
    }
    return null;
  }
  function viaPocket(kind) {
    const a = items[Math.floor(R() * items.length)], it = newItem(kind);
    const near = items.filter((o) => o !== a && Math.hypot(o.x - a.x, o.y - a.y) < a.r + o.r + 2 * it.r);
    if (!near.length) return null;
    const b = near[Math.floor(R() * near.length)];
    const ra = (a.r + it.r) * 0.92, rb = (b.r + it.r) * 0.92, dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
    if (d > ra + rb || d < Math.abs(ra - rb) || d === 0) return null;
    const l = (ra * ra - rb * rb + d * d) / (2 * d), h = Math.sqrt(Math.max(0, ra * ra - l * l)), sg = R() < 0.5 ? 1 : -1;
    it.x = a.x + (l * dx) / d - (sg * h * dy) / d; it.y = a.y + (l * dy) / d + (sg * h * dx) / d;
    for (let k = 0; k < 14; k++) {
      reset(it);
      const dA = exactDist(it, a), dB = exactDist(it, b);
      if (dA >= 0.8 && dA <= 2.2 && dB >= 0.8 && dB <= 2.2) return it;
      let mx = 0, my = 0;
      for (const [o, dd] of [[a, dA], [b, dB]]) { const ux = o.x - it.x, uy = o.y - it.y, n = Math.hypot(ux, uy) || 1; const step = dd < 0.5 ? -3 : (dd - 1.5) * 0.55; mx += (ux / n) * step; my += (uy / n) * step; }
      it.x += mx; it.y += my;
    }
    return null;
  }
  if (P.focalR) items.push({ kind: 'flower', type: 'rosette', x: W / 2, y: H / 2, r: P.focalR, rot: 0.2 });
  else items.push({ kind: 'flower', type: 'rosette', x: W / 2, y: H / 2, r: P.flowerR[1], rot: 0.2 });
  for (let round = 0; round < P.cells * 8 && items.length < P.cells; round++) {
    const kind = R() < 0.5 ? 'leaf' : 'flower';
    let best = null;
    const tries = P.dense ? 40 : 24;
    for (let k = 0; k < tries; k++) {
      const it = (k % 3 && P.dense ? viaPocket : k % 2 ? viaPocket : viaRay)(kind);
      if (!it) continue;
      const t = touches(it);
      if (t && (!best || t > best.t)) best = { it, t };
    }
    // dense pages prefer shapes that sit in a pocket between two or more neighbours
    if (best && (!P.dense || best.t >= 2 || R() < 0.25)) items.push(best.it);
  }
  items.forEach((it, i) => { it.id = `c${String(i + 1).padStart(3, '0')}`; });
  return { items, polys: items.map(polyOf) };
}

// ---------- puzzle ----------
function puzzle(P, R, items, adj) {
  const n = items.length;
  const leafSet = new Set(items.map((it, i) => (it.kind === 'leaf' ? i : -1)).filter((i) => i >= 0));
  if (P.mode === 'teach') {
    // Teaching page: the creature's reach stays green, everything else blooms, so its rule is the one thing to notice.
    let best = null;
    for (const c of leafSet) {
      const reach = creatureRule({ id: 't', type: P.teach, cell: c }, adj).constraint.cells;
      if (n - reach.length < 5) continue;
      if (!best || reach.length > best.reach.length) best = { c, reach };
    }
    if (!best) return null;
    const greenSet = new Set(best.reach);
    items.forEach((it, i) => { it.bloom = !greenSet.has(i); });
    const total = items.filter((it) => it.bloom).length;
    const chosen = [{ type: P.teach, cell: best.c, n: null }];
    const a = analyze({ cells: items.map((it) => ({ id: it.id })), adjacency: adj, totalBlooms: total, creatures: [{ id: 'k01', type: P.teach, n: null, cell: best.c, reveal: [] }] });
    if (a.error || !a.allDetermined) return null;
    return { chosen, total, analysis: a };
  }
  if (P.mode === 'l1') {
    const parent = items.map((_, i) => i), find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
    for (const l of leafSet) { const fl = adj[l].filter((j) => !leafSet.has(j)); for (let k = 1; k < fl.length; k++) parent[find(fl[k])] = find(fl[0]); }
    const comp = new Map();
    items.forEach((it, i) => { const covered = adj[i].some((j) => leafSet.has(j)); if (it.kind !== 'flower' || !covered) { it.bloom = false; return; } const r = find(i); if (!comp.has(r)) comp.set(r, R() < 0.5); it.bloom = comp.get(r); });
  } else {
    const rate = 0.35 + R() * 0.25;
    items.forEach((it, i) => { const covered = adj[i].some((j) => leafSet.has(j)); it.bloom = it.kind === 'flower' && covered && R() < rate; });
  }
  const centre = (i) => [items[i].x, items[i].y];
  const tooClose = (k, list) => list.some((o) => { const [ax, ay] = centre(k.cell), [bx, by] = centre(o.cell); return Math.hypot(ax - bx, ay - by) < 2 * HIT_R + 4; });
  const unknown = (st) => st.filter((v) => v === UNKNOWN).length;
  let sol, total, chosen, solve;
  // Choose clues greedily; if cells stay open, make the open flowers green (repair) and try again.
  for (let repair = 0; ; repair++) {
    sol = items.map((it) => (it.bloom ? BLOOM : GREEN));
    total = sol.filter((v) => v === BLOOM).length;
    const cand = [];
    for (const c of leafSet) {
      cand.push({ type: 'bee', cell: c, n: adj[c].filter((x) => sol[x] === BLOOM).length });
      for (const type of ['rabbit', 'fox']) { const r = creatureRule({ id: 't', type, cell: c }, adj); if (r.constraint.cells.every((x) => sol[x] !== BLOOM)) cand.push({ type, cell: c, n: null }); }
    }
    const tot = total;
    solve = (list) => { const st = new Uint8Array(n); const rules = list.map((k) => creatureRule({ id: 'x', ...k }, adj)); for (const r of rules) for (const c of r.green) st[c] = GREEN; try { return deduce({ state: st, constraints: rules.map((r) => r.constraint), total: tot }); } catch { return null; } };
    chosen = [];
    const used = new Set();
    const pick = (pool) => { let best = null; for (const k of pool) { if (used.has(k.cell) || tooClose(k, chosen)) continue; const r = solve([...chosen, k]); if (!r) continue; const u = unknown(r.state); if (!best || u < best.u) best = { k, u }; } return best; };
    const add = (k) => { chosen.push(k); used.add(k.cell); };
    for (const type of ['rabbit', 'fox']) { const b = pick(cand.filter((k) => k.type === type)); if (b) add(b.k); }
    for (let g = 0; g < n; g++) { const r = solve(chosen); if (r && unknown(r.state) === 0) break; const b = pick(cand.filter((k) => k.type === 'bee')); if (!b) break; add(b.k); }
    const r0 = solve(chosen);
    if (!r0) return { fail: 'contradiction' };
    if (unknown(r0.state) === 0) break;
    let changed = 0;
    r0.state.forEach((v, i) => { if (v === UNKNOWN && items[i].bloom) { items[i].bloom = false; changed++; } });
    if (!changed || repair >= 12) return { fail: `clues leave ${unknown(r0.state)} cells open` };
    if (items.filter((it) => it.bloom).length < MIN_BLOOM_SHARE * n) return { fail: 'too few blooms' };
  }
  // prune bees that are not needed; keep the teaching creature, the rabbit and the fox
  // Try several removal orders; keep the set with the most L2 steps, then the fewest creatures.
  let bestSet = null;
  for (let order = 0; order < (P.needL2 ? 16 : 1); order++) {
    const list = [...chosen];
    const idx = list.map((_, i) => i).filter((i) => list[i].type === 'bee');
    if (order > 0) for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    else idx.reverse();
    const keep = new Set(list.map((_, i) => i));
    for (const i of idx) { keep.delete(i); const r = solve(list.filter((_, j) => keep.has(j))); if (!(r && unknown(r.state) === 0)) keep.add(i); }
    const set = list.filter((_, j) => keep.has(j));
    const l2 = solve(set).steps.filter((st) => st.level === 2).length;
    if (!bestSet || l2 > bestSet.l2 || (l2 === bestSet.l2 && set.length < bestSet.set.length)) bestSet = { set, l2 };
  }
  chosen = bestSet.set;
  const asModel = (list) => ({ cells: items.map((it) => ({ id: it.id })), adjacency: adj, totalBlooms: total, creatures: list.map((k, i) => ({ id: `k${String(i + 1).padStart(2, '0')}`, type: k.type, n: k.n, cell: k.cell, reveal: k.reveal || [] })) });
  if (P.reveal) {
    let ok = false;
    for (const k of [...chosen].sort((a) => (a.type === 'bee' ? -1 : 1))) {
      const r = solve(chosen.filter((x) => x !== k)); if (!r || unknown(r.state) === 0) continue;
      const around = adj[k.cell].filter((c) => r.state[c] !== UNKNOWN);
      if (r.state[k.cell] === UNKNOWN || around.length < 1) continue;
      k.reveal = [k.cell, ...around.slice(0, 3)];
      const a = analyze(asModel(chosen));
      if (!a.error && a.allDetermined && !a.uselessReveals.length && !a.neverRevealed.length) { ok = true; break; }
      k.reveal = undefined;
    }
    if (!ok) return { fail: 'no useful reveal' };
  }
  const a = analyze(asModel(chosen));
  if (a.error || !a.allDetermined) return { fail: 'staged solve failed' };
  if (P.needL2 && a.difficulty.L2 === 0) return { fail: 'no L2 step' };
  if (chosen.length > P.maxCreatures) return { fail: `${chosen.length} creatures` };
  if (P.mode !== 'teach' && total < MIN_BLOOM_SHARE * n) return { fail: 'too few blooms' };
  return { chosen, total, analysis: a };
}

// ---------- decoration and svg ----------
function decorate(R, items) {
  const rand = (a, b) => a + R() * (b - a);
  const clearance = (x, y) => { let d = Infinity; for (const it of items) d = Math.min(d, Math.hypot(it.x - x, it.y - y) - it.r * 1.02); return d; };
  const curl = (r0, turns, k) => { let d = ''; for (let i = 0; i <= 30; i++) { const t = (i / 30) * turns * 2 * Math.PI + k, rr = r0 * (1 - i / 30) + 1; d += `${i ? ' L' : 'M'} ${f(rr * Math.cos(t))} ${f(rr * Math.sin(t))}`; } return d; };
  let deco = ''; const pts = [];
  for (let a = 0; a < 9000; a++) {
    const x = rand(12, W - 12), y = rand(12, H - 12), c = clearance(x, y);
    if (c < 8 || pts.some((p) => Math.hypot(p[0] - x, p[1] - y) < 18)) continue;
    pts.push([x, y]); const roll = R();
    if (c > 26 && roll < 0.3) deco += `<path d="${curl(Math.min(c - 8, 14), 1.5, R() * 6)}" transform="translate(${f(x)} ${f(y)})"/>`;
    else if (c > 14 && roll < 0.55) { for (let k = 0; k < 3; k++) { const t = (k * 2 * Math.PI) / 3 + R(); deco += `<circle cx="${f(x + 4.5 * Math.cos(t))}" cy="${f(y + 4.5 * Math.sin(t))}" r="2.6"/>`; } }
    else if (c > 12 && roll < 0.8) { for (let k = 0; k < 3; k++) deco += `<path d="M ${f(x + (k - 1) * 3.4)} ${f(y)} l ${f((R() - 0.5) * 1.6)} ${f(-4.4 - R() * 2.6)}"/>`; }
    else deco += `<circle cx="${f(x)}" cy="${f(y)}" r="1.5" fill="${INK}" stroke="none"/>`;
  }
  for (let a = 0; a < 22000; a++) { const x = rand(6, W - 6), y = rand(6, H - 6), c = clearance(x, y); if (c > 3 && c < 14) deco += `<circle cx="${f(x)}" cy="${f(y)}" r="0.8" fill="${INK}" stroke="none"/>`; }
  return deco;
}

function pageSvg(items, chosen, total, deco, title) {
  const art = { bee: 'bee-pose1', rabbit: 'rabbit-pose1', fox: 'fox-pose2' };
  const creatures = chosen.map((k, i) => {
    const it = items[k.cell];
    const attrs = [`id="k${String(i + 1).padStart(2, '0')}"`, `data-type="${k.type}"`, `data-cell="${it.id}"`]
      .concat(k.type === 'bee' ? [`data-n="${k.n}"`] : [])
      .concat(k.reveal ? [`data-reveal="${k.reveal.map((c) => items[c].id).join(',')}"`] : []).join(' ');
    const scale = Math.max(1, Math.min(1.8, it.r / 50));
    return `  <g ${attrs}>${creatureGroup(art[k.type], f(it.x), f(it.y + 2), scale, 0, 1.6)}</g>`;
  }).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1600" data-blooms="${total}">
<title>${title}</title>
<g id="deco" fill="none" stroke="${INK}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">${deco}</g>
<g id="cells" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round">
${items.map((it) => `  <path id="${it.id}" data-kind="${it.kind}" d="${cellD(it)}"/>`).join('\n')}
</g>
<g id="deco-top" fill="none" stroke="${INK}" stroke-width="0.8" stroke-linecap="round" pointer-events="none">${items.map(innerDeco).join('')}</g>
<g id="creatures">
${creatures}
</g>
</svg>
`;
}

// Tries seeds from `seed` upward until a page passes the validator.
export function generatePage({ profile, seed = 1, out, maxTries = 20, title, log = () => {} }) {
  const P = PROFILES[profile];
  if (!P) throw new Error(`unknown profile ${profile}`);
  for (let t = 0; t < maxTries; t++) {
    const s = seed + t * 101;
    const R = rng(s);
    const t0 = Date.now();
    const { items, polys } = layout(P, R);
    log(`seed ${s}: ${items.length} cells in ${Date.now() - t0} ms`);
    if (items.length < P.cells * 0.8) continue;
    const adj = computeAdjacency(polys);
    { const deg = adj.map((a) => a.length); const lv = items.map((it, i) => (it.kind === 'leaf' ? i : -1)).filter((i) => i >= 0); let sh = 0; for (let i = 0; i < lv.length; i++) for (let j = i + 1; j < lv.length; j++) { const A = new Set(adj[lv[i]]); if (adj[lv[j]].filter((x) => A.has(x)).length >= 2) sh++; } log(`  graph: avg ${(deg.reduce((a, b) => a + b, 0) / deg.length).toFixed(2)} neighbours, ${sh} leaf pairs share 2+`); }
    const t1 = Date.now();
    let pz = null;
    const fails = {};
    for (let q = 0; q < (P.mode === 'mixed' ? 30 : 1); q++) {
      pz = puzzle(P, R, items, adj);
      if (pz && !pz.fail) break;
      const why = !pz ? 'failed' : pz.fail.replace(/\d+/g, 'N');
      fails[why] = (fails[why] || 0) + 1;
    }
    log(`  puzzle ${Date.now() - t1} ms: ${pz && !pz.fail ? 'ok' : JSON.stringify(fails)}`);
    if (!pz || pz.fail) continue;
    mkdirSync(out, { recursive: true });
    writeFileSync(join(out, 'page.svg'), pageSvg(items, pz.chosen, pz.total, decorate(R, items), title || `Garden · ${profile}`));
    writeFileSync(join(out, 'page.solution.json'), JSON.stringify(Object.fromEntries(items.map((it) => [it.id, it.bloom ? 'BLOOM' : 'GREEN'])), null, 2) + '\n');
    const model = loadPage(out);
    writeFileSync(join(out, 'page.json'), JSON.stringify(buildPageJson(model, analyze(model)), null, 2) + '\n');
    const v = validatePage(out);
    if (!v.ok) continue;
    return { ok: true, seed: s, cells: items.length, creatures: pz.chosen.length, difficulty: pz.analysis.difficulty, warnings: v.warnings.length };
  }
  return { ok: false, reason: `no valid page in ${maxTries} tries` };
}
void CREATURE_ART; void PAPER;
