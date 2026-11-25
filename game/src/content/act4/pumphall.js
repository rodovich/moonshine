// The Pump Hall (26 × 12) under Fountain Square, and the Tide Wheel (12 × 10)
// east of it: the Three Sisters, waking them, and the rise
// (docs/design/04-the-list.md, "Pump Hall", "Waking the Sisters", "The rise").
//
//       01234567890123456789012345
//    0  XXXXXXXXXXXXXXXXXXXXXXXXXX
//    1  X#H###################E##X   H ladder up to the Fountain (2); E emergency ladder (22)
//    2  X#H###################E##X   the drive shaft runs overhead along y1, x3-24
//    3  X....SSS...T....MM.......X   S Stout (5-7); T Thin (11); M Middle (16-17)
//    4  X....SSS...T....MM.......X
//    5  X.....v....v....v........X   v wake-valves (6, 11, 16)
//    6  X........................:   : east archway → Tide Wheel
//    7  X........................:
//    8  X........................X
//    9  X...gg...gg...gg...gg....X   gg grates over the ballast cells
//   10  X........................X
//   11  XXXXXXXXXXXXXXXXXXXXXXXXXX

import { composedMap, blankGrid, bump, cherylDeclines } from './common.js';
import { act4Tiles } from './tiles.js';

const W = 26, H = 12;

// The Sisters as they stand on the floor, and the order they wake in.
export const SISTERS = {
  stout: { x: 5, w: 3, valve: 6, wake: 2 },
  thin: { x: 11, w: 1, valve: 11, wake: 1 },
  middle: { x: 16, w: 2, valve: 16, wake: 3 },
};
const GRATES = [4, 9, 14, 19];
const FLOOD_STOP = 18;
const BASIN = [11, 9]; // the flood never comes further east than this column

const darkPlayerLight = (g) => (g.hasItem('moonglass_disc') ? { radius: 3, color: 'relic_cyan' } : { radius: 2 });

// Is this Sister running?
export const running = (g, name) => !!g.flag('pumps.running') || (g.flag('pump.order') || 0) >= SISTERS[name].wake;

