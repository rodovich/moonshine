// The Hundred Steps (16 × 42): four flights, three landings, and the bottom
// landing where the piano is wedged in the arch to Fountain Square. The
// Counting Woman sits on the hollow step; the Woman with Basin tips her luck
// down the Steps; the Sweaty Kid runs laps. The act ends here.
// From docs/design/02-city.md.
//
//      x 0         1
//        0123456789012345
//  y  0  rrrrrr^^rrrrrrrr   top: from Lamp Street (6-7); FLIGHT 1 (x6-7)
//     7  ................   LANDING 1 (y7-9)
//    10  ==^^============   FLIGHT 2 (x2-3)
//    15  r=^^=#wD#w##w#w#   D (7, 15): the Woman with Basin's doorstep
//    16  ................   LANDING 2 (y16-18)
//    19  =========HH=====   HH THE HOLLOW STEP (9-10, 19)
//    20  rrrrrrrr=^^=rrrr   FLIGHT 3 (x9-10)
//    26  ................   LANDING 3 (y26-28)
//    29  ====^^==========   FLIGHT 4 (x4-5)
//    38  ................   BOTTOM LANDING (y38-40)
//    41  ######PP########   the arch to Fountain Square (6-7), the piano wedged in it

import { composedMap, blankGrid } from '../opening/grid.js';
import { act2Tiles } from './tiles.js';
import { layout, house, pave, lowRoof, LOOKS, moverPose, pianoSprite, actWrongness, bump, cycle, firstMeet, getItem, cherylDeclines } from './common.js';
import { props } from '../../art/props.js';
import { fx, fx_mist } from '../../art/fx.js';
import { sweaty_kid } from '../../art/opening_npcs.js';
import { act2_props } from '../../art/act2_objects.js';
import { endOfAct } from './ending.js';

const W = 16, H = 42;

const slid = (g) => !!g.flag('piano.slid');
const counted = (g) => !!g.flag('counter.left');
const open = (g) => !!g.flag('step.open');

// The flights: [x of the left column, first row, last row].
const FLIGHTS = [[6, 0, 6], [2, 10, 15], [9, 20, 25], [4, 29, 37]];
const MOON_RISERS = [[6, 3], [2, 12], [9, 22], [4, 32], [4, 35]];
const MOON_PAVING = [[13, 8], [1, 26], [14, 39]];

