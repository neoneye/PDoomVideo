// Verse 8 · "There were three in the lab… I study life, the genes I've read!" · the biologist bows their head.
// The lab: a biologist at a microscope, a honeycomb of petri dishes, and a DNA double helix they read
// one base pair at a time. The AI reads the whole genome at once: the helix turns orange rung by rung
// from the AI outward, then races into its face while a ribbon of A C G T streams along the floor.
(() => {
  const BENCH = 16 * H, FLOOR = BENCH + 4.4;          // bench top on a lattice row
  const HY = -3 * H, AMP = 4.6, KW = TAU / 24, SP = 3;  // helix axis, amplitude, wave number, rung spacing
  const AI_AT = 4.6;                                  // the boast: the AI starts reading
  const IN = Shape.hex(0, 0, R_HEX - 1.3), inHex = (x, y) => (IN.has(x, y) ? 1 : 0);
  const BASES = 'ACGT';
  const base = n => BASES[Math.floor(hash(n, 7, 3) * 4)];

  // Scroll position of the genome (the helix slides right, into the AI). Pure function of k = lt - AI_AT:
  // the integral of a speed profile that bursts to a blur while the AI reads, then settles to a calm feed.
  const speed = k => k < .9 ? 0 : k < 1.5 ? lerp(0, 30, ease((k - .9) / .6)) : k < 2.9 ? 30 : lerp(30, 2.2, ease((k - 2.9) / 2.4));
  function scrollAt(k) {
    if (k <= .9) return 0;
    const dt = 1 / 60, end = Math.min(k, 5.3);
    let x = 0;
    for (let u = .9; u < end; u += dt) x += speed(u + dt / 2) * Math.min(dt, end - u);
    return x + Math.max(0, k - 5.3) * 2.2;
  }

  // The double helix. rungCol(n, x) -> colour or null (unread); strandCol(x) -> colour.
  function helix(p, lt, pos, phase, rungCol, strandCol, flash) {
    const x0 = -27, x1 = 27, ys = [];
    const yA = x => HY + AMP * Math.sin(KW * (x - pos) + phase), yB = x => HY - AMP * Math.sin(KW * (x - pos) + phase);
    const front = x => Math.cos(KW * (x - pos) + phase) > 0;     // strand A faces us where cos > 0
    // strands, back halves first (thin), then rungs, then front halves (bold)
    const strand = (f, isFront, w) => {
      let run = [];
      const flush = () => { if (run.length > 1) p.line(run, w, strandCol(run[0][0]), { mask: inHex }); run = []; };
      for (let x = x0; x <= x1 + .01; x += .5) {
        const on = isFront(x);
        if (on) run.push([x, f(x)]);
        else { if (run.length) run.push([x, f(x)]); flush(); }
        // split runs where the colour changes so each piece is one colour
        if (run.length > 1 && strandCol(x) !== strandCol(run[0][0])) { flush(); run.push([x, f(x)]); }
      }
      flush();
    };
    strand(yA, x => !front(x), .62); strand(yB, x => front(x), .62);
    const first = Math.floor((x0 - pos) / SP), last = Math.ceil((x1 - pos) / SP);
    for (let n = first; n <= last; n++) {
      const x = n * SP + pos, a = yA(x), b = yB(x);
      if (Math.abs(a - b) < 1.6) continue;
      const col = rungCol(n, x), top = Math.min(a, b) + .6, bot = Math.max(a, b) - .6, mid = (a + b) / 2;
      if (!col) { p.line([[x, top], [x, bot]], .62, COL.cream, { mask: inHex, pts: true }); continue; }
      // a base pair: two bold halves with a notch between them
      const w = 1 + (flash ? flash(n, x) : 0);
      p.line([[x, top], [x, mid - .45]], w, col, { mask: inHex });
      p.line([[x, mid + .45], [x, bot]], w, col, { mask: inHex });
    }
    strand(yA, x => front(x), 1.25); strand(yB, x => !front(x), 1.25);
  }

  // Microscope, eyepiece top-left toward the biologist.
  // Microscope, eyepiece up-left toward the biologist. Every vertex is a lattice vertex: (dx, r) means
  // dx units right of the foot's centre and r rows up, so all edges run along lattice lines.
  const MX = -1;
  function microscope(p, col) {
    const P = pts => pts.map(([dx, r]) => [MX + dx, BENCH - r * H]);
    p.poly(P([[-3, 0], [3, 0], [2, 2], [-2, 2]]), col);                    // foot
    p.poly(P([[1, 2], [3, 2], [4, 4], [2, 4]]), col);                      // arm: out,
    p.poly(P([[2, 4], [4, 4], [4.5, 7], [2.5, 7]]), col);                  //      up,
    p.poly(P([[2.5, 7], [4.5, 7], [3.5, 9], [1.5, 9]]), col);              //      and back over
    p.poly(P([[-1.5, 9], [3.5, 9], [3, 10], [-2, 10]]), col);              // bridge to the tube
    p.poly(P([[-4.5, 3], [2.5, 3], [3, 4], [-4, 4]]), col);                // stage
    p.poly(P([[-2.5, 5], [.5, 5], [-1.5, 9], [-4.5, 9]]), col);            // body tube
    p.poly(P([[-4.5, 9], [-2.5, 9], [-3.5, 11], [-5.5, 11]]), col);        // eyepiece
    p.poly(P([[-2, 4], [-1, 4], [-.5, 5], [-2.5, 5]]), col);               // objective
    p.hex(MX + 5, BENCH - 6 * H, 1, col);                                  // focus knob
  }

  // Petri dishes stacked in a little pyramid. The human's colonies are ragged blobs that spread slowly;
  // the AI's are perfect: each dish flips, one per beat, to a flawless lattice of triangles that pulses.
  const DISHES = [[7.5, 13 * H], [15.5, 13 * H], [11.5, 7 * H]];
  function dishes(p, lt, s) {
    DISHES.forEach(([cx, cy], d) => {
      const g = seg(lt - AI_AT, 1.2 + d * BEAT, 1.2 + d * BEAT + .5);
      if (g > 0) {
        p.hexRing(cx, cy, 3, .7, COL.orange);
        const inv = Math.floor(s.beat) % 2;
        p.fill(Shape.hex(cx, cy, 2.3 * easeOut(g)), COL.orange, { mask: (x, y) => (frac(y / H + .01) < .5) !== !!inv ? 1 : 0 });
        return;
      }
      p.hexRing(cx, cy, 3, .7, COL.cream);
      const grow = .25 + .5 * frac((lt + 30 + d * 7) / 22), glow = pulse(s.t, 4) * .1;
      p.fill(Shape.hex(cx, cy, 2.2), COL.cream, { mask: (x, y) => {
        const i = Math.floor(x * 2), j = Math.floor(y / H), r = Math.hypot(x - cx - .6 * Math.sin(d * 2), y - cy) / 2.2;
        return hash(i, j, 40 + d) * .6 + r * .7 < grow + glow ? 1 : 0;
      } });
    });
  }

  // A ribbon of bases below the bench: the reading's output. Letters fade out at the ends of the strip.
  function ribbon(p, first, count, off, col, o = {}) {
    for (let c = 0; c < count; c++) {
      const n = first + c, x = -15 + c * 4.6 + off;
      if (x < -18 || x > 14) continue;
      const edge = Math.max(seg(-15 - x, -1, 2.5), seg(x - 10.5, -1, 2.5));
      text(p, base(n), x, FLOOR + 4.7, .8, col, { w: .72, ...o, dis: Math.max(o.dis ?? 0, edge), seed: n & 63 });
    }
  }

  STATIONS[7] = {
    worker: 'biologist',
    quote: ['GENES', "I'VE READ"],
    quoteAt: 5.4,
    ai: [22, HY],
    aiMood: lt => lt < LINE.so ? (lt < AI_AT ? 'smile' : 'grin') : lt < LINE.now ? 'smug' : 'closed',
    aiLook: lt => lt < AI_AT ? -1 : lt < LINE.so ? .4 : -1,
    draw(p, s) {
      const lt = s.lt, k = lt - AI_AT, beat = s.beat;
      // ---- the biologist at the microscope
      workerLife(p, s, -10.5, FLOOR, {
        exit: 'bow',
        pose: { s: 1.2 },
        work: t => {
          if (t >= LINE.said && t < AI_AT + .6) {            // looks up at the AI
            const q = ease(seg(t, LINE.said, LINE.said + .5));
            return { lean: lerp(.35, 0, q), head: lerp(0, -.35, q), armR: [lerp(.95, .5, q), lerp(.9, .4, q)], armL: [.1, .2] };
          }
          const peek = frac(beat / 8) > .8;                   // every two bars: glance up from the eyepiece
          const turn = pulse(s.t, 5);
          return { lean: peek ? .1 : .35, head: peek ? -.3 : .2, armR: [.95 + turn * .15, .9 - turn * .25], armL: [.1, .2] };
        },
      });
      desk(p, 3, BENCH, 30);
      microscope(p, COL.cream);
      dishes(p, lt, s);

      // ---- the double helix
      const N_LOOP = 30;
      if (k < 0) {
        // the human reads one base pair every two beats, left to right, noting each letter down
        const read = Math.floor(((lt + 60) / (BEAT * 2)) % N_LOOP) + 1;
        const firstRung = Math.floor(-25 / SP);
        const cursorN = firstRung + read;
        helix(p, lt, 0, lt * .9, n => n < cursorN ? COL.cream : null, () => COL.cream);
        // the reading cursor: a small triangle above the rung being read
        const cx = cursorN * SP, blink = pulse(s.t, 3);
        if (cx < 21) p.poly([[cx - 1, HY - AMP - 1.9], [cx + 1, HY - AMP - 1.9], [cx, HY - AMP - 1.9 + 2 * H]], COL.cream, { dis: blink < .3 ? .6 : 0, seed: 5 });
        // the notes: the last few letters read, typed one by one
        const shown = Math.min(read, 7);
        ribbon(p, cursorN - shown, shown, 0, COL.cream);
      } else {
        // the AI reads everything at once: rung by rung, from its face outward, in under a second
        const pos = scrollAt(k), front = 22 - k * 58;                // sweep front races left
        const humanRead = Math.floor(((AI_AT + 60) / (BEAT * 2)) % N_LOOP) + 1 + Math.floor(-25 / SP);
        helix(p, lt, pos, AI_AT * .9 + k * 1.2 + pos * .15,
          (n, x) => n * SP + 0 >= front || n < Math.floor(-27 / SP) ? COL.orange : (n < humanRead ? COL.cream : null),
          x => x >= front - 1 ? COL.orange : COL.cream,
          (n, x) => (x > front && x < front + 5 ? .7 * (1 - (x - front) / 5) : 0) + (k > 1.3 ? pulse(s.t, 7) * .35 * (hash(n, 5) > .6) : 0));
        // the sweep's leading edge: a bright orange scan bar
        if (front > -27) p.line([[front, HY - AMP - 1.6], [front, HY + AMP + 1.6]], 1.2, COL.orange, { mask: inHex });
        // the output: the genome streams along the floor as fast as it's read
        const rp = pos * .9 + Math.max(0, k) * 1.5, step = 4.6, n0 = -Math.floor(rp / step);
        const on = seg(k, .3, .9);
        if (on > 0) ribbon(p, n0 - 1, 9, (rp % step) - step, COL.orange, { dis: 1 - on, seed: 12 });
        // the biologist's own notes crumble away as the AI's output arrives
        if (k < .6) { const read = humanRead - Math.floor(-25 / SP), shown = Math.min(read, 7); ribbon(p, humanRead - shown, shown, 0, COL.cream, { dis: k / .6 }); }
      }
    },
  };
})();
