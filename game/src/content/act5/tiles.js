// Act 5's tileset: Act 2's and Act 3's sheets plus the Act 4 and Act 5 art
// its maps reference as 'sheet:frame'. Maps Act 5 layers onto keep their own
// tilesets; `withSheets` adds Act 5's sheets to them.

import { act2Tiles } from '../act2/tiles.js';
import { act3Tiles } from '../act3/tiles.js';
import { canal } from '../../art/canal.js';
import { harbor_quay, headland, fish_stall } from '../../art/act2b_harbor.js';
import { reveal, reveal_mouth, reveal_door, bilge_flood } from '../../art/act4_surface.js';
import { harbor_hull, sea, harbor_props, keyhole, lighthouse, bilge_door5, stair_rope, clockshop, shop5, banner, lamproom } from '../../art/act5_surface.js';
import { windlass_drum, windlass, hawse, keel_hatch, bowdoor } from '../../art/act5_under.js';

export const act5Sheets = {
  canal, harbor_quay, headland, fish_stall,
  reveal, reveal_mouth, reveal_door, bilge_flood,
  harbor_hull, sea, harbor_props, keyhole, lighthouse, bilge_door5, stair_rope, clockshop, shop5, banner, lamproom,
  windlass_drum, windlass, hawse, keel_hatch, bowdoor,
};

export const act5Tiles = {
  sheets: { ...act2Tiles.sheets, ...act3Tiles.sheets, ...act5Sheets },
  tiles: { ...act2Tiles.tiles, ...act3Tiles.tiles },
};

// Another act's map with Act 5's sheets added to its tileset.
export function withSheets(def) {
  return { ...def, tileset: { ...def.tileset, sheets: { ...act5Sheets, ...def.tileset.sheets } } };
}
