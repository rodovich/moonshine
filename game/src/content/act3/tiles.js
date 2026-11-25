// Act 3's tileset: every sheet its maps reference as 'sheet:frame'.

import { hull } from '../../art/underground.js';
import { ds, ds_day, ds_water, ds_mirror, ds_rod, moon_eyes } from '../../art/downstairs.js';
import { machines } from '../../art/machines.js';
import { chart, chart_chair, founders_door_open } from '../../art/chartroom.js';

export const act3Tiles = {
  sheets: { hull, ds, ds_day, ds_water, ds_mirror, ds_rod, moon_eyes, machines, chart, chart_chair, founders_door_open },
  tiles: {},
};
