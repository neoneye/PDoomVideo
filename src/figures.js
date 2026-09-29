// figures.js: the cast, built from triangles. Local coordinates, 1 unit = one triangle edge, y down.

// ---- the human worker ---------------------------------------------------------------------------
// (x, y) is the point between the feet. About 12.5 units tall.
// o: s (scale), col, a, dis, seed, pts (ghost), flip (-1 mirrors),
//    lean (radians, upper body rotates about the hips: positive leans to screen-right),
//    head (radians, extra head tilt), face ('dot' | 'sad' | 'shock' | 'none'),
//    armL / armR: [shoulder, elbow] radians (0 = hanging down, + = swings outward/up),
//    legL / legR: [hip, knee] radians (0 = straight down), walk: phase (overrides legs, swings arms),
//    shake: amplitude, t (for shake), hat(pen): drawn in head space (head centre at 0,0, radius 1.7),
//    handL(pen) / handR(pen): drawn at the hand, pen x axis points along the forearm.
function worker(p, x, y, o = {}) {
  const s = o.s ?? 1, col = o.col ?? COL.cream, fo = { a: o.a, dis: o.dis, seed: o.seed, pts: o.pts, mask: o.mask };
  let dx = 0, dy = 0;
  if (o.shake) { const q = Math.floor((o.t ?? 0) * 24); dx = (hash(q, 1) - .5) * o.shake; dy = (hash(q, 2) - .5) * o.shake * .5; }
  const q = p.at(x + dx, y + dy, 0, s);
  const fl = o.flip ?? 1;
  let legL = o.legL ?? [0, 0], legR = o.legR ?? [0, 0], armL = o.armL ?? [.15, 0], armR = o.armR ?? [.15, 0];
  if (o.walk !== undefined) {
    const w = Math.sin(o.walk * TAU);
    legL = [w * .45, Math.max(0, -w) * .5]; legR = [-w * .45, Math.max(0, w) * .5];
    if (!o.armL) armL = [-w * .5 + .1, .3]; if (!o.armR) armR = [w * .5 + .1, .3];
  }
  const bob = o.walk !== undefined ? Math.abs(Math.sin(o.walk * TAU)) * .25 : 0;
  // legs (hips at y = -4.6)
  for (const [side, [a1, a2]] of [[-1, legL], [1, legR]]) {
    const hx = side * .75, hy = -4.6 - bob;
    const kx = hx + Math.sin(a1) * 2.4 * fl, ky = hy + Math.cos(a1) * 2.4;
    const fx = kx + Math.sin(a1 - a2) * 2.3 * fl, fy = ky + Math.cos(a1 - a2) * 2.3;
    q.line([[hx, hy], [kx, ky], [fx, fy]], 1.15, col, fo);
    q.line([[fx, fy], [fx + side * .5, fy]], 1.0, col, fo);
  }
  // upper body pivots about the hips
  const u = q.at(0, -4.6 - bob, (o.lean ?? 0) * fl);
  u.poly([[-1.3, .2], [1.3, .2], [2.1, -4.1], [-2.1, -4.1]], col, fo);
  for (const [side, [a1, a2], hand] of [[-1, armL, o.handL], [1, armR, o.handR]]) {
    const sx = side * 2.1, sy = -3.8, sd = side * fl;
    const ex = sx + Math.sin(a1) * 2.5 * sd, ey = sy + Math.cos(a1) * 2.5;
    const hx = ex + Math.sin(a1 + a2) * 2.3 * sd, hy = ey + Math.cos(a1 + a2) * 2.3;
    u.line([[sx, sy], [ex, ey], [hx, hy]], 1.0, col, fo);
    if (hand) hand(u.at(hx, hy, Math.atan2(hy - ey, hx - ex)));
  }
  const hd = u.at(0, -6.1, (o.head ?? 0) * fl);
  hd.hex(0, 0, 1.75, col, fo);
  const face = o.face ?? 'dot';
  if (face !== 'none' && !o.pts) {
    const ink = COL.bg, eo = { a: o.a, dis: o.dis, seed: o.seed };
    if (face === 'sad') { hd.line([[-.9, -.55], [-.3, -.3]], .5, ink, eo); hd.line([[.9, -.55], [.3, -.3]], .5, ink, eo); }
    hd.disc(-.55, -.1, .34, ink, eo); hd.disc(.55, -.1, .34, ink, eo);
    if (face === 'shock') hd.disc(0, .85, .38, ink, eo);
    if (face === 'sad') hd.line([[-.5, 1.05], [0, .75], [.5, 1.05]], .45, ink, eo);
  }
  if (o.hat) o.hat(hd);
  return q;
}

