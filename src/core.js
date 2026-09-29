// core.js: math, easing, palette and song timing. Everything is a pure function of song time t.
const TAU = Math.PI * 2, SQ3 = Math.sqrt(3), H = SQ3 / 2;
const W = 1920, HGT = 1080, FPS = 30, DUR = 169.2;

const COL = {
  bg: '#0b0c14',       // navy black, from "reflection 1"
  cream: '#f2efe4',    // humans and their work
  orange: '#ff6a1a',   // the AI and everything it has taken
  dim: '#2b2d3d',      // hex canvas borders
  dot: '#8a8a96',      // lattice points
};

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const frac = x => x - Math.floor(x);
const ease = k => (k = clamp(k), k * k * (3 - 2 * k));
const easeIn = k => (k = clamp(k), k * k * k);
const easeOut = k => (k = clamp(k), 1 - (1 - k) ** 3);
const easeInOut = k => (k = clamp(k), k < .5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);
const backOut = k => { k = clamp(k); const c = 1.9; return 1 + (c + 1) * (k - 1) ** 3 + c * (k - 1) ** 2; };
const elasticOut = k => { k = clamp(k); return k === 0 || k === 1 ? k : 2 ** (-10 * k) * Math.sin((k * 10 - .75) * TAU / 3) + 1; };
const seg = (t, a, b) => clamp((t - a) / (b - a));
const wob = (t, f = 1, ph = 0) => Math.sin((t * f + ph) * TAU);

// Keyframes: kf(t, [[t0, v0], [t1, v1], ...], easeFn). Values may be numbers or arrays.
function kf(t, keys, fn = ease) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i];
    if (t <= t1) {
      const [t0, v0] = keys[i - 1], k = fn((t - t0) / (t1 - t0));
      return Array.isArray(v0) ? v0.map((a, n) => lerp(a, v1[n], k)) : lerp(v0, v1, k);
    }
  }
  return keys[keys.length - 1][1];
}

// Stable pseudo-random in [0, 1) from integers.
function hash(a, b = 0, c = 0) {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// ---- song timing -------------------------------------------------------------------------
// 130.5 BPM; beat phase from onset autocorrelation of the instrumental stem.
const BPM = 130.5, BEAT = 60 / BPM, BEAT0 = 0.106;
const beatPos = t => (t - BEAT0) / BEAT;
const pulse = (t, k = 6) => Math.exp(-k * frac(beatPos(t)));             // 1 on each beat, decays
const barPulse = (t, k = 3) => Math.exp(-k * frac(beatPos(t) / 4));

// Verse downbeats, from gaps in the isolated vocal. Each verse is 8 bars (~14.7 s), four lines of 2 bars.
const VERSE_T = [8.8, 23.8, 38.55, 53.3, 68.05, 82.85, 97.45, 112.15, 126.75, 141.2];
const OUTRO_T = 155.6;
// Line starts inside a verse (seconds since the verse downbeat).
const LINE = { there: 0, said: 2.4, quote: 3.7, so: 7.4, now: 11.1, num: 12.4, end: 14.7 };

function verseAt(t) {
  let k = -1;
  for (let i = 0; i < VERSE_T.length; i++) if (t >= VERSE_T[i]) k = i;
  return { k, lt: k < 0 ? t : t - VERSE_T[k] };
}
