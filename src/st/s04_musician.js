// Verse 4 · "There were seven making songs… I write the tunes, the notes are spread!" · the musician bows their head.
// The musician plays a keyboard and writes one triangle note per beat on a staff. The AI grabs the staff, fills it in
// an instant, then spreads staff after staff of orange notes across the canvas, all scrolling in time with the music.
(() => {
  const FLOOR = 18, MX = -12;                      // musician's feet (integer x keeps the head crisp)
  const KEY_J = 14, KX0 = -20, KX1 = -4;           // keyboard: a row of triangle keys on lattice row 14 (y 12.1)
  const AI = [21, -6.062];
  // staves: bottom line on lattice row jb, four zigzag lines three rows apart; x0..x1 is its extent
  const STAFF_A = { jb: 2, x0: -23, x1: 15 };      // the musician's staff; the AI takes over its right-hand part
  const STAVES = [                                  // the AI's own staves, unrolled one per beat from the right
    { jb: 14, x0: -1, x1: 22, at: 5.06, seed: 2 },
    { jb: 24, x0: -1, x1: 16, at: 5.52, seed: 3 },
  ];
  const HUMAN_DX = 2.5, AI_DX = 3;

  function staffLines(p, jb, x0, x1, col, o = {}) {
    // each line is a single row of up-triangles (the finest sawtooth the lattice has), two clear rows between
    for (let l = 0; l < 4; l++) { const y = (jb - 3 * l) * H + H / 3; p.line([[x0, y], [x1, y]], .2, col, o); }
  }
  // A note: a solid hex head (two rows tall, centred on a lattice vertex) with a stem leaning up along the
  // lattice. pos 0..6: even = on line pos/2, odd = in the space above it. Returns the head's centre.
  function note(p, x, jb, pos, col, stem = 2.6, o = {}) {
    const l = Math.floor(pos / 2), rc = pos % 2 ? jb - 3 * l - 1 : jb - 3 * l + 1;
    const y = rc * H, xc = Math.round(x - rc / 2) + rc / 2;
    p.hex(xc, y, 1, col, o);
    if (stem > 0) p.line([[xc + .75, y - H / 2], [xc + .75 + stem * .577, y - H / 2 - stem]], .62, col, o);
    return [xc, y];
  }
  // The AI's notes: a dense run scrolling left in steps on the beat. vis(x) clips to the unrolled part.
  function aiNotes(p, st, scroll, seed, vis, col = COL.orange) {
    const off = Math.floor(scroll / AI_DX), sub = scroll - off * AI_DX;
    for (let k = -1; ; k++) {
      const x = st.x1 - 3.5 - k * AI_DX + sub; if (x < st.x0 + .5) break;
      const n = k + off;
      if (!vis(x)) continue;
      note(p, x, st.jb, Math.floor(hash(n, seed, 7) * 7), col, 1.8);
    }
  }
  function keyboard(p, s, col) {
    const y0 = KEY_J * H, b = s.beat, lt = s.lt;
    p.rect(KX0 - 1.3, y0 - 1, KX1 - KX0 + 2.6, 3 * H + 1.2, null, { erase: true });   // a dark gap from the player
    p.rect(KX0 - .5, y0 + H + .05, KX1 - KX0 + 1, 2 * H - .1, col);
    for (let i = KX0; i < KX1; i++) {
      // keys: up triangles; the human presses two on each beat, the AI later plays chords of its own
      const k = i - KX0, hb = Math.floor(b);
      const human = lt < LINE.so && (k === (hb * 3) % 16 || k === (hb * 5 + 7) % 16) && frac(b) < .5;
      const ai = lt > 12.5 && hash(k, Math.floor(b / 2), 5) < .22;
      if (human || ai) continue;                      // a pressed key drops out of the row
      p.poly([[i, y0 + H], [i + 1, y0 + H], [i + .5, y0]], col);
    }
    // stand
    p.line([[KX0 + 1, y0 + 3 * H], [KX0 - .5, FLOOR + .3]], .7, col);
    p.line([[KX1 - 1, y0 + 3 * H], [KX1 + .5, FLOOR + .3]], .7, col);
  }

  STATIONS[3] = {
    worker: 'musician',
    quote: ['I WRITE', 'THE TUNES'],
    quoteAt: 4.4,
    ai: AI,
    aiLook: lt => lt < 6 ? -1 : 0,
    aiMood: lt => lt < 4.5 ? 'smile' : lt < 7.4 ? 'o' : 'grin',
    draw(p, s) {
      const lt = s.lt, b = s.beat, t = s.t;
      const take = 4.6, calm = seg(lt, 12, 14);
      // stepped scroll: the notes jump one slot on each beat (a quarter as often once the AI is alone)
      const bs = b - (VERSE_T[3] + take - BEAT0) / BEAT;
      const step = x => Math.floor(x) + easeOut(seg(frac(x), 0, .3));
      const scroll = lt < take ? 0 : lerp(step(bs) * AI_DX * 2, step(bs / 4) * AI_DX * 2 + 40, calm);

      // ---- the musician's staff: one cream note per beat, page after page --------------------------------
      const A = STAFF_A, hx1 = -3;
      staffLines(p, A.jb, A.x0, hx1, COL.cream);
      const hb = lt < take ? Math.floor(b) : Math.floor((VERSE_T[3] + take - BEAT0) / BEAT);
      const page = Math.floor(hb / 8), upto = hb % 8;
      for (let k = 0; k <= upto; k++) {
        const pop = k === upto && lt < take ? easeOut(seg(frac(b), 0, .25)) : 1;
        if (pop > .3) note(p, A.x0 + 1.5 + k * HUMAN_DX, A.jb, Math.floor(hash(page, k, 3) * 7), COL.cream, 2.4 * pop);
      }
      // …the AI grabs the rest of the line and fills it instantly, notes streaming out of its face
      if (lt >= take) {
        const u = easeOut(seg(lt, take, take + .35)), xs = lerp(A.x1, hx1 + .5, u);
        staffLines(p, A.jb, xs, A.x1, COL.orange);
        aiNotes(p, { ...A, x0: hx1 + .5 }, scroll, 1, x => x > xs);
      }
      // ---- the AI's own staves unroll one per beat and fill with beamed runs -------------------------------
      for (const st of STAVES) {
        if (lt < st.at) continue;
        const u = easeOut(seg(lt, st.at, st.at + .4)), xs = lerp(st.x1, st.x0, u);
        staffLines(p, st.jb, xs, st.x1, COL.orange);
        aiNotes(p, st, scroll * (st.seed === 2 ? 1.5 : .75), st.seed, x => x > xs + .5);
      }
      // the notes are spread: on each beat of the boast a fan of notes sprays out of the AI's face
      if (lt > take && lt < LINE.so + .8) {
        const k = frac(bs), n0 = Math.floor(bs);
        for (let d = 0; d < 5; d++) {
          const a = Math.PI * (.62 + d * .13) + (n0 % 2) * .07, r = 6 + easeOut(k) * 16;
          const x = AI[0] + Math.cos(a) * r, y = AI[1] - Math.sin(a) * r * -1;
          if (!Shape.hex(0, 0, R_HEX - 2).has(x, y)) continue;
          const q = p.at(x, y);
          q.hex(0, 0, 1, COL.orange, { dis: easeIn(k) * .9, seed: d + n0 * 5 });
          q.line([[.75, -H / 2], [1.9, -H / 2 - 2]], .62, COL.orange, { dis: easeIn(k) * .9, seed: d + n0 * 5 + 1 });
        }
      }
      // ---- the musician at the keyboard ------------------------------------------------------------------
      workerLife(p, s, MX, FLOOR, {
        exit: 'bow',
        pose: { s: 1.2 },
        work: l => {
          if (l >= take) return { armL: [.75, -.2], armR: [.75, -.2], head: 0 };   // hands frozen on the keys
          const pl = pulse(t, 7), odd = Math.floor(b) % 2;
          return { armL: [.72 + (odd ? pl * .12 : 0), -.1], armR: [.72 + (odd ? 0 : pl * .12), -.1], head: wob(b / 4) * .08 };
        },
      });
      keyboard(p, s, COL.cream);
    },
  };
})();
