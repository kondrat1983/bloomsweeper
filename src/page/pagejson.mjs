import { BLOOM } from '../rules/cells.mjs';
import { TOOL_VERSION } from '../limits.mjs';

const r2 = (x) => Math.round(x * 100) / 100;

// Generated page.json (SPEC section 3). Never edited by hand.
export function buildPageJson(model, analysis) {
  const cells = model.cells.map((c) => ({
    id: c.id,
    kind: c.kind,
    centroid: [r2(c.centroid[0]), r2(c.centroid[1])],
    bbox: [r2(c.bbox.x0), r2(c.bbox.y0), r2(c.bbox.x1), r2(c.bbox.y1)],
    area: r2(c.area),
  }));
  const adjacency = {};
  model.cells.forEach((c, i) => { adjacency[c.id] = model.adjacency[i].map((j) => model.cells[j].id); });
  const creatures = model.creatures.map((k) => ({
    id: k.id,
    type: k.type,
    cell: model.cells[k.cell].id,
    ...(k.type === 'bee' ? { n: k.n } : {}),
    reveal: k.reveal.map((c) => model.cells[c].id),
  }));
  const solution = model.solution
    ? Object.fromEntries(model.cells.map((c, i) => [c.id, model.solution[i] === BLOOM ? 'BLOOM' : 'GREEN']))
    : null;
  return {
    cells,
    adjacency,
    creatures,
    solution,
    stages: analysis.stages.map((s) => ({ stage: s.stage, visible: s.visible, determined: s.determined })),
    difficulty: analysis.difficulty,
    validated: { tool: TOOL_VERSION, date: new Date().toISOString().slice(0, 10) },
  };
}
