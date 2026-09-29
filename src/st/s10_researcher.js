// Verse 10 · the centre tile · "There was one in the lab… I research AI — I'm steps ahead!" · the researcher bows.
// This is where the AI is born (the intro opens on this monitor) and where it grows up: every station it takes
// adds a light to its screen, and in the last verse it climbs out of the monitor in ever bigger steps.
(() => {
  const FLOOR = 18, DESK = FLOOR - 4.4, MON = [9, DESK - 1.6], SCR = [9, DESK - 7.6];   // monitor base, screen centre

  // How many stations the AI has taken by time t (0..10).
  const takenBy = t => VERSE_T.filter(T => t >= T + LINE.now).length;

  // The researcher's diagram: a triangular graph whose edges run along lattice lines, so it stays crisp.
  // Rows of 1, 2, 3, 4 nodes (a triangle number, fittingly), `grow` 0..1 reveals it row by row.
  function net(p, x, y, sc, col, o = {}, grow = 1) {
    const q = p.at(x, y, 0, sc), node = (a, b) => [3 * a - 1.5 * b, 3 * H * b];   // row b, slot a: a lattice vertex
    for (let b = 0; b < 4; b++) {
      if (grow <= b / 4) break;
      for (let a = 0; a <= b; a++) {
        const [nx, ny] = node(a, b);
        if (a < b) q.line([[nx, ny], node(a + 1, b)], .62, col, o);
        if (b < 3 && grow > (b + 1) / 4) { q.line([[nx, ny], node(a, b + 1)], .62, col, o); q.line([[nx, ny], node(a + 1, b + 1)], .62, col, o); }
        q.hex(nx, ny, 1, col, o);
      }
    }
  }

  STATIONS[9] = {
    worker: 'AI researcher',
    quote: ['STEPS', 'AHEAD'],
    quoteAt: 5.2,
    ai: SCR,
    ownAI: true,
    numeral: [-19, -6],
    draw(p, s) {
      const lt = s.lt, t = s.t, tap = pulse(t, 5);
      // whiteboard with the network that started it all
      p.loop([[-25, -6], [-7, -6], [-7, 5], [-25, 5]], .62, COL.cream);
      net(p, -16, -4.4, 1, lt > LINE.quote + 1 && lt < 60 ? COL.orange : COL.cream, {}, 1);
      // the researcher (their legs hide behind the desk)
      workerLife(p, s, -3, FLOOR, {
        exit: 'bow', pose: { s: 1.2 },
        work: t2 => {
          const typing = lt < LINE.said || lt > 60;
          return typing ? { armR: [1.1 + tap * .12, 1.05], armL: [.35, .3], head: .15 }
                        : { armR: [1.0, 1.1], armL: [.2, .1], head: .3 + .1 * wob(t, .8) };
        },
      });
      desk(p, 3, DESK, 34);
      const [sx0, sy0, sx1, sy1] = monitor(p, MON[0], MON[1], 17, 12.5);

      // the AI on the screen
      const boot = seg(t, .6, 2.2), taken = takenBy(t);
      const mood = t < 2.4 ? 'closed' : t < 2.9 ? 'wink' : lt > LINE.quote && lt < 20 ? 'grin' : lt > 0 && lt < LINE.quote ? 'smug' : 'smile';
      const look = lt > -30 && lt < 0 ? 0 : (lt >= 0 && lt < 2 ? -1 : 0);
      if (lt < LINE.quote) aiFace(p, SCR[0], SCR[1], 5, { mood, look, dis: 1 - boot, seed: 5, a: 1 });
      // one light per station taken, along the bottom of the screen
      for (let n = 0; n < taken && n < 10; n++) p.hex(sx0 + 1.2 + n * 1.45, sy1 - .6, .55, COL.orange);

      // verse 10: "steps ahead": each step a bigger AI. Screen (r5) → beside the monitor (r10) → the whole centre (r15).
      const k10 = seg(lt, 8.4, 9.2), k15 = seg(lt, 13.0, 13.9);
      if (lt >= LINE.quote && k15 < 1) aiFace(p, SCR[0], SCR[1], 5, { mood: 'grin', look: -1, dis: k10 > 0 ? 1 : 0 });
      if (k10 > 0 && k15 < 1) aiFace(p, 15, -3, 10, { pop: k10, mood: 'grin', look: -1, dis: easeIn(k15) });
      if (k15 > 0) aiFace(p, 5.5, -1, 15, { pop: k15, mood: t > OUTRO_T + 2 ? (frac(t / 3.3) < .08 ? 'closed' : 'smile') : 'grin' });
    },
  };
})();
