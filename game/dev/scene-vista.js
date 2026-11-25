// The moonrise vista (docs/design/01-opening.md, sequence steps 5–7), looped:
// the glow brightens to the right of the Gate, then the moon rises there instead of in it.
// ?still shows the moment the moon is half up; ?still=<ms> shows that moment of the loop.
import { VISTA_BASINS } from '../src/art/vista.js';

const params = new URLSearchParams(location.search);
const still = params.has('still') ? Number(params.get('still')) || 10000 : null;
const MOON_X = 176;          // the moon rises here; the Gate is centred on x=128
const MOON_START = 104;      // moon centre y when hidden behind the Rim
const MOON_END = 56;         // moon centre y when well clear
const LOOP = 22000;
// The moon's height s seconds after it starts, as content/opening/moonrise.js has it: slowly to
// half up (about six seconds), then clear of the ridge.
const moonY = (s) => Math.max(MOON_END, Math.round(s < 6 ? MOON_START - s * 3 : 86 - (s - 6) * 6));
// Peach-gold as it clears the Rim, whitening as it climbs.
const moonAnim = (cy) => (cy > 80 ? 'moon' : cy > 64 ? 'moon_mid' : 'moon_high');

export const SCENE = {
  title: 'Moonrise vista',
  width: 256,
  height: 224,
  scale: 3,
  draw(ctx, now, { SHEETS, frameCanvas, animFrame }) {
    const t = still != null ? still : now % LOOP;
    const img = (sheet, frame) => frameCanvas(sheet, SHEETS[sheet], frame);
    if (!SHEETS.vista) return;
    ctx.drawImage(img('vista', 'bowl_dusk'), 0, 0);
    // As the moon clears the ridge, the Gate's apricot light drains cold (half at 7 s, full at 8 s).
    if (SHEETS.vista_gate_cold && t > 7000) ctx.drawImage(img('vista_gate_cold', t > 8000 ? 'cold_1' : 'cold_0'), 0, 0);
    // 0–4 s: the glow gathers behind the Rim, right of the Gate.
    const glowStep = t < 1000 ? -1 : t < 2200 ? 0 : t < 3400 ? 1 : 2;
    if (glowStep >= 0) ctx.drawImage(img('vista_glow', `glow_${glowStep}`), MOON_X - 60, 90 - 48);
    // From 4 s: the moon rises.
    if (t > 4000) {
      const cy = moonY((t - 4000) / 1000);
      ctx.drawImage(img('vista_moon', animFrame(SHEETS.vista_moon, moonAnim(cy), now)), MOON_X - 16, cy - 16);
    }
    ctx.drawImage(img('vista_rim', 'rim'), 0, 0);
    // Its path on the Bowl: a faint hint once it's half up, then the full shimmer.
    if (SHEETS.vista_path && t > 8000) {
      const f = t < 10000 ? 'path_faint' : animFrame(SHEETS.vista_path, 'path', now);
      ctx.drawImage(img('vista_path', f), 0, 0);
    }
    // Basins twinkle, each on its own phase.
    VISTA_BASINS.forEach(([x, y], i) => {
      const f = animFrame(SHEETS.vista_twinkle, 'twinkle', now + i * 437);
      ctx.drawImage(img('vista_twinkle', f), x - 3, y - 3);
    });
    ctx.drawImage(img('vista_cheryl', 'cheryl_tub'), 0, 128);
  },
};