function compose(g) {
  const L = layout(W, H, blankGrid);
  // Roofs everywhere, then cut the landings and flights out of them.
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) L.set('ground', x, y, lowRoof(x, y), true);
  for (const [y0, y1] of [[7, 9], [16, 18], [26, 28], [38, 40]]) {
    for (let y = y0; y <= y1; y++) for (let x = 0; x < W; x++) L.set('ground', x, y, pave(x, y), false);
  }
  for (const [x, y] of MOON_PAVING) L.set('ground', x, y, `moon_eyes:pave_${y % 2 ? 's' : 'n'}${x % 2 ? 'e' : 'w'}_eye`);
  // The retaining walls along each landing's lower edge.
  for (const y of [10, 19, 29]) for (let x = 0; x < W; x++) L.set('ground', x, y, 'street:retain_top', true);
  // Flights, with a moon-eye set in some risers, and walls beside them.
  for (const [x, y0, y1] of FLIGHTS) {
    for (let y = y0; y <= y1; y++) {
      const moon = MOON_RISERS.some(([mx, my]) => mx === x && my === y) ? '_moon' : '';
      L.set('ground', x, y, `steps:steps${moon}_l`, false);
      L.set('ground', x + 1, y, `steps:steps${moon}_r`, false);
      L.step[y][x] = L.step[y][x + 1] = 'step_stairs';
      if (y > y0 || y0 === 0) {
        L.set('ground', x - 1, y, 'terrace:ledge_w', true);
        L.set('ground', x + 2, y, 'terrace:ledge_e', true);
      }
    }
  }
  // House fronts facing up the Steps at the foot of each block of roofs.
  house(L, 0, 5, { roofRows: 0, top: '#D#w#', base: '#D#w#', palette: 'ochre' });
  house(L, 9, 5, { roofRows: 0, top: '#w##D##', base: '#w##D##', palette: 'sky' });
  house(L, 5, 12, { roofRows: 2, top: '#wD#w##w#w#', base: '#wD#w##w#w#' });
  house(L, 0, 22, { roofRows: 2, top: '#w##w#D#', base: '#w##w#D#', palette: 'rose' });
  house(L, 12, 22, { roofRows: 2, top: '#w##', base: '#w##', palette: 'ochre' });
  house(L, 0, 34, { roofRows: 2, top: '##w', base: '##w', palette: 'sky' });
  house(L, 7, 34, { roofRows: 2, top: '##w##w###', base: '##w##w###', palette: 'white_sage' });
  // Wall rows between the flights and the houses (the design's '=' columns).
  for (let y = 11; y <= 15; y++) { L.set('ground', 1, y, 'terrace:ledge_w', true); L.set('ground', 4, y, 'terrace:ledge_e', true); }

  // The hollow step (9–10, 19): flush with landing 2, wet at the joint; open at the end.
  if (open(g)) {
    // The hole is the step's east half; its west half is just the top of flight 3,
    // so people can still go up and down the Steps past it.
    L.set('ground', 9, 19, 'steps:steps_l', false);
    L.set('ground', 10, 19, 'steps:hollow_open_r', false);
  } else {
    L.set('ground', 9, 19, 'steps:hollow_wet_l', false);
    L.set('ground', 10, 19, 'steps:hollow_wet_r', false);
  }
  L.step[19][9] = L.step[19][10] = 'step_stairs';

  // The view parapet on landing 3's east edge.
  for (let y = 26; y <= 28; y++) L.set('ground', 15, y, 'roof:parapet_e', true);

  // The south wall and the arch to Fountain Square.
  for (let x = 0; x < W; x++) L.set('ground', x, 41, 'street:retain_top', true);
  L.set('ground', 6, 41, pave(6, 41, true), false); L.set('ground', 7, 41, pave(7, 41, true), false);
  L.set('overhead', 6, 41, 'buildings:over_arch_l'); L.set('overhead', 7, 41, 'buildings:over_arch_r');

  // Props.
  for (const [x, y] of [[1, 8], [15, 8], [1, 17], [14, 17]]) L.pot(x, y);
  L.bench(2, 27);
  return L.done();
}

// ---------------------------------------------------------------------------
// The water trickle: the Woman with Basin tips her basin on her doorstep and
// the water runs east along landing 2's lower edge (row 18) and slips into the
// joint of the hollow step. Overlay tiles, laid one by one, then taken away.

const TRICKLE = [[7, 18], [8, 18], [9, 18]]; // then the end tile at (10, 18)

function trickle(g) {
  const here = () => g.map === 'hundred_steps';
  const basin = g.npc('basin_woman');
  if (basin) {
    g.setSprite(basin, LOOKS.basin_tip);
    setTimeout(() => { if (here() && g.npc('basin_woman')) g.setSprite('basin_woman', LOOKS.basin_woman); }, 1300);
  }
  const near = Math.abs(g.player.x - 9) + Math.abs(g.player.y - 18) <= 9;
  const tiles = [...TRICKLE.map(([x, y]) => [x, y, 'act2_water:trickle_h']), [10, 18, 'act2_water:trickle_end']];
  tiles.forEach(([x, y, ref], i) => setTimeout(() => { if (here()) g.setTile('detail', x, y, ref); }, 500 + i * 220));
  setTimeout(() => { if (here()) tiles.forEach(([x, y]) => g.setTile('detail', x, y, null)); }, 4200);
  if (near) {
    setTimeout(() => { if (here()) g.startLoop('trickle'); }, 500);
    setTimeout(() => { g.stopLoop('trickle', 400); if (here()) g.sfx('sink_gurgle'); }, 3600);
  }
}

// ---------------------------------------------------------------------------
// Objects

