import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173'], { stdio: 'ignore' });
let browser;
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try { const response = await fetch('http://127.0.0.1:4173'); if (response.ok) { ready = true; break; } } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!ready) throw new Error('Vite preview did not become ready');

  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 760 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:4173/?test=1');
  await page.waitForFunction(() => window.__belfast?.scene('Title')?.sys.isActive());
  await mkdir('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/title-screen.png' });

  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__belfast?.scene('Game')?.player);
  await page.waitForTimeout(250);
  await page.screenshot({ path: 'artifacts/gameplay-screen.png' });
  const scene = await page.evaluate(() => window.__belfast.scene('Game'));
  const initialX = await page.evaluate(() => window.__belfast.scene('Game').player.x);
  await page.keyboard.down('D');
  await page.waitForTimeout(450);
  await page.keyboard.up('D');
  const movedX = await page.evaluate(() => window.__belfast.scene('Game').player.x);
  if (movedX <= initialX + 18) throw new Error(`Movement did not advance: ${initialX} -> ${movedX}`);
  const measuredFps = await page.evaluate(() => window.__belfast.fps());

  await page.evaluate(() => {
    const g = window.__belfast.scene('Game');
    const p = g.platforms.getChildren()[0];
    g.player.setPosition(p.x, p.body.top - 58);
    g.player.setVelocity(0, 195);
  });
  await page.waitForTimeout(550);
  const platformLanding = await page.evaluate(() => {
    const g = window.__belfast.scene('Game'); const p = g.platforms.getChildren()[0];
    return { x: g.player.x, y: g.player.y, top: p.body.top, bottom: g.player.body.bottom,
      grounded: g.player.body.blocked.down || g.player.body.touching.down, platformCount: g.platforms.countActive() };
  });
  if (!platformLanding.grounded || Math.abs(platformLanding.bottom - platformLanding.top) > 6 || platformLanding.platformCount < 5)
    throw new Error(`Platform landing failed: ${JSON.stringify(platformLanding)}`);
  const platformY = platformLanding.y;
  await page.keyboard.down('Space'); await page.waitForTimeout(60); await page.keyboard.up('Space');
  await page.waitForTimeout(240);
  const platformJump = await page.evaluate((startY) => {
    const g = window.__belfast.scene('Game'); return { y: g.player.y, rising: g.player.body.velocity.y < 0, delta: startY - g.player.y };
  }, platformY);
  if (!platformJump.rising || platformJump.delta < 24) throw new Error(`Platform jump failed: ${JSON.stringify(platformJump)}`);
  await page.waitForTimeout(1000);
  const platformReturn = await page.evaluate(() => {
    const g = window.__belfast.scene('Game'); const p = g.platforms.getChildren()[0];
    return { grounded: g.player.body.blocked.down || g.player.body.touching.down, bottom: g.player.body.bottom, top: p.body.top };
  });
  if (!platformReturn.grounded || Math.abs(platformReturn.bottom - platformReturn.top) > 6) throw new Error(`Landing after platform jump failed: ${JSON.stringify(platformReturn)}`);
  await page.evaluate(() => {
    const g=window.__belfast.scene('Game'),p=g.platforms.getChildren()[0];
    g.player.setPosition(p.x,p.body.top+27);g.player.body.reset(g.player.x,g.player.y);g.player.setVelocity(0,-340);
  });
  await page.waitForTimeout(190);
  const undersidePass = await page.evaluate(() => { const g=window.__belfast.scene('Game');return {y:g.player.y,velocityY:g.player.body.velocity.y}; });
  if (undersidePass.velocityY>=0 || undersidePass.y>=157) throw new Error(`Platform blocked a jump from below: ${JSON.stringify(undersidePass)}`);
  await page.evaluate(() => {
    const g = window.__belfast.scene('Game'); const p = g.platforms.getChildren()[0];
    g.spawnEnemy(300, 'shambler');
    const enemy = g.hostiles.getChildren().find((item) => item.active);
    enemy.setPosition(p.x - 76, 203); enemy.body.reset(enemy.x, enemy.y); enemy.body.setVelocity(0, 0);
    g.player.setPosition(p.x, p.body.top - 22); g.player.body.reset(g.player.x, g.player.y);
  });
  await page.waitForTimeout(240);
  const elevatedEnemy = await page.evaluate(() => {
    const e = window.__belfast.scene('Game').hostiles.getChildren().find((item) => item.active);
    return { climbAt: e?.getData('climbAt'), y: e?.y, velocityY: e?.body.velocity.y };
  });
  if (!(elevatedEnemy.climbAt > 0) || !(elevatedEnemy.velocityY < 0 || elevatedEnemy.y < 203)) throw new Error(`Enemy did not jump toward elevated player position: ${JSON.stringify(elevatedEnemy)}`);

  await page.keyboard.down('Space');
  await page.waitForTimeout(80);
  const jumpState = await page.evaluate(() => { const g=window.__belfast.scene('Game');return {velocity:g.player.body.velocity.y,y:g.player.y,blocked:g.player.body.blocked.down,touching:g.player.body.touching.down,key:g.keys.SPACE.isDown}; });
  await page.keyboard.up('Space');
  if (jumpState.velocity >= 0) throw new Error(`Jump did not launch upward: ${JSON.stringify(jumpState)}`);

  await page.keyboard.down('J');
  await page.waitForTimeout(70);
  await page.keyboard.up('J');
  await page.keyboard.down('K');
  await page.waitForTimeout(70);
  await page.keyboard.up('K');
  const visibleBullets = await page.evaluate(() => window.__belfast.scene('Game').bullets.countActive());
  await page.waitForTimeout(850);
  const combat = await page.evaluate(() => {
    const g = window.__belfast.scene('Game');
    return { grenades: g.ammo, bossHp: g.bossHp };
  });
  if (visibleBullets < 1 || combat.grenades !== 3 || combat.bossHp !== 0) throw new Error(`Combat inputs failed: ${JSON.stringify({ visibleBullets, ...combat })}`);
  await page.evaluate(() => {
    const g = window.__belfast.scene('Game'); const shot = g.hostileShots.get(g.player.x, g.player.y, 'acid');
    shot.setActive(true).setVisible(true); shot.body.reset(g.player.x, g.player.y); shot.setVelocity(0, 0);
  });
  await page.waitForTimeout(80);
  const acidCollision = await page.evaluate(() => {
    const g = window.__belfast.scene('Game'); return { health: g.health, playerBody: !!g.player.body, playerActive: g.player.active,
      projectileCount: g.hostileShots.countActive() };
  });
  if (acidCollision.health !== 4 || !acidCollision.playerBody || !acidCollision.playerActive || acidCollision.projectileCount > 0)
    throw new Error(`Acid collision damaged the wrong object: ${JSON.stringify(acidCollision)}`);
  await page.keyboard.down('P');
  await page.waitForTimeout(70);
  await page.keyboard.up('P');
  const paused = await page.evaluate(() => window.__belfast.scene('Game').paused);
  if (!paused) throw new Error('Pause key did not pause');
  await page.keyboard.down('Escape');
  await page.waitForTimeout(70);
  await page.keyboard.up('Escape');
  const resumed = await page.evaluate(() => !window.__belfast.scene('Game').paused);
  if (!resumed) throw new Error('Escape did not resume');

  const bossEntrance = await page.evaluate(() => {
    const g = window.__belfast.scene('Game');
    g.health = 2;
    g.player.setX(4010);
    g.waveCheck(4010);
    g.cameras.main.scrollX=4050;
    return { boss: !!g.boss, health: g.health };
  });
  if (!bossEntrance.boss || bossEntrance.health !== 4) throw new Error(`City Hall checkpoint did not restore two hearts: ${JSON.stringify(bossEntrance)}`);
  await page.waitForTimeout(250);
  await page.screenshot({ path: 'artifacts/city-hall-boss.png' });

  const flow = await page.evaluate(() => {
    const g = window.__belfast.scene('Game');
    for (const x of [1500, 3100, 4010]) { g.player.setX(x); g.waveCheck(x); }
    const sections = g.sectionAt(4000) + ' / ' + g.sectionAt(3200) + ' / ' + g.sectionAt(200);
    const bossCreated = !!g.boss;
    g.bossHp = 1;
    g.hitBoss({ active: true, destroy() {} }, {});
    const phaseTwo = g.bossPhase === 1 && g.bossHp === 26;
    g.bossHp = 1;
    g.hitBoss({ active: true, destroy() {} }, {});
    return { sections, bossCreated, phaseTwo, victory: g.complete };
  });
  if (!flow.bossCreated || !flow.phaseTwo || !flow.victory) throw new Error(`Finale state flow failed: ${JSON.stringify(flow)}`);
  await page.waitForTimeout(850);
  await page.screenshot({ path: 'artifacts/victory-screen.png' });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  const afterVictoryRestart = await page.evaluate(() => { const g=window.__belfast.scene('Game');return {x:g.player.x,health:g.health,complete:g.complete,active:g.scene.isActive()}; });
  if (afterVictoryRestart.x >= 100 || afterVictoryRestart.health !== 5 || afterVictoryRestart.complete) throw new Error(`Victory restart failed: ${JSON.stringify(afterVictoryRestart)}`);
  await page.evaluate(() => { const g=window.__belfast.scene('Game');g.lastDamage=-99999;g.damage(5,g.player.x); });
  await page.waitForTimeout(100);
  const deathAnimation = await page.evaluate(() => { const g=window.__belfast.scene('Game');return {health:g.health,dying:g.dying,angle:g.player.angle,bodyEnabled:g.player.body.enable}; });
  if (deathAnimation.health !== 0 || !deathAnimation.dying || !deathAnimation.bodyEnabled)
    throw new Error(`Player death animation did not begin: ${JSON.stringify(deathAnimation)}`);
  await page.waitForTimeout(650);
  const gameOver = await page.evaluate(() => { const g=window.__belfast.scene('Game');return {health:g.health,state:g.overlay.getData('state'),bodyEnabled:g.player.body.enable}; });
  if (gameOver.health !== 0 || gameOver.state !== 'DOWN' || gameOver.bodyEnabled)
    throw new Error(`Game over transition did not complete after death animation: ${JSON.stringify(gameOver)}`);
  await page.screenshot({ path: 'artifacts/game-over-screen.png' });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  const afterDeathRestart = await page.evaluate(() => { const g=window.__belfast.scene('Game');return {x:g.player.x,health:g.health,complete:g.complete}; });
  if (afterDeathRestart.x >= 100 || afterDeathRestart.health !== 5 || afterDeathRestart.complete) throw new Error(`Death restart failed: ${JSON.stringify(afterDeathRestart)}`);
  if (errors.length) throw new Error(`Browser exceptions: ${errors.join(' | ')}`);
  console.log(JSON.stringify({ initialX, movedX, measuredFps, platformLanding, platformJump, platformReturn, undersidePass, elevatedEnemy, jumpState, combat, acidCollision, flow, gameOverAndRestart: gameOver, afterVictoryRestart, afterDeathRestart, browserErrors: errors, screenshots: ['artifacts/title-screen.png', 'artifacts/gameplay-screen.png', 'artifacts/city-hall-boss.png', 'artifacts/game-over-screen.png', 'artifacts/victory-screen.png'] }, null, 2));
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
