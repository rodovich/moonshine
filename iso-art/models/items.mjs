// Inventory items as small 3D models, rendered in the iso view and fitted to
// 40×40 icons; and Cheryl's satchel for the bag button.

import { box, boxAt, union, move, place, cylinder, sphere, capsule, torus, frustum, ellipsoid, roundCone, custom, intersect, subtract } from '../lib/sdf.mjs';
import { mat, hex, render, screenBounds } from '../lib/render.mjs';
import { toImage, trim, blank, blit } from '../lib/post.mjs';
import { fbm, vnoise } from '../lib/noise.mjs';
import { POST } from '../lib/jobs.mjs';

const PI = Math.PI;
const m = (c, o = {}) => mat(c, { tag: 'prop', ...o });

/** Cheryl's leather satchel: a flap bag with a brass clasp and a strap loop. */
export function satchel({ open = false } = {}) {
  const leather = mat((x, y, z, lx, ly, lz) => {
    const c = hex('#9a6438'), n = fbm(lx * 9, ly * 9, lz * 9, 3);
    const k = 0.86 + n * 0.26;
    return [c[0] * k, c[1] * k, c[2] * k];
  }, { tag: 'prop', spec: 0.35, shin: 20 });
  const dark = m('#6a4024', { spec: 0.3 });
  const brass = m('#e8b848', { spec: 1, shin: 40 });
  const parts = [
    box(0.5, 0.2, 0.36, leather, 0.1),
    // Strap loop over the top.
    place(torus(0.42, 0.035, dark), { at: [0, 0, 0.36], rx: PI / 2 }),
  ];
  if (!open) {
    parts.push(place(box(0.52, 0.04, 0.24, dark, 0.05), { at: [0, 0.2, 0.14], rx: 0.12 }));
    parts.push(move(box(0.07, 0.03, 0.06, brass, 0.02), 0, 0.25, -0.06));
  } else {
    parts.push(place(box(0.52, 0.04, 0.24, dark, 0.05), { at: [0, -0.1, 0.62], rx: -1.2 }));
    parts.push(move(box(0.42, 0.14, 0.02, m('#2a1a10')), 0, 0, 0.35));
  }
  return place(union(parts), { rz: -PI / 4 - 0.2 });
}

const ink = m('#1e1a20', { spec: 0.7, shin: 30 });

