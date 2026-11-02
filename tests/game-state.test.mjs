import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/game/state.mjs';
import { tinyPage } from './fixtures-game.mjs';

test('visible creatures exclude hidden ones until revealed', () => {
  const g = new Game(tinyPage());
  assert.deepEqual(g.visibleCreatures().map((k) => k.id), ['k01', 'k02']);
});

test('finding a visible creature works once; hidden ones cannot be found', () => {
  const g = new Game(tinyPage());
  assert.equal(g.find('k01').ok, true);
  assert.equal(g.find('k01').reason, 'already');
  assert.equal(g.find('k03').reason, 'hidden');
  assert.equal(g.isFound('k01'), true);
});

test('a correct mark sticks; a wrong mark leaves a blot and the cell stays unknown', () => {
  const g = new Game(tinyPage());
  assert.equal(g.mark('c', 'BLOOM').result, 'blot');
  assert.equal(g.markOf('c'), null);
  assert.deepEqual(g.blots(), ['c']);
  assert.equal(g.mark('a', 'BLOOM').result, 'ok');
  assert.equal(g.markOf('a'), 'BLOOM');
  assert.deepEqual(g.blots(), [], 'next correct mark washes the blots');
  assert.equal(g.stats().blots, 1, 'blots still counted in stats');
});

test('three blots in a row offer a hint; a correct mark resets the streak', () => {
  const g = new Game(tinyPage());
  g.mark('c', 'BLOOM'); g.mark('b', 'BLOOM');
  assert.equal(g.shouldOfferHint(), false);
  g.mark('d', 'BLOOM');
  assert.equal(g.shouldOfferHint(), true);
  g.mark('a', 'BLOOM');
  assert.equal(g.shouldOfferHint(), false);
});

test('tapping a blot washes it away', () => {
  const g = new Game(tinyPage());
  g.mark('c', 'BLOOM');
  g.washBlot('c');
  assert.deepEqual(g.blots(), []);
});

test('bloom counter and mark-the-rest-green', () => {
  const g = new Game(tinyPage());
  assert.equal(g.canMarkRestGreen(), false);
  g.mark('a', 'BLOOM');
  assert.equal(g.bloomsMarked(), 1);
  assert.equal(g.canMarkRestGreen(), true);
  assert.equal(g.markRestGreen(), 4);
  assert.equal(g.isComplete(), true);
});

test('painting needs a mark; painting the reveal cells finds the hidden creature', () => {
  const g = new Game(tinyPage());
  assert.equal(g.paint('c', '#a9cf94').ok, false);
  g.mark('c', 'GREEN'); g.mark('e', 'GREEN');
  assert.deepEqual(g.paint('c', '#a9cf94').revealed, []);
  assert.deepEqual(g.paint('e', '#7fb17a').revealed, ['k03']);
  assert.equal(g.isFound('k03'), true);
  assert.deepEqual(g.visibleCreatures().map((k) => k.id), ['k01', 'k02', 'k03']);
});

test('eraser clears a mark and its paint', () => {
  const g = new Game(tinyPage());
  g.mark('a', 'BLOOM'); g.paint('a', '#f2a7b8');
  g.erase('a');
  assert.equal(g.markOf('a'), null);
  assert.equal(g.paintOf('a'), null);
});

test('state round-trips through toJSON', () => {
  const g = new Game(tinyPage());
  g.find('k01'); g.mark('a', 'BLOOM'); g.mark('c', 'BLOOM'); g.paint('a', '#f2a7b8');
  const g2 = new Game(tinyPage(), JSON.parse(JSON.stringify(g.toJSON())));
  assert.equal(g2.markOf('a'), 'BLOOM');
  assert.equal(g2.paintOf('a'), '#f2a7b8');
  assert.equal(g2.isFound('k01'), true);
  assert.equal(g2.stats().blots, 1);
});
