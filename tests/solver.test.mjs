import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deduce, Contradiction } from '../src/solver/deduce.mjs';
import { UNKNOWN, BLOOM, GREEN } from '../src/rules/cells.mjs';

const unknown = (n) => new Uint8Array(n).fill(UNKNOWN);

test('L1: a clue with zero remaining sets its unknown cells GREEN', () => {
  const r = deduce({ state: unknown(3), constraints: [{ source: 'a', cells: [0, 1, 2], bloom: 0 }] });
  assert.deepEqual([...r.state], [GREEN, GREEN, GREEN]);
  assert.ok(r.steps.every((s) => s.level === 1));
});

test('L1: remaining equal to unknown count sets them BLOOM', () => {
  const r = deduce({ state: unknown(2), constraints: [{ source: 'a', cells: [0, 1], bloom: 2 }] });
  assert.deepEqual([...r.state], [BLOOM, BLOOM]);
});

test('L2: subset reasoning finds a cell only the two clues together settle', () => {
  const r = deduce({
    state: unknown(3),
    constraints: [
      { source: 'a', cells: [0, 1], bloom: 1 },
      { source: 'b', cells: [0, 1, 2], bloom: 1 },
    ],
  });
  assert.equal(r.state[2], GREEN);
  assert.ok(r.steps.every((s) => s.level === 2));
});

test('L2: subset reasoning can force BLOOM', () => {
  const r = deduce({
    state: unknown(3),
    constraints: [
      { source: 'a', cells: [0, 1], bloom: 1 },
      { source: 'b', cells: [0, 1, 2], bloom: 2 },
    ],
  });
  assert.equal(r.state[2], BLOOM);
});

test('L3: page total settles all cells when it is exact', () => {
  const r = deduce({ state: unknown(3), constraints: [], total: 3 });
  assert.deepEqual([...r.state], [BLOOM, BLOOM, BLOOM]);
  assert.ok(r.steps.every((s) => s.level === 3));
});

test('ambiguous clues make no progress', () => {
  const r = deduce({ state: unknown(2), constraints: [{ source: 'a', cells: [0, 1], bloom: 1 }] });
  assert.deepEqual([...r.state], [UNKNOWN, UNKNOWN]);
  assert.equal(r.steps.length, 0);
});

test('impossible clue throws a Contradiction', () => {
  assert.throws(
    () => deduce({ state: unknown(1), constraints: [{ source: 'a', cells: [0], bloom: 2 }] }),
    Contradiction,
  );
});

test('deduce does not change the input state', () => {
  const s = unknown(1);
  deduce({ state: s, constraints: [{ source: 'a', cells: [0], bloom: 0 }] });
  assert.equal(s[0], UNKNOWN);
});
