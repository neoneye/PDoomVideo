# Job Replacement: music video design

Song: `assets/music.wav` ("Job Replacement", 169.2 s, ~130.5 BPM). Lyrics: `assets/lyrics.txt`.
Visual language: Simon Strandgaard's TriangleDraw drawings. Every shape snaps to an isometric triangle lattice, two-tone, inside hexagonal canvases.

## Decisions (from the brainstorm)

- **Palette:** background `#0b0c14`, humans and their work in cream `#f2efe4`, and **the AI plus everything it takes over in signal orange `#ff6a1a`**. Orange spreads through the world as the video goes on.
- **Lyrics** are not subtitles. Only key words (the AI's boast and the countdown numerals) are drawn into the lattice as triangle lettering.
- **All motifs are new and procedural** in the drawings' style. The gallery images are not sampled.
- **One continuous lattice world.** The camera can rotate the grid, zoom in and out, and show or hide the vertex points.
- **Code** replaces the P(doom) video in this repo, keeping the same shape: `studio.html`, `render.mjs`, `src/`.

## The world

A honeycomb of 11 hexagonal "TriangleDraw canvases", flat-topped and of lattice radius R. Hexes of integer radius tile exactly on the lattice.

- **Centre:** the AI researcher's lab. The AI is born here as a small orange hex face on a monitor.
- **Ring 1:** six stations (verses 1–6), visited in order around the ring. Each is rotated so its "up" points away from the centre, so neighbouring stations differ by 60° and the camera **rotates 60°** at each move.
- **Ring 2 corners:** verses 7 (mathematician), 8 (biologist) and 9 (CEO, "at the top", the top-most tile).
- **Verse 10** returns to the centre.

## Verse template (14.7 s = 8 bars, 4 lines of 2 bars each)

| rel. time | lyric | action |
|---|---|---|
| 0–2.5 | "There were N at the …" | The camera arrives (rotate and zoom) and the worker loops their work animation |
| 2.5–3.7 | "and AI said:" | An orange network creeps along the lattice lines from the centre, and the orange hex face pops up beside the worker |
| 3.7–7.4 | the AI's boast | The AI does the job in orange, bigger and faster. Keywords appear in orange triangle lettering |
| 7.4–11.1 | "So the … bowed / fled / left in dread" | The worker acts it out: bows, walks off, or shivers and glitches |
| 11.1–14.7 | "and now there were N−1" | The worker becomes a **ghost of grid points** and the station floods orange. A big cream numeral N−1 builds, then the camera pulls out, rotates and moves to the next station |

## Stations

| verse | start | worker | motif |
|---|---|---|---|
| 1 | 8.8 | translator | Desk; two scripts flow, Latin ↔ sheared triangle glyphs |
| 2 | 23.8 | artist | Easel with a hex mandala; the AI paints a bigger one instantly |
| 3 | 38.55 | call center | Headset; rings as concentric hex waves |
| 4 | 53.3 | musician | Keyboard; triangle notes on a staff |
| 5 | 68.05 | developer | Monitor, `{ }`, scrolling code rows |
| 6 | 82.85 | journalist | Newspaper columns and a headline; slower motion in the instrumental dip (84–89) |
| 7 | 97.45 | mathematician | A proof built from triangle numbers; freeze-frames on the silent hits at ~106 and ~108 |
| 8 | 112.15 | biologist | DNA double helix |
| 9 | 126.75 | CEO | Org-chart pyramid with a crown; a slow climb during the dip at 128–133 |
| 10 | 141.2 | AI researcher | Centre lab; the AI builds a bigger AI, hex inside hex |

**Intro (0–8.8):** black. The grid points fade in from the centre, then a zoom-out reveals the honeycomb with ten cream workers and a tiny orange AI in the centre. A numeral "10" is built.

**Outro (155.6–169.2):** "I work alone…". The camera pulls back over the whole world, now orange and empty. The cream grid points switch off one by one until only the orange AI lattice glows, with a final slow rotation.

## Engine

- **Lattice:** vertex (i, j) sits at world (i + j/2, j·√3/2). Each rhombus holds an up and a down triangle. Scenes paint **cells** into a layer by rasterizing shapes (polygon, stroke, hexagon, disc, text) with a centroid-inside test, so everything gets the TriangleDraw jaggedness.
- **Camera:** (x, y, zoom px/unit, rot). The lattice rotates with the world.
- **Points:** a background dot grid with a global or spatial alpha, plus bright "ghost" point sets.
- **Frames are a pure function of t.** No state carries between frames, so they can render in parallel.
- **Rendering:** Canvas2D in headless Chrome through puppeteer, with triangles batched by colour. 1920×1080 at 30 fps. ffmpeg muxes `assets/music.wav`.
