# V5 residential benchmark contract

This contract coordinates the environment and traversal workstreams for the
residential Belfast acceptance benchmark. The game uses integer logical-pixel
coordinates and Phaser Arcade Physics.

## World and scale

- Logical viewport: `480 × 270`.
- World width: `4,980` units; residential section ends at `x = 1,450`.
- Ground plane: `y = 225`.
- The road plate begins at `y = 211`; pavement and kerb occupy its upper edge
  through the ground plane. Player and vehicle ground anchors use `y = 225`.
- Player art remains `24 × 32` at scale `1`. Traversal owns the physics body
  size and offset.

## Vehicle anchors

The shared taxi artwork key remains `platform-taxi`, loaded from
`src/assets/platform-taxi.png`. Its contract is `120 × 58` pixels, centered at
the world-space vehicle origin:

- Ground contact: center-relative `(0, +29)`; the art-local bottom edge is
  `y = 58`.
- Walkable roof surface: art-local `y = 18`, which is center-relative
  `y = -11`. A taxi grounded on `y = 225` has its artwork center at `y = 196`,
  so the roof surface is at world `y = 185`. The current visual taxi deck spans
  about image `x = 25..87`; its final interval must be confirmed against the environment
  workstream's finished art.
- The traversal workstream owns the roof collision shape and may inset its
  horizontal edges to match the visible roof. The environment workstream owns
  the artwork and the final visual anchor metadata.

If an art revision needs different taxi dimensions, both workstreams must agree
on the new dimensions and anchors before either changes them.

## Shared-file ownership

- Environment: artwork files, Boot art preload, `drawStreetSurface`,
  `composeBackdrop`, `drawScenery`, and other background-only rendering.
- Traversal: `Game.create` physics setup, `placePlatform`, movement and
  collision handling, collision debug geometry, and traversal regressions.
- Integration: review both commits, resolve shared-file changes without
  dropping either stream, then add the integrated benchmark mode and evidence.

Existing keys `platform-taxi`, `platform-shelter`, `platform-wall`,
`street-art`, and `street-surface` remain available to the main game unless the
integration owner explicitly updates every consumer.
