# V7 — Belfast Residential Scene 1 | Authorized Cloud Codex Handoff

**Authorization:** LGM granted by Mark on 2026-10-24. **Executor:** External GitHub Cloud Codex. **State:** Handoff prepared; execution must be separately started in Cloud Codex.

## GOAL
Build a visually cohesive, detailed, original pixel-art **residential Belfast environment-only benchmark** inspired by the approved Designer mockup. Prioritize seamless background/foreground integration, believable consistent world scale, and uninterrupted scrolling. The reference image is in the Designer conversation; **do not assume it exists in this repository**. If unavailable, use the detailed specification below and report reference access as UNKNOWN. Never claim exact visual fidelity without comparison.

## SCOPE
- Work from the existing Phaser 3 / TypeScript / Vite game, based on `codex/v5-integration` (baseline recorded by Designer: `9935bc162be4b7eeee8a498341d67e1168be3e7d`). Verify actual starting SHA.
- Create a **separate implementation branch** such as `codex/v7-residential-scene1`. Do not implement on this handoff branch or main.
- Design **one continuous residential Belfast street**, approximately 90–120 seconds of unobstructed camera traversal at the existing player run speed, as a target rather than a reason to add filler.
- Rich but coherent Belfast red-brick terraces, slate roofs, chimney pots, authentic window/door/storey ratios, occasional modest shopfronts, walls, trees, distant skyline and subtle Belfast landmark silhouettes. Natural variation, no abrupt facade changes or visible repeating panels.
- Consistent shared world-scale specification: player height is reference; doors, windows, buildings, pavements and road are proportioned against it. Record actual chosen game-unit measurements, anchors and coordinate conventions. Do not use unverified mockup labels as physical dimensions.
- Continuous world-space pavement, kerb and asphalt; no gaps, floating surfaces or sudden height changes. Background and foreground should meet convincingly at street level.
- Distinct skyline / distant architecture / world-anchored facades / street / decorative foreground layers. Parallax only for distant non-colliding scenery; keep building facades and playable ground anchored to world coordinates.
- Dramatic cool blue-grey rainy dusk/night with warm window light, wet-road reflections, restrained flickering lamps, smoke and subtle rain; preserve gameplay legibility. Original carefully pixel-clustered arcade-quality artwork, no copied Metal Slug or third-party copyrighted assets.
- Retain only the existing flat ground needed to move through and inspect the scene. No vehicles, taxis, shelters, barricades, debris obstacles, zombies, new combat, raised platforms or physics modifications in the V7 benchmark. Decorative details may not block movement.
- Provide opt-in benchmark route (e.g. `?benchmark=v7`) leaving normal V4/V5 gameplay unaffected.

## DO NOT
Do not modify or merge the V6 physics branch. Do not overwrite V5.1 artwork work. Do not replace the engine, redesign characters, add obstacle mechanics, merge to main, deploy, publish, incur paid costs, alter security/credentials, or roll out other game areas. Access does not expand authorization. Do not hide seams with fade-to-black or camera cuts.

## IMPLEMENTATION FREEDOM
Inspect current architecture; reuse working systems and assets. Choose the smallest maintainable environment composition solution, with deterministic placements and recoverable commits. Make routine decisions autonomously; avoid unnecessary agents or preflights. If implementation conflicts with V6 collision anchors, document the interface requirement without editing V6.

## DONE WHEN
1. Continuous camera traversal shows no visible joins, sudden swaps, missing ground, abrupt scale/perspective changes or distracting repetitive facade patterns.
2. Character-to-door/window/storey ratios and road/pavement alignments remain consistent through the whole scene.
3. Background and foreground form one believable street; parallax never drifts collision geometry.
4. Original pixel-art visual quality and atmosphere are demonstrated in actual in-game screenshots, not merely concept art.
5. Normal gameplay remains unaffected outside the opt-in benchmark; build/tests pass; console errors and FPS are measured.
6. Evidence includes before/after screenshots, **one uninterrupted full-scene camera video**, seam/scale inspection images, test/build logs and known limitations.

## REQUIRED RETURN HANDOFF — WRITE INTO GITHUB
On the implementation branch, create **`handoffs/V7_RESIDENTIAL_SCENE1_RETURN.md`** and commit it before stopping. This is the authoritative Designer-retrievable completion packet, not merely a chat message.

Include sections:
- **Status:** DONE / PARTIAL / BLOCKED; never claim DONE without evidence.
- **Repository / branch / baseline SHA / final SHA** (if the handoff commit changes the final SHA, supply the final SHA in your final message and ensure branch head can be independently checked).
- **What changed:** concise human-readable summary, files/systems touched, architecture and scale contract.
- **Acceptance matrix:** each criterion PASS / FAIL / UNKNOWN with exact evidence paths.
- **Evidence:** committed screenshots, continuous gameplay recording, test logs, build output, FPS method/results, browser errors and limitations; avoid large binaries if repo limits prevent them, and explain where they can be retrieved.
- **V6 compatibility:** shared geometry assumptions and any integration conflicts, without changing V6.
- **Rollback:** branch/commit instructions.
- **Designer next action:** exact read-only review steps and whether further authorization is required.
- **Copyable follow-up prompt:** a concise prompt Designer can retrieve from this file for subsequent review or separately authorized next-phase work. Do not grant future authority in this prompt.

Keep the return file at the exact path above. Link to it in the final Cloud Codex response. If the session stops early, still commit a PARTIAL/BLOCKED handoff with accurate evidence and remaining work.

## REVIEW BOUNDARY
Stop after Scene 1 benchmark. Designer and Mark review actual game visuals before any further rollout. No merge, deployment or publication.
