// The Archive (16 × 14), inside the Blue Dome, and the crypt (10 × 7) under
// it, with the Founders' Door. From docs/design/02-city.md.
//
//  Archive              Crypt
//    0123456789012345     0123456789
//  0 ################   0 ##########
//  1 #bbbb##ww##bbbb#   1 #cc##FF#c#   F the Founders' Door
//  4 #.bb...O....bb.#   3 #..l.....#   l Ottilie's lectern
//  5 #......dd......#   5 #^.......#   ^ stair up
//  8 #......EE......#   6 ##########
//  9 #......EE......#
// 11 #............v.#   v stair down to the crypt
// 13 #######DD#######

import { composedMap, blankGrid } from '../opening/grid.js';
import { act2Tiles } from './tiles.js';
import { layout, bump, firstMeet, getItem, talking, cherylDeclines, actWrongness } from './common.js';
import { ottilie } from '../../art/named_npcs.js';

// A room in the Archive's or crypt's own art: row 0 the top of the north wall,
// then the wall's face rows, side walls, and a south wall.
function room(L, W, H, sheet, { cap, faces, south, corners }) {
  for (let x = 0; x < W; x++) {
    const edge = x === 0 ? '_w' : x === W - 1 ? '_e' : '';
    L.set('ground', x, 0, `${sheet}:${cap}${corners ? edge : ''}`, true);
    faces.forEach((f, i) => L.set('ground', x, 1 + i, `${sheet}:${f}${corners ? edge : ''}`, true));
    L.set('ground', x, H - 1, `${sheet}:${south}${corners ? edge : ''}`, true);
  }
  for (let y = 1 + faces.length; y < H - 1; y++) {
    L.set('ground', 0, y, `${sheet}:wall_w`, true); L.set('ground', W - 1, y, `${sheet}:wall_e`, true);
    for (let x = 1; x < W - 1; x++) L.set('ground', x, y, `${sheet}:${(x * 7 + y * 3) % 11 ? 'floor' : 'floor_b'}`, false);
  }
  if (!corners) for (let y = 0; y <= faces.length; y++) { L.set('ground', 0, y, `${sheet}:wall_w`, true); L.set('ground', W - 1, y, `${sheet}:wall_e`, true); }
}

// ---------------------------------------------------------------------------
// The Archive

const AW = 16, AH = 14;

function composeArchive() {
  const L = layout(AW, AH, blankGrid);
  room(L, AW, AH, 'archive', { cap: 'wall_cap', faces: ['wall_face_upper', 'wall_face_lower'], south: 'wall_s', corners: true });
  // The curved wall bookcases and the high windows.
  'abcd'.split('').forEach((c, i) => {
    for (const x0 of [1, 11]) {
      L.set('ground', x0 + i, 1, `archive_furniture:wallshelf_top_${c}`, true);
      L.set('ground', x0 + i, 2, `archive_furniture:wallshelf_bot_${c}`, true);
    }
  });
  L.set('ground', 7, 1, 'archive:window_nw', true); L.set('ground', 8, 1, 'archive:window_ne', true);
  L.set('ground', 7, 2, 'archive:window_sw', true); L.set('ground', 8, 2, 'archive:window_se', true);
  // Light from the high windows, pooled on the floor in front of the desk.
  ['nw', 'n', 'n', 'ne'].forEach((f, i) => L.set('detail', 6 + i, 6, `archive:pool_${f}`));
  ['sw', 's', 's', 'se'].forEach((f, i) => L.set('detail', 6 + i, 7, `archive:pool_${f}`));
  // Freestanding shelves, and Ottilie's desk with its seven cold cups.
  for (const [x, y] of [[2, 4], [12, 4], [2, 10], [12, 10]]) {
    L.set('detail', x, y, 'archive_furniture:shelf_free_l', true); L.set('detail', x + 1, y, 'archive_furniture:shelf_free_r', true);
  }
  L.set('detail', 7, 5, 'archive_furniture:desk_l', true); L.set('detail', 8, 5, 'archive_furniture:desk_r', true);
  // The Eye: walkable glass, except where the teapot sits.
  L.set('ground', 7, 8, 'archive:eye_nw'); L.set('ground', 8, 8, 'archive:eye_ne');
  L.set('ground', 7, 9, 'archive:eye_sw'); L.set('ground', 8, 9, 'archive:eye_se');
  L.set('detail', 7, 8, 'archive_furniture:teapot', true);
  // The stair down to the crypt, and the door out.
  L.set('ground', 13, 11, 'archive:stair_down', false);
  L.step[11][13] = 'step_stairs';
  L.set('ground', 7, AH - 1, 'archive:door_l', false); L.set('ground', 8, AH - 1, 'archive:door_r', false);
  return L.done();
}

