// Exact solution counting by backtracking with clue feasibility pruning.
// Used for the uniqueness check (SPEC section 4: SAT-level proof, own backtracking).
export function countSolutions({ cellCount, constraints, total = null, greenCells = [], bloomCells = [], limit = 2 }) {
  const value = new Int8Array(cellCount).fill(-1); // -1 open, 0 GREEN, 1 BLOOM
  const cIdx = Array.from({ length: cellCount }, () => []);
  constraints.forEach((k, i) => k.cells.forEach((c) => cIdx[c].push(i)));
  const target = constraints.map((k) => k.bloom);
  const cBloom = new Int32Array(constraints.length);
  const cOpen = Int32Array.from(constraints, (k) => k.cells.length);
  let totBloom = 0;
  let totOpen = cellCount;
  let count = 0;
  let first = null;

  for (let i = 0; i < constraints.length; i++) {
    if (target[i] < 0 || target[i] > cOpen[i]) return { count: 0, first: null };
  }
  if (total !== null && (total < 0 || total > cellCount)) return { count: 0, first: null };

  function assign(c, v) {
    value[c] = v;
    totOpen--;
    totBloom += v;
    let ok = total === null || (totBloom <= total && totBloom + totOpen >= total);
    for (const i of cIdx[c]) {
      cOpen[i]--;
      cBloom[i] += v;
      if (cBloom[i] > target[i] || cBloom[i] + cOpen[i] < target[i]) ok = false;
    }
    return ok;
  }

  function unassign(c) {
    const v = value[c];
    value[c] = -1;
    totOpen++;
    totBloom -= v;
    for (const i of cIdx[c]) {
      cOpen[i]++;
      cBloom[i] -= v;
    }
  }

  function search(pos) {
    let c = pos;
    while (c < cellCount && value[c] !== -1) c++;
    if (c === cellCount) {
      count++;
      if (!first) first = Array.from(value);
      return;
    }
    for (const v of [1, 0]) {
      if (assign(c, v)) search(c + 1);
      unassign(c);
      if (count >= limit) return;
    }
  }

  let feasible = true;
  for (const c of greenCells) feasible = assign(c, 0) && feasible;
  for (const c of bloomCells) feasible = assign(c, 1) && feasible;
  if (feasible) search(0);
  return { count, first };
}
