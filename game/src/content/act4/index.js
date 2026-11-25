// Act 4: The List (docs/design/04-the-list.md). Waking the Sisters, and the
// sea going out. New maps of its own, plus Act 4 states of the surface maps
// built by the opening and Act 2 (as overlays, in surface.js).

import { act4Items, act4, listStage } from './common.js';
import { belfryMap } from './belfry.js';
import { pumpHallMap, tideWheelMap } from './pumphall.js';
import { shaftMap, cellarMap } from './climb.js';
import { bilgeDryMap, act4End, endOfAct4, revealFromCellar } from './bilge_dry.js';
import { seaCaveMap, seaCave } from './seacave.js';
import { withAct4, startAct4 } from './surface.js';
import { ship_plan } from '../../art/chartroom.js';

// Act 4's own maps. Its states of earlier acts' maps come from withAct4(maps).
export const act4Maps = {
  belfry: belfryMap,
  pump_hall: pumpHallMap,
  tide_wheel: tideWheelMap,
  emergency_shaft: shaftMap,
  ice_cellar: cellarMap,
  bilge_dry: bilgeDryMap,
  sea_cave: seaCaveMap,
};

// Act 3 defines the Ship Plan (with its full-screen examine). Until Act 3 is
// in the game, this stand-in lets Act 4 be played from debug parameters.
export const act4FallbackItems = {
  ship_plan: {
    name: 'Ship Plan',
    icon: { sheet: ship_plan, frame: Object.keys(ship_plan.frames).find((f) => /icon/.test(f)) || Object.keys(ship_plan.frames)[0] },
    description: 'My rubbing of the Founders\' floor. Tessel, drawn as a boat. I\'ve folded it in quarters, which feels rude.',
  },
};

// The Ship Plan's first two looks in Act 4 (after its picture closes).
export function shipPlanAct4(item) {
  if (!item) return item;
  const base = item.examine;
  return {
    ...item,
    examine: async (g, looks) => {
      if (base) await base(g, looks);
      else await g.describe(item.description);
      if (!act4(g) || g.flag('act4.risen')) return;
      const n = g.flag('n.plan.a4') || 0;
      if (n >= 2) return;
      g.setFlag('n.plan.a4', n + 1);
      if (n === 0) {
        await g.describe('Three bars, low in the hull, down where the water is. They\'re pumps. They must be pumps.', 'And a rope from the bell, down to a wheel. If the bell turns the wheel, and the wheel drives the pumps...');
      } else {
        await g.describe("Ambrose. I need Ambrose's bell.");
      }
    },
  };
}

export { act4Items, act4End, seaCave, startAct4, listStage, withAct4 };

export const act4Scripts = {
  // ?map=flat&x=8&y=4&flags=act3.surfaced,halls.valve&items=ship_plan,guidebook,moon_chart&run=act4_start
  act4_start: startAct4,
  // ?map=ice_cellar&x=6&y=2&flags=act4.started,pumps.running,pumps.burst,cellar.shut&run=act4_reveal
  act4_reveal: revealFromCellar,
  act4_end: endOfAct4,
};
