import { chromium } from '@playwright/test';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { preview } from 'vite';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const out = 'artifacts/v6';
await mkdir(out, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 4173, strictPort: true } });
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
  try { await page.waitForFunction(({ since, seconds }) => window.__belfast.scene('Game').elapsed >= since + seconds, { since, seconds: ms / 1000 }, { timeout: Math.max(15000, ms * 30) }); }
  catch { throw new Error(`Simulation time stalled during ${ms} ms advance: ${JSON.stringify(await page.evaluate(()=>{const g=window.__belfast.scene('Game');return{elapsed:g.elapsed,health:g.health,paused:g.paused,active:g.scene.isActive(),fps:window.__belfast.fps()};}))}`); }
};
const assert = (condition, message, evidence) => { if (!condition) throw new Error(`${message}: ${JSON.stringify(evidence)}`); };
const waitForX = async (target, label) => { try { await page.waitForFunction((x)=>window.__belfast.scene('Game').player.x>=x,target,{timeout:12000}); } catch { throw new Error(`${label}: player did not reach x=${target}; state=${JSON.stringify(await state())}`); } };

try {
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

  await page.keyboard.down('D');await advance(250);await page.keyboard.up('D');await page.keyboard.down('A');await advance(150);const reversal=await state();await page.keyboard.up('A');await advance(80);
  assert(reversal.vx<0,'Directional reversal did not overcome existing momentum promptly',reversal);

  async function jumpPeak(holdMs) {
    await resetPlayer(200, 212); await advance(100);
    const since = await page.evaluate(() => { const g=window.__belfast.scene('Game'); g.__v6MinY=g.player.y; g.__v6JumpSample=()=>{g.__v6MinY=Math.min(g.__v6MinY,g.player.y);}; g.events.on('update',g.__v6JumpSample); return g.elapsed; });
    await page.keyboard.down('Space');
    await page.waitForFunction(({ since, seconds }) => window.__belfast.scene('Game').elapsed >= since + seconds, { since, seconds: holdMs / 1000 }, { timeout: 5000 });
    await page.keyboard.up('Space');
    try { await page.waitForFunction((since) => window.__belfast.scene('Game').elapsed >= since + .8, since, { timeout: 15000 }); }
    catch { throw new Error(`Jump arc sample stalled: ${JSON.stringify(await state())}`); }
    const minY = await page.evaluate(() => { const g=window.__belfast.scene('Game'); g.events.off('update',g.__v6JumpSample); delete g.__v6JumpSample; return g.__v6MinY; });
    return { startY: 212, minY, height: 212 - minY };
  }
  const tapJump = await jumpPeak(60);
  const heldJump = await jumpPeak(280);
  assert(tapJump.height > 15, 'Tap jump did not launch', tapJump);
  assert(heldJump.height > tapJump.height + 15, 'Variable jump height was not observed', { tapJump, heldJump });
  await resetPlayer(230,212);await advance(100);await page.keyboard.down('Space');await advance(300);await page.keyboard.up('Space');await advance(30);const firstAirborneJump=await state();await page.keyboard.down('Space');await advance(40);await page.keyboard.up('Space');const doubleJumpAttempt=await state();
  assert(firstAirborneJump.vy<0&&doubleJumpAttempt.vy>-180,'A second airborne jump launched unexpectedly',{firstAirborneJump,doubleJumpAttempt});await advance(500);

  // Keep the multi-rate test in the recorded foreground tab so browser background throttling cannot stall the simulation.
  const fpsPage=page;
  const fpsState=()=>fpsPage.evaluate(()=>{const g=window.__belfast.scene('Game'),b=g.player.body;return{x:g.player.x,y:g.player.y,vx:b.velocity.x,elapsed:g.elapsed,fps:window.__belfast.fps(),steps:g.__v6Steps,physicsFps:g.physics.world.fps};});
  const fpsRuns = [];
  for (const fps of [30, 120]) {
    await fpsPage.evaluate((rate) => {const g=window.__belfast.scene('Game');g.physics.world.setFPS(rate);g.hostiles.clear(true,true);g.spawned.clear();g.player.setPosition(100,210);g.player.body.reset(100,210);g.player.setVelocity(0,0);g.lastDamage=Infinity;g.__v6Steps=0;g.__v6TargetX=null;g.__v6TargetSteps=0;g.__v6StepHandler=()=>{g.__v6Steps++;if(g.__v6Steps===g.__v6TargetSteps)g.__v6TargetX=g.player.x};g.physics.world.on('worldstep',g.__v6StepHandler);}, fps);
    await fpsPage.keyboard.up('D');await fpsPage.keyboard.down('D');await fpsPage.waitForTimeout(250);const before=await fpsPage.evaluate(rate=>{const g=window.__belfast.scene('Game');g.__v6Steps=0;g.__v6TargetSteps=Math.round(rate*1.8);g.__v6TargetX=null;return{x:g.player.x,y:g.player.y,vx:g.player.body.velocity.x,elapsed:g.elapsed,fps:window.__belfast.fps(),physicsFps:g.physics.world.fps,targetSteps:g.__v6TargetSteps}},fps);
    await fpsPage.waitForFunction(()=>window.__belfast.scene('Game').__v6TargetX!==null,undefined,{timeout:20000});const after=await fpsPage.evaluate(()=>{const g=window.__belfast.scene('Game');return{x:g.__v6TargetX,y:g.player.y,vx:g.player.body.velocity.x,elapsed:g.elapsed,fps:window.__belfast.fps(),steps:g.__v6Steps,physicsFps:g.physics.world.fps}});
    await fpsPage.keyboard.up('D');await fpsPage.evaluate(()=>{const g=window.__belfast.scene('Game');g.physics.world.off('worldstep',g.__v6StepHandler);});
    fpsRuns.push({physicsFps:fps,renderFps:after.fps,simulatedSeconds:before.targetSteps/fps,distance:after.x-before.x,averageSpeed:(after.x-before.x)/(before.targetSteps/fps),physicsSteps:before.targetSteps,endY:after.y});
  }
  const ratio = Math.min(...fpsRuns.map((r) => r.distance)) / Math.max(...fpsRuns.map((r) => r.distance));
  assert(ratio > 0.8, 'Horizontal movement varied excessively across frame rates', { fpsRuns, ratio });
  const jumpRateRuns=[];
  for(const fps of [30,120]){
    await fpsPage.evaluate(rate=>{const g=window.__belfast.scene('Game'),p=g.player,b=p.body;g.physics.world.setFPS(rate);p.setPosition(100,210);b.reset(100,210);p.setVelocity(0,0);for(const flags of [b.blocked,b.touching,b.wasTouching])Object.assign(flags,{none:false,up:false,down:false,left:false,right:false});g.lastGroundedAt=-Infinity;g.jumpBufferedUntil=0;g.__v6JumpRate={start:null,landed:null,minY:p.y};g.__v6JumpRateHandler=()=>{const yb=p.body;if(yb.velocity.y<0&&g.__v6JumpRate.start===null)g.__v6JumpRate.start=g.elapsed;if(g.__v6JumpRate.start!==null){g.__v6JumpRate.minY=Math.min(g.__v6JumpRate.minY,p.y);if(g.elapsed>g.__v6JumpRate.start+.12&&(yb.blocked.down||yb.touching.down)&&Math.abs(yb.velocity.y)<1&&g.__v6JumpRate.landed===null)g.__v6JumpRate.landed=g.elapsed;}};g.events.on('update',g.__v6JumpRateHandler);},fps);
    await fpsPage.bringToFront();await fpsPage.keyboard.down('Space');try{await fpsPage.waitForFunction(()=>{const g=window.__belfast.scene('Game');return g.__v6JumpRate.start!==null&&g.player.body.velocity.y>=0;},undefined,{timeout:10000});}catch{throw new Error(`Rate-controlled jump did not reach apex: ${JSON.stringify(await fpsPage.evaluate(()=>{const g=window.__belfast.scene('Game'),b=g.player.body;return{rate:g.physics.world.fps,record:g.__v6JumpRate,x:g.player.x,y:g.player.y,vx:b.velocity.x,vy:b.velocity.y,grounded:b.blocked.down||b.touching.down,space:g.keys.SPACE.isDown,elapsed:g.elapsed,health:g.health,active:g.scene.isActive()};}))}`);}await fpsPage.keyboard.up('Space');
    await fpsPage.waitForFunction(()=>window.__belfast.scene('Game').__v6JumpRate.landed!==null,undefined,{timeout:10000});
    const jr=await fpsPage.evaluate(()=>{const g=window.__belfast.scene('Game'),r=g.__v6JumpRate;g.events.off('update',g.__v6JumpRateHandler);return{physicsFps:g.physics.world.fps,height:210-r.minY,airtime:r.landed-r.start,start:r.start,landed:r.landed};});jumpRateRuns.push(jr);
  }
  const jumpHeightRatio=Math.min(...jumpRateRuns.map(r=>r.height))/Math.max(...jumpRateRuns.map(r=>r.height));
  assert(jumpHeightRatio>0.8&&Math.abs(jumpRateRuns[0].airtime-jumpRateRuns[1].airtime)<.15,'Jump height or airtime varied excessively across frame rates',{jumpRateRuns,jumpHeightRatio});
  await fpsPage.evaluate(()=>{const g=window.__belfast.scene('Game');g.physics.world.setFPS(60);g.hostiles.clear(true,true);});

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
  await page.keyboard.down('D'); await page.keyboard.down('Space'); await waitForX(810,'Bus shelter approach'); await page.keyboard.up('D'); await page.keyboard.up('Space');
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
  assert(bufferedJump.vy < 0 || bufferedJump.y < 145, 'Buffered jump did not launch from the landing edge', bufferedJump);

  const camera = await state();
  assert(camera.scrollX > 0 && camera.scrollX < 4500, 'Camera failed to follow within world bounds', camera);
  const enemy = await page.evaluate(() => {
    const g = window.__belfast.scene('Game'); g.hostiles.clear(true,true); g.spawnEnemy(1000, 'runner'); const e = g.hostiles.getChildren().find(x => x.active); e.setPosition(1120, 209); e.body.reset(e.x, e.y); e.__v6MinY=e.y; e.__v6Sample=()=>{e.__v6MinY=Math.min(e.__v6MinY,e.y);}; g.events.on('update',e.__v6Sample); g.player.setPosition(1500, 212); g.player.body.reset(1500, 212); return { x:e.x,y:e.y };
  });
  await advance(1400);
  const obstacle = await page.evaluate(() => { const g = window.__belfast.scene('Game'); const e = g.hostiles.getChildren().find(x => x.active); g.events.off('update',e.__v6Sample); return { x:e?.x, y:e?.y, minY:e?.__v6MinY, vx:e?.body?.velocity.x, vy:e?.body?.velocity.y }; });
  assert(obstacle.x > 1208 && obstacle.minY < 205, 'Enemy failed to jump onto and traverse the car obstacle', { enemy, obstacle });

  const shelterEnemy=await page.evaluate(()=>{const g=window.__belfast.scene('Game');g.hostiles.clear(true,true);g.spawned=new Set([0,1]);g.player.setPosition(1200,210);g.player.body.reset(1200,210);g.spawnEnemy(750,'runner');const e=g.hostiles.getChildren().find(x=>x.active);e.setPosition(750,209);e.body.reset(e.x,e.y);e.__v6MinY=e.y;e.__v6Sample=()=>{e.__v6MinY=Math.min(e.__v6MinY,e.y)};g.events.on('update',e.__v6Sample);return{x:e.x,y:e.y};});
  await advance(1800);
  const shelterObstacle=await page.evaluate(()=>{const g=window.__belfast.scene('Game'),e=g.hostiles.getChildren().find(x=>x.active);g.events.off('update',e.__v6Sample);return{x:e?.x,y:e?.y,minY:e?.__v6MinY,vy:e?.body?.velocity.y};});
  assert(shelterObstacle.x>880&&shelterObstacle.minY<180,'Enemy failed to clear the bus shelter obstacle',{shelterEnemy,shelterObstacle});

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

  await page.evaluate(()=>{const g=window.__belfast.scene('Game');g.hostileShots.clear(true,true);const p=g.hostileShots.get(630,208,'acid');p.setActive(true).setVisible(true);p.body.reset(p.x,p.y);p.setVelocity(-115,0);p.body.allowGravity=false;p.setData('life',0);});
  await advance(700);
  const hostileWallImpact=await page.evaluate(()=>{const g=window.__belfast.scene('Game'),p=g.hostileShots.getChildren().find(x=>x.active);return{active:g.hostileShots.countActive(),x:p?.x??null};});
  assert(hostileWallImpact.active===0,'Enemy projectile crossed the taxi side collision boundary',hostileWallImpact);

  // Grenades bounce from solid ground and still detonate at the measured millisecond fuse.
  await page.evaluate(()=>{const g=window.__belfast.scene('Game');g.hostiles.clear(true,true);g.player.setPosition(1200,210);g.player.body.reset(1200,210);g.player.setVelocity(0,0).setFlipX(false);g.ammo=4;g.lastGrenade=-Infinity;});
  await page.keyboard.down('K');await advance(80);await page.keyboard.up('K');await page.waitForFunction(()=>window.__belfast.scene('Game').grenades.countActive()>0,undefined,{timeout:5000});
  const grenadeStart=await page.evaluate(()=>window.__belfast.scene('Game').elapsed);
  await page.evaluate(()=>{const g=window.__belfast.scene('Game');g.__v6BounceObserved=false;g.__v6GrenadeSample=()=>{const p=g.grenades.getChildren().find(x=>x.active);if(p){const b=p.body;if((b.blocked.down||b.touching.down)&&b.velocity.y<0)g.__v6BounceObserved=true;}};g.events.on('update',g.__v6GrenadeSample);});
  await page.waitForFunction(()=>{const g=window.__belfast.scene('Game');return g.__v6BounceObserved||g.grenades.countActive()===0;},undefined,{timeout:10000});
  const grenadeBounce=await page.evaluate(()=>{const g=window.__belfast.scene('Game'),p=g.grenades.getChildren().find(x=>x.active);return{x:p?.x,y:p?.y,vy:p?.body?.velocity.y,life:p?.getData('life'),active:g.grenades.countActive(),ammo:g.ammo,bounced:g.__v6BounceObserved,elapsed:g.elapsed};});
  assert(grenadeBounce.active===1&&grenadeBounce.ammo===3&&grenadeBounce.bounced,'Thrown grenade failed to bounce from the street',grenadeBounce);
  await page.waitForFunction(start=>window.__belfast.scene('Game').elapsed>=start+1.4,grenadeStart,{timeout:10000});
  const grenadeFuse=await page.evaluate(()=>{const g=window.__belfast.scene('Game');g.events.off('update',g.__v6GrenadeSample);return{active:g.grenades.countActive(),elapsed:g.elapsed};});
  assert(grenadeFuse.active===0,'Grenade did not detonate at the expected fuse time',grenadeFuse);

  const stressStart=await page.evaluate(()=>{const g=window.__belfast.scene('Game');g.hostiles.clear(true,true);g.bullets.clear(true,true);g.hostileShots.clear(true,true);g.grenades.clear(true,true);g.player.setPosition(1000,210);g.player.body.reset(1000,210);g.spawned=new Set([0,1,2,3,4,5,6,7,8,9]);for(let i=0;i<18;i++){g.spawnEnemy(1850+i*29,['shambler','runner','spitter'][i%3]);const e=g.hostiles.getChildren().find(x=>x.active&&Math.abs(x.x-(1850+i*29))<240);if(e){e.setPosition(1850+i*29,209);e.body.reset(e.x,e.y);}}for(let i=0;i<28;i++){const p=g.bullets.get(1680,208,'bullet');if(p){p.setActive(true).setVisible(true);p.body.reset(1680,208);p.setVelocityX(430);p.setVelocityY(0);p.body.allowGravity=false;p.setData('life',0);}}for(let i=0;i<16;i++){const p=g.hostileShots.get(2550,208,'acid');if(p){p.setActive(true).setVisible(true);p.body.reset(2550,208);p.setVelocityX(-115);p.setVelocityY(0);p.body.allowGravity=false;p.setData('life',0);}}for(let i=0;i<5;i++){const p=g.grenades.get(1750+i*5,205,'grenade');if(p){p.setActive(true).setVisible(true);p.body.reset(p.x,p.y);p.setGravityY(680);p.setVelocity(140,-260);p.setBounce(.55);p.setData('life',0);}}return{hostiles:g.hostiles.countActive(),bullets:g.bullets.countActive(),hostileShots:g.hostileShots.countActive(),grenades:g.grenades.countActive()};});
  await advance(1500);
  const stressAfter=await page.evaluate(()=>{const g=window.__belfast.scene('Game');return{hostiles:g.hostiles.countActive(),bullets:g.bullets.countActive(),hostileShots:g.hostileShots.countActive(),grenades:g.grenades.countActive(),fps:window.__belfast.fps()};});
  assert(stressStart.hostiles===18&&stressStart.bullets===28&&stressStart.hostileShots===16&&stressStart.grenades===5&&stressAfter.hostiles<=18&&stressAfter.bullets===0&&stressAfter.hostileShots===0&&stressAfter.grenades===0,'Physics groups failed under maximum active projectile/enemy load',{stressStart,stressAfter});
  await page.evaluate(()=>{const g=window.__belfast.scene('Game');g.hostiles.clear(true,true);g.bullets.clear(true,true);g.hostileShots.clear(true,true);g.grenades.clear(true,true);});

  // World bounds keep the player and camera inside the authored level at both ends.
  await page.evaluate(()=>{const g=window.__belfast.scene('Game');g.player.setPosition(20,210);g.player.body.reset(20,210);g.player.setVelocity(0,0);});
  await page.keyboard.down('A');await page.waitForFunction(()=>window.__belfast.scene('Game').player.x<10,undefined,{timeout:8000});await page.keyboard.up('A');await advance(700);
  const leftBound=await state();
  await page.evaluate(()=>{const g=window.__belfast.scene('Game');const x=4980-30;g.player.setPosition(x,210);g.player.body.reset(x,210);g.player.setVelocity(0,0);});
  await page.keyboard.down('D');await page.waitForFunction(()=>window.__belfast.scene('Game').player.x>4970,undefined,{timeout:8000});await page.keyboard.up('D');await advance(500);
  const rightBound=await state();
  assert(leftBound.x>=0&&leftBound.scrollX<50&&rightBound.x<=4980&&rightBound.scrollX<=4500,'World or camera escaped level bounds',{leftBound,rightBound});

  await page.evaluate(() => { const g=window.__belfast.scene('Game'); g.hostiles.clear(true,true); g.health=5; g.lastDamage=-Infinity; g.player.setPosition(200,210); g.player.body.reset(200,210); g.spawnEnemy(200,'runner'); const e=g.hostiles.getChildren().find(x=>x.active); e.setPosition(200,209); e.body.reset(e.x,e.y); e.body.moves=false; g.__v6KeepContact=()=>{g.player.setPosition(200,210);g.player.body.reset(200,210);};g.events.on('update',g.__v6KeepContact); });
  await advance(180); const firstContactHealth=await page.evaluate(()=>window.__belfast.scene('Game').health); await advance(1350); const sustainedContactHealth=await page.evaluate(()=>window.__belfast.scene('Game').health);
  await page.evaluate(()=>{const g=window.__belfast.scene('Game');g.events.off('update',g.__v6KeepContact);g.player.setPosition(400,210);g.player.body.reset(400,210);});await advance(150);await page.evaluate(()=>{const g=window.__belfast.scene('Game');g.player.setPosition(200,210);g.player.body.reset(200,210);});await advance(150);const recontactHealth=await page.evaluate(()=>window.__belfast.scene('Game').health);
  assert(firstContactHealth===4&&sustainedContactHealth===4&&recontactHealth===3,'Sustained contact repeated damage or a separated recontact failed to damage',{firstContactHealth,sustainedContactHealth,recontactHealth});
  await page.evaluate(() => { const g=window.__belfast.scene('Game'); g.hostiles.clear(true,true); g.player.setPosition(544,172); g.player.body.reset(544,172); g.player.setVelocity(0,0); const w=g.physics.world;w.drawDebug=true;if(!w.debugGraphic)w.createDebugGraphic(); });
  await advance(300); await page.screenshot({ path: `${out}/collision-debug.png` });
  await page.evaluate(() => { const g=window.__belfast.scene('Game'); g.player.setPosition(820,170); g.player.body.reset(820,170); g.player.setVelocity(0,0); });
  await advance(700); await page.screenshot({ path: `${out}/collision-debug-shelter.png` });
  if (errors.length) throw new Error(`Browser exceptions: ${errors.join(' | ')}`);

  const report = { result: 'PASS', browser: 'Playwright Chromium headless', baselineCommit: '7506b604f3bcc64bf3168e870cd636e099d9dcd5', start, acceleration, run, stopping, reversal, tapJump, heldJump, firstAirborneJump, doubleJumpAttempt, fpsRuns, fpsDistanceRatio: ratio, jumpRateRuns, jumpHeightRatio, carLanding, carExit, shelterLanding, coyoteEdge, coyoteJump, bufferApproach, bufferedJump, shelterExit, camera, obstacle, shelterObstacle, combat, projectileHit, wallImpact, hostileWallImpact, grenadeBounce, grenadeFuse, stressStart, stressAfter, leftBound, rightBound, sustainedContact: {firstContactHealth,sustainedContactHealth,recontactHealth}, errors, screenshots: [`${out}/car-roof.png`, `${out}/bus-shelter.png`, `${out}/collision-debug.png`, `${out}/collision-debug-shelter.png`] };
  await writeFile(`${out}/results.json`, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await context.close();
  if (video) await rename(await video.path(), `${out}/keyboard-benchmark.webm`);
  await browser.close();
  await new Promise((resolve, reject) => server.httpServer.close((error) => error ? reject(error) : resolve()));
}
