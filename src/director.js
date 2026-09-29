// director.js: composes one frame of the video from song time t.
//   camera path → layer ← (AI tiles, stations, AI cameos, takeover flood, numerals, tile frames, the AI's border reach) → render

// ---- camera -------------------------------------------------------------------------------------
// A station is framed "upright": camera rotation = -tile.rot. Local offsets are in the tile's frame.
function camOn(tile, lx, ly, z) {
  const c = Math.cos(tile.rot), s = Math.sin(tile.rot);
  return [tile.x + lx * c - ly * s, tile.y + lx * s + ly * c, z, -tile.rot];
}
const Z_STATION = 19.5, Z_OVER = 3.9;
const CAM_KEYS = (() => {
  const K = [], centre = STATION_TILES[9];
  // intro: born on the researcher's monitor, then pull back over the whole honeycomb
  K.push([0, camOn(centre, 9, 6, 50)], [2.6, camOn(centre, 9, 6, 38)], [6.4, [0, -22, 3.3, 0]], [7.6, [0, -22, 3.42, 0]]);
  for (let k = 0; k < 10; k++) {
    const T = VERSE_T[k], tl = STATION_TILES[k];
    K.push([T + .55, camOn(tl, 0, -.5, Z_STATION)], [T + LINE.now, camOn(tl, 0, .8, Z_STATION * 1.16)], [T + 12.9, camOn(tl, 0, -3, 15)]);
    if (k < 9) {
      const nx = STATION_TILES[k + 1], d = Math.hypot(nx.x - tl.x, nx.y - tl.y), T1 = VERSE_T[k + 1];
      const zm = Math.min(11, 1000 / (d + 2 * R_HEX));
      const rot = -(tl.rot + angDiff(tl.rot, nx.rot) / 2);
      K.push([(T + 12.9 + T1 + .55) / 2, [(tl.x + nx.x) / 2, (tl.y + nx.y) / 2, zm, rot]]);
    }
  }
  // outro: pull back over the finished world, then a slow turn
  K.push([OUTRO_T + .2, camOn(centre, 0, -3, 15)], [OUTRO_T + 1.9, camOn(centre, 0, -3, 16.5)], [OUTRO_T + 5.6, [0, 4, 3.25, 0]], [DUR, [0, 4, 3.05, -Math.PI / 12]]);
  // unwrap rotations so interpolation takes the short way round
  for (let n = 1; n < K.length; n++) { const a = K[n - 1][1][3]; K[n][1] = [...K[n][1]]; K[n][1][3] = a + angDiff(a, K[n][1][3]); }
  return K;
})();
function angDiff(a, b) { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; }
function camAt(t) {
  const K = CAM_KEYS;
  if (t <= K[0][0]) return toCam(K[0][1]);
  for (let n = 1; n < K.length; n++) if (t <= K[n][0]) {
    const [t0, a] = K[n - 1], [t1, b] = K[n], k = easeInOut((t - t0) / (t1 - t0));
    const z = Math.exp(lerp(Math.log(a[2]), Math.log(b[2]), k));
    // pan in "screen space" so zoom-outs and zoom-ins feel like one move
    return toCam([lerp(a[0], b[0], k), lerp(a[1], b[1], k), z, lerp(a[3], b[3], k)]);
  }
  return toCam(K[K.length - 1][1]);
}
const toCam = ([x, y, z, rot]) => ({ x, y, z, rot });

// ---- per-station state --------------------------------------------------------------------------
function stationState(k, t) {
  const T = VERSE_T[k], lt = t - T;
  return {
    k, t, lt, T, tile: STATION_TILES[k], beat: beatPos(t),
    ai: seg(lt, LINE.said, LINE.said + .6),          // AI cameo pop-in
    taken: seg(lt, LINE.now - .2, LINE.now + 1.4),   // orange flood
    n: 10 - k,                                       // workers left when this verse starts
  };
}
// Station layout (local units; the hex spans x ±30 at y 0 and x ±15 at y ±26). See STATION_GUIDE.md.
//   ai: where the AI cameo pops up. numeral: centre of the countdown plate.
//   quote: the AI's boast, one entry per line, typed in the top band from quoteAt (seconds into the verse).
const STATION_DEFAULTS = { ai: [21, -2], aiR: 5, numeral: [-20, -2], quote: [], quoteY: -15.5, quoteAt: 4.6 };

