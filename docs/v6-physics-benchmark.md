# Belfast: Dead City V6 physics benchmark

## Baseline

- Repository: `mylo123ai-hue/belfast-dead-city`
- Baseline branch and commit: `main` / `7506b604f3bcc64bf3168e870cd636e099d9dcd5`
- Baseline commit date: 2026-10-21T05:48:04Z
- Dependencies resolved from the committed lockfile: Phaser 3.90.0, TypeScript 5.9.3, Vite 7.3.7, Playwright 1.64.1.
- Baseline build: PASS (`npm run build`, 2026-10-23T23:01Z).
- Baseline unit checks: PASS (`npm test`, 2/2, 2026-10-23T23:01Z).
- Baseline browser smoke: first attempt BLOCKED because the executor had no Playwright Chromium binary. Chromium was installed in the executor; an isolated worktree at the exact baseline commit then passed the pre-change browser smoke. Baseline run: x=80 initially, x=137.6 after 450 ms of D input (57.6 px, 128 px/s); at 80 ms into a jump, y=191.56 and vy=-259.67 px/s; measured render rate 55.06 FPS. Boss, death, and restart flow passed. These are **VERIFIED** baseline browser measurements.

### Baseline physics measurements

Code-derived values: horizontal input snaps to 128 px/s; release multiplies velocity by 0.78 per rendered update; jump impulse is -305 px/s; gravity is 680 px/s²; jump buffering is 130 ms; coyote time is 0 ms. The player is collided only against the ground. There are no Arcade bodies for the painted parked cars or bus shelters. Bullet, grenade, and hostile-shot lifetime is counted in rendered update iterations (55, 75, and 110 respectively); grenade fuse therefore varies with frame rate. Enemy movement sets velocity directly and has no obstacle geometry to navigate. These source findings are **INFERRED**; browser values above are **VERIFIED**.

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
| 2026-10-24T00:09Z | 1 h 9 min | Replayed baseline browser smoke; added grenade gravity/bounce/fuse and camera edge tests; stabilized the benchmark's in-process preview startup and collision-event detection; final physics suite, build, unit suite, and browser smoke passed. Captures and documentation refreshed. |
| 2026-10-24T00:22Z | 1 h 21 min | Added 30/120 Hz jump arc measurements in the foreground recorded tab and improved controlled contact testing; expanded physics benchmark passed. |
| 2026-10-24T00:35Z | 1 h 35 min | Added hostile projectile collision with ground/platforms, verified it stops at a taxi side, and added single-contact suppression past the invulnerability window with recontact damage after separation. Expanded benchmark, unit suite, and production smoke passed. |
| 2026-10-24T00:41Z | 1 h 40 min | Added directional reversal, airborne double-jump prevention, shelter enemy traversal, and max-pool stress coverage (18 enemies, 28 bullets, 16 acid shots, 5 grenades); all projectiles expired and browser errors remained zero. |

## V6 measured results

Final successful keyboard benchmark: Playwright 1.64.1 with Chromium headless on the managed Linux executor. See `artifacts/v6/results.json` and `artifacts/v6/keyboard-benchmark.webm`.

