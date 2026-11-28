// The Hundred Steps in the isometric view (map: steps.js, 16 × 42). Four
// flights down the hill, each tile dropping 40 px in five steps
// (act2_landmarks:steps_l/_r), between four landings. Between the landings are
// the houses facing down the hill, built into it: each block stands on the
// landing below and its roof sits two storeys up, under the retaining wall of
// the landing above. The houses' fronts, the pots and the bench are steps.js's
// own layout calls replayed with the town kit (../iso-kit.js).
//
// Heights (px), from the bottom: landing 4 (rows 38-40) at 0; flight 4
// (x4-5, rows 29-37) up to landing 3 (rows 26-28) at 360; flight 3 (x9-10,
// rows 20-25) to landing 2 (rows 16-18, and the hollow step at (9-10, 19)) at
// 600; flight 2 (x2-3, rows 10-15) to landing 1 (rows 7-9) at 840; flight 1
// (x6-7, rows 0-6) up to Lamp Street, 1120 at row 0.

import { isoScene } from '../iso-kit.js';
import { composeSteps, STEPS_LAYOUT } from './steps.js';

const W = 16;
const LM = 'act2_landmarks';
const { FLIGHTS, MOON_RISERS, MOON_PAVING } = STEPS_LAYOUT;

// Each flight: its top height at its first row, and the landing (band base) at its foot.
const FLIGHT_TOP = { 0: 1120, 10: 840, 20: 600, 29: 360 };
const FOOT = { 0: 840, 10: 600, 20: 360, 29: 0 };
// Landings: rows, height, the retaining row along each one's lower edge, and how low
// its retaining wall goes (to the roofs of the houses below, two storeys up from their landing).
const LANDINGS = [[7, 9, 840, 10, 792], [16, 18, 600, 19, 552], [26, 28, 360, 29, 192], [38, 40, 0, null, 0]];

// Each house() call in steps.js, by its west column and row: the block it
// becomes here (rows y0..y0+d-1, standing on the landing below at z).
const HOUSE_BLOCKS = {
  '0,5': { y0: 0, d: 7, z: 840 }, '9,5': { y0: 0, d: 7, z: 840 },
  '5,12': { y0: 11, d: 5, z: 600 },
  '0,22': { y0: 20, d: 6, z: 360 }, '12,22': { y0: 20, d: 6, z: 360 },
  '0,34': { y0: 30, d: 8, z: 0 }, '7,34': { y0: 30, d: 8, z: 0 },
};
const PLASTER = { white_sage: 'sage', sky: 'sky', ochre: 'ochre', rose: 'rose' };

const landingZ = (y) => (y <= 10 ? 840 : y <= 19 ? 600 : y <= 29 ? 360 : 0);
const flightAt = (x, y) => FLIGHTS.find(([fx, y0, y1]) => (x === fx || x === fx + 1) && y >= y0 && y <= y1);
const stairZ = (y0, y) => FLIGHT_TOP[y0] - (y - y0) * 40; // the tile's high edge

