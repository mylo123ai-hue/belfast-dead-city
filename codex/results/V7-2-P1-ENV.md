# V7.2 Phase 1 — Belfast Environment Overhaul Results

**Status: COMPLETED — implementation, tests, evidence and PR are published; aesthetic sign-off remains with the owner/Designer.**

## Repository and commits

- Repository: `mylo123ai-hue/belfast-dead-city`
- Authorized handoff: `codex/v7-2-phase1-environment-handoff`, exact commit `11652a68b58a4a10721d4d27345e1c2d1bb0d9da`
- Exact implementation baseline: `codex/v7-1-residential-stage` at `1eec8b77967813cfaf43e02b32be4536cb0d87d4`
- Task branch: `codex/v7-2-phase1-environment`
- Implementation and evidence commit: `dfe57ecd86ace28bcad5f36ba9bb6f9156dec191`
- This results document is committed on the task branch and is part of the open PR. The final task branch SHA is also reported in the completion response.
- Pull request: [#1 — V7.2 Phase 1: Belfast residential environment cohesion](https://github.com/mylo123ai-hue/belfast-dead-city/pull/1) — open, targeting `codex/v7-1-residential-stage`; not merged.

## Implementation summary

Added an opt-in `?benchmark=v7.2` environment mode to the existing residential scene. It retains the V7.1 three-house illustration and gives that bounded section a cohesive Belfast dusk background and street foreground:

- A repository-contained, original pixel-art East Belfast dusk scene provides blue-grey cloud bands, a warm horizon, distant rooftops/chimneys and paired H&W shipyard crane silhouettes. It is composed behind the houses at the existing skyline parallax factors (X `0.32`, Y `0.2`) and receives a restrained cool grade.
- A new native-scale flagstone/pavement/road raster adds shallow door stoops, worn slabs, curb joints, drains, patched/cracked dark asphalt and modest interrupted warm/cool reflections.
- Selected kerbstones carry weathered red, off-white and blue paint, without flags, murals or emblems.
- The new pavement image is world anchored. The sky keeps parallax. Both additions fade at the end of the bounded section.
- Only X=0–600 is visually upgraded for the street/ground, with a 20-unit ground fade. The legacy V7 facade/background returns near X≈600, as required by the phase boundary.

No player/zombie sprites, animation, physics/collision geometry, enemies, combat, obstacles, pickups, platforms, vehicles, progression, audio, controls or V6 files were changed. The environment image is decorative; the scene still has its single existing static ground collider.

## Artwork inventory

| Asset | Size / format | Use |
|---|---:|---|
| [`src/assets/v7-2-east-belfast-dusk.png`](../../src/assets/v7-2-east-belfast-dusk.png) | 1672×941 RGB PNG, original source illustration | Dusk sky, distant Belfast skyline and H&W crane source. The scene crops/composites it into a 600×190 parallax overlay. |
| [`src/assets/v7-2-residential-ground.png`](../../src/assets/v7-2-residential-ground.png) | 600×65 RGB PNG | Native-scale world-space pavement, stoops, painted kerbs, gutter and road. Ends at X=600 and fades over the final 20 units. |
| Existing `src/assets/v7-1-three-house-facades.png` | 1672×941 RGBA PNG | Retained V7.1 three-house terrace artwork; not modified. |

Both new images are original project assets; no protected game or third-party artwork was copied. `?benchmark=v7` and `?benchmark=v7.1` continue to use their existing environment presentation.

## Acceptance evidence

| Handoff criterion | Status | Evidence |
|---|---|---|
| In-game 480×270 scene coherently connects sky, houses, paving/kerb and road; selected painted stones are legible | **VERIFIED** as implemented and captured; aesthetic approval is **UNKNOWN** pending owner/Designer review | [V7.2 native in-game image](../../artifacts/v7-2/v7-2-after-native.png), [pavement/road detail](../../artifacts/v7-2/v7-2-pavement-road-detail-native.png), [sky/crane view](../../artifacts/v7-2/v7-2-sky-cranes-native.png). |
| Before/after at identical player and camera coordinates | **VERIFIED** | [V7.1 before](../../artifacts/v7-2/v7-2-before-native.png) and [V7.2 after](../../artifacts/v7-2/v7-2-after-native.png) are both Phaser canvas captures at 480×270, player X=78, camera X=0. The comparison metadata is in the [smoke report](../../artifacts/v7-2/v7-2-smoke.log). |
| Continuous scroll, parallax/world anchoring, boundary and no obvious pop/clipping | **VERIFIED** for scroll-factor setup and uninterrupted capture; visual absence of every single-frame pop is **INFERRED** from the recording | [Uninterrupted traversal video](../../artifacts/v7-2/v7-2-three-house-traversal.webm) and [scroll-end screenshot](../../artifacts/v7-2/v7-2-scroll-end-native.png). Smoke verifies sky factors `(0.32, 0.2)` and ground factors `(1, 1)`. The legacy-art boundary near X≈600 is visible and documented. |
| Player scale, continuous ground, and absence of new physical blockers | **VERIFIED** | Smoke report: 480×270 canvas, existing walker texture, player body bottom Y=225, ground collider top Y=225, 14,500-unit world/camera, one static body. New environment art creates no Arcade body. |
| Existing V7/V7.1/normal routes | **VERIFIED** | V7 full-route, V7.1 and browser-suite command logs below; normal title route remains active without a benchmark query. |
| Build, unit, browser, regression, V7.2 smoke and recording evidence | **VERIFIED** | Committed logs and outcomes in the following section. |
| Owner visual acceptance | **UNKNOWN** | Implementation evidence is supplied; the owner/Designer makes the aesthetic acceptance decision. |

All gameplay captures are actual Phaser canvas output. Main comparison captures are not CSS-upscaled; the sky/crane view is a Phaser camera zoom at 1.15 and the pavement close-up uses a Phaser camera zoom at 1.8, while each canvas remains 480×270.

### Screenshots and recording

- [Before — V7.1, native 480×270](../../artifacts/v7-2/v7-2-before-native.png)
- [After — V7.2, native 480×270](../../artifacts/v7-2/v7-2-after-native.png)
- [Sky and cranes — 480×270 canvas, camera zoom 1.15](../../artifacts/v7-2/v7-2-sky-cranes-native.png)
- [Pavement and road detail — 480×270 canvas, camera zoom 1.8](../../artifacts/v7-2/v7-2-pavement-road-detail-native.png)
- [Scroll-end view at player X≈706](../../artifacts/v7-2/v7-2-scroll-end-native.png)
- [Uninterrupted 6.16-second traversal](../../artifacts/v7-2/v7-2-three-house-traversal.webm)

### Commands and outcomes

| Command | Result | Verified details / log |
|---|---|---|
| `npm run build` | **PASS** | TypeScript and Vite production build completed. [Build log](../../artifacts/v7-2/npm-build.log). |
| `npm test` | **PASS** | 2/2 unit tests. [Unit log](../../artifacts/v7-2/npm-test.log). |
| `npm run test:browser` | **PASS** | Existing browser, benchmark, traversal and V5 checks completed; no browser errors. [Suite log](../../artifacts/v7-2/test-browser.log). |
| `npm run test:v7` | **PASS** | Full 14,500-unit V7 route ended at X=14,452.3 / camera X=14,020; ground Y=225; median 60.4 FPS (500 ms samples), min 58.3, max 60.8; browser errors/resources 0. [V7 log](../../artifacts/v7-2/test-v7-command.log). |
| `npm run test:v7-1` | **PASS** | V7.1 opt-in start and traversal remained functional; 480×270 capture; median 59.0 FPS, min 58.3, max 59.3; browser errors/resources 0. [V7.1 log](../../artifacts/v7-2/test-v7-1-command.log). |
| `npm run test:v7-2-p1` | **PASS** | Same-coordinate 480×270 capture, painted-kerb color samples, 600×65 ground asset, parallax/world anchoring, ground/body and normal-route assertions; scroll to X=706.3 / camera X=384. Median 59.3 FPS, min 58.5, max 59.5; browser errors/resources 0. [Smoke report](../../artifacts/v7-2/v7-2-smoke.log) · [command output](../../artifacts/v7-2/test-v7-2-p1-command.log). |
| `npm run record:v7-2-p1` | **PASS** | One uninterrupted recording, player X=716 / camera X=393; world 14,500; ground Y=225; one static body; endpoint 58.6 FPS; browser errors/resources 0. [Recording report](../../artifacts/v7-2/v7-2-record.log) · [command output](../../artifacts/v7-2/record-v7-2-p1-command.log). |

FPS readings use `window.__belfast.fps()` sampled every 500 ms during the indicated Chromium/Linux traversal. They are observations in the headless test environment, not a guarantee for all devices.

## Changed files

- `src/ResidentialScene.ts` — V7.2-only artwork loading/composition; the V7.1 and V7 branches remain separate.
- `src/main.ts` — opt-in `?benchmark=v7.2` routing to the existing residential scene.
- `package.json` — V7.2 smoke and recording commands.
- `src/assets/v7-2-east-belfast-dusk.png` — original dusk/skyline artwork.
- `src/assets/v7-2-residential-ground.png` — original native-scale pavement/kerb/road raster.
- `tests/v7-2-p1.smoke.mjs` — coordinate, color, scale, body, parallax, route and native capture checks.
- `tests/record-v7-2-p1.mjs` — uninterrupted recording and route assertions.
- `artifacts/v7-2/` — committed screenshots, recording and test/build outputs linked above.
- `codex/results/V7-2-P1-ENV.md` — this Designer-readable results record.

## Risks and limitations

- The visible legacy V7 facade style resumes near X≈600. The short fade reduces the abruptness but does not hide the change in illustration style. This was kept inside the authorized boundary; the recording and scroll-end image show it honestly.
- The generated dusk source is cropped and rescaled to the 600-unit parallax window; some source detail is compressed at 480×270. The sky retains blue-grey clouds and cranes, but the warm horizon may still read more saturated than “subdued” to the reviewer.
- The road detail is subtle at native scale by design; review the native detail screenshot before requesting changes.
- Visual quality is not self-approved. Criterion status describes implementation evidence, not owner acceptance.
- This change adds about 1.86 MB of original dusk source art and introduces no paid asset or runtime service dependency.

## Rollback

The PR is open and unmerged; the baseline branch is unchanged. To return to the baseline for inspection:

```bash
git switch --detach 1eec8b77967813cfaf43e02b32be4536cb0d87d4
```

On a local branch where this work has been integrated, revert the implementation/evidence commit to remove the V7.2 additions while leaving the results record as history:

```bash
git revert --no-edit dfe57ecd86ace28bcad5f36ba9bb6f9156dec191
```

## Designer review prompt

```text
Review the V7.2 Phase 1 Belfast residential environment change read-only. Inspect PR #1 and codex/results/V7-2-P1-ENV.md. Compare the committed V7.1 and V7.2 native 480×270 screenshots at player X=78, camera X=0; inspect the sky/crane and pavement/road detail captures, then watch the uninterrupted traversal video through the visible X≈600 legacy-art boundary. Review lighting cohesion, pixel density, Samson/Goliath recognizability, East Belfast kerbstone accents, road wetness, pavement/player alignment, scrolling and the boundary. Return prioritized visual corrections and accept/revise decision for Phase 1 only. Do not edit, merge, deploy, publish or authorize later neighbourhood phases in this review.
```

No merge, deployment, publication, security/credential changes or scope expansion was performed.
