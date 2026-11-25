// Act 3 on the surface: the way up through the Founders' Door into Ottilie's crypt, the Archive, and the Crown
// at dusk, where every moon-eye in Tessel glows. From docs/design/03-downstairs.md
// ("Crypt and Crown at dusk", "Surfacing").
//
// These are Act 2's maps (game/src/content/act2/). Rather than edit them,
// `withAct3(maps)` returns them with Act 3's states layered on: extra exits,
// triggers, entities, and tile patches; `when`s on the Act 2 entities that
// step aside; lighting and onEnter chained. Act 2 keeps working on its own.

import { ottilie } from '../../art/named_npcs.js';
import { sweaty_kid } from '../../art/opening_npcs.js';
import { founders_door_open } from '../../art/chartroom.js';
import { moon_eyes } from '../../art/downstairs.js';
import { vista2, vista2_light, VISTA2_LIGHTS } from '../../art/vista2.js';
import { loadSheet } from '../../engine/art.js';
import { drawText, drawTextCentered, measure } from '../../engine/text.js';
import { LOOKS, talking } from '../act2/common.js';
import { WRONGNESS, unbolted } from './common.js';

const surfaced = (g) => !!g.flag('act3.surfaced');

// Set by src/content/index.js: the script that starts Act 4 (it takes over
// after the dusk vista, from black), or null for Act 3's end card.
export const act3 = { next: null };
const done = (g) => !!g.flag('act3.done');

// ---------------------------------------------------------------------------
// Helpers for layering onto a map def

const both = (a, b) => (g) => (!a || a(g)) && (!b || b(g));

function chain(...fns) {
  const list = fns.filter(Boolean);
  return async (g) => { for (const f of list) await f(g); };
}

function morePatches(base, extra) {
  return (g) => [...(base ? base(g) : []), ...extra(g)];
}

// ---------------------------------------------------------------------------
// The crypt: the Founders' Door open, and Ottilie coming down with her lamp

// Ottilie with her lamp, as a walking sheet (her lamp frames under the
// engine's walk names).
const of = ottilie.frames;
const lampOttilie = {
  palette: ottilie.palette,
  size: ottilie.size,
  durations: { idle_down: ottilie.durations.lamp_idle_down },
  frames: Object.fromEntries([
    ...['down', 'up', 'left', 'right'].flatMap((d) => [0, 1, 2].map((n) => [`${d}_${n}`, of[`lamp_${d}_${n}`]])),
    ['idle_down_0', of.lamp_idle_down_0], ['idle_down_1', of.lamp_idle_down_1],
  ]),
};

const ottilieLamp = {
  id: 'ottilie_lamp', name: 'Ottilie', x: 1, y: 5, facing: 'right',
  sprite: { sheet: lampOttilie },
  light: { radius: 2.6, color: 'lamp_warm' },
  when: (g) => !!g.flag('crypt.ottilie'),
  talk: ['Go home, Cheryl. Soup.'],
};

export async function throughFoundersDoor(g) {
  const x = g.player.x === 8 ? 6 : 5;
  g.sfx('step_stairs');
  if (g.flag('act3.crypt')) return g.changeMap('crypt', x, 3, 'down');
  await g.changeMap('crypt', x, 3, 'down');
  g.setWrongness(WRONGNESS);
  if (x === 6) await g.movePlayer('l');
  g.facePlayer('down');
  await g.wait(0.6);
  // From the stair, Ottilie comes down with a lamp.
  g.setFlag('crypt.ottilie');
  g.sfx('step_stairs');
  await g.wait(0.4);
  const o = 'ottilie_lamp';
  g.emote(o, 'exclaim');
  await g.say(o, "Who's down there? I heard-- CHERYL?");
  await g.moveNpc(o, [4, 3]);
  g.faceNpc(o, 'right');
  g.facePlayer('left');
  await g.say(o, "The Founders' Door. It's open. That door doesn't open. I have a monograph.");
  await g.say(o, "...You came in the front and went round behind. There's probably a gap. I'll find it. I'll write about it.");
  if (!g.hasItem('paper_charcoal') && !g.hasItem('ship_plan')) {
    await g.say(o, "And if you're going to wander about behind my walls, take rubbings. Here.");
    g.sfx('give');
    await g.giveItem('paper_charcoal');
  }
  if (g.hasItem('ship_plan')) {
    await g.say(o, "Cheryl. Is that charcoal on your knees? What did you rub? Don't tell me. Yes, tell me. Tomorrow. I'm too upset.");
  }
  await g.say(o, "It's nearly dark. Have you been in my crypt all afternoon? Go home. Have some soup.");
  await g.moveNpc(o, [1, 5]);
  g.sfx('step_stairs');
  g.setFlag('act3.crypt');
  g.setFlag('crypt.ottilie', false);
}