// ---- the frame ----------------------------------------------------------------------------------
function drawFrame(ctx, t) {
  const cam = camAt(t), L = new Layer(), [vx0, vy0, vx1, vy1] = viewBB(cam, R_HEX + 2);
  const visible = tl => tl.x > vx0 && tl.x < vx1 && tl.y > vy0 && tl.y < vy1;
  const vk = verseAt(t).k;

  // 2. the AI's own tiles bloom into mandalas
  for (const tl of AI_TILES) {
    if (!visible(tl)) continue;
    const g = seg(t, VERSE_T[tl.wake] + 6, VERSE_T[tl.wake] + 9);
    if (g > 0) mandala(new Pen(L, tl.x, tl.y, 0), 0, 0, R_HEX - 2.2, COL.orange, tl.seed, g, t * .5);
  }

  // 3. stations
  for (let k = 0; k < 10; k++) {
    const tl = STATION_TILES[k]; if (!visible(tl)) continue;
    const st = STATIONS[k], s = stationState(k, t), p = tilePen(L, tl), d = { ...STATION_DEFAULTS, ...st };
    st.draw(p, s);
    // the AI cameo
    if (s.ai > 0 && !d.ownAI) aiFace(p, d.ai[0], d.ai[1], d.aiR, { pop: s.ai, mood: d.aiMood ? d.aiMood(s.lt, s) : (s.lt < LINE.so ? 'smile' : 'grin'), look: d.aiLook ? d.aiLook(s.lt, s) : [-1, .4] });
    // the takeover: cream turns orange in a ripple from the AI
    if (s.taken > 0) {
      const [ax, ay] = p.toWorld(d.ai[0], d.ai[1]), r = ease(s.taken) * 62;
      L.recolor((wx, wy) => (wx - ax) ** 2 + (wy - ay) ** 2 < r * r && inHexWorld(tl, wx, wy), COL.orange, COL.cream);
    }
    // the AI's boast, typed in orange with a knockout so it reads over anything
    quote(p, d, s);
    // countdown numeral on a dark hex plate
    const nk = seg(s.lt, LINE.num - .9, LINE.num + .2), nout = seg(s.lt, LINE.end + 1.4, LINE.end + 2.6);
    if (nk > 0 && nout < 1) {
      const [nx, ny] = d.numeral, pr = 8.4 * backOut(seg(s.lt, LINE.num - .9, LINE.num - .3)), dis = Math.max(1 - nk, nout);
      p.hex(nx, ny, pr, null, { erase: true, dis: nout, seed: 60 + k });
      p.hexRing(nx, ny, pr, .7, COL.cream, { dis: nout, seed: 61 + k });
      text(p, String(s.n - 1), nx - 1.7, ny + 4.9, 1.9, COL.cream, { align: 'center', dis, seed: 40 + k, w: 1.5 });
    }
  }

  // 4. tile frames (the TriangleDraw canvas edge), dim, on top so every canvas reads as a hexagon
  for (const tl of ALL_TILES) if (visible(tl)) new Pen(L, tl.x, tl.y).hexRing(0, 0, R_HEX, .7, COL.dim, { a: .9 * frameAlpha(t, tl) });

  // 5. the AI's reach: it travels along the canvas borders from the centre, lighting each frame orange
  const reach = [];
  for (let k = 0; k < 9; k++) reach.push([STATION_TILES[k], seg(t - VERSE_T[k], LINE.said - .5, LINE.said + .9)]);
  for (const tl of AI_TILES) reach.push([tl, seg(t, VERSE_T[tl.wake] + 4.5, VERSE_T[tl.wake] + 6.5)]);
  const lit = new Map(), centre = STATION_TILES[9];   // tile -> [entry angle, fraction]
  lit.set(centre, [0, seg(t, VERSE_T[0] + LINE.said - 1.2, VERSE_T[0] + LINE.said - .5)]);
  for (const [tl, g] of reach) {
    if (g <= 0) continue;
    const chain = tileChain(tl);
    chain.forEach((c, n) => {
      if (!n) return;
      const f = clamp(g * (chain.length - 1) - (n - 1)), prev = chain[n - 1], ang = Math.atan2(prev.y - c.y, prev.x - c.x);
      const old = lit.get(c); if (!old || old[1] < f) lit.set(c, [ang, f]);
    });
  }
  for (const [tl, [ang, f]] of lit) if (f > 0 && visible(tl)) borderSweep(new Pen(L, tl.x, tl.y), ang, f, t);

  // 6. intro and outro lettering
  introOutro(L, t);

  renderLayer(ctx, L, cam, { dots: 1, dotMask: (x, y, i, j) => dotMask(t, x, y, i, j) });
}

function quote(p, d, s) {
  const lines = d.quote; if (!lines.length) return;
  const t0 = d.quoteAt, k = seg(s.lt, t0, t0 + 1.4), out = seg(s.lt, LINE.so + 1.6, LINE.so + 2.6);
  if (k <= 0 || out >= 1) return;
  const total = lines.join('').length; let shown = Math.ceil(k * total);
  lines.forEach((ln, n) => {
    const y = d.quoteY + n * 6.4, show = Math.max(0, Math.min(ln.length, shown)); shown -= ln.length;
    if (!show) return;
    // fit inside the hex at this height (half-width at y is (R·H − |y|/2)/H), leaving a margin
    const hw = (R_HEX * H - Math.abs(y - 3) / 2) / H - 3, sz = Math.min(.95, 2 * hw / textWidth(ln, 1)), x = -1.4 * sz;
    const ko = textShape(ln, x, y, sz, { align: 'center', show, w: 2.4 });
    if (ko) p.fill(ko, null, { erase: true });
    text(p, ln, x, y, sz, COL.orange, { align: 'center', show, w: .8, dis: out, seed: 90 + n });
  });
}

