import { creatureRule } from '../rules/creatures.mjs';
import { UNKNOWN, BLOOM, GREEN } from '../rules/cells.mjs';
import { deduce, Contradiction } from '../solver/deduce.mjs';

// Staged no-guess solving (SPEC section 4). Stage 0 uses visible creatures only.
// After each round, creatures whose reveal cells are all determined become visible.
// Never throws for bad pages; problems come back in `error`.
export function analyze(model) {
  const byId = new Map(model.creatures.map((k) => [k.id, k]));
  const visible = new Set(model.creatures.filter((k) => k.reveal.length === 0).map((k) => k.id));
  let state = new Uint8Array(model.cells.length);
  const stages = [];
  const steps = [];
  let stage = 0;
  let error = null;
  const uselessReveals = [];
  try {
    for (;;) {
      const rules = [...visible].map((id) => creatureRule(byId.get(id), model.adjacency));
      for (const r of rules) {
        for (const c of r.green) {
          if (state[c] === BLOOM) throw new Contradiction(`creature cell ${model.cells[c].id} is BLOOM`);
          state[c] = GREEN;
        }
      }
      const res = deduce({ state, constraints: rules.map((r) => r.constraint), total: model.totalBlooms });
      state = res.state;
      for (const s of res.steps) steps.push({ ...s, stage });
      stages.push({ stage, visible: [...visible].sort(), determined: state.reduce((n, v) => n + (v !== UNKNOWN ? 1 : 0), 0) });
      const newly = model.creatures.filter((k) => !visible.has(k.id) && k.reveal.length > 0 && k.reveal.every((c) => state[c] !== UNKNOWN));
      if (newly.length === 0) break;
      const allKnown = state.every((v) => v !== UNKNOWN);
      for (const k of newly) { visible.add(k.id); if (allKnown) uselessReveals.push(k.id); }
      stage++;
    }
  } catch (e) {
    if (!(e instanceof Contradiction)) throw e;
    error = { stage, message: e.message };
  }
  const counts = { L1: 0, L2: 0, L3: 0 };
  for (const s of steps) counts[`L${s.level}`]++;
  return {
    state,
    stages,
    steps,
    error,
    finalStage: stage,
    uselessReveals,
    neverRevealed: model.creatures.filter((k) => k.reveal.length > 0 && !visible.has(k.id)).map((k) => k.id),
    allDetermined: state.every((v) => v !== UNKNOWN),
    // Weights L1 = 1, L2 = 3, L3 = 5 (decided). Counts cells resolved per level, so the score grows with size.
    difficulty: { ...counts, score: counts.L1 + 3 * counts.L2 + 5 * counts.L3 },
  };
}
