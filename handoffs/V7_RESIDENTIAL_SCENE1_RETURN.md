# V7 Belfast Residential Scene 1 — Completion Handoff

## Status

**DONE** against the written Scene 1 specification. The approved Designer mockup was not available in this repository or workspace, so direct visual comparison is **UNKNOWN**; no claim of exact mockup fidelity is made.

## Repository and commits

- Repository: `mylo123ai-hue/belfast-dead-city`
- Implementation branch: `codex/v7-residential-scene1`
- Baseline: `9935bc162be4b7eeee8a498341d67e1168be3e7d` (`codex/v5-integration`)
- Implementation and evidence commit: `b68d8db6318232041048327e6b46ffab7c7b7524`
- Completion handoff commit: this file is committed separately after the implementation commit. The final branch-head SHA is reported in the Cloud Codex completion response.

## What changed

- Added `?benchmark=v7`, which opens the isolated `ResidentialScene`. The title screen and existing V4/V5 routes keep their existing entry paths.
- Built one continuous, deterministic 14,500 unit residential street panorama with world anchored red-brick terraces, varied roofs and chimneys, doors, windows, occasional shopfronts, decorative garden walls and trees, continuous pavement, kerb and wet asphalt.
- Added a parallax skyline, restrained City Hall and shipyard silhouettes, warm window and street lighting, rain, steam and wet-road highlights.
- Added a neutral, unarmed 24×32 pixel walker as a scale reference. The V7 scene has no enemies, weapons, pickups, platforms or gameplay obstacles. Its sole static collision body is the continuous ground.
- Added V7 smoke and recording scripts and committed actual in-game screenshots, logs and one uninterrupted full-route video.

### Scale and coordinate contract

- Game viewport: **480×270 units**. World origin is upper left; X increases right and Y increases down.
- Route width: **14,500 units**. Movement speed: **145 units/second**. The recorded run covers 99.3 seconds from player X=78 to X=14,459.6; the camera ends at X=14,020 and sees the world edge at 14,500.
- Walker art: **24×32 units**; physics body: **19×30 units**. Street collision top: **Y=225**.
- Typical facade width: **130–200 units**. Entry opening: **16–19×38 units**. Window pane: **16×19 units** with a **20×24** outer frame; storey spacing is **38 units**.
- Walk surface occupies Y=205–225; kerb treatment Y=224–228; asphalt begins at Y=230. All playable ground is one continuous world-space body.
- Facades and playable ground use world coordinates. Only the distant skyline uses parallax (X factor **0.32**, Y factor **0.20**); its **5,120 unit** texture spans the camera’s parallax travel.

## Acceptance matrix

| Criterion | Result | Evidence |
| --- | --- | --- |
| Uninterrupted traversal with continuous ground and no panel joins | PASS | [Full traversal video](../artifacts/v7-residential-full-traversal.webm), [record log](../artifacts/v7-record.log), [mid-route view](../artifacts/v7-residential-seam-scale-mid.png), [late-route view](../artifacts/v7-residential-seam-scale-late.png) |
| Consistent player, door, window and storey scale | PASS | [Start scale view](../artifacts/v7-residential-start.png), [late-route scale view](../artifacts/v7-residential-seam-scale-end.png), scale contract above |
| Background and foreground integration; parallax stays distant | PASS | [Full traversal video](../artifacts/v7-residential-full-traversal.webm), [end view](../artifacts/v7-residential-end.png) |
| Original rainy Belfast pixel-art atmosphere demonstrated in game | PASS against the written specification; mockup comparison UNKNOWN | [Start view](../artifacts/v7-residential-start.png), [full traversal video](../artifacts/v7-residential-full-traversal.webm) |
| Normal mode and V4/V5 behavior checked; build, tests, browser errors and FPS recorded | PASS | [Unit test log](../artifacts/v7-unit-test.log), [existing browser suite log](../artifacts/v7-existing-browser.log), [V7 smoke log](../artifacts/v7-smoke.log), [final build and recording log](../artifacts/v7-record.log) |
| Review evidence includes before/after images, one continuous video, build/test output and limitations | PASS | [V5 baseline before image](../artifacts/v5-after-residential-road.png), V7 screenshots and logs linked above |

