// Shared pieces for Act 6: items, the helpers reused from the opening, the
// state predicates, and the Basin view (the full-screen picture of the moon
// in the water).

import { items2 } from '../../art/items.js';
import { basin_view, basin_cliffs, basin_moon, basin_cheryl, basin_ripples, basin_rimlit, BASIN_MOON_POS } from '../../art/act6_vistas.js';
import { bump, cycle, getItem, talking, cherylDeclines } from '../opening/common.js';

export { bump, cycle, getItem, talking, cherylDeclines };

// ---------------------------------------------------------------------------
// Items new in Act 6 (docs/design/06-moon-in-the-bowl.md, "Items").

export const act6Items = {
  found_plug: {
    name: 'Bath Plug',
    icon: { sheet: items2, frame: 'bath_plug' },
    description: 'My plug. Chain and all. It fell all the way to the bottom of the city.',
  },
  new_plug: {
    name: 'Bath Plug',
    icon: { sheet: items2, frame: 'bath_plug' },
    description: "A new plug. Brass, with a little chain. It isn't the same. It'll do.",
  },
};

// ---------------------------------------------------------------------------
// Story state.

export const night = (g) => !!g.flag('act6.started') && !g.flag('epilogue');
// From Cheryl climbing out of the well; still true after the credits (Continue reopens the epilogue).
export const epilogue = (g) => !!g.flag('epilogue');
// The ending has played (set just before the credits hand back to the title).
export const finished = (g) => !!g.flag('act6.done');

// ---------------------------------------------------------------------------
// The Basin view (docs/art-act6.md, "The Basin view"): the moon at one of four
// trim positions, gliding between them; the rim lighting once it's true; and,
// for the bath, the ripples and Cheryl's reflection. The script moves it along
// by setting fields on the returned object.

export function basinView(g, { step = 0 } = {}) {
  const art = {
    view: g.sheet(basin_view), cliffs: g.sheet(basin_cliffs), moon: g.sheet(basin_moon),
    rim: g.sheet(basin_rimlit), ripples: g.sheet(basin_ripples), cheryl: g.sheet(basin_cheryl),
  };
  const v = {
    now: 0,
    step,                // trim position 0..3
    from: null,          // { step, at } while the moon glides from one position to the next
    glideMs: 1600,
    rimAt: null,         // when the rim starts lighting
    bath: false,         // Cheryl's reflection and the ripples
    shimmer: null,       // { at }: the moonlight breaking on new water, then settling
  };
  // Move the moon to `step`, gliding there.
  v.moveTo = (s) => {
    v.from = { step: v.step, at: v.now };
    v.step = s;
  };
  v.draw = (ctx, ms) => {
    v.now = ms;
    ctx.drawImage(art.view.frame('basin'), 0, 0);
    let [mx, my] = BASIN_MOON_POS[v.step];
    if (v.from) {
      const k = Math.min(1, (ms - v.from.at) / v.glideMs);
      const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2; // ease in and out
      const [fx, fy] = BASIN_MOON_POS[v.from.step];
      mx = fx + (mx - fx) * e;
      my = fy + (my - fy) * e;
      if (k >= 1) v.from = null;
    }
    // The moonlight breaking into pieces on new water: the moon's reflection
    // trembles sideways, less and less, then settles.
    let jx = 0;
    if (v.shimmer) {
      const t = (ms - v.shimmer.at) / 1000;
      if (t < 2.4) jx = Math.round(Math.sin(t * 19) * 3 * (1 - t / 2.4));
      else v.shimmer = null;
    }
    ctx.drawImage(art.moon.frameAt('moon', ms), Math.round(mx) - 12 + jx, Math.round(my) - 12);
    ctx.drawImage(art.cliffs.frame('cliffs'), 0, 0);
    if (v.rimAt != null && ms >= v.rimAt) {
      const i = Math.min(3, Math.floor((ms - v.rimAt) / 400));
      ctx.drawImage(art.rim.frame(`rimlit_${i}`), 0, 0);
    }
    if (v.bath) {
      ctx.drawImage(art.ripples.frameAt('ripple', ms), 0, 0);
      ctx.drawImage(art.cheryl.frameAt('reflection', ms), 0, 0);
    }
  };
  return v;
}
