// PLACEHOLDER station 2: replace with the real scene.
(() => {
  STATIONS[2] = {
    quote: ['NO NEED', 'FOR FRED'],
    draw(p, s) {
      workerLife(p, s, 0, 10.4, { exit: 'bow' });
      desk(p, 0, 6, 34);
    },
  };
})();
