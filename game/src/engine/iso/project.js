// The isometric projection: 2:1 dimetric, one map tile = a 64×32 floor
// diamond. Grid x runs down-right on screen, grid y down-left, so the
// game's "up" (y - 1) is up-right on screen and "right" (x + 1) down-right.
// Heights (z) are screen pixels up.

export const ISO_W = 640;
export const ISO_H = 480;
export const TW = 64; // floor diamond width
export const TH = 32; // floor diamond height
export const HW = TW / 2;
export const HH = TH / 2;

// Screen position (map space, before the camera) of grid point (gx, gy) at
// height z. `ox` shifts x so the map's left corner is at 0.
export function proj(gx, gy, z, ox) {
  return { x: (gx - gy) * HW + ox, y: (gx + gy) * HH - z };
}

// Inverse at a known height: map-space screen point -> grid point.
export function unproj(sx, sy, z, ox) {
  const a = (sx - ox) / HW; // gx - gy
  const b = (sy + z) / HH; // gx + gy
  return { gx: (a + b) / 2, gy: (b - a) / 2 };
}

// Is (px, py) inside the floor diamond of cell (x, y) at height z?
export function inDiamond(px, py, x, y, z, ox) {
  const c = proj(x + 0.5, y + 0.5, z, ox);
  return Math.abs(px - c.x) / HW + Math.abs(py - c.y) / HH <= 1;
}
