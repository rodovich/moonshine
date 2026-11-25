// The Keepers' ladder (docs/design/05-high-and-dry.md, "The Keepers' ladder"):
// bronze rungs beside the speaking tube, from the Windlass Room up to a floor
// hatch in the belfry beside Ambrose. Found from below; it saves the long way
// round the town once the bronze door is open.
//
// The Windlass Room's end is in windlass.js (the rungs at (16, 1-2), the tube's
// choice); the belfry's end is layered onto Act 4's map in town.js.

import { hull } from '../../art/underground.js';
import { cheryl } from '../../art/cheryl.js';
import { act5Loops } from './loops.js';

export const HATCH = [5, 6]; // the belfry's floor hatch, beside Ambrose at the foot of the rope
export const known = (g) => !!g.flag('keepers.ladder');
// While Act 6's night waits for the bell, the ladder isn't used.
export const night = (g) => !!g.flag('act6.started') && !g.flag('epilogue');

// The climb: the shaft wall sliding down past Cheryl in the dark (as Act 6's
// dawn lift draws it), with her on the rungs in the middle, for about four seconds.
function shaftClimb(g) {
  const wall = g.sheet(hull);
  const her = g.sheet(cheryl);
  let shade = null;
  return (ctx, ms) => {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 256, 224);
    const k = Math.min(ms / 4000, 1);
    const dist = 420 * (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
    const base = Math.floor(dist / 16);
    const off = Math.round(dist) % 16;
    for (let row = -1; row < 15; row++) {
      const top = ((row - base) % 2 + 2) % 2 === 0;
      for (let col = 0; col < 16; col++) {
        const name = col === 8 ? (top ? 'ladder_top' : 'ladder_bot') : `${top ? 'face_top' : 'face_base'}${col % 3 ? '' : '_b'}`;
        const img = wall.frame(name);
        if (img) ctx.drawImage(img, col * 16, row * 16 + off);
      }
    }
    const f = her.frame(`climb_up_${Math.floor(ms / 220) % 2}`) || her.frame('up_0');
    if (f) ctx.drawImage(f, 128, 140 - f.height);
    if (!shade) {
      shade = document.createElement('canvas');
      shade.width = 256;
      shade.height = 224;
      const c = shade.getContext('2d');
      const gr = c.createRadialGradient(136, 124, 10, 136, 124, 80);
      gr.addColorStop(0, 'rgba(0,0,0,0)');
      gr.addColorStop(0.6, 'rgba(0,0,0,0.4)');
      gr.addColorStop(1, 'rgba(0,0,0,1)');
      c.fillStyle = gr;
      c.fillRect(0, 0, 256, 224);
    }
    ctx.drawImage(shade, 0, 0);
  };
}

export async function climbToBelfry(g) {
  if (!(g.player.x === 16 && g.player.y === 3)) await g.movePlayer([16, 3]);
  g.facePlayer('up');
  g.pose('player', 'climb_up');
  g.sfx('step_rung');
  if (known(g)) {
    await g.wait(0.3);
    g.pose('player', null);
    g.sfx('step_rung');
    await g.changeMap('belfry', HATCH[0], HATCH[1] + 1, 'up', { seconds: 0.5 });
    return;
  }
  // The first time: the long climb in the dark, the tube's wind growing, then the bell's hum.
  await g.fade('out', 0.4);
  g.pose('player', null);
  await g.showPicture(shaftClimb(g), { fade: 0 });
  await g.fade('in', 0.3);
  g.startLoop('tube_wind');
  g.setLoopVolume('tube_wind', 0.3, 0);
  g.setLoopVolume('tube_wind', 1, 3000);
  for (let i = 0; i < 6; i++) {
    g.sfx('step_rung');
    await g.wait(0.55);
  }
  g.sfx('bell_low');
  await g.wait(0.9);
  await g.fade('out', 0.3);
  g.stopLoop('tube_wind', 600);
  await g.changeMap('belfry', HATCH[0], HATCH[1] + 1, 'up', { fade: false });
  await g.hidePicture({ fade: 0 });
  g.setFlag('keepers.ladder');
  g.sfx('hatch_open');
  await g.fade('in', 0.5);
  await g.wait(0.4);
  const a = g.npc('ambrose_belfry');
  if (a) g.faceNpc(a, 'player');
  await g.say(a || 'Ambrose', 'CHERYL. YOU CAME UP THROUGH MY FLOOR.', "THAT HATCH HAS BEEN THERE FIFTY-TWO YEARS. I THOUGHT IT WAS FOR MICE.");
  await g.describe('The bell to the bow, in one ladder.', "The Keepers didn't take the Steps.");
}

export async function climbToWindlass(g) {
  const [hx, hy] = HATCH;
  if (!(g.player.x === hx && g.player.y === hy + 1)) await g.movePlayer([hx, hy + 1]);
  g.facePlayer('up');
  g.sfx('step_rung');
  act5Loops(g, []);
  await g.changeMap('windlass_room', 16, 3, 'down', { seconds: 0.5 });
}

// The belfry's end: the hatch in the floor by the rope.
export const belfryHatch = {
  id: 'keepers_hatch', x: HATCH[0], y: HATCH[1], solid: true,
  interact: async (g) => {
    if (!known(g)) {
      return g.describe('A little bronze hatch in the floor by the rope. Bolted from underneath. Everything in this town is bolted from the other side.');
    }
    await g.describe('My ladder to the bow.');
    if (night(g)) return;
    const i = await g.choose('Climb down?', ['Yes', 'Not now']);
    if (i === 0) await climbToWindlass(g);
  },
  use: { crowbar: (g) => g.describe("It's bolted from underneath. I'd only be prying at the floor."), '*': (g) => g.describe('Not down there.') },
};

export const belfryHatchPatch = (g) => [['detail', HATCH[0], HATCH[1], { tile: known(g) ? 'ice_cellar:hatch_open' : 'ice_cellar:hatch_shut', solid: true }]];

export const ladderScripts = { climbToBelfry, climbToWindlass };
