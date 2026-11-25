// The Step Gallery (24 × 11), under the Hundred Steps, and the Cradle (8 × 6)
// behind its moon-locked hatch. From docs/design/03-downstairs.md.
//
//   Step Gallery
//      x 0         1         2
//        012345678901234567890123
//  y  1  X##H###################X   H the ladder up to the Hundred Steps (3, 1-2)
//     2  X#LH##II##II###O###V##LX   L lamps (2, 22); II inlays: Sisters (6-7), moons (10-11)
//     3  X......................X   O the moon-locked hatch (15); V the lever (19)
//     6  X..........M...........X   M the mirror (11, 6), under the light shaft
//     8  X.....G................X   G the floor grate (6, 8): the drop-ladder's top
//
// The mirror's targets lie on straight lines from it: up-left at 45° to the
// Sisters inlay (7, 2), straight up to the moons inlay (11, 2), up-right at
// 45° to the hatch (15, 2). Before the first turn it lies flat, east.
//
//   Cradle
//        01234567
//  y  2  X#CC#d#X   CC the chute (2-3, 2); d the disc in its cradle (5, 2)
//     5  XXX..XXX   back to the Step Gallery (3-4, 5)

import { composedMap } from '../opening/grid.js';
import { act3Tiles } from './tiles.js';
import { ds_mirror } from '../../art/downstairs.js';
import {
  UNDER, WRONGNESS, deck, wall, floor, lever, hatchOpen, hasDisc,
  wallHotspots, lampEntity, nicheTile, founderUse, RUB_WALLS, getItem, cherylDeclines,
  discLight, keepLoops, bump,
} from './common.js';

// ---------------------------------------------------------------------------
// The Step Gallery

const GW = 24, GH = 11;
const RIBS = [5, 17, 21]; // the design's x9 and x13 would cut the beams (see README)
const mirrorPos = (g) => g.flag('gallery.mirror') || 0;
let arrivalDark = null; // darker while her eyes adjust on the first arrival

// The beam's overhead tiles for each mirror position, and where it lands.
const BEAMS = {
  0: { tiles: [...Array.from({ length: 10 }, (_, i) => [12 + i, 6, 'over_beam_h']), [22, 6, 'over_beam_end_e']], end: [22, 6] },
  1: { tiles: [[10, 5, 'over_beam_nw'], [9, 4, 'over_beam_nw'], [8, 3, 'over_beam_nw'], [7, 2, 'over_beam_end_n']], end: [7, 2] },
  2: { tiles: [[11, 3, 'over_beam_v'], [11, 2, 'over_beam_end_n']], end: [11, 2] },
  3: { tiles: [[12, 5, 'over_beam_ne'], [13, 4, 'over_beam_ne'], [14, 3, 'over_beam_ne'], [15, 2, 'over_beam_end_n']], end: [15, 2] },
};

