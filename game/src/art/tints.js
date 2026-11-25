// Time-of-day tints. The engine's lighting presets ('dusk', 'night', 'day')
// are built from these: a map sets `lighting: 'dusk'` and scripts change it
// with g.setLighting('night', seconds). Characters get half strength. Each
// entry may also be a list of passes.
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

// Colors that give off their own light. Wherever a tile uses one of these,
// those pixels skip the dusk and night tints, so lit window glass, lamp
// flames, and relic glows stay bright while everything around them dims.
// (Added by the engine task at the art director's suggestion; edit freely.)
export const EMISSIVE = ['lamp_glow', 'lamp_warm', 'relic_amber', 'relic_cyan'];