function compose(g) {
  const f = (n) => g.flag(n);
  const ground = blankGrid(W, H), detail = blankGrid(W, H), overhead = blankGrid(W, H);
  const solid = blankGrid(W, H, false);
  const step = blankGrid(W, H);
  const set = (layer, x, y, ref, s) => { layer[y][x] = ref; if (s !== undefined) solid[y][x] = s; };

  // Rock all round, the north wall's two faces, the slate floor.
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) set(ground, x, y, 'hull:top', true);
  for (let x = 1; x < W - 1; x++) { set(ground, x, 1, 'hull:face_top', true); set(ground, x, 2, 'hull:face_base', true); }
  for (let y = 3; y <= 10; y++) for (let x = 1; x < W - 1; x++) set(ground, x, y, (x * 5 + y * 3) % 11 === 0 ? 'hull:floor_worn' : 'hull:floor', false);
  // The east archway.
  for (const y of [6, 7]) set(ground, 25, y, 'hull:floor', false);
  // The ladder up to the Fountain.
  set(ground, 2, 1, 'hull:ladder_top', true); set(ground, 2, 2, 'hull:ladder_bot', !!f('pumps.burst'));
  // The emergency rungs and their hatch.
  const hatch = f('pumps.burst') ? (f('fx.hatch') === 'bang' ? 'erung_top_bang' : 'erung_top_open') : 'erung_top_shut';
  set(ground, 22, 1, `pumphall:${hatch}`, true);
  set(ground, 22, 2, 'pumphall:erung_bot', !f('pumps.burst'));

  // The main pipe down the north wall and along the west edge of the floor.
  set(detail, 1, 1, 'mainpipe:pipe_wall_top'); set(detail, 1, 2, 'mainpipe:pipe_wall_bot');
  for (let y = 3; y <= 10; y++) set(detail, 1, y, ['mainpipe:pipe_run', 'mainpipe:pipe_run_b', 'mainpipe:pipe_flange'][y % 3], true);
  set(detail, 1, 10, 'mainpipe:pipe_end', true);
  set(detail, 1, 6, f('pumps.burst') ? 'mainpipe:pipe_split' : 'mainpipe:pipe_weep', true);
  if (f('pumps.burst')) {
    overhead[5][1] = 'mainpipe:over_spray_pn'; overhead[7][1] = 'mainpipe:over_spray_ps';
    ['n', 'm', 's'].forEach((r, i) => { overhead[5 + i][2] = `mainpipe:over_spray_${r}a`; overhead[5 + i][3] = `mainpipe:over_spray_${r}b`; });
  }

  // The Sisters: drawn three tall, the top row in front of the wall's lower face.
  for (const [name, s] of Object.entries(SISTERS)) {
    let state = f(`fx.cough.${name}`) ? 'cough' : running(g, name) ? 'run' : 'sleep';
    if (name === 'middle' && !f('pump.throat')) state = 'empty';
    for (let r = 0; r < 3; r++) for (let c = 0; c < s.w; c++) set(detail, s.x + c, 2 + r, `sisters:${name}_${state}_x${c}y${r}`, r > 0 ? true : undefined);
    const turning = f(`fx.valve.${name}`);
    set(detail, s.valve, 5, `sisters:${turning ? 'wake_turn' : running(g, name) ? 'wake_open' : 'wake_shut'}`, true);
  }
  // The drive shaft along the top of the wall, turning once the bell's been rung.
  const turn = f('bell.restored') ? '' : '_still';
  for (let x = 3; x <= 24; x++) overhead[1][x] = (x - 3) % 5 === 2 ? `sisters:over_shaft_bearing${turn}` : `sisters:over_shaft${turn}`;
  overhead[1][3] = 'sisters:over_shaft_end_w';

  // The cell grates: full, draining, then dry.
  const grate = { drain: 'grate_drain', dry: 'grate_dry' }[f('fx.grates')] || (f('pumps.running') ? 'grate_dry' : 'grate_full');
  for (const x of GRATES) { set(ground, x, 9, `pumphall:${grate}_l`, false); set(ground, x + 1, 9, `pumphall:${grate}_r`, false); }

  // The flood, spreading east from the split main.
  const front = f('fx.flood') || (f('pumps.burst') ? FLOOD_STOP : 0);
  if (front) {
    for (let y = 3; y <= 10; y++) for (let x = 2; x <= front; x++) {
      if (solid[y][x] && detail[y][x]) continue; // the Sisters' feet and valves stay above it
      set(ground, x, y, x === front ? 'pumphall:flood_edge_e' : x < front - 2 ? 'pumphall:flood' : 'pumphall:flood_film', true);
    }
  }
  for (let y = 3; y <= 10; y++) for (let x = 1; x < W; x++) if (!step[y][x]) step[y][x] = 'step_stone';
  return { ground, detail, overhead, solid, step };
}

// ---------------------------------------------------------------------------
// Looking and waking

const sisterLooks = {
  stout: (g) => (running(g, 'stout')
    ? g.describe('Thump. Thump. Like a heart that\'s just remembered how.')
    : g.describe(...(bump(g, 'look.stout') === 0 ? ['A pump, broad as a cart, with a great beam on top. The stout one.', "Asleep. Her beam hasn't moved in a hundred years."] : ["Asleep. Her beam hasn't moved in a hundred years."]))),
  thin: (g) => (running(g, 'thin')
    ? g.describe("Quick little strokes. She's in a hurry.")
    : g.describe('A pump, narrow as a chimney. The thin one.')),
  middle: (g) => {
    if (running(g, 'middle')) return g.describe('Thumping along with the others. The greedy one.');
    if (g.flag('pump.throat')) return g.describe('The middle one. The greedy one, Mott\'s grandad said. She looks perfectly reasonable.');
    if (g.hasItem('copper_throat')) return g.describe("That gap is exactly the shape of Mott's copper.");
    return g.describe('A middle-sized pump. There\'s a gap in her throat, where a pipe should go. Something\'s missing.', 'Copper, by the shape of the clamps. Coiled.');
  },
};

const fitThroat = async (g) => {
  if (g.flag('pump.throat')) return cherylDeclines(g);
  g.takeItem('copper_throat');
  g.pose('player', 'reach_up');
  g.sfx('clamp_lift');
  await g.wait(0.5);
  g.setFlag('pump.throat');
  g.pose('player', null);
  await g.describe("Mott's grandfather's copper. It goes in like it remembers the way. It does remember the way.");
};

const noPry = (g) => g.describe('No. These want to be woken, not pried.');
const notThatChart = (g) => g.describe("The moon chart isn't that sort of chart.");

const pumpLoops = { thin: 'pump_thin', stout: 'pump_stout' };

