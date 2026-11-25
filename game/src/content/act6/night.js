// Act 6's night props on other acts' maps, for the montage cuts
// (docs/design/06-moon-in-the-bowl.md, "Montage states"): shown only while
// `fx.montage` names the cut ('bell', 'lurch', or 'refill'), so the maps are
// untouched in play. Positions follow the art task's composed scenes
// (game/dev/scene-act6-surface.js) on Act 4's dry Bilge.

import { lantern, lantern_pool, refill, teeth_recede } from '../../art/act6_surface.js';
import { boatman_piano, mott_jug } from '../../art/act6_sprites.js';
import { crowd_a, crowd_b, keeper } from '../../art/act5_sprites.js';
import { counting_woman, basin_woman, watering_woman, mayor, mover, ambrose } from '../../art/act2_npcs.js';
import { sweaty_kid } from '../../art/opening_npcs.js';
import { boatman } from '../../art/act4_sprites.js';
import { bilge_piano } from '../../art/act4_surface.js';

const cutIs = (...names) => (g) => names.includes(g.flag('fx.montage'));
const inCut = (g) => !!g.flag('fx.montage');

// A resident who sits down hard in the lurch: `idle` before, fall_down_0 at
// the jolt (fx.lurch 1), fall_down_1 after (fx.lurch 2); cheering in the refill.
function resident(id, sheet, idle, x, y, { palette, refillFrame = 'cheer_down' } = {}) {
  const has = (f) => !!sheet.frames[`${f}_0`] || !!sheet.frames[f];
  return {
    id, x, y, facing: 'down', solid: false, when: inCut, kind: 'npc',
    sprite: (g) => {
      const l = g.flag('fx.lurch');
      let frame = idle;
      if (g.flag('fx.montage') === 'lurch' && l) frame = `fall_down_${l - 1}`;
      else if (g.flag('fx.montage') === 'refill' && has(refillFrame)) frame = refillFrame;
      return { sheet, palette, frame };
    },
  };
}

// ---------------------------------------------------------------------------
// The dry Bilge: Dry Canal Day at night (the lurch), and the canals refilling.

const LANTERNS = [[2, 6], [7, 6], [18, 6], [24, 6], [29, 6], [4, 12], [10, 12], [16, 12], [22, 12], [27, 12]];
const BOAT = [22, 10]; // the Boatman's boat at the foot of the Water Stairs (32×32, its feet on row 11)

export function bilgeDryNight() {
  const crowd = [
    resident('act6_crowd_0', crowd_a, 'cheer_down', 5, 5),
    resident('act6_crowd_1', crowd_b, 'point_down', 9, 5),
    resident('act6_crowd_2', counting_woman, 'down_0', 15, 5),
    resident('act6_crowd_3', basin_woman, 'down_0', 20, 5),
    resident('act6_crowd_4', watering_woman, 'down_0', 21, 4),
    resident('act6_crowd_5', crowd_a, 'point_down', 26, 5),
    resident('act6_crowd_6', sweaty_kid, 'down_0', 11, 6),
    resident('act6_crowd_7', crowd_b, 'cheer_down', 28, 4),
  ];
  return {
    sheets: { lantern_pool, refill },
    hide: [{ when: inCut, ids: ['fishmonger', 'bridge_man', 'boatman', 'piano', 'big_mover', 'other_mover', 'kid', 'crab_0', 'crab_1', 'crab_2', 'flop',
      // Act 5's people and things on the mud
      'fishmonger5', 'boatman5', 'boat5_boatman', 'kid_mud', 'kid_relay', 'big_mover5', 'other_mover5', 'piano5', 'crab5_0', 'crab5_1', 'crab5_2', 'bucket5'] }],
    entities: [
      ...LANTERNS.map(([x, y], i) => ({ id: `act6_lantern_${i}`, x, y, solid: false, shadow: false, when: inCut, sprite: { sheet: lantern, frame: i % 3 ? 'lantern_a' : 'lantern_b' } })),
      ...crowd,
      // The Mayor on the bridge, lantern raised (the lurch).
      { ...resident('act6_mayor', mayor, 'gesture_down', 13, 9), when: cutIs('lurch') },
      // The Movers and the piano on the mud (the lurch); on the north quay, looking down (the refill).
      { ...resident('act6_mover_a', mover, 'lookup_down', 14, 10, { palette: 'big', refillFrame: 'lookup_down' }), when: cutIs('lurch') },
      { ...resident('act6_mover_b', mover, 'lookup_down', 17, 10, { palette: 'other', refillFrame: 'lookup_down' }), when: cutIs('lurch') },
      { ...resident('act6_mover_c', mover, 'lookup_down', 16, 5, { palette: 'big', refillFrame: 'lookup_down' }), when: cutIs('refill') },
      { ...resident('act6_mover_d', mover, 'lookup_down', 18, 5, { palette: 'other', refillFrame: 'lookup_down' }), when: cutIs('refill') },
      {
        id: 'act6_piano', x: 15, y: 10, w: 2, solid: false, shadow: false,
        when: (g) => g.flag('fx.montage') === 'lurch' && !g.flag('fx.pianoBoat'),
        sprite: { sheet: bilge_piano, frame: 'piano_mud' },
      },
      // The Boatman in his boat: alone, then with the piano in it.
      {
        id: 'act6_boat', x: BOAT[0], y: BOAT[1], w: 2, solid: false, shadow: false, when: inCut,
        sprite: (g) => (g.flag('fx.pianoBoat') || g.flag('fx.montage') === 'refill'
          ? { sheet: boatman_piano, frame: g.flag('fx.montage') === 'refill' ? 'piano_sing' : 'piano_rock' }
          : { sheet: boatman, frame: 'rock' }),
      },
    ],
    // The pool of lamplight east of each lantern; in the refill, the water rushing back along the trench.
    patches: (g) => {
      if (!inCut(g)) return [];
      const out = LANTERNS.map(([x, y]) => ['detail', x + 1, y, 'lantern_pool:pool']);
      const stage = g.flag('fx.refill');
      if (stage) {
        const rows = { 1: [10], 2: [9, 10], 3: [8, 9, 10] }[stage];
        for (let x = 0; x < 32; x++) {
          if (x === 12 || x === 13) continue; // the bridge deck stands clear
          if (x < (g.flag('fx.refillFront') ?? 0)) continue; // the rush hasn't got this far west yet
          rows.forEach((y, i) => {
            out.push(['ground', x, y, { tile: i === 0 ? 'refill:rush_top' : stage === 3 && y === 10 ? 'refill:rush_deep' : 'refill:rush', solid: true }]);
            out.push(['detail', x, y, null]);
          });
        }
      }
      return out;
    },
    lights: (g) => (inCut(g) ? LANTERNS.map(([x, y]) => ({ x: x + 0.5, y: y - 0.5, radius: 2, color: 'lamp_warm' })) : []),
  };
}