const MOON_EYE = [
  "A moon-eye: a round blue glass stud set in the step. They're all over town. For luck, people say.",
  "Thirty-one years I've walked over these and never wondered what was under them. I'm wondering now.",
];
const PRY_STEPS = "These steps are older than the Mayor's great-grandmother. I'm not prying them up at random.";

async function hollowLook(g) {
  if (!counted(g)) return g.describe('The edge of the landing, where she\'s sitting. Water has pooled along it, just there, by her feet.', "There's just room to get past her, if I mind her feet.");
  if (bump(g, 'hollow.free') === 0) {
    g.setFlag('step.found');
    return g.describe(
      "It's paved like the landing, but it's a step. Thirty-one years and I never noticed.",
      'Water is running across the landing and into its joint. Not over it. Into it. Steps don\'t drink.',
      'I tap it with my foot. Every other step goes tap. This one goes bonk.',
    );
  }
  return g.describe('Bonk.');
}

const hollowUse = {
  crowbar: async (g) => {
    if (!counted(g)) return g.describe("She's sitting on it. I'm brave, not rude.");
    return openStep(g);
  },
  paper_charcoal: (g) => g.describe('Nothing old enough to be worth a rubbing.'),
  '*': cherylDeclines,
};

let pianoLineShown = false; // the "not climbing over a piano" line, once per visit

async function pianoLook(g) {
  if (!g.flag('movers.met')) {
    if (bump(g, 'piano.steps') === 0) return g.describe('The piano, wedged in the arch like a cork. The label still says No. 9, Cistern Court.');
    return g.describe('Somebody sent me a piano, and the piano has other ideas.');
  }
  const n = bump(g, 'piano.grease');
  if (n === 0 || !g.hasItem('soap')) return g.describe('Grease. Where would I get grease on a Moonshine morning?');
  return g.describe('Grease, he said. My soap is slippery enough to lose in a bath.');
}

const objects = [
  ...MOON_PAVING.map(([x, y]) => ({
    id: `moon_eye_${x}_${y}`, x, y, lookKey: 'moon_eye', looks: MOON_EYE,
    use: { paper_charcoal: (g) => g.describe('A rubbing of a glass bump. Ottilie would frame it. No.'), crowbar: (g) => g.describe(PRY_STEPS), '*': cherylDeclines },
  })),
  // The hollow step: only the free half while she sits on the other.
  { id: 'hollow_step', x: 10, y: 19, when: (g) => !counted(g), interact: hollowLook, use: hollowUse },
  { id: 'hollow_step_free', x: 9, y: 19, w: 2, when: (g) => counted(g) && !open(g), interact: hollowLook, use: hollowUse },
  {
    // The open step (10, 19): walking onto it asks (it's an exit with a confirm);
    // so does looking at it, from beside it, or clicking it.
    id: 'hundredth_step', x: 10, y: 19, when: open,
    interact: (g) => askDown(g),
    use: { '*': (g) => g.describe("I'm not dropping anything down there. I'd only want it back.") },
  },
  { id: 'view', x: 15, y: 26, h: 3, look: 'Halfway down Tessel. Halfway up, if you\'re the Kid.' },
  { id: 'bench', x: 2, y: 27, w: 2, look: 'A bench for the halfway point. Nobody has ever sat on it going down.' },
  ...[[1, 8], [15, 8], [1, 17], [14, 17]].map(([x, y]) => ({ id: `pot_${x}_${y}`, x, y, lookKey: 'geraniums', look: 'Geraniums.' })),
].map((o) => ({ solid: false, use: { crowbar: (g) => g.describe(PRY_STEPS), '*': cherylDeclines }, ...o }));

const piano = {
  id: 'piano', x: 6, y: 40, w: 2, h: 2, kind: 'object',
  sprite: pianoSprite('piano_front'),
  when: (g) => !slid(g),
  interact: pianoLook,
  use: {
    soap: (g) => slidePiano(g),
    crowbar: (g) => g.describe("They've tried that. It's wedged, not stuck."),
    '*': cherylDeclines,
  },
};

