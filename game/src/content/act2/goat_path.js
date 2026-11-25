// The Goat Path (16 × 42, three screens tall): a natural cliff path down the
// Back, the steep west side of the island, from Lamp Street's west gate (top
// right) to the west end of the Bilge's south quay (bottom right). Irregular
// switchbacks over bare rock and gorse, rough steps where it's steep, Mott's
// shack partway down, the sea cave mouth at the waterline near the bottom.
// From docs/design/structure-pass.md, section 5, and docs/design/02-city.md.
// Art: the art task's painted cliff (GOAT_PATH_TILES in game/src/art/act2b_goat.js).

import { composedMap, blankGrid } from '../opening/grid.js';
import { act2Tiles } from './tiles.js';
import { layout, pave, bump, firstMeet, cherylDeclines, actWrongness } from './common.js';
import { goat, GOAT_PATH_TILES } from '../../art/act2b_goat.js';

const W = 16, H = 42;

// The path, as rectangles [x0, y0, x1, y1] (inclusive), top to bottom.
const PATH = [
  [11, 1, 15, 3],  // the top landing, in from Lamp Street's west gate (x15)
  [2, 2, 15, 3],   // the first leg, west, two wide
  [2, 4, 3, 7],    // rough steps down
  [2, 8, 13, 8],   // east, along a ledge
  [12, 9, 13, 9],  // round the outcrop
  [10, 10, 14, 11], // a wider stretch (a goat grazes here)
  [13, 12, 14, 14], // down
  [6, 15, 14, 15], // west, half the width, to Mott's yard
  [2, 16, 8, 17],  // Mott's yard, in front of his shack (2-5, 12-15)
  [2, 18, 3, 21],  // rough steps down beside the drop
  [2, 22, 14, 22], // the long leg east from the hairpin viewpoint
  [13, 23, 14, 25], // down
  [3, 26, 14, 26], // west
  [3, 27, 4, 28],  // down
  [3, 29, 12, 29], // east, round another outcrop
  [11, 30, 12, 31], // down
  [4, 32, 12, 32], // west
  [4, 33, 5, 33],  // a short drop
  [4, 34, 13, 34], // east again
  [12, 35, 13, 35], // down
  [2, 36, 13, 36], // west, to the waterline
  [2, 37, 3, 38],  // rough steps down to the sea cave
  [2, 39, 15, 41], // the last stretch east, onto the Bilge's quay (x15)
];
const STEPS = [[2, 4, 3, 7], [2, 18, 3, 21], [2, 37, 3, 38], [13, 12, 14, 14], [13, 23, 14, 25], [3, 27, 4, 28], [11, 30, 12, 31]];
const inRect = ([x0, y0, x1, y1], x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
const isPath = (x, y) => PATH.some((r) => inRect(r, x, y));
// The sea: the island's west face, wider toward the bottom, and a cove by the cave.
const seaEdge = (y) => (y < 12 ? 1 : y < 30 ? 1 : 1);
const isSea = (x, y) => !isPath(x, y) && (x <= seaEdge(y) || (y >= 39 && x <= 1));
const SHACK = [2, 12]; // top-left of Mott's shack (4 × 4)
const JUGS = [[7, 14], [8, 14]];
const CAVE = [1, 37];

function compose() {
  const L = layout(W, H, blankGrid);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const walk = isPath(x, y);
    const frame = GOAT_PATH_TILES[y][x];
    if (y >= 39 && x >= 9 && walk) L.set('ground', x, y, pave(x, y), false); // the Bilge's own paving
    else if (frame) L.set('ground', x, y, frame, !walk);
    else L.set('ground', x, y, pave(x, y), !walk);
    if (walk && STEPS.some((r) => inRect(r, x, y))) L.step[y][x] = 'step_stairs';
  }
  // Mott's shack: the still glints in its window; the door (3, 15) has his sign.
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) L.set('ground', SHACK[0] + c, SHACK[1] + r, `mott_shack:shack_x${c}y${r}`, true);
  // Empty square jugs, stacked by the yard.
  L.set('detail', JUGS[0][0], JUGS[0][1], 'mott_jugs:jugs_l', true); L.set('detail', JUGS[1][0], JUGS[1][1], 'mott_jugs:jugs_r', true);
  // Gulls wheeling over the drop, below the path.
  for (const [x, y] of [[0, 5], [0, 13], [0, 19]]) L.set('detail', x, y, 'gull:wheel');
  return L.done();
}

// ---------------------------------------------------------------------------
// Objects

