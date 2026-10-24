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
| 2026-10-24T00:44Z | 1 h 43 min | Added boss ground/movement/strike regression checks alongside reversal, double-jump prevention, shelter enemy traversal, and maximum-pool stress; full physics benchmark passed with no browser exceptions. |
| 2026-10-24T01:11:52Z | 2 h 11 min | Added exact-step 30/120 Hz enemy, roof landing, projectile impact, and grenade-fuse tests; tested expired jump buffering, coyote age, hit knockback, acid hits, and boss bullet damage. Reproduced a player softlock and boss destruction from reversed overlap callback assumptions; fixed all four combat callbacks with Phaser group membership checks. Full browser physics suite passed. |
| 2026-10-24T01:18:00Z | 2 h 17 min | Added camera tracking checks at both physics rates plus final viewport visibility at both world ends. Physics benchmark passed; player stayed at screen x=323.2/324.9 after equal movement and reached the right viewport edge (x=474) at the world bound. Unit suite and browser smoke passed; smoke fixture now uses an actual Phaser bullet for boss phase/victory transitions. |

## V6 measured results

Final successful keyboard benchmark: Playwright 1.64.1 with Chromium headless on the managed Linux executor. See `artifacts/v6/results.json` and `artifacts/v6/keyboard-benchmark.webm`.

