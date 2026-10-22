# BELFAST: DEAD CITY

A keyboard-first arcade run-and-gun through a zombie outbreak in Belfast. Built with Phaser 3, TypeScript and Vite. Artwork and sound are original project assets or synthesized at runtime; play requires no account or online service.

## Play locally

```sh
npm ci
npm run dev
```

Open the local Vite URL. Press **Enter** or **Space** at the title screen.

| Key | Action |
| --- | --- |
| A / D | Move |
| Space / W | Jump |
| J | Fire |
| K | Throw a grenade |
| P / Esc | Pause or resume |
| M | Mute or unmute synthesized effects |
| Enter / R | Start, restart, or replay |

The single route travels through residential terraces, the city centre, and a City Hall-inspired finale. Its three enemy types are shamblers, runners, and spitters. A two-phase boss closes the route. Low street structures provide optional jump-up fighting positions; a checkpoint near City Hall restores up to two health hearts.

## V3 gameplay and visual work

- Added taxi, brick-wall, and bus-shelter platforms with top-only collision; buffered jumps, coyote time, landing feedback, and enemy jumps toward elevated players.
- Improved enemy telegraphs and reactions, grenade bounce, blast damage and knockback, boss phases, camera feedback, pause, and restart. Fixed projectile collision handling that could remove the player body.
- Integrated original Belfast residential, city-centre, and City Hall arcade backdrops; added a four-pose boss, and detailed original taxi, bus-shelter and brick-wall platform sprites. The V2 benchmark remains at `/?benchmark=1`.
- Player, two common zombie types, and explosion use the V2 frame sets. Spitter still uses a simpler locally drawn sprite treatment, and some street trim and impact particles are less detailed than the painted scene art; the visual style is not fully uniform.

Main-level art files are in `src/assets/`. This includes eight player poses, four shambler poses and four runner poses (from an eight-frame zombie set), an eight-frame explosion, four original boss poses, a platform prop atlas and three extracted platform sprites, and Belfast backdrop source illustrations with reduced game panels. Original source illustrations are kept beside their reduced game panels for inspection. The backgrounds are detailed pixel-treated illustrations; characters and some props have a coarser, smaller pixel scale.

## Verify and record

```sh
npm test
npm run test:browser
npm run record
npm run record:benchmark
```

`npm run test:browser` builds the production site and runs Chromium integration and benchmark smoke tests. The gameplay recorder uses keyboard inputs in headless Chromium and saves a WebM plus stage captures under `artifacts/`. Its test helpers can inspect scene state; the attached full-run video itself uses ordinary controls and does not change game state.

The recorded V3 keyboard run reached the City Hall boss and the victory screen without state manipulation. It lasted 54.04 seconds of video (52 seconds on the in-game timer), so it verifies a complete route but **does not meet the desired 8–12 minute playthrough target**. The automated boss smoke test separately forces phase transitions and victory to verify restart and flow; this is not counted as natural completion evidence.

## Evidence

V3 screenshots from the recorded keyboard run:

![Residential Belfast with a taxi fighting position](artifacts/v3-residential.png)

![City-centre encounter](artifacts/v3-city-centre.png)

![City Hall boss encounter](artifacts/v3-city-hall-boss.png)

![Explosion and combat effects](artifacts/v3-explosion.png)

![Victory screen](artifacts/v3-victory.png)

[Watch the complete keyboard playthrough](artifacts/v3-full-playthrough.webm)

The older V2 benchmark evidence is retained separately as `benchmark-street.png`, `benchmark-combat.png`, and `benchmark-gameplay.webm` under `artifacts/`.

## Build and GitHub Pages

```sh
npm ci
npm run build
npm run preview
```

The static build is written to `dist/`, and Vite uses relative asset paths for repository-path hosting. The GitHub Actions verification workflow runs unit and browser checks and uploads the built site as an artifact. The repository also contains a manually dispatched Pages deployment workflow. Set the repository Pages source to **GitHub Actions**, then run that deployment workflow on the reviewed source branch to publish. No deployment has been performed for V3.

## Performance notes

Sampling was done in headless Chromium 156 on the Linux cloud runner at a 1200 × 760 viewport. The main-game smoke test sampled 59.1 FPS early in play, the natural recorded run sampled roughly 55–60 FPS, and the warmed benchmark sampled 60.25 FPS. This is not a sustained physical-desktop benchmark, and stable 60 FPS is not claimed.