async function wakeValve(g, name) {
  if (g.flag('pumps.running')) return riseValve(g, name);
  if (!g.flag('bell.restored')) return g.describe("Nothing's turning. The big shaft's dead still.");
  if (running(g, name)) return g.describe('Open. She\'s running.');
  g.pose('player', 'wheel_up');
  g.setFlag(`fx.valve.${name}`, 1);
  g.sfx('valve_squeal');
  await g.wait(0.7);
  g.setFlag(`fx.valve.${name}`, null);
  g.pose('player', null);
  if (!g.flag('pump.throat')) {
    g.setFlag(`fx.cough.${name}`, 1);
    g.sfx('pump_cough');
    await g.wait(0.9);
    g.setFlag(`fx.cough.${name}`, null);
    return g.describe('She shivers and goes still. She needs her throat.');
  }
  const order = g.flag('pump.order') || 0;
  g.setFlag(`fx.cough.${name}`, 1);
  g.sfx('pump_cough');
  await g.wait(0.6);
  g.sfx('pump_cough');
  await g.wait(0.6);
  g.setFlag(`fx.cough.${name}`, null);
  if (SISTERS[name].wake !== order + 1) {
    // The wrong one: everyone coughs and stops; the valves spin shut.
    g.sfx('pump_stall');
    for (const id of Object.values(pumpLoops)) g.stopLoop(id, 200);
    g.setFlag('pump.order', 0);
    const n = bump(g, 'pump.wrong');
    return g.describe(n === 0 ? "They cough, and stop, like a class that's been asked a question." : n === 1 ? "Wrong order. They know it, even if I don't." : 'No.');
  }
  g.setFlag('pump.order', order + 1);
  if (name === 'middle') return rise(g);
  g.startLoop(pumpLoops[name]);
  g.sfx(`thump_${name}`);
  return g.describe(name === 'thin' ? 'She coughs, and catches, and goes.' : 'And the stout one. Thump. Thump.');
}

// After the Sisters are running, only the Middle Sister's valve does anything.
async function riseValve(g, name) {
  if (g.flag('pumps.burst')) return g.describe('Not now. Up.');
  if (name !== 'middle' || g.flag('rise.tried')) return g.describe('Not now.');
  return stuckValve(g);
}

const objects = [
  ...Object.keys(SISTERS).map((name) => ({
    id: `sister_${name}`, x: SISTERS[name].x, y: 3, w: SISTERS[name].w, h: 2,
    interact: sisterLooks[name],
    use: {
      copper_throat: name === 'middle' ? fitThroat : (g) => g.describe('That goes somewhere particular. Not here.'),
      crowbar: noPry, moon_chart: notThatChart, '*': cherylDeclines,
    },
  })),
  ...Object.keys(SISTERS).map((name) => ({
    id: `valve_${name}`, x: SISTERS[name].valve, y: 5,
    interact: (g) => wakeValve(g, name),
    use: { crowbar: noPry, moon_chart: notThatChart, copper_throat: name === 'middle' ? fitThroat : undefined, '*': cherylDeclines },
  })),
  {
    id: 'drive_shaft', x: 3, y: 1, w: 18,
    interact: (g) => g.describe(g.flag('bell.restored')
      ? 'A bronze shaft along the top of the wall, turning slow and steady. From the Tide Wheel. From the bell.'
      : 'A bronze shaft along the top of the wall. Still.'),
  },
  ...GRATES.map((x) => ({
    id: `grate_${x}`, x, y: 9, w: 2, lookKey: 'grates',
    interact: (g) => {
      if (g.flag('pumps.running')) return g.describe('Dry. The cells under the floor are empty.');
      return g.describe(bump(g, 'look.grates') === 0 ? 'A grate in the floor. Underneath, dark water, very close. Fuller than it should be, I think.' : 'Full.');
    },
  })),
  {
    id: 'emergency_ladder', x: 22, y: 1, h: 2,
    interact: (g) => {
      if (g.flag('pumps.burst')) return g.changeMap('emergency_shaft', 2, 28, 'up'); // open: clicking it climbs
      return g.describe(...(bump(g, 'look.eladder') === 0
        ? ['Rungs up the wall, to a hatch that\'s shut tight. A little wave pictured on it, and an arrow pointing up.', 'For emergencies. I hope I never find out what kind.']
        : ['For emergencies.']));
    },
  },
  {
    id: 'fountain_ladder', x: 2, y: 1, h: 2,
    interact: async (g) => {
      if (g.flag('pumps.burst')) return g.describe("Under water. That way's gone.");
      await g.describe('Back up to the Fountain.');
      g.sfx('step_stairs');
      return g.changeMap('fountain_square', ...BASIN, 'down');
    },
  },
  {
    id: 'main_pipe', x: 1, y: 3, h: 8,
    interact: (g) => g.describe(g.flag('pumps.burst')
      ? 'Split open, and roaring. All that water, with nowhere to go but up the Fountain.'
      : 'A great pipe along the wall. One of its joints is weeping, a bead at a time.'),
  },
].map((o) => ({ solid: false, use: { '*': cherylDeclines }, ...o }));
for (const o of objects) for (const k of Object.keys(o.use)) if (!o.use[k]) delete o.use[k];

