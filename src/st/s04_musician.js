// PLACEHOLDER station 3: replace with the real scene.
(() => {
  STATIONS[3] = {
    quote: ['I WRITE', 'THE TUNES'],
    draw(p, s) {
      workerLife(p, s, 0, 10.4, { exit: 'bow' });
      desk(p, 0, 6, 34);
    },
  };
})();
