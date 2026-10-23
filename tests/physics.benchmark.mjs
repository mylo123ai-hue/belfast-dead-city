import { chromium } from '@playwright/test';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const out = 'artifacts/v6';
await mkdir(out, { recursive: true });
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4173'], { stdio: 'ignore' });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1200, height: 760 }, recordVideo: { dir: out, size: { width: 1200, height: 760 } } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
let video;
const state = () => page.evaluate(() => {
  const g = window.__belfast.scene('Game'); const b = g.player.body;
  return { x: g.player.x, y: g.player.y, vx: b.velocity.x, vy: b.velocity.y, grounded: b.blocked.down || b.touching.down, scrollX: g.cameras.main.scrollX, elapsed: g.elapsed, fps: window.__belfast.fps() };
});
const resetPlayer = async (x, y) => page.evaluate(({ x, y }) => {
  const g = window.__belfast.scene('Game'); g.player.setPosition(x, y); g.player.body.reset(x, y); g.player.setVelocity(0, 0); 
}, { x, y });
const advance = async (ms) => {
  const since = await page.evaluate(() => window.__belfast.scene('Game').elapsed);
  await page.waitForFunction(({ since, seconds }) => window.__belfast.scene('Game').elapsed >= since + seconds, { since, seconds: ms / 1000 }, { timeout: Math.max(5000, ms * 8) });
};
const assert = (condition, message, evidence) => { if (!condition) throw new Error(`${message}: ${JSON.stringify(evidence)}`); };