const crowbar = {
  id: 'crowbar', x: 9, y: 40, kind: 'object',
  sprite: { sheet: act2_props, frame: 'crowbar_ground' },
  when: (g) => slid(g) && !g.flag('got.crowbar'),
  interact: async (g) => {
    await g.describe("Their crowbar. They'll want it back. They'll have to catch a piano first.");
    g.setFlag('got.crowbar');
    await getItem(g, 'crowbar');
  },
};

const cat = {
  id: 'cat', x: 12, y: 7, sprite: { sheet: props, frame: 'cat' },
  look: 'Another cat, on the uphill side.',
};

// ---------------------------------------------------------------------------
// The Piano Movers (bottom landing, until the piano slides)

async function moversTalk(g) {
  if (!g.flag('movers.met')) {
    g.setFlag('movers.met');
    await g.describe('The Piano Movers. I taught them both. The big one talked for two even then.');
    return g.talk([
      ['Big Mover', "Miss! Don't come any closer. It's wedged. It's been wedged since sunrise."],
      ['Big Mover', 'We came back after moon, like the note said. Piano gone. Found it here. Came down the Hundred Steps by itself.'],
      ['Other Mover', 'Hnn.'],
      ['Big Mover', "He says pianos don't do that. I said, this one did."],
      ['Big Mover', "If it was greased it'd shoot through that arch like a pip. We've no grease. We've a crowbar and a grudge."],
    ]);
  }
  if (bump(g, 'movers.repeat') % 2 === 0) return g.say('Big Mover', 'Grease. Or butter. Or a miracle.');
  return g.talk([
    ['Other Mover', 'Hnn.'],
    ['Big Mover', "He says it's the heaviest piano he's ever met, and he's met a lot of pianos."],
  ]);
}

const moverUse = {
  soap: (g) => slidePiano(g),
  '*': (g) => g.say('Big Mover', 'Very nice, Miss. Not grease, though.'),
};

const movers = [
  { id: 'big_mover', name: 'Big Mover', x: 4, y: 39, facing: 'right', sprite: LOOKS.big_mover },
  { id: 'other_mover', name: 'Other Mover', x: 9, y: 39, facing: 'left', sprite: LOOKS.other_mover },
].map((m) => ({ ...m, when: (g) => !slid(g), interact: moversTalk, use: moverUse }));

async function slidePiano(g) {
  g.takeItem('soap');
  g.sfx('give');
  g.setFlag('movers.met');
  await g.say('Big Mover', 'Soap? ...Lavender. Worth a try. Stand back, Miss.');
  await g.movePlayer([11, 38]);
  g.facePlayer('left');
  // Two beats of scrubbing along the piano's back, crouched on either half.
  const big = g.npc('big_mover'), other = g.npc('other_mover');
  await Promise.all([g.moveNpc(big, [6, 39]), g.moveNpc(other, [7, 39])]);
  g.setSprite(big, moverPose('big', 'scrub_down')); g.setSprite(other, moverPose('other', 'scrub_down'));
  for (let i = 0; i < 2; i++) {
    g.sfx('scrub');
    await g.tween('piano', { offset: [1, 0], seconds: 0.15 });
    await g.tween('piano', { offset: [-1, 0], seconds: 0.15 });
    await g.wait(0.35);
  }
  await g.tween('piano', { offset: [0, 0], seconds: 0.1 });
  // They brace and shove.
  g.setSprite(big, LOOKS.big_mover); g.setSprite(other, LOOKS.other_mover);
  g.faceNpc(big, 'down'); g.faceNpc(other, 'down');
  await g.wait(0.4);
  g.shake(1, 0.3);
  await g.wait(0.4);
  g.sfx('piano_slide');
  g.setSprite('piano', pianoSprite('piano_slide'));
  await g.tween('piano', { offset: [0, 40], seconds: 0.45, clipBelow: true });
  g.hide('piano');
  await g.wait(0.3);
  await g.say('Big Mover', 'Not THAT fast!', { auto: 1 });
  await g.say('Other Mover', 'HNN!', { auto: 0.8 });
  // They run through the arch after it.
  g.setSprite(big, moverPose('big', 'run_down')); g.setSprite(other, moverPose('other', 'run_down'));
  await Promise.all([g.moveNpc(big, 'd d', { ghost: true, speed: 8 }), g.moveNpc(other, 'd d', { ghost: true, speed: 8 })]);
  g.hide(big); g.hide(other);
  g.setFlag('piano.slid');
  await g.wait(0.3);
  g.facePlayer('down');
}

