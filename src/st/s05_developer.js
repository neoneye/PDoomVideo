// PLACEHOLDER station 4: replace with the real scene.
(() => {
  STATIONS[4] = {
    quote: ['PROMPT', 'INSTEAD'],
    draw(p, s) {
      workerLife(p, s, 0, 10.4, { exit: 'bow' });
      desk(p, 0, 6, 34);
    },
  };
})();
