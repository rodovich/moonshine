// The town beyond a map's open east or west edge, in the isometric view, so
// the screen past the last column isn't black (the art task's approach in
// Cistern Court, court-iso.js): on the east edge, retaining faces from the
// street down to the roofs below; then bands of low houses' roofs (cistern
// lowhouse_*_2x2), each band 80 px lower and two tiles further out. A west
// edge's faces point away from the camera, so it gets the roofs only.

const KINDS = ['lowhouse_flat_2x2', 'lowhouse_terra_2x2', 'lowhouse_terra_2x2', 'lowhouse_flat_2x2'];

/**
 * townBeyond(S, { side, x, y0, y1, z, bands })
 *   side: 'east' or 'west'; x: the map's edge column (W - 1 for east, 0 for west);
 *   y0..y1: the rows the edge looks out over; z: the street's height there;
 *   bands: how many bands of roofs (default 3); faces: false where the edge column already
 *   has its own faces (houses).
 */
export function townBeyond(S, { side, x, y0, y1, z = 0, bands = 3, faces = true }) {
  if (side === 'east' && faces) {
    for (let y = y0; y <= y1; y++) S.column(x, y, z - 120, [], [['retain_e', 40], ['retain_e', 40], ['retain_e', 40]], null);
  }
  for (let b = 0; b < bands; b++) {
    const bx = side === 'east' ? x + 1 + b * 2 : x - 2 - b * 2;
    const bz = z - 80 * (b + 1) - 60;
    for (let y = y0 - (y0 % 2); y <= y1; y += 2) S.add('cistern', KINDS[(Math.abs(bx) + y + b) % KINDS.length], bx, y, bz, 2, 2, 1);
  }
}
