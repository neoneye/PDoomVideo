// PLACEHOLDER station 7: replace with the real scene.
(() => {
  STATIONS[7] = {
    quote: ['GENES', "I'VE READ"],
    draw(p, s) {
      workerLife(p, s, 0, 10.4, { exit: 'bow' });
      desk(p, 0, 6, 34);
    },
  };
})();
