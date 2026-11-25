// Act 5: High and Dry (docs/design/05-high-and-dry.md). New maps: the risen
// Harbor, the Clockmaker's Shop, the Bow Passage, and the Windlass Room.
// `withAct5(maps)` layers Act 5's states onto the other acts' maps (the dry
// Bilge, the lamp room, Fountain Square, the Shop, the Crown, ...) and stands
// in for maps whose acts aren't merged yet.

import { passageMap, windlassMap, windlassScripts, act5 } from './windlass.js';
import { harborMap, withLampRoom5, harborScripts } from './harbor.js';
import { clockshopMap, clockshopScripts } from './clockshop.js';
import { withBilge5, bilgeLinks, bilgeScripts } from './bilge.js';
import { relayScripts } from './relay.js';
import { withSquare5, withShop5, withCrown5, withBelfry5, withArchive5, withSteps5, withLampStreet5, withCourt5, crownLinks, townScripts } from './town.js';
import { bilgeDryStandIn, lampRoomStandIn } from './standins.js';
import { startAct5 } from './start.js';
import { ladderScripts } from './ladder.js';
import { act5Items, standInItems, started, both, untilAct5, telescopeAct5 } from './common.js';

const RISEN = { harbor: 'harbor_risen', bilge: 'bilge_dry' };

export const act5Maps = {
  harbor_risen: harborMap,
  clockmaker_shop: clockshopMap,
  bow_passage: passageMap,
  windlass_room: windlassMap,
};

export { act5Items, standInItems, act5, startAct5, telescopeAct5 };

// The Ship Plan's Act 5 look (after the picture folds away): the tooth drawn
// at the bow, the same shape as the Clockmaker's doorstop. Wraps the item as
// earlier acts leave it (Act 4 adds its own looks first).
export function shipPlanAct5(item) {
  if (!item) return item;
  const base = item.examine;
  return {
    ...item,
    act5Before: base,
    examine: async (g, looks) => {
      if (base) await base(g, looks);
      else await g.describe(item.description);
      if (!g.flag('act5.started') || g.flag('epilogue') || g.flag('tooth.set')) return;
      if (!g.flag('n.plan.a5')) {
        g.setFlag('n.plan.a5', 1);
        return g.describe('The chain runs from the bow to the anchor. Beside it, at the bow, a little drawing of a tooth.', 'Rounded at one end, notched at the other.');
      }
      return g.describe('Rounded at one end, notched at the other.');
    },
  };
}

const LAYERS = {
  bilge_dry: withBilge5,
  lamp_room: withLampRoom5,
  fountain_square: withSquare5,
  shop: withShop5,
  crown: withCrown5,
  belfry: withBelfry5,
  archive: withArchive5,
  hundred_steps: withSteps5,
  lamp_street: withLampStreet5,
  cistern_court: withCourt5,
};

// The maps with Act 5's states layered on. Stand-ins fill in for the dry
// Bilge (Act 4) and the lamp room (Act 2 part 2) until those acts register
// their own.
export function withAct5(maps) {
  const out = { ...maps };
  if (!out.bilge_dry) out.bilge_dry = bilgeDryStandIn;
  if (!out.lamp_room) out.lamp_room = lampRoomStandIn;
  crownLinks.belfry = !!out.belfry;
  bilgeLinks.goatPath = !!out.goat_path;
  for (const [id, layer] of Object.entries(LAYERS)) {
    if (!out[id]) continue;
    const before = out[id];
    out[id] = layer(before);
    // The layer wraps the map's own onEnter, patches, and lighting; list the
    // originals as named scripts so `npm run check` still reads their ids.
    for (const k of ['onEnter', 'patches', 'lighting']) {
      if (typeof before[k] === 'function' && out[id][k] !== before[k]) act5Scripts[`before_${id}_${k}`] = before[k];
    }
  }
  // Once Act 5 begins, ways into Act 2's Harbor and wet Bilge (from the Goat
  // Path, the Square, the lamp room) lead to the risen Harbor and the dry
  // Bilge instead. Rows 0-6 match; the dry Bilge's south quay is a row lower.
  for (const [id, def] of Object.entries(out)) {
    if (!(def.exits || []).some((e) => RISEN[e.to])) continue;
    out[id] = {
      ...def,
      exits: def.exits.flatMap((e) => {
        const to = RISEN[e.to];
        if (!to || !e.at) return [e];
        const at = [e.at[0], e.to === 'bilge' && e.at[1] > 6 ? e.at[1] + 1 : e.at[1]];
        return [{ ...e, to, at, when: both(e.when, started) }, untilAct5(e)];
      }),
    };
  }
  // The Harbor's Goat stair leads to Act 2 part 2's Goat Path once it exists.
  crownLinks.ambroseHere = !out.belfry;
  return out;
}

// Act 5's story flags, read through small helpers (started, doorOpen, ...)
// that `npm run check` can't see into; listing them here lets it match each
// flag that's set with a read. Runnable with ?run=act5_flags to log them.
function act5Flags(g) {
  const flags = {
    'act5.started': g.flag('act5.started'), 'teeth.stage': g.flag('teeth.stage'), 'teeth.seen': g.flag('teeth.seen'),
    'got.bucket': g.flag('got.bucket'), 'bucket.full': g.flag('bucket.full'), 'boatman.afloat': g.flag('boatman.afloat'),
    'rope.tied': g.flag('rope.tied'), 'keeper.asked': g.flag('keeper.asked'), 'telescope.back': g.flag('telescope.back'), 'keeper.telescope': g.flag('keeper.telescope'), 'window.telescope': g.flag('window.telescope'), 'telescope.migrated': g.flag('telescope.migrated'),
    'disc.charged': g.flag('disc.charged'), 'relay.ready': g.flag('relay.ready'), 'relay.run': g.flag('relay.run'),
    'door.open': g.flag('door.open'), 'kid.gaveDisc': g.flag('kid.gaveDisc'), 'got.clapper': g.flag('got.clapper'),
    'clockmaker.jug': g.flag('clockmaker.jug'), 'shop.guidebook': g.flag('shop.guidebook'),
    'passage.lit': g.flag('passage.lit'), 'windlass.seen': g.flag('windlass.seen'),
    'keepers.ladder': g.flag('keepers.ladder'), 'tooth.out': g.flag('tooth.out'), 'tooth.set': g.flag('tooth.set'),
    'windlass.sat': g.flag('windlass.sat'), 'windlass.late': g.flag('windlass.late'), 'act5.done': g.flag('act5.done'),
  };
  console.log('[act5]', flags);
  return flags;
}

export const act5Scripts = {
  act5_flags: act5Flags,
  // ?map=harbor_risen&flags=act4.risen&run=act5_start
  act5_start: startAct5,
  ...windlassScripts,
  ...ladderScripts,
  ...harborScripts,
  ...clockshopScripts,
  ...bilgeScripts,
  ...relayScripts,
  ...townScripts,
};
