// The dawn (docs/design/06-moon-in-the-bowl.md, "The dawn"): up the Keepers'
// lift in the dark, out of the well in Cistern Court, and the Old Man's
// "Morning."

import { hull } from '../../art/underground.js';

// The ride up: the shaft wall scrolling down past Cheryl, lit only by her
// disc, for about four seconds, slowing at the top.
function shaftRide(g) {
  const art = g.sheet(hull);
  let glow = null;
  return (ctx, ms) => {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 256, 224);
    const t = Math.min(ms / 1000, 4.2);
    // 0 → 4.2 s: speed eases in, cruises, then eases out at the top.
    const k = t / 4.2;
    const dist = 520 * (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
    // As she rises, the wall slides down the screen.
    const scrolled = Math.round(dist);
    const base = Math.floor(scrolled / 16);
    const off = scrolled % 16;
    for (let row = -1; row < 15; row++) {
      const top = ((row - base) % 2 + 2) % 2 === 0;
      for (let col = 0; col < 16; col++) {
        const rib = col === 5 || col === 10;
        const name = rib ? (top ? 'face_rib_top' : 'face_rib_base') : `${top ? 'face_top' : 'face_base'}${col % 3 ? '' : '_b'}`;
        const img = art.frame(name);
        if (img) ctx.drawImage(img, col * 16, row * 16 + off);
      }
    }
    // The disc's light: a soft cyan pool around her, the rest dark.
    if (!glow) {
      glow = document.createElement('canvas');
      glow.width = 256;
      glow.height = 224;
      const c = glow.getContext('2d');
      const gr = c.createRadialGradient(128, 128, 8, 128, 128, 72);
      gr.addColorStop(0, 'rgba(0,0,0,0)');
      gr.addColorStop(0.55, 'rgba(0,0,0,0.35)');
      gr.addColorStop(1, 'rgba(0,0,0,1)');
      c.fillStyle = gr;
      c.fillRect(0, 0, 256, 224);
    }
    ctx.drawImage(glow, 0, 0);
  };
}

export async function dawn(g) {
  // 1. Into the cage; the gate closes; the counterweight goes down as she goes up.
  g.facePlayer('up');
  await g.movePlayer([6, 3]);
  g.facePlayer('up');
  g.setFlag('fx.liftOpen', true);
  g.sfx('lift_gate');
  await g.wait(0.6);
  await g.movePlayer('u', { ghost: true });
  g.hide('player');
  await g.wait(0.3);
  g.setFlag('fx.liftOpen', null);
  g.sfx('lift_gate');
  await g.wait(0.8);
  g.stopMusic(1500);
  g.sfx('lift_ride');
  await g.fade('out', 1);
  await g.showPicture(shaftRide(g), { fade: 0 });
  await g.fade('in', 0.5);
  await g.wait(3.8);
  await g.fade('out', 0.6);
  await g.hidePicture({ fade: 0 });

  // 2. Cistern Court at dawn: pale pink and gold. The grate lifts; she climbs out.
  g.setFlag('epilogue');
  g.setFlag('fx.dawn', 'scene');
  g.setWrongness(0);
  await g.changeMap('cistern_court', 9, 18, 'down', { seconds: 1.4 });
  g.startLoop('dawn_birds', { fadeMs: 2500 });
  await g.wait(1.6);
  g.sfx('well_grate');
  g.setFlag('fx.wellGrate', 1);
  await g.wait(0.5);
  g.setFlag('fx.wellGrate', 2);
  await g.wait(0.6);
  // Her climbing-out frames are cut flat at the bottom: that edge sits on the well's rim.
  g.place('player', 9, 17, 'down');
  g.player.def.shadow = false;
  for (const [i, s] of [[0, 0.7], [1, 0.6], [2, 0.5]]) {
    g.pose('player', `well_down_${i}`, { offset: [8, -20] });
    if (i === 0) g.show('player');
    await g.wait(s);
  }
  g.pose('player', null);
  g.player.def.shadow = undefined;
  g.place('player', 9, 18, 'down');
  await g.wait(0.4);
  g.setFlag('fx.wellGrate', 1);
  await g.wait(0.2);
  g.setFlag('fx.wellGrate', null);
  g.sfx('well_grate', { volume: 0.5 });
  await g.wait(0.6);

  // 3-6. The Old Man looks up from his chess.
  g.facePlayer('left');
  g.pose('epi_old_man', 'talk_right');
  await g.wait(0.6);
  await g.say('epi_old_man', 'Morning.');
  g.pose('epi_old_man', null);
  await g.wait(1);
  g.pose('epi_old_man', 'talk_right');
  await g.say('epi_old_man', "Gerald says you came out of the well. I said, don't be ridiculous, Gerald.");
  g.pose('epi_old_man', null);
  // 7.
  await g.describe('Morning.');
  await g.describe("I should go and see the town. Then I've a tick to make.");
  // 8. Control returns, to the town's own tune, whole for the first time since Moonshine Night.
  g.setFlag('fx.dawn', 'morning');
  g.playMusic('neighborhood');
}