const objects = [
  { id: 'shack_door', x: 3, y: 14, h: 2, look: "Mott's shack. A sign: GONE FERRYING. Underneath, in different ink: (NOT REALLY)." },
  { id: 'shack_window', x: 4, y: 14, h: 2, look: "Through the window: a still. A copper coil, polished like a trophy. It's the only thing in there he dusts." },
  { id: 'shack_side', x: 5, y: 14, h: 2, lookKey: 'shack_window', look: "Through the window: a still. A copper coil, polished like a trophy. It's the only thing in there he dusts." },
  { id: 'jugs', x: JUGS[0][0], y: JUGS[0][1], w: 2, look: "Empty jugs. Lots of them. Square. Mott's." },
  {
    id: 'sea_cave', x: CAVE[0], y: CAVE[1],
    looks: [
      ["A sea cave under the cliff. The tide's in, and the water goes right to the back.", 'Something down there catches the light. Brass, maybe.'],
      "The tide's in. I'm not swimming. Not today.",
    ],
  },
  {
    // The hairpin halfway down, looking west.
    id: 'viewpoint', x: 1, y: 21, h: 2,
    look: "From the hairpin: the whole open Bowl, all the way to the western Rim. You can't see the Gate from here. It's very restful.",
  },
  ...[[0, 1, 2, 20], [0, 23, 2, 14]].map(([x, y, w, h], i) => ({
    id: `view_${i}`, x, y, w, h, lookKey: 'goat_view',
    look: 'The back of the island. Cliff, goats, sea. Gulls wheeling below me, which is wrong, but there it is.',
  })),
  { id: 'roofs', x: 14, y: 28, w: 2, h: 11, look: "The lower town's roofs, nearly at eye level now. Somebody's basin is still out, still full." },
].map((o) => ({ solid: false, use: { '*': cherylDeclines }, ...o }));

// The sea cave takes the crowbar and the rest with the same shrug.
objects.find((o) => o.id === 'sea_cave').use = { '*': (g) => g.describe("The tide's in. I'm not swimming. Not today.") };

// ---------------------------------------------------------------------------
// Goats: they wander where the path is wide enough to walk round them.

const goats = [
  { id: 'goat_1', x: 12, y: 10, area: [10, 10, 5, 2], sprite: { sheet: goat } },
  { id: 'goat_2', x: 6, y: 17, area: [2, 16, 7, 2], sprite: { sheet: goat, palette: 'brown' } },
].map((d) => ({
  id: d.id, name: 'Goat', x: d.x, y: d.y,
  sprite: d.sprite, kind: 'npc',
  behavior: { type: 'wander', area: d.area, pause: [1.5, 4] },
  interact: async (g, self) => {
    g.sfx('goat');
    if (bump(g, 'goat.look') === 0) await g.describe("A goat. It's eating the gorse and making eye contact.");
    await g.say(self, 'Meh.');
  },
  use: {
    '*': async (g, self) => {
      g.sfx('goat');
      await g.say(self, 'Meh.');
      await g.describe('No.');
    },
  },
}));

// ---------------------------------------------------------------------------

export const goatPathMap = composedMap(compose, {
  id: 'goat_path',
  name: 'The Goat Path',
  tileset: act2Tiles,
  music: 'harbor',
  lighting: 'day',
  ambience: ['goatpath'],
  step: 'step_stone',
  spawn: [14, 2],
  exits: [
    // Top right: back up to Lamp Street's west gate (0, 9–11).
    { x: 15, y: 1, h: 3, to: 'lamp_street', at: [1, 9], facing: 'right', sfx: 'step_stone' },
    // Bottom right: onto the west end of the Bilge's south quay (0, 11–13).
    { x: 15, y: 39, h: 3, to: 'bilge', at: [1, 11], facing: 'right', sfx: 'step_stone' },
  ],
  onEnter: async (g) => { actWrongness(g); },
  ambient: [
    // Now and then a goat stops to eat.
    {
      every: [4, 8],
      run: (g) => {
        const id = g.random(0, 1) ? 'goat_1' : 'goat_2';
        const e = g.npc(id);
        if (!e || e.moving || e.pose) return;
        if (e.facing === 'up') e.facing = 'down';
        g.pose(e, 'eat');
        if (g.random(0, 2) === 0) g.sfx('goat', { volume: 0.4 });
        setTimeout(() => { if (e.pose) e.setPose(null); }, 2200);
      },
    },
  ],
  entities: [...objects, ...goats],
});

// For tests: the path's rectangles.
export const GOAT_PATH = { PATH, W, H };
