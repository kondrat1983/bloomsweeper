import { BLOOM, GREEN } from '../rules/cells.mjs';

const LINES_STYLE = '<style>path[data-kind]{fill:#fffaf0;stroke:#1f1d1a;stroke-width:1.6;stroke-linejoin:round;stroke-linecap:round}</style>';
const PATTERNS = `<defs>
<pattern id="bloomDots" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#fbe3ea"/><circle cx="8" cy="8" r="3" fill="#d9557a"/></pattern>
<pattern id="greenHatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="12" height="12" fill="#e4f1dc"/><line x1="0" y1="0" x2="0" y2="12" stroke="#5f9a55" stroke-width="3"/></pattern>
</defs>`;

// Three states of a page as SVG strings (SPEC section 5): lines, clues, painted.
export function previewStates(model) {
  const head = model.svgText.match(/<svg\b[^>]*>/)[0];
  const end = model.svgText.lastIndexOf('</svg>');
  const body = model.svgText.slice(head.length, end);
  const wrap = (extra, overlay = '') => `${head}${extra}${body}${overlay}</svg>\n`;

  const badges = model.creatures.map((k) => {
    const [x, y] = model.cells[k.cell].centroid;
    const label = k.type === 'bee' ? String(k.n) : k.type === 'rabbit' ? 'R' : 'F';
    return `<g class="badge" data-for="${k.id}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="26" fill="#fffaf0" stroke="#1f1d1a" stroke-width="2"/><text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="30" text-anchor="middle" dominant-baseline="central" font-family="sans-serif" fill="#1f1d1a">${label}</text></g>`;
  }).join('\n');

  const rules = model.solution
    ? model.cells.map((c, i) => `#${c.id}{fill:url(#${model.solution[i] === BLOOM ? 'bloomDots' : 'greenHatch'})}`).join('')
    : '';

  return {
    lines: wrap(LINES_STYLE),
    clues: wrap(LINES_STYLE, `\n${badges}\n`),
    painted: wrap(`${LINES_STYLE}${PATTERNS}<style>${rules}</style>`),
  };
}
