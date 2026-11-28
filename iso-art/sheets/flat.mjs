// Cheryl's flat (docs/design/01-opening.md): floor, walls, the cutaway near
// walls, and her furniture in every state the opening uses.
import { frame, split, POST } from '../lib/jobs.mjs';
import * as F from '../models/flat.mjs';

const PI = Math.PI;
const left = (p, sx) => sx < 0;
const right = (p, sx) => sx >= 0;
const floor = (name, build) => frame(name, build, { diamond: [1], fp: [1, 1], h: 0 });
const prop = (name, build, fp = [1, 1], h = 40, opts = {}) => frame(name, build, { post: POST.prop, shadow: true, fp, h, ...opts });
const wall = (name, face, kind, o) => split(name, () => F.wallPiece(face, kind, o), { [name]: face === 's' ? left : right }, { fp: [1, 1], h: 96 });

export default {
  name: 'flat',
  frames: () => [
    floor('floor_0', () => F.clayFloor({ seed: 0 })),
    floor('floor_1', () => F.clayFloor({ seed: 1 })),
    floor('floor_worn', () => F.clayFloor({ seed: 2, worn: true })),
    // The north wall's inner face (s) and the west wall's (e).
    wall('room_s_plain', 's', 'plain'),
    wall('room_e_plain', 'e', 'plain'),
    // The cut top of a wall (a section, as rooms were drawn cut away in the era).
    frame('wall_cap_s', () => F.wallCap('s'), { fp: [1, 1], h: 96 }),
    frame('wall_cap_e', () => F.wallCap('e'), { fp: [1, 1], h: 96 }),
    frame('wall_cap_corner', () => F.wallCap('corner'), { fp: [1, 1], h: 96 }),
    frame('room_corner', () => F.roomCorner(), { fp: [1, 1], h: 96 }),
    wall('room_s_window_l', 's', 'window', { half: 'l' }),
    wall('room_s_window_r', 's', 'window', { half: 'r' }),
    wall('room_s_clock', 's', 'clock'),
    wall('room_s_shelf_l', 's', 'shelf_l'),
    wall('room_s_shelf_r', 's', 'shelf_r'),
    // The near walls, cut away.
    prop('cut_x', () => F.cutaway('x'), [1, 1], 16, { shadow: false, post: POST.arch }),
    prop('cut_y', () => F.cutaway('y'), [1, 1], 16, { shadow: false, post: POST.arch }),
    prop('cut_door', () => F.cutaway('x', { door: true }), [1, 1], 16, { shadow: false, post: POST.arch }),
    prop('cut_hook', () => F.cutaway('x', { hook: true }), [1, 1], 16, { shadow: false, post: POST.arch }),
    prop('cut_corner', () => F.cutaway('corner'), [1, 1], 16, { shadow: false, post: POST.arch }),
    // Furniture.
    prop('counter_l_mill', () => F.counter('l'), [1, 1], 44),
    prop('counter_l', () => F.counter('l', { item: false }), [1, 1], 37),
    prop('counter_r_timer', () => F.counter('r'), [1, 1], 44),
    prop('counter_r', () => F.counter('r', { item: false }), [1, 1], 37),
    prop('stove', () => F.stove(), [1, 1], 96),
    prop('bed', () => F.bed(), [2, 2], 42),
    prop('side_table', () => F.sideTable(), [1, 1], 25),
    prop('table_chart', () => F.table({ chart: true }), [2, 1], 31),
    prop('table', () => F.table({ chart: false }), [2, 1], 31),
    prop('chair_e', () => F.kitchenChair({ face: 0 }), [1, 1], 40),
    prop('chair_w', () => F.kitchenChair({ face: PI }), [1, 1], 40),
    prop('wardrobe', () => F.wardrobe(), [1, 2], 86),
    prop('washstand', () => F.washstand(), [1, 1], 74),
    prop('washstand_bare', () => F.washstand({ soap: false }), [1, 1], 74),
    prop('bookshelf_l', () => F.bookshelf('l'), [1, 1], 78),
    prop('bookshelf_r', () => F.bookshelf('r'), [1, 1], 78),
    prop('rug', () => F.rug(), [3, 2], 1, { shadow: false, post: POST.arch }),
  ],
};