function composeGallery(g) {
  const L = deck(GW, GH);
  wall(L, 1, 22, 1, RIBS);
  floor(L, 1, 22, 3, 9);
  const pos = mirrorPos(g);
  const beam = lever(g) ? BEAMS[pos] : null;

  // The ladder up, in its square of daylight (walkable: walking up into it climbs).
  L.set('ground', 3, 1, 'ds_day:day_ladder_top', true);
  L.set('ground', 3, 2, 'ds_day:day_ladder_bot', false);
  L.set('ground', 3, 3, 'ds_day:day_spot', false);
  // Lamps in their niches (upper row).
  L.set('ground', 2, 1, nicheTile(g, 'gallery_w'), true);
  L.set('ground', 22, 1, nicheTile(g, 'gallery_e'), true);
  // The inlays (upper row), lit while the beam is on them.
  const sis = beam && pos === 1 ? 'inlay_sisters_lit' : 'inlay_sisters';
  const moon = beam && pos === 2 ? 'inlay_moon_lit' : 'inlay_moon';
  L.set('ground', 6, 1, `ds:${sis}_l`, true); L.set('ground', 7, 1, `ds:${sis}_r`, true);
  L.set('ground', 10, 1, `ds:${moon}_l`, true); L.set('ground', 11, 1, `ds:${moon}_r`, true);
  // The hatch with its moon-lock eye (lower row): walkable once open.
  const hatch = hatchOpen(g) ? 'moonhatch_open' : beam && pos === 3 ? 'moonhatch_lit' : 'moonhatch';
  // Not solid: the hatch entity blocks it until it opens.
  L.set('ground', 15, 2, `ds:${hatch}`, false);
  // The lever.
  L.set('ground', 19, 2, lever(g) ? 'ds:lever_pulled' : 'ds:lever_jammed', true);
  // The floor grate: the drop-ladder's top once it's down.
  L.set('ground', 6, 8, g.flag('halls.ladder') ? 'ds:grate_open' : 'ds:grate_closed', false);

  // The ribs are drawn as rib faces on the wall (see wall()); even the art's
  // see-through beams overhead left Cheryl hard to see in this dark room.
  // The light shaft over the mirror: its lid, and the daylight column once open.
  L.set('overhead', 11, 4, lever(g) ? 'ds_day:over_shaft_open' : 'ds_day:over_shaft_shut');
  if (lever(g)) {
    L.set('overhead', 11, 5, 'ds_day:over_column');
    L.set('ground', 11, 6, 'ds_day:day_spot');
  }
  if (beam) for (const [x, y, f] of beam.tiles) L.set('overhead', x, y, `ds_day:${f}`);
  return L.done();
}

// Light: the daylight at the ladder; lamps once lit; the shaft, the beam, and
// a glow where it lands once the lever is pulled.
function galleryLights(g) {
  const out = [{ x: 3, y: 3, radius: 1.8, color: 'daylight' }];
  if (g.flag('lamp.gallery_w')) out.push({ x: 2, y: 2.5, radius: 3, color: 'relic_cyan' });
  if (g.flag('lamp.gallery_e')) out.push({ x: 22, y: 2.5, radius: 3, color: 'relic_cyan' });
  if (hatchOpen(g)) out.push({ x: 15, y: 2.6, radius: 1.6, color: 'relic_cyan' });
  if (lever(g)) {
    out.push({ x: 11, y: 5.5, radius: 1.6, color: 'daylight' });
    const beam = BEAMS[mirrorPos(g)];
    for (const [x, y] of beam.tiles) out.push({ x, y, radius: 0.9 });
    out.push({ x: beam.end[0], y: beam.end[1] + 0.4, radius: 1.4, color: 'daylight' });
  }
  return out;
}

// ---------------------------------------------------------------------------
// The lever and the mirror

async function pullLever(g) {
  if (g.player.x !== 19 || g.player.y !== 3) await g.movePlayer([19, 3]);
  g.facePlayer('up');
  g.pose('player', 'heave_up');
  g.sfx('lever_pull');
  for (let i = 0; i < 2; i++) {
    g.shake(1, 0.25);
    await g.wait(0.6);
  }
  g.setTile('ground', 19, 2, 'ds:lever_pulled');
  g.shake(2, 0.3);
  await g.wait(0.4);
  g.pose('player', null);
  g.facePlayer('left');
  g.sfx('lid_open');
  g.shake(1, 0.6);
  await g.wait(0.9);
  // The lid opens; daylight falls onto the mirror and off along the floor.
  g.setFlag('gallery.lever');
  g.setFlag('gallery.mirror', 0);
  g.sfx('light_beam');
  g.startLoop('beam_hum');
  await g.wait(0.9);
  // Every light-pipe shutter in Tessel, one after another, away up the hill.
  g.facePlayer('up');
  g.sfx('shutters');
  for (let i = 0; i < 4; i++) {
    g.shake(i < 2 ? 1 : 0, 0.15);
    await g.wait(1);
  }
  await g.describe('Daylight. Straight down a shaft from somewhere above.', "And that clunking, all the way up the hill. I've opened more than one lid.");
}

