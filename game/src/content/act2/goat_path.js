// The Goat Path (16 × 24): a switchback down the steep back of the island,
// through terrace gardens and goats, past Mott's shack, to a sea cave and the
// Harbor. From docs/design/02-city.md.
// Art: game/src/art/act2b_goat.js (index in docs/art-act2b.md).

import { composedMap, blankGrid } from '../opening/grid.js';
import { act2Tiles } from './tiles.js';
import { layout, bump, firstMeet, cherylDeclines, actWrongness } from './common.js';
import { goat } from '../../art/act2b_goat.js';

const W = 16, H = 24;

const GRID = [
  '~~~~~~~~~~~~~::~', //  0 top: from Lamp Street (13-14)
  '~gggggggggg=:::~', //  1
  '~gggggggggg=:::~', //  2
  '~gggggggggg=:::~', //  3
  '~::::::::::::::~', //  4
  '~::===========~~', //  5
  '~::ggggggggggg~~', //  6
  '~::ggggggggggg~~', //  7
  '~::::::::::::::~', //  8
  '~SSSS=====::::~~', //  9 Mott's shack (1-4, 9-12)
  '~SSSS:::::::::~~', // 10
  '~SSSS:::::::::~~', // 11 the shack window (2-3, 11)
  '~SSSS:::::::::~~', // 12 the shack door (2, 12)
  '~::::::::::::::~', // 13
  '~::jj::::::::::~', // 14 jj empty square jugs (3-4, 14)
  '~======::::====~', // 15
  '~gggggg::::gggg~', // 16
  '~gggggg::::gggg~', // 17
  '~::::::::::::::~', // 18
  '~::============~', // 19
  '~::%%%%%%%%%%%%~', // 20 the cove
  'O::%%%%%%%%%%%%~', // 21 O the sea cave mouth (0, 21)
  '~::%%%%%%%%%%%%~', // 22
  '~::~~~~~~~~~~~~~', // 23 bottom: down to the Harbor (1-2)
];

const at = (x, y) => (GRID[y] || '')[x] || '~';
const isLand = (c) => c !== '~' && c !== '%' && c !== 'O';

function compose() {
  const L = layout(W, H, blankGrid);
  GRID.forEach((row, y) => [...row].forEach((c, x) => {
    if (c === ':' || c === 'j') {
      const v = ['path_a', 'path_b', 'path_c'][(x * 7 + y * 13) % 3];
      L.set('ground', x, y, `goatpath:${v}`, c === 'j');
    } else if (c === 'g') {
      L.set('ground', x, y, `goatpath:${(x + y) % 2 ? 'beans_b' : 'beans_a'}`, true);
    } else if (c === '=') {
      let f = 'wall';
      if (y === 19) f = 'wall_cove';
      else if (x === 11 && y <= 3) f = 'wall_v';
      else if (at(x + 1, y) === ':') f = 'wall_end_r';
      else if (at(x - 1, y) === ':') f = 'wall_end_l';
      L.set('ground', x, y, `goatpath:${f}`, true);
    } else if (c === '%') {
      L.set('ground', x, y, `goatpath:${x === 3 ? 'cove_w' : 'cove'}`, true);
    } else if (c === 'O') {
      L.set('ground', x, y, 'goatpath:cave_mouth', true);
    } else if (c === '~') {
      // The sea far below; where it meets land, the tile with the cliff lip on that side.
      let f = 'sea';
      if (isLand(at(x + 1, y))) f = 'cliff_e';
      else if (isLand(at(x - 1, y))) f = 'cliff_w';
      else if (isLand(at(x, y + 1))) f = 'cliff_s';
      else if (isLand(at(x, y - 1))) f = 'cliff_n';
      L.set('ground', x, y, `goatpath:${f}`, true);
    }
  }));
  // Mott's shack (1–4, 9–12): the still glints in its window; the door has his sign.
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) L.set('ground', 1 + c, 9 + r, `mott_shack:shack_x${c}y${r}`, true);
  // Empty square jugs, stacked.
  L.set('detail', 3, 14, 'mott_jugs:jugs_l', true); L.set('detail', 4, 14, 'mott_jugs:jugs_r', true);
  return L.done();
}

// ---------------------------------------------------------------------------
// Objects

const objects = [
  { id: 'shack_door', x: 2, y: 11, h: 2, look: "Mott's shack. A sign: GONE FERRYING. Underneath, in different ink: (NOT REALLY)." },
  { id: 'shack_window', x: 3, y: 11, h: 2, look: "Through the window: a still. A copper coil, polished like a trophy. It's the only thing in there he dusts." },
  { id: 'shack_wall', x: 1, y: 9, w: 4, h: 2, lookKey: 'shack_window', look: "Through the window: a still. A copper coil, polished like a trophy. It's the only thing in there he dusts." },
  { id: 'jugs', x: 3, y: 14, w: 2, look: "Empty jugs. Lots of them. Square. Mott's." },
  {
    id: 'sea_cave', x: 0, y: 21,
    looks: [
      ["A sea cave under the cliff. The tide's in, and the water goes right to the back.", 'Something down there catches the light. Brass, maybe.'],
      "The tide's in. I'm not swimming. Not today.",
    ],
  },
  ...[[3, 20, 12, 3], [15, 1, 1, 18]].map(([x, y, w, h], i) => ({
    id: `view_${i}`, x, y, w, h, lookKey: 'goat_view',
    look: "The back of the island. Cliff, goats, sea. You can't see the Gate from here. It's very restful.",
  })),
  ...[[1, 1, 10, 3], [3, 6, 11, 2], [1, 16, 6, 2], [11, 16, 4, 2]].map(([x, y, w, h], i) => ({
    id: `beds_${i}`, x, y, w, h, lookKey: 'beds', look: 'Beans, mostly. The goats have opinions about the beans.',
  })),
].map((o) => ({ solid: false, use: { '*': cherylDeclines }, ...o }));

// The sea cave takes the crowbar and the rest with the same shrug.
objects.find((o) => o.id === 'sea_cave').use = { '*': (g) => g.describe("The tide's in. I'm not swimming. Not today.") };

// ---------------------------------------------------------------------------
// Goats.

const goats = [
  // They wander only where the path is wide enough to walk round them:
  // the yard by Mott's shack, and the four-wide stretch between the lower beds.
  { id: 'goat_1', x: 8, y: 11, area: [5, 10, 9, 3], sprite: { sheet: goat } },
  { id: 'goat_2', x: 8, y: 16, area: [7, 16, 4, 2], sprite: { sheet: goat, palette: 'brown' } },
].map((d) => ({
  id: d.id, name: 'Goat', x: d.x, y: d.y,
  sprite: d.sprite, kind: 'npc',
  behavior: { type: 'wander', area: d.area, pause: [1.5, 4] },
  interact: async (g, self) => {
    g.sfx('goat');
    if (bump(g, 'goat.look') === 0) await g.describe("A goat. It's eating a geranium and making eye contact.");
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
  ambience: ['wind', 'goats'],
  step: 'step_stone',
  spawn: [13, 1],
  exits: [
    { x: 13, y: 0, w: 2, to: 'lamp_street', at: [1, 10], facing: 'right', sfx: 'step_stone' },
    { x: 1, y: 23, w: 2, to: 'harbor', at: [2, 4], facing: 'down', sfx: 'step_stairs' },
  ],
  onEnter: async (g) => { actWrongness(g); },
  ambient: [
    // Now and then a goat stops to eat (the beans, mostly).
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