const DOOR_TILES = (g) => {
  if (!unbolted(g)) return [];
  const out = [];
  for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) {
    const tile = `founders_door_open:founders_door_open_x${x}y${y}`;
    out.push(['ground', 5 + x, 1 + y, y === 0 ? { tile, solid: true } : tile]);
  }
  return out;
};

function withCrypt(def) {
  return {
    ...def,
    tileset: { ...def.tileset, sheets: { ...def.tileset.sheets, founders_door_open } },
    lighting: (g) => (unbolted(g) ? 'dusk' : typeof def.lighting === 'function' ? def.lighting(g) : def.lighting),
    patches: morePatches(def.patches, DOOR_TILES),
    // The doorway's lower row is open ground; the door entity blocks it until it opens.
    collision: Array.from({ length: def.ground.length }, (_, y) => (y === 2 ? '     oo   ' : '          ')),
    exits: [{ x: 5, y: 2, w: 2, to: 'chart_room', at: [7, 3], facing: 'down', when: unbolted, sfx: 'step_stairs' }, ...(def.exits || [])],
    entities: [
      ...(def.entities || []).map((e) => (e.id === 'founders_door' ? { ...e, solid: true, when: both(e.when, (g) => !unbolted(g)) } : e)),
      ottilieLamp,
    ],
  };
}

// ---------------------------------------------------------------------------
// The Archive: dusk once the door is open; Ottilie's lines after the crypt;
// the first walk out to the Crown

const ottilieAfter = {
  talk: async (g, self) => g.say(self, "A gap. There's a gap somewhere. Three hundred years and I missed a gap."),
  ship_plan: async (g, self) => g.say(self, 'Tomorrow, Cheryl. I need a night with this. And a sherry.'),
};

function withArchive(def) {
  const entities = (def.entities || []).map((e) => {
    if (e.id !== 'ottilie') return e;
    const base = e.interact;
    return {
      ...e,
      interact: talking(ottilie, async (g, self, looks) => (g.flag('act3.crypt') ? ottilieAfter.talk(g, self) : base(g, self, looks))),
      use: { ...e.use, ship_plan: talking(ottilie, ottilieAfter.ship_plan) },
    };
  });
  return {
    ...def,
    lighting: (g) => (unbolted(g) ? 'dusk' : typeof def.lighting === 'function' ? def.lighting(g) : def.lighting),
    exits: [
      {
        x: 7, y: 13, w: 2, when: (g) => unbolted(g) && !surfaced(g),
        run: async (g) => {
          g.setFlag('act3.surfaced');
          g.setFlag('moonEyes.glow');
          await g.changeMap('crown', 18 + g.player.x - 7, 7, 'down');
        },
      },
      ...(def.exits || []),
    ],
    entities,
  };
}

// ---------------------------------------------------------------------------
// The Crown at dusk

// Moon-eye studs in the plaza paving and the stair (as Act 2 places them).
const STUDS = [[5, 8], [9, 12], [14, 9], [18, 12], [3, 10], [20, 8]];
const quad = (x, y) => `${y % 2 ? 's' : 'n'}${x % 2 ? 'e' : 'w'}`;

