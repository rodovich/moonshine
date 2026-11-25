// The final scene, the final vista, and the credits
// (docs/design/06-moon-in-the-bowl.md, "The final scene", "Credits").

import { vista_glow, vista_rim, vista_twinkle, VISTA_BASINS } from '../../art/vista.js';
import { vista_final, final_moon, vista_cheryl_bath, vista_title } from '../../art/act6_vistas.js';

// The final vista, per docs/art-act6.md: the glow gathers in the Gate, the moon
// rises dead into it and stops, then (when the script says) the title. Its
// own clock (`t`) keeps running across the hand-off to the credits.
function finalVista(g) {
  const art = {
    bowl: g.sheet(vista_final), glow: g.sheet(vista_glow), moon: g.sheet(final_moon), rim: g.sheet(vista_rim),
    twinkle: g.sheet(vista_twinkle), cheryl: g.sheet(vista_cheryl_bath), title: g.sheet(vista_title),
  };
  const phases = VISTA_BASINS.map((_, i) => (i * 677) % 1180);
  const v = { t: 0, titleAt: null, titleOff: null };
  v.at = (offset) => (ctx, ms) => v.draw(ctx, ms + offset);
  v.draw = (ctx, ms) => {
    v.t = ms;
    ctx.drawImage(art.bowl.frame('bowl_moonrise'), 0, 0);
    const glow = ms < 800 ? -1 : ms < 1800 ? 0 : ms < 2800 ? 1 : 2;
    if (glow >= 0) ctx.drawImage(art.glow.frame(`glow_${glow}`), 128 - 60, 112 - 48);
    if (ms > 2000) {
      const cy = Math.max(92, Math.round(126 - (6 * (ms - 2000)) / 1000));
      ctx.drawImage(art.moon.frameAt('moon', ms), 128 - 16, cy - 16);
    }
    ctx.drawImage(art.rim.frame('rim'), 0, 0);
    VISTA_BASINS.forEach(([x, y], i) => ctx.drawImage(art.twinkle.frameAt('twinkle', ms + phases[i]), x - 3, y - 3));
    ctx.drawImage(art.cheryl.frame('cheryl_bath'), 0, 128);
    // The title: a two-step fade in; and out again, the same way, before the credits roll.
    if (v.titleAt != null && ms >= v.titleAt) {
      let step = ms - v.titleAt > 800 ? 1 : 0;
      if (v.titleOff != null && ms >= v.titleOff) step = ms - v.titleOff > 800 ? -1 : 0;
      if (step >= 0) ctx.drawImage(art.title.frame(`title_${step}`), 0, 0);
    }
  };
  return v;
}

export const CREDITS = [
  { text: 'MOONSHINE', heading: true },
  '', '',
  { text: 'Story and design', heading: true }, 'Claude (Anthropic)', '',
  { text: 'Art', heading: true }, 'Claude (Anthropic)', '',
  { text: 'Music and sound', heading: true }, 'Claude (Anthropic)', '',
  { text: 'Engine', heading: true }, 'Claude (Anthropic)', '',
  { text: 'Building and testing', heading: true }, 'Claude (Anthropic)', '',
  { text: 'Review', heading: true }, 'Claude (Anthropic)',
  '', '',
  'Orchestrated with Lander',
  '', '',
  'Made for rodovich',
  '', '', '', '',
  'No one ever knew.',
];

export async function finalScene(g) {
  // 1. To the table; she sits, and sets the moon chart down from her satchel.
  await g.wait(0.4);
  await g.movePlayer([4, 5]);
  g.facePlayer('up');
  g.pose('player', 'write_up_0', { offset: [0, -6] });
  await g.wait(0.6);
  g.setFlag('fx.chart', true);
  await g.wait(0.6);
  // 2.
  await g.describe('Thirty-two ticks.', "And last night's. In the Gate. Two fingers past, for the date.");
  // 3. The tick.
  g.pose('player', 'write_up', { offset: [0, -6] });
  g.sfx('pen_scratch');
  await g.wait(1.4);
  g.pose('player', 'write_up_0', { offset: [0, -6] });
  await g.wait(0.6);
  // 4-5.
  await g.describe("It isn't Moonshine Night.");
  await g.describe('But it counts.');
  // 6.
  g.stopMusic(2500);
  await g.fade('out', 2);
  await g.card('Moonshine Night. A year later.', 3);
  await endingVista(g);
}

export async function endingVista(g) {
  // 7. The final vista: the Act 1 composition, made right.
  const v = finalVista(g);
  await g.showPicture(v.draw, { fade: 0 });
  g.playMusic('ending');
  await g.fade('in', 2);
  await g.wait(13);
  // 8. Hold, then the title fades in over the sky.
  v.titleAt = v.t;
  await g.wait(5);
  v.titleOff = v.t;
  await g.wait(1.4);
  // 9. The credits roll over the vista.
  await g.credits(CREDITS, { picture: v.at(v.t), speed: 14, skipAfter: 3, hold: 5, fade: 0 });
  // 10. The title screen. The save reopens the flat in the morning, the epilogue open.
  g.stopMusic(2000);
  await g.fade('out', 2);
  await g.hidePicture({ fade: 0 });
  g.pose('player', null);
  g.setFlag('fx.chart', null);
  g.place('player', 5, 7, 'up');
  g.setFlag('act6.done');
  g.markComplete();
  await g.toTitle();
}

// The flat, for the final scene: the moon chart on the table while she writes.
export function flatEnding() {
  return {
    patches: (g) => (g.flag('fx.chart') ? [['detail', 4, 4, 'furniture:table_chart_l'], ['detail', 5, 4, 'furniture:table_chart_r']] : []),
  };
}
