// Exact solution counting by backtracking with unit propagation.
// Used for the uniqueness check (SPEC section 4: SAT-level proof, own backtracking).
// After every choice each clue (and the page total) forces its open cells when it is
// already satisfied (rest GREEN) or needs all of them (rest BLOOM). Branching picks a
// cell from the clue with the fewest open cells.
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
  const trail = [];

  for (let i = 0; i < constraints.length; i++) {
    if (target[i] < 0 || target[i] > cOpen[i]) return { count: 0, first: null };
  }
  if (total !== null && (total < 0 || total > cellCount)) return { count: 0, first: null };

  // Assign one cell; returns false if a clue or the total can no longer be met.
  function assign(c, v) {
    if (value[c] !== -1) return value[c] === v;
    value[c] = v;
    trail.push(c);
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
  function undo(mark) {
    while (trail.length > mark) {
      const c = trail.pop();
      const v = value[c];
      value[c] = -1;
      totOpen++;
      totBloom -= v;
      for (const i of cIdx[c]) { cOpen[i]++; cBloom[i] -= v; }
    }
  }
  // Fill forced cells until nothing changes.
  function propagate() {
    for (let changed = true; changed;) {
      changed = false;
      for (let i = 0; i < constraints.length; i++) {
        if (!cOpen[i]) continue;
        let v = -1;
        if (cBloom[i] === target[i]) v = 0;
        else if (cBloom[i] + cOpen[i] === target[i]) v = 1;
        if (v < 0) continue;
        for (const c of constraints[i].cells) if (value[c] === -1 && !assign(c, v)) return false;
        changed = true;
      }
      if (total !== null && totOpen > 0 && (totBloom === total || totBloom + totOpen === total)) {
        const v = totBloom === total ? 0 : 1;
        for (let c = 0; c < cellCount; c++) if (value[c] === -1 && !assign(c, v)) return false;
        changed = true;
      }
    }
    return true;
  }
  function pickCell() {
    let best = -1;
    for (let i = 0; i < constraints.length; i++) if (cOpen[i] && (best < 0 || cOpen[i] < cOpen[best])) best = i;
    if (best >= 0) for (const c of constraints[best].cells) if (value[c] === -1) return c;
    for (let c = 0; c < cellCount; c++) if (value[c] === -1) return c;
    return -1;
  }
  function search() {
    const c = pickCell();
    if (c < 0) {
      count++;
      if (!first) first = Array.from(value);
      return;
    }
    for (const v of [1, 0]) {
      const mark = trail.length;
      if (assign(c, v) && propagate()) search();
      undo(mark);
      if (count >= limit) return;
    }
  }

  let feasible = true;
  for (const c of greenCells) feasible = assign(c, 0) && feasible;
  for (const c of bloomCells) feasible = assign(c, 1) && feasible;
  if (feasible && propagate()) search();
  return { count, first };
}
