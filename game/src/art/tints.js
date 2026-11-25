// Time-of-day tints, applied over the whole world by the engine's effects.tint():
//   g.tint(TINTS.dusk.color, TINTS.dusk.amount, seconds, TINTS.dusk.mode)
// The tile art is painted in neutral late-morning light; these washes turn it to
// dusk or moonlit night. See docs/art-direction.md ("Time of day").
export const TINTS = {
  // Low sun: everything goes warm and a little darker; whitewash turns gold.
  dusk: { color: '#f0a070', amount: 0.42, mode: 'multiply' },
  // Moonlight: cool, dark blue, with enough value left to read every shape.
  night: { color: '#3850a0', amount: 0.7, mode: 'multiply' },
  // Day: the art as painted.
  day: { color: '#ffffff', amount: 0, mode: 'multiply' },
};