export const ICONS = {
  // Black, tall, dignified.
  pepper_mill: () => union(
    frustum(0.2, 0.15, 0, 0.75, ink, 0.03),
    move(sphere(0.17, ink), 0, 0, 0.82),
    move(cylinder(0.035, 0.95, 1.05, m('#c8c8d0', { spec: 1, shin: 40 }), 0.01), 0, 0, 0),
    move(sphere(0.05, m('#c8c8d0', { spec: 1 })), 0, 0, 1.07),
    move(torus(0.18, 0.02, m('#8a8a94', { spec: 0.8 })), 0, 0, 0.72),
  ),
  // A little round wind-up timer with a bell on top: a red drum, its dial turned toward us.
  egg_timer: () => {
    const face = mat((x, y, z, lx, ly, lz) => {
      if (lz < 0.13) return hex('#d84838');
      const r = Math.hypot(lx, ly), a = Math.atan2(ly, lx);
      if (r > 0.3) return hex('#e8d8b0');
      if (Math.abs(((a / (2 * PI)) * 12 + 120) % 1 - 0.5) > 0.38 && r > 0.22) return hex('#302830');
      if (Math.abs(ly) < 0.025 && lx > -0.02 && lx < 0.2) return hex('#302830');
      return hex('#f6eedc');
    }, { tag: 'prop', spec: 0.5, shin: 30 });
    const drum = place(cylinder(0.4, -0.16, 0.16, face, 0.06), { ry: PI / 2 });
    return union(
      place(drum, { at: [0, 0, 0.48], rz: PI / 4 }),
      move(sphere(0.12, m('#e8c050', { spec: 1, shin: 40 })), 0, 0, 0.94),
      capsule([0, 0, 0.84], [0, 0, 0.9], 0.03, m('#a08040')),
      capsule([-0.18, 0.18, 0.14], [-0.22, 0.22, 0.0], 0.05, m('#a03030')), capsule([0.18, -0.18, 0.14], [0.22, -0.22, 0.0], 0.05, m('#a03030')),
    );
  },
  // A long forked pole, diagonal.
  clothes_prop: () => {
    const w = m('#e0bc88', { spec: 0.15 });
    return place(union(capsule([0, 0, -1.2], [0, 0, 1.0], 0.12, w), capsule([0, 0, 1.0], [0.22, 0, 1.35], 0.09, w), capsule([0, 0, 1.0], [-0.22, 0, 1.35], 0.09, w)), { ry: 0.75, rz: -0.6 });
  },
  // Brass plug with a little chain and ring.
  bath_plug: () => {
    const b = m('#e0b048', { spec: 1, shin: 40 });
    const parts = [frustum(0.3, 0.36, 0, 0.22, b, 0.03), move(torus(0.08, 0.025, b), 0, 0, 0.3)];
    for (let i = 0; i < 5; i++) parts.push(place(torus(0.06, 0.018, b), { at: [0.1 + i * 0.13, 0.05 + i * 0.07, 0.32 + Math.sin(i * 0.9) * 0.08], rx: i % 2 ? PI / 2 : 0 }));
    parts.push(place(torus(0.12, 0.025, b), { at: [0.78, 0.42, 0.3], rx: 1.2 }));
    return union(parts);
  },
  // A lilac bar of lavender-and-pumice soap.
  soap: () => union(
    box(0.42, 0.26, 0.14, mat((x, y, z, lx, ly, lz) => {
      const c = hex('#c8a8e0'), n = vnoise(lx * 30, ly * 30, lz * 30);
      return n > 0.82 ? hex('#a080b8') : c;
    }, { tag: 'prop', spec: 0.4, shin: 20 }), 0.1),
  ),
  // Rolled paper with a crescent.
  moon_chart: () => {
    const paper = mat((x, y, z, lx, ly, lz) => {
      const a = Math.atan2(lz, ly);
      if (lx > -0.1 && lx < 0.25 && Math.abs(a - 1.1) < 0.5) {
        const u = (lx - 0.07) / 0.18, v = (a - 1.1) / 0.5;
        const r1 = Math.hypot(u, v), r2 = Math.hypot(u - 0.35, v - 0.2);
        if (r1 < 0.8 && r2 > 0.62) return hex('#384878');
      }
      return hex('#f0e6c8');
    }, { tag: 'prop', spec: 0.1 });
    return place(union(
      place(cylinder(0.22, -0.7, 0.7, paper, 0.02), { ry: PI / 2 }),
      place(torus(0.225, 0.025, m('#c05048')), { at: [0.45, 0, 0], ry: PI / 2 }),
    ), { at: [0, 0, 0.3], rz: 0.4 });
  },
};

/** Render an item model, scaled to fit about 36 px, centered in a 40×40 icon. */
export function iconJob(name, build) {
  return {
    name,
    render() {
      // Fit in two passes: render at a trial scale, measure, then render to fill ~36 px.
      const base = build();
      const [x0, y0, x1, y1] = screenBounds(base.b);
      let s = 34 / Math.max(x1 - x0, y1 - y0);
      const trial = trim(toImage(render(place(base, { s }), { ss: 1 }), {}));
      s *= 36 / Math.max(trial.w, trial.h);
      const fr = render(place(build(), { s }), { ss: 4 });
      // Dark items get a light rim so they read on the satchel's dark slots (as in the SNES icons).
      const dark = name === 'item_pepper_mill' || name === 'item_clothes_prop';
      const img = trim(toImage(fr, { ...POST.prop, ink: dark ? [176, 168, 192] : [24, 16, 32], inkAmount: dark ? 0.6 : 0.75 }));
      // Center on a 40×40 transparent cell; a light rim so dark items read on the dark bag panel.
      const out = blank(40, 40);
      blit(out, { ...img, ax: 0, ay: 0 }, Math.round((40 - img.w) / 2), Math.round((40 - img.h) / 2));
      out.ax = 20; out.ay = 20;
      return [{ name, img: out }];
    },
  };
}

void boxAt; void ellipsoid; void roundCone; void custom; void intersect; void subtract;
