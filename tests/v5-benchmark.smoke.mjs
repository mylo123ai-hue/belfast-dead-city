import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4180'], { stdio: 'ignore' });
let browser;
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch('http://127.0.0.1:4180')).ok) { ready = true; break; } } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!ready) throw new Error('Vite preview did not become ready');
  browser = await chromium.launch({ headless: true,
    ...(existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] } : {}) });
  const page = await browser.newPage({ viewport: { width: 1200, height: 760 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:4180/?benchmark=v5&test=1');
  await page.waitForFunction(() => window.__belfast?.scene('Game')?.sys.isActive() && window.__belfast.scene('Game').player);
  const start = await page.evaluate(() => {
    const g = window.__belfast.scene('Game');
    const taxi = g.platforms.getChildren().find((item) => item.getData('platform') === 'platform-taxi');
    return { x: g.player.x, world: g.physics.world.bounds.width, camera: g.cameras.main.getBounds().width,
      groundTop: g.ground.top, taxi: { x: taxi.x, top: taxi.body.top, left: taxi.body.left, right: taxi.body.right },
      panorama: g.textures.get('game-panorama').getSourceImage().width, enemies: g.hostiles.countActive() };
  });
  if (start.x !== 80 || start.world !== 1450 || start.camera !== 1450 || start.groundTop !== 225 ||
      start.panorama !== 4980 || start.enemies !== 0 || start.taxi.top !== 185 || start.taxi.right - start.taxi.left !== 62) {
    throw new Error(`Residential benchmark setup mismatch: ${JSON.stringify(start)}`);
  }
  await mkdir('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/v5-after-residential-road.png' });

  // Ordinary controls show the parked taxi beside the player at the shared art scale.
  await page.keyboard.down('D'); await page.waitForTimeout(1050); await page.keyboard.up('D');
  const nearTaxi = await page.evaluate(() => {
    const g = window.__belfast.scene('Game');
    return { x: g.player.x, scrollX: g.cameras.main.scrollX, section: g.section };
  });
  if (nearTaxi.x < 200 || nearTaxi.x > 280 || nearTaxi.section !== 'RESIDENTIAL BELFAST')
    throw new Error(`Residential start scale check did not reach the taxi view: ${JSON.stringify(nearTaxi)}`);
  await page.screenshot({ path: 'artifacts/v5-after-taxi-scale.png' });

  const fps = [];
  const sample = setInterval(async () => {
    try { fps.push(Number((await page.evaluate(() => window.__belfast.fps())).toFixed(1))); } catch {}
  }, 500);
  await page.keyboard.down('D'); await page.keyboard.down('J');
  try {
    await page.waitForFunction(() => window.__belfast.scene('Game').player.x > 1370, undefined, { timeout: 14000 });
  } finally {
    await page.keyboard.up('D'); await page.keyboard.up('J'); clearInterval(sample);
  }
  await page.waitForTimeout(300);
  const end = await page.evaluate(() => {
    const g = window.__belfast.scene('Game');
    return { x: g.player.x, scrollX: g.cameras.main.scrollX, section: g.section,
      boundsRight: g.cameras.main.getBounds().right, groundTop: g.ground.top, health: g.health };
  });
  if (end.x < 1370 || end.section !== 'RESIDENTIAL BELFAST' || end.boundsRight !== 1450 || end.groundTop !== 225)
    throw new Error(`Continuous residential camera run failed: ${JSON.stringify(end)}`);
  await page.screenshot({ path: 'artifacts/v5-after-background-road-connection.png' });
  await page.keyboard.press('F2'); await page.waitForTimeout(90);
  await page.screenshot({ path: 'artifacts/v5-after-junction-collision-debug.png' });
  if (errors.length) throw new Error(`Browser exceptions: ${errors.join(' | ')}`);
  const sorted = [...fps].sort((a, b) => a - b);
  const performance = { browser: browser.version(), mode: 'headless Chromium / Linux cloud runner', viewport: '1200 x 760',
    fpsSamples: fps, medianFps: sorted[Math.floor(sorted.length / 2)] ?? null, minFps: sorted[0] ?? null };
  console.log(JSON.stringify({ start, nearTaxi, end, performance, browserErrors: errors,
    screenshots: ['artifacts/v5-after-residential-road.png', 'artifacts/v5-after-taxi-scale.png',
      'artifacts/v5-after-background-road-connection.png', 'artifacts/v5-after-junction-collision-debug.png'] }, null, 2));
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
