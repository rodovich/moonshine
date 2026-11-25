// The dry Bilge in Act 5 (docs/design/05-high-and-dry.md, "The dry Bilge"):
// the Fishmonger's bucket, the Boatman below the broken stairs and his rope,
// the stair ring and the climb down to the mud, and the bronze door.
//
// `bilge_dry` is Act 4's map. `withBilge5(def)` layers Act 5 onto it without
// editing it: once `act5.started`, Act 4's entities, triggers, and exits step
// aside and these take over. What it relies on in Act 4's map: the id; the
// Water Stairs at (22-25, 6-7) above the broken flight (22-25, 8); the bronze
// door at (26-27, 8-9); the mud on row 10 below them; the bridge (12-13,
// 7-11); the north way up (11-12, 0) and the east edge (31, 12-14).
//
//      x 0         1         2         3
//        01234567890123456789012345678901
//  y  4  ................................   the Fishmonger (5, 4) behind her stall; her bucket (6, 4)
//     6  ......................WWWW......   the Water Stairs; the ring (25, 7)
//     8  hhhhhhhhhhhhBBhhhhhhhhbbbbDDhhhh   bbbb the broken edge (22-25, 8); DD the door
//    10  mmmmmmmmmmmmBBmmmmmmmmmmmm~~~MMM   the Boatman (22-23, 10); the Movers and the piano (14-17, 10)

import { fishmonger } from '../../art/act5_sprites.js';
import { items_act5, bucket_rope, disc_fx, kid_relay } from '../../art/act5_sprites.js';
import { boatman_mud, critters } from '../../art/act4_sprites.js';
import { bilge_piano, bilge_boats } from '../../art/act4_surface.js';
import { sweaty_kid } from '../../art/opening_npcs.js';
import { mover } from '../../art/act2_npcs.js';
import { withSheets } from './tiles.js';
import {
  started, doorOpen, ropeTied, afloat, WRONGNESS, LAUNDRY_AMBIENCE,
  bump, cycle, getItem, cherylDeclines, firstMeet, talking,
  both, not, morePatches, untilAct5, valueOf, openTiles,
} from './common.js';
import { act5Loops } from './loops.js';
import { kidRelayBilge } from './relay.js';

const V8 = (x) => 'abcdefgh'[x % 8];
const kidHasDisc = (g) => doorOpen(g) && !g.flag('kid.gaveDisc');

// ---------------------------------------------------------------------------
// Tiles: the ring and the rope, the climb's way through the broken edge, the
// door open with its light on the mud.

function act5Patches(g) {
  if (!started(g)) return [];
  const out = [];
  out.push(['detail', 25, 7, ropeTied(g) ? 'stair_rope:ring_tied' : 'stair_rope:ring']);
  if (ropeTied(g)) {
    // The rope hangs down the broken edge and the hull; those two tiles become the climb.
    out.push(['ground', 25, 8, 'reveal:wstairs_broken_r'], ['detail', 25, 8, 'stair_rope:rope_edge']);
    out.push(['ground', 25, 9, `reveal:hull_s_${V8(25)}`], ['detail', 25, 9, 'stair_rope:rope_hull']);
    out.push(['detail', 25, 10, 'stair_rope:rope_foot']);
  }
  if (doorOpen(g)) {
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      const tile = `bilge_door5:door_open_x${dx}y${dy}`;
      // The door's lower row is the way in, walked into from the mud.
      out.push(['ground', 26 + dx, 8 + dy, dy === 0 ? { tile, solid: true } : tile]);
    }
    out.push(['detail', 26, 10, 'bilge_door5:spill_l'], ['detail', 27, 10, 'bilge_door5:spill_r']);
  }
  return out;
}

// ---------------------------------------------------------------------------
// The Fishmonger and her bucket