// ---------------------------------------------------------------------------
// The Counting Woman (on the hollow step, until the guidebook)

async function countingTalk(g, self) {
  if (firstMeet(g, 'counting_woman')) {
    await g.describe("The Keeper of the Count. It's a real title. There's a sash. She's wearing the sash.");
    await g.say(self,
      'Ninety-seven. Ninety-eight. Ninety-nine. ...Ninety-nine. Every day. Every DAY.',
      "It's the Hundred Steps, Cheryl. A hundred. It's in the name. I am the Keeper of the Count. It's a civic title.",
      'Every morning I count them, and every morning I get it wrong. Ninety-nine. So I sit, and I count again.',
      'And every morning somebody tips their Moonshine water down the Steps, and my feet get wet. Right here.');
    return g.describe("She's planted on the edge of the landing like a bollard. There's just room to squeeze past her.");
  }
  if (g.flag('counter.sawBook')) return g.say(self, "One book. One mainlander. Show me it in the Tide-Sheet and we'll talk.");
  if (g.flag('counter.sawPaper')) return g.say(self, "A letter's a letter. Show me it in a proper book, with a crest on.");
  return g.say(self, cycle(g, 'counter.repeat', [
    "Fourteen. Fifteen. Don't talk to me, I'm counting. ...Fifteen? Sixteen.",
    "There are a hundred. I'm just bad at it. I've been bad at it for twenty years.",
  ]));
}

async function showGuidebook(g, self) {
  if (g.flag('counter.sawBook')) return g.say(self, "One book. One mainlander. Show me it in the Tide-Sheet and we'll talk.");
  await g.say(self, 'What\'s this? "The Hundred Steps (there are, in fact, ninety-nine)."');
  if (!g.flag('counter.sawPaper')) {
    g.setFlag('counter.sawBook');
    return g.say(self,
      "A BOOK. By a mainlander. They can't count over there. They've got machines for it.",
      "If the Tide-Sheet printed it, now. THAT would be news. Then I'd go to the Mayor.");
  }
  return stormOff(g, self);
}

async function showTideSheet(g, self) {
  await g.say(self, '"Sir: I have counted your Hundred Steps. There are ninety-nine." A LETTER.');
  g.takeItem('tide_sheet');
  if (!g.flag('counter.sawBook')) {
    g.setFlag('counter.sawPaper');
    return g.say(self, "Anyone can write a letter. I'm keeping this. As EVIDENCE. If it was in a proper BOOK...");
  }
  return stormOff(g, self);
}