| Measure | Before | V6 result | Classification |
|---|---|---|---|
| Horizontal input | 57.6 px / 450 ms (128 px/s; no acceleration ramp) | 900 px/s² acceleration; 128 px/s target; sampled 119.8 px/s after 133 ms, then 128 px/s at run speed | Before and V6 **VERIFIED** |
| Stopping and reversal | 0.78 velocity multiplier per render update | 1450 px/s² stopping; release reached 0; reversed from +128 to -128 within 150 ms with 1750 px/s² reversal | Baseline **VERIFIED** behavior, V6 **VERIFIED** |
| Jump | At 80 ms: y=191.56, vy=-259.67; source impulse -305 px/s | -320 px/s; measured tap rise 35.4 px, held rise 71.3 px. At 30 Hz, full arc: 70.0 px / 0.910 s; at 120 Hz: 74.0 px / 0.913 s | Before and V6 **VERIFIED**; full arc height differs 5.4%, airtime 0.4% |
| Coyote, buffer, and jump count | 0 ms coyote; 130 ms buffer; no airborne jump guard | 150 ms coyote; 140 ms input buffer; tap and hold jump verified; second airborne Space press did not launch | Before **INFERRED**, V6 **VERIFIED** |
| Traversal | No vehicle/shelter bodies | Car landing center `(552.3, 172)`, ground landing after exit `(648.6, 210)`; shelter landing `(821.1, 170)`, ground landing after exit `(908.0, 210)` | Before **VERIFIED** from missing colliders, V6 **VERIFIED** |
| Physics rate | Baseline game did not expose a comparable multi-rate browser test (**UNKNOWN**) | At 30 Hz: 226.1 px / 1.8 simulated s (125.63 px/s, 54 steps); at 120 Hz: 229.3 px / 1.8 s (127.41 px/s, 216 steps); distance ratio 0.986 | Before **UNKNOWN**, V6 **VERIFIED**; speed differs 1.42% |
| Browser render rate | 55.06 FPS in baseline smoke | 49.3–49.8 FPS during recorded multi-rate run; 55.95 FPS in production smoke; 24.8–55.3 FPS in recorded automation; 46.0 FPS after stress load | Before and V6 **VERIFIED** for this executor/load; rates vary with concurrent load |
| Enemy movement | Baseline moved at source-set velocity without obstacle navigation | Runner cleared taxi and bus shelter; car-route minY=157.3 and passed x=1231; shelter traversal also passed | Before movement speed **INFERRED**, V6 **VERIFIED** |
| Sustained contact | 1100 ms global invulnerability could allow same ongoing overlap to re-hit after timeout | Health remained 4 through 1.35 s continuous overlap; after separation, next contact reduced health to 3 | Before **INFERRED**, V6 **VERIFIED** |
| Projectile collisions | Player bullets had no world collision; hostile shots had no obstacle collision | Keyboard bullet reduced runner HP 2→1 and stopped at taxi body; hostile acid shot also stopped at taxi side | Before **VERIFIED** from absent collision setup, V6 **VERIFIED** |
| Grenade physics | Update-count fuse (75 updates), no gravity on the thrown sprite | Bounced from ground with upward velocity after impact; fuse despawn verified at 1.25 s; gravity 680 px/s² | Before **VERIFIED** from source/behavior, V6 **VERIFIED** |
| World edges | Collide-world-bounds enabled | Keyboard movement stopped within x=6 and x=4974; camera stayed within scrollX 4467 | Before **UNKNOWN**, V6 **VERIFIED** |
| Collision load | No stress capture | 18 hostiles, 28 bullets, 16 hostile shots, 5 grenades active concurrently; after 1.5 s all shots/grenades expired, 9 hostiles remained, no browser exceptions | Before **UNKNOWN**, V6 **VERIFIED** |

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
- `npm run test:physics`: PASS; keyboard acceleration/braking/reversal, tap/held jump and double-jump prevention, coyote and buffered jump, horizontal/jump consistency at 30/120 Hz, car and shelter traversal, camera/world edges, obstacle hops, projectiles against enemies and taxi collision bodies, grenade bounce/fuse, max-pool collision load, 1.35 s sustained contact suppression and recontact, and collision debug captures passed with no browser exceptions.
- Physics-rate comparisons capture exact Arcade world steps and divide measured displacement by actual step duration. They run in the foreground recording tab to avoid browser background throttling. Cross-rate measurements cover horizontal movement and jump arcs; enemy and projectile collision behavior is checked in representative gameplay paths at the default rate. Their movement speeds were not measured across physics rates.
- Static collision surfaces use one Arcade `StaticGroup` and five group colliders, avoiding per-surface collider registration. Both player bullets and hostile shots also collide with the street ground.
- Browser performance is executor and recording-load dependent; the recorded physics run ranged roughly 25–54 FPS. It does not establish performance on other machines.
- Shelters are newly drawn simple scene props because no shelter artwork existed in the baseline. Taxi artwork is unchanged; collision surfaces map to the roofs already painted into the scenery.
- The benchmark validates representative routes, not every encounter layout or boss collision at all frame rates. Physics measurements compare 30 Hz and 120 Hz step settings with identical simulated-step durations.
- No changes were merged, deployed, published, or integrated into `main`.

The executor briefly became unavailable around 23:21 UTC and during final verification; it recovered without losing branch state. An early grenade assertion sampled the bounce between its upward and downward phases; this was replaced with collision-event observation. The benchmark server launch was switched to Vite's in-process preview API after intermittent child-process startup failures. Designer verification and Trello reconciliation are outside this benchmark run.
