// TEMPORARY stand-in art for Act 2 part 1, for pieces the art task hasn't drawn
// yet (requested from Kn_OwEk0wq; see README.md, "Stand-ins"). Same format as
// the art modules, so swapping in the real frames is a one-line change at each
// use. Shapes are generated, not hand-drawn, to keep them obviously provisional.

const blank = (w, h) => Array.from({ length: h }, () => Array(w).fill('.'));
const rows = (g) => g.map((r) => r.join(''));

// A filled disc (cx, cy, r) with an outline, on a w×h grid.
function disc(w, h, cx, cy, r, fill, edge, grid = blank(w, h)) {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
    if (d <= r - 1) grid[y][x] = fill;
    else if (d <= r) grid[y][x] = edge;
  }
  return grid;
}

// Cut a 32×32 grid into four 16×16 frames named <name>_nw/_ne/_sw/_se.
function quarters(name, grid) {
  const out = {};
  for (const [k, ox, oy] of [['nw', 0, 0], ['ne', 16, 0], ['sw', 0, 16], ['se', 16, 16]]) {
    out[`${name}_${k}`] = grid.slice(oy, oy + 16).map((r) => r.slice(ox, ox + 16).join(''));
  }
  return out;
}

// The Eye: a round window of thick old glass in the Archive floor, dark beneath.
function eye() {
  const g = disc(32, 32, 16, 16, 15, 'd', 'k');
  disc(32, 32, 16, 16, 13.5, 'v', 'b', g);
  disc(32, 32, 16, 16, 11, 'v', 'v', g);
  // a rim of brass and one highlight
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const d = Math.hypot(x + 0.5 - 16, y + 0.5 - 16);
    if (d > 13.5 && d <= 14.5) g[y][x] = 'y';
  }
  g[8][10] = g[8][11] = g[9][9] = g[9][10] = 'W';
  g[10][9] = 'b';
  return g;
}

// Scrape marks: two scored lines along a row of paving, joining at the edges.
const scrape = [
  '................',
  '................',
  '................',
  '................',
  '................',
  'sssss..ssssss.ss',
  'SSSSSSSSSSSSSSSS',
  '..s.......s.....',
  '................',
  'ss.sssssss..ssss',
  'SSSSSSSSSSSSSSSS',
  '.....s.......s..',
  '................',
  '................',
  '................',
  '................',
];

// The same lines running north–south, and a corner turning from south to east.
const scrapeV = scrape.map((_, y) => scrape.map((r) => r[y]).join(''));
const scrapeCorner = scrape.map((r, y) => scrapeV[y].split('').map((c, x) => {
  const h = r[x] !== '.' && x >= 6;
  const v = c !== '.' && y <= 9;
  return h ? r[x] : v ? c : '.';
}).join(''));

// A trickle of water (two frames, a drop that wobbles).
const trickle = (o) => [
  '................',
  '................',
  '................',
  '................',
  '................',
  '......' + (o ? '.' : 'W') + 'w' + (o ? 'W' : '.') + '.......',
  '.....wWww.......',
  '....wwbwwbw.....',
  '...wbwwbwwbw....',
  '....wbbwbbw.....',
  '.....wwbww......',
  '................',
  '................',
  '................',
  '................',
  '................',
];

// The Movers' crowbar, lying on the paving, with a glint.
const crowbar = (glint) => [
  '................',
  '................',
  '................',
  '................',
  '................',
  '..........' + (glint ? 'W' : '.') + '.....',
  '..kk.....kW' + (glint ? 'W' : '.') + 'k...',
  '.kiIk..kkiIkk...',
  '.kiiIkkiiIk.....',
  '..kkiiiiIkk.....',
  '....kkiikk......',
  '......kk........',
  '................',
  '................',
  '................',
  '................',
];

// A jar of marbles, every marble on the right-hand side.
const marbleJar = [
  '................',
  '.....kkkkkk.....',
  '.....kyyyyk.....',
  '....kkkkkkkk....',
  '....kG....Gk....',
  '...kG......Gk...',
  '...kG....rbGk...',
  '...kG...bYrGk...',
  '...kG...rbmGk...',
  '...kG..mYbrGk...',
  '...kG..brmYGk...',
  '...kG.rmbYbGk...',
  '...kGGGGGGGGk...',
  '....kkkkkkkk....',
  '................',
  '................',
];

// A barometer on the wall: a round brass face. FAIR.
const barometer = (() => {
  const g = disc(16, 16, 8, 8, 6.5, 'W', 'y');
  g[8][8] = 'k'; g[7][9] = 'k'; g[6][10] = 'k';
  for (const [x, y] of [[4, 8], [12, 8], [8, 4]]) g[y][x] = 'z';
  return rows(g);
})();

// A rope barrier between two posts, with a hanging sign.
const ropeL = [
  '................',
  '................',
  '..kk............',
  '.kIik...........',
  '.kiik...........',
  '.kiikTT.........',
  '.kiik..TT.......',
  '.kiik....TTT....',
  '.kiik.......TTTT',
  '.kiik...........',
  '.kiik...........',
  '.kiik...........',
  '.kiik...........',
  'kkiikk..........',
  'kjjjjk..........',
  '.kkkk...........',
];
const ropeR = ropeL.map((r) => r.split('').reverse().join(''));
const ropeSign = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  'TTT..........TTT',
  '...TTTk..kTTT...',
  '...kkkkkkkkkk...',
  '...kWWWWWWWWk...',
  '...kWrrWrrWWk...',
  '...kWWWWWWWWk...',
  '...kWrWrrWrWk...',
  '...kkkkkkkkkk...',
  '................',
];

// A lectern with an open monograph.
const lectern = [
  '................',
  '................',
  '..kkkkkkkkkkkk..',
  '.kWWWWWkWWWWWWk.',
  '.kWzzzWkWzzzzWk.',
  '.kWWWWWkWWWWWWk.',
  '.kWzzWWkWzzzWWk.',
  '..kkkkkkkkkkkk..',
  '...kOOOOOOOOk...',
  '......kOOk......',
  '......kOpk......',
  '......kOpk......',
  '......kOpk......',
  '....kkkOpkkk....',
  '....kpppppppk...',
  '................',
];

export const standins = {
  palette: {
    k: 'ink', s: 'stone_dark', S: 'stone_mid', w: 'water_light', W: 'white_light', b: 'water', d: 'void', v: 'slate_deep',
    i: 'iron', I: 'iron_light', j: 'iron_deep', y: 'brass', z: 'brass_shade', Y: 'bloom_yellow', r: 'bloom_red', m: 'cobalt',
    G: 'glass_light', T: 'terra', O: 'wood', p: 'wood_shade',
  },
  size: [16, 16],
  frames: {
    scrape, scrape_v: scrapeV, scrape_corner: scrapeCorner,
    trickle_0: trickle(0), trickle_1: trickle(1),
    crowbar_0: crowbar(false), crowbar_1: crowbar(true),
    marble_jar: marbleJar,
    barometer,
    rope_l: ropeL, rope_r: ropeR, rope_sign: ropeSign,
    lectern,
    ...quarters('eye', eye()),
  },
  durations: { trickle: 180, crowbar: [1400, 160] },
};
