// Room sets for interiors: walls and floors, cut away (models/rooms.mjs). Content
// assembles a room with S.room() in game/src/content/iso-kit.js. The wall caps
// are Cheryl's flat's (flat:wall_cap_s, _e, _corner); they fit every set.
//
// Frame names, for each set (shop, archive, crypt, lamp):
//   <set>_floor_0, <set>_floor_1                 floor diamonds (h 0)
//   <set>_s_plain, <set>_s_window, <set>_s_door  the north wall's inner face, on the row north of the floor (96 px);
//                                                a door is a dark arched doorway in a frame, with a worn threshold
//   <set>_e_plain, <set>_e_window, <set>_e_door  the west wall's inner face, on the column west of the floor
//   <set>_corner                                 the post where they meet
//   <set>_cut_x, <set>_cut_door_x                the south wall, cut to a 16 px stub. A door tile is only a worn
//                                                threshold across the wall's thickness: its jambs are the plain stubs
//                                                beside it, so a door two tiles wide is two door tiles side by side
//   <set>_cut_y, <set>_cut_door_y                the east wall, cut the same way
// The lamp room's lantern (for the whole north and west walls, instead of _plain/_window):
//   lamp_s_glazed, lamp_e_glazed                 tall panes over a low slate wall, an iron mullion at the tile's
//                                                center, an iron head under the cut top (same place, height and
//                                                split as lamp_s_* / lamp_e_*; keep flat:wall_cap_s/_e on them)
//   lamp_corner_chamfer                          the back corner cut off on the diagonal, glazed, with its own cut top.
//                                                Place it on the room's first floor tile (x0, y0), layer 0.1 (after the
//                                                walls behind it); the tile stays walkable
//   <set>_cut_corner                             the stub at the south-east corner
//   crypt_stairs_down/_up/_right/_left           the crypt's cellar steps (h 40), named like the town kit's stairs_* by the way they descend
import { frame, split, POST } from '../lib/jobs.mjs';
import { place } from '../lib/sdf.mjs';
import * as R from '../models/rooms.mjs';

const PI = Math.PI;

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
    // The lamp room's lantern glazing (see the header).
    // The sill, panes and bars sit up to 0.32 behind the face, so a plain half-column split would
    // leave a gap of up to 11 px between pieces; they keep their whole width.
    const deep = (p) => p.tag === 'glass' || p.tag === 'glazing';
    const glazed = (name, face) => split(name, () => R.roomGlazed('lamp', face), {
      [name]: (p, sx) => (face === 's' ? sx < 0 || (deep(p) && sx < 13) : sx >= 0 || (deep(p) && sx >= -13)),
    }, { fp: [1, 1], h: 96 });
    out.push(glazed('lamp_s_glazed', 's'), glazed('lamp_e_glazed', 'e'));
    out.push(frame('lamp_corner_chamfer', () => R.roomChamfer('lamp'), { fp: [1, 1], h: 96 }));
    const turns ={ down: 0, up: PI, left: PI / 2, right: -PI / 2 };
    for (const [d, rz] of Object.entries(turns)) out.push(frame(`crypt_stairs_${d}`, () => place(R.cryptStairs(), { rz }), { post: POST.arch, fp: [1, 1], h: 40 }));
    return out;
  },
};
