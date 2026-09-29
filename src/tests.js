// tests.js: standalone scenes for checking the engine. studio.html?test=<name>, or render.mjs --test=<name>.
const TESTS = {
  // every glyph of the font, at two sizes, plus a few line widths
  font(ctx, t) {
    const L = new Layer(), p = new Pen(L);
    const rows = ['ABCDEFGHIJKLM', 'NOPQRSTUVWXYZ', '0123456789', '{}()[]<>=+-*/.,:;!?"&#%$|'];
    rows.forEach((r, n) => text(p, r, -44, -14 + n * 8, 1, COL.cream));
    text(p, 'TYPE INSTEAD', -44, 22, .95, COL.orange, { w: .8 });
    text(p, '9', 20, 22, 1.5, COL.cream, { w: 1.25 });
    [.4, .6, .8, 1, 1.2].forEach((w, n) => p.line([[30, -14 + n * 3], [44, -14 + n * 3]], w, COL.cream));
    renderLayer(ctx, L, { x: 0, y: 0, z: 19, rot: Math.sin(t) * .0 }, { dots: 1 });
  },
  // text crispness at various sizes, baseline snapped to a lattice row and x to a vertex
  crisp(ctx, t) {
    const L = new Layer(), p = new Pen(L);
    [[.95, -18.1], [1, -9.5], [5 / 6, -1.7], [2 / 3, 5.2], [.75, 12.1], [1.5, 24.2]].forEach(([s, y], n) => {
      const j = Math.round(y / H), yy = j * H - H / 2, x = Math.round(-44 - j / 2) + j / 2;
      text(p, 'NO NEED FOR FRED ' + s.toFixed(2), x, yy, s, n % 2 ? COL.orange : COL.cream, { w: .8 });
    });
    renderLayer(ctx, L, { x: 0, y: 0, z: 19, rot: 0 }, { dots: 1 });
  },
  // cast sheet: worker poses and AI moods
  cast(ctx, t) {
    const L = new Layer(), p = new Pen(L);
    const poses = [{}, { lean: .9, head: .5, face: 'sad' }, { walk: t * 2, face: 'shock' }, { armL: [2.4, .6], armR: [2.4, .6], face: 'shock' }, { armL: [.9, 1.2], armR: [.9, 1.2] }];
    poses.forEach((o, n) => worker(p, -40 + n * 12, 2, { ...o, t }));
    ['smile', 'grin', 'flat', 'smug', 'closed', 'wink', 'o'].forEach((m, n) => aiFace(p, -40 + n * 11, 16, 5, { mood: m }));
    worker(p, 30, 2, { pts: true, face: 'none' });
    mandala(p, 40, 18, 12, COL.orange, 3, 1, t);
    renderLayer(ctx, L, { x: 0, y: 4, z: 18, rot: 0 }, { dots: .6 });
  },
};

// ---- YouTube thumbnails (render with --test=thumbA --stills=0, then scale to 1280×720) ---------------
// Title lettering with a dark knockout so it reads over anything. Stroke = `size` rows thick.
// Several lines: all knockouts first, then all letters. lines = [[str, x, y, size, col], ...]
function title(p, str, x, y, size, col) { titles(p, [[str, x, y, size, col]]); }
function titles(p, lines) {
  for (const [str, x, y, size] of lines) p.fill(textShape(str, x, y, size, { align: 'center', w: size * H + 2.5 }), null, { erase: true });
  for (const [str, x, y, size, col] of lines) text(p, str, x, y, size, col, { align: 'center', w: size * H + .08 });
}
Object.assign(TESTS, {
  // A: the song title over the AI's grinning face; two workers already reduced to ghost points, one left
  thumbA(ctx) {
    const L = new Layer(), p = new Pen(L);
    // a dim honeycomb of canvases behind everything
    for (let q = -3; q <= 3; q++) for (let r = -2; r <= 2; r++) {
      const [x, y] = V(q * 60 - r * 30, r * 60 - q * 30 + 0);   // hex-grid centres, radius 30, on lattice vertices
      if (Math.abs(x) < 130 && Math.abs(y) < 80) p.hexRing(x, y, R_HEX, .7, COL.dim);
    }
    p.hexRing(42, 18, 36, 1.3, COL.orange);
    aiFace(p, 42, 18, 25, { mood: 'grin', look: -1 });
    [[-76, 52], [-54, 52], [-28, 52]].forEach(([x, y], n) => worker(p, x, y, n < 2 ? { s: 2.2, pts: true, face: 'none' } : { s: 2.2, face: 'shock', armL: [2.4, .6], armR: [2.4, .6] }));
    title(p, 'JOB REPLACEMENT', 0, -32, 2, COL.cream);
    renderLayer(ctx, L, { x: 0, y: 2, z: 10, rot: 0 }, { dots: .8 });
  },
  // B: the finished world, all orange, the last ghosts still standing, and the line that ends it
  thumbB(ctx) {
    drawFrame(ctx, 159.2, { cam: { x: -95, y: 0, z: 3, rot: 0 }, extra: L => {
      const p = new Pen(L), x = -275;
      titles(p, [['AND NOW', x, -78, 4, COL.cream], ['THERE WERE', x, -44, 4, COL.cream], ['NONE', x, 30, 8, COL.orange]]);
    } });
  },
  // C: the developer's screens all turn into staring AI faces under the AI's boast
  thumbC(ctx) {
    const tl = STATION_TILES[4];
    drawFrame(ctx, 77.35, { cam: toCam(camOn(tl, 0, -1, 18.5)), extra: L => {
      const p = tilePen(L, tl);
      // clear the half-dissolved quote (inside the canvas only) and letter it crisply
      p.fill(Shape.fn([-24, -24, 24, -8.4], (x, y) => y < -8.4 && Shape.hex(0, 0, R_HEX - 1.6).has(x, y)), null, { erase: true });
      titles(p, [['JUST', -1.4, -15.5, 1, COL.orange], ['PROMPT', -1.4, -9.1, 1, COL.orange]]);
    } });
  },
});