| Measure | Before | V6 result | Classification |
|---|---|---|---|
| Horizontal input | 57.6 px / 450 ms (128 px/s; no acceleration ramp) | 900 px/s² acceleration; sampled 74.9 px/s after 100 ms, then reached the 128 px/s target; 1450 px/s² stopping returned velocity to 0; 1750 px/s² reversal reached -122.4 px/s in a 150 ms sample | Before and V6 **VERIFIED** |
| Stopping and reversal | 0.78 velocity multiplier per rendered update | Release reached 0 within 150 ms; direct reversal overcame the prior direction and reached -92 to -128 px/s in measured 150 ms samples | Baseline **VERIFIED** behavior, V6 **VERIFIED** |
| Jump | At 80 ms: y=191.56, vy=-259.67; source impulse -305 px/s | -320 px/s; latest 60 ms Space press rose 31.1 px, held press rose 73.4 px. Across recent runs tap samples varied 16.7–57.8 px due to input/update scheduling. At 30 Hz, full arc: 70.0 px / 0.900 s; at 120 Hz: 74.0 px / 0.917 s | Before and V6 **VERIFIED**; latest full-arc height differs 5.3%, airtime 1.8%; exact short-tap height **UNKNOWN** within the observed automation range |
| Coyote, buffer, and jump count | 0 ms coyote; 130 ms buffer; no airborne jump guard | Coyote jump input pressed at 67 ms after last grounded update and launched; 140 ms input buffer launches on landing; stale 200 ms airborne input did not auto-jump after landing; second airborne Space press did not launch | Before **INFERRED**, V6 **VERIFIED** |
| Traversal | No vehicle/shelter bodies | Keyboard car landing center `(546.8, 172)`, ground landing after exit `(647.1, 210)`; shelter landing `(817.8, 170)`, ground landing after exit `(906.9, 210)`. Exact roof landings also passed at both 30 and 120 Hz | Before **VERIFIED** from missing colliders, V6 **VERIFIED** |
| Physics rate | Baseline game did not expose a comparable multi-rate browser test (**UNKNOWN**) | Player: 226.1 px / 1.8 simulated s at 30 Hz (125.63 px/s); 228.3 px / 1.8 s at 120 Hz (126.81 px/s), 0.94% speed difference. Runner: 160.77/161.53 px over 54/216 exact steps (89.31/89.74 px/s). Roof landings held at car y=172 and shelter y=170 at both rates | Before **UNKNOWN**, V6 **VERIFIED** |
| Camera follow | No cross-rate camera measurement (**UNKNOWN**) | After equal 1.8 s movement: player screen x=323.2 at 30 Hz and x=324.9 at 120 Hz. At world ends, player remained visible at screen x=6 and x=474 | Before **UNKNOWN**, V6 **VERIFIED** |
| Projectile/grenade rate | Lifetime counted rendered updates; obstacle contact was absent | Keyboard bullet stopped at car side within 250 ms at 30 and 120 Hz. Grenade fuse: 1.255 s at 30 Hz and 1.267 s at 120 Hz. Bounce and blast damage also verified | Before **INFERRED**, V6 **VERIFIED** |
| Browser render rate | 55.06 FPS in baseline smoke | Latest physics recording sampled 47–57 FPS in reported game-loop segments, with 47.0 FPS during max-pool stress; production smoke measured 54.94 FPS | Before and V6 **VERIFIED** on this executor/load; recording and concurrent load affect rate |
| Enemy movement | Baseline moved at source-set velocity without obstacle navigation | Runner cleared taxi and bus shelter; car-route minY=157.3 and passed x=1226; shelter route passed x=895. Enemy moved 89.31/89.74 px/s at 30/120 Hz | Before movement speed **INFERRED**, V6 **VERIFIED** |
| Sustained contact and hit reaction | 1100 ms global invulnerability could allow same ongoing overlap to re-hit after timeout; no knockback | Contact hit reduced health once and applied `vx=-145`, `vy=-105`; health stayed 4 through 1.35 s overlap; separation and recontact reduced health to 3 | Before **INFERRED**, V6 **VERIFIED** |
| Projectile collisions | Player bullets had no world collision; hostile shots had no obstacle collision | Keyboard bullet reduced runner HP 2→1 and stopped at taxi body; hostile acid stopped at taxi side, then damaged player once while player sprite/body stayed active. Boss bullet reduced HP 46→45 while boss stayed active | Before **VERIFIED** from absent collision setup, V6 **VERIFIED** |
| Grenade physics | Update-count fuse (75 updates), no gravity on the thrown sprite | Bounced from ground with upward velocity after impact; fuse despawn verified at 1.25 s; gravity 680 px/s² | Before **VERIFIED** from source/behavior, V6 **VERIFIED** |
| World edges | Collide-world-bounds enabled | Keyboard movement stopped within x=6 and x=4974; camera stayed within scrollX 4467 | Before **UNKNOWN**, V6 **VERIFIED** |
| Collision load | No stress capture | 18 hostiles, 28 bullets, 16 hostile shots, 5 grenades active concurrently; after 1.5 s all shots/grenades expired, 11 hostiles remained, 47.0 FPS sampled during load and no browser exceptions | Before **UNKNOWN**, V6 **VERIFIED** |
| Boss physics | Existing boss ground collider and strike sequence | Boss moved 15.5 px in 500 ms while grounded; bullet collision reduced boss HP to 45 without removing the boss; scripted strike landed after 3.2 s (player health 5→4) | Before **INFERRED** from source, V6 **VERIFIED** |
| Grenade pool exhaustion | Ammo/cooldown could update before pool allocation failed | With all 5 pool slots occupied, failed throw preserved ammo and cooldown; successful throw later used one ammo | Before **INFERRED**, V6 **VERIFIED** |

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
- `npm run test:browser`: PASS; measured 54.94 FPS, no browser exceptions, combat and boss/death/restart flows passed.
- `npm run test:physics`: PASS; keyboard acceleration/braking/reversal, variable jump and double-jump prevention, coyote and buffered jump plus buffer expiry, horizontal/jump/enemy/camera consistency at 30/120 Hz, car/shelter landing and traversal, world-edge visibility, obstacle hops, player/enemy/hostile-shot/boss projectile interactions, grenade pool/bounce/fuse/blast, maximum-pool load, knockback, 1.35 s sustained contact suppression/recontact, and collision-debug captures passed with no browser exceptions.
- Physics-rate comparisons capture exact Arcade world steps and divide measured displacement by step duration. They run in the foreground recorded tab to avoid browser background throttling. Horizontal movement, jump arcs, runner movement, camera follow, projectile-wall impacts, grenade fuses, and platform landings were sampled at 30/120 Hz.
- Static collision surfaces use one Arcade `StaticGroup` and five group colliders, avoiding per-surface collider registration. Both player bullets and hostile shots also collide with the street ground.
- Browser performance is executor and recording-load dependent; the latest recorded run measured 47–57 FPS in reported segments and 47 FPS during maximum-pool stress. This does not establish performance on other machines.
- Shelters are newly drawn simple scene props because no shelter artwork existed in the baseline. Taxi artwork is unchanged; collision surfaces map to the roofs already painted into the scenery.
- The benchmark validates representative routes, not every encounter layout. Enemy movement at multiple rates was sampled with a runner; spitter movement/attacks and boss movement/strikes were checked at the default rate. Collision tests do not cover every body pair at every frame rate.
- No changes were merged, deployed, published, or integrated into `main`.

The executor briefly became unavailable around 23:21 UTC and during final verification; it recovered without losing branch state. Additional reproduced failures and recoveries: an early grenade assertion sampled between bounce phases and was changed to observe the Arcade collision event; a full-pool grenade test initially leaked fixture grenades into the next scenario and now clears them between cases; coyote timing was changed to measure grounded age immediately before input. Browser overlap tests reproduced two real callback-order defects: an acid hit destroyed the player sprite and stalled the scene, while a boss bullet removed the boss. All four combat overlap callbacks now select targets by group membership, and real group bullets are used in the boss smoke fixture. Enemy timing was changed to exact Arcade steps after render sampling skewed its initial result. The benchmark server uses Vite's in-process preview API after intermittent child-process startup failures. Designer verification and Trello reconciliation are outside this benchmark run.
