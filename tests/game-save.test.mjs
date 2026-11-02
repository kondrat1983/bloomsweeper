import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCHEMA, saveGame, loadGame, migrate } from '../src/game/save.mjs';

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _m: m };
}

test('save and load round-trip under a versioned key', () => {
  const s = memoryStorage();
  assert.equal(saveGame(s, 'garden/p1', { marks: { a: 'BLOOM' } }), true);
  const back = loadGame(s, 'garden/p1');
  assert.equal(back.v, SCHEMA);
  assert.deepEqual(back.marks, { a: 'BLOOM' });
  assert.ok([...s._m.keys()].some((k) => k.includes('garden/p1')));
});

test('a missing, corrupt or newer save loads as null', () => {
  const s = memoryStorage();
  assert.equal(loadGame(s, 'x'), null);
  s.setItem(`bloomsweeper:v${SCHEMA}:page:x`, '{nope');
  assert.equal(loadGame(s, 'x'), null);
  assert.equal(migrate({ v: SCHEMA + 1, marks: {} }), null);
});

test('storage that throws never breaks the game', () => {
  const bad = { getItem() { throw new Error('private mode'); }, setItem() { throw new Error('quota'); } };
  assert.equal(saveGame(bad, 'p', {}), false);
  assert.equal(loadGame(bad, 'p'), null);
});

test('migration from schema 0 (unversioned marks object) keeps the marks', () => {
  const m = migrate({ marks: { a: 'GREEN' } });
  assert.equal(m.v, SCHEMA);
  assert.deepEqual(m.marks, { a: 'GREEN' });
});
