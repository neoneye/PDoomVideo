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
