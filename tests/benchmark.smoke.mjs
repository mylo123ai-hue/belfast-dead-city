import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4174'], { stdio: 'ignore' });
let browser;
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch('http://127.0.0.1:4174')).ok) { ready = true; break; } } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!ready) throw new Error('Vite preview did not become ready');
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 760 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:4174/?benchmark=1&test=1');
  await page.waitForFunction(() => window.__belfast?.scene('Benchmark')?.sys.isActive());
  await page.waitForTimeout(650);
  const initial = await page.evaluate(() => {
    const scene = window.__belfast.scene('Benchmark');
    return { x: scene.player.x, texture: scene.player.texture.key, activeEnemies: scene.enemies.countActive(), types: scene.enemies.getChildren().map((e) => e.getData('kind')), fps: window.__belfast.fps() };
  });
  if (initial.activeEnemies !== 2 || initial.types.join(',') !== 'shambler,runner') throw new Error(`Benchmark roster failed: ${JSON.stringify(initial)}`);
  await mkdir('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/benchmark-street.png' });

  await page.keyboard.down('D'); await page.waitForTimeout(350); await page.keyboard.up('D');
  const moved = await page.evaluate(() => window.__belfast.scene('Benchmark').player.x);
  if (moved < initial.x + 18) throw new Error(`Benchmark movement failed: ${initial.x} -> ${moved}`);
  await page.keyboard.down('J'); await page.waitForTimeout(55); await page.keyboard.up('J');
  await page.waitForTimeout(80);
  const bulletCount = await page.evaluate(() => window.__belfast.scene('Benchmark').bullets.countActive());
  if (bulletCount < 1) throw new Error(`Benchmark shooting failed: ${bulletCount} bullets`);
  await page.screenshot({ path: 'artifacts/benchmark-combat.png' });

  await page.keyboard.down('P'); await page.waitForTimeout(60); await page.keyboard.up('P');
  const paused = await page.evaluate(() => window.__belfast.scene('Benchmark').paused);
  await page.keyboard.down('Escape'); await page.waitForTimeout(60); await page.keyboard.up('Escape');
  const resumed = await page.evaluate(() => !window.__belfast.scene('Benchmark').paused);
  if (!paused || !resumed) throw new Error(`Pause/resume failed: ${paused}/${resumed}`);
  await page.keyboard.down('K'); await page.waitForTimeout(55); await page.keyboard.up('K');
  await page.waitForTimeout(900);
  const combat = await page.evaluate(() => {
    const scene = window.__belfast.scene('Benchmark');
    return { grenades: scene.grenades, activeEnemies: scene.enemies.countActive(), hp: scene.health, outcome: scene.outcome, fps: window.__belfast.fps() };
  });
  if (combat.grenades !== 1 || errors.length) throw new Error(`Grenade or runtime regression: ${JSON.stringify({ combat, errors })}`);
  if (errors.length) throw new Error(`Browser exceptions: ${errors.join(' | ')}`);
  console.log(JSON.stringify({ baseline: { browser: browser.version(), mode: 'headless Chromium / Linux cloud runner', viewport: '1200 x 760', sampledFps: initial.fps }, initial, moved, bulletCount, grenadeAndCombat: combat, paused, resumed, browserErrors: errors, screenshots: ['artifacts/benchmark-street.png', 'artifacts/benchmark-combat.png'] }, null, 2));
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