// ---------------------------------------------------------------------------
// The wet Bilge (Act 2's): the crowd on the quays, soaked and cheering; the piano afloat.

export function bilgeNight() {
  return {
    hide: [{ when: inCut, ids: ['boatman'] }],
    entities: [
      resident('act6_wet_0', crowd_a, 'cheer_down', 11, 5),
      resident('act6_wet_1', crowd_b, 'cheer_down', 13, 5),
      { ...resident('act6_wet_mayor', mayor, 'gesture_down', 15, 5) },
      resident('act6_wet_2', counting_woman, 'down_0', 18, 5),
      resident('act6_wet_3', crowd_a, 'cheer_down', 21, 5),
      { id: 'act6_wet_boat', x: 14, y: 9, w: 2, solid: false, shadow: false, when: inCut, sprite: { sheet: boatman_piano, frame: 'piano_sing' } },
    ],
  };
}

// ---------------------------------------------------------------------------
// The lamp room: the Keeper at the window.

export function lampRoomNight() {
  return {
    hide: [{ when: inCut, ids: ['keeper', 'keeper5'] }],
    entities: [{ id: 'act6_keeper', x: 5, y: 2, facing: 'up', solid: false, when: inCut, sprite: { sheet: keeper, frame: 'window_up' } }],
  };
}

// ---------------------------------------------------------------------------
// The belfry: Ambrose at the rope, eyes shut.

export function belfryNight() {
  return {
    hide: [{ when: inCut, ids: ['ambrose_belfry'] }],
    entities: [{ id: 'act6_ambrose', x: 4, y: 4, facing: 'up', solid: false, when: inCut, sprite: { sheet: ambrose, frame: 'ring_up' } }],
    lights: (g) => (inCut(g) ? [{ x: 4, y: 2, radius: 3, color: 'moon_light' }] : []),
  };
}

// ---------------------------------------------------------------------------
// The risen Harbor (Act 5's): Mott at the quay edge raises a mug of tea to the
// moon (beside his bollard, where Act 5 puts him), and the Teeth slide away into the dark.

export function harborRisenNight() {
  return {
    hide: [{ when: inCut, ids: ['mott5', 'teeth', 'kid5'] }],
    entities: [
      {
        id: 'act6_mott', x: 14, y: 8, facing: 'down', solid: false, when: inCut,
        sprite: (g) => ({ sheet: mott_jug, frame: `raise_mug_down_${g.flag('fx.mottToast') || 0}` }),
      },
      // Act 5's Teeth sprite sits on the horizon (8-18, 12-14), sorting as if on row 13.
      {
        id: 'act6_teeth', x: 8, y: 13, w: 11, kind: 'object', solid: false, shadow: false, offset: [0, 16], when: inCut,
        sprite: (g) => ({ sheet: teeth_recede, frame: g.flag('fx.teeth') === 'recede' ? 'recede' : 'gone' }),
      },
    ],
  };
}
