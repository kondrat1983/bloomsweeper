import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseClosedPolygon, distance, area, centroid } from '../src/page/geometry.mjs';
import { computeAdjacency, applyOverrides } from '../src/page/graph.mjs';

const sq = (x, y, s = 100) => `M ${x} ${y} L ${x + s} ${y} L ${x + s} ${y + s} L ${x} ${y + s} Z`;
const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

test('parses a closed square', () => {
  const p = parseClosedPolygon(sq(0, 0));
  assert.equal(p.length, 4);
  assert.equal(area(p), 10000);
});

test('H and V commands are supported', () => {
  const p = parseClosedPolygon('M 0 0 H 10 V 10 H 0 Z');
  assert.equal(area(p), 100);
});

test('rejects open paths and arcs', () => {
  assert.throws(() => parseClosedPolygon('M 0 0 L 10 0 L 10 10'), /must end with Z/);
  assert.throws(() => parseClosedPolygon('M 0 0 A 1 1 0 0 1 3 3 Z'), /unsupported/);
  assert.throws(() => parseClosedPolygon('M 0 0 10 10 Z'), /implicit repeats/);
});

test('centroid of a square is its middle', () => {
  const c = centroid(parseClosedPolygon(sq(0, 0)));
  close(c[0], 50);
  close(c[1], 50);
});

test('distance between squares with a 4 px gap is 4', () => {
  close(distance(parseClosedPolygon(sq(0, 0)), parseClosedPolygon(sq(104, 0))), 4);
});

test('diagonal corner distance is measured corner to corner', () => {
  close(distance(parseClosedPolygon(sq(0, 0)), parseClosedPolygon(sq(104, 104))), Math.sqrt(32));
});

test('overlapping and nested shapes have distance 0', () => {
  close(distance(parseClosedPolygon(sq(0, 0)), parseClosedPolygon(sq(50, 50))), 0);
  close(distance(parseClosedPolygon(sq(0, 0)), parseClosedPolygon(sq(10, 10, 20))), 0);
});

test('adjacency uses TOUCH_PX (6): gap 4 touches, gap 10 does not', () => {
  const near = [0, 104, 208].map((x) => parseClosedPolygon(sq(x, 0)));
  const adj = computeAdjacency(near);
  assert.deepEqual(adj, [[1], [0, 2], [1]]);
  const far = [0, 110].map((x) => parseClosedPolygon(sq(x, 0)));
  assert.deepEqual(computeAdjacency(far), [[], []]);
});

test('overrides: remove a computed pair, add a missing pair', () => {
  const polys = [0, 104, 208].map((x) => parseClosedPolygon(sq(x, 0)));
  const adj = computeAdjacency(polys);
  const indexOf = new Map([['c001', 0], ['c002', 1], ['c003', 2]]);
  const out = applyOverrides(adj, indexOf, { remove: [['c001', 'c002']], add: [['c001', 'c003']] });
  assert.deepEqual(out, [[2], [2], [0, 1]]);
});

test('overrides with unknown ids fail loudly', () => {
  const indexOf = new Map([['c001', 0]]);
  assert.throws(() => applyOverrides([[]], indexOf, { add: [['c001', 'c999']] }), /unknown cell c999/);
});

test('quadratic curves (Q) are flattened into the outline', () => {
  const p = parseClosedPolygon('M 100 0 Q 100 100 0 100 Q -100 100 -100 0 Q -100 -100 0 -100 Q 100 -100 100 0 Z');
  assert.ok(p.length > 16, `expected many points, got ${p.length}`);
  const a = area(p);
  assert.ok(a > 25000 && a < 40000, `area ${a}`);
});

test('cubic curves (C) approximate a circle closely', () => {
  const k = 55.23;
  const d = `M 100 0 C 100 ${k} ${k} 100 0 100 C ${-k} 100 -100 ${k} -100 0 C -100 ${-k} ${-k} -100 0 -100 C ${k} -100 100 ${-k} 100 0 Z`;
  const a = area(parseClosedPolygon(d));
  assert.ok(Math.abs(a - Math.PI * 10000) / (Math.PI * 10000) < 0.01, `area ${a}`);
});

test('arcs and relative commands are still rejected', () => {
  assert.throws(() => parseClosedPolygon('M 0 0 A 10 10 0 0 1 20 0 Z'), /unsupported/);
  assert.throws(() => parseClosedPolygon('M 0 0 q 10 10 20 0 Z'), /unsupported/);
});
