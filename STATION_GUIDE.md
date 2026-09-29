# Station guide (read this before building a station)

The video is **Job Replacement**, a "ten little…" countdown song. Ten workers get replaced by AI one per verse, and each verse happens at its own **station**: one hexagonal TriangleDraw canvas in a honeycomb world. The spec is in `docs/superpowers/specs/2026-09-29-job-replacement-design.md`.

**Reference implementation: `src/st/s01_translator.js`. Read it first.**

## The look (non-negotiable)

- **Everything is triangles on the isometric lattice.** You never draw pixels. You paint shapes, and the engine switches on each triangle whose centroid falls inside them. That jaggedness *is* the style (Simon Strandgaard's TriangleDraw drawings: bold, graphic, two-tone, geometric).
- **Colors:** humans and their work in `COL.cream`, the AI and anything it makes in `COL.orange`. Background is empty (no cells). Use `COL.bg` only to cut dark features into solid shapes (eyes, windows). No other colors.
- Prefer lines along the three lattice directions: horizontal, ±60°. They come out crisp. Local lattice vertex (i, j) is `V(i, j)` = `[i + j/2, j*H]` (with `H` = √3/2). Other angles are fine but come out jagged, like a hand-made TriangleDraw piece.
- **Line widths:** `.62` gives TriangleDraw's thinnest zigzag line, `1.0–1.3` a solid band. Filled polygons read best.
- Keep it bold and readable at 1 unit ≈ 20 px. Details smaller than one triangle vanish.

## Station layout (local units, y down, origin = hex centre)

The canvas is a flat-topped hexagon of circumradius 30. The interior spans x ±30 at y = 0 and x ±15 at y = ±26; the edge is drawn for you.

| zone | where | notes |
|---|---|---|
| quote band | y −22 … −8 | During the quote (≈ lt 4.6 … 10) the director types the AI's boast here in orange, and knocks out anything underneath. Keep important things out of it, at least at that time. |
| AI cameo | default `ai: [21, -2]` | The orange hex face (radius 5) pops up here at lt ≈ 2.4. Override `ai` if your layout needs it; it must stay inside the hex. |
| numeral plate | default `numeral: [-20, -2]` | A dark hex plate with "N−1" appears at lt ≈ 11.5. Override it if it covers something important. |
| main stage | x −24 … 24, y −8 … 24 | The worker and the workplace. Put the floor around y = 18 and use the lower half too. |

## Timing (lt = seconds since the verse downbeat; verse ≈ 14.7 s; 130.5 BPM, beat 0.46 s)

| lt | lyric | what your station must show |
|---|---|---|
| < 0 | earlier verses | Visible in wide shots: the worker quietly working. Cheap is fine, but it must look right. |
| 0 – 2.4 | "There were N {at/in/on/doing} …" | The worker busy with the job: a looping, beat-synced work animation. |
| 2.4 – 4.6 | "and AI said:" | The director pops the AI face in. The worker can notice it (look over). |
| 4.6 – 7.4 | the AI's boast | **The AI does the job in orange**: bigger, faster, more perfect, clearly outclassing the human. This is the station's big visual moment. |
| 7.4 – 11.4 | "So the … {bowed their head / sighed and fled / left in dread / turned and fled}" | The worker's exit. Use `workerLife()` with the right `exit`, or a custom one that matches the lyric. |
| 11.1 – 12.5 | "and now there were N−1" | The director floods the station orange from the AI outward (cream cells turn orange) and shows the numeral. |
| > 12.5 | ever after | **The AI keeps running the workplace by itself**, in orange, looping. It's visible in wide shots until the end of the video, so keep it alive but calm. Ghost points of the worker stay where they worked (`workerLife` does this). |

`s.beat` is the beat position (a float) and `pulse(s.t, k)` is 1 on each beat and decays; use them so things move to the music. `s.quoteAt` doesn't exist; use `lt`.

## API

```js
// src/st/sNN_name.js
(() => {
  // private helpers
  STATIONS[k] = {
    quote: ['LINE ONE', 'LINE TWO'],      // the AI's boast, short, UPPERCASE, max ~9 chars per line reads best
    ai: [21, -2], numeral: [-20, -2],     // optional overrides
    quoteAt: 4.6,                         // optional: when the typing starts (lt); match the sung words
    draw(p, s) { ... },                   // paint the whole station; p is a Pen in the station frame
  };
})();
```

`s` = `{ k, t, lt, T, tile, beat, ai (0..1 cameo pop), taken (0..1 flood), n (workers at verse start) }`. `draw` must be a **pure function of s**: no `Math.random`, no state between frames. Use `hash(a, b, c)` for stable randomness.

**Pen** (`src/lattice.js`). All coordinates are local; `col` is `COL.cream`, `COL.orange` or `COL.bg`. Every call takes an options object `o`:
- `a`: alpha 0..1
- `dis`: dissolve 0..1, where triangles drop out by hash (great for appearing and disappearing triangle by triangle)
- `seed`
- `pts: true`: paint lattice points instead of triangles (ghosts)
- `erase: true`
- `mask: (lx, ly) => 0..1`: per-cell alpha, for wipes, reveals and ripples

Shapes:
- `p.poly(pts, col, o)`, `p.line(pts, w, col, o)` (open polyline), `p.loop(pts, w, col, o)` (closed)
- `p.rect(x, y, w, h, col, o)`, `p.hex(cx, cy, r, col, o)`, `p.hexRing(cx, cy, r, w, col, o)`, `p.disc(...)`, `p.ring(...)`
- `p.fill(shape, col, o)` with `Shape.poly / stroke / hex / hexRing / disc / ring / rect / union / diff / fn(bb, (x,y)=>bool)`

Sub-frames: `p.at(dx, dy, rot = 0, scale = 1)` returns a child pen. Rotations by multiples of `Math.PI/3` stay lattice-aligned.

**Text** (`src/font.js`): `text(p, 'STR', x, y, size, col, { align: 'center', show: nGlyphs, w, dis })`. (x, y) is the baseline start and letters lean 60°. `textWidth(str, size)`. At size 1 a glyph is ~5.2 tall; the smallest legible size is about .8.

**Cast** (`src/figures.js`):
- `worker(p, x, y, o)` draws a human (feet at x, y, ~12.5 tall at `s: 1`; use `s: 1.2` for the station's worker). Options:
  - `armL/armR: [shoulder, elbow]` (0 = hanging, + = outward and up)
  - `legL/legR`, `walk: phase`, `lean`, `head` (tilt), `face: 'dot' | 'sad' | 'shock'`, `flip`, `shake`
  - `hat(pen)`: head space, radius 1.75
  - `handL / handR(pen)`: at the hand, x axis along the forearm
- `workerLife(p, s, x, y, { exit: 'bow' | 'flee' | 'turn' | 'dread', fleeDir: ±1, pose: {...always}, work: lt => pose })` handles working, the exit on the lyric, and the ghost afterwards.
- `aiFace(p, x, y, r = 5, { mood: 'smile' | 'grin' | 'flat' | 'smug' | 'closed' | 'wink' | 'o', pop, look: -1..1 })`. Use r = 5, 10 or 15. The director already draws the cameo at `ai`; draw extra faces only if your scene wants them.
- Props: `desk(p, x, topY, w)` (legs 4.4 down), `monitor(p, x, bottomY, w, h)` returns the screen rect, `floor(p, y, x0, x1)`.
- `mandala(p, cx, cy, r, col, seed, grow, t)`: D6 hex pattern.

Paint order matters: later paint overrides earlier on the same triangle. Paint the worker before a desk that should hide their legs.

## Checking your work

```bash
node render.mjs --sheet=T+1,T+3.5,T+5.5,T+7,T+9,T+10.5,T+12,T+13.5,T+40 --cols=3 --out=out/sNN.jpg   # contact sheet at verse times (write real numbers)
node render.mjs --stills=T+6 --out=out/sNN                                                           # full-res PNG
node render.mjs --eval='JSON.stringify(stationState(3, 60))'                                         # poke at state
```

Verse downbeats T: 8.8, 23.8, 38.55, 53.3, 68.05, 82.85, 97.45, 112.15, 126.75, 141.2 (stations 0..9).

Look at the full-res stills, not just the sheet. Iterate until each beat reads clearly, the AI moment is spectacular, and the frame is balanced inside the hexagon. Keep frame time under ~150 ms.

Edit only your own station file(s). If a shared file needs a change, say so in your report instead.