async function stormOff(g, self) {
  await g.say(self,
    "TWICE? In PRINT? That's not a mistake. That's a CAMPAIGN.",
    "I'm going to the Mayor. I'm going to the Mayor RIGHT NOW.");
  // Clear her path down the flight if Cheryl is standing in it.
  const p = g.player;
  if (p.x === 9 && p.y > 19 && p.y <= 25) { await g.movePlayer([10, p.y]); g.facePlayer('left'); }
  g.setSprite(self, LOOKS.counting_woman);
  g.faceNpc(self, 'down');
  g.sfx('step_stairs');
  await g.moveNpc(self, 'd d d d d d d d', { ghost: true, speed: 11 }); // down flight 3 to landing 3
  const pianoThere = !slid(g);
  // Down to the bottom landing, so the arch, the piano and the Movers are in frame for the climb.
  if (pianoThere) await g.panCamera(7, 41, 3);
  await g.moveNpc(self, 'l l l l d d d d d d d d d d d d r', { ghost: true, speed: 11 }); // along, down flight 4, to (6,39)
  if (pianoThere) {
    g.faceNpc('big_mover', 'right'); g.faceNpc('other_mover', 'left');
    // She climbs straight over the piano.
    g.setSprite(self, { sheet: LOOKS.counting_woman.sheet, frame: 'climb_up' });
    await g.moveNpc(self, 'd', { ghost: true, speed: 14 });
    await g.tween(self, { offset: [0, -10], seconds: 0.25 });
    await g.say('Big Mover', "Madam! That's a PIANO!", { position: 'top' });
    await g.say(self, 'And these are MY STEPS.', { position: 'top' });
    await g.tween(self, { offset: [0, -6], seconds: 0.3 });
    await g.moveNpc(self, 'd', { ghost: true, speed: 14 });
    await g.tween(self, { offset: [0, 0], seconds: 0.15 });
  } else {
    await g.moveNpc(self, 'd d', { ghost: true, speed: 11 });
  }
  g.hide(self);
  g.setFlag('counter.left');
  kidLap(g);
  await g.wait(0.4);
  // Back up to her step: the Woman with Basin tips, and the water runs into the joint and is gone.
  await g.panCamera(9, 18, 3);
  if (g.npc('basin_woman')) trickle(g);
  await g.wait(3.6);
  await g.describe("Steps don't drink.");
  g.setFlag('step.found');
  await g.followPlayer(3);
}

const countingWoman = {
  id: 'counting_woman', name: 'Counting Woman', x: 9, y: 19, facing: 'down',
  sprite: LOOKS.counting_woman_sitting, // sitting on the step, nodding as she counts
  turnToTalk: false,
  when: (g) => !counted(g),
  interact: countingTalk,
  use: {
    guidebook: showGuidebook,
    tide_sheet: showTideSheet,
    moon_chart: (g, self) => g.say(self, 'Ticks. Counting ticks. At least you can count, Cheryl.'),
    '*': (g, self) => g.say(self, "Don't hand me things. I lose count."),
  },
};

// ---------------------------------------------------------------------------
// The Woman with Basin (landing 2)

const basinWoman = {
  id: 'basin_woman', name: 'Woman with Basin', x: 7, y: 16, facing: 'down',
  sprite: LOOKS.basin_woman,
  turnToTalk: false,
  when: (g) => !g.flag('basin.inside'),
  interact: async (g, self) => {
    if (firstMeet(g, 'basin_woman')) {
      await g.say(self, 'Moonshine water down the Steps, for luck. My mother did it, and her mother.');
      trickle(g);
      await g.wait(0.8);
      return g.say(self, "It's not working this year, is it. Did you see that moon? I'm tipping extra.");
    }
    if (bump(g, 'basin.repeat') % 2 === 0) {
      await g.say(self, "Extra luck. Can't hurt.");
      return trickle(g);
    }
    return g.say(self, "Funny. It always runs down the same way, and then it's just... gone.");
  },
  use: { '*': (g, self) => g.say(self, "Not unless it's lucky.") },
};

// ---------------------------------------------------------------------------
// The Sweaty Kid: laps up and down flight 3 and along landing 3. He's solid,
// so he can always be faced and talked to, and he never has the one way past
// the Counting Woman to himself: while she sits on (9, 19), the only way
// through is (10, 19) then (10, 20), so his lap stops at (10, 21), just below
// her, and Cheryl goes by on the flight's free west column. Once she's gone he
// runs up to landing 2; he never stops on the stretch x9–10, y18–24 then, so he
// can't stand on the hollow step.

const LAP_COUNTING = [[10, 21], [10, 27], [13, 27], [10, 27]];
const LAP = [[10, 18], [10, 27], [13, 27], [10, 27]];
// Once the step is open, (9, 19) is the only way past it, so his lap keeps below:
// up flight 3 to (10, 20) and back, never on (9, 18-19).
const LAP_OPEN = [[10, 20], [10, 27], [13, 27], [10, 27]];

// The Kid's lap for the story state (his patrol reads its route every step).
function kidLap(g) {
  let k = null;
  try { k = g.npc('kid'); } catch { return; } // not on the map once the step is open
  if (!k || !k.def.behavior) return;
  const route = counted(g) ? LAP : LAP_COUNTING;
  if (k.def.behavior.route !== route) {
    k.def.behavior.route = route;
    k.patrolIdx = 0;
  }
}