async function fishmongerTalk(g, self) {
  if (!g.flag('got.bucket')) {
    await g.say(self,
      'Miss. Look at it. A trench. Five hundred years of sea, and it\'s left me a TRENCH.',
      "Not a drop in the whole Bilge. My fish are on ice in the cellar, and the cellar's the only wet thing left.",
      'Take my bucket if you want it. What use is a bucket now the sea\'s gone?');
    g.pose(self, 'give_down');
    g.sfx('give');
    await g.wait(0.5);
    g.setFlag('got.bucket');
    g.pose(self, null);
    return getItem(g, 'bucket');
  }
  return g.say(self, cycle(g, 'fishmonger5', [
    'The Mayor wants to hold a PARTY in it. A party. In my sea.',
    "If it comes back, I'll be civil to it. I've decided. Very civil.",
  ]));
}

const fishmongerUse = {
  bucket: (g, self) => g.say(self, "Keep it, Miss. Nothing to put in it. Not here."),
  bucket_water: (g, self) => g.say(self, 'Water! Where did you-- the Fountain? Well. Don\'t tip it in my trench. It\'d only feel worse.'),
  rope: (g, self) => g.say(self, "That's his rope. He's never let go of that rope in forty years."),
  '*': (g, self) => g.say(self, "Not unless it's a sea, Miss."),
};

// ---------------------------------------------------------------------------
// The Boatman, from above (the broken edge) or beside him on the mud

async function boatmanTalk(g) {
  const B = 'Boatman';
  if (afloat(g)) {
    return g.say(B, cycle(g, 'boatman5.after', [
      '♪ The boat is a boat, and it\'s AFLOAT ♪ That scans! It scans again!',
      'Two inches. Two glorious inches. Mind the step, Miss.',
    ]));
  }
  if (firstMeet(g, 'boatman5')) {
    return g.say(B,
      'Miss. Up there. Hello. You can hear her, can\'t you? Her planks. Drying. Creaking. Forty years she\'s been wet.',
      'A boat out of water is just a shape. A boatman out of water is just a man in a shape.',
      "The rope? It's my mooring rope. A boatman's rope stays with his boat. That's the law. My law.");
  }
  return g.say(B, cycle(g, 'boatman5.repeat', [
    "♪ The boat is a boat, and the water is gone ♪ ...that doesn't scan. Nothing scans today.",
    'If I had a drop. Just a drop in the bottom of her. So she\'d remember.',
  ]));
}

async function edgeLook(g) {
  if (kidHasDisc(g)) return kidThrowsDisc(g);
  if (bump(g, 'edge') === 0) {
    await g.describe("The stairs end in a broken edge, six feet above the mud. The Boatman's right below, in his boat.", afloat(g) ? 'He looks very pleased with himself.' : "He's sitting on a coil of rope. Of course he is.");
  }
  return boatmanTalk(g);
}

// Stand on the last good step above the Boatman, facing down.
async function toEdge(g, x = 23) {
  const p = g.player;
  if (!(p.y === 7 && p.x >= 22 && p.x <= 25)) await g.movePlayer([x, 7]);
  else if (p.x !== x) await g.movePlayer([x, 7]);
  g.facePlayer('down');
}

async function lowerBucket(g) {
  if (afloat(g)) return g.describe("He's afloat. He doesn't need more. Nobody needs more than afloat.");
  await toEdge(g, 23);
  const boatman = g.npc('boatman');
  g.pose('player', 'lower_down');
  await g.describe('I lie down on the last good step and lower the bucket to him at full stretch.');
  g.sfx('bucket_lower');
  await g.spawnEffect({ sprite: { sheet: bucket_rope, frame: 'bucket_rope_full' }, path: [[23, 7.6], [23, 8.7]], speed: 0.35, layer: 'top' });
  g.takeItem('bucket_water');
  g.pose('player', null);
  g.facePlayer('down');
  await g.wait(0.4);
  // He takes it, looks at it, and pours it into the bottom of his boat.
  g.setSprite(boatman, { sheet: boatman_mud, frame: 'pour' });
  g.sfx('pour');
  await g.wait(1.4);
  g.sfx('splash_small');
  await g.wait(0.6);
  await g.say(boatman, '...');
  g.setFlag('boatman.afloat');
  g.setSprite(boatman, { sheet: boatman_mud, frame: 'afloat' });
  g.emote(boatman, 'exclaim');
  await g.say(boatman,
    "AFLOAT! I'M AFLOAT, MISS! In the bottom of her! Look! A WAVE!",
    "A boat that floats doesn't need tying up. Here. Take it. Take the rope. I'm a BOATMAN.");
  // He throws the coil up; she catches it, and staggers.
  g.setSprite(boatman, { sheet: boatman_mud, frame: 'throw' });
  await g.wait(0.6);
  g.sfx('rope_throw');
  await g.spawnEffect({ sprite: { sheet: items_act5, frame: 'rope' }, path: [[22.6, 9.2], [22.9, 7.3], [23, 6.6]], speed: 2.4, layer: 'top' });
  g.pose('player', 'catch_up');
  g.shake(1, 0.25);
  await g.wait(0.5);
  g.pose('player', null);
  g.setSprite(boatman, { sheet: boatman_mud, frame: 'afloat' });
  await getItem(g, 'rope');
  await g.describe('Got it. Mostly.');
}

