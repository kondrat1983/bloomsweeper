import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countSolutions } from '../src/solver/count.mjs';

const base = { cellCount: 2 };

test('two cells, one bloom: two solutions', () => {
  const r = countSolutions({ ...base, constraints: [{ cells: [0, 1], bloom: 1 }] });
  assert.equal(r.count, 2);
});

test('adding a clue makes the solution unique', () => {
  const r = countSolutions({
    ...base,
    constraints: [{ cells: [0, 1], bloom: 1 }, { cells: [0], bloom: 1 }],
  });
  assert.equal(r.count, 1);
  assert.deepEqual(r.first, [1, 0]);
});

test('impossible clue gives zero solutions', () => {
  const r = countSolutions({ ...base, constraints: [{ cells: [0], bloom: 2 }] });
  assert.equal(r.count, 0);
});

test('green cells and page total are respected', () => {
  const r = countSolutions({
    ...base,
    constraints: [{ cells: [0, 1], bloom: 1 }],
    greenCells: [0],
    total: 1,
  });
  assert.equal(r.count, 1);
  assert.deepEqual(r.first, [0, 1]);
});

test('clues that only bite late are still counted fast (propagation, no blind search)', () => {
  // cell i and cell i+30 share a clue "one bloom"; a single clue on cell i+30 fixes it.
  // Plain search in cell order would try 2^30 branches before reaching those clues.
  const half = 30;
  const constraints = [];
  for (let i = 0; i < half; i++) {
    constraints.push({ cells: [i, i + half], bloom: 1 });
    constraints.push({ cells: [i + half], bloom: i % 3 === 0 ? 1 : 0 });
  }
  const t = Date.now();
  const r = countSolutions({ cellCount: 2 * half, constraints });
  assert.ok(Date.now() - t < 2000, `took ${Date.now() - t} ms`);
  assert.equal(r.count, 1);
  assert.equal(r.first[0], 0);
  assert.equal(r.first[1], 1);
});

test('page total forces the remaining cells', () => {
  const r = countSolutions({ cellCount: 3, constraints: [{ cells: [0, 1], bloom: 1 }], total: 2, bloomCells: [2], greenCells: [0] });
  assert.equal(r.count, 1);
  assert.deepEqual(r.first, [0, 1, 1]);
});
