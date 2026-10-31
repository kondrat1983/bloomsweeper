// Cell outlines are closed polygons in SVG user units.
// Supported path syntax: absolute M, L, H, V and Z, one closed subpath per cell.

const EPS = 1e-9;

export function parseClosedPolygon(d) {
  const tokens = String(d).trim().match(/[A-Za-z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) || [];
  const pts = [];
  let cmd = null;
  let closed = false;
  let i = 0;
  const num = () => {
    const v = Number(tokens[i++]);
    if (!Number.isFinite(v)) throw new Error('bad number in path');
    return v;
  };
  while (i < tokens.length) {
    const t = tokens[i];
    if (/^[A-Za-z]$/.test(t)) {
      i++;
      cmd = t;
      if (cmd === 'Z' || cmd === 'z') { closed = true; continue; }
      if (!'MLHV'.includes(cmd)) throw new Error(`unsupported path command "${cmd}" (use absolute M, L, H, V, Z)`);
      continue;
    }
    if (closed) throw new Error('path continues after Z');
    if (cmd === 'M' || cmd === 'L') {
      if (cmd === 'M' && pts.length > 0) throw new Error('implicit repeats after M are not supported; write L');
      pts.push([num(), num()]);
    } else if (cmd === 'H') {
      if (!pts.length) throw new Error('H before any point');
      pts.push([num(), pts[pts.length - 1][1]]);
    } else if (cmd === 'V') {
      if (!pts.length) throw new Error('V before any point');
      pts.push([pts[pts.length - 1][0], num()]);
    } else {
      throw new Error('path must start with M');
    }
  }
  if (!closed) throw new Error('cell path must end with Z');
  if (pts.length > 1 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]) pts.pop();
  if (pts.length < 3) throw new Error('cell needs at least 3 points');
  return pts;
}

export function area(poly) {
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    s += x1 * y2 - x2 * y1;
  }
  return Math.abs(s) / 2;
}

export function centroid(poly) {
  let s = 0, cx = 0, cy = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    const f = x1 * y2 - x2 * y1;
    s += f;
    cx += (x1 + x2) * f;
    cy += (y1 + y2) * f;
  }
  if (Math.abs(s) < EPS) {
    const n = poly.length;
    return [poly.reduce((a, p) => a + p[0], 0) / n, poly.reduce((a, p) => a + p[1], 0) / n];
  }
  return [cx / (3 * s), cy / (3 * s)];
}

export function bbox(poly) {
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  return { x0, y0, x1, y1, width: x1 - x0, height: y1 - y0 };
}

const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

function pointSegment(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

function properCross(a, b, c, d) {
  const d1 = cross(c, d, a), d2 = cross(c, d, b), d3 = cross(a, b, c), d4 = cross(a, b, d);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

function insidePolygon(p, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// Smallest distance between the outlines of two polygons. 0 when they overlap or one contains the other.
export function distance(A, B) {
  for (let i = 0; i < A.length; i++) {
    const a1 = A[i], a2 = A[(i + 1) % A.length];
    for (let j = 0; j < B.length; j++) {
      if (properCross(a1, a2, B[j], B[(j + 1) % B.length])) return 0;
    }
  }
  if (insidePolygon(A[0], B) || insidePolygon(B[0], A)) return 0;
  let best = Infinity;
  for (const p of A) {
    for (let j = 0; j < B.length; j++) best = Math.min(best, pointSegment(p, B[j], B[(j + 1) % B.length]));
  }
  for (const q of B) {
    for (let i = 0; i < A.length; i++) best = Math.min(best, pointSegment(q, A[i], A[(i + 1) % A.length]));
  }
  return best;
}