function frameAlpha(t, tl) {
  const d = Math.hypot(tl.x, tl.y);
  return seg(t, 3 + d / 60, 4.5 + d / 60) * (1 - seg(t, 161, 164));
}

// Lattice points: revealed outward from the centre in the intro, switched off one by one in the outro.
function dotMask(t, x, y, i, j) {
  let inside = false;
  for (const tl of ALL_TILES) if (Math.abs(x - tl.x) < R_HEX && Math.abs(y - tl.y) < R_HEX && inHexWorld(tl, x, y, R_HEX - .5)) { inside = true; break; }
  if (!inside) return 0;
  const d = Math.hypot(x, y), h = hash(i, j, 77);
  const on = seg(t, .4 + d * .028 + h * .5, .9 + d * .028 + h * .5);
  const off = t > 159 ? (h < seg(t, 159.5, 166.5) ? 1 : 0) : 0;
  return on * (1 - off) * .55;
}

// Tiles from the centre out to `tl`, stepping to the neighbour nearest the target each time.
function tileChain(tl) {
  const chain = [STATION_TILES[9]];
  while (chain.length < 5) {
    const c = chain[chain.length - 1]; if (c === tl) break;
    let best = null, bd = 1e9;
    for (const n of ALL_TILES) {
      if (Math.abs(Math.hypot(n.x - c.x, n.y - c.y) - SQ3 * R_HEX) > 1) continue;
      const dd = Math.hypot(n.x - tl.x, n.y - tl.y); if (dd < bd) { bd = dd; best = n; }
    }
    chain.push(best);
  }
  return chain;
}
// Light a tile's frame orange, sweeping both ways round from the edge it was entered by.
function borderSweep(p, ang, f, t) {
  const within = (x, y) => Math.abs(angDiff(ang, Math.atan2(y, x))) <= f * Math.PI + .02;
  p.fill(Shape.hexRing(0, 0, R_HEX + .35, 1.3), COL.orange, { mask: (x, y) => within(x, y) ? 1 : 0 });
  if (f < 1) for (const sd of [-1, 1]) {
    const a = ang + sd * f * Math.PI, rr = R_HEX * H / Math.max(Math.abs(Math.sin(a)), Math.abs(Math.sin(a + Math.PI / 3)), Math.abs(Math.sin(a - Math.PI / 3)));
    p.hex(Math.cos(a) * rr, Math.sin(a) * rr, 1.6, COL.orange);
  }
}

function introOutro(L, t) {
  const p = new Pen(L);
  // "10" over the honeycomb as we first see all ten workers
  const k = seg(t, 5.6, 6.6), out = seg(t, 8.0, 8.9);
  if (k > 0 && out < 1) text(p, '10', -2, -139, 4.6, COL.cream, { align: 'center', dis: Math.max(1 - k, out), seed: 3, w: 2.4 });
  // "I work alone" is whispered four times (155.6, 157.5, 161.0, 165.1): first in the centre canvas's quote band,
  // then above and below the whole world as the camera pulls back
  const fade = seg(t, 167.6, 169), str = 'I WORK ALONE', typing = (a, b) => Math.ceil(seg(t, a, b) * str.length);
  const c0 = typing(OUTRO_T, OUTRO_T + 1.1), cOut = seg(t, 159.2, 160.4);
  if (c0 > 0 && cOut < 1) {
    const cp = new Pen(L, STATION_TILES[9].x, STATION_TILES[9].y);
    cp.fill(textShape(str, -2, -15.5, .78, { align: 'center', show: c0, w: 2.2 }), null, { erase: true });
    text(cp, str, -2, -15.5, .78, COL.orange, { align: 'center', show: c0, w: .75, dis: cOut, seed: 4 });
  }
  const w1 = typing(161.0, 162.2), w2 = typing(165.1, 166.2);
  if (w1 > 0) text(p, str, 0, -137, 2.7, COL.orange, { align: 'center', show: w1, a: 1 - fade, w: 1.6 });
  if (w2 > 0) text(p, str, 0, 152, 2.7, COL.orange, { align: 'center', show: w2, a: 1 - fade, w: 1.6 });
  // world fade at the very end
  if (fade > 0) for (const [key, code] of L.cells) L.cells.set(key, Math.floor(code / 1024) * 1024 + Math.round((code % 1024) * (1 - fade)));
}