// ---------------------------------------------------------------------------
// The rise (design steps 1–13).

async function rise(g) {
  // 1. All three running together; the pumps cue carries their thumps.
  for (const id of Object.values(pumpLoops)) g.stopLoop(id, 0);
  g.setFlag('pumps.running');
  g.sfx('thump_middle');
  g.playMusic('pumps', { fadeMs: 0 });
  await g.describe("She coughs, and catches, and goes. All three of them.");
  // 2. The water under the grates drops.
  g.sfx('grate_drain');
  g.setFlag('fx.grates', 'drain');
  await g.wait(4);
  g.setFlag('fx.grates', 'dry');
  // 3. A long creak, and the floor eases back toward level.
  g.sfx('hull_creak_long');
  await g.tilt(-1, 0, 2);
  // 4–6.
  await g.describe("The floor's levelling. I can feel it through my shoes.", "It worked. It's working.");
  await g.wait(3);
  await g.describe("Middle sister's greedy. Put her back to bed.");
  // 7. Control returns: she must walk to the Middle Sister's valve.
}

async function stuckValve(g) {
  g.setFlag('rise.tried');
  g.pose('player', 'wheel_up');
  g.sfx('valve_squeal');
  await g.shake(1, 0.6);
  g.pose('player', null);
  g.startLoop('valve_hiss');
  await g.describe("It won't close. It smells like Mott's shack.", "The coil's stuck open. Forty years of making moonshine. It's forgotten how to stop.");
  // 9. The creak again; the floor tilts the other way and keeps going.
  g.sfx('hull_creak_long');
  g.bendMusic(60, 6000);
  const tilt = g.tilt(2, 0, 3);
  await g.movePlayer([20, 6], { speed: 18 });
  await tilt;
  await g.wait(1);
  // 10. Ears pop.
  g.sfx('ear_pop');
  await g.wait(0.6);
  await g.describe("My ears just popped. Underground. That's not right.");
  // 11. The groan, then the main splits.
  g.sfx('groan_great');
  await g.shake(3, 1.2);
  g.sfx('burst');
  g.stopMusic(0);
  g.stopLoop('valve_hiss', 300);
  g.setFlag('pumps.burst');
  g.setFlag('fx.flood', 2);
  g.setFlag('fx.hatch', 'bang');
  g.sfx('hatch_bang');
  g.startLoop('spray'); g.startLoop('roar'); g.startLoop('water_spread'); g.startLoop('air_whistle');
  g.shake(2, 0.8);
  for (let x = 3; x <= FLOOD_STOP; x++) {
    g.setFlag('fx.flood', x);
    await g.wait(6 / (FLOOD_STOP - 2));
  }
  g.setFlag('fx.flood', null);
  g.setFlag('fx.hatch', null);
  g.stopLoop('water_spread', 1500);
  g.facePlayer('up');
  // 12.
  await g.think('Up, then.');
  // 13. Control returns.
}

