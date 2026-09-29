// Verse 5 · "There were six at the keys… I write the code, just prompt instead!" · the developer faces their dread.
(() => {
  const FLOOR = 18, DESK = FLOOR - 4.4, DX = -13;
  const E0 = LINE.so, E1 = LINE.now + .1;          // exit window
  // Screens: [x0, y0, x1, y1] outer rects, rows snapped to the lattice. MY = the developer's own monitor.
  const MY = [-5, 3 * H, 8, DESK - 1.8];              // the developer's monitor, on the desk
  const WALL = [-25, -7 * H, -6, 1 * H];                // the developer's wall screen: "</>" until the AI takes it
  const AI_SCR = [
    { r: [10, 5 * H, 21.5, DESK - 1.8], at: 3.9, stand: true, rate: 1.3 },   // on the desk, right
    { r: WALL, at: 4.36, rate: 1 },                                         // the wall screen, taken over
    { r: [6, -7 * H, 25, 1 * H], at: 4.82, rate: 1.6 },                     // floating, top right
  ];
  const PILE = [-5, 21.5];                                // the wall of code stacking up under the desk
  const snap = (x, y) => { const j = Math.round(y / H), i = Math.round(x - j / 2); return [i + j / 2, j * H]; };
  const inner = ([x0, y0, x1, y1]) => [x0 + .6, y0 + .6, x1 - .6, y1 - .6];

  // Indentation of code line c: little blocks that open and close.
  const indent = (c, seed) => {
    const b = Math.floor(c / 7), q = c % 7, h = hash(b, seed, 9);
    const shape = h < .33 ? [0, 1, 1, 2, 2, 1, 0] : h < .66 ? [0, 1, 2, 3, 2, 1, 1] : [1, 1, 2, 2, 2, 1, 0];
    return shape[q];
  };
  // Code rows inside rect r: one line per two lattice rows, lines `top`… Returns the end x of the last row drawn.
  // o.rows: how many rows to show from the top; o.cut: fraction of the last shown row that is typed.
  function code(p, r, top, col, seed, o = {}) {
    const [x0, y0, x1, y1] = inner(r), j0 = Math.ceil(y0 / H + .25), j1 = Math.floor(y1 / H) - 1;
    const rows = o.rows ?? 99; let endX = x0 + .6, endY = (j0 + .5) * H;
    for (let j = j0, n = 0; j <= j1 && n < rows; j += 2, n++) {
      const c = top + n, y = (j + .5) * H, last = n === rows - 1 && o.cut !== undefined;
      endY = y; endX = x0 + .6 + indent(c, seed) * 1.5;
      if (hash(c, seed, 1) < .1) continue;                                   // a blank line
      const end = x0 + .6 + (x1 - x0 - 1.2) * (.35 + .65 * hash(c, seed, 2));
      const lim = last ? lerp(endX, end, o.cut) : end;
      let x = endX;
      for (let t = 0; x < lim - .4 && t < 9; t++) {
        const e = Math.min(lim, end, x + 1 + Math.floor(hash(c, t, seed + 3) * 4));
        p.line([[x, y], [e, y]], .62, col, o); x = e + 1;
      }
      endX = x;
    }
    return [endX, endY];
  }
  // A screen whose whole face has become the AI: solid orange, two eyes and a flat mouth, looking at the developer.
  function stare(p, r, lt, o = {}) {
    const [x0, y0, x1, y1] = inner(r), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    p.rect(x0, y0, x1 - x0, y1 - y0, COL.orange, o);
    const [vx, vy] = snap(cx - 1, cy - H), blink = frac(lt * .7 + cx * .13) < .06;
    for (const ex of [-2, 2]) {
      if (blink) p.line([[vx + ex - 1, vy + H / 2], [vx + ex + 1, vy + H / 2]], .62, COL.bg, o);
      else p.hex(vx + ex, vy, 1, COL.bg, o);
    }
    p.line([[vx - 1.5, vy + 3.5 * H], [vx + 1.5, vy + 3.5 * H]], .62, COL.bg, o);
  }
  // The prompt: a big chevron and a blinking cursor. Once the AI is alone it types its own prompts.
  function prompt(p, r, s, k, o = {}) {
    const [x0, y0, x1, y1] = inner(r), by = Math.round((y1 - 1.6) / H) * H;
    text(p, '>', x0 + .6, by, .8, COL.orange, { ...o, dis: 1 - k, seed: 12 });
    if (k < 1) return;
    const words = Math.floor(o.words ?? 0); let x = x0 + 6;
    for (let n = 0; n < words && x < x1 - 2.5; n++) { const e = Math.min(x1 - 2.5, x + 1 + Math.floor(hash(n, o.seed ?? 3, 5) * 2)); p.line([[x, by - H / 2], [e, by - H / 2]], .62, COL.orange, o); x = e + 1; }
    if (frac(s.beat / 2) < .5) p.rect(x, by - H, 1.2, H, COL.orange, o);
  }
  const frame = (p, [x0, y0, x1, y1], col, o) => p.loop([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], .75, col, o);
  // The AI's output piles up under the desk as a wall of code bricks, filling each course right to left.
  function pile(p, n, shift, o = {}) {
    const [x0, x1] = PILE, jf = Math.floor(FLOOR / H);
    for (let m = 0; m < 2; m++) {
      const f = clamp(n - m), j = jf - 1 - 2 * m, y = (j + .5) * H, left = x1 - f * (x1 - x0);
      if (f <= 0) break;
      let x = x1 - (m % 2) * 1.5;
      for (let b = 0; x > left; b++) {
        const len = 2 + Math.floor(hash(b + Math.floor(shift) * (m + 1), m, 31) * 3), e = Math.max(left, x - len);
        if (x - e > .6) p.line([[e, y], [x, y]], .62, COL.orange, o);
        x = e - 1;
      }
    }
  }

  function developer(p, s) {
    const lt = s.lt, tap = lt > 2.8 && lt < 7.4 ? 0 : pulse(s.t, 5), side = Math.floor(s.beat) % 2;   // the hands freeze when it speaks
    const base = { s: 1.2, t: s.t };
    const typing = {
      armL: [.55 + (side ? tap * .15 : 0), -.95], armR: [.55 + (side ? 0 : tap * .15), -.95],
    };
    if (lt < E0) {
      // after the boast lands, the hands freeze over the keys
      const stop = seg(lt, 5.4, 5.8);
      worker(p, DX, FLOOR, { ...base, ...typing, armL: [lerp(typing.armL[0], .55, stop), -.95], armR: [lerp(typing.armR[0], .55, stop), -.95], face: lt > 4.6 ? 'shock' : 'dot' });
      return;
    }
    // the ghost appears as the body goes
    const gk = seg(lt, E0 + 1.8, E1 + .6);
    if (gk > 0) worker(p, DX, FLOOR, { ...base, armL: [.55, -.95], armR: [.55, -.95], pts: true, a: .9 * gk * (1 - seg(lt, 40, 45)), face: 'none' });
    if (lt >= E1) return;
    // facing the screens that now all stare back, the dread: arms come up, the trembling grows, and the triangles fall away
    const up = ease(seg(lt, E0 + .9, E0 + 1.8)), shake = seg(lt, E0 + .6, E1 - .6);
    worker(p, DX, FLOOR, {
      ...base, face: 'shock',
      armL: [lerp(.55, 2.3, up), lerp(-.95, .7, up)], armR: [lerp(.55, 2.5, up), lerp(-.95, .9, up)],
      shake: .15 + shake * 1.4, dis: easeIn(seg(lt, E0 + 2.1, E1)), seed: 5,
    });
  }

  STATIONS[4] = {
    worker: 'developer',
    quote: ['JUST', 'PROMPT'],
    quoteAt: 5.4,
    ai: [0, -4 * H],
    numeral: [0, -18 * H],
    draw(p, s) {
      const lt = s.lt, after = lt > LINE.now + 1.4;
      const dread = lt > E0 + .9 && lt < LINE.now + .9;
      // the AI's screens: they pop in on the boast and pour code
      for (const [n, sc] of AI_SCR.entries()) {
        const k = seg(lt, sc.at, sc.at + .35); if (k <= 0) continue;
        const [x0, y0, x1, y1] = sc.r, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
        if (k < 1) { const q = p.at(cx, cy, 0, backOut(k)); frame(q, [x0 - cx, y0 - cy, x1 - cx, y1 - cy], COL.orange); continue; }
        frame(p, sc.r, COL.orange);
        if (sc.stand) { p.line([[cx, y1], [cx, y1 + 1.6]], .8, COL.orange); p.line([[cx - 1.8, y1 + 1.7], [cx + 1.8, y1 + 1.7]], .7, COL.orange); }
        if (dread) { stare(p, sc.r, lt, { dis: 1 - seg(lt, E0 + .9 + n * .15, E0 + 1.2 + n * .15), seed: 20 + n }); continue; }
        // fast while it boasts, a calm one line per beat once it's alone
        const u = lt - sc.at - .35, fast = Math.min(u, E0 - sc.at) * 8 * sc.rate;
        const top = after ? Math.floor(s.beat * sc.rate) : Math.floor(fast);
        code(p, sc.r, top, COL.orange, 40 + n, { rows: after ? 99 : Math.floor(u * 22) + 1 });
      }
      // the developer's wall screen: a big "</>", until the AI takes it
      if (lt < AI_SCR[1].at) {
        frame(p, WALL, COL.cream);
        const cx = (WALL[0] + WALL[2]) / 2, by = WALL[3] - 1.5 * H;
        text(p, '</>', cx - 1, by, .9, COL.cream, { align: 'center' });
      }
      developer(p, s);
      // the wall of code under the desk: it grows while the AI boasts, then shuffles calmly
      if (lt > 4.2) pile(p, Math.min(2, (lt - 4.2) * .8), after ? s.beat / 4 : 0);
      desk(p, .5, DESK, 43);
      // the developer's own monitor
      monitor(p, (MY[0] + MY[2]) / 2, MY[3], MY[2] - MY[0], MY[3] - MY[1]);
      const pk = seg(lt, 5.6, 6.2);
      if (lt < 5.6) {
        // one line every four beats, one token a beat; a cursor blinks at the end
        const b = s.beat, line = Math.floor(b / 4), shown = Math.min(line, 4) + 1;
        const erase = seg(lt, 5.4, 5.6);
        const [ex, ey] = code(p, MY, Math.max(0, line - 4), COL.cream, 7, { rows: shown, cut: Math.floor(b % 4) / 4 + .25, dis: erase, seed: 8 });
        if (frac(b) < .55 && erase <= 0) p.rect(ex, ey - H / 2, .9, H, COL.cream);
      } else if (dread) {
        stare(p, MY, lt, { dis: 1 - seg(lt, E0 + .9, E0 + 1.2), seed: 19 });
      } else {
        prompt(p, MY, s, pk, { words: after ? (s.beat / 2) % 6 : 0, seed: Math.floor(s.beat / 12) });
      }
    },
  };
})();
