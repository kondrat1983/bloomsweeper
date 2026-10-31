import { bbox, distance } from './geometry.mjs';

// Two cells are neighbours when their outlines come within TOUCH_PX (SPEC section 3).
export const TOUCH_PX = 6;

export function computeAdjacency(polygons, touch = TOUCH_PX) {
  const n = polygons.length;
  const adj = Array.from({ length: n }, () => []);
  const boxes = polygons.map(bbox);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = boxes[i], b = boxes[j];
      if (a.x0 - b.x1 > touch || b.x0 - a.x1 > touch || a.y0 - b.y1 > touch || b.y0 - a.y1 > touch) continue;
      if (distance(polygons[i], polygons[j]) <= touch) {
        adj[i].push(j);
        adj[j].push(i);
      }
    }
  }
  return adj.map((a) => a.sort((x, y) => x - y));
}

// Overrides win over computed neighbours: removes first, then adds.
export function applyOverrides(adj, indexOf, overrides = {}) {
  const sets = adj.map((a) => new Set(a));
  const idx = (id) => {
    const i = indexOf.get(id);
    if (i === undefined) throw new Error(`override refers to unknown cell ${id}`);
    return i;
  };
  for (const [a, b] of overrides.remove || []) {
    const i = idx(a), j = idx(b);
    sets[i].delete(j);
    sets[j].delete(i);
  }
  for (const [a, b] of overrides.add || []) {
    const i = idx(a), j = idx(b);
    if (i === j) throw new Error(`override pairs a cell with itself: ${a}`);
    sets[i].add(j);
    sets[j].add(i);
  }
  return sets.map((s) => [...s].sort((x, y) => x - y));
}
