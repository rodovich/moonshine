// Act 2's interiors: the unique furniture of the Shop, the Archive and its
// crypt, and the lighthouse's lamp room (docs/art-act2.md, docs/art-act2b.md).
// Walls and plain floors are the converter's (Cheryl's flat's pieces, or new
// wall sets); these are the things in the rooms. Every frame is anchored at
// its footprint's center on the floor; wall-standing pieces have their backs
// on the north wall's plane (y = −0.5 of their row), so put them in the row
// in front of the wall.
//
// THE SHOP (content/act2/square.js, composeShop, 10×8)
//   shelving         4×1, h 88  at (1–4, 1), anchor between x2 and x3   ← shop:shelving_a…d
//   shelving_2       2×1, h 88  at (7–8, 1)                             ← shop:shelving_e, _f
//   counter          5×1, h 44  at (2–6, 3), the bell at its east end   ← shop:counter_l, counter_m ×3, counter_r
//   counter_glint_0/1 the same, the bell catching the light (anim counter_glint, 1400/160 ms) ← counter_r_glint_0/1
//   marble_jar       1×1, h 36  at (1, 5): every marble on the east side ← shop:marble_jar
//   display_hat      2×1, h 42  at (7–8, 5): the straw hat on a stand, its coral price card ← shop:display_l/_r
//   display_scope    2×1, h 40  at (7–8, 5) after the swap (flag window.telescope) ← shop:display_scope_l/_r
//   barometer        1×1, h 92  on the north wall over (7, 0), stuck on FAIR; draw it on the
//                    wall row (7, 0) or, if the shelves fill row 1, over them ← shop:barometer
//
// THE ARCHIVE (content/act2/archive.js, composeArchive, 16×14)
//   wallshelf_l      4×1, h 94  at (1–4, 1–2): the curved bookcase, its west end turning into the room
//   wallshelf_r      4×1, h 94  at (11–14, 1–2), its east end turning     ← archive_furniture:wallshelf_top/bot_a…d
//                    (SNES spends two rows on each case's height; here it stands on row 2 against the wall)
//   shelf_free       2×1, h 62  at (2–3, 4), (12–13, 4), (2–3, 10), (12–13, 10) ← shelf_free_l/_r
//   desk             2×1, h 36  at (7–8, 5): papers, an open book, ink, seven cold cups ← desk_l/_r
//   teapot           1×1, h 16  at (7, 8), standing on the Eye           ← archive_furniture:teapot
//   eye              2×2, h 0   floor piece at (7–8, 8–9), anchor at the corner the four tiles share;
//                    includes its own patch of Archive floor (limestone on the diagonal, cobalt keys) ← archive:eye_nw…se
//   stair_down       1×1, h 26  floor piece with its brass rail, at (13, 11) ← archive:stair_down
//
// THE CRYPT (archive.js, composeCrypt, 10×7)
//   crate            1×1, h 18  a single crate of council minutes        ← archive_furniture:crate
//   crate_stack      1×1, h 54  three crates against the north wall at (1, 2), (2, 2), (8, 2)
//                    (the SNES puts crate_stack_top on row 1 over crate_stack_bot on row 2) ← crate_stack_top/_bot
//   lectern          1×1, h 46  at (3, 3), with 'The Door That Does Not Open' open on it ← archive_furniture:lectern
//   (The Founders' Door at (5–6, 1–2) is in the act2_landmarks sheet.)
//
// THE LAMP ROOM (content/act2/harbor.js, composeLamp, 8×8)
//   lamp_0…3         2×2, h 98  at (3–4, 2–3), the lens turning (anim lamp, 250 ms) ← lamproom:lamp_x<x>y<y>_<0–3>
//   scope_sheet      1×1, h 58  at (6, 5) (covers the SNES's (6, 4) top too), while the Keeper has it
//                                                                       ← lamproom:scope_sheet_bot + scope_sheet_top
//   sheet_empty      1×1, h 8   at (6, 5), once the telescope is gone    ← lamproom:sheet_empty
//   polish_tin       1×1, h 4   a tin of polish and its rag, for the Keeper's corner ← lamproom:polish_tin

