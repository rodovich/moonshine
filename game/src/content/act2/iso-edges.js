// What lies past Act 2's maps' open edges in the isometric view, so the screen
// beyond the last column or row isn't black (the art task's approach in
// Cistern Court, court-iso.js), and the sides of stairs cut down through a
// street's edge.

/**
 * The town beyond an open east or west edge: on the east edge, retaining
 * faces from the street down to the roofs below (a west edge's faces point
 * away from the camera); then bands of lower houses' roofs, each 80 px lower
 * and two tiles further out, from the kit's lowRoofs (varied by position).
 *   townBeyond(S, { side: 'east' | 'west', x, y0, y1, z, bands = 3, faces = true })
 *   x: the map's edge column; y0..y1: the rows the edge looks out over; z: the street's
 *   height there; faces: false where the edge column already has its own faces (houses).
 */
export function townBeyond(S, { side, x, y0, y1, z = 0, bands = 3, faces = true }) {
  if (side === 'east' && faces) {
    for (let y = y0; y <= y1; y++) S.column(x, y, z - 120, [], [['retain_e', 40], ['retain_e', 40], ['retain_e', 40]], null);
  }
  for (let b = 0; b < bands; b++) {
    const bx = side === 'east' ? x + 1 + b * 2 : x - 2 - b * 2;
    for (let y = y0 - (y0 % 2); y <= y1; y += 2) S.lowRoofs(bx, y, 2, { z: z - 80 * (b + 1) });
  }
}

/**
 * The town below a south edge, past the kit's first band of lower roofs at row y
 * (z its eaves): more bands, each two rows further out and 80 px lower.
 *   townBelow(S, { y, x0 = 0, w, z = -80, bands = 2 })
 */
export function townBelow(S, { y, x0 = 0, w, z = -80, bands = 2 }) {
  for (let b = 1; b <= bands; b++) S.lowRoofs(x0, y + 2 * b, w, { z: z - 80 * b });
}

/**
 * The sides of a stair cut down through a street's edge: under each stair tile, wall
 * courses from `floor` up to the tile's base; an east face where the tile east of it
 * isn't stair; a south face on the stair's last row. And on the column just west of the
 * stair, the east face the stair leaves open (the black notch at a stair's head).
 *   stairWell(S, { xs: [x, ...], rows: [[y, zHigh], ...], floor = -120, westColumn = true })
 */
export function stairWell(S, { xs, rows, floor = -120, westColumn = true }) {
  const last = rows[rows.length - 1][0];
  const east = Math.max(...xs);
  for (const [y, zHigh] of rows) {
    const base = zHigh - 40;
    const n = Math.max(0, Math.round((base - floor) / 40));
    if (!n) continue;
    const courses = (f) => Array.from({ length: n }, () => [f, 40]);
    for (const x of xs) S.column(x, y, floor, y === last ? courses('retain_s') : [], x === east ? courses('retain_e') : [], null);
  }
  if (westColumn) {
    const wx = Math.min(...xs) - 1;
    for (const [y, zHigh] of rows) {
      const n = Math.max(0, Math.round((zHigh - floor) / 40));
      S.column(wx, y, floor, [], Array.from({ length: n }, () => ['retain_e', 40]), null);
    }
  }
}
