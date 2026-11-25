// The two montages (docs/design/06-moon-in-the-bowl.md, "The hauling" step 4,
// and "The master stop and the refill" step 4): instant cuts to other acts'
// maps at night, two or three seconds each, then straight back to Cheryl.
//
// Each cut visits a map with changeMap(..., { cutscene: true, fade: false }).
// Act 6's night props on those maps (the crowd, the lanterns, the piano in the
// boat) are entities added in extend-maps.js, shown while `fx.montage` names
// the cut. A cut whose map isn't in the game yet is skipped.

import { chess_fly } from '../../art/act6_sprites.js';
import { act6 } from './state.js';

const has = (id) => !!act6.maps[id];

// Visit `map` at night, centered on (x, y), with `fx.montage` = `name`.
async function cut(g, name, map, x, y, run) {
  if (!has(map)) return false;
  g.setFlag('fx.montage', name);
  await g.changeMap(map, x, y, 'down', { cutscene: true, fade: false });
  g.setLighting('night', 0);
  await run(g);
  return true;
}

async function back(g) {
  g.setFlag('fx.montage', null);
  await g.restorePlayer({ fade: false });
}

const auto = (s = 1.2) => ({ auto: s, position: 'top' });

// ---------------------------------------------------------------------------
// The lurch: five cuts while the chain comes home (about 13 seconds in all).

export const LURCH_CUTS = [
  // 1. The dry Bilge, Dry Canal Day: the Mayor on the bridge; the crowd sits down; the piano rolls into the boat.
  async (g) => cut(g, 'lurch', act6.ids.bilgeDry, 18, 12, async () => {
    g.say('Mayor', '...and so, citizens, tonight Tessel steps FORWARD--', auto(1.4));
    await g.wait(1.5);
    g.sfx('lurch');
    g.shake(3, 0.5);
    g.setFlag('fx.lurch', 1);
    g.sfx('crowd_oof');
    await g.wait(0.25);
    g.setFlag('fx.lurch', 2);
    // The piano rolls along the mud, gathering speed, and drops into the Boatman's boat.
    g.sfx('piano_boat');
    await g.tween('act6_piano', { offset: [24, 0], seconds: 0.5 });
    await g.tween('act6_piano', { offset: [112, 0], seconds: 0.6 });
    g.setFlag('fx.pianoBoat', true);
    g.shake(1, 0.3);
    await g.wait(0.5);
    await g.say('Boatman', "...I've got a piano.", auto(1.2));
  }),
  // 2. Cistern Court: the lurch; the chess pieces fly; GERALD!; the sheets stand straight out.
  async (g) => cut(g, 'lurch', 'cistern_court', 5, 15, async () => {
    g.sfx('lurch');
    g.shake(3, 0.5);
    g.sfx('chess_scatter');
    g.spawnEffect({ sprite: { sheet: chess_fly, frame: 'chess_fly' }, at: [3, 15.6], seconds: 0.44, layer: 'top' });
    g.spawnEffect({ sprite: { sheet: chess_fly, frame: 'chess_fly' }, at: [3.5, 15.4], offset: [4, -2], seconds: 0.44, layer: 'top' });
    await g.say('Old Man', 'GERALD!', auto(1.1));
    // Up on the roof, the Neighbor's sheets stand straight out like flags.
    g.setFlag('fx.backline', 'swung');
    g.sfx('sheets_crack');
    await g.panCamera(13, 5, 8);
    await g.wait(1);
    g.setFlag('fx.backline', null);
  }),
  // 3. The lamp room: the Keeper at the window; the Teeth slide away into the dark.
  async (g) => cut(g, 'lurch', act6.ids.lampRoom, act6.pos.lampRoom[0], act6.pos.lampRoom[1], async () => {
    g.setFlag('fx.teeth', 'recede');
    await g.wait(1);
    await g.say('Lighthouse Keeper', "It's going. It's GOING.", auto(1.4));
  }),
  // 4. The risen Harbor: Mott at the quay edge raises a mug of tea to the moon. No line.
  async (g) => cut(g, 'lurch', act6.ids.harborRisen, 13, 7, async () => {
    g.setFlag('fx.teeth', 'recede');
    g.setFlag('fx.mottToast', 0);
    g.panCamera(13, 12, 20); // down to the horizon: Mott at the quay edge, the Teeth beyond
    await g.wait(0.9);
    g.setFlag('fx.mottToast', 1);
    await g.wait(1.6);
  }),
  // 5. The belfry: Ambrose still holding the rope, eyes shut.
  async (g) => cut(g, 'lurch', act6.ids.belfry, act6.pos.belfry[0], act6.pos.belfry[1], async () => {
    await g.wait(0.5);
    await g.say('Ambrose', 'HOME AGAIN.', auto(1.4));
  }),
];

export async function lurchMontage(g) {
  let any = false;
  for (const c of LURCH_CUTS) any = (await c(g)) || any;
  g.setFlag('fx.teeth', null);
  g.setFlag('fx.mottToast', null);
  g.setFlag('fx.lurch', null);
  g.setFlag('fx.pianoBoat', null);
  if (any) await back(g);
  return any;
}

// ---------------------------------------------------------------------------
// The refill: the canals come rushing back.

export async function refillMontage(g) {
  let any = false;
  // 1. The dry Bilge at night: water rushing back along the trench, rising; the boat lifts with the piano.
  any = (await cut(g, 'refill', act6.ids.bilgeDry, 18, 12, async () => {
    g.sfx('canal_rush');
    // The canals rise in three stages, and the boat lifts off the mud with them.
    for (const stage of [1, 2, 3]) {
      g.setFlag('fx.refill', stage);
      g.tween('act6_boat', { offset: [0, -16 * (stage - 1)], seconds: 0.5 });
      await g.wait(0.8);
    }
    await g.say('Boatman', "I'M AFLOAT! I'M AFLOAT AND I'VE GOT A PIANO!", auto(1.6));
  })) || any;
  // 2-3. The wet Bilge: the crowd on the quays, soaked, cheering; the Mayor.
  any = (await cut(g, 'refill', act6.ids.bilge, 15, 11, async () => {
    g.sfx('crowd_cheer');
    await g.say('Fishmonger', 'It came BACK! I KNEW it would!', auto(1.4));
    await g.say('Mayor', 'Dry Canal Day is... postponed!', auto(1.6));
  })) || any;
  g.setFlag('fx.refill', null);
  if (any) await back(g);
  return any;
}