const TARGET_LINES = {
  1: ['Three bars of different widths, side by side.', 'They mean something to somebody.'],
  2: ['Moons, as squares filling up. New, quarter, half, full.', 'Somebody watched the moon very carefully. I know the feeling.'],
};

async function turnMirror(g) {
  const pos = g.cycle('gallery.mirror', [1, 2, 3]);
  g.sfx('mirror_turn');
  await g.wait(0.35);
  if (pos === 3 && !hatchOpen(g)) return openHatch(g);
  // Each target's lines the first time the beam lights it.
  const seen = `gallery.lit${pos}`;
  if (TARGET_LINES[pos] && !g.flag(seen)) {
    g.setFlag(seen);
    await g.wait(0.3);
    await g.describe(...TARGET_LINES[pos]);
  }
}

async function openHatch(g) {
  // The eye fills with light and glows.
  g.sfx('moonlock_open');
  await g.wait(1.3);
  g.setTile('ground', 15, 2, 'ds:moonhatch_opening');
  g.shake(1, 0.8);
  await g.wait(0.7);
  g.setFlag('gallery.hatch');
  await g.wait(0.5);
  await g.describe('The glass drinks the light, and the hatch opens.', 'Not a lock that wants a key. A lock that wants the sun.');
}

// ---------------------------------------------------------------------------
// Going up and down

async function climbUp(g) {
  if (g.player.x !== 3 || g.player.y !== 3) await g.movePlayer([3, 3]);
  g.facePlayer('up');
  keepLoops(g, []);
  g.sfx('step_rung');
  g.pose('player', 'climb_up');
  await g.tween('player', { offset: [0, -10], seconds: 0.35 });
  g.sfx('step_rung');
  await g.tween('player', { offset: [0, -20], seconds: 0.35 });
  await g.fade('out', 0.3);
  g.pose('player', null);
  await g.tween('player', { offset: [0, 0], seconds: 0 });
  await g.changeMap('hundred_steps', 10, 18, 'down');
}

async function climbDown(g) {
  if (g.player.x !== 6 || g.player.y !== 7) await g.movePlayer([6, 7]);
  g.facePlayer('down');
  g.sfx('step_rung');
  await g.changeMap('lamp_halls', 8, 6, 'down');
}

// ---------------------------------------------------------------------------
// Objects

const galleryObjects = [
  ...wallHotspots('gallery', 2, 1, 22, [2, 3, 6, 7, 10, 11, 15, 19, 22], RIBS),
  lampEntity('gallery_w', 2, 2),
  lampEntity('gallery_e', 22, 2),
  {
    id: 'ladder_up', x: 3, y: 2,
    interact: async (g) => {
      await g.describe("The ladder back up. Daylight, and the Woman with Basin, pretending she can't see me.");
      if ((await g.choose('Climb up?', ['Yes', 'Not yet'])) === 0) await climbUp(g);
    },
  },
  ...[[6, 'sisters'], [10, 'moons']].map(([x, which]) => ({
    id: `inlay_${which}`, x, y: 2, w: 2,
    look: TARGET_LINES[which === 'sisters' ? 1 : 2],
    use: {
      paper_charcoal: (g) => g.describe(RUB_WALLS, which === 'sisters' ? "Three bars. I'll remember three bars." : "Four moons. I'll remember four moons."),
      ...founderUse,
    },
  })),
  {
    id: 'hatch', x: 15, y: 2, when: (g) => !hatchOpen(g), solid: true,
    looks: [["A square hatch, sealed flush. No handle. A round glass eye in the middle, looking down at the mirror.", "It looks like it's waiting for something."], "A glass eye in the middle, looking down at the mirror. It looks like it's waiting for something."],
    use: { crowbar: (g) => g.describe("No seam. Whoever made this didn't make doors for crowbars."), '*': cherylDeclines },
  },
  {
    id: 'lever', x: 19, y: 2,
    interact: async (g) => {
      if (lever(g)) return g.describe("Open. It stays open. Whatever else it opened stays open too.");
      if (bump(g, 'gallery.leverLook') === 0) return g.describe('A bronze lever, green and seized solid.', 'There\'s a lid in the ceiling over the mirror. I think this opens it.');
      return g.describe('Seized. I need a lever for my lever. I happen to have a crowbar.');
    },
    use: {
      crowbar: (g) => (lever(g) ? g.describe("It's open. It's staying open.") : pullLever(g)),
      '*': cherylDeclines,
    },
  },
  {
    id: 'grate', x: 6, y: 8,
    interact: async (g) => {
      if (!g.flag('halls.ladder')) return g.describe('A grate in the floor. Underneath, a darker kind of dark.');
      await g.describe('The top of the ladder I dropped. My way back, if I want one.');
      if ((await g.choose('Climb down?', ['Yes', 'Not yet'])) === 0) await climbDown(g);
    },
    use: { crowbar: (g) => g.describe("It's bolted from underneath. Somebody liked their grates where they were."), '*': cherylDeclines },
  },
].map((o) => ({ solid: false, use: founderUse, ...o }));

