// Verse 9 · "There were two at the top… I run the firm, go rest instead!" · the CEO leaves in dread.
// The top tile of the honeycomb. The crowned CEO stands at a lectern on the apex of an org-chart pyramid,
// stamping on the beat while reports flow up the lattice lines. When the band drops out (lt ≈ 0.6 … 7.4)
// the AI climbs the chart in silence, one node per beat, each node flipping into a tiny orange face. It
// reaches the top as the beat kicks back in, offers the CEO a beach umbrella ("go rest instead"), packs
// them off to a sun lounger in dread, and takes the top spot (and the crown). The CEO's ghost rests there.
(() => {
  const V2 = (x, j) => [x, j * H];                        // lattice-row helper: x must suit the row's parity
  // the org chart: nodes on lattice vertices, 6 units apart along the 60° lines
  const APEX = V2(0, 8);
  const ROWS = [[V2(-3, 14), V2(3, 14)], [V2(-6, 20), V2(0, 20), V2(6, 20)], [V2(-9, 26), V2(-3, 26), V2(3, 26), V2(9, 26)]];
  const NODES = ROWS.flat();                              // index 0..8, top row first
  const PARENTS = NODES.map(([x, y], n) => n < 2 ? [-1]
    : NODES.map((q, m) => m).filter(m => Math.abs(NODES[m][1] - (y - 6 * H)) < .1 && Math.abs(Math.abs(NODES[m][0] - x) - 3) < .1));
  const at = n => (n < 0 ? APEX : NODES[n]);
  // takeover: bottom row first, left to right, then upward, one node per beat; the apex on the beat the band returns
  const ORDER = [5, 6, 7, 8, 2, 3, 4, 0, 1];
  const B0 = (BEAT0 - VERSE_T[8]) % BEAT;                 // lt of a beat inside this verse
  const beatLt = k => B0 + BEAT * Math.ceil((2.9 - B0) / BEAT) + k * BEAT;
  const flipT = n => beatLt(ORDER.indexOf(n));
  const APEX_T = beatLt(10);                              // ≈ 7.6
  const QUIET0 = .6, QUIET1 = 7.45;                       // the instrumental drop-out
  const S = 1.1, FEET = 9 * H;                            // the CEO stands behind the lectern (legs hidden)
  const SIT = [-18, 7.8];                                 // hip point on the sun lounger
  const TOP_AI = [0, 0];                               // where the AI face settles (also the flood origin)
  const YANK = 8.35, GONE = 8.8;                          // packed off to the beach

  // ---- props ----------------------------------------------------------------------------------------
  // A tiny AI face in an org-chart node: solid hex, triangle eyes, a trapezoid grin.
  function aiNode(p, cx, cy, pop, blink) {
    if (pop <= 0) return;
    p.hex(cx, cy, 2 * backOut(pop), COL.orange);
    if (pop < .7) return;
    const cut = (x0, y0, x1, y1) => p.rect(cx + x0, cy + y0, x1 - x0, y1 - y0, null, { erase: true });
    if (!blink) { cut(-1.2, -.7, -.8, -.45); cut(.8, -.7, 1.2, -.45); }
    cut(-.6, .2, .6, .65);
  }
  function humanNode(p, cx, cy, lit) {
    p.hexRing(cx, cy, 2, .75, COL.cream);
    if (lit) p.hex(cx, cy, 1, COL.cream);
  }
  function crown(p, x, y, sc, col, o) {                   // (x, y) = middle of the band's bottom
    p.at(x, y, 0, sc).poly([[-1.6, 0], [1.6, 0], [1.9, -2.1], [.95, -1.1], [0, -2.4], [-.95, -1.1], [-1.9, -2.1]], col, o);
  }
  const stamp = col => q => { q.line([[0, 0], [1.1, 0]], .7, col); q.rect(1, -1, .9, 2, col); };
  // The lectern at the top of the org chart: the apex node, and the CEO's desk.
  function lectern(p, col) {
    p.poly([[-4.5, 5 * H], [4.5, 5 * H], [2, 10 * H], [-2, 10 * H]], col);
  }
  const TIE = [[-.45, -8.5], [.45, -8.5], [.3, -7.8], [.65, -6.3], [0, -5.4], [-.65, -6.3], [-.3, -7.8]];
  // The CEO: crown, dark tie, optionally a rubber stamp in the right hand.
  function ceo(p, x, y, o, crowned, stamped, tie = true) {
    const q = worker(p, x, y, { ...o, hat: crowned ? hd => crown(hd, 0, -2.05, .85, COL.cream, o) : null, handR: stamped ? stamp(COL.cream) : null });
    if (tie && !o.lean) q.poly(TIE, COL.bg, { dis: o.dis, seed: o.seed });
  }
  // Beach umbrella and sun lounger: the AI's idea of retirement. grow 0..1 pops it in.
  function beach(p, grow) {
    if (grow <= 0) return;
    const o = { dis: 1 - clamp(grow * 1.4), seed: 31 }, c = COL.orange, cx = -13, top = -9 * H, bot = -3 * H;
    p.poly([[cx - 3, top], [cx + 3, top], [cx + 6, bot], [cx - 6, bot]], c, o);                         // canopy
    for (const sx of [-1, 1]) p.line([[cx + sx, top], [cx + sx * 2.5, bot]], .62, null, { erase: true });
    for (let n = -5; n < 6; n += 2) p.poly([[cx + n, bot], [cx + n + 1, bot], [cx + n + .5, bot + H]], c, o);   // hem
    p.poly([[cx - .5, top], [cx + .5, top], [cx, top - H]], c, o);                                      // finial
    p.line([[cx, bot], [cx, 11 * H]], .75, c, o);                                                        // pole
    const [hx, hy] = SIT;                                                                                // lounger
    p.line([[hx - 1, hy + .6], [hx + 5.5, hy + .6]], .8, c, o);
    p.line([[hx - 1, hy + .6], [hx - 3, hy + .6 - 4 * H]], .8, c, o);
    p.line([[hx - .5, hy + .6], [hx - .5, hy + 2.4]], .62, c, o);
    p.line([[hx + 5, hy + .6], [hx + 5, hy + 2.4]], .62, c, o);
    p.line([[-26, 12 * H], [-6, 12 * H]], .62, c, { ...o, pts: true });                                // sand
  }
  // The firm's numbers, lower right. The CEO's line wobbles gently upward, one step per beat;
  // the AI's goes straight up, and keeps doing it, calmly, forever after.
  const CX0 = 12, CX1 = 21, CY0 = 2.5, CY1 = 16 * H;
  function chart(p, beat, aiK) {
    p.line([[CX0, CY0], [CX0, CY1], [CX1, CY1]], .7, COL.cream);
    for (let n = 1; n < 4; n++) p.line([[CX0 + .6, CY1 - n * 2.6 * H], [CX1, CY1 - n * 2.6 * H]], .62, COL.cream, { pts: true });
    const w = CX1 - CX0 - 1.2, pts = [];
    if (aiK < 0) {
      const cyc = Math.floor(beat / 16), steps = Math.min(12, Math.floor(frac(beat / 16) * 16) + 1);
      for (let n = 0; n <= steps; n++) pts.push([CX0 + .6 + n * w / 12, CY1 - 2 - n * .28 - (hash(n, cyc, 5) - .5) * 2.4]);
      p.line(pts, .7, COL.cream);
      return;
    }
    const k = aiK < BEAT * 16 ? aiK : (aiK - BEAT * 16) % (BEAT * 16), g = easeOut(k / .6);
    for (let n = 0; n <= 16 * g; n++) { const u = n / 16; pts.push([CX0 + .6 + u * w, CY1 - 1.2 - (CY1 - CY0 - 1.5) * (Math.exp(3.2 * u) - 1) / (Math.exp(3.2) - 1)]); }
    if (pts.length < 2) return;
    p.line(pts, .9, COL.orange);
    const [ex, ey] = pts[pts.length - 1];
    if (g >= 1) p.poly([[ex - 1, ey + .2], [ex + 1, ey + .2], [ex + .3, ey - 1.6]], COL.orange);
  }

  STATIONS[8] = {
    worker: 'ceo',
    quote: ['GO REST', 'INSTEAD'],
    quoteAt: 5.2,
    ai: TOP_AI, ownAI: true,
    numeral: [18, 3],
    draw(p, s) {
      const lt = s.lt, beat = s.beat, quiet = lt > QUIET0 && lt < QUIET1;
      const busy = !quiet && !(lt > APEX_T && lt < LINE.now + .5);   // reports flow while the band plays

      // ---- the org chart: connectors, reports, nodes
      NODES.forEach(([x, y], n) => {
        for (const m of PARENTS[n]) {
          const [px0, py0] = at(m), L = Math.hypot(px0 - x, py0 - y), ux = (px0 - x) / L, uy = (py0 - y) / L;
          const [sx, sy] = [x + ux * 2.3, y + uy * 2.3], [px, py] = [px0 - ux * 2.3, py0 - uy * 2.3];   // stop at the rims
          p.line([[sx, sy], [px, py]], .62, COL.cream);
          if (lt >= flipT(n)) {                                       // the AI creeps up toward the boss
            const g = ease(seg(lt, flipT(n), flipT(n) + BEAT * 1.5));
            p.line([[sx, sy], [lerp(sx, px, g), lerp(sy, py, g)]], .9, COL.orange);
          }
          if (busy) {
            const ph = frac(beat / 2 + hash(n, m + 3) * .5);
            if (ph < .8) p.hex(lerp(sx, px, ph / .8), lerp(sy, py, ph / .8), .9, lt >= flipT(n) ? COL.orange : COL.cream);
          }
        }
      });
      NODES.forEach(([x, y], n) => {
        const f = lt - flipT(n);
        if (f >= 0) {
          aiNode(p, x, y, seg(f, 0, .35), frac(beat / 8 + hash(n, 1)) < .06);
          if (f < .5) p.hexRing(x, y, 2.4 + 3 * easeOut(f / .5), .7, COL.orange, { dis: f / .5, seed: n });   // the tick
        }
        else humanNode(p, x, y, busy && frac(beat + hash(n, 2)) < .2);
      });

      // ---- the CEO at the top, behind the lectern
      const fear = seg(lt, 3, 7.2), dread = lt >= LINE.so;
      const pose = (() => {
        if (dread) return { armL: [2.4, .6], armR: [2.4, .6], face: 'shock', shake: .6 + seg(lt, LINE.so, YANK) * 1.2 };
        if (lt < QUIET0) { const up = 1 - pulse(s.t, 5); return { armR: [lerp(.7, 2.3, up), lerp(.3, .9, up)], armL: [1.1, .5] }; }
        const k = ease(seg(lt, QUIET0, QUIET0 + .6)), look = ease(seg(lt, LINE.said, LINE.said + .4)), drop = ease(seg(lt, 3.4, 4.4));
        return { armR: [lerp(lerp(1.5, 1.1, k), .45, drop), lerp(lerp(.6, .5, k), .2, drop)], armL: [lerp(1.1, .45, drop), lerp(.5, .2, drop)],
          head: .25 * look - .1 * fear, shake: fear * .3, face: fear > .5 ? 'shock' : 'dot' };
      })();
      if (lt < GONE) ceo(p, 0, FEET, { s: S, ...pose, t: s.t, dis: seg(lt, YANK, GONE), seed: 5 }, lt < YANK, lt < QUIET0);
      lectern(p, lt >= APEX_T ? COL.orange : COL.cream);
      // the apex rings out when the AI arrives at the top
      if (lt >= APEX_T && lt < APEX_T + .6) p.hexRing(APEX[0], APEX[1], 3 + 5 * easeOut(seg(lt, APEX_T, APEX_T + .6)), .8, COL.orange, { dis: seg(lt, APEX_T, APEX_T + .6), seed: 4 });

      chart(p, quiet ? beatPos(VERSE_T[8] + QUIET0) : beat, lt >= APEX_T ? lt - APEX_T : -1);

      // ---- the beach: offered on "go rest instead", and where the CEO ends up (for good)
      beach(p, seg(lt, 5.9, 6.5));
      const lounge = { s: S, legL: [Math.PI / 2, 0], legR: [Math.PI / 2, 0], lean: -.45, armL: [.1, .5], armR: [.6, 1.5] };
      if (lt > YANK + .5 && lt < LINE.now + .3) {
        const inK = seg(lt, YANK + .5, GONE + .1), outK = seg(lt, 10.6, LINE.now + .3);
        ceo(p, SIT[0], SIT[1] + 4.6 * S, { ...lounge, face: 'shock', shake: .45, t: s.t, dis: Math.max(1 - inK, outK), seed: 8 }, false, false, false);
      }
      const ghostA = .9 * seg(lt, 10.8, 12.4) * (1 - seg(lt, 40, 45));
      if (ghostA > 0) worker(p, SIT[0], SIT[1] + 4.6 * S, { ...lounge, pts: true, a: ghostA, face: 'none' });

      // ---- the AI: pops up at the side, watches the climb, then takes the chair (and the crown)
      if (s.ai > 0) {
        const slide = ease(seg(lt, 9.2, 9.9));
        const ax = lerp(21, TOP_AI[0], slide), ay = lerp(-2, TOP_AI[1], slide) - Math.sin(slide * Math.PI) * 3;
        const mood = lt < 4.6 ? 'smile' : lt < 6 ? 'grin' : lt < 9.2 ? 'smug' : lt < 12.5 ? 'grin' : (frac(beat / 16) < .06 ? 'closed' : 'smug');
        aiFace(p, ax, ay, 5, { pop: s.ai, mood, look: lt < 9.2 ? -1 : 0 });
      }
      // the crown hovers where the CEO's head was, then drops onto the AI
      if (lt >= YANK) {
        const c0 = [0, FEET - (10.7 + 2.05) * S], drop = ease(seg(lt, 9.9, 10.3)), bob = (1 - drop) * Math.sin(lt * 5) * .3;
        crown(p, lerp(c0[0], TOP_AI[0], drop), lerp(c0[1] + bob, TOP_AI[1] - 5 * H + .2, drop), lerp(.85 * S, 1.3, drop), lt < 9.9 ? COL.cream : COL.orange);
      }
    },
  };
})();
