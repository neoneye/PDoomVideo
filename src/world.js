// world.js: the honeycomb of TriangleDraw canvases.
// Flat-topped hexes of circumradius R tile the lattice exactly; neighbours sit √3·R away at 30° + n·60°.
// Each station is built upright in its own frame, rotated so its "up" points away from the centre.
// Because those rotations are multiples of 60° about lattice vertices, every station stays on the grid.

const R_HEX = 30;

// Direction (math degrees, y up) and ring distance (in units of √3R) → world centre.
function tileAt(deg, dist) {
  const a = deg * Math.PI / 180, d = dist * SQ3 * R_HEX;
  const x = Math.round(Math.cos(a) * d * 2) / 2, y = -Math.sin(a) * d;   // snap x to the half-unit lattice
  const up = dist ? [Math.cos(a), -Math.sin(a)] : [0, -1];
  return { x, y, rot: Math.atan2(up[0], -up[1]) };                        // rot maps local (0,-1) onto `up`
}
// Edge tiles of ring 2 sit 3R away at 0° + n·60°.
function edgeTileAt(deg) {
  const a = deg * Math.PI / 180, d = 3 * R_HEX;
  return { x: Math.round(Math.cos(a) * d * 2) / 2, y: -Math.sin(a) * d, rot: Math.atan2(Math.cos(a), Math.sin(a)) };
}

// Station tile for each verse (index 0..9).
const STATION_TILES = [
  tileAt(90, 1), tileAt(30, 1), tileAt(-30, 1), tileAt(-90, 1), tileAt(-150, 1), tileAt(150, 1),
  tileAt(-150, 2), tileAt(150, 2), tileAt(90, 2), tileAt(0, 0),
];
// The AI's own tiles: empty canvases that fill with orange mandalas as it grows. [tile, verse it wakes in]
const AI_TILES = [
  [tileAt(30, 2), 2], [tileAt(-30, 2), 4], [tileAt(-90, 2), 5],
  [edgeTileAt(0), 3], [edgeTileAt(60), 6], [edgeTileAt(120), 7], [edgeTileAt(180), 7], [edgeTileAt(240), 8], [edgeTileAt(300), 8],
].map(([tile, v], n) => ({ ...tile, wake: v, seed: 20 + n }));
const ALL_TILES = [...STATION_TILES, ...AI_TILES];

const tilePen = (L, tile) => new Pen(L, tile.x, tile.y, tile.rot);
const inHexWorld = (tile, wx, wy, r = R_HEX) => Shape.hex(0, 0, r).has(wx - tile.x, wy - tile.y);
const inWorld = (wx, wy) => ALL_TILES.some(tl => inHexWorld(tl, wx, wy));
