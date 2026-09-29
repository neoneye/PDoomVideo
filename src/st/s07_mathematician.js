// PLACEHOLDER station 6: replace with the real scene.
(() => {
  STATIONS[6] = {
    quote: ['THEOREMS'],
    draw(p, s) {
      workerLife(p, s, 0, 10.4, { exit: 'bow' });
      desk(p, 0, 6, 34);
    },
  };
})();
