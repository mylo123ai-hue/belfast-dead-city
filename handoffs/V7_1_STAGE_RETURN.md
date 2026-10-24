# V7.1 Residential Stage Artwork — Completion Return

**Status: DONE for the three-house benchmark; review the visual acceptance items below.**

- Repository: `mylo123ai-hue/belfast-dead-city`
- Authorized handoff: `codex/v7-1-stage-art-handoff`, source commit `5c63d8c5969de77f767b8d088d9635fc814fea71`
- Exact baseline: `codex/v7-residential-scene1` at `355dd02e4b3797e177d75d320043f1e97158a1ef`
- Implementation branch: `codex/v7-1-residential-stage`
- Final code and evidence commit: `b980e51ed78d15e8bc889001b50add56064ba67f`
- Completion handoff: committed at the tip of this implementation branch. Its commit SHA is the final branch SHA reported with the handoff link in the completion message.

## What changed

Added an opt-in V7.1 residential artwork mode at `?benchmark=v7.1`. It uses one original, repository-contained raster illustration for a three-house red-brick Belfast terrace, plus small decorative front-wall and gate details. The illustrated homes vary in brick, door colour, windows and damage, with slate roof detail and warm window light. Existing wet pavement, kerb, road, rain, lighting and distant skyline remain in the scene. The existing V7 mode remains available at `?benchmark=v7`.

The artwork asset is `src/assets/v7-1-three-house-facades.png` (RGBA, 1672×941). Phaser composites it into a 600×146 world-unit frontage at X=0, Y=59, covering X=0–600 and ending at Y=205. The source is scaled to fit this panorama strip; nearest-neighbour sampling is used for the in-game composite. Small decorative gate/wall graphics sit above the facade base. They have no physics bodies and do not obstruct the player.

Scale and alignment were checked in-game against the existing 24×32 walker, 480×270 viewport and ground collider top at Y=225. The three-door facade section occupies approximately 200 world units per house; door height is approximately 38–42 game pixels. The player's body bottom and continuous ground collider both remain at Y=225. The stage mode keeps the 14,500-unit V7 world and camera bounds, with world-anchored houses/road and the existing parallax skyline.

No player or zombie sprite assets, animation, physics settings, combat, enemy systems, obstacles, pickups, platforms, vehicles or V6 code were changed. No gameplay obstacle was added. The only existing regression-test edit removes an obsolete assertion that expected the V7 parallax skyline texture to be exactly 14,500 pixels wide; the test still checks the correct generated parallax width, `ceil(world × 0.32 + 480)`.

## Visual evidence

All game captures below are actual Phaser canvas output, not CSS-upscaled screenshots. The paired comparison uses the same 480×270 canvas resolution, player X=78 and camera X=0; its two game panels are not scaled.

- [Native V7 and V7.1 side-by-side comparison](../artifacts/v7-1-native-baseline-comparison.png)
- [V7 baseline at 480×270](../artifacts/v7-1-baseline-native.png)
- [V7.1 stage at 480×270](../artifacts/v7-1-stage-native.png)
- [Facade detail at native canvas resolution, camera zoom 1.7](../artifacts/v7-1-facade-detail-native.png)
- [Native screenshot after continuous scrolling](../artifacts/v7-1-stage-scroll-end-native.png)
- [Uninterrupted camera traversal recording through all three houses](../artifacts/v7-1-three-house-traversal.webm)

## Acceptance matrix

| Requirement | Result | Evidence / notes |
|---|---|---|
| Distinct, richly illustrated three-house residential artwork inside Phaser | PASS | Native V7.1 screenshot and facade detail above; one original raster asset replaces the generic V7 facade across X=0–600. |
| Red-brick terrace, varied doors/windows, roof detail, damage and warm window lighting | PASS, with Designer review recommended | Visible in native screenshot and detail capture. The approved concept image was not present in the handoff branch or accessible conversation, so exact-reference comparison is **UNKNOWN**; the written brief was authoritative. |
| Shared playable scale and continuous ground/collider alignment | PASS | Smoke log records 24×32 player art, body bottom Y=225, ground top Y=225 and one static ground body. |
| Continuous camera scroll through the three-house segment | PASS | One uninterrupted recording moves from player X=78 to X=698.6 and camera X=376. World remains 14,500 units. |
| V7 and normal entry route remain usable | PASS | Full V7 14,500-unit route regression and existing browser tests passed; normal title route remained active outside benchmark mode. |
| Rich art continues beyond the three-house acceptance gate | NOT IN SCOPE | The V7 procedural frontage resumes after X=600. The short alpha fade softens the join, but the style change remains visible at the edge. No additional houses were upgraded. Designer review of this scoped transition is recommended before any next stage. |