export const pumpHallMap = composedMap(compose, {
  id: 'pump_hall',
  name: 'The Pump Hall',
  tileset: act4Tiles,
  music: 'downstairs',
  ambience: ['hull', 'drips', 'shaft_hum'], // the bell's been rung before anyone gets down here
  dark: 0.7,
  playerLight: darkPlayerLight,
  lights: (g) => [
    ...Object.entries(SISTERS).map(([name, s]) => ({ x: s.x + (s.w - 1) / 2, y: 3, radius: running(g, name) ? 3 : 2, color: 'relic_amber' })),
    ...GRATES.map((x) => ({ x: x + 0.5, y: 9, radius: 1, color: 'relic_cyan', when: (gg) => !gg.flag('pumps.running') })),
  ],
  spawn: [2, 3],
  exits: [
    // Up to the dry Fountain's basin (walkable only in Act 4's state of the Square, so it's passed as a variable).
    { x: 2, y: 2, when: (g) => !g.flag('pumps.burst'), sfx: 'step_stairs', run: (g) => g.changeMap('fountain_square', ...BASIN, 'down') },
    { x: 25, y: 6, h: 2, to: 'tide_wheel', at: [1, 4], facing: 'right', when: (g) => !g.flag('pumps.burst') },
    { x: 22, y: 2, to: 'emergency_shaft', at: [2, 28], facing: 'up', when: (g) => !!g.flag('pumps.burst') },
  ],
  triggers: [
    {
      // Walking west toward the flood.
      x: FLOOD_STOP + 1, y: 3, h: 8,
      when: (g) => !!g.flag('pumps.burst') && g.player.facing === 'left',
      run: (g) => g.describe('Not that way.'),
    },
  ],
  onEnter: async (g) => {
    g.stopLoop('hull_far', 1000); g.stopLoop('thrum', 2000);
    if (g.flag('pumps.burst')) return;
    if (!g.flag('seen.pumphall')) {
      g.setFlag('seen.pumphall');
      await g.wait(2);
      await g.describe('Down where the water is. Three of them, side by side.');
    }
  },
  entities: objects,
});

// ---------------------------------------------------------------------------
// The Tide Wheel (12 × 10)

function composeWheel(g) {
  const turning = !!g.flag('bell.restored');
  const ground = blankGrid(12, 10), detail = blankGrid(12, 10), overhead = blankGrid(12, 10);
  const solid = blankGrid(12, 10, false);
  for (let y = 0; y < 10; y++) for (let x = 0; x < 12; x++) { ground[y][x] = 'hull:top'; solid[y][x] = true; }
  for (let x = 1; x < 11; x++) { ground[1][x] = 'hull:face_top'; ground[2][x] = 'hull:face_base'; }
  for (let y = 3; y <= 8; y++) for (let x = 1; x < 11; x++) { ground[y][x] = 'hull:floor'; solid[y][x] = false; }
  for (const y of [4, 5]) { ground[y][0] = 'hull:floor'; solid[y][0] = false; }
  // The channel under the wheel (x3–8), and the wheel itself standing in it.
  const ch = turning ? 'chan_rush' : 'chan_slack';
  for (let y = 3; y <= 8; y++) {
    ground[y][3] = `tide_channel:${ch}_w`; ground[y][8] = `tide_channel:${ch}_e`;
    for (let x = 4; x <= 7; x++) ground[y][x] = `tide_channel:${ch}`;
    for (let x = 3; x <= 8; x++) solid[y][x] = true;
  }
  const wf = turning ? 'wheel_turn' : 'wheel';
  for (let r = 0; r < 6; r++) for (let c = 0; c < 4; c++) detail[3 + r][4 + c] = `tidewheel:${wf}_x${c}y${r}`;
  ground[5][10] = 'tide_channel:day_grate'; solid[5][10] = true;
  return { ground, detail, overhead, solid };
}

export const tideWheelMap = composedMap(composeWheel, {
  id: 'tide_wheel',
  name: 'The Tide Wheel',
  tileset: act4Tiles,
  music: 'downstairs',
  dark: 0.8,
  playerLight: darkPlayerLight,
  lights: (g) => [
    { x: 5.5, y: 5, radius: g.flag('bell.restored') ? 3 : 2, color: 'relic_amber' },
    { x: 10, y: 5, radius: 2 },
  ],
  spawn: [1, 4],
  exits: [{ x: 0, y: 4, h: 2, to: 'pump_hall', at: [24, 6], facing: 'left' }],
  ambience: ['channel_rush', 'tide_wheel'],
  entities: [
    {
      id: 'wheel', x: 4, y: 3, w: 4, h: 6,
      interact: (g) => (g.flag('bell.restored')
        ? g.describe('Turning. Slowly, enormously, with the sea pouring through it. The whole room hums.', 'Ambrose did this. With a rope and his knees.')
        : g.describe('A wheel taller than a house, standing in a channel of seawater. Bronze rim, slate paddles. Still.', "The rope from the bell comes down to here. I'd bet my plug on it, if I still had my plug.")),
      use: { moon_chart: notThatChart, '*': cherylDeclines },
    },
    { id: 'sea_grate', x: 10, y: 5, look: "Daylight, through a grate. The back of a cave. Mott's sea cave, I'd guess." },
  ].map((o) => ({ solid: false, use: { '*': cherylDeclines }, ...o })),
});

export const pumpScripts = { rise, stuckValve };