// Standard worker lifecycle for a station verse. Returns nothing; paints the worker at (x, y).
// o.work(lt) -> pose while working; o.exit: 'bow' | 'flee' | 'dread' | 'turn'; o.fleeDir: -1 | 1;
// o.pose: extra pose merged throughout. After exiting, a ghost of lattice points stays where they worked.
function workerLife(p, s, x, y, o = {}) {
  const lt = s.lt, base = { ...(o.pose || {}), t: s.t };
  const workPose = o.work ? o.work(lt) : {};
  const e0 = LINE.so + .2, e1 = LINE.now + .3;     // exit window
  const ghostPose = { ...base, ...workPose, ...(o.ghostPose || {}) };
  if (lt < e0) { worker(p, x, y, { ...base, ...workPose }); return; }
  // ghost appears as the body leaves
  const gk = seg(lt, e0 + .6, e1 + .6);
  if (gk > 0) worker(p, x, y, { ...ghostPose, pts: true, a: .9 * gk * (1 - seg(lt, 40, 45)), face: 'none' });
  const k = seg(lt, e0, e1), exit = o.exit ?? 'bow', dir = o.fleeDir ?? 1;
  if (k >= 1) return;
  if (exit === 'bow') {
    // head drops, shoulders slump, then the triangles fall away one by one
    const b = ease(seg(lt, e0, e0 + 1.2));
    worker(p, x, y + b * .8, { ...base, ...workPose, lean: b * .22, head: b * .75, face: 'sad', armL: [lerp(workPose.armL?.[0] ?? .15, -.05, b), lerp(workPose.armL?.[1] ?? 0, 0, b)], armR: [lerp(workPose.armR?.[0] ?? .15, -.05, b), lerp(workPose.armR?.[1] ?? 0, 0, b)], dis: easeIn(seg(lt, e0 + 1.6, e1)), seed: 3 });
  } else if (exit === 'flee' || exit === 'turn') {
    const run = easeIn(seg(lt, e0 + (exit === 'turn' ? .9 : .4), e1));
    worker(p, x + dir * run * 38, y, { ...base, walk: lt * 2.2, flip: dir, face: 'shock', lean: dir * .15 * (run > 0), dis: seg(lt, e1 - .6, e1) });
  } else if (exit === 'dread') {
    const d = seg(lt, e0, e1);
    worker(p, x, y, { ...base, ...workPose, shake: .5 + d * 1.2, face: 'shock', armL: [2.4, .6], armR: [2.4, .6], dis: easeIn(seg(lt, e0 + 1.5, e1)), seed: 5 });
  }
}

