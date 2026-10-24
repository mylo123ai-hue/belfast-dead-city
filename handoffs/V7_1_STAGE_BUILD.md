# V7.1 — Residential Stage Artwork Correction | LGM Handoff

Authorization: Owner explicitly granted LGM on 2026-10-24 for **stage/environment only**. This document is the authoritative execution scope. Start baseline: `codex/v7-residential-scene1` at `355dd02e4b3797e177d75d320043f1e97158a1ef`. Verify the SHA before work. Handoff branch: `codex/v7-1-stage-art-handoff`.

## GOAL
Make the **residential stage itself** approach the approved V7.1 three-house Belfast visual target: richly illustrated original arcade pixel art with detailed red-brick terraces, convincing layered depth, consistent scale, atmospheric warm-window/cool-street lighting, moderate apocalypse damage and wet reflective pavement. Prioritize *actual in-game visual quality*, not additional procedural complexity or more level length.

## SCOPE
- Create implementation branch `codex/v7-1-residential-stage` from the exact V7 baseline above. Preserve the working `?benchmark=v7` continuous scrolling and existing gameplay outside the benchmark.
- **Stage only:** background skyline, three adjacent house facades, roofs, doors, windows, brickwork, front walls/fences, pavement, kerb, road and purely decorative lighting/rain/reflections. No character sprites, player animation, zombie sprites, props as obstacles, vehicles, bus shelters, combat, new platforms, physics, or enemy systems.
- Deliver an exceptionally polished **first three-house playable-scale section** first. Build and inspect it at native 480×270 before extending anything. The entire 14,500-unit route is NOT required in this pass; keep existing V7 traversal functional without degrading it.
- Favor purpose-made original illustrated raster artwork/tiles and reusable stage assets over generic runtime Canvas-drawn facades. Handcraft/refine pixel clusters and architecture; avoid repeating the procedural V7 result. Codex can choose available image/asset creation methods; do not falsely claim access to an image generator or the approved reference.
- Approved reference: the V7.1 three-house concept shown in the Designer conversation, depicting red-brick Victorian Belfast terrace, three subtly varied houses (black/blue/red doors), moderate damage (boarded/broken windows and partial roof damage), richly textured slate roofs/chimneys, cool dramatic skyline with distant H&W cranes, warm lit windows, rain, wet reflective road, and no gameplay obstacles. **The concept image is not yet committed in GitHub**. If unavailable to Cloud Codex, say so explicitly and do not claim visual match. Follow written brief, provide screenshots, and mark comparison UNKNOWN. Do not replace it with unrelated online artwork.
- Shared world-space ground and building scale; character reference from existing V7 24×32 walker, ground collision top Y=225, existing 480×270 viewport. Check door heights ~38–42px and believable facade dimensions in actual native-resolution screenshot; adapt art layout if required, documenting chosen scale. Distant skyline may parallax; houses, pavement and road remain world anchored.
- Ensure art doesn't block player visibility, ground edge or readability. Rich texture without visual noise; avoid inappropriate dramatic architecture, abrupt scene changes or perspective mismatches.
- Keep image licensing original and repository-contained; no unlicensed third-party game assets. No paid services or credentials changes.

## DO NOT
Do not modify character/zombie sprite assets or animations. Do not add obstacles, pickups, gameplay systems, collisions or V6 physics changes. Do not touch OpenClaw Lab or unrelated repos. Do not merge, deploy, publish, incur costs or expand to City Centre/City Hall. No automatic full-level rollout before review.

## DONE WHEN
1. A clearly more detailed and cohesive three-house stage section is visible **inside Phaser at 480×270**, with authentic red-brick texture, varied doors/windows, roofs, believable damage, warm light, wet road and layered skyline.
2. Building/player proportions and facade/road alignment remain consistent; all playable ground is continuous and collider-aligned.
3. The opt-in benchmark still runs and camera movement is seamless; other game routes unaffected.
4. Provide a comparison against V7 baseline screenshot at identical camera position, plus V7.1 native screenshot, close-up of facade detail, and uninterrupted camera traversal through the new section; no deceptive upscale-only comparison.
5. Build, existing tests and browser smoke checks run; record results, errors, FPS methodology, and limitations. Do not claim passes without logs.
6. **Stop at the three-house art acceptance gate**, even if more scenery is easy to generate. Do not scale across the full level until owner review.

## REQUIRED GITHUB RETURN
Commit `handoffs/V7_1_STAGE_RETURN.md` on implementation branch before stopping. Include:
- DONE/PARTIAL/BLOCKED with precise baseline, implementation branch, final SHA, changed files.
- What was created, art production method, exact game-unit scale and asset inventory.
- Acceptance matrix with PASS/FAIL/UNKNOWN and links to **committed** actual gameplay screenshots, comparison, short uninterrupted video and test/build logs; note unavailable reference.
- Specific visual weaknesses vs target; no exaggerated fidelity claims.
- Regression results, V6 separation, rollback to baseline.
- Designer review instructions and a **copyable follow-up prompt** for retrieving evidence and reviewing the work read-only. No implicit authorization for next phase.
If session ends early, commit truthful PARTIAL/BLOCKED return.

## RETURN
Respond with repo, implementation branch, final commit SHA, exact return handoff URL, test/evidence links and unresolved issues. Stop without merging or deploying.
