import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/state.mjs';
import { nextHint } from '../src/game/hint.mjs';
import { tinyPage } from './fixtures-game.mjs';

test('with no creature found, the hint says to look for creatures', () => {
  const h = nextHint(new Game(tinyPage()));
  assert.equal(h.kind, 'find');
});

test('a found creature on an unmarked leaf: the hint says its leaf is green', () => {
  const g = new Game(tinyPage());
  g.find('k02');
  const h = nextHint(g);
  assert.equal(h.kind, 'creature-cell');
  assert.deepEqual(h.cells, ['e']);
});

test('rabbit hint points at its neighbours, never marks them', () => {
  const g = new Game(tinyPage());
  g.find('k02'); g.mark('e', 'GREEN');
  const h = nextHint(g);
  assert.equal(h.kind, 'deduce');
  assert.equal(h.level, 1);
  assert.equal(h.source, 'k02');
  assert.deepEqual(h.cells, ['d']);
  assert.equal(h.value, 'GREEN');
  assert.match(h.text, /rabbit/i);
  assert.equal(g.markOf('d'), null, 'hint does not mark');
});

test('page total hint once all blooms are marked', () => {
  const g = new Game(tinyPage());
  g.mark('a', 'BLOOM');
  const h = nextHint(g);
  assert.equal(h.level, 3);
  assert.equal(h.value, 'GREEN');
  assert.match(h.text, /blooms/);
});
