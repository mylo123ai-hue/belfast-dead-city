# V5 residential benchmark evidence

Review this as a residential acceptance benchmark only. The V5 mode is available
with `?benchmark=v5`; it does not expand the full game world.

## Review evidence

| Evidence | Artifact |
| --- | --- |
| Before: road | [`v5-before-residential-road.png`](../artifacts/v5-before-residential-road.png) |
| After: road | [`v5-after-residential-road.png`](../artifacts/v5-after-residential-road.png) |
| Before: junction | [`v5-before-residential-junction.png`](../artifacts/v5-before-residential-junction.png) |
| After: junction and background road | [`v5-after-background-road-connection.png`](../artifacts/v5-after-background-road-connection.png) |
| Taxi scale and scene | [`v5-after-taxi-scale.png`](../artifacts/v5-after-taxi-scale.png) |
| Collision geometry | [`v5-after-junction-collision-debug.png`](../artifacts/v5-after-junction-collision-debug.png), [`v5-traversal-roof-debug.png`](../artifacts/v5-traversal-roof-debug.png), [`v5-traversal-road-debug.png`](../artifacts/v5-traversal-road-debug.png) |
| Continuous camera movement | [`v5-camera-through-benchmark.webm`](../artifacts/v5-camera-through-benchmark.webm) |
| Vehicle roof traversal | [`v5-vehicle-traversal.webm`](../artifacts/v5-vehicle-traversal.webm) |

The videos were recorded using normal keyboard controls in headless Chromium
154 on the Linux cloud runner at a 1200 × 760 browser viewport. The traversal
recording jumps onto the taxi, moves on its roof, jumps off, and lands on the
road. The camera recording moves through the residential benchmark to its
right-hand bound.

## Results

- **VERIFIED** — Environment and traversal commits were reviewed and integrated
  on `codex/v5-integration` without changing `main`, V3, or V4 branch refs.
- **VERIFIED** — `npm test`: 2 unit tests passed.
- **VERIFIED** — `npm run test:browser`: production build plus V4 browser smoke,
  existing benchmark smoke, traversal regression, and V5 benchmark smoke all
  passed. The V4 smoke exercises combat and boss flow. No browser page errors
  were reported.
- **VERIFIED** — `npm run build` completed successfully after integration.
- **VERIFIED** — V5 browser regression measured ground at `y=225`, taxi roof at
  `y=185`, and taxi roof width 62 logical pixels. Normal keyboard movement
  landed on the roof, crossed it, jumped off, and returned to the road.
- **VERIFIED** — The V5 browser run reported 15 frame-rate samples, 60–60.6 FPS
  (median 60.3 FPS) in headless Chromium 154, Linux cloud runner, 1200 × 760
  viewport. This runner's frame rate is capped near 60 FPS and is not a
  representative hardware benchmark.
- **INFERRED** — Visual review of the before/after stills and the recorded camera
  movement finds the residential scale, road artwork, taxi grounding, and
  painted background-road connection coherent enough for Mark and Designer
  review. The screenshots are evidence for review, not a substitute for their
  visual acceptance.
- **UNKNOWN** — Performance on target hardware and across other browsers has not
  been measured.

## Scope and remaining limitations

This is one bounded residential benchmark. It reuses and aligns existing
original painted street panels for the junction and neighboring scene; it does
not replace artwork across the full game. There is no automated visual
regression test. The recorded browser run is deterministic smoke evidence, not
playtesting across real devices or input hardware. No merge, deployment, or
publication was performed.
