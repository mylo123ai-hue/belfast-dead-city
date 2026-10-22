import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4181'], { stdio: 'ignore' });
const recordingDir = await mkdtemp(join(tmpdir(), 'belfast-v5-recordings-'));
let browser;
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch('http://127.0.0.1:4181')).ok) { ready = true; break; } } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!ready) throw new Error('Vite preview did not become ready');
  browser = await chromium.launch({ headless: true,
    ...(existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] } : {}) });
  await mkdir('artifacts', { recursive: true });

  const cameraContext = await browser.newContext({ viewport: { width: 1200, height: 760 },
    recordVideo: { dir: recordingDir, size: { width: 1200, height: 760 } } });
  const cameraPage = await cameraContext.newPage();
  const cameraErrors = [];
  cameraPage.on('pageerror', (error) => cameraErrors.push(error.message));
  await cameraPage.goto('http://127.0.0.1:4181/?benchmark=v5&test=1');
  await cameraPage.waitForFunction(() => window.__belfast?.scene('Game')?.sys.isActive());
  await cameraPage.keyboard.down('D');
  await cameraPage.waitForFunction(() => window.__belfast.scene('Game').cameras.main.scrollX >= 970, undefined, { timeout: 14000 });
  await cameraPage.waitForTimeout(1200);
  await cameraPage.keyboard.up('D');
  const cameraRun = await cameraPage.evaluate(() => ({
    x: window.__belfast.scene('Game').player.x,
    scrollX: window.__belfast.scene('Game').cameras.main.scrollX,
    section: window.__belfast.scene('Game').section,
  }));
  await cameraPage.close();
  await cameraPage.video().saveAs('artifacts/v5-camera-through-benchmark.webm');
  await cameraContext.close();
  if (cameraErrors.length || cameraRun.scrollX < 900 || cameraRun.section !== 'RESIDENTIAL BELFAST')
    throw new Error(`Camera recording failed: ${JSON.stringify({ cameraRun, cameraErrors })}`);

  const traversalContext = await browser.newContext({ viewport: { width: 1200, height: 760 },
    recordVideo: { dir: recordingDir, size: { width: 1200, height: 760 } } });
  const page = await traversalContext.newPage();
  const traversalErrors = [];
  page.on('pageerror', (error) => traversalErrors.push(error.message));
  await page.goto('http://127.0.0.1:4181/?benchmark=v5&test=1');
  await page.waitForFunction(() => window.__belfast?.scene('Game')?.sys.isActive());
  await page.keyboard.down('D'); await page.waitForTimeout(1200); await page.keyboard.up('D');
  await page.keyboard.down('D'); await page.keyboard.down('Space');
  await page.waitForTimeout(160); await page.keyboard.up('Space'); await page.waitForTimeout(500); await page.keyboard.up('D');
  await page.waitForFunction(() => {
    const g = window.__belfast.scene('Game'), p = g.platforms.getChildren()[0];
    return g.player.body.blocked.down && Math.abs(g.player.body.bottom - p.body.top) <= 1;
  }, undefined, { timeout: 3500 });
  await page.keyboard.down('D'); await page.waitForTimeout(140); await page.keyboard.up('D');
  const roofRun = await page.evaluate(() => {
    const g = window.__belfast.scene('Game'), p = g.platforms.getChildren()[0];
    return { x: g.player.x, bottom: g.player.body.bottom, roof: p.body.top, grounded: g.player.body.blocked.down };
  });
  await page.keyboard.down('A'); await page.keyboard.down('Space');
  await page.waitForTimeout(160); await page.keyboard.up('Space'); await page.waitForTimeout(720); await page.keyboard.up('A');
  await page.waitForFunction(() => {
    const g = window.__belfast.scene('Game');
    return g.player.body.blocked.down && Math.abs(g.player.body.bottom - 225) <= 1;
  }, undefined, { timeout: 3500 });
  const roadRun = await page.evaluate(() => ({ x: window.__belfast.scene('Game').player.x,
    bottom: window.__belfast.scene('Game').player.body.bottom }));
  await page.close();
  await page.video().saveAs('artifacts/v5-vehicle-traversal.webm');
  await traversalContext.close();
  if (!roofRun.grounded || Math.abs(roofRun.bottom - roofRun.roof) > 1 || roadRun.bottom !== 225 || traversalErrors.length)
    throw new Error(`Traversal recording failed: ${JSON.stringify({ roofRun, roadRun, traversalErrors })}`);

  console.log(JSON.stringify({ browser: browser.version(), mode: 'headless Chromium / Linux cloud runner',
    viewport: '1200 x 760', cameraRun, roofRun, roadRun, browserErrors: [...cameraErrors, ...traversalErrors],
    videos: ['artifacts/v5-camera-through-benchmark.webm', 'artifacts/v5-vehicle-traversal.webm'] }, null, 2));
} finally {
  await browser?.close();
  server.kill('SIGTERM');
  await rm(recordingDir, { recursive: true, force: true });
}
