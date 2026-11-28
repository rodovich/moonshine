// Time-of-day washes for the isometric view, in the same format as the SNES
// tints (game/src/art/tints.js): a color, an amount (the pass's opacity), and a
// canvas composite mode; an entry may be a list of passes. The iso art is
// rendered in neutral late-afternoon light from the west (the screen's left),
// which is where the sun sets on Moonshine Night, so dusk only has to warm and
// dim it. Characters should get about half strength, as in the SNES view.
// See docs/iso-art-direction.md ("Time of day").
export const ISO_TINTS = {
  // Last light from the west: warm rose-amber, then a violet that cools the shadows.
  dusk: [{ color: '#f08a5c', amount: 0.5, mode: 'multiply' }, { color: '#6858a0', amount: 0.26, mode: 'multiply' }],
  // Moonlight: drain most of the color, then a cool blue, keeping every shape readable.
  night: [{ color: '#808080', amount: 0.55, mode: 'saturation' }, { color: '#4058a8', amount: 0.66, mode: 'multiply' }],
  // Dawn: pale pink, with a faint gold lift.
  dawn: [{ color: '#e890a8', amount: 0.4, mode: 'multiply' }, { color: '#f8c870', amount: 0.14, mode: 'screen' }],
  // Day: a light warm grey, so whitewash in full sun isn't blown out.
  day: { color: '#e8e0d8', amount: 0.22, mode: 'multiply' },
};

/** Apply a tint to a canvas region (the dev page's version of the engine's tint pass). */
export function applyTint(ctx, w, h, tint, strength = 1) {
  if (!tint) return;
  for (const p of Array.isArray(tint) ? tint : [tint]) {
    ctx.save();
    ctx.globalCompositeOperation = p.mode;
    ctx.globalAlpha = p.amount * strength;
    ctx.fillStyle = p.color;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}
