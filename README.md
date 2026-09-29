# Job Replacement

Source code for the music video for *Job Replacement*, a "ten little…" countdown in which AI replaces one worker per verse until there are none.

<img width="640" alt="The translator fades into a ghost of lattice points, the canvas floods orange, the countdown shows 9, and the camera rotates to the artist's canvas" src="docs/preview.gif" />

Every frame is drawn on an **isometric triangle lattice**, in the visual language of Simon Strandgaard's [TriangleDraw](https://github.com/triangledraw) drawings: bold, two-tone, and snapped to the grid. The world is a honeycomb of hexagonal TriangleDraw canvases, one workplace per canvas. Humans are cream and the AI is orange. Each time a worker is replaced, their canvas floods orange and they leave behind a ghost made only of lattice points. The camera rotates the lattice 60° from canvas to canvas, and in the end the lights go out on everything except the AI.

## What's here

| Path | What it is |
|---|---|
| [`src/lattice.js`](src/lattice.js) | The engine: shapes are rasterized onto triangle cells (centroid test), camera with rotate/zoom, lattice points, ghost points |
| [`src/font.js`](src/font.js) | A triangle typeface whose verticals lean along the lattice's 60° axis |
| [`src/figures.js`](src/figures.js) | The human worker, the orange hex-faced AI, props, hex mandalas |
| [`src/world.js`](src/world.js) | The honeycomb layout (stations rotated by multiples of 60° so they stay on the grid) |
| [`src/director.js`](src/director.js) | Camera path, takeover flood, the AI lighting the canvas borders, countdown numerals, intro and outro |
| [`src/st/`](src/st/) | The ten stations, one per verse |
| [`src/core.js`](src/core.js) | Easing, hashing, and song timing (130.5 BPM, verse downbeats from the vocal stem) |
| [`studio.html`](studio.html) | Live preview with audio and a scrubber (open it in a browser from the repo root) |
| [`render.mjs`](render.mjs) | Renders frames in headless Chrome and encodes the MP4 with ffmpeg |
| [`STATION_GUIDE.md`](STATION_GUIDE.md) | The brief the stations were built from |
| [`docs/superpowers/specs/`](docs/superpowers/specs/) | The design spec |

## Rendering

You need Node.js, Google Chrome and ffmpeg (`brew install ffmpeg`).

```bash
npm install
node render.mjs --frames=0:169.2 --workers=6            # paint every frame into out/frames (resumable)
node render.mjs --encode --out=out/job_replacement.mp4   # join the frames and the song into an MP4
```

Quick checks:

```bash
node render.mjs --sheet=10,15,20 --out=out/sheet.jpg    # contact sheet
node render.mjs --clip=0:12 --out=out/clip.mp4          # short clip with audio
```

Outside macOS, add `--chrome=<path to chrome>`.

## How the timing was found

The verse downbeats come from gaps in the isolated vocal stem. whisper.cpp confirmed the lyric order, and the tempo comes from onset autocorrelation of the instrumental stem.
