import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePage } from '../src/page/svgparse.mjs';

const svg = (cells, creatures, root = 'viewBox="0 0 1200 1600"') => `<svg xmlns="http://www.w3.org/2000/svg" ${root}>
<g id="cells">
${cells}
</g>
<g id="creatures">
${creatures}
</g>
</svg>`;
const cell = (id, kind = 'leaf') => `<path id="${id}" data-kind="${kind}" d="M 0 0 L 50 0 L 50 50 L 0 50 Z"/>`;

test('parses cells, creatures and the page total', () => {
  const p = parsePage(svg(cell('c001'), `<g id="k01" data-type="bee" data-cell="c001" data-n="1"></g>`, 'viewBox="0 0 1200 1600" data-blooms="3"'));
  assert.deepEqual(p.errors, []);
  assert.equal(p.cells.length, 1);
  assert.equal(p.creatures[0].n, 1);
  assert.equal(p.totalBlooms, 3);
});

test('reveal list is parsed', () => {
  const p = parsePage(svg(cell('c001') + cell('c002'), `<g id="k02" data-type="rabbit" data-cell="c001" data-reveal="c001,c002"></g>`));
  assert.deepEqual(p.creatures[0].reveal, ['c001', 'c002']);
});

test('reports bad kind, bad creature type and missing bee number', () => {
  const p = parsePage(svg(cell('c001', 'bush'), `<g id="k01" data-type="owl" data-cell="c001"></g>`));
  assert.ok(p.errors.some((e) => /data-kind/.test(e)));
  assert.ok(p.errors.some((e) => /unknown data-type/.test(e)));
});

test('reports a wrong viewBox', () => {
  const p = parsePage(svg(cell('c001'), '', 'viewBox="0 0 100 100"'));
  assert.ok(p.errors.some((e) => /viewBox/.test(e)));
});
