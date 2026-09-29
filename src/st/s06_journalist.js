// PLACEHOLDER station 5: replace with the real scene.
(() => {
  STATIONS[5] = {
    quote: ['FACTS', 'ARE FED'],
    draw(p, s) {
      workerLife(p, s, 0, 10.4, { exit: 'bow' });
      desk(p, 0, 6, 34);
    },
  };
})();
