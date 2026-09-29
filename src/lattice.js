// lattice.js: the isometric triangle lattice. Scenes never draw pixels; they switch triangle cells on.
//
// World space: lattice vertex (i, j) sits at (i + j/2, j*H), y points down, 1 unit = one triangle edge.
// Every rhombus (i, j) holds two triangles: k=0 "up" (i,j)(i+1,j)(i,j+1) and k=1 "down" (i+1,j)(i+1,j+1)(i,j+1).
// A Pen paints shapes given in its own local frame; a frame rotated by a multiple of 60° about a lattice
// vertex maps the lattice onto itself, which is how stations are built "upright" and placed at any angle.

const OFF = 1024, SPAN = 2048;
const cellKey = (i, j, k) => ((j + OFF) * SPAN + (i + OFF)) * 2 + k;
const vertKey = (i, j) => (j + OFF) * SPAN + (i + OFF);
const vx = (i, j) => i + j / 2, vy = j => j * H;
// Local lattice-vertex helper for authoring: V(i, j) -> [x, y].
const V = (i, j) => [i + j / 2, j * H];

class Layer {
  constructor() { this.cells = new Map(); this.pts = new Map(); this.cols = []; this.colIdx = {}; }
  ci(col) { let n = this.colIdx[col]; if (n === undefined) { n = this.colIdx[col] = this.cols.length; this.cols.push(col); } return n; }
  put(map, key, col, a) { if (a > 0.004) map.set(key, this.ci(col) * 1024 + Math.round(clamp(a) * 1023)); }
  // Recolour painted cells whose world centroid passes test(wx, wy) (optionally only cells of colour `from`).
  recolor(test, to, from = null) {
    const f = from === null ? -1 : this.ci(from), tn = this.ci(to);
    for (const [key, code] of this.cells) {
      const c = Math.floor(code / 1024); if (f >= 0 && c !== f) continue;
      const [wx, wy] = cellCenter(key);
      if (test(wx, wy)) this.cells.set(key, tn * 1024 + code % 1024);
    }
  }
  // Remove cells passing test (e.g. to cut a hole, or clip everything outside the world).
  clear(test) { for (const key of [...this.cells.keys()]) { const [wx, wy] = cellCenter(key); if (test(wx, wy)) this.cells.delete(key); } }
}

function cellCenter(key) {
  const k = key & 1, r = key >> 1, i = (r % SPAN) - OFF, j = Math.floor(r / SPAN) - OFF;
  return k ? [i + j / 2 + 1, j * H + 2 * H / 3] : [i + j / 2 + .5, j * H + H / 3];
}
function cellVerts(key) {
  const k = key & 1, r = key >> 1, i = (r % SPAN) - OFF, j = Math.floor(r / SPAN) - OFF;
  return k ? [[vx(i + 1, j), vy(j)], [vx(i + 1, j + 1), vy(j + 1)], [vx(i, j + 1), vy(j + 1)]]
           : [[vx(i, j), vy(j)], [vx(i + 1, j), vy(j)], [vx(i, j + 1), vy(j + 1)]];
}

