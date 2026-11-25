// The Emergency Shaft (6 × 30) and the Ice Cellar (10 × 8): the climb out of
// the Pump Hall and the way up into the Fishmonger's house
// (docs/design/04-the-list.md, "The climb", "The ice cellar").

import { composedMap, blankGrid, bump, cherylDeclines } from './common.js';
import { act4Tiles } from './tiles.js';
import { revealFromCellar } from './bilge_dry.js';

const darkPlayerLight = (g) => (g.hasItem('moonglass_disc') ? { radius: 3, color: 'relic_cyan' } : { radius: 2 });

// ---------------------------------------------------------------------------
// The shaft: rungs up the north wall, three screens tall.

function composeShaft(g) {
  const W = 6, H = 30;
  const ground = blankGrid(W, H), detail = blankGrid(W, H), overhead = blankGrid(W, H);
  const solid = blankGrid(W, H, true);
  const step = blankGrid(W, H, 'step_rung');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) ground[y][x] = 'hull:top';
  for (let y = 1; y <= 28; y++) {
    const wet = y >= 20 ? '_wet' : '';
    ground[y][1] = `eshaft:side${wet}_l`; ground[y][4] = `eshaft:side${wet}_r`;
    const rung = y === 28 ? 'rungs_foot' : y >= 20 ? 'rungs_wet' : y >= 8 ? 'rungs' : y >= 3 ? 'rungs_dry' : 'rungs_light';
    ground[y][2] = `eshaft:${rung}_l`; ground[y][3] = `eshaft:${rung}_r`;
    solid[y][2] = solid[y][3] = false;
  }
  const open = !!g.flag('shaft.slab');
  ground[0][2] = `eshaft:${open ? 'slab_open' : 'slab'}_l`; ground[0][3] = `eshaft:${open ? 'slab_open' : 'slab'}_r`;
  solid[0][2] = solid[0][3] = !open;
  return { ground, detail, overhead, solid, step };
}

const climbLine = (row, flag, run) => ({ x: 2, y: row, w: 2, stop: false, when: (g) => !g.flag(flag), run: async (g) => { g.setFlag(flag); await run(g); g.pose('player', 'climb'); } });

export const shaftMap = composedMap(composeShaft, {
  id: 'emergency_shaft',
  name: 'The Emergency Shaft',
  tileset: act4Tiles,
  dark: 0.95,
  playerLight: darkPlayerLight,
  spawn: [2, 28],
  ambience: ['roar'],
  exits: [{ x: 2, y: 0, w: 2, to: 'ice_cellar', at: [2, 5], facing: 'up', when: (g) => !!g.flag('shaft.slab') }],
  triggers: [
    climbLine(22, 'climb.22', async (g) => {
      g.setLoopVolume('roar', 0.4, 3000);
      await g.describe('Up and up.');
    }),
    climbLine(14, 'climb.14', async (g) => {
      g.setLoopVolume('roar', 0.1, 3000);
      await g.describe("My arms are fifty-eight years old. They'd like that noted.");
    }),
    climbLine(7, 'climb.7', async (g) => {
      g.stopLoop('roar', 3000);
      g.stopMusic(3000);
      g.startLoop('drips');
      await g.wait(1.2);
      g.sfx('gull_close');
      await g.wait(0.8);
      await g.describe("A gull. That's close. That's very close.");
    }),
    {
      x: 2, y: 1, w: 2,
      when: (g) => !g.flag('shaft.slab'),
      run: async (g) => {
        await g.describe('A slab over the hatch. Heavy. It smells of fish.');
        g.facePlayer('up');
        g.pose('player', 'shove_up');
        await g.shake(1, 0.5);
        g.sfx('slab_scrape');
        await g.shake(1, 0.9);
        g.setFlag('shaft.slab');
        g.pose('player', 'climb');
      },
    },
  ],
  onEnter: async (g) => {
    g.tilt(0, 0, 0.5);
    g.stopLoop('spray', 800); g.stopLoop('air_whistle', 800); g.stopLoop('water_spread', 0);
    g.pose('player', 'climb');
    g.playMusic('climb', { fadeMs: 500 });
    g.bendMusic(300, 20000);
  },
  entities: [],
});

