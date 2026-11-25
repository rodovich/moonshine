// The opening's tileset: every sheet its maps reference as 'sheet:frame'.

import { roof, tub, roof_props, laundry } from '../../art/roof.js';
import { court, facade, court_props, court_tree, court_well } from '../../art/court.js';
import { buildings } from '../../art/buildings.js';
import { props } from '../../art/props.js';
import { interior, furniture, fittings, rug } from '../../art/interior.js';

export const openingTiles = {
  sheets: {
    roof, tub, roof_props, laundry,
    court, facade, court_props, court_tree, court_well,
    buildings, props,
    interior, furniture, fittings, rug,
  },
  tiles: {},
};
