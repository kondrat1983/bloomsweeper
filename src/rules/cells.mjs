export const UNKNOWN = 0;
export const BLOOM = 1;
export const GREEN = 2;

// Cells within `steps` edges of `start`, including `start`. Sorted.
export function reachWithin(adjacency, start, steps) {
  const dist = new Map([[start, 0]]);
  const queue = [start];
  for (let head = 0; head < queue.length; head++) {
    const c = queue[head];
    const d = dist.get(c);
    if (d === steps) continue;
    for (const nb of adjacency[c]) {
      if (!dist.has(nb)) {
        dist.set(nb, d + 1);
        queue.push(nb);
      }
    }
  }
  return [...dist.keys()].sort((a, b) => a - b);
}
