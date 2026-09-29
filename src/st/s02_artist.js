// PLACEHOLDER station 1: replace with the real scene.
(() => {
  STATIONS[1] = {
    quote: ['PAINT & DRAW'],
    draw(p, s) {
      workerLife(p, s, 0, 10.4, { exit: 'bow' });
      desk(p, 0, 6, 34);
    },
  };
})();
