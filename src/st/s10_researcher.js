// PLACEHOLDER station 9: replace with the real scene.
(() => {
  STATIONS[9] = {
    quote: ['STEPS', 'AHEAD'],
    draw(p, s) {
      workerLife(p, s, 0, 10.4, { exit: 'bow' });
      desk(p, 0, 6, 34);
    },
  };
})();