function onKidWaypoint(g, self) {
  if (Math.random() < 0.5) {
    const side = self.facing === 'left' ? 0.35 : -0.35;
    g.spawnEffect({ sprite: { sheet: fx, frame: 'sweat_drop' }, path: [[self.x, self.y - 1.1], [self.x + side, self.y - 1.3]], speed: 0.35, layer: 'top' });
  }
}

async function kidTalk(g, self) {
  if (firstMeet(g, 'kid_steps')) {
    return g.say(self,
      "Can't stop! Stair training! Real stairs! ...They're SO much harder than the well.",
      'I tripped on a step up there that went BONK. Steps go "tap." That one went BONK.',
      'Mrs. Count yells at me every lap. She says I make her lose count.');
  }
  const lines = [];
  if (slid(g)) lines.push('The piano WENT! It went faster than me! ...I need to train harder.');
  if (counted(g)) lines.push("Mrs. Count's gone! ...That's the BONK one, Miss. Where she was sitting.");
  if (!lines.length) lines.push('BONK. Not tap. BONK.', "I can't get past the piano. It's in my way AND it's in my race.");
  return g.say(self, cycle(g, 'kid.steps', lines));
}

// He's solid, like everyone else: with Cheryl and him unable to share a tile,
// he can always be faced and talked to. In the one-tile gap he waits for her
// (the engine never walks an NPC through Cheryl), so she's never shut out.
const kidBase = {
  name: 'Sweaty Kid', facing: 'down',
  sprite: { sheet: sweaty_kid, walk: [1, 2, 3, 4] },
  stepTicks: 13,
  talkPose: 'jog',
  interact: kidTalk,
  use: {
    soap: (g, self) => g.say(self, 'I had a bath last WEEK.'),
    '*': (g, self) => g.say(self, "Can't carry it! Aerodynamics!"),
  },
};

const kids = [
  {
    ...kidBase, id: 'kid', x: 10, y: 21, when: (g) => !open(g),
    behavior: { type: 'patrol', route: LAP_COUNTING, stopNear: 2, nearPose: 'jog', noStop: [[9, 18, 2, 7]], onWaypoint: onKidWaypoint },
  },
  {
    ...kidBase, id: 'kid_after', x: 10, y: 27, when: open,
    behavior: { type: 'patrol', route: LAP_OPEN, stopNear: 2, nearPose: 'jog', onWaypoint: onKidWaypoint },
  },
];

// ---------------------------------------------------------------------------
// The end of Act 2: the hundredth step.

async function openStep(g) {
  const p = g.player;
  if (!(p.y === 18 && (p.x === 9 || p.x === 10))) {
    await g.movePlayer([p.x === 9 ? 9 : 10, 18]);
  }
  g.facePlayer('down');
  g.pose('player', 'kneel_down');
  await g.wait(0.4);
  for (let i = 0; i < 3; i++) {
    g.sfx('stone_scrape');
    g.shake(1, 0.2);
    await g.wait(0.6);
  }
  await g.describe('The mortar\'s old and soft, as if somebody put it in hoping nobody would ever check.');
  g.sfx('slab_lift');
  g.shake(1, 0.3);
  g.setFlag('step.open');
  g.playCue('discovery', { resume: true });
  await g.wait(0.5);
  g.sfx('well_breath');
  g.spawnEffect({ sprite: { sheet: fx_mist, frame: 'mist' }, at: [9.5, 19], seconds: 2, layer: 'top' });
  await g.wait(1.2);
  g.pose('player', null);
  await g.think('Ninety-nine steps up to the Crown.', 'And the hundredth step goes down.');
  await g.describe('A ladder. Bronze, gone green, going straight down into the dark. It smells like the well. It smells like the sea.');
  const basin = g.npc('basin_woman');
  if (basin) {
    g.emote(basin, 'exclaim');
    await g.say(basin, 'Cheryl? Did you just -- is that a HOLE in the STEPS?');
    await g.wait(0.5);
    await g.say(basin, "...No. I didn't see anything. I'm tipping my basin.");
    trickle(g);
    await g.wait(1.6);
    await g.moveNpc(basin, 'u', { ghost: true });
    g.sfx('door');
    g.hide(basin);
    g.setFlag('basin.inside');
  }
}

