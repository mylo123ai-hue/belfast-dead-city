# V7.2 Phase 1 — Belfast Environmental Cohesion

TASK ID: V7-2-P1-ENV
AUTHORIZED: Owner explicitly selected “Submit phase 1” on 24 October 2026.
REPOSITORY: mylo123ai-hue/belfast-dead-city
BASELINE: codex/v7-1-residential-stage @ 1eec8b77967813cfaf43e02b32be4536cb0d87d4
IMPLEMENTATION BRANCH (suggested): codex/v7-2-phase1-environment
RESULTS PATH: codex/results/V7-2-P1-ENV.md

## GOAL
Make the existing **first three Belfast terraced houses** read as one coherent, original, richly illustrated 1990s arcade-pixel-art street scene. The sky, distant background, pavement, kerb, road and foreground must look like they belong to the V7.1 houses, rather than disconnected procedural layers. Preserve existing functionality.

## SCOPE
- Redesign/replace sky and distant skyline with layered blue-grey clouds, subdued warm dusk horizon, distant Belfast roof/chimney silhouettes and a restrained recognisable Harland & Wolff Samson/Goliath crane silhouette where legible. Consistent palette, lighting and depth/parallax.
- Rework pavement, front-door steps, kerbs, drainage, subtle railings/front walls and non-colliding street dressing to integrate physically and visually with the house facade. Use coherent native-resolution pixel density and perspective.
- Rework street road surface with believable dark weathered asphalt, restrained puddles/reflections, worn markings, patched cracks and drains. Match reflections to lighting and architecture; avoid an overly glossy/watery road.
- **Loyalist East Belfast identity:** selected kerbstones painted in faded/weathered red, white and blue, integrated naturally and legibly into the street. Preserve neutral road surfaces; flags/murals may remain future phases, not a requirement to build them now.
- Improve seams and layer transitions **within the first three-house gate**. Where the legacy V7 art resumes at X≈600, keep an honest transition and document limitations; do not expand the illustrated neighbourhood beyond the acceptance gate.
- Retain and visually integrate the existing V7.1 houses; small non-destructive compositing adjustments are allowed where essential to the cohesion goal.
- Create original repository-contained art assets and integrate them into the actual Phaser scene, not just a mockup. Use the existing rendering/asset pipeline wherever practical.
- Maintain native 480×270 gameplay readability, existing 24×32 walker, ground collider top Y=225, scrolling and parallax, V7 and V7.1 benchmark entry paths. Preserve the 14,500-unit world and normal game route.
- Use authentic Belfast residential architecture and restrained moderate-apocalypse damage; keep community representation grounded, without stereotypes or paramilitary glorification.

## DO NOT
- Do not modify player/zombie sprites or animation, V6 physics, combat, enemies, gameplay obstacles, collision geometry, pickups, vehicles, platforms, level progression, audio or control systems.
- Do not add the republican neighbourhood, Falls Road International Wall, additional loyalist street sections, full-length stage, or new gameplay zones. Those are later phases.
- Do not copy protected artwork, actual mural reproductions, or game assets from Metal Slug; create original pixel art inspired by 1990s arcade craftsmanship.
- Do not access OpenClaw Lab, owner devices, secrets, unrelated repositories or external paid services.
- No unauthorized merges, deployments, protected branch writes, security/credential changes, spending, irreversible external effects or scope expansion.

## DONE WHEN
1. A native 480×270 **in-game** screenshot of the same first three houses demonstrates consistent lighting, perspective, pixel density and visual connection across sky → buildings → pavement/kerbs → road. Include clear faded red/white/blue kerbstone accents on a believable loyalist-area residential street.
2. Before/after screenshots at the same player and camera coordinates, close-up pavement/road detail, and a native screenshot showing the sky/cranes, all committed under artifacts/v7-2/. No concept-only screenshots passed off as gameplay.
3. One uninterrupted three-house traversal recording proves world-anchored surfaces, parallax, seams and no popping/clipping. Explain any visible X≈600 boundary and do not hide unresolved seams.
4. Player and ground scale remain unchanged (480×270, walker ~24×32, ground top Y=225); no new physical blockers. Existing V7/V7.1/normal routes work.
5. Run and record npm run build, npm test, npm run test:browser, existing V7/V7.1 checks and an appropriate V7.2 smoke/traversal test. Include actual commands, pass/fail, browser errors and sampled FPS. Diagnose and repair failures autonomously inside scope.
6. Commit implementation and evidence on task branch and open/update a PR without merging. Provide criterion-by-criterion VERIFIED/INFERRED/UNKNOWN evidence and limitations. Aesthetic approval remains the owner's decision; Codex may not self-certify visual acceptance.

## RETURN
Create and push **codex/results/V7-2-P1-ENV.md** on a Designer-readable implementation/PR branch, including summary, changed files and art inventory, commit SHAs, task branch/PR link, screenshot/video/log links, test commands/outcomes, acceptance matrix, risks/limitations, rollback steps and status COMPLETED / PARTIAL / BLOCKED. If publication fails, report BLOCKED, not DONE. Preserve routine autonomy to inspect, implement, test, troubleshoot, retry and recover inside scope. Stop after publishing; owner will separately request Designer Sync.
