// Moonshine master palette.
//
// Every color the game draws comes from this list. Channels are multiples of 8,
// so each color fits in 15-bit RGB (5 bits per channel), as on the SNES.
// Sheets pick up to 15 of these by name. See docs/art-direction.md for how the
// ramps are meant to be used, and which colors are reserved.
//
// Ramps run light → base → shade → deep. Shadows lean toward violet/blue and
// highlights toward yellow, so the surface reads as warm, sunlit stone.

// The engine task added the `ui_*` colors (text boxes, font, menus) and the
// `ph_*` colors (placeholder interior tiles for the engine's test shop). Keep those names
// working or update src/art/ui.js, src/art/font.js, and src/content/test/art.js.

export const COLORS = {
  // Outline and deepest shadow for characters, props, and icons (never pure black).
  ink: '#201828',

  // Surface: warm limestone (paving, steps, quays, coping).
  stone_light: '#f8e8c8',
  stone: '#e0c8a0',
  stone_mid: '#c0a080',
  stone_dark: '#907868',
  stone_deep: '#605060',
  stone_warm: '#d0b088',

  // Surface: plaster. Whitewash is the default; the others are for variety.
  white_light: '#f8f8f0',
  white: '#e8e8e0',
  white_shade: '#c0c0d0',
  white_deep: '#8888a8',

  ochre_light: '#f8e0a0',
  ochre: '#e8b868',
  ochre_shade: '#c08850',
  ochre_deep: '#886048',

  rose_light: '#f8d0c0',
  rose: '#e8a090',
  rose_shade: '#c07078',
  rose_deep: '#884858',

  sky_light: '#e0f0f0',
  sky: '#b0d8e0',
  sky_shade: '#80a8c0',
  sky_deep: '#587898',

  // Surface accents: doors, shutters, domes.
  cobalt_light: '#78b0f0',
  cobalt: '#3870c8',
  cobalt_shade: '#285098',
  cobalt_deep: '#183060',

  sage_light: '#b8d8a8',
  sage: '#78a870',
  sage_shade: '#507850',
  sage_deep: '#305038',

  terra_light: '#f0a070',
  terra: '#d06840',
  terra_shade: '#a04838',
  terra_deep: '#683030',

  wood_light: '#d8a068',
  wood: '#a87040',
  wood_shade: '#784830',
  wood_deep: '#503028',

  iron_light: '#8890a8',
  iron: '#505868',
  iron_deep: '#282838',

  glass_dark: '#303858',
  glass_light: '#98b8d8',

  brass_light: '#f8e088',
  brass: '#d8a840',
  brass_shade: '#a07028',

  // Growing things.
  leaf_light: '#b0d878',
  leaf: '#70a848',
  leaf_shade: '#487838',
  leaf_deep: '#285038',

  bloom_red: '#e83848',
  bloom_pink: '#f890b8',
  bloom_yellow: '#f8e050',

  // Lamplight.
  lamp_glow: '#f8f0b0',
  lamp_warm: '#f8c058',

  // Water.
  water_foam: '#e8f8f8',
  water_light: '#90d8d8',
  water: '#48a8b8',
  water_mid: '#308098',
  water_deep: '#205070',

  // Skin. Three ramps, for variety among residents.
  skin_light: '#f8d8b8',
  skin: '#e8b090',
  skin_shade: '#c08068',
  skin2_light: '#e0a878',
  skin2: '#c08050',
  skin2_shade: '#905840',
  skin3_light: '#a87050',
  skin3: '#805038',
  skin3_shade: '#583028',

  // Hair.
  silver_light: '#f0f0f8',
  silver: '#c8c8d8',
  silver_shade: '#9090a8',
  hair_brown: '#704830',
  hair_brown_shade: '#483028',
  hair_black: '#403848',
  hair_black_shade: '#282030',
  hair_ginger: '#d87838',
  hair_ginger_shade: '#a04828',

  // Cloth.
  cream: '#f0e8d0',
  cream_shade: '#c8b8a0',
  coral_light: '#f08868',
  coral: '#d05848',
  coral_shade: '#983848',
  navy: '#485888',
  navy_shade: '#303860',
  mustard: '#e0b040',
  mustard_shade: '#a87828',
  moss: '#788848',
  moss_shade: '#505830',
  plum: '#885878',
  plum_shade: '#583850',
  teal: '#389088',
  teal_shade: '#286060',

  // Underground: cool slate and verdigris, lit by old machines.
  slate_light: '#98a8b0',
  slate: '#687880',
  slate_shade: '#485860',
  slate_deep: '#303840',
  void: '#101820',
  verdigris_light: '#88d0b0',
  verdigris: '#489080',
  relic_amber: '#f8b048',
  relic_cyan: '#68f0e0',

  // The Wrongness. RESERVED: use these only for the Wrongness and its symptoms.
  wrong_glow: '#f070f8',
  wrong: '#b830c8',
  wrong_deep: '#581878',
  wrong_void: '#100010',
  wrong_bile: '#c8f040',

  // UI (engine)
  ui_ink: '#201828',
  ui_box: '#182048',
  ui_box_deep: '#101830',
  ui_frame: '#c8c0a8',
  ui_frame_shade: '#686078',
  ui_text: '#f8f0e0',
  ui_text_shadow: '#101020',
  ui_cheryl_box: '#302018',
  ui_cheryl_deep: '#201810',
  ui_cheryl_frame: '#d8a868',
  ui_cheryl_text: '#f8e0a8',
  ui_label: '#f8c860',
  ui_dim: '#8888a0',
  ui_select: '#f8d870',
  ui_marker: '#f0e8d8',
  ui_marker_shade: '#88a0c0',
  ui_bag: '#a86838',
  ui_bag_light: '#d89858',
  ui_bag_dark: '#704020',
  ui_clasp: '#f0c848',

  // Placeholder art for the engine test map (engine)
  ph_stone_dark: '#706870',
  ph_plaster: '#f0e8d8',
  ph_plaster_shade: '#c8b8a8',
  ph_wood: '#906038',
  ph_wood_dark: '#604020',
  ph_wood_light: '#c08850',
  ph_floor: '#b08858',
  ph_floor_dark: '#886840',
  ph_red: '#c83838',
  ph_red_dark: '#882028',
  ph_gold: '#f0c040',
  ph_black: '#181018',
};
