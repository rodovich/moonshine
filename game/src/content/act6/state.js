// Act 6's links to the rest of the game. src/content/act6/index.js fills
// `maps` with every map in the game, so scripts can skip a montage cut whose
// map isn't built yet. The ids and positions on other acts' maps are agreed
// with their builders (see README.md).

export const act6 = {
  maps: {},
  ids: {
    windlass: 'windlass_room',  // Act 5
    belfry: 'belfry',           // Act 4
    bilgeDry: 'bilge_dry',      // Act 4 (the dry Bilge; Act 5 uses it too)
    bilge: 'bilge',             // Act 2 part 2 (the wet Bilge)
    harbor: 'harbor',           // Act 2 part 2
    harborRisen: 'harbor',      // Act 5 (the risen Harbor)
    lampRoom: 'lamp_room',      // Act 2 part 2
  },
  pos: {
    belfry: [5, 5],
    lampRoom: [5, 4],
  },
};

// Seconds from the start of the `hauling` cue at which each link of chain
// arrives (HAULING_LINKS in src/audio/music/hauling.js; the cue carries the
// booms, the script shakes the screen on them).
export const HAULING_LINKS = [4.5, 6, 7.5, 9, 10.5, 11.625, 12.75, 13.875, 15, 15.75, 16.5, 17.25, 18, 18.563, 19.125, 19.594, 20.063, 20.531, 21, 21.75, 22.5, 24];

// Run a script from a plain callback (an ambient timer), queued like any other.
// The engine has no script-API call for this yet (asked of the engine task).
export function queueScript(fn) {
  const game = typeof window !== 'undefined' && window.moonshine;
  if (game && game.world) game.world.run(fn);
}
