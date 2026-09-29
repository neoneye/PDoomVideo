// Verse 7 · "There were four doing maths… I prove theorems inside my head!" · the mathematician turns and flees.
// The band drops out twice near the end of the verse (lt ≈ 8.35–9.7 and 10.15–11.5, with stabs at 9.75 and
// 11.6). Those silences are freeze-frames: every motion holds, and each stab jump-cuts the escape forward.
(() => {
  const FLOOR = 18, MX = -6.5, MY = 12.84 + 7 * H;   // the mathematician: feet a touch low so the head clears the
  // board and its centre lands on a lattice vertex (a crisp hex head)
  const B0 = -24.5, B1 = 3, BT = -7 * H, BB = 3 * H;             // chalkboard
  const AX = 15, AY = 2 * H;                                      // the AI's head (a lattice vertex)
  const FREEZE = [[8.35, 9.72], [10.15, 11.58]];
  const TURN = 7.45, RUN = 7.9, GONE = 11.58;

  // Song time with the silences held still: a pure function, so the stab after each hold jump-cuts ahead.
  const held = lt => { for (const [a, b] of FREEZE) if (lt >= a && lt < b) return a; return lt; };

  // A triangular number drawn the lattice way: n rows of up-triangles with gaps between them, the bottom row
  // resting on lattice row b and starting at vertex (a, b). `count` limits how many are drawn (bottom row first,
  // left to right), `from` skips the first ones, and `solid` fills the gaps too (n² triangles: Tₙ up + Tₙ₋₁ down).
  const V2 = (i, j) => [i + j / 2, j * H];
  function triNum(p, a, b, n, col, o = {}) {
    const count = o.count ?? n * (n + 1) / 2, from = o.from ?? 0; let k = 0;
    for (let r = 0; r < n; r++) {
      const jj = b - r;
      for (let c = 0; c < n - r; c++, k++) {
        if (k >= count) return;
        if (k < from) continue;
        const ii = a + r + c;
        p.poly([V2(ii, jj), V2(ii + 1, jj), V2(ii + 1, jj - 1)], col, o);
        if (o.solid && c < n - r - 1) p.poly([V2(ii + 1, jj), V2(ii + 1, jj - 1), V2(ii + 2, jj - 1)], col, o);
      }
    }
  }
  const books = (p, col) => {
    [[8, 3, 7], [8.5, 2.2, 6], [7.5, 1.8, 7.5]].reduce((y, [x, h, w]) => {
      p.rect(x, y - h, w, h - .35, col); p.line([[x + .8, y - h / 2 - .2], [x + w - .8, y - h / 2 - .2]], .4, COL.bg);
      return y - h;
    }, FLOOR);
  };

  // ---- the chalkboard: 1, 3, 6, 10 already there, 15 being drawn one chalk mark every two beats
  function board(p, s, marks) {
    p.loop([[B0, BT], [B1, BT], [B1, BB], [B0, BB]], .75, COL.cream);
    p.line([[B0 + 2, BB + .7], [B1 - 2, BB + .7]], .6, COL.cream);   // chalk ledge
    // figures at double size (a pen scaled by 2 about the origin, a lattice vertex, stays on the lattice)
    const q = p.at(0, 0, 0, 2);
    [[-12, 1], [-11, 2], [-9, 3]].forEach(([a, n]) => triNum(q, a, 1, n, COL.cream));
    triNum(q, -6, 1, 4, COL.cream, { count: marks });
    // …and the AI finishes it for them, in orange, all at once
    if (s.lt > 5.9) triNum(q, -6, 1, 4, COL.orange, { from: marks, dis: 1 - seg(s.lt, 5.9, 6.2), seed: 9 });
  }

  // ---- the AI's head: a small face at first, then it swells into a hex full of proofs
  function mind(p, s, ht) {
    const lt = s.lt, grow = ease(seg(ht, 3.7, 4.3));
    if (s.ai <= 0) return;
    const look = ht > TURN ? -1 : ht > 2.8 ? -1 : 0;
    if (grow <= 0) { aiFace(p, AX, AY, 5, { pop: s.ai, mood: 'smile', look }); return; }
    if (grow < 1) { aiFace(p, AX, AY, lerp(5, 10, grow), { mood: 'o', look }); return; }
    // the big head: a thick ring, eyes along the top, and a window into its thinking
    const R = 10, fb = Math.floor(beatPos(s.T + ht));
    p.hexRing(AX, AY, R, 1.3, COL.orange);
    const blink = frac(beatPos(s.T + ht) / 8) > .94;
    for (const ex of [-3, 3]) {
      if (blink) p.line([[AX + ex - 1 + look * .5, AY - 5 * H + H / 2], [AX + ex + 1 + look * .5, AY - 5 * H + H / 2]], .62, COL.orange);
      else p.hex(AX + ex + look * .5, AY - 5 * H, 1, COL.orange);
    }
    const inner = Shape.hex(AX, AY, R - 1.6);
    const clip = { mask: (x, y) => inner.has(x, y) ? 1 : 0 };
    const k = ht - 4.3;
    if (ht < 5.8 || ht > 12.6 && frac(fb / 16) < .5) {
      // proof lines: rows of triangle glyphs, scrolling up faster than chalk could ever go
      const sc = Math.floor((ht > 12.6 ? fb * .5 : k * 16));
      for (let r = 0; r < 7; r++) {
        const y = AY - 3 * H + r * 2 * H, row = sc + r;
        for (let g = 0; g < 16; g++) {
          const gx = AX - 7.5 + g, h = hash(g, row, 17); if (h < .3) continue;
          const up = h < .65, v = [[gx, y + H], [gx + 1, y + H], [gx + .5, y]];
          p.poly(up ? v : [[gx, y], [gx + 1, y], [gx + .5, y + H]], COL.orange, clip);
        }
      }
      return;
    }
    // the theorem: a triangle of triangles grows row by row, then snaps solid: n² = Tₙ + Tₙ₋₁. Q.E.D.
    const cyc = ht > 12.6 ? (fb % 16) / 16 * 3.2 : ht - 5.8;
    const n = Math.min(7, 1 + Math.floor(cyc * 6.5)), solid = cyc > 1.1;
    triNum(p, Math.round(12 - n / 2), 6, n, COL.orange, { solid });
    // ∎ : the tombstone, under the finished triangle
    if (cyc > 1.4) p.poly([V2(10, 9), V2(12, 9), V2(14, 7), V2(12, 7)], COL.orange);
  }

  function mathematician(p, s, ht, marks) {
    const lt = s.lt, tap = pulse(beatPos(s.T + ht) * BEAT + BEAT0, 5);
    const base = { s: 1.2, t: s.T + ht };
    const writing = { armR: [2.55 + tap * .12, .35 - tap * .2], armL: [.2, .5] };
    const chalk = hand => hand.hex(.4, 0, .45, COL.cream);
    if (ht < TURN) {
      const k = ease(seg(ht, 4.4, 5.2));   // the arm drops as the AI's head fills with proofs
      worker(p, MX, MY, { ...base, ...writing, armR: [lerp(writing.armR[0], .3, k), lerp(writing.armR[1], .2, k)],
        face: ht > 4.4 ? 'shock' : 'dot', handR: k < .6 ? chalk : undefined });
      if (k >= .6) p.hex(MX + 4, lerp(9.5, MY - .5, easeIn(seg(ht, 4.9, 5.4))), .45, COL.cream);   // the chalk drops
      return;
    }
    const gk = seg(ht, RUN + .5, GONE);
    if (gk > 0) worker(p, MX, MY, { ...base, ...writing, pts: true, a: .9 * gk * (1 - seg(lt, 40, 45)), face: 'none' });
    if (ht >= GONE) return;
    if (ht < RUN) {
      // the first stab: a jolt, arms flung up
      worker(p, MX, MY - .6, { ...base, face: 'shock', armL: [2.5, .5], armR: [2.5, .5] });
      return;
    }
    // the second stab: they turn and run for the left edge; the freezes hold them mid-stride
    const run = ht - RUN, x = MX - run * 6.5;
    worker(p, x, MY, { ...base, walk: ht * 2.4, flip: -1, face: 'shock', lean: -.15, dis: seg(x, -17, -25), seed: 6 });
  }

  STATIONS[6] = {
    worker: 'mathematician',
    quote: ['I PROVE', 'THEOREMS'],
    quoteAt: 3.9,
    ai: [AX, AY],
    ownAI: true,
    draw(p, s) {
      const lt = s.lt, ht = held(lt);
      // one chalk mark every two beats; the fifth triangle number never gets finished
      const m = 3 + Math.floor(Math.min(ht, 4.4) / (2 * BEAT)), marks = ((m % 14) + 14) % 14;   // 7 of 10 when the AI speaks
      books(p, COL.cream);
      board(p, s, Math.min(10, marks));
      mathematician(p, s, ht, marks);
      mind(p, s, ht);
      // the head hums: rings ripple out of it on the beat while it thinks (they stop dead in the freezes)
      if (ht > 4.3 && ht < 12.6) {
        const bp = frac(beatPos(s.T + ht));
        if (ht < 8.35) p.hexRing(AX, AY, 11.5, .62, COL.orange, { dis: .2 + bp * .8, seed: Math.floor(beatPos(s.T + ht)) });
      }
      // the stabs: the head flashes solid for an instant
      for (const t0 of [9.75, 11.6]) if (lt > t0 - .05 && lt < t0 + .12) p.hex(AX, AY, 10, COL.orange);
    },
  };
})();
