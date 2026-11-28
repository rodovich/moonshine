// Room sets for interiors: walls and floors, cut away (models/rooms.mjs). Content
// assembles a room with S.room() in game/src/content/iso-kit.js. The wall caps
// are Cheryl's flat's (flat:wall_cap_s, _e, _corner); they fit every set.
//
// Frame names, for each set (shop, archive, crypt, lamp):
//   <set>_floor_0, <set>_floor_1                 floor diamonds (h 0)
//   <set>_s_plain, <set>_s_window, <set>_s_door  the north wall's inner face, on the row north of the floor (96 px)
//   <set>_e_plain, <set>_e_window, <set>_e_door  the west wall's inner face, on the column west of the floor
//   <set>_corner                                 the post where they meet
//   <set>_cut_x, <set>_cut_door_x                the south wall, cut to a 16 px stub (a door is a threshold)
//   <set>_cut_y, <set>_cut_door_y                the east wall, cut the same way
//   <set>_cut_corner                             the stub at the south-east corner
import { frame, split, POST } from '../lib/jobs.mjs';
import * as R from '../models/rooms.mjs';

const left = (p, sx) => sx < 0;
const right = (p, sx) => sx >= 0;
const floor = (name, build) => frame(name, build, { diamond: [1], fp: [1, 1], h: 0 });
const wall = (name, build, face) => split(name, build, { [name]: face === 's' ? left : right }, { fp: [1, 1], h: 96 });
const cut = (name, build) => frame(name, build, { post: POST.arch, shadow: false, fp: [1, 1], h: 16 });

export default {
  name: 'rooms',
  frames: () => {
    const out = [];
    for (const s of R.SET_NAMES) {
      out.push(floor(`${s}_floor_0`, () => R.roomFloor(s, 0)), floor(`${s}_floor_1`, () => R.roomFloor(s, 1)));
      for (const face of ['s', 'e']) for (const k of ['plain', 'window', 'door']) out.push(wall(`${s}_${face}_${k}`, () => R.roomWall(s, face, k), face));
      out.push(frame(`${s}_corner`, () => R.roomCorner(s), { fp: [1, 1], h: 96 }));
      out.push(cut(`${s}_cut_x`, () => R.roomCut(s, 'x')), cut(`${s}_cut_y`, () => R.roomCut(s, 'y')));
      out.push(cut(`${s}_cut_door_x`, () => R.roomCut(s, 'x', { door: true })), cut(`${s}_cut_door_y`, () => R.roomCut(s, 'y', { door: true })));
      out.push(cut(`${s}_cut_corner`, () => R.roomCut(s, 'corner')));
    }
    return out;
  },
};