async function tieRope(g) {
  if (ropeTied(g)) return g.describe("It's tied. I checked it twice. I'll check it again at the bottom.");
  const p = g.player;
  if (!(p.x === 25 && p.y === 7)) await g.movePlayer([25, 7]);
  g.facePlayer('down');
  g.pose('player', 'kneel_down');
  g.sfx('rope_creak');
  await g.wait(0.8);
  await g.describe('A round turn and two half hitches. My father taught me that, on a lake a long way from here.');
  g.takeItem('rope');
  g.setFlag('rope.tied');
  g.sfx('rope_throw');
  await g.wait(0.5);
  g.pose('player', null);
  await g.describe("Tied. I'm not proud. I'm not not proud.");
}

// The disc held out toward the door's eye from the stairs (before the relay).
async function discFromStairs(g) {
  if (doorOpen(g)) return g.describe("The door's open. The eye's had all it wants.");
  await toEdge(g, 25);
  g.facePlayer('down');
  g.pose('player', 'reach_down');
  g.sfx('disc_fade');
  await g.wait(0.8);
  g.pose('player', null);
  return g.describe('I hold the disc out over the edge. The eye glints, and goes dark again.', 'It wants more than I\'ve got. It wants the brightest light in Tessel.');
}

const edgeUse = {
  bucket: (g) => g.describe("An empty bucket. He'd only look at it sadly. I'd better fill it first."),
  bucket_water: lowerBucket,
  rope: tieRope,
  moonglass_disc: discFromStairs,
  brass_polish: (g) => g.describe("It's for a lighthouse. It says so on the tin."),
  crowbar: (g) => g.describe("It's broken enough already."),
  clapper: (g) => g.describe("If I drop that on him, he'll be a boatman under a bell."),
  '*': (g) => g.say('Boatman', "Is it water, Miss? It's not water. I can tell from here."),
};

// ---------------------------------------------------------------------------
// The rope climb

// She has stepped onto the broken edge (or up onto the rope from the mud):
// she climbs, drawn sliding from where she stands to the other end.
async function climbDown(g) {
  g.facePlayer('up');
  g.pose('player', 'climbrope_up');
  g.sfx('rope_creak');
  g.place('player', 25, 10, 'up');
  g.npc('player').offset = [0, -32];
  await g.tween('player', { offset: [0, 0], seconds: 1.5 });
  g.sfx('step_stone');
  g.pose('player', null);
  g.facePlayer('right');
  if (!g.flag('n.climbedDown')) {
    g.setFlag('n.climbedDown', 1);
    await g.describe('Fifty-eight years old, going down a rope into a canal.', 'Never again. I said that at nineteen, too.');
  }
}

async function climbUp(g) {
  g.facePlayer('up');
  g.pose('player', 'climbrope_up');
  g.sfx('rope_creak');
  g.place('player', 25, 7, 'up');
  g.npc('player').offset = [0, 32];
  await g.tween('player', { offset: [0, 0], seconds: 1.5 });
  g.pose('player', null);
  g.facePlayer('up');
}

// Clicking or facing the rope offers the climb, so a pointer player can take it.
async function offerClimb(g, down) {
  const i = await g.choose(down ? 'Climb down?' : 'Climb up?', ['Yes', 'Not yet']);
  if (i !== 0) return;
  if (down) {
    if (!(g.player.x === 25 && g.player.y === 7)) await g.movePlayer([25, 7]);
    return climbDown(g);
  }
  if (!(g.player.x === 25 && g.player.y === 10)) await g.movePlayer([25, 10]);
  return climbUp(g);
}