// ---- the AI -------------------------------------------------------------------------------------
// A solid orange hexagon with dark features, all snapped to lattice vertices so it reads crisply.
// Designed at r = 5; use r = 5, 10, 15… to stay on the lattice. The centre snaps to the nearest vertex.
// o: mood 'smile' | 'grin' | 'flat' | 'smug' | 'closed' | 'wink' | 'o', pop 0..1 (scale in with overshoot),
//    look -1..1 (eyes shift one triangle left/right), a, dis, seed, col, outline (ring instead of solid).
function aiFace(p, x, y, r = 5, o = {}) {
  const pop = o.pop ?? 1; if (pop <= 0) return;
  const j = Math.round(y / H), i = Math.round(x - j / 2);
  const q = p.at(i + j / 2, j * H, 0, backOut(pop) * r / 5), col = o.col ?? COL.orange;
  const fo = { a: o.a, dis: o.dis, seed: o.seed ?? 11, mask: o.mask };
  let ink = COL.bg;
  if (o.outline) { q.hexRing(0, 0, 5, 1.2, col, fo); ink = col; } else q.hex(0, 0, 5, col, fo);
  const mood = o.mood ?? 'smile', lx = Math.round(clamp(o.look ?? 0, -1, 1)) * .5;
  const eye = ex => q.hex(ex + lx, -H, 1, ink, fo);
  const shut = ex => q.line([[ex - 1 + lx, -H], [ex + 1 + lx, -H]], .62, ink, fo);
  if (mood === 'closed' || mood === 'smug') { shut(-1.5); shut(1.5); }
  else if (mood === 'wink') { eye(-1.5); shut(1.5); }
  else { eye(-1.5); eye(1.5); }
  const my = 2 * H;
  if (mood === 'flat') q.line([[-2, my], [2, my]], .62, ink, fo);
  else if (mood === 'o') q.hex(0, my, 1, ink, fo);
  else if (mood === 'grin') q.poly([[-2.5, H], [2.5, H], [1.5, 3 * H], [-1.5, 3 * H]], ink, fo);
  else if (mood === 'smug') q.line([[-2, my], [1.5, my], [2.5, H]], .62, ink, fo);
  else q.line([[-2.5, H], [-2, my], [2, my], [2.5, H]], .62, ink, fo);
  return q;
}

// ---- props ---------------------------------------------------------------------------------------
// Desk: top surface at y, centred on x, width w. Legs down to y + 4.4 (the floor, where feet stand).
function desk(p, x, y, w, col = COL.cream, o = {}) {
  p.rect(x - w / 2, y - .9, w, .9, col, o);
  p.line([[x - w / 2 + .8, y], [x - w / 2 + .8, y + 4.4]], .7, col, o);
  p.line([[x + w / 2 - .8, y], [x + w / 2 - .8, y + 4.4]], .7, col, o);
}
// Monitor outline with a stand; returns [x0, y0, x1, y1] of the screen interior.
function monitor(p, x, y, w, h, col = COL.cream, o = {}) {
  p.loop([[x - w / 2, y - h], [x + w / 2, y - h], [x + w / 2, y], [x - w / 2, y]], .75, col, o);
  p.line([[x, y], [x, y + 1.6]], .8, col, o);
  p.line([[x - 1.8, y + 1.7], [x + 1.8, y + 1.7]], .7, col, o);
  return [x - w / 2 + .6, y - h + .6, x + w / 2 - .6, y - .6];
}
function floor(p, y, x0, x1, col = COL.cream, o = {}) { p.line([[x0, y + .4], [x1, y + .4]], .6, col, o); }

// Symmetric mandala inside a hexagon, in the spirit of the "symmetry" drawings: concentric hex rings
// (the hex norm's level sets are lattice lines, so rings come out crisp), each ring a motif picked by seed:
// solid band, teeth, dashes, or empty. grow 0..1 reveals it from the centre; t slides the rings outward.
function mandala(p, cx, cy, r, col, seed = 1, grow = 1, t = 0, o = {}) {
  if (grow <= 0) return;
  const rr = r * easeOut(grow), shift = t * 1.1;
  const test = (x, y) => {
    const dx = x - cx, dy = y - cy, ay = Math.abs(dy), ax = Math.abs(dx);
    const hn = Math.max(ay / H, (H * ax + ay / 2) / H);          // hex "radius" of this point
    if (hn > rr) return false;
    let a = Math.atan2(dy, dx); a = ((a % (Math.PI / 3)) + Math.PI / 3) % (Math.PI / 3); if (a > Math.PI / 6) a = Math.PI / 3 - a;
    const v = Math.hypot(dx, dy) * Math.sin(a);                  // distance from the wedge's centre line
    const band = hn - shift, n = Math.floor(band / 1.5), f = band / 1.5 - n, m = hash(n & 7, seed, 5);
    if (hn < 1.6) return true;                                   // solid core
    if (m < .3) return f < .55;                                  // solid ring
    if (m < .55) return f < .7 && Math.floor(v / 1.2) % 2 === 0; // teeth
    if (m < .75) return f < .45 && Math.floor(v / 2.4 + .5) % 2 === 1; // dashes
    return false;                                                // gap
  };
  p.fill(Shape.fn([cx - r, cy - r, cx + r, cy + r], test), col, o);
}
