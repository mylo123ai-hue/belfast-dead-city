import { spawn } from 'node:child_process';
import { mkdir, rename } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4175'], { stdio: 'ignore' });
await mkdir('artifacts/benchmark-recording', { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1200, height: 760 }, recordVideo: { dir: 'artifacts/benchmark-recording', size: { width: 1200, height: 760 } } });
const page = await context.newPage();
const video = page.video();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));

async function snapshot() {
  return page.evaluate(() => {
    const scene = window.__belfast.scene('Benchmark');
    return { x: Math.round(scene.player.x), health: scene.health, grenades: scene.grenades, enemies: scene.enemies.countActive(), outcome: scene.outcome, score: scene.score };
  });
}

try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch('http://127.0.0.1:4175')).ok) { ready = true; break; } } catch {}
    await delay(250);
  }
  if (!ready) throw new Error('Vite preview did not become ready');
  await page.goto('http://127.0.0.1:4175/?benchmark=1&test=1');
  await page.waitForFunction(() => window.__belfast?.scene('Benchmark')?.sys.isActive());
  await delay(700);
  await page.screenshot({ path: 'artifacts/benchmark-street.png' });
  console.log(`Street opening: ${JSON.stringify(await snapshot())}`);

  await page.keyboard.down('D'); await page.waitForTimeout(350); await page.keyboard.up('D');
  await page.keyboard.down('J'); await page.waitForTimeout(55); await page.keyboard.up('J');
  await page.waitForTimeout(180);
  console.log(`First exchange: ${JSON.stringify(await snapshot())}`);
  await page.keyboard.down('K'); await page.waitForTimeout(55); await page.keyboard.up('K');
  await page.waitForTimeout(790);
  await page.screenshot({ path: 'artifacts/benchmark-explosion.png' });
  await page.waitForTimeout(950);
  let state = await snapshot();
  if (state.outcome === 'playing' && state.grenades > 0) {
    await page.keyboard.down('K'); await page.waitForTimeout(55); await page.keyboard.up('K');
    await page.waitForTimeout(780);
    state = await snapshot();
  }
  if (state.outcome === 'playing') {
    for (let i = 0; i < 18 && state.outcome === 'playing'; i++) {
      await page.keyboard.press('J'); await delay(150); state = await snapshot();
    }
  }
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `artifacts/benchmark-${state.outcome}.png` });
  console.log(`Benchmark result: ${JSON.stringify(state)}`);
  if (errors.length) throw new Error(`Browser exceptions: ${errors.join(' | ')}`);
} finally {
  await context.close();
  const path = await video.path();
  await rename(path, 'artifacts/benchmark-gameplay.webm');
  await browser.close();
  server.kill('SIGTERM');
}