// Act 2 places the plain studs; at dusk they glow.
function studPatches(g) {
  if (!(g.flag('moonEyes.glow') && surfaced(g))) return [];
  const glow = '_glow';
  return [
    ...STUDS.map(([x, y]) => ['ground', x, y, `moon_eyes:pave_${quad(x, y)}_eye${glow}`]),
    ['ground', 11, 14, { tile: `moon_eyes:stairs_l_eye${glow}`, step: 'step_stairs' }],
    ['ground', 12, 14, { tile: `moon_eyes:stairs_r_eye${glow}`, step: 'step_stairs' }],
  ];
}

// The Crown at dusk lasts from surfacing until Act 4's morning (or Act 6's epilogue).
const dusk = (g) => surfaced(g) && !g.flag('act4.started') && !g.flag('epilogue');

const duskPeople = [
  {
    id: 'ambrose_dusk', name: 'Ambrose', x: 6, y: 7, facing: 'down', sprite: LOOKS.ambrose, behavior: 'face',
    when: dusk,
    talks: [
      'THE STEPS ARE GLOWING. EVERY STEP IN TESSEL. NOBODY RANG FOR THAT.',
      "SOMETHING'S AWAKE THAT WASN'T. I CAN FEEL IT IN MY TEETH.",
    ],
    use: { '*': (g, self) => g.say(self, 'NOT NOW, CHERYL. LOOK AT THE STEPS.') },
  },
  {
    id: 'kid_dusk', name: 'Sweaty Kid', x: 10, y: 10, facing: 'right', sprite: { sheet: sweaty_kid, walk: [1, 2, 3, 4] },
    talkPose: 'jog', when: dusk,
    talks: [
      'Miss! The steps are GLOWING! I ran down AND up and they glow ALL THE WAY!',
      "I'm gonna run them in the dark. You can see where to put your feet!",
    ],
    use: { '*': (g, self) => g.say(self, "Can't carry it! I'm running in the DARK!") },
  },
  {
    id: 'watering_dusk', name: 'Woman with Watering Can', x: 14, y: 12, facing: 'left', sprite: LOOKS.watering_woman, behavior: 'face',
    when: dusk,
    talks: [
      [
        "Glowing doorsteps, and the Fountain's stopped dead. Five hundred years! Everyone's in the Square.",
        "My husband says it's the Pelletier boys.",
        "Who are on the mainland. Which is exactly what they'd want you to think.",
      ],
      "The Mayor says it's thieves. Water thieves. With glowing paint.",
    ],
    use: { '*': (g, self) => g.say(self, "Not now, dear. I'm watching the steps.") },
  },
];

// The vista: Tessel from the Crown at dusk, the lights coming on from the
// Crown down to the water, then twinkling.
function vista() {
  const bg = loadSheet(vista2);
  const light = loadSheet(vista2_light);
  return (ctx, ms) => {
    ctx.drawImage(bg.frame('crown_dusk'), 0, 0);
    VISTA2_LIGHTS.forEach(([x, y], i) => {
      const on = 600 + (224 - y) * 25;
      if (ms < on) return;
      ctx.drawImage(light.frameAt('light', ms + i * 137), x - 4, y - 4);
    });
  };
}

// MOONSHINE over "End of Act 3. Tessel continues soon." (the same card as Act 2's).
function endCard() {
  let title = null;
  return (ctx) => {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 256, 224);
    if (!title) {
      title = document.createElement('canvas');
      title.width = measure('Moonshine') + 2;
      title.height = 11;
      drawText(title.getContext('2d'), 'Moonshine', 0, 0, { color: 'ui_select', shadow: 'ui_cheryl_box' });
    }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(title, Math.round(128 - title.width), 72, title.width * 2, title.height * 2);
    drawTextCentered(ctx, 'End of Act 3.', 128, 118, { color: 'ui_text' });
    drawTextCentered(ctx, 'Tessel continues soon.', 128, 132, { color: 'ui_text' });
  };
}

async function showEndCard(g) {
  g.stopMusic(1500);
  g.stopLoop('glow_shimmer', 1500);
  await g.fade('out', 1.2);
  // Saved on the plaza above the parapet, so Continue doesn't start on a trigger.
  g.place('player', 11, 12, 'down');
  g.setFlag('act3.done');
  await g.showPicture(endCard(), { fade: 0 });
  await g.fade('in', 1);
  await g.wait(4);
  await g.fade('out', 1);
  await g.toTitle();
}

