// Act 6: Moon in the Bowl, the climax and the ending
// (docs/design/06-moon-in-the-bowl.md). Two maps of its own (the Long Keel and
// the Sighting Room), plus states added to other acts' maps: the Windlass
// Room at night, the montage cuts, the dawn, the epilogue, the final scene.

import { keelMap } from './keel.js';
import { sightingMap, bath } from './sighting.js';
import { act6Items } from './common.js';
import { act6 } from './state.js';
import { extendMap } from './extend.js';
import { windlassAct6, windlassScripts } from './climax.js';
import { courtEpilogue, lampStreetEpilogue, crownEpilogue, archiveEpilogue, cryptEpilogue, squareEpilogue, shopEpilogue, stepsEpilogue } from './epilogue.js';
import { flatEnding, finalScene, endingVista } from './ending.js';
import { dawn } from './dawn.js';
import { lurchMontage, refillMontage } from './montage.js';

export { act6Items };

export const act6Maps = { long_keel: keelMap, sighting_room: sightingMap };

// Act 6's states on other acts' maps, by map id.
const EXTENSIONS = {
  [act6.ids.windlass]: windlassAct6,
  cistern_court: courtEpilogue,
  flat: flatEnding,
  lamp_street: lampStreetEpilogue,
  crown: crownEpilogue,
  archive: archiveEpilogue,
  crypt: cryptEpilogue,
  fountain_square: squareEpilogue,
  shop: shopEpilogue,
  hundred_steps: stepsEpilogue,
};

// Called by src/content/index.js with every map in the game: adds Act 6's
// states to the maps that exist, and links the Long Keel to the Windlass Room
// once Act 5 has built it.
export function addAct6(maps) {
  for (const [id, ext] of Object.entries(EXTENSIONS)) {
    if (maps[id]) maps[id] = extendMap(maps[id], ext(maps[id]));
  }
  if (!maps[act6.ids.windlass]) {
    maps.long_keel = { ...maps.long_keel, exits: maps.long_keel.exits.filter((e) => e.to !== act6.ids.windlass) };
  }
  act6.maps = maps;
  return maps;
}

// Dawn: pale pink and gold (Cistern Court, from the lift until she first leaves the court).
export const act6Lighting = {
  dawn: [
    { color: '#f8b0a0', mode: 'multiply', amount: 0.32 },
    { color: '#f8d088', mode: 'screen', amount: 0.14 },
  ],
};

export const act6Scripts = {
  ...windlassScripts,
  // ?map=sighting_room&x=7&y=10&flags=act6.started,chain.home,sisters.asleep,moon.true,basin.plugged,got.plug,trim=3&run=act6_bath
  act6_bath: bath,
  // ?map=sighting_room&x=7&y=7&flags=...,bathed&run=act6_dawn
  act6_dawn: dawn,
  // ?map=flat&x=5&y=7&flags=act1.moonrise,act6.started,epilogue,epi.leftCourt,epi.piano&run=act6_final
  act6_final: finalScene,
  // ?map=flat&run=act6_vista: the final vista and the credits alone
  act6_vista: endingVista,
  act6_lurch: lurchMontage,
  act6_refill: refillMontage,
};