## Build and test results

All logs are committed under `artifacts/`.

- `npm run build` — PASS. [Build log](../artifacts/v7-1-build.log)
- `npm test` — PASS, 2/2 tests. [Unit test log](../artifacts/v7-1-unit.log)
- `npm run test:browser` — PASS, including existing browser, benchmark, traversal and V5 benchmark checks; no browser errors. [Existing browser log](../artifacts/v7-1-existing-browser.log)
- `npm run test:v7-1` — PASS. Native capture and contract checks: 480×270 canvases, baseline/stage both X=78 and camera X=0, world/camera width 14,500, ground and player body bottom Y=225, one static body, and successful scroll to X=691.8 / camera X=369. Short traversal FPS sampled every 500 ms: median 59.5, min 58.8, max 59.9. Browser errors and failed-resource warnings: 0. [V7.1 smoke report](../artifacts/v7-1-smoke.log) · [command output](../artifacts/v7-1-smoke-run.log)
- `npm run record:v7-1` — PASS. Single uninterrupted 1200×760 Chromium recording; player X=698.6 / camera X=376, 14,500-unit world, ground Y=225, one static body, FPS 59.3, browser errors and failed-resource warnings: 0. [Recording report](../artifacts/v7-1-record.log) · [command output](../artifacts/v7-1-record-run.log)
- `npm run test:v7` — PASS after correcting the stale skyline-width assertion described above. Full route ended at player X=14,452.3 / camera X=14,020, world 14,500, ground Y=225, no enemies; FPS median 60.5, min 58.8, max 60.9; browser errors and failed-resource warnings: 0. [V7 regression report](../artifacts/v7-1-v7-regression.log)

FPS is the game's `window.__belfast.fps()` reading sampled every 500 ms during the described browser traversal. These are headless Chromium/Linux measurements, not a device performance guarantee.

## Changed files

- `src/assets/v7-1-three-house-facades.png` — original stage art.
- `src/ResidentialScene.ts` — opt-in artwork composition and decorative, non-colliding frontage details.
- `src/main.ts` — `?benchmark=v7.1` route selection.
- `package.json` — V7.1 smoke and recording scripts.
- `tests/v7-1-stage.smoke.mjs` — native screenshot, scale, scrolling and normal-mode smoke checks.
- `tests/record-v7-1-stage.mjs` — continuous traversal capture and assertions.
- `tests/v7-residential.smoke.mjs` — corrects stale parallax-width assertion, retaining the computed-width check.
- `artifacts/v7-1-*` — committed screenshots, continuous video, test/build logs and run outputs listed above.
- `handoffs/V7_1_STAGE_RETURN.md` — this completion record.

## Limitations and rollback

The approved Designer mockup was unavailable, so a direct visual match cannot be claimed. The source image is rescaled non-uniformly into a wide 600×146 strip; while proportions were checked in the native in-game view, some source detail is compressed. At X=600 the old V7 facade style resumes after a short fade. The generated image is an original project asset; it does not include third-party game art. Rain/reflections and pavement remain the existing V7 implementation rather than newly authored V7.1 surface art.

The code/evidence commit is `b980e51ed78d15e8bc889001b50add56064ba67f`. To inspect the unchanged authorized baseline, use `git switch --detach 355dd02e4b3797e177d75d320043f1e97158a1ef`. To remove the implementation from a local branch while preserving its history, revert the implementation commit and this return-handoff commit (the current branch tip); do not reset or amend shared history. V6 files and physics remain untouched.

## Follow-up prompt for Designer

```text
Please review the V7.1 three-house residential artwork benchmark read-only. Do not edit, merge, deploy, publish, or authorize expansion. Inspect branch codex/v7-1-residential-stage and handoffs/V7_1_STAGE_RETURN.md. Compare artifacts/v7-1-baseline-native.png with artifacts/v7-1-stage-native.png (both are native 480×270 captures at player X=78, camera X=0), then inspect artifacts/v7-1-native-baseline-comparison.png, artifacts/v7-1-facade-detail-native.png, artifacts/v7-1-stage-scroll-end-native.png and play artifacts/v7-1-three-house-traversal.webm. The approved mockup was unavailable to implementation, so compare against the written V7.1 brief unless you can provide the missing reference. Review door/player proportions, brick and roof readability, damage level, warm/cool lighting, foreground alignment, scrolling and the style transition after X=600. Return prioritized visual corrections and a clear accept/revise decision for this three-house gate only. Do not authorize further stage expansion in this review.
```

No merge, deployment, publication or stage expansion was performed.