const RUB_HERE = "Ottilie would never forgive me for a rubbing of her desk.";
const archiveUse = { paper_charcoal: (g) => g.describe(RUB_HERE), '*': cherylDeclines };

const archiveObjects = [
  {
    id: 'eye', x: 8, y: 8, h: 2,
    looks: [
      "A round window in the floor, thick as my hand. Under it, dark. Not cellar dark. Deep dark.",
      "Ottilie calls it the Eye and keeps her teapot on it. Five hundred years old, and it's a coaster.",
    ],
  },
  { id: 'eye_s', x: 7, y: 9, lookKey: 'eye', looks: [
    "A round window in the floor, thick as my hand. Under it, dark. Not cellar dark. Deep dark.",
    "Ottilie calls it the Eye and keeps her teapot on it. Five hundred years old, and it's a coaster.",
  ] },
  ...[[1, 4], [11, 4]].map(([x, w]) => ({
    id: `wall_shelves_${x}`, x, y: 1, w, h: 2, lookKey: 'wall_shelves',
    looks: ['Records of Tessel. Births, deaths, and a whole shelf of complaints about the bell.', 'Three hundred years of people writing down that the bell rang. Nobody ever wrote down why.'],
  })),
  ...[[2, 4], [12, 4], [2, 10], [12, 10]].map(([x, y]) => ({
    id: `shelves_${x}_${y}`, x, y, w: 2, lookKey: 'monographs',
    look: "Ottilie's monographs. 'The Founders: A Theory of Eels.' 'The Founders: Smugglers?' 'The Door That Does Not Open.'",
  })),
  { id: 'windows', x: 7, y: 1, w: 2, h: 2, look: "Light comes in under the dome and pools on the floor. It's lovely. I'd never tell her." },
  { id: 'desk', x: 7, y: 5, w: 2, look: "Seven cups of tea, all half-drunk, all cold. She's working." },
].map((o) => ({ solid: false, use: archiveUse, ...o }));

const teapot = {
  id: 'teapot', x: 7, y: 8, solid: false,
  look: 'Her mother\'s teapot. I learned to keep away from it at book club.',
  use: archiveUse,
};

// Ottilie: behind her desk, sipping cold tea.
const ottilieTalk = async (g, self) => {
  if (firstMeet(g, 'ottilie')) {
    await g.describe('Ottilie Brask. My oldest friend in Tessel. Never once right about the Founders. Never once in doubt.');
    await g.say(self,
      'Cheryl! You saw the moon. Everyone saw the moon. Nobody is asking the right question.',
      'The right question is: what did the Founders know? The Founders knew EVERYTHING. Then they went into the hill.',
      "Eels, I used to think. Now I'm leaning toward smugglers. Smugglers would know about moons.",
      "You've got your investigating look. Here. Paper and charcoal. For Founder work, mind. And the Founders put their best work on FLOORS.",
      "Look down, Cheryl. Where the light falls. Nothing up here's worth it. I've rubbed my Door to death.");
    g.setFlag('ottilie.met');
    await getItem(g, 'paper_charcoal');
    return g.say(self,
      'And remember my grandmother\'s saying: "Ninety-nine steps up to the Crown, and the hundredth step goes down."',
      "It's about humility. Probably. I've written about it.");
  }
  const lines = [
    '"Ninety-nine steps up to the Crown, and the hundredth step goes down." Humility. Probably.',
    'Floors, Cheryl. Where the light falls. Primary sources.',
    "The Founders' Door is in the crypt. It doesn't open. I've written a monograph about how it doesn't open.",
    'Mind the teapot. It\'s on the Eye. The Eye is ancient glass. The teapot was my mother\'s. Both are irreplaceable.',
  ];
  return g.say(self, lines[bump(g, 'ottilie.repeat') % lines.length]);
};

const ottilieUse = {
  moon_chart: (g, self) => g.say(self, "Thirty-one years of data! ...They're all in the same place, Cheryl. That's not data, that's a habit.", 'Except the last one. Well. Everyone has an off night.'),
  guidebook: (g, self) => g.say(self, '"Founded by fishermen in the year of the Great Shoal." FISHERMEN. I could scream. I may scream.'),
  soap: (g, self) => g.say(self, 'Lavender. Is this about book club? I said I was sorry.'),
  paper_charcoal: (g, self) => g.say(self, "Not on ME, Cheryl. On something OLD. ...Don't say it."),
  '*': (g, self) => g.say(self, "Is it old? It isn't old. Bring me something old."),
};

