# Belfast: Dead City V6 physics benchmark

## Baseline

- Repository: `mylo123ai-hue/belfast-dead-city`
- Baseline branch and commit: `main` / `7506b604f3bcc64bf3168e870cd636e099d9dcd5`
- Baseline commit date: 2026-10-21T05:48:04Z
- Dependencies resolved from the committed lockfile: Phaser 3.90.0, TypeScript 5.9.3, Vite 7.3.7, Playwright 1.64.1.
- Baseline build: PASS (`npm run build`, 2026-10-23T23:01Z).
- Baseline unit checks: PASS (`npm test`, 2/2, 2026-10-23T23:01Z).
- Baseline browser smoke: first attempt BLOCKED because the executor had no Playwright Chromium binary; after installing Chromium, the post-change smoke passed. A pre-change browser trace could not be captured, so baseline gameplay timing is INFERRED from source values.

### Baseline physics measurements

Code-derived values: horizontal input snaps to 128 px/s; release multiplies velocity by 0.78 per rendered update; jump impulse is -305 px/s; gravity is 680 px/s²; jump buffering is 130 ms; coyote time is 0 ms. The player is collided only against the ground. There are no Arcade bodies for the painted parked cars or bus shelters. Bullet, grenade, and hostile-shot lifetime is counted in rendered update iterations (55, 75, and 110 respectively); grenade fuse therefore varies with frame rate. Enemy movement sets velocity directly and has no obstacle geometry to navigate. Classification: **INFERRED** from source; no baseline browser measurement was available before implementation.

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
| 2026-10-23T23:19:18Z | 18 min 35 sec | Keyboard benchmark passed movement, variable jump, 30/120 Hz, car/shelter traversal, camera, projectiles, combat, and contact damage checks. Its first obstacle check was too weak; follow-up probing exposed enemies walking below roof bodies. |
| 2026-10-23T23:21Z | ~20 min | Executor briefly became unavailable; it recovered without losing the checkout or branch. |
| 2026-10-23T23:47Z | 46 min | Added side collision bodies, corrected Phaser group callback ordering, raised enemy hop clearance, consolidated static surfaces to one Phaser StaticGroup, isolated physics-rate measurements from video encoding, and passed the expanded benchmark and smoke suite. |

## V6 measured results

Final successful keyboard benchmark: Playwright 1.64.1 with Chromium headless on the managed Linux executor. See `artifacts/v6/results.json` and `artifacts/v6/keyboard-benchmark.webm`.

| Measure | Before | V6 result | Classification |
|---|---|---|---|
| Horizontal input | Instant 128 px/s | 900 px/s² acceleration; 128 px/s target; reversal 1750 px/s². At 150 ms: 89.9 px/s | Before **INFERRED**, V6 **VERIFIED** |
| Stopping | 0.78 multiplier per render update | 1450 px/s²; reaches 0 within ~89 ms from 128 px/s | Before **INFERRED**, V6 **VERIFIED** |
| Jump | Fixed -305 px/s; theoretical 68.4 px peak | -320 px/s; measured tap rise 31.1 px, held rise 73.4 px | Before **INFERRED**, V6 **VERIFIED** |
| Coyote and buffer | 0 ms; 130 ms buffer | 150 ms coyote; 140 ms buffer; keyboard launch verified | Before **INFERRED**, V6 **VERIFIED** |
| Traversal | No vehicle/shelter bodies | Car landing center `(548.3, 172)`, ground landing after exit `(660.3, 210)`; shelter landing `(833.1, 170)`, ground landing after exit `(908.2, 210)` | Before **VERIFIED** from missing colliders, V6 **VERIFIED** |
| Physics rate | Phaser Arcade fixed-step default 60 Hz | At 30 Hz: 229.6 px / 1.805 s (127.22 px/s, 54 steps); at 120 Hz: 234.7 px / 1.830 s (128.24 px/s, 220 steps); distance ratio 0.979 | Before **UNKNOWN**, V6 **VERIFIED** within 1% speed |
| Browser render rate | Baseline smoke unavailable pre-change | 37.5 FPS during 30 Hz run; 39.4 FPS during 120 Hz run; 56.6 FPS during the production smoke; ~38–55 FPS during recorded automation | Before **UNKNOWN**, V6 **VERIFIED** for this executor/load |
| Enemy obstacle | No obstacle bodies | Zombie rose to y=157.4 and crossed past x=1208 | Before **VERIFIED** from absent geometry, V6 **VERIFIED** |
| Sustained contact | Existing 1100 ms global invulnerability | Health stayed at 4 through sustained contact | Before **INFERRED**, V6 **VERIFIED** |
| Projectile collisions | No world collision surfaces | Keyboard bullet reduced runner HP 2→1; bullet at car side removed on impact | Before **VERIFIED** from absent geometry, V6 **VERIFIED** |

Evidence files:

- `artifacts/v6/car-roof.png` — player standing on a car roof.
- `artifacts/v6/bus-shelter.png` — player standing on a shelter roof.
- `artifacts/v6/collision-debug.png` — Arcade body overlays for the car roof, side walls, street, and player.
- `artifacts/v6/collision-debug-shelter.png` — Arcade body overlays for the bus shelter roof/supports and player.
- `artifacts/v6/keyboard-benchmark.webm` — keyboard movement, jumps, both traversals, combat inputs, obstacle reaction, and collision debug view.
- `artifacts/v6/results.json` — raw measurements and pass record.

## Verification and limitations

- `npm test`: PASS, 2/2.
- `npm run build`: PASS through both browser suites.
- `npm run test:browser`: PASS; measured 56.625 FPS, no browser exceptions, combat and boss/death/restart flows passed.
- `npm run test:physics`: PASS; keyboard path, jump buffer/coyote, roof landings and exits, damage cooldown, zombie obstacle hop, zombie projectile hit, and car-side projectile stop passed.
- Physics-rate comparison runs in a second unrecorded Playwright tab to avoid video encoding affecting the measurement. The measured physics speeds differ by 1.02 px/s between 30 Hz and 120 Hz.
- Static collision surfaces use one Arcade `StaticGroup` and four group colliders, avoiding per-surface collider registration.
- Browser performance is executor and recording-load dependent. The recorded physics run ranged roughly 38–55 FPS; it does not establish performance on other machines.
- Shelters are newly drawn simple scene props because no shelter artwork existed in the baseline. Taxi artwork is unchanged; collision surfaces map to the roofs already painted into the scenery.
- The benchmark validates one representative obstacle path, not every encounter layout or boss collision at all frame rates.
- No changes were merged, deployed, published, or integrated into `main`.

The executor was briefly unavailable around 23:21 UTC and recovered; no work was lost. Actual elapsed execution window, final commit, branch link, and rollback instructions are recorded in the handoff after the final commit. No other pending automated checks remain. Designer verification and Trello reconciliation are outside this benchmark run.
