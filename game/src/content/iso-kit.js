// Scene helpers for the isometric view: assemble a map's drawables from the
// art kit (game/assets/iso, sheet `town` and friends) with calls that mirror
// the SNES layout helpers (act2/common.js: house, pave, lamp, pot, bench), so a
// map's iso scene reads like its compose(). The result is the `{ scene, floor }`
// pair a map carries as `map.iso` (engine README, "Isometric view").
//
//   const S = isoScene();
//   S.floor(0, 5, 32, 8, { kind: 'pave' });                    // walkable paving at z 0
//   S.house(0, 0, 3, 5, { front: '#D#', upper: '#w#', plaster: 'sky', roof: 'hip' });
//   S.stairs(3, 4, { dir: 'down', z: 40 });                    // descends toward the street
//   S.lamp(5, 9);
//   return S.done();                                           // the drawables
//
// Units: tiles for x and y, screen pixels for heights (a storey is 96, a step
// run 40). Drawables: { s, f, x, y, z, fw, fd, layer } with (x, y) the
// footprint's center; layer 0 floors, 0.1 wall faces, 0.2 tops, 1 props.
// See docs/iso-art-direction.md ("The town kit").

const T = 'town';
export const STOREY = 96;

const hash = (x, y, s = 0) => {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const q = (x, y) => `${y % 2 ? 's' : 'n'}${x % 2 ? 'e' : 'w'}`;

/** The floor frame for a kind at (x, y). Kinds: pave, pave_shade, cobble, yard, water. */
export function floorFrame(kind, x, y) {
  if (kind === 'pave') {
    const alt = (((x >> 1) * 7 + (y >> 1) * 13) % 3) === 0 ? 'pave2' : 'pave';
    return `${alt}_${q(x, y)}`;
  }
  if (kind === 'pave_shade') return 'pave_shade';
  if (kind === 'cobble') return `cobble_${Math.floor(hash(x, y, 1) * 4)}`;
  if (kind === 'yard') return `yard_${Math.floor(hash(x, y, 2) * 3)}`;
  if (kind === 'water') return 'water';
  return kind;
}

const FRONT = { '#': 'plain', w: 'window', b: 'window_box', c: 'window_closed', D: 'door', S: 'shop', A: 'arch' };
const UPPER = { '#': 'plain', w: 'window', b: 'window_box', c: 'window_closed', B: 'balcony' };
const SIDE = { '#': 'plain', w: 'window', b: 'window', c: 'window_closed', D: 'door' };
const SIDE_UP = { '#': 'plain', w: 'window', b: 'window', c: 'window_closed', B: 'window' };

export function isoScene() {
  const out = [];
  const heights = new Map(); // walkable tiles' z
  const key = (x, y) => `${x},${y}`;
  const add = (s, f, x, y, z = 0, fw = 1, fd = 1, layer = 1) => { out.push({ s, f, x: x + fw / 2, y: y + fd / 2, z, fw, fd, layer }); };
  const S = {
    add,
    /** A raw prop from any sheet. */
    prop(s, f, x, y, z = 0, fw = 1, fd = 1) { add(s, f, x, y, z, fw, fd, 1); },
    /** A walkable floor at z (or `walk: false` for a floor you can't stand on). */
    floor(x0, y0, w, h, { z = 0, kind = 'pave', walk = true, sheet = T } = {}) {
      for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
        add(sheet, floorFrame(kind, x, y), x, y, z, 1, 1, 0);
        if (walk) heights.set(key(x, y), z); else heights.delete(key(x, y));
      }
    },
    /** One column: south faces then east faces stacked from z0, then a top at its height. */
    column(x, y, z0, south = [], east = [], top = null, sheet = T) {
      let z = z0;
      for (const [f, h] of south) { add(sheet, f, x, y, z, 1, 1, 0.1); z += h; }
      z = z0;
      for (const [f, h] of east) { add(sheet, f, x, y, z, 1, 1, 0.1); z += h; }
      if (top) add(sheet, top[0], x, y, top[1], 1, 1, 0.2);
    },
    /**
     * A house block w×d with its front on the south (row y0+d−1) and its side on the east
     * (column x0+w−1). front: one letter per column for the ground storey (# w b c D S A);
     * upper: a string (or a list, one per storey) for the storeys above (# w b c B); side: one
     * letter per row, north to south, for the east face (# w c D), used on every storey.
     * plaster: white | ochre | rose | sky | sage. roof: 'flat' | 'hip' | 'none'.
     */
    house(x0, y0, w, d, { z = 0, front = '#'.repeat(w), upper = null, storeys = null, side = null, plaster = 'white', roof = 'flat' } = {}) {
      const ups = upper == null ? [] : Array.isArray(upper) ? upper : [upper];
      const n = storeys ?? 1 + ups.length;
      while (ups.length < n - 1) ups.push('#'.repeat(w));
      const H = n * STOREY;
      const sd = side ?? '#'.repeat(d);
      for (let y = y0; y < y0 + d; y++) for (let x = x0; x < x0 + w; x++) {
        const south = [], east = [];
        if (y === y0 + d - 1) {
          south.push([`w_${plaster}_s_${FRONT[front[x - x0]] ?? 'plain'}`, STOREY]);
          for (const u of ups) south.push([`u_${plaster}_s_${UPPER[u[x - x0]] ?? 'plain'}`, STOREY]);
        }
        if (x === x0 + w - 1) {
          const ch = sd[y - y0] ?? '#';
          east.push([`w_${plaster}_e_${SIDE[ch] ?? 'plain'}`, STOREY]);
          for (let i = 1; i < n; i++) east.push([`u_${plaster}_e_${SIDE_UP[ch] ?? 'plain'}`, STOREY]);
        }
        S.column(x, y, z, south, east, roof === 'none' ? null : [`roof_${plaster}`, z + H]);
        heights.delete(key(x, y));
      }
      if (roof === 'hip') S.hipRoof(x0, y0, w, d, z + H);
    },
    /** Terracotta hipped roofs over a block, in pieces of at most 6×6. */
    hipRoof(x0, y0, w, d, z) {
      for (let y = y0; y < y0 + d; y += 6) for (let x = x0; x < x0 + w; x += 6) {
        const pw = Math.min(6, x0 + w - x), pd = Math.min(6, y0 + d - y);
        add(T, `hip_${pw}x${pd}`, x, y, z, pw, pd, 1);
      }
    },
    /** A raised floor at z over a block, with its exposed south and east faces down to `base`. */
    terrace(x0, y0, w, d, { z, base = 0, kind = 'pave', face = 'retain', walk = true } = {}) {
      const courses = Math.max(0, Math.ceil((z - base) / 40));
      const start = z - courses * 40;
      for (let y = y0; y < y0 + d; y++) for (let x = x0; x < x0 + w; x++) {
        const south = y === y0 + d - 1 ? Array.from({ length: courses }, () => [`${face}_s`, 40]) : [];
        const east = x === x0 + w - 1 ? Array.from({ length: courses }, () => [`${face}_e`, 40]) : [];
        S.column(x, y, start, south, east, null);
      }
      S.floor(x0, y0, w, d, { z, kind, walk });
    },
    /** One tile of stairs descending in `dir` (down = toward +y, right = +x…), from z at its high edge. */
    stairs(x, y, { dir = 'down', z = 40, walk = true } = {}) {
      add(T, `stairs_${dir}`, x, y, z - 40, 1, 1, 0.3);
      if (walk) heights.set(key(x, y), z - 20);
    },
    lamp(x, y, z = 0, { lit = false } = {}) { add(T, lit ? 'lamp_lit' : 'lamp', x, y, z); },
    bench(x, y, z = 0) { add(T, 'bench', x, y, z, 2, 1); },
    /** A pot: pot(x, y, kind?, z?) — kind 'pot_geranium' (default) or 'pot_bay'. */
    pot(x, y, kind = 'pot_geranium', z = 0) { if (typeof kind === 'number') [kind, z] = [typeof z === 'string' ? z : 'pot_geranium', kind]; add(T, kind, x, y, z); },
    /** The roofs of the houses below a street's edge (cistern's lowhouse props), from x0 for w tiles. */
    lowRoofs(x0, y0, w, { z = -80, skip = [] } = {}) {
      const kinds = ['lowhouse_terra_3x2', 'lowhouse_flat_2x2', 'lowhouse_flat_3x2', 'lowhouse_terra_2x2'];
      const narrower = { 3: ['lowhouse_flat_3x2', 'lowhouse_terra_3x2'], 2: ['lowhouse_flat_2x2', 'lowhouse_terra_2x2'], 1: ['lowhouse_flat_1x2', 'lowhouse_terra_1x2'] };
      let x = x0, i = 0;
      while (x < x0 + w) {
        if (skip.includes(x)) { x++; continue; }
        const k0 = kinds[(i++ + x0) % kinds.length];
        let kw = k0.includes('3x2') ? 3 : 2;
        // Narrow the house until it fits before the next gap or the map's edge (down to one tile).
        while (kw > 1 && (skip.some((s) => s >= x && s < x + kw) || x + kw > x0 + w)) kw--;
        const k = kw === (k0.includes('3x2') ? 3 : 2) ? k0 : narrower[kw][i % 2];
        add('cistern', k, x, y0, z - 60, kw, 2, 1);
        x += kw;
      }
    },
    /**
     * The SNES house() call, replayed: house(L, x0, y0, { top, mid, base, roofRows, palette })
     * from act2/common.js becomes a block w = top.length wide and roofRows + (mid ? 1 : 0) + 2
     * deep, its ground storey from `top`, an upper storey from `mid`, its plaster from `palette`.
     * `iso` adds what the SNES call can't say: { z, roof, side }.
     */
    snesHouse(x0, y0, { top, mid = null, roofRows = 1, palette = null } = {}, iso = {}) {
      const plaster = { white_sage: 'sage', sky: 'sky', ochre: 'ochre', rose: 'rose' }[palette] || 'white';
      const d = roofRows + (mid ? 1 : 0) + 2;
      S.house(x0, y0, top.length, d, { front: top, upper: mid ? [mid] : [], plaster, roof: 'flat', ...iso });
    },
    /**
     * Replay a list of recorded layout calls ({ fn, args } with fn one of house, lamp, pot, bench),
     * as layout() could record them, with per-call iso extras from `extra(call, i)`.
     */
    replay(calls, extra = () => ({})) {
      calls.forEach((c, i) => {
        const e = extra(c, i) || {};
        // house args as layout() records them, [x0, y0, opts], or as house() takes them, [L, x0, y0, opts].
        if (c.fn === 'house') { const [x0, y0, o] = typeof c.args[0] === 'number' ? c.args : c.args.slice(1); S.snesHouse(x0, y0, o, e); }
        else if (c.fn === 'lamp') S.lamp(c.args[0], c.args[1], e.z ?? 0, e);
        else if (c.fn === 'pot') S.pot(c.args[0], c.args[1], c.args[2] ?? 'pot_geranium', e.z ?? 0);
        else if (c.fn === 'bench') S.bench(c.args[0], c.args[1], e.z ?? 0);
      });
    },
    /**
     * A room, cut away as the era drew rooms (sheet `rooms`). The floor covers x0…x0+w−1 by
     * y0…y0+h−1; the north wall stands on row y0−1 and the west wall on column x0−1, both at full
     * height showing their inner faces; the south wall (row y0+h) and the east wall (column x0+w)
     * are 16 px stubs. set: shop | archive | crypt | lamp. doors and windows: [[x, y]] on any of
     * those wall tiles (windows only on the north and west walls; a door in a stub is a threshold,
     * walkable). floor: a frame name to use for every floor tile instead of the set's.
     */
    room(x0, y0, w, h, { set = 'shop', z = 0, doors = [], windows = [], floor = null } = {}) {
      const R = 'rooms';
      const has = (list, x, y) => list.some(([a, b]) => a === x && b === y);
      const kind = (x, y) => (has(doors, x, y) ? 'door' : has(windows, x, y) ? 'window' : 'plain');
      for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
        add(R, floor ?? `${set}_floor_${hash(x, y, 5) < 0.3 ? 1 : 0}`, x, y, z, 1, 1, 0);
        heights.set(key(x, y), z);
      }
      // The back walls and their cut tops.
      add(R, `${set}_corner`, x0 - 1, y0 - 1, z, 1, 1, 0.1);
      add('flat', 'wall_cap_corner', x0 - 1, y0 - 1, z, 1, 1, 0.2);
      for (let x = x0; x < x0 + w; x++) {
        add(R, `${set}_s_${kind(x, y0 - 1)}`, x, y0 - 1, z, 1, 1, 0.1);
        add('flat', 'wall_cap_s', x, y0 - 1, z, 1, 1, 0.2);
        heights.delete(key(x, y0 - 1));
      }
      for (let y = y0; y < y0 + h; y++) {
        add(R, `${set}_e_${kind(x0 - 1, y)}`, x0 - 1, y, z, 1, 1, 0.1);
        add('flat', 'wall_cap_e', x0 - 1, y, z, 1, 1, 0.2);
        heights.delete(key(x0 - 1, y));
      }
      // The near walls, cut to stubs; a door is a threshold on a floor tile.
      const stub = (x, y, dir) => {
        const door = has(doors, x, y);
        if (door) { add(R, `${set}_floor_0`, x, y, z, 1, 1, 0); heights.set(key(x, y), z); } else heights.delete(key(x, y));
        add(R, `${set}_cut_${door ? 'door_' : ''}${dir}`, x, y, z);
      };
      for (let x = x0; x < x0 + w; x++) stub(x, y0 + h, 'x');
      for (let y = y0 - 1; y < y0 + h; y++) stub(x0 + w, y, 'y');
      add(R, `${set}_cut_corner`, x0 + w, y0 + h, z);
      heights.delete(key(x0 + w, y0 + h));
    },
    /** Where characters stand: z for each walkable tile recorded, else `fallback`. */
    floorHeight(fallback = 0) { const m = new Map(heights); return (x, y) => m.get(key(x, y)) ?? fallback; },
    done() { return out; },
  };
  return S;
}