// ---------------------------------------------------------------------------
// The bronze door

async function doorFromMud(g) {
  if (bump(g, 'door.mud') === 0) return g.describe('A glass eye, the size of a dinner plate. Like the lock in the Step Gallery, only hungrier.');
  return g.describe('The eye, dark. Waiting for more light than I\'ve got.');
}

async function discOnDoor(g) {
  g.facePlayer('up');
  g.pose('player', 'reach_up');
  g.sfx('disc_fade');
  await g.wait(0.8);
  g.pose('player', null);
  return g.describe('The eye stays dark. It wants more than my disc has in it.', 'Brighter. It wants the brightest light in Tessel.');
}

// ---------------------------------------------------------------------------
// The Kid, on the mud by the door after the relay, with the disc

const kidLines = (g, self) => g.say(self,
  "Miss! The eye ate all the light and spat this out! It's still a bit glowy. Here.");

async function kidGives(g, self) {
  await kidLines(g, self);
  g.sfx('give');
  g.setFlag('kid.gaveDisc');
  await getItem(g, 'moonglass_disc');
  await g.say(self, "Fifty-two seconds, Miss! And I jumped! Off the QUAY! Don't tell Mum.");
}

async function kidThrowsDisc(g) {
  await toEdge(g, 24);
  const kid = g.npc('kid_mud');
  g.faceNpc(kid, 'up');
  await g.say(kid, "Miss! Up there! The eye ate all the light and spat this out! It's still a bit glowy. CATCH!");
  g.sfx('rope_throw');
  await g.spawnEffect({ sprite: { sheet: disc_fx, frame: 'disc_dim' }, path: [[24, 9.4], [24, 7.6], [24, 6.9]], speed: 2.4, layer: 'top' });
  g.pose('player', 'catch_up');
  await g.wait(0.3);
  g.pose('player', null);
  g.setFlag('kid.gaveDisc');
  await getItem(g, 'moonglass_disc');
  await g.say(kid, "Fifty-two seconds, Miss! And I jumped! Off the QUAY! Don't tell Mum.");
}

// ---------------------------------------------------------------------------
// Entities

