// Hint (GDD 4.7): points at the next provable deduction and explains it in one line.
// It never marks a cell. Uses the same rules and solver as the validator.
import { creatureRule } from '../rules/creatures.mjs';
import { deduce } from '../solver/deduce.mjs';
import { BLOOM, GREEN } from '../rules/cells.mjs';

function text1(k, value, count) {
  if (k.type === 'rabbit') return 'Rabbits eat flowers: everything this rabbit touches is green.';
  if (k.type === 'fox') return 'Foxes keep a shady den: nothing blooms within two steps of this fox.';
  if (value === 'GREEN') return k.n === 0 ? 'This bee says 0, so nothing it touches can bloom.' : `This bee already has its ${k.n} blooms. Its other neighbours are green.`;
  return `This bee needs ${k.n} blooms and only ${count} shapes are left around it. They all bloom.`;
}

export function nextHint(game) {
  const ids = game.cellIds;
  const idx = game.index;
  const adj = ids.map((id) => (game.page.adjacency[id] || []).map((n) => idx.get(n)));
  const found = game.creatures.filter((k) => game.isFound(k.id));

  for (const k of found) {
    if (!game.markOf(k.cell)) return { kind: 'creature-cell', source: k.id, cells: [k.cell], value: 'GREEN', text: 'Creatures sit on green leaves. This leaf is green.' };
  }

  const state = new Uint8Array(ids.length);
  ids.forEach((id, i) => { const m = game.markOf(id); if (m) state[i] = m === 'BLOOM' ? BLOOM : GREEN; });
  const rules = found.map((k) => creatureRule({ id: k.id, type: k.type, n: k.n, cell: idx.get(k.cell) }, adj));
  let res;
  try {
    res = deduce({ state, constraints: rules.map((r) => r.constraint), total: game.total });
  } catch {
    return { kind: 'stuck', cells: [], text: 'Something does not add up. Try the eraser on a recent mark.' };
  }

  if (!res.steps.length) {
    const hiding = game.creatures.some((k) => !game.isFound(k.id));
    return hiding
      ? { kind: 'find', cells: [], text: 'Something is still hiding. Find more creatures, or paint around a quiet spot.' }
      : { kind: 'none', cells: [], text: 'Nothing left to work out.' };
  }

  const first = res.steps[0];
  const batch = res.steps.filter((s) => s.why === first.why && s.level === first.level);
  const value = first.value === BLOOM ? 'BLOOM' : 'GREEN';
  const cells = batch.map((s) => ids[s.cell]);
  const parts = first.why.split(' ');
  if (first.level === 3) {
    const text = value === 'GREEN' ? `All ${game.total} blooms are found. Everything else is green.` : `Only ${cells.length} shapes are left and the page still needs ${cells.length} blooms. They all bloom.`;
    return { kind: 'deduce', level: 3, source: 'total', value, cells, text };
  }
  const source = parts[1];
  const k = game.creature(source);
  if (first.level === 1) return { kind: 'deduce', level: 1, source, value, cells, text: text1(k, value, cells.length) };
  const other = parts[3];
  return { kind: 'deduce', level: 2, source, other, value, cells, text: `Compare these two clues: the extra shapes ${value === 'BLOOM' ? 'must bloom' : 'are green'}.` };
}
