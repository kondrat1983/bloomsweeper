import { writeFileSync } from 'node:fs';
import { creatureGroup, INK, PAPER } from './creatures.mjs';
const f = (n) => (Math.round(n * 10) / 10).toString();
function smooth(pts) { const n = pts.length, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; const m = mid(pts[n - 1], pts[0]); let d = `M${f(m[0])} ${f(m[1])}`; for (let i = 0; i < n; i++) { const p = pts[i], q = mid(pts[i], pts[(i + 1) % n]); d += `Q${f(p[0])} ${f(p[1])} ${f(q[0])} ${f(q[1])}`; } return d + 'Z'; }
const wob = (v, i, k) => v * (1 + 0.03 * (Math.sin(i * 1.7 + k) * 0.6 + Math.sin(i * 0.53 + k * 3) * 0.4));
function flower(c) { const pts = []; for (let i = 0; i < 120; i++) { const t = (i / 120) * 6.2832; const k = c.type === 'five' ? 0.58 + 0.42 * Math.pow(Math.abs(Math.cos(2.5 * (t + c.rot))), 0.7) : 0.86 + 0.14 * Math.pow(Math.abs(Math.cos(4 * (t + c.rot))), 0.8); const r = wob(c.r * k, i, c.x); pts.push([c.x + r * Math.cos(t), c.y + r * Math.sin(t)]); } return smooth(pts); }
function leaf(c) { const L = c.r, w = c.r * 0.5, N = 30, top = [], bot = []; for (let i = 0; i <= N; i++) { const t = (i / N) * Math.PI, hw = w * Math.pow(Math.sin(t), 0.85), x = -L + (2 * L * i) / N; top.push([x, -wob(hw, i, c.y)]); bot.push([x, wob(hw, i + 9, c.y)]); } const cs = Math.cos(c.rot), sn = Math.sin(c.rot); return smooth(top.concat(bot.slice(1, -1).reverse()).map(([x, y]) => [c.x + x * cs - y * sn, c.y + x * sn + y * cs])); }
const cells = [
  { id: 'a', kind: 'flower', type: 'rosette', x: 103, y: 300, r: 50, rot: 0.2 },
  { id: 'b', kind: 'leaf', x: 200, y: 300, r: 50, rot: 0 },
  { id: 'c', kind: 'flower', type: 'rosette', x: 297, y: 300, r: 50, rot: 0.5 },
  { id: 'd', kind: 'flower', type: 'five', x: 200, y: 168, r: 50, rot: 0.3 },
  { id: 'e', kind: 'leaf', x: 112, y: 438, r: 50, rot: 0.55 },
  { id: 'g', kind: 'leaf', x: 288, y: 438, r: 50, rot: -0.55 },
];
const pathOf = (c) => (c.kind === 'leaf' ? leaf(c) : flower(c));
let deco = '';
for (const [x, y] of [[60, 170], [345, 175], [45, 520], [355, 525], [200, 545], [200, 70], [70, 80], [330, 80]]) { let d = ''; for (let i = 0; i <= 24; i++) { const t = (i / 24) * 3.2 * Math.PI, rr = 12 * (1 - i / 24) + 1; d += `${i ? 'L' : 'M'}${f(x + rr * Math.cos(t))} ${f(y + rr * Math.sin(t))}`; } deco += `<path d="${d}"/>`; }
let s = 7; const R = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
for (let i = 0; i < 700; i++) { const x = R() * 400, y = R() * 600; if (cells.some((c) => Math.hypot(c.x - x, c.y - y) < c.r + 6)) continue; deco += `<circle cx="${f(x)}" cy="${f(y)}" r="0.8" fill="${INK}" stroke="none"/>`; }
for (let i = 0; i < 60; i++) { const x = R() * 400, y = R() * 600; if (cells.some((c) => Math.hypot(c.x - x, c.y - y) < c.r + 10)) continue; for (let k = 0; k < 3; k++) deco += `<path d="M${f(x + (k - 1) * 2.6)} ${f(y)}l${f((R() - 0.5) * 1.2)} ${f(-3.4 - R() * 2)}" stroke-width="0.9"/>`; }
const inner = cells.map((c) => c.kind === 'leaf' ? `<path d="M${f(c.x - c.r * 0.9 * Math.cos(c.rot))} ${f(c.y - c.r * 0.9 * Math.sin(c.rot))}L${f(c.x + c.r * 0.9 * Math.cos(c.rot))} ${f(c.y + c.r * 0.9 * Math.sin(c.rot))}"/>` : `<circle cx="${c.x}" cy="${c.y}" r="${f(c.r * 0.22)}"/>` + (c.type === 'rosette' ? `<circle cx="${c.x}" cy="${c.y}" r="${f(c.r * 0.5)}"/>` : '')).join('');
const glow = ['a', 'c'].map((id) => `<path d="${pathOf(cells.find((c) => c.id === id))}" fill="none" stroke="#b8913f" stroke-width="5" opacity="0.85"/>`).join('');
let hex = ''; for (let k = 0; k < 6; k++) { const t = (k * Math.PI) / 3 + Math.PI / 6; hex += `${k ? 'L' : 'M'}${f(200 + 22 * Math.cos(t))} ${f(248 + 22 * Math.sin(t))}`; }
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600"><rect width="400" height="600" fill="${PAPER}"/>`
  + `<g fill="none" stroke="${INK}" stroke-width="1.1" stroke-linecap="round">${deco}</g>`
  + `<g fill="none" stroke="${INK}" stroke-width="0.7" opacity="0.3" transform="translate(0.9 0.7)">${cells.map((c) => `<path d="${pathOf(c)}"/>`).join('')}</g>`
  + `<g fill="${PAPER}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round">${cells.map((c) => `<path d="${pathOf(c)}"/>`).join('')}</g>`
  + `<g fill="none" stroke="${INK}" stroke-width="1" stroke-linecap="round">${inner}</g>`
  + glow + creatureGroup('bee-pose1', 200, 300, 1.25, 0, 1.5)
  + `<path d="${hex}Z" fill="#f3e6c4" stroke="#b8913f" stroke-width="2.5"/><text x="200" y="257" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="26" text-anchor="middle" fill="${INK}">2</text></svg>`;
writeFileSync(process.argv[2], svg);
console.log('ok');
