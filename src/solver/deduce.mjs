import { UNKNOWN, BLOOM, GREEN } from '../rules/cells.mjs';

export class Contradiction extends Error {
  constructor(message) {
    super(message);
    this.name = 'Contradiction';
  }
}

const unknownsOf = (state, cells) => cells.filter((c) => state[c] === UNKNOWN);
const bloomsOf = (state, cells) => cells.reduce((n, c) => n + (state[c] === BLOOM ? 1 : 0), 0);

class Changes {
  constructor() { this.map = new Map(); }
  set(cell, value, why) {
    const prev = this.map.get(cell);
    if (prev && prev.value !== value) throw new Contradiction(`cell ${cell} forced both ways (${prev.why}; ${why})`);
    if (!prev) this.map.set(cell, { value, why });
  }
}

// L1: a single clue. Remaining count 0 -> unknowns GREEN; remaining == unknowns -> BLOOM.
function levelOne(state, cons) {
  const ch = new Changes();
  for (const k of cons) {
    const unk = unknownsOf(state, k.cells);
    const rem = k.bloom - bloomsOf(state, k.cells);
    if (rem < 0 || rem > unk.length) throw new Contradiction(`clue ${k.source} cannot be met`);
    if (unk.length === 0) continue;
    if (rem === 0) unk.forEach((c) => ch.set(c, GREEN, `L1 ${k.source}`));
    else if (rem === unk.length) unk.forEach((c) => ch.set(c, BLOOM, `L1 ${k.source}`));
  }
  return ch;
}

// L2: if the unknowns of clue A are inside those of clue B, the difference D = B - A
// holds (remB - remA) blooms. Zero -> D GREEN; all of D -> BLOOM.
function levelTwo(state, cons) {
  const ch = new Changes();
  const info = cons.map((k) => {
    const unk = unknownsOf(state, k.cells);
    return { k, unk, unkSet: new Set(unk), rem: k.bloom - bloomsOf(state, k.cells) };
  });
  for (const a of info) {
    for (const b of info) {
      if (a === b || a.unk.length > b.unk.length) continue;
      if (!a.unk.every((c) => b.unkSet.has(c))) continue;
      const diff = b.unk.filter((c) => !a.unkSet.has(c));
      if (diff.length === 0) continue;
      const r = b.rem - a.rem;
      const why = `L2 ${b.k.source} minus ${a.k.source}`;
      if (r < 0 || r > diff.length) throw new Contradiction(`clues ${a.k.source} and ${b.k.source} conflict`);
      if (r === 0) diff.forEach((c) => ch.set(c, GREEN, why));
      else if (r === diff.length) diff.forEach((c) => ch.set(c, BLOOM, why));
    }
  }
  return ch;
}

// L3: the page's total bloom count. Chains of three or more clues are not implemented yet (M0 gap, see DECISIONS).
function levelThree(state, total) {
  const ch = new Changes();
  if (total === null || total === undefined) return ch;
  const all = [...state.keys()];
  const unk = unknownsOf(state, all);
  const rem = total - bloomsOf(state, all);
  if (rem < 0 || rem > unk.length) throw new Contradiction('page total cannot be met');
  if (unk.length === 0) return ch;
  if (rem === 0) unk.forEach((c) => ch.set(c, GREEN, 'L3 total'));
  else if (rem === unk.length) unk.forEach((c) => ch.set(c, BLOOM, 'L3 total'));
  return ch;
}

// Runs the simplest level that makes progress, then starts again from L1.
// Input state is not modified. Throws Contradiction when clues are impossible.
export function deduce({ state, constraints, total = null, maxLevel = 3 }) {
  const st = Uint8Array.from(state);
  const steps = [];
  for (;;) {
    let applied = false;
    for (let level = 1; level <= maxLevel && !applied; level++) {
      const ch = level === 1 ? levelOne(st, constraints) : level === 2 ? levelTwo(st, constraints) : levelThree(st, total);
      for (const [cell, { value, why }] of ch.map) {
        if (st[cell] !== UNKNOWN && st[cell] !== value) throw new Contradiction(`cell ${cell} conflicts with ${why}`);
        st[cell] = value;
        steps.push({ level, cell, value, why });
        applied = true;
      }
    }
    if (!applied) break;
  }
  return { state: st, steps };
}
