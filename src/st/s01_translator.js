// Verse 1 · "There were ten at the desk… I translate fast, just type instead!" · the translator bows their head.
(() => {
  const FLOOR = 18, DESK = FLOOR - 4.4;
  // A page of "Latin" words: short zigzag strokes of varied length.
  function latinPage(p, x, y, w, h, rows, col, o = {}, seed = 0) {
    p.loop([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], .62, col, o);
    for (let r = 0; r < rows; r++) {
      let cx = x + 1.4; const ry = y + 1.9 + r * H * 2;
      for (let n = 0; cx < x + w - 2.4; n++) {
        const end = Math.min(x + w - 1.4, cx + 1 + hash(r, n, seed) * 3);
        p.line([[cx, ry], [end, ry]], .62, col, o); cx = end + 1;
      }
    }
  }
  // A page of "triangle script": solid little triangles, a language only the lattice speaks.
  function glyphRow(p, x, y, n, col, o = {}, seed = 0) {
    for (let g = 0; g < n; g++) {
      const gx = x + g * 1.5, h = hash(g, seed, 4);
      if (h < .18) continue;
      p.poly(h < .6 ? [[gx, y + H], [gx + 1, y + H], [gx + .5, y]] : [[gx, y], [gx + 1, y], [gx + .5, y + H]], col, o);
    }
  }
  function glyphPage(p, x, y, w, h, rows, col, o = {}, seed = 0) {
    p.loop([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], .62, col, o);
    for (let r = 0; r < rows; r++) glyphRow(p, x + 1.4, y + 1.3 + r * H * 2, Math.floor((w - 2.4) / 1.5), col, o, seed * 31 + r);
  }

  STATIONS[0] = {
    worker: 'translator',
    quote: ['TYPE', 'INSTEAD'],
    ai: [21, -6.1],
    draw(p, s) {
      const lt = s.lt, tap = pulse(s.t, 5);
      workerLife(p, s, 0, FLOOR, {
        exit: 'bow',
        pose: { s: 1.2 },
        work: t => {
          const look = Math.sin(t * 1.4) > 0 ? -1 : 1;
          return { head: look * .2, armL: [.95 + tap * .12, 1.15], armR: [.95 + (1 - tap) * .12, 1.15] };
        },
      });
      desk(p, 0, DESK, 46);
      latinPage(p, -21, DESK - 12.2, 12, 12.2, 6, COL.cream, {}, 1);
      // the human translation: one row every couple of seconds
      const k = lt - 4.6;
      if (k < 0) glyphPage(p, 9, DESK - 12.2, 12, 12.2, Math.min(6, Math.floor((lt + 9) / 2.4)), COL.cream, {}, 1);
      else {
        // the AI rewrites the whole page at once, then keeps flipping to fresh pages on the beat
        const page = Math.floor(s.beat), rows = Math.min(6, Math.ceil(seg(k, 0, .5) * 6));
        glyphPage(p, 9, DESK - 12.2, 12, 12.2, rows, COL.orange, {}, k < 1 ? 50 : page);
        // …and pours translated script along the floor, far faster than any typist
        for (let r = 0; r < 3; r++) {
          const y = FLOOR + 1.6 + r * H * 2, scroll = k * 14 * (1 + r * .25), off = Math.floor(scroll / 1.5), start = 22 - scroll;
          for (let g = 0; g < 36; g++) {
            const gx = -27 + g * 1.5 - (scroll % 1.5), h = hash(g + off, r, 9);
            if (h < .2 || gx < start || gx > 21 || !Shape.hex(0, 0, R_HEX - 2).has(gx + .5, y + .5)) continue;
            p.poly(h < .6 ? [[gx, y + H], [gx + 1, y + H], [gx + .5, y]] : [[gx, y], [gx + 1, y], [gx + .5, y + H]], COL.orange);
          }
        }
      }
    },
  };
})();
