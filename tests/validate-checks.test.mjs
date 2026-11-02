import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validatePage } from '../src/page/validate.mjs';
import { loadPage } from '../src/page/model.mjs';
import { analyze } from '../src/page/analyze.mjs';
import { buildPageJson } from '../src/page/pagejson.mjs';

const sq = (x, y, w = 100, h = w) => `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`;

// Writes a page folder (svg, solution, fresh page.json) and returns its path.
function makePage({ cells, creatures, solution, blooms }) {
  const dir = join(mkdtempSync(join(tmpdir(), 'bsv-')), 'p');
  mkdirSync(dir, { recursive: true });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1600"${blooms !== undefined ? ` data-blooms="${blooms}"` : ''}>
<g id="cells">${cells.map((c) => `<path id="${c.id}" data-kind="${c.kind}" d="${c.d}"/>`).join('')}</g>
<g id="creatures">${creatures.map((k) => `<g id="${k.id}" data-type="${k.type}" data-cell="${k.cell}"${k.n !== undefined ? ` data-n="${k.n}"` : ''}${k.reveal ? ` data-reveal="${k.reveal}"` : ''}></g>`).join('')}</g>
</svg>`;
  writeFileSync(join(dir, 'page.svg'), svg);
  writeFileSync(join(dir, 'page.solution.json'), JSON.stringify(solution));
  const model = loadPage(dir);
  writeFileSync(join(dir, 'page.json'), JSON.stringify(buildPageJson(model, analyze(model)), null, 2));
  return dir;
}

test('a revealed creature that appears after everything is solved is an error', () => {
  const dir = makePage({
    cells: [{ id: 'c001', kind: 'leaf', d: sq(100, 100) }, { id: 'c002', kind: 'flower', d: sq(204, 100) }, { id: 'c003', kind: 'leaf', d: sq(308, 100) }],
    creatures: [{ id: 'k01', type: 'bee', cell: 'c001', n: 1 }, { id: 'k02', type: 'bee', cell: 'c003', n: 1, reveal: 'c003' }],
    solution: { c001: 'GREEN', c002: 'BLOOM', c003: 'GREEN' },
    blooms: 1,
  });
  const r = validatePage(dir);
  assert.ok(r.errors.some((e) => /k02 is revealed after every cell is solved/.test(e)), r.errors.join('\n'));
  rmSync(dir, { recursive: true, force: true });
});

test('a cell thinner than 22 px is an error even when its bounding box is large', () => {
  const thinL = 'M 100 100 L 200 100 L 200 110 L 110 110 L 110 200 L 100 200 Z';
  const dir = makePage({
    cells: [{ id: 'c001', kind: 'flower', d: thinL }, { id: 'c002', kind: 'leaf', d: sq(400, 400) }],
    creatures: [{ id: 'k01', type: 'rabbit', cell: 'c002' }],
    solution: { c001: 'GREEN', c002: 'GREEN' },
    blooms: 0,
  });
  const r = validatePage(dir);
  assert.ok(r.errors.some((e) => /c001 is \d+(\.\d)? px across at its narrowest/.test(e)), r.errors.join('\n'));
  rmSync(dir, { recursive: true, force: true });
});

test('creature tap areas that overlap are an error', () => {
  const dir = makePage({
    cells: [{ id: 'c001', kind: 'leaf', d: sq(100, 100, 50) }, { id: 'c002', kind: 'leaf', d: sq(154, 100, 50) }],
    creatures: [{ id: 'k01', type: 'rabbit', cell: 'c001' }, { id: 'k02', type: 'rabbit', cell: 'c002' }],
    solution: { c001: 'GREEN', c002: 'GREEN' },
    blooms: 0,
  });
  const r = validatePage(dir);
  assert.ok(r.errors.some((e) => /tap areas of k01 and k02 overlap/.test(e)), r.errors.join('\n'));
  rmSync(dir, { recursive: true, force: true });
});

test('a gap between 3 and 12 px is a warning, not an error', () => {
  const dir = makePage({
    cells: [{ id: 'c001', kind: 'leaf', d: sq(100, 100) }, { id: 'c002', kind: 'leaf', d: sq(208, 100) }],
    creatures: [{ id: 'k01', type: 'rabbit', cell: 'c001' }],
    solution: { c001: 'GREEN', c002: 'GREEN' },
    blooms: 0,
  });
  const r = validatePage(dir);
  assert.ok(r.warnings.some((w) => /c001 and c002 are 8(\.0)? px apart/.test(w)), r.warnings.join('\n'));
  assert.ok(!r.errors.some((e) => /apart/.test(e)));
  rmSync(dir, { recursive: true, force: true });
});
