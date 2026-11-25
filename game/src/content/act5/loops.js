// Ambient loops that Act 5's scripts start and stop. A map's `ambience` is a
// fixed list, but Act 5 adds loops to other acts' maps by story state (the
// wind on every surface map, the surf at the Harbor), so its maps call
// `act5Loops(g, [...])` on entry: it starts the wanted loops and stops the
// rest of this list.

const LOOPS = ['wind', 'hull_far', 'laundry', 'surf', 'lamp_hum', 'chain_creak', 'hawse_wind', 'drum_strain', 'tube_wind', 'timer_tick'];

export function act5Loops(g, want = []) {
  for (const id of LOOPS) if (!want.includes(id)) g.stopLoop(id, 600);
  for (const id of want) g.startLoop(id);
}
