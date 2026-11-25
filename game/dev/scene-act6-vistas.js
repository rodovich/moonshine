// Act 6's full-screen pictures (docs/art-act6.md, "Full-screen images").
// ?state=basin (default): the Basin view, the moon stepping through its four positions as the trim
//   wheel turns, then the rim lighting when it's true.
// ?state=basin_reflection: the bath: the moon true, the rim lit, Cheryl's reflection and ripples.
// ?state=final: the final vista: the moon rising dead in the Gate, then the title fading in.
// ?still holds the last moment of each.
import { BASIN_MOON_POS } from '../src/art/act6_vistas.js';

const q = new URLSearchParams(location.search);
const still = q.has('still');
const at = q.has('t') ? +q.get('t') : null;   // ?t=ms freezes the loop at that moment

export function SCENE(state) {
  const kind = state === 'final' ? 'final' : state === 'basin_reflection' ? 'reflection' : 'basin';
  return {
    title: { basin: 'The Basin view (trim steps)', reflection: 'The Basin view (the bath)', final: 'The final vista' }[kind],
    width: 256,
    height: 224,
    scale: 3,
    draw(ctx, now, { SHEETS, frameCanvas, animFrame }) {
      const img = (sheet, frame) => frameCanvas(sheet, SHEETS[sheet], frame);
      const anim = (sheet, base, t) => img(sheet, animFrame(SHEETS[sheet], base, t));
      if (!SHEETS.basin_view || !SHEETS.vista_final) return;

      if (kind === 'final') {
        const LOOP = 16000;
        const t = at ?? (still ? 15000 : now % LOOP);
        ctx.drawImage(img('vista_final', 'bowl_moonrise'), 0, 0);
        // the glow gathers in the Gate, then the moon rises into it and stops dead centre
        const glow = t < 800 ? -1 : t < 1800 ? 0 : t < 2800 ? 1 : 2;
        if (glow >= 0) ctx.drawImage(img('vista_glow', `glow_${glow}`), 128 - 60, 112 - 48);
        if (t > 2000) {
          const cy = Math.max(92, Math.round(126 - 6 * (t - 2000) / 1000));
          ctx.drawImage(anim('final_moon', 'moon', now), 128 - 16, cy - 16);
        }
        ctx.drawImage(img('vista_rim', 'rim'), 0, 0);
        ctx.drawImage(img('vista_cheryl', 'cheryl_tub'), 0, 128);
        // hold, then the title: a two-step fade
        if (t > 10500) ctx.drawImage(img('vista_title', t > 11300 ? 'title_1' : 'title_0'), 0, 0);
        return;
      }

      // The Basin view
      const LOOP = 14000;
      const t = at ?? (still ? 13000 : now % LOOP);
      ctx.drawImage(img('basin_view', 'basin'), 0, 0);
      // trim steps: 0 far right, 1 nearer, 2 dead in the Gate, 3 two fingers past (true)
      const step = kind === 'reflection' ? 3 : Math.min(3, Math.floor(t / 2500));
      const [mx, my] = BASIN_MOON_POS[step];
      ctx.drawImage(anim('basin_moon', 'moon', now), mx - 12, my - 12);
      ctx.drawImage(img('basin_cliffs', 'cliffs'), 0, 0);
      // moon true: the rim lights from one point all the way round
      const lit = kind === 'reflection' ? 3 : t < 8000 ? -1 : Math.min(3, Math.floor((t - 8000) / 400));
      if (lit >= 0) ctx.drawImage(img('basin_rimlit', `rimlit_${lit}`), 0, 0);
      if (kind === 'reflection') {
        ctx.drawImage(anim('basin_ripples', 'ripple', now), 0, 0);
        ctx.drawImage(anim('basin_cheryl', 'reflection', now), 0, 0);
      }
    },
  };
}
