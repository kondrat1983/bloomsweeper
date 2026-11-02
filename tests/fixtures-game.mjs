// Tiny page in page.json shape, used by game tests.
// Cells: a - b - c in a row, d touches c, e touches d. Bee on b (n 1), rabbit on e, hidden bee on d.
export function tinyPage() {
  return {
    cells: ['a', 'b', 'c', 'd', 'e'].map((id, i) => ({ id, kind: id === 'b' || id === 'd' || id === 'e' ? 'leaf' : 'flower', centroid: [i * 100, 0] })),
    adjacency: { a: ['b'], b: ['a', 'c'], c: ['b', 'd'], d: ['c', 'e'], e: ['d'] },
    creatures: [
      { id: 'k01', type: 'bee', cell: 'b', n: 1, reveal: [] },
      { id: 'k02', type: 'rabbit', cell: 'e', reveal: [] },
      { id: 'k03', type: 'bee', cell: 'd', n: 1, reveal: ['c', 'e'] },
    ],
    solution: { a: 'BLOOM', b: 'GREEN', c: 'GREEN', d: 'GREEN', e: 'GREEN' },
    total: 1,
  };
}
