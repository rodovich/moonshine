// Vista 2: Tessel from the Crown at dusk, every doorstep glowing (docs/design/03-downstairs.md, Surfacing).
// The lights come on in a wave from the Crown down toward the water, then twinkle. ?still shows them all lit.
import { VISTA2_LIGHTS } from '../src/art/vista2.js';

const still = new URLSearchParams(location.search).has('still');

export const SCENE = {
  title: 'Vista 2: Tessel from the Crown at dusk',
  width: 256, height: 224, scale: 3,
  draw(ctx, now, API) {
    const { SHEETS, frameCanvas, animFrame } = API;
    const bg = SHEETS.vista2, light = SHEETS.vista2_light;
    if (!bg) return;
    ctx.drawImage(frameCanvas('vista2', bg, 'crown_dusk'), 0, 0);
    if (!light) return;
    const t = still ? 1e9 : now % 12000;
    VISTA2_LIGHTS.forEach(([x, y], i) => {
      const on = 600 + (224 - y) * 25;            // nearest first, then rolling down toward the water
      if (t < on) return;
      const f = animFrame(light, 'light', now + i * 137);
      ctx.drawImage(frameCanvas('vista2_light', light, f), x - 4, y - 4);
    });
  },
};
