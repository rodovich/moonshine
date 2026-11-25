// The QA description sweep's art (A6UaxuFHMT; docs/art-sweep.md): each piece beside what it replaces.
// Row 1: the Crown tower door shut | open; the clock | the paler square where it hung.
// Row 2: the Founders' door open | with Ottilie's sign; the Shop window with the hat | the guidebook open.
// Row 3: the cave mouth (old path) | at low tide; the new path's cave | at low tide; the Water Stairs wet | deeper.
// Row 4: the court's back line, grey sheets | white and flat in the wind; the nets on the quay; the bell; the clapper; the lemons.
const W = 24, H = 20;
const blank = () => Array.from({ length: H }, () => Array(W).fill(null));
const ground = blank(), objects = blank(), overhead = blank();
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) ground[y][x] = `street:pave_${y % 2 ? 's' : 'n'}${x % 2 ? 'e' : 'w'}`;
const put = (L, x, y, f) => { L[y][x] = f; };
// the tower: clock tiles (y 0-2) and door tiles (y 3-4), twice
for (const [ox, open] of [[0, false], [3, true]]) {
  for (let j = 0; j < 3; j++) for (let i = 0; i < 2; i++)
    put(ground, ox + i, j, open ? `tower_noclock:noclock_x${i}y${j}` : `bell_tower:bell_tower_x${2 + i}y${2 + j}`);
  for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++)
    put(ground, ox + i, 3 + j, open ? `tower_open:tower_open_x${i}y${j}` : `bell_tower:bell_tower_x${2 + i}y${5 + j}`);
}
// the Founders' door
for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
  put(ground, 7 + i, 1 + j, `founders_door_open:founders_door_open_x${i}y${j}`);
  put(ground, 10 + i, 1 + j, `founders_door_sign:founders_door_sign_x${i}y${j}`);
}
// the Shop window
for (let x = 13; x < 20; x++) for (let y = 0; y < 4; y++) put(ground, x, y, 'shop:floor');
put(objects, 14, 1, 'shop:display_l'); put(objects, 15, 1, 'shop:display_r');
put(objects, 17, 1, 'shop_epi:display_book_l'); put(objects, 18, 1, 'shop_epi:display_book_r');
// the caves and the stairs
put(ground, 0, 7, 'goatpath:cave_mouth_0'); put(ground, 2, 7, 'cave_low:cave_mouth_low');
put(ground, 5, 7, 'goatcliff:x1y37_0'); put(ground, 5, 8, 'goatcliff:x1y38_0');
put(ground, 7, 7, 'cliff_low:x1y37_low'); put(ground, 7, 8, 'cliff_low:x1y38_low');
['l', 'm', 'm', 'r'].forEach((k, i) => {
  put(ground, 10 + i, 6, `reveal:wstairs_top_${k}`); put(ground, 10 + i, 7, `bilge_flood:wstairs_wet_${k}`);
  put(ground, 15 + i, 6, `reveal:wstairs_top_${k}`); put(ground, 15 + i, 7, `bilge_deep:wstairs_deep_${k}`);
});
// the back line, grey (Act 4 morning) and in the wind (Acts 5-6)
'abcdefgh'.split('').forEach((c, i) => {
  put(objects, i, 11, `laundry:backline_sheets_${c}_n@grey`); put(objects, i, 12, `laundry:backline_sheets_${c}_s@grey`);
  put(objects, 9 + i, 11, `laundry_wind:backline_wind_${c}_n`); put(objects, 9 + i, 12, `laundry_wind:backline_wind_${c}_s`);
});
// the nets on the quay, the bell, the lemon tree
put(objects, 18, 12, 'harbor_props:nets');
for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) put(objects, 20 + i, 10 + j, `belfry_bell:over_bell_x${i}y${j}_0`);
put(objects, 3, 16, 'court_tree:lemon_trunk');
[['nw', 'n', 'ne'], ['w', 'c', 'e'], ['sw', 's', 'se']].forEach((row, j) =>
  row.forEach((p, i) => put(overhead, 2 + i, 15 + j, `court_tree:over_lemon_${p}`)));

const sprites = [{ sheet: 'clockshop', frame: 'clapper', x: 9 * 16 + 8, y: 17 * 16 }];
export const SCENE = { title: 'QA sweep: what the descriptions promise', ground, objects, overhead, sprites, scale: 3 };
