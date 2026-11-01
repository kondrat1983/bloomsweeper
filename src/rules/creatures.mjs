import { reachWithin } from './cells.mjs';

export const CREATURE_TYPES = ['bee', 'rabbit', 'fox'];

// Creatures sit on a cell, which is always GREEN (GDD section 4.4).
// Returns the forced GREEN cell and one clue: `bloom` BLOOM cells among `cells`.
export function creatureRule(creature, adjacency) {
  const { id, type, cell } = creature;
  if (!CREATURE_TYPES.includes(type)) throw new Error(`unknown creature type ${type}`);
  let cells, bloom;
  if (type === 'bee') {
    if (!Number.isInteger(creature.n) || creature.n < 0) throw new Error(`bee ${id} needs an integer n >= 0`);
    cells = adjacency[cell].slice();
    bloom = creature.n;
  } else if (type === 'rabbit') {
    cells = [cell, ...adjacency[cell]];
    bloom = 0;
  } else {
    cells = reachWithin(adjacency, cell, 2);
    bloom = 0;
  }
  return {
    green: [cell],
    constraint: { source: id, cells: [...new Set(cells)].sort((a, b) => a - b), bloom },
  };
}
