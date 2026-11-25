// The structure pass's new art in place (docs/design/structure-pass.md, sections 3 and 6; docs/art-act2.md):
// the Shop window's three states (and the guidebook after), the lamp room's telescope under its dust sheet
// and the sheet left empty, the Keeper with her telescope, the glasses NPCs, and the new icons on the
// bag's navy panel.
const W = 22, H = 13;
const blank = () => Array.from({ length: H }, () => Array(W).fill(null));
const ground = blank(), objects = blank(), overhead = blank();
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) ground[y][x] = `street:pave_${y % 2 ? 's' : 'n'}${x % 2 ? 'e' : 'w'}`;
// the Shop (x 0-9, y 0-5): the window display in each state
for (let y = 0; y < 6; y++) for (let x = 0; x < 10; x++) ground[y][x] = 'shop:floor';
const pair = (l, r, x, y) => { objects[y][x] = l; objects[y][x + 1] = r; };
pair('shop:display_l', 'shop:display_r', 1, 1);                 // with the hat (Act 2, before)
pair('shop:display_scope_l', 'shop:display_scope_r', 4, 1);     // with the telescope (Acts 2 and 4)
pair('shop5:display_fallen_l', 'shop5:display_fallen_r', 1, 4); // fallen over in the rise, the telescope in it (Act 5)
pair('shop5:display_guide_l', 'shop5:display_guide_r', 4, 4);   // the guidebook in pride of place (Act 5, after)
// the lamp room (x 10-17, y 0-5): the window ring, the telescope under its dust sheet facing the wall, the sheet empty
for (let y = 0; y < 6; y++) for (let x = 10; x < 18; x++) ground[y][x] = y === 0 ? 'lamproom:window' : 'lamproom:floor';
objects[1][11] = 'lamproom:scope_sheet_top'; objects[2][11] = 'lamproom:scope_sheet_bot';
objects[4][12] = 'lamproom:sheet_empty';

const sprites = [];
const at = (sheet, frame, tx, ty, extra = {}) => sprites.push({ sheet, frame, x: tx * 16 + 8, y: ty * 16 + 16, ...extra });
at('keeper', 'scope_up', 15, 1);                                 // at the window with it (Act 5, after the swap)
// on the paving: the glasses
at('watering_woman', 'water_down', 1, 9);                        // plain (once she's given them back)
at('watering_woman_glasses', 'water_down', 3, 9);                // with them up in her hair (Act 2, before)
at('bench_man', 'sit_down', 5, 9);                               // without them
at('bench_man_glasses', 'sit_down', 7, 9);                       // reading with them on
at('bench_man_glasses', 'down_0', 9, 9);                         // standing
at('bench_man_glasses', 'look_down', 11, 9);                     // the Man on Bridge (Act 4), over the rail
// the Keeper with her telescope
at('keeper', 'scope_down', 13, 9);                               // looking out to sea (Act 6 epilogue, the Harbor quay)
at('keeper', 'hold_down_0', 15, 9);                              // holding it, talking
at('keeper', 'scope_up', 13, 12);

// the bag's navy panel with the new and changed icons
function after(ctx, now, { drawSprite }) {
  const x0 = 17 * 16, y0 = 7 * 16;
  ctx.fillStyle = '#c8c0a8'; ctx.fillRect(x0 - 2, y0 - 2, 5 * 16 + 4, 4 * 16 + 4);
  ctx.fillStyle = '#182048'; ctx.fillRect(x0, y0, 5 * 16, 4 * 16);
  const icons = [['items_act2', 'telescope'], ['items_act2', 'tide_sheet'], ['items_act2', 'shop_hat'], ['items_act2', 'guidebook'],
                 ['items_act2', 'crowbar'], ['items2', 'hat']];
  icons.forEach(([sheet, frame], i) => drawSprite(ctx, { sheet, frame, x: x0 + 8 + 8 + (i % 3) * 24, y: y0 + 8 + 16 + Math.floor(i / 3) * 24 }, now));
}

export const SCENE = { title: 'Structure pass: telescope, glasses, Shop window, icons', ground, objects, overhead, sprites, after, scale: 3 };
