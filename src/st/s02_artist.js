// Verse 2 · "There were nine making art… I paint and draw what's in your head!" · the artist sighs and flees.
// The artist dabs a small hex mandala onto an easel, copying the idea in their thought bubble. The AI reads
// the bubble, lifts the idea out of their head and blows it up into a huge, perfect orange mandala.
(() => {
  const FLOOR = 18, AX = -15;                         // artist's feet
  const SEED = 1;                                   // the mandala design (same idea in bubble, canvas and AI copy)
  const CAN = V(-10, 8);                            // the artist's canvas centre ([-6, 6.9]), a lattice vertex
  const BUB = V(-7, -9), BUB_R = 5.2;               // thought bubble centre ([-11.5, -7.8]) and its idea's radius
  const BIG = V(7, 8), BIG_S = 2.0, BIG_R = BUB_R;  // the AI's canvas ([11, 6.9]): the bubble's idea scaled up
  const AI = [21, -6.062];
  const COPY_SEEDS = [12, 29, 17, 31, 23, 44];      // variations with busy inner rings

  // Paint into a scratch layer, then copy only the cells inside the station hex (so runners vanish at the edge).
  function clipped(p, fn, r = R_HEX - .6) {
    const tmp = new Layer(); fn(new Pen(tmp, p.x, p.y, p.r, p.s));
    const inside = Shape.hex(0, 0, r);
    for (const [key, code] of tmp.cells) {
      const [wx, wy] = cellCenter(key), [lx, ly] = p.toLocal(wx, wy);
      if (inside.has(lx, ly)) p.L.put(p.L.cells, key, tmp.cols[Math.floor(code / 1024)], (code % 1024) / 1023);
    }
  }
  const beret = hd => {
    hd.poly([[-2.6, -1.3], [2.4, -1.3], [1.7, -2.4], [-1.4, -2.4]], COL.cream);
    hd.line([[.2, -2.3], [.2, -3.2]], .55, COL.cream);
  };
  const brush = h => { h.line([[0, 0], [1.9, 0]], .5, COL.cream); h.hex(2.3, 0, .5, COL.cream); };

  // The artist's pose while painting: brush arm dabs on the beat, head glances at the idea now and then.
  function paintPose(s) {
    const lt = s.lt, dab = pulse(s.t, 7), b = s.beat;
        if (lt > 4.7) return { armR: [1.35, .1], armL: [.2, 0], hat: beret, handR: brush };
    return { armR: [1.72 + wob(b, .5) * .12, .35 - dab * .3], armL: [.35, .6], hat: beret, handR: brush };
  }

  function easel(p, c, r, col, o = {}) {
    const [cx, cy] = c;
    const by = cy + r * H + .6;
    p.line([[cx - 1.6, by], [cx - 3, FLOOR + .3]], .75, col, o);
    p.line([[cx + 1.6, by], [cx + 3, FLOOR + .3]], .75, col, o);
    p.hexRing(cx, cy, r, .7, col, o);
    p.line([[cx - r * .8, by], [cx + r * .8, by]], .9, col, o);
  }

  STATIONS[1] = {
    worker: 'artist',
    quote: ["WHAT'S IN", 'YOUR HEAD'],
    quoteAt: 5.3,
    ai: AI,
    aiLook: lt => lt < 6 ? -1 : 0,
    aiMood: lt => lt < 4.3 ? 'smile' : lt < 7.4 ? 'smug' : 'grin',
    draw(p, s) {
      const lt = s.lt, b = s.beat;
      const steal = seg(lt, 4.3, 4.75), fly = seg(lt, 4.75, 5.3), bloom = seg(lt, 5.3, 6.2);

      // ---- the artist's own canvas: the idea, half painted, one dab per beat --------------------------
      easel(p, CAN, 4.4, COL.cream);
      const done = lt < 4.7 ? clamp(.45 + .5 * seg(lt, -16, 4.7)) : .95;
      const post = seg(lt, 13.5, 14.5);
      if (post < 1) mandala(p, CAN[0], CAN[1], 3.5, COL.cream, SEED, done, 0, { dis: post, seed: 5 });
      // after the takeover the AI paints on the abandoned easel too, a fresh design every two bars
      if (lt > 13.5) {
        const bar = Math.floor((b - 1) / 8), g = seg(frac((b - 1) / 8), 0, .25);
        mandala(p, CAN[0], CAN[1], 3.5, COL.orange, 40 + bar % 5, Math.min(g, seg(lt, 13.5, 14.5)), 0);
      }

      // ---- the artist ------------------------------------------------------------------------------------
      const e0 = LINE.so + .2, sigh1 = e0 + .45, sigh2 = e0 + 1.25, e1 = LINE.now + .1;
      const pose = { s: 1.2, t: s.t, ...paintPose(s) };
      if (lt < e0) worker(p, AX, FLOOR, pose);
      else {
        const gk = seg(lt, e0 + .6, e1 + .6);
        if (gk > 0) worker(p, AX, FLOOR, { s: 1.2, armR: [1.72, .35], armL: [.35, .6], pts: true, a: .9 * gk * (1 - seg(lt, 40, 45)), face: 'none' });
        if (lt < sigh2) {
          // the sigh: shoulders lift, then everything drops
          const up = ease(seg(lt, e0, sigh1)), dn = ease(seg(lt, sigh1, sigh2));
          worker(p, AX, FLOOR + dn * .6 - up * .4 * (1 - dn), {
            s: 1.2, hat: beret, face: 'sad', head: lerp(-.2 * up, .45, dn), lean: dn * .12,
            armR: [lerp(1.35, .45, up) * (1 - dn) + dn * -.05, .1 * (1 - dn)], armL: [lerp(.2, .45, up) * (1 - dn) - dn * .05, 0],
          });
          // a little sigh puff drifting up out of the mouth
          const pf = seg(lt, sigh1 - .1, sigh2 + .2);
          if (pf > 0 && pf < 1) for (let n = 0; n < 3; n++) {
            const k = clamp(pf * 1.6 - n * .3);
            if (k > 0 && k < 1) p.hex(AX + 2.2 + k * 3 + n * 1.2, FLOOR - 12.5 - k * 3.5 - n * 1.2, .8 + n * .3, COL.cream, { dis: easeIn(k) });
          }
        } else if (lt < e1) {
          const run = easeIn(seg(lt, sigh2, e1 - .2));
          clipped(p, q => worker(q, AX - run * 22, FLOOR, { s: 1.2, hat: beret, walk: lt * 2.2, flip: -1, face: 'sad', lean: -.15, head: .3, dis: seg(lt, e1 - .5, e1), seed: 8 }));
          // the brush is left behind on the floor
        }
        if (lt >= sigh2) p.line([[AX + 3, FLOOR + .2], [AX + 5.6, FLOOR - .3]], .55, COL.cream, { dis: seg(lt, 40, 45) });
      }

      // ---- the thought bubble: the idea the artist is trying to paint ---------------------------------
      const bubOut = seg(lt, 5.2, 6.2);
      if (bubOut < 1) {
        const bo = { dis: bubOut, seed: 12 };
        p.hexRing(BUB[0], BUB[1], BUB_R + 1.4, .65, COL.cream, bo);
        p.hex(-11.2, .2, .85, COL.cream, bo);
        p.hex(-12.3, 2.0, .5, COL.cream, bo);
        // the AI reads it: its copy turns orange from the right, then leaves the bubble empty
        if (lt < 4.75) mandala(p, BUB[0], BUB[1], BUB_R, COL.cream, SEED, 1, 0, { mask: steal > 0 ? (x => x < lerp(BUB[0] + 6, BUB[0] - 6, steal) ? 1 : 0) : undefined });
        if (steal > 0 && lt < 4.75) mandala(p, BUB[0], BUB[1], BUB_R, COL.orange, SEED, 1, 0, { mask: x => x >= lerp(BUB[0] + 6, BUB[0] - 6, steal) ? 1 : 0 });
      }
      // the AI's scan beam: a dashed orange line from its face to the bubble
      const beam = seg(lt, 4.0, 4.4), beamOut = seg(lt, 4.75, 5.1);
      if (beam > 0 && beamOut < 1) {
        const [ax, ay] = [AI[0] - 5, AI[1]], [bx, by] = [BUB[0] + BUB_R + 1.8, BUB[1]];
        for (let n = 0; n < 9; n++) {
          const k0 = n / 9, k1 = k0 + .06 + .02 * Math.sin(s.t * 20 + n);
          if (k0 > beam || k0 < beamOut) continue;
          p.line([[lerp(ax, bx, k0), lerp(ay, by, k0)], [lerp(ax, bx, k1), lerp(ay, by, k1)]], .7, COL.orange);
        }
      }

      // ---- the AI's version: the idea lifted out of the head, flown across and blown up ---------------
      if (fly > 0 && bloom <= 0) {
        const k = easeInOut(fly), sc = lerp(1, BIG_S, k);
        const q = p.at(lerp(BUB[0], BIG[0], k), lerp(BUB[1], BIG[1], k), 0, sc);
        mandala(q, 0, 0, BIG_R, COL.orange, SEED, 1, 0);
      }
      if (bloom > 0) {
        const q = p.at(BIG[0], BIG[1], 0, BIG_S);
        // rings step outward on every beat (one band per beat during the boast, one per bar once alone)
        const calm = seg(lt, 11, 13), bb = b - (VERSE_T[1] + 5.3 - BEAT0) / BEAT;
        const stepB = floor4 => Math.floor(floor4) + ease(seg(frac(floor4), 0, .35));
        const slide = lerp(stepB(bb) * 1.5 / 1.1, stepB(bb / 4) * 1.5 / 1.1 + 2, calm);
        const bigR = BIG_R * (1 + (1 - calm) * .06 * pulse(s.t, 5));
        mandala(q, 0, 0, bigR, COL.orange, SEED, bloom < 1 ? .2 + .8 * bloom : 1, lt < 6.2 ? 0 : slide);
        // the AI's frame and easel, far bigger than the artist's
        const fr = { dis: 1 - seg(lt, 5.3, 5.9), seed: 21 };
        p.hexRing(BIG[0], BIG[1], BIG_R * BIG_S + 1.5, 1.0, COL.orange, fr);
        const [cx, cy] = BIG, br = BIG_R * BIG_S + 1.5;
        // …then it mass-produces variations along the bottom, one per beat
        for (let n = 0; n < 4; n++) {
          const at = 6.25 + n * BEAT, g = seg(lt, at, at + .3);
          if (g <= 0) continue;
          const [mx, my] = V(-23 + n * 7, 25), cyc = lt > 13 ? Math.floor((b + n * 3) / 16) : 0;
          p.hexRing(mx, my, 3.0, .65, COL.orange, { dis: 1 - g, seed: 70 + n });
          mandala(p, mx, my, 2.2, COL.orange, COPY_SEEDS[(n + cyc) % COPY_SEEDS.length], g, 0);
        }
        // a flash ring when it lands
        const fl = seg(lt, 5.3, 5.9);
        if (fl > 0 && fl < 1) p.hexRing(cx, cy, br + 1 + fl * 8, .7, COL.orange, { dis: fl });
      }
    },
  };
})();