const MIRROR_FRAMES = ['mirror_e', 'mirror_nw', 'mirror_n', 'mirror_ne'];

const mirror = {
  id: 'mirror', x: 11, y: 6, kind: 'object',
  sprite: (g) => ({ sheet: ds_mirror, frame: g.flag('gallery.lever') ? MIRROR_FRAMES[g.flag('gallery.mirror') || 0] : 'mirror_s' }),
  interact: async (g) => {
    if (!lever(g)) return g.describe("A bronze mirror on a pivot. Tarnished, but true. It's pointing at nothing in particular.");
    return turnMirror(g);
  },
  use: {
    moonglass_disc: (g) => g.describe("It shows me the disc, and the disc shows it back. Nothing happens. They seem to get on."),
    // Under the open shaft: floor and light, the near miss (structure pass, section 4).
    paper_charcoal: (g) => (lever(g) ? g.describe("Light falling on it, just as Ottilie said. But it's a mirror, not a floor. Not this one.") : g.describe('A rubbing of a mirror. No.')),
    crowbar: (g) => g.describe("It turns. I don't need to bully it."),
    '*': cherylDeclines,
  },
};

export const galleryMap = composedMap(composeGallery, {
  ...UNDER,
  id: 'step_gallery',
  lightArea: [[1, 1, 22, 9]], // light stays inside the room and its walls
  name: 'The Step Gallery',
  tileset: act3Tiles,
  spawn: [3, 3],
  darkness: () => arrivalDark ?? 0.6,
  lights: galleryLights,
  playerLight: discLight(3),
  exits: [
    // The ladder up to the Steps: walk up into it. (After the valve the Lamp
    // Halls' west end is flooded, so the gallery can't be reached from below.)
    { x: 3, y: 2, to: 'hundred_steps', run: climbUp },
    // The hatch, once open: into the Cradle.
    { x: 15, y: 2, to: 'cradle', at: [3, 4], facing: 'up', when: hatchOpen, sfx: 'step_hullstone' },
    // The grate, once the Lamp Halls' ladder is down.
    { x: 6, y: 8, when: (g) => !!g.flag('halls.ladder'), run: climbDown },
  ],
  onEnter: async (g) => {
    g.setWrongness(WRONGNESS);
    keepLoops(g, lever(g) ? ['beam_hum'] : []);
    if (g.flag('act3.started')) return;
    g.setFlag('act3.started');
    // First arrival: her eyes adjust, then the gallery shows how far it goes.
    g.facePlayer('down');
    for (let k = 0; k <= 30; k++) {
      arrivalDark = 0.96 - (0.36 * k) / 30;
      await g.wait(k < 10 ? 0.12 : 0.06);
    }
    arrivalDark = null;
    await g.wait(0.5);
    await g.think('Under the Steps.');
    await g.panCamera(15, 5, 0.7);
    await g.wait(1.2);
    await g.followPlayer(1.4);
    await g.think('Thirty-one years I\'ve gone up and down those Steps. Every day, most days twice.', 'And all this was underneath. All this time.');
  },
  entities: [...galleryObjects, mirror],
});

