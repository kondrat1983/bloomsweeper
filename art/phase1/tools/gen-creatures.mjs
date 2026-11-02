import { writeFileSync } from 'node:fs';
import { creatures, creatureAsset, creatureGroup, INK, PAPER } from './creatures.mjs';
const out = process.argv[2];
for (const name of Object.keys(creatures)) writeFileSync(`${out}/${name}.svg`, creatureAsset(name));
// Revealed fox: before and after painting. Hatch around the sleeping fox; cells around it.
function hatchPatch(cx, cy, r, gapSet) {
  let s = '';
  for (let k = -2 * r; k <= 2 * r; k += 2.4) {
    const x1 = cx + k - r, y1 = cy + r, x2 = cx + k + r, y2 = cy - r;
    s += `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}"/>`;
  }
  return s;
}
function revealed(painted) {
  const cells = [
    { d: 'M-46 -30C-60 -22 -58 -2 -44 -2C-34 -2 -30 -18 -36 -28C-38 -31 -42 -32 -46 -30Z', c: '#a9cf94' },
    { d: 'M30 -34C44 -40 58 -26 50 -14C44 -6 30 -10 28 -20C27 -26 26 -32 30 -34Z', c: '#f2a7b8' },
    { d: 'M-40 18C-52 26 -44 44 -30 40C-20 37 -20 22 -28 17C-31 15 -36 15 -40 18Z', c: '#f6c27a' },
    { d: 'M34 16C48 14 56 30 46 38C38 44 26 36 26 28C26 22 29 17 34 16Z', c: '#7fb17a' },
  ];
  const fill = painted ? (c) => c.c : () => PAPER;
  const clip = `<clipPath id="ring${painted ? 1 : 0}"><circle cx="0" cy="2" r="28"/></clipPath>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-64 -50 128 104" width="640" height="520"><rect x="-64" y="-50" width="128" height="104" fill="${PAPER}"/>${clip}`
    + `<g stroke="${INK}" stroke-width="1.6" stroke-linejoin="round">${cells.map((c) => `<path d="${c.d}" fill="${fill(c)}"/>`).join('')}</g>`
    + `<g clip-path="url(#ring${painted ? 1 : 0})" stroke="${INK}" stroke-width="0.7" opacity="${painted ? 0.35 : 0.9}">${hatchPatch(0, 2, 30)}</g>`
    + (painted ? creatureGroup('fox-pose2', 0, 4, 1.15, 0, 1.6) : `<g opacity="0.55">${creatureGroup('fox-pose2', 0, 4, 1.15, 0, 0.8)}</g>`)
    + `</svg>`;
}
writeFileSync(`${out}/fox-revealed-before.svg`, revealed(false));
writeFileSync(`${out}/fox-revealed-after.svg`, revealed(true));
console.log('ok');
