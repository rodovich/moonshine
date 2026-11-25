// Act 5's sprites and icons lined up on paving, idles animating (docs/design/05-high-and-dry.md).
const W = 20, H = 11;
const blank = () => Array.from({ length: H }, () => Array(W).fill(null));
const ground = blank(), objects = blank(), overhead = blank();
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) ground[y][x] = `street:pave_${y % 2 ? 's' : 'n'}${x % 2 ? 'e' : 'w'}`;

const sprites = [];
const at = (sheet, frame, tx, ty, extra = {}) => sprites.push({ sheet, frame, x: tx * 16 + 8, y: ty * 16 + 16, ...extra });

// Row 1: the Kid's relay.
['dash_left', 'dash_right', 'dash_down', 'jump_down', 'splat_down', 'slap_up', 'wind_down'].forEach((f, i) => at('kid_relay', f, 1 + i * 2, 2));
at('sweaty_kid', 'arms_up', 15, 2);
// Row 2: Cheryl's Act 5 poses.
['lower_down_0', 'catch_up', 'climbrope_up_0', 'point_left', 'discup_up', 'sitcoil_down'].forEach((f, i) => at('cheryl', f, 1 + i * 2, 5));
sprites.push({ sheet: 'disc_fx', frame: 'disc_flare', x: 9 * 16 + 8, y: 4 * 16 + 10 });   // the disc between her raised hands
at('bucket_rope', 'bucket_rope_full', 1, 7);
// Row 3: the Keeper, the Clockmaker, the Fishmonger, the crowd, the Boatman's throw.
['polish_up', 'window_up', 'shade_down'].forEach((f, i) => at('keeper', f, 1 + i * 2, 9));
at('clockmaker', 'bench_up', 7, 9);
at('clockmaker', 'jug_down', 9, 9);
at('fishmonger', 'give_down', 11, 9);
at('crowd_a', 'cheer_down', 13, 9);
at('crowd_b', 'point_down', 14, 9);
at('boatman_mud', 'throw', 17, 9);
// Icons along the top.
['bucket_empty', 'bucket_full', 'rope', 'brass_polish', 'clapper'].forEach((f, i) => at('items_act5', f, 12 + i, 4, { y: 4 * 16 + 16 }));
at('disc_fx', 'disc_dim', 17, 4);

export const SCENE = { title: "Act 5's sprites and icons", ground, objects, overhead, sprites, scale: 3 };
