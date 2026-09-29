// PLACEHOLDER station 8: replace with the real scene.
(() => {
  STATIONS[8] = {
    quote: ['GO REST', 'INSTEAD'],
    draw(p, s) {
      workerLife(p, s, 0, 10.4, { exit: 'bow' });
      desk(p, 0, 6, 34);
    },
  };
})();