// ---------------------------------------------------------------------------
// The ice cellar, under the Fishmonger's house.
//
//       0123456789
//    0  ##########
//    1  #fff##^^f#   f hanging fish; ^^ the stair up (6-7, 1)
//    2  #........#
//    3  #II...II.#   ice blocks in sawdust
//    4  #II...IIc#   c crates (8, 4)
//    5  #........#
//    6  #.o......#   o the hatch Cheryl comes up through (2, 6)
//    7  ##########

function composeCellar(g) {
  const W = 10, H = 8;
  const ground = blankGrid(W, H), detail = blankGrid(W, H), overhead = blankGrid(W, H);
  const solid = blankGrid(W, H, true);
  const step = blankGrid(W, H, 'step_wood');
  const hash = (x, y) => (x * 3 + y * 7) % 5;
  for (let x = 0; x < W; x++) { ground[0][x] = 'ice_cellar:wall_upper'; ground[1][x] = 'ice_cellar:wall_lower'; ground[7][x] = 'ice_cellar:wall_south'; }
  for (let y = 2; y <= 6; y++) {
    ground[y][0] = ground[y][9] = 'ice_cellar:wall_side';
    for (let x = 1; x <= 8; x++) { ground[y][x] = `ice_cellar:floor_${'abcab'[hash(x, y)]}`; solid[y][x] = false; }
  }
  ground[0][6] = 'ice_cellar:stair_top_l'; ground[0][7] = 'ice_cellar:stair_top_r';
  ground[1][6] = 'ice_cellar:stair_l'; ground[1][7] = 'ice_cellar:stair_r';
  solid[1][6] = solid[1][7] = false;
  step[1][6] = step[1][7] = 'step_stairs';
  for (const x of [1, 2, 3, 8]) detail[0][x] = 'ice_cellar_props:fish_hanging';
  for (const x0 of [1, 6]) for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) { detail[3 + r][x0 + c] = `ice_cellar_props:ice_x${c}y${r}`; solid[3 + r][x0 + c] = true; }
  detail[4][8] = 'ice_cellar_props:crate_fish'; solid[4][8] = true;
  ground[6][2] = g.flag('cellar.shut') ? 'ice_cellar:hatch_shut' : 'ice_cellar:hatch_open';
  solid[6][2] = true;
  return { ground, detail, overhead, solid, step };
}

export const cellarMap = composedMap(composeCellar, {
  id: 'ice_cellar',
  name: 'The Ice Cellar',
  tileset: act4Tiles,
  dark: 0.6,
  playerLight: darkPlayerLight,
  lights: [{ x: 6.5, y: 1, radius: 2, color: 'white_light' }],
  ambience: ['drips', 'shouting'],
  spawn: [2, 5],
  exits: [{ x: 6, y: 1, w: 2, run: (g) => revealFromCellar(g) }],
  onEnter: async (g) => {
    g.pose('player', null);
    g.stopLoop('drips', 0);
    if (g.flag('cellar.shut')) return;
    // 1. Behind her the slab grinds back into place.
    await g.wait(0.6);
    g.sfx('slab_close');
    g.shake(1, 0.3);
    g.setFlag('cellar.shut');
    await g.wait(0.6);
    // 2–3.
    await g.describe("Ice. Sawdust. Fish on hooks. The Fishmonger's cellar. I'd know that smell blindfolded.");
    await g.wait(1.2);
  },
  entities: [
    { id: 'ice', x: 1, y: 3, w: 2, h: 2, lookKey: 'ice', look: "Ice, sweating in its sawdust. Five minutes ago this cellar was flooded. It isn't now." },
    { id: 'ice_b', x: 6, y: 3, w: 2, h: 2, lookKey: 'ice', look: "Ice, sweating in its sawdust. Five minutes ago this cellar was flooded. It isn't now." },
    ...[1, 2, 3, 8].map((x) => ({ id: `fish_${x}`, x, y: 1, lookKey: 'fish', look: 'Fish, hanging up, looking as surprised as I feel.' })),
    { id: 'crate', x: 8, y: 4, look: 'A crate of fish, packed in ice. Dry ice. Dry crate. Dry everything, suddenly.' },
    { id: 'hatch', x: 2, y: 6, look: "Closed. And the slab's back over it. That way's shut for good." },
    { id: 'stair', x: 6, y: 0, w: 2, look: 'Daylight under the door at the top. And shouting.' },
  ].map((o) => ({ solid: false, use: { '*': cherylDeclines }, ...o })),
});