// ---- shapes (local coordinates): { bb: [x0, y0, x1, y1], has(x, y) } --------------------------
const Shape = {
  poly(pts) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    return { bb: [x0, y0, x1, y1], has(x, y) {
      let inside = false;
      for (let a = 0, b = pts.length - 1; a < pts.length; b = a++) {
        const [xa, ya] = pts[a], [xb, yb] = pts[b];
        if ((ya > y) !== (yb > y) && x < (xb - xa) * (y - ya) / (yb - ya) + xa) inside = !inside;
      }
      return inside;
    } };
  },
  // Polyline stroke of full width w. w≈0.6 gives TriangleDraw's one-triangle zigzag line; w≈1.2 a solid band.
  stroke(pts, w = .6, closed = false) {
    const P = closed ? [...pts, pts[0]] : pts, r = w / 2, segs = [];
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let n = 0; n + 1 < P.length; n++) {
      const [ax, ay] = P[n], [bx, by] = P[n + 1];
      segs.push([ax, ay, bx, by, Math.min(ax, bx) - r, Math.min(ay, by) - r, Math.max(ax, bx) + r, Math.max(ay, by) + r]);
      x0 = Math.min(x0, ax, bx); y0 = Math.min(y0, ay, by); x1 = Math.max(x1, ax, bx); y1 = Math.max(y1, ay, by);
    }
    if (P.length === 1) { const [ax, ay] = P[0]; segs.push([ax, ay, ax, ay, ax - r, ay - r, ax + r, ay + r]); x0 = x1 = ax; y0 = y1 = ay; }
    const r2 = r * r;
    return { bb: [x0 - r, y0 - r, x1 + r, y1 + r], has(x, y) {
      for (const [ax, ay, bx, by, sx0, sy0, sx1, sy1] of segs) {
        if (x < sx0 || x > sx1 || y < sy0 || y > sy1) continue;
        const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
        const k = L ? clamp(((x - ax) * dx + (y - ay) * dy) / L) : 0;
        const ex = ax + dx * k - x, ey = ay + dy * k - y;
        if (ex * ex + ey * ey <= r2) return true;
      }
      return false;
    } };
  },
  disc(cx, cy, r) { return { bb: [cx - r, cy - r, cx + r, cy + r], has: (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r }; },
  ring(cx, cy, r, w) { const a = r - w; return { bb: [cx - r, cy - r, cx + r, cy + r], has: (x, y) => { const d = (x - cx) ** 2 + (y - cy) ** 2; return d <= r * r && d >= a * a; } }; },
  // Flat-topped hexagon of circumradius r (the TriangleDraw canvas shape). Edges run along lattice lines.
  hex(cx, cy, r) { return { bb: [cx - r, cy - r * H, cx + r, cy + r * H], has: (x, y) => { const dx = Math.abs(x - cx), dy = Math.abs(y - cy); return dy <= r * H && H * dx + dy / 2 <= r * H; } }; },
  hexRing(cx, cy, r, w) { const o = Shape.hex(cx, cy, r), i = Shape.hex(cx, cy, r - w); return { bb: o.bb, has: (x, y) => o.has(x, y) && !i.has(x, y) }; },
  rect(x, y, w, h) { return { bb: [x, y, x + w, y + h], has: (px, py) => px >= x && px <= x + w && py >= y && py <= y + h }; },
  union(...ss) {
    ss = ss.filter(Boolean);
    return { bb: [Math.min(...ss.map(s => s.bb[0])), Math.min(...ss.map(s => s.bb[1])), Math.max(...ss.map(s => s.bb[2])), Math.max(...ss.map(s => s.bb[3]))],
      has: (x, y) => ss.some(s => s.has(x, y)) };
  },
  diff(a, b) { return { bb: a.bb, has: (x, y) => a.has(x, y) && !b.has(x, y) }; },
  // Generic: any predicate in a box.
  fn(bb, has) { return { bb, has }; },
};

