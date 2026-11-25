// Act 6 on the surface (docs/design/06-moon-in-the-bowl.md), for judging the art in place.
// ?state=bilge_night (default): Dry Canal Day at night, lanterns on poles along both quays, the crowd.
// refill1 / refill2 / refill3: the sea rushing back up the trench, the Boatman's boat rising with the piano.
// harbor_dawn: the Teeth sliding away, the ferry level at her landing, the water back to its height.
// court_piano: the piano delivered by Cheryl's door; the well's grate lifted.
// steps_race: Stair Race bunting over landing 2, the finish tape, the rope barrier round the open step.
// Night states are shown under the night tint. The engine keeps the lamp colors (lamp_glow, lamp_warm)
// bright under it (EMISSIVE in tints.js); this dev page doesn't, so the lanterns look dimmer here.
import { SCENE as act4 } from './scene-act4-surface.js';
import { SCENE as act5 } from './scene-act5-surface.js';
import { SCENE as court } from './scene-court.js';

export function SCENE(state = 'bilge_night') {
  if (state.startsWith('refill')) return refill(+state.slice(-1) || 1);
  if (state === 'harbor_dawn') return harborDawn();
  if (state === 'court_piano') return courtPiano();
  if (state === 'steps_race') return stepsRace();
  return bilgeNight();
}

const at = (x, y, extra = {}) => ({ x: x * 16 + 8, y: (y + 1) * 16, ...extra });
const copy = (S) => ({ ...S, ground: S.ground.map(r => r.slice()), objects: S.objects.map(r => r.slice()), overhead: S.overhead.map(r => r.slice()), sprites: (S.sprites || []).slice() });

// ---- Dry Canal Day at night: lanterns along both quays, the crowd on the north quay ----
function bilgeNight() {
  const S = copy(act4('dry'));
  S.sprites = S.sprites.filter(s => !['critters', 'clockmaker', 'note_bubble'].includes(s.sheet));
  const lanterns = [];
  for (const x of [2, 7, 18, 24, 29]) lanterns.push([x, 6]);      // north quay, by the coping
  for (const x of [4, 10, 16, 22, 27]) lanterns.push([x, 12]);    // south quay
  lanterns.forEach(([x, y], i) => {
    S.sprites.push({ sheet: 'lantern', frame: i % 2 ? 'lantern_b' : 'lantern_a', phase: i * 170, ...at(x, y) });
    S.objects[y][x + 1] = 'lantern_pool:pool_wide';
  });
  // the crowd on the north quay, and the Mayor on the bridge
  const crowd = [
    ['crowd_a', 'cheer_down', 5, 5], ['crowd_b', 'point_down', 9, 5], ['counting_woman', 'down_0', 15, 5],
    ['basin_woman', 'down_0', 20, 5], ['watering_woman', 'down_0', 21, 4], ['crowd_a', 'point_down', 26, 5],
    ['kid', 'down_0', 11, 6], ['crowd_b', 'cheer_down', 28, 4],
  ];
  crowd.forEach(([sheet, frame, x, y], i) => S.sprites.push({ sheet, frame, phase: i * 230, ...at(x, y) }));
  S.sprites.push({ sheet: 'mayor', frame: 'gesture_down', ...at(13, 8) });
  return { ...S, title: 'bilge_dry at night: Dry Canal Day (lanterns, the crowd)', tint: 'night' };
}

// ---- The refill: water rises over the mud (1), up the hull's lower course (2), to the tide line (3) ----
function refill(stage) {
  const S = copy(act4('dry'));
  const rows = { 1: [10], 2: [9, 10], 3: [8, 9, 10] }[stage];
  for (let x = 0; x < 32; x++) {
    if (x === 12 || x === 13) continue;                         // the bridge deck stands clear
    rows.forEach((y, i) => { S.ground[y][x] = i === 0 ? 'refill:rush_top' : (stage === 3 && y === 10 ? 'refill:rush_deep' : 'refill:rush'); });
    rows.forEach(y => { if (S.objects[y]) S.objects[y][x] = null; });
  }
  S.overhead = S.overhead.map(r => r.map(() => null));         // the wind has dropped
  // keep the crowd watching from the north quay; the boats lift; the piano rides in the Boatman's boat
  const surface = { 1: 11, 2: 10, 3: 9 }[stage];                // the row below the boat's waterline
  S.sprites = [
    { sheet: 'boatman_piano', frame: 'piano_rock', x: 23 * 16, y: surface * 16 },
    { sheet: 'crowd_a', frame: 'cheer_down', ...at(6, 5) }, { sheet: 'crowd_b', frame: 'cheer_down', phase: 300, ...at(9, 5) },
    { sheet: 'mover', frame: 'lookup_down', alt: 'big', ...at(16, 5) }, { sheet: 'mover', frame: 'lookup_down', alt: 'other', ...at(18, 5) },
  ];
  for (const x of [2, 7, 18, 24, 29]) S.sprites.push({ sheet: 'lantern', frame: 'lantern_a', ...at(x, 6) });
  return { ...S, title: `The refill, stage ${stage}`, tint: 'night' };
}