try {
  let ready = false;
  for (let i = 0; i < 60; i++) { try { if ((await fetch('http://127.0.0.1:4173')).ok) { ready = true; break; } } catch {} await wait(250); }
  if (!ready) throw new Error('Vite preview did not become ready');
  await page.goto('http://127.0.0.1:4173/?test=1');
  await page.waitForFunction(() => window.__belfast?.scene('Title')?.sys.isActive());
  video = page.video();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__belfast?.scene('Game')?.player);
  await page.waitForFunction(() => window.__belfast.scene('Game').elapsed > .22);

  const start = await state();
  await page.keyboard.down('D'); await advance(80); const acceleration = await state();
  await advance(450); const run = await state();
  await page.keyboard.up('D'); await advance(120); const stopping = await state();
  assert(acceleration.vx > 0 && acceleration.vx <= 128 && acceleration.x-start.x < (acceleration.elapsed-start.elapsed)*128*.8, 'Acceleration ramp was not gradual', { start, acceleration });
  assert(run.x - start.x > 25, 'Keyboard movement did not advance', { start, run });
  assert(Math.abs(stopping.vx) < 10, 'Player did not stop promptly', stopping);

  async function jumpPeak(holdMs) {
    await resetPlayer(200, 212); await advance(100);
    const since = await page.evaluate(() => { const g=window.__belfast.scene('Game'); g.__v6MinY=g.player.y; g.__v6JumpSample=()=>{g.__v6MinY=Math.min(g.__v6MinY,g.player.y);}; g.events.on('update',g.__v6JumpSample); return g.elapsed; });
    await page.keyboard.down('Space');
    await page.waitForFunction(({ since, seconds }) => window.__belfast.scene('Game').elapsed >= since + seconds, { since, seconds: holdMs / 1000 }, { timeout: 5000 });
    await page.keyboard.up('Space');
    await page.waitForFunction((since) => window.__belfast.scene('Game').elapsed >= since + .8, since, { timeout: 7000 });
    const minY = await page.evaluate(() => { const g=window.__belfast.scene('Game'); g.events.off('update',g.__v6JumpSample); delete g.__v6JumpSample; return g.__v6MinY; });
    return { startY: 212, minY, height: 212 - minY };
  }
  const tapJump = await jumpPeak(60);
  const heldJump = await jumpPeak(280);
  assert(tapJump.height > 15, 'Tap jump did not launch', tapJump);
  assert(heldJump.height > tapJump.height + 15, 'Variable jump height was not observed', { tapJump, heldJump });

  // Use a second, unrecorded game tab to avoid video encoding distorting the fixed-step measurement.
  await page.evaluate(() => window.__belfast.scene('Game').scene.pause());
  const fpsPage=await browser.newPage({viewport:{width:1200,height:760}});fpsPage.on('pageerror',(e)=>errors.push(e.message));
  await fpsPage.goto('http://127.0.0.1:4173/?test=1');await fpsPage.keyboard.press('Enter');await fpsPage.waitForFunction(()=>window.__belfast.scene('Game')?.player);await fpsPage.waitForFunction(()=>window.__belfast.scene('Game').elapsed>.3);
  const fpsState=()=>fpsPage.evaluate(()=>{const g=window.__belfast.scene('Game'),b=g.player.body;return{x:g.player.x,y:g.player.y,vx:b.velocity.x,elapsed:g.elapsed,fps:window.__belfast.fps(),steps:g.__v6Steps,physicsFps:g.physics.world.fps};});
  const fpsRuns = [];
  for (const fps of [30, 120]) {
    await fpsPage.evaluate((rate) => {const g=window.__belfast.scene('Game');g.physics.world.setFPS(rate);g.hostiles.clear(true,true);g.spawned.clear();g.player.setPosition(100,210);g.player.body.reset(100,210);g.player.setVelocity(0,0);g.lastDamage=Infinity;g.__v6Steps=0;g.__v6StepHandler=()=>g.__v6Steps++;g.physics.world.on('worldstep',g.__v6StepHandler);}, fps);
    await fpsPage.keyboard.up('D');await fpsPage.keyboard.down('D');await fpsPage.waitForTimeout(250);const before=await fpsState();
    await fpsPage.waitForFunction(({since})=>window.__belfast.scene('Game').elapsed>=since+1.8,{since:before.elapsed},{timeout:20000});const after=await fpsState();
    await fpsPage.keyboard.up('D');await fpsPage.evaluate(()=>{const g=window.__belfast.scene('Game');g.physics.world.off('worldstep',g.__v6StepHandler);});
    fpsRuns.push({physicsFps:fps,renderFps:after.fps,simulatedSeconds:after.elapsed-before.elapsed,distance:after.x-before.x,averageSpeed:(after.x-before.x)/(after.elapsed-before.elapsed),physicsSteps:after.steps-before.steps,endY:after.y});
  }
  const ratio = Math.min(...fpsRuns.map((r) => r.distance)) / Math.max(...fpsRuns.map((r) => r.distance));
  assert(ratio > 0.8, 'Horizontal movement varied excessively across frame rates', { fpsRuns, ratio });
  await fpsPage.close();await page.evaluate(() => window.__belfast.scene('Game').scene.resume());

  // Run onto the parked taxi roof with ordinary keyboard input, then leave it again.
  await resetPlayer(480, 212); await advance(120);
  await page.keyboard.down('D'); await page.keyboard.down('Space');
  await page.waitForFunction(() => window.__belfast.scene('Game').player.x>=540,undefined,{timeout:12000});
  await page.keyboard.up('D'); await page.keyboard.up('Space');
  await page.waitForFunction(() => {const g=window.__belfast.scene('Game'),b=g.player.body;return (b.blocked.down||b.touching.down)&&g.player.y<198;},undefined,{timeout:12000});
  const carLanding = await state();
  await page.screenshot({ path: `${out}/car-roof.png` });
  assert(carLanding.x > 510 && carLanding.x < 578 && carLanding.y < 198 && carLanding.grounded, 'Player did not land on the car roof using keyboard controls', carLanding);
  await page.keyboard.down('D'); await page.keyboard.down('Space'); await page.waitForFunction(()=>window.__belfast.scene('Game').player.x>=640,undefined,{timeout:12000}); await page.keyboard.up('D'); await page.keyboard.up('Space'); await page.waitForFunction(()=>{const g=window.__belfast.scene('Game'),b=g.player.body;return (b.blocked.down||b.touching.down)&&g.player.y>198&&Math.abs(b.velocity.y)<1;},undefined,{timeout:12000});
  const carExit = await state();
  assert(carExit.x > 578 && carExit.y > 198, 'Player did not traverse and leave the car', carExit);

  // Bus shelter traversal is likewise performed with keyboard input.
  await resetPlayer(760, 212); await advance(120);
  await page.keyboard.down('D'); await page.keyboard.down('Space'); await page.waitForFunction(()=>window.__belfast.scene('Game').player.x>=820,undefined,{timeout:12000}); await page.keyboard.up('D'); await page.keyboard.up('Space');
  await page.waitForFunction(()=>{const g=window.__belfast.scene('Game'),b=g.player.body;return (b.blocked.down||b.touching.down)&&g.player.y<198;},undefined,{timeout:12000});
  const shelterLanding = await state();
  await page.screenshot({ path: `${out}/bus-shelter.png` });
  assert(shelterLanding.x > 781 && shelterLanding.x < 859 && shelterLanding.y < 198 && shelterLanding.grounded, 'Player did not land on the shelter using keyboard controls', shelterLanding);
  await page.keyboard.down('D'); await page.keyboard.down('Space'); await page.waitForFunction(()=>window.__belfast.scene('Game').player.x>=900,undefined,{timeout:12000}); await page.keyboard.up('D'); await page.keyboard.up('Space'); await page.waitForFunction(()=>{const g=window.__belfast.scene('Game'),b=g.player.body;return (b.blocked.down||b.touching.down)&&g.player.y>198&&Math.abs(b.velocity.y)<1;},undefined,{timeout:12000});
  const shelterExit = await state();
  assert(shelterExit.x > 859 && shelterExit.y > 198, 'Player did not leave the shelter', shelterExit);

  // Walk off the shelter, then jump during the short coyote window.
  await resetPlayer(848, 170); await advance(150);
  await page.evaluate(() => { const g=window.__belfast.scene('Game'); g.__v6Edge=null; g.__v6EdgeSample=()=>{const b=g.player.body;if(!g.__v6Edge&&!(b.blocked.down||b.touching.down))g.__v6Edge={x:g.player.x,y:g.player.y,elapsed:g.elapsed};}; g.events.on('update',g.__v6EdgeSample); });
  await page.keyboard.down('D');
  await page.waitForFunction(() => !!window.__belfast.scene('Game').__v6Edge, undefined, { timeout: 5000 });
  await page.keyboard.down('Space'); await advance(25);
  const coyoteResult = await page.evaluate(() => { const g=window.__belfast.scene('Game'),b=g.player.body; g.events.off('update',g.__v6EdgeSample); return { edge:g.__v6Edge,jump:{x:g.player.x,y:g.player.y,vy:b.velocity.y,grounded:b.blocked.down||b.touching.down} }; });
  const coyoteEdge=coyoteResult.edge,coyoteJump=coyoteResult.jump;
  await page.keyboard.up('Space'); await page.keyboard.up('D');
  assert(coyoteJump.vy < 0, 'Coyote-time jump did not launch', { coyoteEdge, coyoteJump });

  // Buffer jump shortly before landing on the same shelter platform.
  const bufferApproach=await page.evaluate(() => { const g=window.__belfast.scene('Game'),b=g.player.body; g.player.setPosition(820,165); b.reset(820,165); g.player.setVelocity(0,80); for(const flags of [b.blocked,b.touching,b.wasTouching])Object.assign(flags,{none:false,up:false,down:false,left:false,right:false}); g.lastGroundedAt=-Infinity; g.jumpBufferedUntil=0; return {x:g.player.x,y:g.player.y,vy:b.velocity.y,grounded:b.blocked.down||b.touching.down}; });
  assert(!bufferApproach.grounded&&bufferApproach.vy>0,'Jump-buffer setup was not airborne',bufferApproach);
  await page.keyboard.down('Space'); await advance(80); await page.keyboard.up('Space'); await advance(30);
  const bufferedJump = await state();
  assert(bufferedJump.vy < 0 && bufferedJump.y < 170, 'Buffered jump did not trigger on landing', bufferedJump);

  const camera = await state();
  assert(camera.scrollX > 0 && camera.scrollX < 4500, 'Camera failed to follow within world bounds', camera);
  const enemy = await page.evaluate(() => {
    const g = window.__belfast.scene('Game'); g.hostiles.clear(true,true); g.spawnEnemy(1000, 'runner'); const e = g.hostiles.getChildren().find(x => x.active); e.setPosition(1120, 209); e.body.reset(e.x, e.y); e.__v6MinY=e.y; e.__v6Sample=()=>{e.__v6MinY=Math.min(e.__v6MinY,e.y);}; g.events.on('update',e.__v6Sample); g.player.setPosition(1500, 212); g.player.body.reset(1500, 212); return { x:e.x,y:e.y };
  });
  await advance(1400);
  const obstacle = await page.evaluate(() => { const g = window.__belfast.scene('Game'); const e = g.hostiles.getChildren().find(x => x.active); g.events.off('update',e.__v6Sample); return { x:e?.x, y:e?.y, minY:e?.__v6MinY, vx:e?.body?.velocity.x, vy:e?.body?.velocity.y }; });
  assert(obstacle.x > 1208 && obstacle.minY < 205, 'Enemy failed to jump onto and traverse the car obstacle', { enemy, obstacle });

  // Keep combat inputs active while moving and jumping through the encounter.
  await page.evaluate(() => { const g = window.__belfast.scene('Game'); g.player.setPosition(980, 210); g.player.body.reset(980, 210); g.player.setVelocity(0, 0); });
  await page.keyboard.down('D'); await page.keyboard.down('Space'); await page.keyboard.down('J'); await advance(90); await page.keyboard.up('J'); await advance(170); await page.keyboard.up('Space'); await advance(300); await page.keyboard.up('D');
  const combat = await page.evaluate(() => { const g = window.__belfast.scene('Game'); return { x: g.player.x, y: g.player.y, bullets: g.bullets.countActive(), lastFire: g.lastFire, kills: g.kills }; });
  assert(combat.x > 980 && combat.y < 212 && combat.lastFire > 0, 'Moving jump and combat inputs did not execute', combat);

  // A keyboard-fired shot damages an enemy once; the same weapon stops at a car body.
  await page.evaluate(() => { const g=window.__belfast.scene('Game'); g.bullets.clear(true,true); g.hostiles.clear(true,true); g.player.setPosition(200,210); g.player.body.reset(200,210); g.player.setVelocity(0,0).setFlipX(false); g.spawnEnemy(245,'runner'); const e=g.hostiles.getChildren().find(x=>x.active); e.setPosition(245,209); e.body.reset(245,209); e.body.moves=false; window.__v6TargetHp=e.getData('hp'); });
  await page.keyboard.down('J'); await advance(55); await page.keyboard.up('J'); await advance(100);
  const projectileHit=await page.evaluate(()=>{const g=window.__belfast.scene('Game'),e=g.hostiles.getChildren().find(x=>x.active);return {hp:e?.getData('hp'),initialHp:window.__v6TargetHp,bullets:g.bullets.countActive()};});
  assert(projectileHit.hp===projectileHit.initialHp-1,'Projectile failed to damage a zombie exactly once',projectileHit);
  await page.evaluate(()=>{const g=window.__belfast.scene('Game');g.bullets.clear(true,true);g.hostiles.clear(true,true);g.player.setPosition(480,210);g.player.body.reset(480,210);g.player.setVelocity(0,0).setFlipX(false);g.lastFire=-Infinity;});
  await page.keyboard.down('J'); await advance(150); await page.keyboard.up('J');
  const wallImpact=await page.evaluate(()=>{const g=window.__belfast.scene('Game');return {lastFire:g.lastFire,activeBullets:g.bullets.countActive()};});
  assert(wallImpact.lastFire>0&&wallImpact.activeBullets===0,'Projectile crossed the car side collision boundary',wallImpact);

  await page.evaluate(() => { const g=window.__belfast.scene('Game'); g.hostiles.clear(true,true); g.health=5; g.lastDamage=-Infinity; g.player.setPosition(200,210); g.player.body.reset(200,210); g.spawnEnemy(200,'runner'); const e=g.hostiles.getChildren().find(x=>x.active); e.setPosition(200,210); e.body.reset(200,210); });
  await advance(180); const firstContactHealth=await page.evaluate(()=>window.__belfast.scene('Game').health); await advance(350); const sustainedContactHealth=await page.evaluate(()=>window.__belfast.scene('Game').health);
  assert(firstContactHealth===4&&sustainedContactHealth===4,'One sustained enemy contact caused repeated damage',{firstContactHealth,sustainedContactHealth});
  await page.evaluate(() => { const g=window.__belfast.scene('Game'); g.hostiles.clear(true,true); g.player.setPosition(544,172); g.player.body.reset(544,172); g.player.setVelocity(0,0); const w=g.physics.world;w.drawDebug=true;if(!w.debugGraphic)w.createDebugGraphic(); });
  await advance(300); await page.screenshot({ path: `${out}/collision-debug.png` });
  await page.evaluate(() => { const g=window.__belfast.scene('Game'); g.player.setPosition(820,170); g.player.body.reset(820,170); g.player.setVelocity(0,0); });
  await advance(700); await page.screenshot({ path: `${out}/collision-debug-shelter.png` });
  if (errors.length) throw new Error(`Browser exceptions: ${errors.join(' | ')}`);

  const report = { result: 'PASS', browser: 'Playwright Chromium headless', baselineCommit: '7506b604f3bcc64bf3168e870cd636e099d9dcd5', start, acceleration, run, stopping, tapJump, heldJump, fpsRuns, fpsDistanceRatio: ratio, carLanding, carExit, shelterLanding, coyoteEdge, coyoteJump, bufferApproach, bufferedJump, shelterExit, camera, obstacle, combat, projectileHit, wallImpact, sustainedContact: {firstContactHealth,sustainedContactHealth}, errors, screenshots: [`${out}/car-roof.png`, `${out}/bus-shelter.png`, `${out}/collision-debug.png`, `${out}/collision-debug-shelter.png`] };
  await writeFile(`${out}/results.json`, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await context.close();
  if (video) await rename(await video.path(), `${out}/keyboard-benchmark.webm`);
  await browser.close();
  server.kill('SIGTERM');
}
