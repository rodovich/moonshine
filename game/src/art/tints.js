// Time-of-day tints. The engine's lighting presets ('dusk', 'night', 'day')
// are built from these: a map sets `lighting: 'dusk'` and scripts change it
// with g.setLighting('night', seconds). Characters get half strength. Each
// entry may also be a list of passes.
// The tile art is painted in neutral late-morning light; these washes turn it to
// dusk or moonlit night. See docs/art-direction.md ("Time of day").
export const TINTS = {
  // Last light: a deep rose-amber wash and a violet one. Whitewash goes rose and dim and
  // shadows cool, so the opening reads as sunset with the moon on its way, not midday.
  dusk: [{ color: '#e07048', amount: 0.62, mode: 'multiply' }, { color: '#584888', amount: 0.3, mode: 'multiply' }],
  // Moonlight: cool, dark blue, with enough value left to read every shape.
  night: { color: '#3850a0', amount: 0.7, mode: 'multiply' },
  // Dawn (Act 6, Cistern Court after the climb out of the well): a pink wash, then a faint gold
  // lift (screen), so whitewash reads pale pink with the first sun on it. Values from the Act 6 build.
  dawn: [{ color: '#e890a8', amount: 0.45, mode: 'multiply' }, { color: '#f8c870', amount: 0.16, mode: 'screen' }],
  // Day: a light, slightly warm grey, so whitewash in full sun isn't blown out.
  day: { color: '#e0d8d0', amount: 0.35, mode: 'multiply' },
};

// Colors that give off their own light. Wherever a tile uses one of these,
// those pixels skip the dusk and night tints, so lit window glass, lamp
// flames, and relic glows stay bright while everything around them dims.
// (Added by the engine task at the art director's suggestion; edit freely.)
export const EMISSIVE = ['lamp_glow', 'lamp_warm', 'relic_amber', 'relic_cyan', 'moonglass_light'];