const objects = [
  {
    id: 'bucket5', x: 6, y: 4, kind: 'object',
    sprite: { sheet: items_act5, frame: 'bucket_empty' },
    when: (g) => !g.flag('got.bucket'),
    look: "A bucket, upside down by her stall. Nothing to put in it.",
    use: { '*': cherylDeclines },
  },
  {
    id: 'broken_edge', x: 22, y: 8, w: 3, solid: true, lookKey: 'broken_edge',
    interact: edgeLook, use: edgeUse,
  },
  {
    // Under the ring: part of the edge until the rope hangs there.
    id: 'broken_edge_r', x: 25, y: 8, solid: true, lookKey: 'broken_edge',
    when: not(ropeTied),
    interact: edgeLook, use: edgeUse,
  },
  {
    id: 'stair_ring', x: 25, y: 7, solid: false,
    interact: async (g) => {
      if (!ropeTied(g)) return g.describe('A bronze mooring ring, set in the last good step.');
      await g.describe("My knot. A round turn and two half hitches. It's holding.");
      return offerClimb(g, true);
    },
    use: { rope: tieRope, '*': cherylDeclines },
  },
  {
    id: 'rope_hull', x: 25, y: 9, solid: false,
    when: ropeTied,
    interact: (g) => offerClimb(g, false),
    use: { '*': cherylDeclines },
  },
  {
    id: 'door_from_quay', x: 26, y: 7, w: 2, solid: true,
    interact: (g) => (doorOpen(g)
      ? g.describe('The door, open. Cyan light spilling out across the mud, like a lamp left on for somebody.')
      : g.describe('The door. Bronze, barnacled, a glass eye in the middle. At the bottom of a canal that\'s been full for five hundred years.', "It opens onto the mud. And the stairs don't reach the mud.")),
    use: { moonglass_disc: (g) => g.describe("Not from up here. It's six feet down and a canal away."), rope: tieRope, '*': cherylDeclines },
  },
  {
    id: 'bronze_door', x: 26, y: 8, w: 2, h: 2, solid: true,
    when: not(doorOpen),
    interact: doorFromMud,
    use: { moonglass_disc: discOnDoor, crowbar: (g) => g.describe("Not a seam in it. Founders don't make things for crowbars."), '*': cherylDeclines },
  },
  {
    id: 'trickle_from_quay', x: 28, y: 7, w: 2, solid: true,
    look: ['The last of the canal, running out to the Bowl. And the Bowl\'s down there. Lower. Of course it\'s lower.'],
    use: { bucket: (g) => g.describe("It's on the mud. So is the Boatman. That's the problem."), '*': cherylDeclines },
  },
  {
    id: 'trickle', x: 28, y: 10, w: 2, solid: true,
    look: 'The last of the canal, a finger deep, running out to the Bowl.',
    use: { bucket: (g) => g.describe("I'd be here till Tuesday."), '*': cherylDeclines },
  },
  ...[[0, 11], [15, 7], [30, 2]].map(([x, w]) => ({
    id: `canal_${x}`, x, y: 7, w, solid: true, lookKey: 'canal5',
    looks: [
      ['Six feet down, to mud. The canal walls aren\'t stone, under the old waterline. They\'re slate, fitted, like Downstairs.', 'Barnacles, all the way up to a line. The line where the sea used to be. On us.'],
      'Six feet down, to mud. The wind blows straight down the trench and out to sea.',
    ],
    use: { bucket: (g) => g.describe('Mud. Not even wet mud.'), '*': cherylDeclines },
  })),
  {
    id: 'fish_cellar_door', x: 4, y: 3, solid: true,
    look: "The Fishmonger's door, down to her cellar. Ice. Fish. A hatch I'm not opening.",
    use: { bucket: (g) => g.describe("Ice. I'd be here till Tuesday waiting for it to melt."), '*': cherylDeclines },
  },
  // Her own stall (5-6) has no hotspot: talking across it reaches her.
  ...[2, 8].map((x) => ({ id: `stall5_${x}`, x, y: 5, w: 2, solid: true, lookKey: 'stalls5', look: 'Fish on ice. The ice is the wettest thing in the Bilge.' })),
].map((o) => ({ use: { '*': cherylDeclines }, ...o }));

const fishmongerNpc = {
  id: 'fishmonger5', name: 'Fishmonger', x: 5, y: 4, facing: 'down',
  sprite: { sheet: fishmonger },
  behavior: { type: 'face', range: 3 },
  interact: fishmongerTalk,
  use: fishmongerUse,
};

const boatman = {
  id: 'boatman', name: 'Boatman', x: 22, y: 10, w: 2, facing: 'down', kind: 'npc', turnToTalk: false,
  sprite: (g) => ({ sheet: boatman_mud, frame: afloat(g) ? 'afloat' : 'mud' }),
  emote: { frame: 'note', every: [5, 9] },
  interact: boatmanTalk,
  use: {
    bucket: (g) => g.describe("An empty bucket. He'd only look at it sadly. I'd better fill it first."),
    bucket_water: lowerBucket,
    '*': edgeUse['*'],
  },
};

const kidMud = {
  id: 'kid_mud', name: 'Sweaty Kid', x: 24, y: 10, facing: 'up', solid: true,
  sprite: { sheet: sweaty_kid },
  when: kidHasDisc,
  talkPose: 'jog',
  interact: kidGives,
  use: { '*': (g, self) => g.say(self, "Can't carry it, Miss! I've got your disc!") },
};

// The Movers on the mud, guarding the piano. The Big Mover can be talked to
// from the bridge beside him.
async function moversTalk(g) {
  if (firstMeet(g, 'movers5')) {
    return g.talk([
      ['Big Mover', "Miss. It's on the mud and it's not going anywhere. First time all week."],
      ['Other Mover', 'Hnn.'],
      ['Big Mover', "He says that's what worries him."],
    ]);
  }
  return g.say('Big Mover', "Party's tonight, they say. In the canal. We'll be here. Guarding it. From the party.");
}