// ---- pen --------------------------------------------------------------------------------------
// Frame: local (lx, ly) -> world (x + s*R(r)*(lx, ly)). Options for every fill:
//   a      alpha 0..1                    dis   dissolve: cells with hash < dis are skipped (0 = all on)
//   seed   hash seed for dissolve        pts   paint lattice points (ghosts) instead of triangles
//   erase  remove cells instead          mask  (lx, ly) => alpha multiplier (reveals, wipes, ripples)
class Pen {
  constructor(layer, x = 0, y = 0, r = 0, s = 1) { this.L = layer; this.x = x; this.y = y; this.r = r; this.s = s; this.c = Math.cos(r); this.sn = Math.sin(r); }
  at(dx, dy, dr = 0, ds = 1) { const [x, y] = this.toWorld(dx, dy); return new Pen(this.L, x, y, this.r + dr, this.s * ds); }
  toWorld(lx, ly) { return [this.x + this.s * (lx * this.c - ly * this.sn), this.y + this.s * (lx * this.sn + ly * this.c)]; }
  toLocal(wx, wy) { const dx = (wx - this.x) / this.s, dy = (wy - this.y) / this.s; return [dx * this.c + dy * this.sn, -dx * this.sn + dy * this.c]; }
  worldBB(bb) {
    const cs = [this.toWorld(bb[0], bb[1]), this.toWorld(bb[2], bb[1]), this.toWorld(bb[0], bb[3]), this.toWorld(bb[2], bb[3])];
    return [Math.min(...cs.map(p => p[0])), Math.min(...cs.map(p => p[1])), Math.max(...cs.map(p => p[0])), Math.max(...cs.map(p => p[1]))];
  }
  fill(shape, col = COL.cream, o = {}) {
    const [x0, y0, x1, y1] = this.worldBB(shape.bb), a = o.a ?? 1, dis = o.dis ?? 0, seed = o.seed ?? 0, L = this.L;
    if (a <= 0 || dis >= 1) return this;
    if (o.pts) {
      for (let j = Math.floor(y0 / H) - 1; j <= Math.ceil(y1 / H) + 1; j++)
        for (let i = Math.floor(x0 - j / 2) - 1; i <= Math.ceil(x1 - j / 2) + 1; i++) {
          const [lx, ly] = this.toLocal(vx(i, j), vy(j));
          if (!shape.has(lx, ly)) continue;
          if (dis > 0 && hash(i, j, seed + 7) < dis) continue;
          const m = o.mask ? o.mask(lx, ly) : 1; if (m <= 0) continue;
          L.put(L.pts, vertKey(i, j), col, a * m);
        }
      return this;
    }
    for (let j = Math.floor(y0 / H) - 1; j <= Math.ceil(y1 / H); j++)
      for (let i = Math.floor(x0 - j / 2) - 1; i <= Math.ceil(x1 - j / 2) + 1; i++)
        for (let k = 0; k < 2; k++) {
          const wx = k ? i + j / 2 + 1 : i + j / 2 + .5, wy = j * H + (k ? 2 : 1) * H / 3;
          const [lx, ly] = this.toLocal(wx, wy);
          if (!shape.has(lx, ly)) continue;
          if (dis > 0 && hash(i * 2 + k, j, seed) < dis) continue;
          const m = o.mask ? o.mask(lx, ly) : 1; if (m <= 0) continue;
          const key = cellKey(i, j, k);
          if (o.erase) L.cells.delete(key); else L.put(L.cells, key, col, a * m);
        }
    return this;
  }
  // Shorthands. `col` may be null to erase.
  poly(pts, col, o) { return this.fill(Shape.poly(pts), col, o); }
  line(pts, w, col, o) { return this.fill(Shape.stroke(pts, w), col, o); }
  loop(pts, w, col, o) { return this.fill(Shape.stroke(pts, w, true), col, o); }
  hex(cx, cy, r, col, o) { return this.fill(Shape.hex(cx, cy, r), col, o); }
  hexRing(cx, cy, r, w, col, o) { return this.fill(Shape.hexRing(cx, cy, r, w), col, o); }
  disc(cx, cy, r, col, o) { return this.fill(Shape.disc(cx, cy, r), col, o); }
  ring(cx, cy, r, w, col, o) { return this.fill(Shape.ring(cx, cy, r, w), col, o); }
  rect(x, y, w, h, col, o) { return this.fill(Shape.rect(x, y, w, h), col, o); }
  cut(shape) { return this.fill(shape, null, { erase: true }); }
}