// ---- The Harbor at dawn: the Teeth slide away; the water is back at the quay; the ferry level ----
function harborDawn() {
  const S = copy(act5('harbor_teeth3'));
  // the hull row (10) and the wash (11) go back under the sea: the quay edge meets the water again
  for (let x = 0; x < 32; x++) {
    if (S.ground[10][x] && S.ground[10][x].startsWith('harbor_hull')) S.ground[10][x] = 'sea:wash_a';
    if (S.ground[11][x] && S.ground[11][x].startsWith('sea:wash')) S.ground[11][x] = `sea:sea_${x % 2 ? 'ne' : 'nw'}`;
  }
  S.sprites = S.sprites.map(s => s.sheet === 'teeth' ? { ...s, sheet: 'teeth_recede', frame: 'recede' }
    : s.sheet === 'ferry' ? { ...s, sheet: 'ferry_level', frame: 'persistence_level' } : s);
  return { ...S, title: 'The Harbor at dawn: the Teeth receding, the ferry level', tint: 'day' };
}

// ---- Cistern Court in the morning: the piano delivered by Cheryl's door; the well's grate up ----
function courtPiano() {
  const S = copy(court('morning'));
  for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) S.objects[16 + y][9 + x] = `well_lift:well_lift_x${x}y${y}_2`;
  S.sprites.push({ sheet: 'piano_delivered', frame: 'piano_delivered', x: 2 * 16 + 8, y: 13 * 16 });
  return { ...S, title: 'Cistern Court, morning: the piano delivered; the well open', hero: [5 * 16 + 8, 13 * 16, 'left'] };
}

// ---- The Hundred Steps on race morning: landing 2, bunting, the finish, the barrier ----
function stepsRace() {
  const W = 14, H = 12;
  const blank = () => Array.from({ length: H }, () => Array(W).fill(null));
  const ground = blank(), objects = blank(), overhead = blank();
  const pave = (x, y) => `street:pave_${y % 2 ? 's' : 'n'}${x % 2 ? 'e' : 'w'}`;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) ground[y][x] = pave(x, y);
  // the flight comes down cols 6-7: steps, landing 2 (rows 5-6), steps, the open hundredth step (row 9)
  const flight = ['steps', 'steps', 'steps', 'steps_moon', 'steps', 'landing', 'landing', 'steps', 'steps', 'hollow_open', 'steps', 'steps'];
  flight.forEach((n, y) => { ground[y][6] = `steps:${n}_l`; ground[y][7] = `steps:${n}_r`; });
  // retaining walls flank the flight
  for (let y = 0; y < H; y++) { if (y !== 5 && y !== 6) { ground[y][5] = 'street:retain'; ground[y][8] = 'street:retain'; } }
  // bunting strung over landing 2 (overhead), and the finish tape across the top of the flight
  'abcd'.split('').forEach((s, i) => { overhead[4][4 + i] = `bunting:over_bunting_${s}`; });
  objects[1][6] = 'bunting:finish_tape_l'; objects[1][7] = 'bunting:finish_tape_r';
  // the little rope barrier round the open step: 4x3 at (5-8, 8-10), hole at (6-7, 9)
  for (let y = 0; y < 3; y++) for (let x = 0; x < 4; x++) objects[8 + y][5 + x] = `step_barrier:step_barrier_x${x}y${y}`;
  objects[5][3] = 'props:pot_geranium'; objects[6][10] = 'props:pot_geranium';
  const sprites = [
    { sheet: 'sweaty_kid', frame: 'arms_up', ...at(6, 2) },
    { sheet: 'crowd_a', frame: 'cheer_down', ...at(3, 6) }, { sheet: 'crowd_b', frame: 'cheer_down', phase: 260, ...at(10, 5) },
    { sheet: 'counting_woman', frame: 'down_0', ...at(9, 6) }, { sheet: 'girl', frame: 'jump_down', alt: 'b', ...at(2, 3) },
  ];
  return { title: 'Hundred Steps: Stair Race morning', ground, objects, overhead, sprites, scale: 3, tint: 'day' };
}