## Evidence and verified results

- Final build: `npm run build` passed. The final build output is in `artifacts/v7-build.log` and is also included in `artifacts/v7-record.log`.
- Existing checks: `npm test` passed (2 tests); `npm run test:browser` passed for the existing browser, benchmark and V5 traversal checks. Their historical screenshots were restored after the suite so V5 artifacts remain unchanged.
- V7 smoke run: full route reached X=14,452.3 with camera X=14,020, street level Y=225, one ground body, zero enemies, normal title mode still active outside the opt-in query, and no browser errors. FPS was sampled every 500 ms: median **60.5**, minimum **58.3**, maximum **60.8** in headless Chromium 154 at 1200×760. This smoke pass preceded the final skyline travel-width and lighting artwork polish; the final full-route recording below was rerun after those changes.
- Final full-route recording run: player X=14,459.6; camera X=14,020; elapsed **99.3 seconds**; street level Y=225; world width 14,500; obstacle count 0; endpoint FPS **60.7**; browser errors 0; failed resource warnings 0. The video duration is **100.48 seconds** including start and stop frames.
- The video is a single Playwright recording with the player walking continuously from the beginning to the route boundary. Screenshots were captured during that recording without stopping or cutting it.
- No known texture joins, world-edge ground gaps or camera cuts appeared in the recorded route. Review the video at full length to assess visual continuity.

## Limitations

- Designer mockup access was unavailable. The written handoff specification was the visual authority for this implementation.
- The environment is procedurally drawn with Canvas textures rather than a hand-painted source sheet. The Designer should review visual richness and facade variety against the approved mockup before any follow-on art work.
- Performance results are from headless Linux Chromium at 1200×760 and are not a measurement on target hardware.
- This branch starts from the recorded V5 integration baseline. No V6 physics branch code was merged or modified.

## V6 compatibility

V6 was not inspected or modified. V7 keeps street level at the V5 integration baseline’s **Y=225** and uses a single flat ground body across the scene. If a later authorized integration targets V6, retain the V6 player/collision anchor contract and keep all scenery props non-colliding; this benchmark adds no collision geometry beyond ground.

## Rollback

The implementation is isolated on `codex/v7-residential-scene1` and has not been merged, deployed or published. To leave the baseline checked out, switch to `codex/v5-integration`; no rollback to V5 files is needed because they were not modified. Do not merge this branch as part of the Scene 1 review.

## Designer next action

1. Fetch `codex/v7-residential-scene1` and open the game at `?benchmark=v7`.
2. Review the start, seam/scale and end screenshots, then watch the entire 100.48 second video without skipping between points.
3. Compare against the approved Designer mockup if it is available in that conversation, and send back any scale, palette, facade, atmosphere or continuity discrepancies.
4. Keep this review read-only. Any implementation beyond Scene 1 or any additional rollout needs separate authorization from Mark.

## Copyable follow-up prompt for Designer

> Review Belfast: Dead City V7 Residential Scene 1 on branch `codex/v7-residential-scene1`. Read `handoffs/V7_RESIDENTIAL_SCENE1_RETURN.md`, inspect its screenshots, and watch `artifacts/v7-residential-full-traversal.webm` end to end. Compare the game to the approved Designer mockup if you can access it; otherwise review only against the written specification and report that limitation. Return a concise visual review with specific scale, palette, facade-variety, skyline, atmosphere and continuity discrepancies, citing evidence timestamps or screenshots. Keep the review read-only: do not edit, merge, deploy, publish, or authorize another phase. Any implementation requires separate authorization from Mark.