// ---- renderer ---------------------------------------------------------------------------------
// cam = { x, y, z (px per unit), rot (radians) }. The lattice rotates with the world.
// opt.dots: 0..1 global alpha of the background lattice points; opt.dotMask(wx, wy) -> 0..1.
function camMatrix(cam) {
  const c = Math.cos(cam.rot), s = Math.sin(cam.rot), z = cam.z;
  return [z * c, z * s, -z * s, z * c, W / 2 - z * (c * cam.x - s * cam.y), HGT / 2 - z * (s * cam.x + c * cam.y)];
}
function screenToWorld(cam, sx, sy) {
  const c = Math.cos(cam.rot), s = Math.sin(cam.rot), dx = (sx - W / 2) / cam.z, dy = (sy - HGT / 2) / cam.z;
  return [cam.x + dx * c + dy * s, cam.y - dx * s + dy * c];
}
function viewBB(cam, pad = 2) {
  const cs = [[0, 0], [W, 0], [0, HGT], [W, HGT]].map(([x, y]) => screenToWorld(cam, x, y));
  return [Math.min(...cs.map(p => p[0])) - pad, Math.min(...cs.map(p => p[1])) - pad, Math.max(...cs.map(p => p[0])) + pad, Math.max(...cs.map(p => p[1])) + pad];
}

function renderLayer(ctx, layer, cam, opt = {}) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, W, HGT);
  ctx.setTransform(...camMatrix(cam));
  const [bx0, by0, bx1, by1] = viewBB(cam), z = cam.z;

  // 1. background lattice points
  const dots = (opt.dots ?? 0) * clamp(.45 + (z - 3) / 10);
  if (dots > 0.01) {
    const rad = clamp(z * .06, .7, 2.6) / z, buckets = Array.from({ length: 17 }, () => []);
    for (let j = Math.floor(by0 / H); j <= Math.ceil(by1 / H); j++)
      for (let i = Math.floor(bx0 - j / 2); i <= Math.ceil(bx1 - j / 2); i++) {
        const x = vx(i, j), y = vy(j), m = opt.dotMask ? opt.dotMask(x, y, i, j) : 1;
        if (m > 0.02) buckets[Math.round(clamp(m) * 16)].push(x, y);
      }
    ctx.fillStyle = COL.dot;
    buckets.forEach((b, n) => {
      if (!n || !b.length) return;
      ctx.globalAlpha = dots * n / 16; ctx.beginPath();
      for (let q = 0; q < b.length; q += 2) ctx.rect(b[q] - rad, b[q + 1] - rad, rad * 2, rad * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  // 2. triangles, batched by colour and alpha
  const groups = new Map();
  for (const [key, code] of layer.cells) {
    const [cx, cy] = cellCenter(key);
    if (cx < bx0 || cx > bx1 || cy < by0 || cy > by1) continue;
    let g = groups.get(code); if (!g) groups.set(code, g = []); g.push(key);
  }
  const seam = 0.9 / z;
  for (const [code, keys] of groups) {
    const col = layer.cols[Math.floor(code / 1024)], a = (code % 1024) / 1023;
    ctx.beginPath();
    for (const key of keys) { const [p, q, r] = cellVerts(key); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.lineTo(r[0], r[1]); ctx.closePath(); }
    ctx.globalAlpha = a; ctx.fillStyle = col; ctx.fill();
    if (a > .98) { ctx.strokeStyle = col; ctx.lineWidth = seam; ctx.lineJoin = 'miter'; ctx.stroke(); }
  }
  ctx.globalAlpha = 1;

  // 3. ghost points (bright lattice points left behind where something used to be)
  if (layer.pts.size) {
    const rad = clamp(z * .11, 1.2, 4.5) / z, pg = new Map();
    for (const [key, code] of layer.pts) { let g = pg.get(code); if (!g) pg.set(code, g = []); g.push(key); }
    for (const [code, keys] of pg) {
      ctx.globalAlpha = (code % 1024) / 1023; ctx.fillStyle = layer.cols[Math.floor(code / 1024)]; ctx.beginPath();
      for (const key of keys) {
        const i = (key % SPAN) - OFF, j = Math.floor(key / SPAN) - OFF, x = vx(i, j), y = vy(j);
        if (x < bx0 || x > bx1 || y < by0 || y > by1) continue;
        ctx.rect(x - rad, y - rad, rad * 2, rad * 2);
      }
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}
