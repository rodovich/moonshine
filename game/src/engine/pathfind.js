// A* on the tile grid, 4-directional. Paths prefer fewer turns, so walking
// looks deliberate rather than zig-zaggy.
//
// findPath(start, goals, blocked, w, h) -> [[x,y], ...] excluding start, or
//   null if no goal is reachable. `goals` is a list of [x,y]; `blocked(x,y)`
//   says whether a tile can be entered (goals are tested with it too).
// nearestReachable(start, target, blocked, w, h) -> the reachable tile closest
//   to target (straight-line), ties broken by walking distance.

const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const TURN_COST = 0.01;

class Heap {
  constructor() { this.a = []; }
  get size() { return this.a.length; }
  push(n) {
    const a = this.a;
    a.push(n);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p].f <= n.f) break;
      a[i] = a[p];
      i = p;
    }
    a[i] = n;
  }
  pop() {
    const a = this.a;
    const top = a[0];
    const last = a.pop();
    if (a.length) {
      let i = 0;
      const n = a.length;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        let mf = last.f;
        if (l < n && a[l].f < mf) { m = l; mf = a[l].f; }
        if (r < n && a[r].f < mf) { m = r; }
        if (m === i) break;
        a[i] = a[m];
        i = m;
      }
      a[i] = last;
    }
    return top;
  }
}

export function findPath(start, goals, blocked, w, h, maxNodes = 20000) {
  if (!goals.length) return null;
  const goalSet = new Set(goals.map(([x, y]) => y * w + x));
  const [sx, sy] = start;
  if (goalSet.has(sy * w + sx)) return [];
  const hfn = (x, y) => {
    let best = Infinity;
    for (const [gx, gy] of goals) {
      const d = Math.abs(gx - x) + Math.abs(gy - y);
      if (d < best) best = d;
    }
    return best;
  };
  const g = new Map();
  const parent = new Map();
  const open = new Heap();
  const startKey = sy * w + sx;
  g.set(startKey, 0);
  open.push({ x: sx, y: sy, k: startKey, g: 0, f: hfn(sx, sy), dir: -1 });
  const closed = new Set();
  let expanded = 0;
  while (open.size) {
    const cur = open.pop();
    if (closed.has(cur.k)) continue;
    closed.add(cur.k);
    if (goalSet.has(cur.k)) {
      const path = [];
      let k = cur.k;
      while (k !== startKey) {
        path.push([k % w, Math.floor(k / w)]);
        k = parent.get(k);
      }
      return path.reverse();
    }
    if (++expanded > maxNodes) break;
    for (let d = 0; d < 4; d++) {
      const nx = cur.x + DIRS[d][0];
      const ny = cur.y + DIRS[d][1];
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const nk = ny * w + nx;
      if (closed.has(nk)) continue;
      if (blocked(nx, ny)) continue;
      const ng = cur.g + 1 + (cur.dir !== -1 && cur.dir !== d ? TURN_COST : 0);
      if (ng < (g.get(nk) ?? Infinity)) {
        g.set(nk, ng);
        parent.set(nk, cur.k);
        open.push({ x: nx, y: ny, k: nk, g: ng, f: ng + hfn(nx, ny), dir: d });
      }
    }
  }
  return null;
}

export function nearestReachable(start, target, blocked, w, h) {
  const [sx, sy] = start;
  const [tx, ty] = target;
  const dist = new Map([[sy * w + sx, 0]]);
  const queue = [[sx, sy]];
  let best = [sx, sy];
  let bestScore = (sx - tx) ** 2 + (sy - ty) ** 2;
  let bestDist = 0;
  for (let qi = 0; qi < queue.length; qi++) {
    const [x, y] = queue[qi];
    const d0 = dist.get(y * w + x);
    for (const [dx, dy] of DIRS) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const k = ny * w + nx;
      if (dist.has(k) || blocked(nx, ny)) continue;
      dist.set(k, d0 + 1);
      queue.push([nx, ny]);
      const score = (nx - tx) ** 2 + (ny - ty) ** 2;
      if (score < bestScore || (score === bestScore && d0 + 1 < bestDist)) {
        best = [nx, ny];
        bestScore = score;
        bestDist = d0 + 1;
      }
    }
  }
  return best;
}
