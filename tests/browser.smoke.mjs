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
  const combat = await page.evaluate(() => {
    const g = window.__belfast.scene('Game');
    return { visibleBullets: g.bullets.countActive(), grenades: g.ammo };
  });
  if (combat.visibleBullets < 1 || combat.grenades !== 3) throw new Error(`Combat inputs failed: ${JSON.stringify(combat)}`);
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

  await page.evaluate(() => {
    const g = window.__belfast.scene('Game');
    g.player.setX(4010);
    g.waveCheck(4010);
    g.cameras.main.scrollX=4050;
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: 'artifacts/city-hall-boss.png' });

  const flow = await page.evaluate(() => {
    const g = window.__belfast.scene('Game');
    for (const x of [1500, 3100, 4010]) { g.player.setX(x); g.waveCheck(x); }
    const sections = g.sectionAt(4000) + ' / ' + g.sectionAt(3200) + ' / ' + g.sectionAt(200);
    const bossCreated = !!g.boss;
    g.bossHp = 1;
    g.hitBoss({ active: true, destroy() {} }, {});
    const phaseTwo = g.bossPhase === 1 && g.bossHp === 30;
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
  const gameOver = await page.evaluate(() => window.__belfast.scene('Game').health === 0);
  if (!gameOver) throw new Error('Game over health flow did not trigger');
  await page.screenshot({ path: 'artifacts/game-over-screen.png' });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  const afterDeathRestart = await page.evaluate(() => { const g=window.__belfast.scene('Game');return {x:g.player.x,health:g.health,complete:g.complete}; });
  if (afterDeathRestart.x >= 100 || afterDeathRestart.health !== 5 || afterDeathRestart.complete) throw new Error(`Death restart failed: ${JSON.stringify(afterDeathRestart)}`);
  if (errors.length) throw new Error(`Browser exceptions: ${errors.join(' | ')}`);
  console.log(JSON.stringify({ initialX, movedX, measuredFps, jumpState, combat, flow, gameOverAndRestart: gameOver, afterVictoryRestart, afterDeathRestart, browserErrors: errors, screenshots: ['artifacts/title-screen.png', 'artifacts/gameplay-screen.png', 'artifacts/city-hall-boss.png', 'artifacts/game-over-screen.png', 'artifacts/victory-screen.png'] }, null, 2));
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
