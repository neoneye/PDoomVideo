// Verse 6 · "There were five chasing news… I write the stories, facts are fed!" · the journalist sighs and flees.
// The music drops to a hush from lt ≈ 0.7 to 7.7: the press assembles itself in the quiet, prints one
// front page per beat while it boasts, and goes into a frenzy when the beat comes back.
(() => {
  const FLOOR = 18, DESK = FLOOR - 4.4, JX = -18;               // journalist
  const TX = -10.5, TY = DESK - .9;                              // typewriter: centre x, bottom
  const PX0 = 3, PX1 = 21, PY0 = -1 * H, PY1 = 16 * H;          // printing press body
  const ROLL = [[8, 6 * H], [16, 6 * H]];                       // rollers (lattice vertices, touching)
  const HOP = [5, -3.5];                                        // hopper mouth, where the facts go in
  // stacks of printed papers: the floor in front of the press first, then over the journalist's typewriter
  const STACKS = [{ x0: -3.5, x1: 2, base: FLOOR, cap: 9 }];
  const slabY = (st, n) => (Math.floor(st.base / H) - 1 - 2 * n) * H;
  const SLOT = 13 * H;                                          // output slot height
  const SIGH = LINE.so, FLEE = LINE.so + 1.3, GONE = LINE.now;  // exit beats
  const DROP = 7.7;                                             // the beat comes back after the hush
  const CALM = LINE.now + 1.4;

  // Point → the lattice triangle that contains it (the station frame is lattice-aligned).
  function cell(x, y) {
    const j = Math.floor(y / H), fx = x - j / 2, i = Math.floor(fx), up = (fx - i) + (y / H - j) < 1;
    const v = (a, b) => [a + b / 2, b * H];
    return up ? [v(i, j), v(i + 1, j), v(i, j + 1)] : [v(i + 1, j), v(i + 1, j + 1), v(i, j + 1)];
  }
  const bez = (a, b, c, d, u) => {
    const m = 1 - u, k = [m * m * m, 3 * m * m * u, 3 * m * u * u, u * u * u];
    return [k[0] * a[0] + k[1] * b[0] + k[2] * c[0] + k[3] * d[0], k[0] * a[1] + k[1] * b[1] + k[2] * c[1] + k[3] * d[1]];
  };
  const fedora = hd => {
    hd.line([[-2.8, -1.25], [2.8, -1.25]], .8, COL.cream);
    hd.poly([[-1.8, -1.2], [1.8, -1.2], [1.3, -3.4], [-1.3, -3.4]], COL.cream);
    hd.line([[-1.9, -1.8], [1.9, -1.8]], .5, COL.bg);
  };

  // ---- the journalist's typewriter: a key a beat, the carriage steps left, a new line every four keys
  function typewriter(p, o = {}) {
    const col = COL.cream, typed = o.typed ?? 0, tok = o.token ?? 0;
    p.poly([[TX - 3.5, TY], [TX + 3.5, TY], [TX + 2.2, TY - 2.3], [TX - 2.2, TY - 2.3]], col);
    for (let n = 0; n < 4; n++) p.hex(TX - 1.5 + n, TY - 1.1, .42, COL.bg);
    // carriage: roller and paper, shifted left by the keys typed on this line
    const cx = TX + 1.5 - tok, ry = TY - 3.2;
    p.line([[cx - 4.2, ry], [cx + 4.2, ry]], 1.1, col);
    p.hex(cx - 4.6, ry, .9, col); p.hex(cx + 4.6, ry, .9, col);
    const px0 = cx - 3.5, px1 = cx + 3.5, py0 = ry - 9.5;
    p.loop([[px0, ry - .7], [px0, py0], [px1, py0], [px1, ry - .7]], .7, col);
    for (let l = 0; l < 4; l++) {
      const y = (Math.round((py0 + 1.6) / H) + l * 2 + .5) * H;
      const len = l < Math.floor(typed) ? 5 : l === Math.floor(typed) ? (typed % 1) * 5 : 0;
      if (len > .3) p.line([[px0 + 1, y], [px0 + 1 + len, y]], .62, col, { dis: clamp((o.eat ?? 0) * 4.5 - l), seed: 70 + l });
    }
    return [cx, py0];
  }

  // ---- the press
  function press(p, build, spin, run) {
    const o = { dis: 1 - build, seed: 31 }, col = COL.orange, ink = COL.bg;
    p.loop([[PX0, PY0], [PX1, PY0], [PX1, PY1], [PX0, PY1]], 1.2, col, o);
    p.line([[PX0 + 1.5, PY1], [PX0 + 1.5, FLOOR]], 1.1, col, o); p.line([[PX1 - 1.5, PY1], [PX1 - 1.5, FLOOR]], 1.1, col, o);
    // hopper
    p.poly([[HOP[0] - 3, HOP[1]], [HOP[0] + 3, HOP[1]], [HOP[0] + 1.2, PY0], [HOP[0] - 1.2, PY0]], col, o);
    // rollers: solid hexes with a ring and a spoke that steps a sixth of a turn
    ROLL.forEach(([rx, ry], n) => {
      p.hexRing(rx, ry, 4, 1, col, o);
      const a = (n ? -1 : 1) * spin * Math.PI / 3;
      p.line([[rx - Math.cos(a) * 3, ry - Math.sin(a) * 3], [rx + Math.cos(a) * 3, ry + Math.sin(a) * 3]], .9, col, o);
      p.hex(rx, ry, 1, col, o);
    });
    // the bed of type under the rollers slides back and forth with the beat
    for (let n = 0; n < 5; n++) {
      const x = PX0 + 2.2 + n * 3 + (run % 2) * 1;
      p.line([[x, 11.5 * H], [x + 1.8, 11.5 * H]], .62, col, o);
    }
    p.line([[PX0 - .2, SLOT], [PX0 + 1.4, SLOT]], 1.6, ink, o);   // output slot
  }

  // A front page: headline, a triangle photo, columns. Different every edition.
  function frontPage(p, x, y, w, h, n, o = {}) {
    p.rect(x, y, w, h, COL.orange, o);
    const oo = { ...o, seed: (o.seed ?? 0) + 1 }, ink = COL.bg, L = hash(n, 3, 1) < .5;
    p.line([[x + .8, y + 1.1], [x + w - .8, y + 1.1]], 1.0, ink, oo);                        // headline
    const px = L ? x + .8 : x + w - 3.2, py = y + 2.4;
    p.poly([[px, py + 2.2], [px + 2.4, py + 2.2], [px + 1.2, py + .1]], ink, oo);            // photo: a peak
    const cx0 = L ? x + 3.8 : x + .8, cx1 = L ? x + w - .8 : x + w - 3.8;
    for (let r = 0; r < 3 && y + 2.8 + r * 1.3 < y + h - .5; r++) p.line([[cx0, y + 2.8 + r * 1.3], [cx1 - hash(n, r, 4) * 1.2, y + 2.8 + r * 1.3]], .5, ink, oo);
  }

  // Pages printed by lt (continuous): one a beat while it boasts, two a beat after the drop, one a bar later.
  function printed(lt) {
    const a = seg(lt, 4.1, DROP) * (DROP - 4.1), b = seg(lt, DROP, CALM) * (CALM - DROP), c = Math.max(0, lt - CALM);
    return (a + b * 2 + c * .25) / BEAT;
  }

  function journalist(p, s) {
    const lt = s.lt, tap = pulse(s.t, 4), hush = lt > .7;
    const base = { s: 1.2, t: s.t, hat: fedora };
    // left hand on the desk, right hand on the typewriter keys, pecking on the beat (softer in the hush)
    const work = { armL: [.55, -.95], armR: [.55 + tap * (hush ? .08 : .16), -.95] };
    if (lt < SIGH) { worker(p, JX, FLOOR, { ...base, ...work, face: lt > 4.6 ? 'shock' : 'dot' }); return; }
    const gk = seg(lt, FLEE + .4, GONE + .6);
    if (gk > 0) worker(p, JX, FLOOR, { ...base, ...work, hat: undefined, pts: true, a: .9 * gk * (1 - seg(lt, 40, 45)), face: 'none' });
    if (lt >= GONE) return;
    if (lt < FLEE) {
      // the sigh: a breath in (shoulders rise), then everything sinks
      const inh = Math.sin(seg(lt, SIGH, SIGH + .7) * Math.PI / 2), k = ease(seg(lt, SIGH + .5, SIGH + 1.2));
      worker(p, JX, FLOOR + k * .7 - (inh - k) * .45, { ...base, face: 'sad', armL: [lerp(.55, .05, k), lerp(-.95, 0, k)], armR: [lerp(.55, .05, k), lerp(-.95, 0, k)] });
      return;
    }
    // …and flee, off to the left, away from the press
    // (they dissolve as they reach the canvas edge, so nothing spills onto the neighbouring tile)
    const run = easeIn(seg(lt, FLEE, GONE)), x = JX - run * 12;
    worker(p, x, FLOOR, { ...base, walk: lt * 2.2, flip: -1, face: 'sad', lean: -.15, dis: seg(x, -20, -27), seed: 4 });
  }

  STATIONS[5] = {
    worker: 'journalist',
    quote: ['FACTS', 'ARE FED'],
    quoteAt: 5.4,
    ai: [12.5, -5 * H],
    draw(p, s) {
      const lt = s.lt, b = s.beat, after = lt > CALM;
      // one key per beat, four keys a line, four lines a page; the keys stop when the AI starts talking
      const keys = Math.floor(lt < 4.6 ? b : beatPos(s.T + 4.6));
      journalist(p, s);
      desk(p, -13, DESK, 18);
      const eat = seg(lt, 4.6, 7.2);
      const [cx, py0] = typewriter(p, { typed: lt < 4.6 ? (keys % 16) / 4 : Math.max(2.5, (keys % 16) / 4), token: lt < 4.6 ? keys % 4 : 0, eat });

      // the press assembles triangle by triangle in the quiet; the rollers step with the beat
      const build = seg(lt, 2.6, 4.0);
      if (build > 0) {
        const step = lt < 3.7 ? 0 : after ? Math.floor(b / 2) : lt < DROP ? Math.floor(b) : Math.floor(b * 2);
        press(p, build, step, step);
      }
      // facts fed: a stream of triangles lifted off the journalist's page, arcing into the hopper
      const feed = seg(lt, 4.4, 5.0) * (1 - seg(lt, SIGH + 1.5, SIGH + 2.5)) + (after ? .3 : 0);
      if (feed > 0) {
        const A = [cx, py0 + 2], B = [cx - 1, -12], C = [HOP[0] - 2, -12], D = [HOP[0], HOP[1] + 1];
        const N = 46, sp = after ? .22 : .8;
        for (let n = 0; n < N; n++) {
          const u = frac(lt * sp + n / N);
          if (hash(n, 9) > feed || u < .03) continue;
          const [x, y] = bez(A, B, C, D, u), w = Math.sin(u * Math.PI * 4 + n) * 1.3;
          p.poly(cell(x + w, y), u > .45 ? COL.orange : COL.cream);
        }
      }
      // the stacks of printed papers, and the page coming out of the slot and dropping onto them
      const c = printed(lt), done = Math.floor(c), f = c - done;
      let left = done, target = null, tn = 0;
      for (const st of STACKS) {
        const k = Math.min(left, st.cap); left -= k;
        for (let n = 0; n < k; n++) p.rect(st.x0 + (n % 2) * .5, slabY(st, n), st.x1 - st.x0, H, COL.orange);
        if (!target && k < st.cap) { target = st; tn = k; }
      }
      if (!target) { target = STACKS[0]; tn = STACKS[0].cap - 1; }
      const c0 = (DROP - 4.1) / BEAT, frenzy = lt > DROP && lt < CALM + .6 && done >= STACKS[0].cap;
      if (frenzy) {
        // the stack is full: every new page flies out of the slot in an arc over the journalist and melts away
        for (let n = done; n > done - 10 && n >= STACKS[0].cap; n--) {
          const age = lt - (DROP + (n - c0) * BEAT / 2); if (age < 0 || age > 1.3) continue;
          const sp = hash(n, 7), x = PX0 - 3 - age * (8 + sp * 6), y = SLOT - 7 - age * (9 + sp * 5) + 6 * age * age;
          frontPage(p, Math.round(x), Math.round(y / H) * H, 4.5, 4.5, n, { dis: easeIn(seg(age, .5, 1.3)), seed: n });
        }
      }
      if (c > 0 && !frenzy) {
        const top = slabY(target, tn) - .4, sl = ease(seg(f, 0, .5)), fall = easeIn(seg(f, .55, .9));
        const x = lerp(PX0 - 1, target.x0 - .5, sl), y = lerp(SLOT - 6, top - 6.5, fall);
        frontPage(p, x, y, 6.5, 6.5, done, { dis: seg(f, .88, 1), seed: 50 });
      }
    },
  };
})();