const ottilieNpc = {
  id: 'ottilie', name: 'Ottilie', x: 7, y: 4, facing: 'down',
  sprite: { sheet: ottilie, frame: 'teacup_down' },
  interact: talking(ottilie, ottilieTalk),
  use: Object.fromEntries(Object.entries(ottilieUse).map(([k, fn]) => [k, talking(ottilie, fn)])),
};

export const archiveMap = composedMap(composeArchive, {
  id: 'archive',
  name: 'The Archive',
  tileset: act2Tiles,
  music: 'archive',
  lighting: 'day',
  background: 'ink',
  step: 'step_tile',
  spawn: [7, 12],
  exits: [
    { x: 7, y: AH - 1, w: 2, to: 'crown', at: [18, 7], facing: 'down' },
    { x: 13, y: 11, to: 'crypt', at: [2, 5], facing: 'right', sfx: 'step_stairs' },
  ],
  onEnter: async (g) => { actWrongness(g); g.stopLoop('door_hum', 400); },
  entities: [...archiveObjects, teapot, ottilieNpc],
});

// ---------------------------------------------------------------------------
// The crypt

const CW = 10, CH = 7;

function composeCrypt() {
  const L = layout(CW, CH, blankGrid);
  room(L, CW, CH, 'crypt', { cap: 'wall_cap', faces: ['wall_face', 'wall_face_lower'], south: 'wall_s', corners: false });
  // Crates of records stacked against the back wall.
  for (const x of [1, 2, 8]) { L.set('detail', x, 1, 'archive_furniture:crate_stack_top', true); L.set('detail', x, 2, 'archive_furniture:crate_stack_bot', true); }
  // The Founders' Door (5–6, 1–2): dark slate, no mortar, no handle.
  for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) L.set('ground', 5 + x, 1 + y, `founders_door:founders_door_x${x}y${y}`, true);
  L.set('detail', 3, 3, 'archive_furniture:lectern', true);
  L.set('ground', 1, 5, 'crypt:stair_up', false);
  L.step[5][1] = 'step_stairs';
  return L.done();
}

const DOOR = {
  first: [
    "A door. Not one of ours. Dark stone, cut dead straight. No mortar. The corners are cut off at an angle.",
    "There's no handle on this side. Ottilie says it's bolted from the other side. There is no other side. It's a hill.",
  ],
  then: "I put my hand on it. It's cold, and it hums, very faintly, like a held breath.",
};

const cryptObjects = [
  {
    id: 'founders_door', x: 5, y: 1, w: 2, h: 2,
    looks: [DOOR.first, DOOR.then],
    use: {
      crowbar: (g) => g.describe("There isn't a seam to get it into. Whoever made this didn't make doors for crowbars."),
      paper_charcoal: (g) => g.describe("Rubbed to a shine. Ottilie's been here before me. Forty times, she says."),
      '*': (g) => g.describe("It doesn't want that."),
    },
  },
  { id: 'lectern', x: 3, y: 3, look: "'The Door That Does Not Open,' by O. Brask. Forty pages. The door has not opened once while I've been reading it." },
  ...[[1, 2], [8, 1]].map(([x, w]) => ({
    id: `crates_${x}`, x, y: 1, w, h: 2, lookKey: 'crates',
    look: 'Minutes of council meetings. Three hundred years of people agreeing to look into it.',
  })),
].map((o) => ({ solid: false, use: { '*': cherylDeclines }, ...o }));

export const cryptMap = composedMap(composeCrypt, {
  id: 'crypt',
  name: 'The crypt',
  tileset: act2Tiles,
  music: 'archive',
  lighting: 'day',
  background: 'ink',
  step: 'step_stone',
  darkness: 0.45,
  lightArea: [[1, 0, 8, 6]], // light pools stay inside the side and south walls (the stair at (1, 5) included)
  lights: [
    { x: 1.5, y: 4.5, radius: 1.8, color: 'lamp_warm' },
    { x: 3, y: 3, radius: 2.5, color: 'lamp_glow' },
    { x: 5.5, y: 2.5, radius: 2, color: 'relic_cyan' },
  ],
  spawn: [2, 5],
  exits: [{ x: 1, y: 5, to: 'archive', at: [12, 11], facing: 'left', sfx: 'step_stairs' }],
  onEnter: async (g) => { actWrongness(g); },
  // The Founders' Door hums when Cheryl stands next to it.
  ambient: [{
    every: [0.5, 0.5],
    run: (g) => {
      const p = g.player;
      if (p.y <= 3 && p.x >= 4 && p.x <= 7) g.startLoop('door_hum');
      else g.stopLoop('door_hum', 500);
    },
  }],
  entities: cryptObjects,
});