const movers = [
  { id: 'big_mover5', name: 'Big Mover', x: 14, y: 10, facing: 'left', sprite: { sheet: mover, palette: 'big' } },
  { id: 'other_mover5', name: 'Other Mover', x: 17, y: 10, facing: 'down', sprite: { sheet: mover, palette: 'other', frame: 'lookup_down' } },
].map((m) => ({ ...m, interact: moversTalk, use: { '*': (g) => g.say('Big Mover', "Very nice, Miss. It won't lift a piano.") } }));

const piano = {
  id: 'piano5', x: 15, y: 10, w: 2, kind: 'object',
  sprite: { sheet: bilge_piano, frame: 'piano_mud' },
  look: 'The piano, upright on the mud, lid open. It got further down Tessel than any of us.',
};

const boats = [[3, 'boat_side_a'], [8, 'boat_side_b'], [19, 'boat_side_c']].map(([x, frame]) => ({
  id: `boat5_${x}`, x, y: 10, w: 2, kind: 'object', lookKey: 'boats5',
  sprite: { sheet: bilge_boats, frame },
  look: 'Boats, lying on their sides like dogs asleep in the sun.',
}));

const crabs = [[1, 10], [6, 10], [10, 10]].map(([x, y], i) => ({
  id: `crab5_${i}`, x, y, solid: false, kind: 'object', lookKey: 'crabs5',
  sprite: { sheet: critters, frame: i % 2 ? 'crab_idle' : 'crab_walk' },
  behavior: { type: 'wander', area: [0, 10, 11, 1], pause: [1, 4] },
  look: 'A crab. It moves sideways, which is more than the rest of Tessel can manage today.',
}));

// ---------------------------------------------------------------------------
// The layer

const entering5 = async (g) => {
  g.setWrongness(WRONGNESS);
  g.playMusic('harbor');
  act5Loops(g, LAUNDRY_AMBIENCE);
};

export function withBilge5(def) {
  const base = withSheets(def);
  const music = base.music;
  return {
    ...base,
    // Music plays from onEnter, so the relay's cutscene visit doesn't cut its own music off.
    music: undefined,
    lighting: (g) => (started(g) ? 'day' : valueOf(def.lighting, g)),
    patches: morePatches(base.patches, act5Patches),
    // The door's lower row is the way in once it opens; the door itself (an
    // entity until then) keeps it shut.
    collision: openTiles(base, [[26, 9], [27, 9]]),
    exits: [
      ...(base.exits || []).map(untilAct5),
      { x: 11, y: 0, w: 2, to: 'fountain_square', at: [11, 15], facing: 'up', when: started, sfx: 'step_stone' },
      { x: 31, y: 12, h: 3, to: 'harbor_risen', at: [1, 6], facing: 'right', when: started },
      { x: 25, y: 8, when: both(started, ropeTied), run: climbDown },
      { x: 25, y: 9, when: both(started, ropeTied), run: climbUp },
      { x: 26, y: 9, to: 'bow_passage', at: [2, 3], facing: 'right', when: both(started, doorOpen), sfx: 'step_hullstone', checkFlags: ['act5.started', 'door.open'] },
      { x: 27, y: 9, to: 'bow_passage', at: [2, 4], facing: 'right', when: both(started, doorOpen), sfx: 'step_hullstone', checkFlags: ['act5.started', 'door.open'] },
    ],
    triggers: (base.triggers || []).map(untilAct5),
    entities: [
      ...(base.entities || []).map(untilAct5),
      ...[...objects, fishmongerNpc, boatman, kidMud, kidRelayBilge, ...movers, piano, ...boats, ...crabs].map((e) => ({ ...e, when: both(e.when, started) })),
    ],
    onEnter: async (g) => {
      if (started(g)) return entering5(g);
      if (music) g.playMusic(music);
      if (base.onEnter) await base.onEnter(g);
    },
  };
}

export const bilgeScripts = { lowerBucket, tieRope, climbDown, climbUp, kidGives, kidThrowsDisc, fishmongerTalk };