// ---------------------------------------------------------------------------
// The Cradle

const CW = 8, CH = 6;

function composeCradle(g) {
  const L = deck(CW, CH);
  wall(L, 1, 6, 1);
  floor(L, 1, 6, 3, 4);
  floor(L, 3, 4, 5, 5);
  L.set('ground', 2, 2, 'ds:chute_l', true);
  L.set('ground', 3, 2, 'ds:chute_r', true);
  L.set('ground', 5, 2, g.flag('got.disc') ? 'ds:cradle_niche' : 'ds:cradle_niche_glow', true);
  return L.done();
}

async function chuteSequence(g) {
  const p = g.player;
  if (!(p.y === 3 && (p.x === 2 || p.x === 3))) await g.movePlayer([p.x <= 2 ? 2 : 3, 3]);
  g.facePlayer('up');
  await g.wait(0.3);
  g.pose('player', 'sitfloor_down');
  await g.wait(0.6);
  await g.fade('out', 0.5);
  g.sfx('chute_slide');
  await g.wait(3);
  await g.changeMap('lamp_halls', 3, 7, 'down', { seconds: 0.8 });
  await g.wait(1.2);
  g.pose('player', null);
  g.facePlayer('down');
  await g.wait(0.4);
  await g.describe("Well. I won't be going back up that.");
  await g.wait(1.5);
  await g.describe('A long hall going east, ribbed like the gallery. Pools of daylight here and there, coming down through the ceiling.');
}

const cradleObjects = [
  ...wallHotspots('cradle', 2, 1, 6, [2, 3, 5]),
  {
    id: 'cradle', x: 5, y: 2,
    interact: async (g) => {
      if (g.flag('got.disc')) return g.describe("An empty cradle. I'll bring it back. I think I'll bring it back.");
      await g.describe("A disc of milky glass, in a bronze cradle. It's glowing.");
      g.pose('player', 'reach_up');
      await g.wait(0.4);
      g.setFlag('got.disc');
      g.stopLoop('moonglass_hum', 1200);
      g.pose('player', null);
      g.sfx('disc_get');
      await g.describe("It's warm. I wasn't expecting warm.");
      await getItem(g, 'moonglass_disc');
    },
  },
  {
    id: 'chute', x: 2, y: 2, w: 2,
    interact: async (g) => {
      await g.describe('A smooth slot in the wall, sloping away into the dark. Polished smooth. People used this. Often.');
      if (!hasDisc(g)) return g.describe('Not into the dark without a light.');
      if ((await g.choose('Go down?', ['Yes', 'Not yet'])) === 0) await chuteSequence(g);
    },
  },
].map((o) => ({ solid: false, use: founderUse, ...o }));

export const cradleMap = composedMap(composeCradle, {
  ...UNDER,
  id: 'cradle',
  lightArea: [[1, 1, 6, 4], [3, 5, 2, 1]], // light stays inside the room and its walls
  name: 'The Cradle',
  tileset: act3Tiles,
  spawn: [3, 4],
  darkness: 0.6,
  lights: [
    { x: 5, y: 2.6, radius: 2.2, color: 'relic_cyan', when: (g) => !g.flag('got.disc') },
    { x: 3.5, y: 4.6, radius: 1.2, color: 'daylight' }, // daylight from the gallery, through the hatch (kept inside the room)
  ],
  playerLight: discLight(3),
  exits: [{ x: 3, y: 5, w: 2, to: 'step_gallery', at: [15, 3], facing: 'down', sfx: 'step_hullstone' }],
  onEnter: async (g) => {
    g.setWrongness(WRONGNESS);
    keepLoops(g, g.flag('got.disc') ? [] : ['moonglass_hum']);
  },
  entities: cradleObjects,
});

// Named scripts (runnable with ?run=, and visible to npm run check).
export const galleryScripts = { pullLever, turnMirror, openHatch, climbUp, climbDown, chuteSequence };