async function askDown(g) {
  const i = await g.choose('Go down?', ['Yes', 'Not yet']);
  if (i === 0) return goDown(g);
}

async function goDown(g) {
  g.place('player', 10, 19, 'up');
  g.facePlayer('up');
  g.sfx('step_stairs');
  await g.tween('player', { offset: [0, 8], seconds: 0.4, clipBelow: true });
  g.sfx('step_stairs');
  await g.tween('player', { offset: [0, 18], seconds: 0.4, clipBelow: true });
  g.sfx('step_stairs');
  await g.tween('player', { offset: [0, 32], seconds: 0.5, clipBelow: true });
  if (!act2.stepTo) return endOfAct(g);
  // Act 3 is in the game: down the ladder into it.
  await g.fade('out', 0.6);
  await g.tween('player', { offset: [0, 0], seconds: 0, clipBelow: false });
  g.setFlag('act2.done');
  await g.changeMap(act2.stepTo, 3, 3, 'down');
}

// Where the ladder under the hundredth step leads. src/content/index.js sets
// it once Act 3 registers its first map; until then the act ends on a card.
export const act2 = { stepTo: null };

// ---------------------------------------------------------------------------

export const stepsMap = composedMap(compose, {
  id: 'hundred_steps',
  name: 'The Hundred Steps',
  tileset: act2Tiles,
  music: 'neighborhood',
  lighting: 'day',
  step: 'step_stone',
  spawn: [6, 1],
  exits: [
    { x: 6, y: 0, w: 2, to: 'lamp_street', at: [27, 12], facing: 'up' },
    { x: 6, y: 41, w: 2, to: 'fountain_square', at: [11, 4], facing: 'down', when: slid, sfx: 'step_stone' },
    { x: 10, y: 19, when: open, confirm: 'Go down?', choices: ['Yes', 'Not yet'], run: (g) => goDown(g) },
  ],
  triggers: [
    {
      // Walking onto the hollow step once she's gone: it goes bonk. The first time, Cheryl says so.
      x: 9, y: 19, w: 2, stop: false, when: (g) => counted(g) && !open(g) && !g.flag('n.bonk'),
      run: async (g) => {
        g.setFlag('n.bonk', 1);
        g.sfx('step_bonk');
        await g.describe('Bonk.', 'The Kid was right.');
      },
    },
    {
      x: 9, y: 19, w: 2, stop: false, when: (g) => counted(g) && !open(g) && !!g.flag('n.bonk'),
      run: async (g) => { g.sfx('step_bonk'); },
    },
    {
      // Walking down into the piano.
      x: 6, y: 39, w: 2,
      when: (g) => !slid(g) && g.player.facing === 'down' && !pianoLineShown,
      run: async (g) => {
        pianoLineShown = true;
        await g.describe("I'm not climbing over a piano that isn't mine. The Goat Path goes round the long way.");
      },
    },
  ],
  onEnter: async (g) => {
    pianoLineShown = false;
    actWrongness(g);
    kidLap(g);
    if (g.flag('n.stepsArrived')) return;
    g.setFlag('n.stepsArrived', 1);
    await g.describe(
      'The Hundred Steps. Ninety-nine of them. Everybody knows that, and everybody calls them the Hundred Steps anyway.',
      "That's Tessel.",
    );
  },
  ambient: [
    // The Woman with Basin tips her basin every twenty seconds or so.
    { every: [18, 24], when: (g) => !g.flag('basin.inside'), run: trickle },
  ],
  // People first: on a shared tile (the Kid crossing the hollow step) the first entity answers.
  entities: [...kids, countingWoman, basinWoman, ...movers, cat, piano, crowbar, ...objects],
});

// For tests and the map viewer.
export const STEPS = { LAP, TRICKLE };
