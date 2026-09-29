// Verse 3 · "There were eight on the phones… I answer calls, no need for Fred!" · the call center worker leaves in dread.
// Fred takes one call at a time in his cubicle while a ring of phones rings with a growing backlog. The AI pops up in
// the middle of the ring and answers every phone at once, Fred's own included, then keeps the switchboard humming.
(() => {
  const FLOOR = 18, DESK = FLOOR - 4.4, FX = -12;               // Fred's feet (integer x keeps his head crisp)
  const HUB = V(11, 4);                                         // [13, 3.46]: the AI sits in the middle of the phones
  const D = 9.5;                                                // ring radius of the phone wall
  const PS = 1.25;                                              // phone scale on the wall
  const DP = [-4, DESK - 1.4];                                  // Fred's desk phone
  // six phones in a ring round the hub, snapped to lattice vertices so they stay crisp
  const WALL = [0, 1, 2, 3, 4, 5].map(n => {
    const j = Math.round((HUB[1] + Math.sin(n * Math.PI / 3) * D) / H), x = HUB[0] + Math.cos(n * Math.PI / 3) * D;
    return [Math.round(x - j / 2) + j / 2, j * H];
  });

  // A desk phone pictogram, ~5 wide: handset (bar with ear and mouth pieces) on a trapezoid base with a dial.
  // (x, y) is the centre. lift raises and tilts the handset (answered).
  function phone(p, x, y, col, o = {}, lift = 0) {
    p.poly([[x - 1.5, y - .5], [x + 1.5, y - .5], [x + 2.4, y + 1.7], [x - 2.4, y + 1.7]], col, o);
    p.hex(x, y + .65, .6, null, { erase: true });
    const hy = y - 1.7 - lift;
    p.rect(x - 2.4, hy - .5, 4.8, .9, col, o);
    p.poly([[x - 2.6, hy - .5], [x - 1.3, hy - .5], [x - 1.5, hy + 1.1], [x - 2.7, hy + 1.1]], col, o);
    p.poly([[x + 2.6, hy - .5], [x + 1.3, hy - .5], [x + 1.5, hy + 1.1], [x + 2.7, hy + 1.1]], col, o);
  }
  // Ringing: short vibration strokes either side of a phone, flickering on the beat.
  function ringMarks(p, x, y, t, col, sc = 1, o = {}) {
    const k = frac(beatPos(t) * 2);
    if (k > .6) return;
    const r0 = 2.4 + k * .9;
    for (const [ax, ay] of [[-.5, -H], [.5, -H]]) {
      const cx = x, cy = y - 1.6 * sc, a = r0 * sc, b2 = (r0 + 1.2) * sc;
      p.line([[cx + ax * a, cy + ay * a], [cx + ax * b2, cy + ay * b2]], .62, col, o);
    }
  }
  const headset = hd => {
    hd.line([[-2.3, .1], [-2.3, -1.2], [-1.4, -2.6], [1.4, -2.6], [2.3, -1.2], [2.3, .1]], .8, COL.cream);
    hd.hex(-2.1, .1, .75, COL.cream); hd.hex(2.1, .1, .75, COL.cream);
    hd.line([[-2.1, .6], [-1.4, 2.3], [-.2, 2.3]], .5, COL.cream);
    hd.hex(.1, 2.3, .45, COL.cream);
  };

  STATIONS[2] = {
    worker: 'call center',
    quote: ['NO NEED', 'FOR FRED'],
    quoteAt: 5.2,
    ai: HUB,
    aiLook: lt => lt < 4.5 ? -1 : lt < 7.4 ? 0 : -1,
    aiMood: lt => lt < 4.4 ? 'smile' : lt < 7.4 ? 'grin' : 'smug',
    draw(p, s) {
      const lt = s.lt, t = s.t, b = s.beat;
      const ans = 4.6;                                          // the AI answers everything at once, on the beat
      const wave = seg(lt, ans - .1, ans + .35);                // the answer wave rushing out of the hub
      const calm = seg(lt, 12, 14);
      const reached = (x, y) => wave * 20 >= Math.hypot(x - HUB[0], y - HUB[1]);

      // ---- the phones ---------------------------------------------------------------------------------------
      // before the AI: the backlog grows, more and more phones ringing for a single Fred
      const ringing = Math.min(6, 2 + Math.floor(clamp((lt + 6) / 1.8, 0, 99)));
      const order = [3, 0, 5, 1, 4, 2];
      WALL.forEach(([x, y], n) => {
        const q = p.at(x, y, 0, PS);
        if (!reached(x, y)) {
          const on = order.indexOf(n) < ringing, jig = on ? (Math.floor(t * 14 + n) % 2 ? .15 : -.15) : 0;
          phone(q, jig, 0, COL.cream);
          if (on) ringMarks(p, x, y, t + n * BEAT / 3, COL.cream, PS);
        } else {
          // answered: every phone at once turns orange, and the AI talks on every line (Fred managed one)
          phone(q, 0, 0, COL.orange);
          const ox = Math.cos(n * Math.PI / 3), oy = Math.sin(n * Math.PI / 3);
          if (lt > ans + .25) for (let m = 0; m < 3; m++) {
            if (frac(b * lerp(2, .5, calm) + m * .33 + n * .17) > .55) continue;
            const r = 4.3 + m * 1.2, tx = x + ox * r - .5, ty = y - .6 + oy * r * .8;
            p.poly([[tx, ty + H / 2], [tx + 1, ty + H / 2], [tx + .5, ty - H / 2]], COL.orange);
          }
          // spokes: the AI is wired into every phone
          const dx = x - HUB[0], dy = y - HUB[1], L = Math.hypot(dx, dy);
          p.line([[HUB[0] + dx / L * 5, HUB[1] + dy / L * 5], [HUB[0] + dx / L * (L - 3.4), HUB[1] + dy / L * (L - 3.4)]], .62, COL.orange);
        }
      });
      // the answer wave and, afterwards, a slow pulse from the hub (one per beat while boasting, one per bar alone)
      if (wave > 0 && wave < 1) p.hexRing(HUB[0], HUB[1], 5 + wave * 17, .9, COL.orange, { dis: wave * .7, seed: 3 });
      if (lt > ans + .4) {
        const per = lerp(1, 4, calm), k = frac((b - .1) / per);
        p.hexRing(HUB[0], HUB[1], 5.6 + k * 12, .62, COL.orange, { dis: .2 + .8 * k, seed: 4 + Math.floor(b / per) });
      }
      // the long spoke that steals Fred's own call
      const dpx = DP[0], dpy = DP[1] - 1, dx = dpx - HUB[0], dy = dpy - HUB[1], L = Math.hypot(dx, dy);
      const reach = seg(lt, ans + .05, ans + .45) * (L - 8.5);
      if (reach > 0) {
        p.line([[HUB[0] + dx / L * 5, HUB[1] + dy / L * 5], [HUB[0] + dx / L * (5 + reach), HUB[1] + dy / L * (5 + reach)]], .9, COL.orange);
      }
      const deskGot = reach >= L - 8.6;

      // ---- Fred ------------------------------------------------------------------------------------------------
      // a 4-beat call cycle: it rings, he picks up (hand to the phone), then talks for three beats
      const cyc = frac(b / 4), talking = lt < ans && cyc > .25;
      workerLife(p, s, FX, FLOOR, {
        exit: 'dread',
        pose: { s: 1.2, hat: headset },
        ghostPose: { hat: undefined },                          // the ghost is points only, no solid headset
        work: l => {
          if (l >= ans) return { armL: [.5, .6], armR: [.7, .4], face: 'dot' };   // frozen, watching his calls go
          const pick = cyc > .18 && cyc < .34;
          return { armL: [.25, .5], armR: pick ? [1.25, -.2] : [.55 + .1 * pulse(t, 5), 1.1] };
        },
      });
      // talk marks by the mic while he's on a call
      if (talking && lt < LINE.so) for (let n = 0; n < 3; n++) {
        if (frac(b * 2 + n * .33) > .55) continue;
        const [tx, ty] = [FX + 3.4 + n * 1.3, 5.8 - n * .9];
        p.poly([[tx, ty], [tx + 1, ty], [tx + .5, ty - H]], COL.cream);
      }
      desk(p, FX + .5, DESK, 18);
      // his own phone: rings in cream every call cycle until the AI takes that call too
      if (!deskGot) {
        const ring = cyc < .2 && lt < ans;
        phone(p, DP[0] + (ring ? (Math.floor(t * 14) % 2 ? .15 : -.15) : 0), DP[1], COL.cream, {}, talking ? .5 : 0);
        if (ring) ringMarks(p, DP[0], DP[1], t, COL.cream, 1);
      } else phone(p, DP[0], DP[1], COL.orange, {}, .5);

      // ---- the name sign over the cubicle -------------------------------------------------------------------
      // size 2/3 with a baseline on a lattice row keeps the letters' horizontal strokes crisp
      const signOut = seg(lt, 9.8, 10.9), SY = -2 * H, SX = FX + .5;
      if (signOut < 1) {
        const so = { dis: signOut, seed: 31 };
        p.line([[SX - 12, SY + 1.3], [SX + 11, SY + 1.3]], .8, COL.cream, so);
        // "no need for Fred": the name flickers while the AI says it, then is wiped out triangle by triangle
        const wipe = seg(lt, 8.0, 9.6), flick = lt > 5.6 && lt < 8 && Math.floor(t * 9) % 4 === 0;
        if (!flick) text(p, 'FRED', SX - 1.4, SY, 1, COL.cream, { align: 'center', w: .9, dis: Math.max(wipe, signOut), seed: 32 });
      }
      // …and once the countdown plate has gone, the sign comes back with the new occupant's name
      const aiSign = seg(lt, 17.4, 18.4);
      if (aiSign > 0) {
        const so = { dis: 1 - aiSign, seed: 33 };
        p.line([[SX - 7, SY + 1.3], [SX + 6, SY + 1.3]], .8, COL.orange, so);
        text(p, 'AI', SX - 1.4, SY, 1, COL.orange, { align: 'center', w: .9, dis: 1 - aiSign, seed: 34 });
      }
    },
  };
})();