function build(g) {
  const S = isoScene();
  const { calls } = composeSteps(g);
  const flag = (f) => !!(g && g.flag && g.flag(f));

  // ---- The landings, raised on their retaining walls; the retaining rows are their lower edges.
  for (const [y0, y1, z, edge, base] of LANDINGS) {
    S.terrace(0, y0, W, y1 - y0 + 1, { z, base });
    if (edge != null) {
      // The edge row, minus the flight that starts in it and the hollow step.
      let x = 0;
      while (x < W) {
        if (flightAt(x, edge) || (edge === 19 && (x === 9 || x === 10))) { x++; continue; }
        let x1 = x;
        while (x1 + 1 < W && !flightAt(x1 + 1, edge) && !(edge === 19 && (x1 + 1 === 9 || x1 + 1 === 10))) x1++;
        S.terrace(x, edge, x1 - x + 1, 1, { z, base, walk: false });
        x = x1 + 1;
      }
    }
  }
  for (const [x, y] of MOON_PAVING) S.add('town', 'pave_moon_eye', x, y, landingZ(y), 1, 1, 0);

  // ---- The hollow step (9-10, 19), flush with landing 2: wet in the joint, then open.
  // Boarded over from Act 4 on (MIND THE STEP), with 100! chalked on it in the epilogue.
  const open = flag('step.open');
  const boarded = open && (flag('act4.started') || flag('epilogue'));
  const lid = flag('epilogue') ? 'lid_chalked' : 'lid_boarded';
  const [hl, hr] = boarded ? [`${lid}_l`, `${lid}_r`] : open ? ['hollow_open_l', 'hollow_open_r'] : ['hollow_wet_l', 'hollow_wet_r'];
  S.floor(9, 19, 1, 1, { z: 600, kind: hl, sheet: LM });
  S.floor(10, 19, 1, 1, { z: 600, kind: hr, sheet: LM });

  // ---- The flights, and the walls beside them (the SNES ledges) at each step's height.
  for (const [fx, y0, y1] of FLIGHTS) {
    for (let y = y0; y <= y1; y++) {
      const z = stairZ(y0, y);
      for (const x of [fx, fx + 1]) S.stairs(x, y, { dir: 'down', z });
      if (y > y0 || y0 === 0) {
        const foot = FOOT[y0];
        const courses = (n) => Array.from({ length: n }, () => ['retain_e', 40]);
        const n = Math.max(1, Math.ceil((z - foot) / 40));
        S.column(fx - 1, y, z - n * 40, [], courses(n), ['pave_nw', z]);
        S.column(fx + 2, y, z - n * 40, y === y1 ? Array.from({ length: n }, () => ['retain_s', 40]) : [], [], ['pave_nw', z]);
        S.prop('cistern', 'parapet_y', fx - 1, y, z); S.prop('cistern', 'parapet_y', fx + 2, y, z);
      }
    }
  }
  // Flight 2's walls run on past the houses (x1 and x4, rows 11-15) in the SNES; the flight's own walls do here.

  // ---- The houses between the landings, facing down the hill (steps.js's house() calls).
  for (const c of calls.filter((c) => c.fn === 'house')) {
    const [x0, y0, { top, palette }] = c.args;
    const b = HOUSE_BLOCKS[`${x0},${y0}`];
    if (!b) continue;
    S.house(x0, b.y0, top.length, b.d, { z: b.z, front: top, storeys: 2, plaster: PLASTER[palette] || 'white', roof: 'flat' });
  }
  // The block west of flight 2 (x0, rows 11-15).
  S.house(0, 11, 1, 5, { z: 600, storeys: 2, plaster: 'white', roof: 'flat' });

  // ---- The view parapet on landing 3's east edge.
  for (let y = 26; y <= 28; y++) S.prop('cistern', 'parapet_y', 15, y, 360);

  // ---- The south edge, a low wall with the way through to Fountain Square at x6-7. (A
  // full storey here would stand in front of landing 4 and hide it, at the map's near edge.)
  for (let x = 0; x < W; x++) {
    if (x === 6 || x === 7) continue;
    S.column(x, 41, 0, [], [], ['pave_nw', 0]);
    S.prop('cistern', 'parapet_x', x, 41, 0);
  }
  S.floor(6, 41, 2, 1, { kind: 'pave_shade' });

  // ---- Pots and the bench, on their landings.
  S.replay(calls.filter((c) => c.fn !== 'house'), (c) => ({ z: landingZ(c.args[1]) }));

  // The flights' steps are the landmark's (moon-eyes in some risers), not the kit's plain stairs.
  return S.done().map((d) => {
    if (d.s !== 'town' || d.f !== 'stairs_down') return d;
    const x = Math.floor(d.x), y = Math.floor(d.y);
    const f = flightAt(x, y);
    if (!f) return d;
    const moon = MOON_RISERS.some(([mx, my]) => mx === f[0] && my === y) ? '_moon' : '';
    return { ...d, s: LM, f: `steps${moon}_${x === f[0] ? 'l' : 'r'}` };
  });
}

// Floor heights: the landings, the hollow step and the flights (built once; they don't change).
function floorOf() {
  const S = isoScene();
  for (const [y0, y1, z] of LANDINGS) S.floor(0, y0, W, y1 - y0 + 1, { z });
  S.floor(9, 19, 2, 1, { z: 600 });
  S.floor(6, 41, 2, 1, { z: 0 });
  for (const [fx, y0, y1] of FLIGHTS) for (let y = y0; y <= y1; y++) for (const x of [fx, fx + 1]) S.stairs(x, y, { z: stairZ(y0, y) });
  return S.floorHeight(0);
}
// follows: the flags whose changes to the map this scene draws itself (the hollow step's states).
export const stepsIso = { scene: (g) => build(g), floor: floorOf(), follows: ['step.open', 'counter.left', 'act4.started', 'epilogue'] };
