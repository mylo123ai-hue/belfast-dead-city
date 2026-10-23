# Belfast: Dead City V6 physics benchmark

## Baseline

- Repository: `mylo123ai-hue/belfast-dead-city`
- Baseline branch and commit: `main` / `7506b604f3bcc64bf3168e870cd636e099d9dcd5`
- Baseline commit date: 2026-10-21T05:48:04Z
- Dependencies resolved from the committed lockfile: Phaser 3.90.0, TypeScript 5.9.3, Vite 7.3.7, Playwright 1.64.1.
- Baseline build: PASS (`npm run build`, 2026-10-23T23:01Z).
- Baseline unit checks: PASS (`npm test`, 2/2, 2026-10-23T23:01Z).
- Baseline browser smoke: BLOCKED because the executor has no Playwright Chromium binary; the build portion passed. Browser binary installation will be attempted.

### Baseline physics measurements

Code-derived values (not yet browser measured): horizontal input snaps to 128 px/s; release multiplies velocity by 0.78 per rendered update; jump impulse is -305 px/s; gravity is 680 px/s²; jump buffering is 130 ms; coyote time is 0 ms. The player is collided only against the ground. There are no Arcade bodies for the painted parked cars or bus shelters. Bullet, grenade, and hostile-shot lifetime is counted in rendered update iterations (55, 75, and 110 respectively); grenade fuse therefore varies with frame rate. Enemy movement sets velocity directly and has no obstacle geometry to navigate.

### Initial reproducible gaps

1. No coyote window and a very short jump buffer make edge/timing jumps unreliable.
2. No car/shelter collider, so painted traffic cannot be stood on or traversed.
3. Grounded checks use only `blocked.down`, which is sensitive to Arcade collision update ordering.
4. Stop damping and transient object lifetimes are update-count based, so behavior varies with frame rate.
5. Projectiles have no collision with world surfaces and may pass through geometry if platforms are introduced without adding collision rules.

## Checkpoints

| Time (UTC) | Elapsed from task start | Changes / tests / next |
|---|---:|---|
| 2026-10-23T23:00:43Z | 0 min | Began executor work; cloned clean `main` baseline and recorded SHA. |
| 2026-10-23T23:01:45Z | 1 min | Created `codex/v6-engine-physics`; installed locked dependencies; baseline build and unit tests pass; browser test blocked by missing Chromium. |

## Final evidence

To be completed with measured movement/physics values, automated browser results, screenshots and recording paths. Classification: **UNKNOWN** until measured.