export async function crownEnding(g) {
  g.facePlayer('down');
  await g.wait(0.8);
  g.playCue('reveal_last', { resume: false });
  await g.showPicture(vista(), { fade: 1.2 });
  await g.wait(5);
  await g.think('That was me.');
  await g.think('The Fountain was me, and the lights were me.');
  await g.think("I've been down there one afternoon.");
  await g.wait(1);
  // Act 4 takes over from here once it registers (see act3.next); until then, the end card.
  if (act3.next) {
    g.stopMusic(1500);
    g.stopLoop('glow_shimmer', 1500);
    await g.fade('out', 1.2);
    await g.hidePicture({ fade: 0 });
    g.place('player', 11, 12, 'down');
    g.setFlag('act3.done');
    return act3.next(g);
  }
  await g.hidePicture({ fade: 0 });
  await showEndCard(g);
}

function withCrown(def) {
  const baseMusic = def.music;
  const baseLighting = def.lighting;
  return {
    ...def,
    tileset: { ...def.tileset, sheets: { ...def.tileset.sheets, moon_eyes } },
    // Music starts in onEnter so the dusk scene can have none.
    music: undefined,
    lighting: (g) => (dusk(g) ? 'dusk' : typeof baseLighting === 'function' ? baseLighting(g) : baseLighting),
    // At dusk a little darkness, so each glowing moon-eye casts its own pool.
    darkness: (g) => (dusk(g) ? 0.4 : 0),
    darkColor: 'dusk_indigo_deep',
    lights: (g) => (dusk(g) ? [
      ...STUDS.map(([x, y]) => ({ x, y, radius: 1.3, color: 'relic_cyan' })),
      { x: 11.5, y: 14, radius: 1.6, color: 'relic_cyan' },
      { x: 8, y: 7.4, radius: 2.4, color: 'lamp_warm' }, { x: 15, y: 7.4, radius: 2.4, color: 'lamp_warm' },
    ] : []),
    patches: morePatches(def.patches, studPatches),
    exits: [
      // At dusk the way down is the end of the act (after the vista, the card).
      { x: 11, y: 15, w: 2, when: dusk, run: (g) => (done(g) ? showEndCard(g) : crownEnding(g)) },
      ...(def.exits || []),
    ],
    triggers: [
      { x: 0, y: 13, w: 24, when: (g) => !!g.flag('act3.surfaced') && !g.flag('act3.done'), run: crownEnding },
      ...(def.triggers || []),
    ],
    entities: [
      ...(def.entities || []).map((e) => (e.id === 'ambrose' ? { ...e, when: both(e.when, (g) => !dusk(g)) } : e)),
      ...duskPeople,
    ],
    onEnter: chain(async (g) => {
      if (!dusk(g)) {
        if (baseMusic) g.playMusic(baseMusic);
        return;
      }
      g.stopMusic(800);
      g.setWrongness(WRONGNESS);
      g.startLoop('glow_shimmer');
      if (g.flag('n.crownDusk')) return;
      g.setFlag('n.crownDusk', 1);
      await g.wait(1.2);
      await g.describe('Dusk already. And the plaza is full of little blue lights.');
    }, def.onEnter),
  };
}

// The Archive leaves the glow loop behind; the Crown starts it again.
function stopShimmer(def) {
  return { ...def, onEnter: chain(async (g) => g.stopLoop('glow_shimmer', 600), def.onEnter) };
}

// ---------------------------------------------------------------------------

export function withAct3(maps) {
  const out = { ...maps };
  if (out.crypt) out.crypt = withCrypt(out.crypt);
  if (out.archive) out.archive = stopShimmer(withArchive(out.archive));
  if (out.crown) out.crown = withCrown(out.crown);
  return out;
}

// Named scripts (runnable with ?run=, and visible to npm run check).
export const surfaceScripts = { throughFoundersDoor, showEndCard, crownEnding };