import { frame, POST } from '../lib/jobs.mjs';
import { render } from '../lib/render.mjs';
import { toImage, shadowImage, trim, maskImage } from '../lib/post.mjs';
import * as I from '../models/act2-interiors.mjs';

const prop = (name, build, fp = [1, 1], h = 40, opts = {}) => frame(name, build, { post: POST.prop, shadow: true, fp, h, ...opts });
const floor = (name, build, n, h = 0) => frame(name, build, { diamond: [n], fp: [n, n], h });

/** A floor piece cut to its diamond, plus whatever stands up from it (tagged 'prop'). */
function floorWithProp(name, build, opts) {
  return {
    name,
    render() {
      const fr = render(build(), { ss: 3, ground: 0 });
      let img = toImage(fr, POST.arch);
      img = maskImage(img, fr, (p, i) => {
        const sx = (i % fr.w) - fr.ax + 0.5, sy = Math.floor(i / fr.w) - fr.ay + 0.5;
        return p.tag === 'prop' || Math.abs(sx) / 32 + Math.abs(sy) / 16 <= 1;
      });
      return [{ name, img: trim(img), fp: opts.fp, h: opts.h, shadow: trim(shadowImage(fr)) }];
    },
  };
}

export default {
  name: 'act2_interiors',
  frames: () => {
    const out = [];
    // The Shop
    out.push(prop('shelving', () => I.shopShelving(4, { seed: 3 }), [4, 1], 88));
    out.push(prop('shelving_2', () => I.shopShelving(2, { seed: 7 }), [2, 1], 88));
    out.push(prop('counter', () => I.shopCounter(), [5, 1], 44));
    for (let i = 0; i < 2; i++) out.push(prop(`counter_glint_${i}`, () => I.shopCounter({ glint: i ? 1.2 : 0 }), [5, 1], 44));
    out.push(prop('marble_jar', () => I.marbleJar(), [1, 1], 36));
    out.push(prop('display_hat', () => I.displayStand('hat'), [2, 1], 42));
    out.push(prop('display_scope', () => I.displayStand('scope'), [2, 1], 40));
    out.push(prop('barometer', () => I.barometer(), [1, 1], 92));
    // The Archive
    out.push(prop('wallshelf_l', () => I.wallShelf('l', { seed: 4 }), [4, 1], 94));
    out.push(prop('wallshelf_r', () => I.wallShelf('r', { seed: 9 }), [4, 1], 94));
    out.push(prop('shelf_free', () => I.shelfFree(), [2, 1], 62));
    out.push(prop('desk', () => I.desk(), [2, 1], 36));
    out.push(prop('teapot', () => I.teapot(), [1, 1], 16));
    out.push(floor('eye', () => I.eye(), 2));
    out.push(floorWithProp('stair_down', () => I.stairDown(), { fp: [1, 1], h: 26 }));
    // The crypt
    out.push(prop('crate', () => I.crate(), [1, 1], 18));
    out.push(prop('crate_stack', () => I.crateStack(), [1, 1], 54));
    out.push(prop('lectern', () => I.lectern(), [1, 1], 46));
    // The lamp room
    for (let i = 0; i < 4; i++) out.push(prop(`lamp_${i}`, () => I.lamp({ turn: i / 4 }), [2, 2], 98));
    out.push(prop('scope_sheet', () => I.scopeSheet(), [1, 1], 58));
    out.push(prop('sheet_empty', () => I.sheetEmpty(), [1, 1], 8));
    out.push(prop('polish_tin', () => I.polishTin(), [1, 1], 4));
    return out;
  },
  anims: {
    counter_glint: { frames: ['counter_glint_0', 'counter_glint_1'], ms: [1400, 160] },
    lamp: { frames: ['lamp_0', 'lamp_1', 'lamp_2', 'lamp_3'], ms: 250 },
  },
};
