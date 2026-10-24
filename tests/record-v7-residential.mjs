import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const port = 4183;
const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(port)], { stdio: 'ignore' });
const recordingDir = await mkdtemp(join(tmpdir(), 'belfast-v7-recordings-'));
let browser;
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`http://127.0.0.1:${port}`)).ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  if (!ready) throw new Error('Vite preview did not become ready');
  browser = await chromium.launch({ headless: true,
    ...(existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] } : {}) });
  await mkdir('artifacts', { recursive: true });
  const context = await browser.newContext({ viewport: { width: 1200, height: 760 },
    recordVideo: { dir: recordingDir, size: { width: 1200, height: 760 } } });
  const page = await context.newPage();
  const browserErrors = [];
  const resourceWarnings = [];
  page.on('pageerror', error => browserErrors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) resourceWarnings.push({ status: response.status(), url: response.url() }); });
  page.on('console', message => { if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) browserErrors.push(`console: ${message.text()}`); });
  await page.goto(`http://127.0.0.1:${port}/?benchmark=v7&test=1`);
  await page.waitForFunction(() => window.__belfast?.scene('ResidentialScene')?.sys.isActive());
  const video = page.video();
  await page.screenshot({ path: 'artifacts/v7-residential-start.png' });
  await page.keyboard.down('D');
  await page.waitForFunction(() => window.__belfast.scene('ResidentialScene').player.x > 2600,
    undefined, { timeout: 25000 });
  await page.screenshot({ path: 'artifacts/v7-residential-seam-scale-mid.png' });
  await page.waitForFunction(() => window.__belfast.scene('ResidentialScene').player.x > 7200,
    undefined, { timeout: 60000 });
  await page.screenshot({ path: 'artifacts/v7-residential-seam-scale-late.png' });
  await page.waitForFunction(() => window.__belfast.scene('ResidentialScene').player.x > 11500,
    undefined, { timeout: 40000 });
  await page.screenshot({ path: 'artifacts/v7-residential-seam-scale-end.png' });
  await page.waitForFunction(() => window.__belfast.scene('ResidentialScene').player.x > 14450,
    undefined, { timeout: 115000 });
  await page.screenshot({ path: 'artifacts/v7-residential-end.png' });
  await page.keyboard.up('D');
  const route = await page.evaluate(() => {
    const s = window.__belfast.scene('ResidentialScene');
    return { x: Number(s.player.x.toFixed(1)), scrollX: s.cameras.main.scrollX, elapsed: Number(s.elapsed.toFixed(1)),
      streetLevel: s.player.body.bottom, fps: Number(window.__belfast.fps().toFixed(1)),
      worldWidth: s.physics.world.bounds.width, obstacles: s.physics.world.staticBodies.entries.length - 1 };
  });
  await page.close();
  await video.saveAs('artifacts/v7-residential-full-traversal.webm');
  await context.close();
  const unexpectedResources = resourceWarnings.filter(item => !item.url.endsWith('/favicon.ico'));
  if (route.x < 14450 || route.scrollX !== 14020 || route.elapsed < 95 || route.streetLevel !== 225
      || route.worldWidth !== 14500 || route.obstacles !== 0 || browserErrors.length || unexpectedResources.length) {
    throw new Error(`Full scene recording failed: ${JSON.stringify({ route, browserErrors, unexpectedResources })}`);
  }
  console.log(JSON.stringify({ browser: browser.version(), viewport: '1200 x 760', route, browserErrors, resourceWarnings,
    screenshots: ['artifacts/v7-residential-start.png', 'artifacts/v7-residential-seam-scale-mid.png',
      'artifacts/v7-residential-seam-scale-late.png', 'artifacts/v7-residential-seam-scale-end.png', 'artifacts/v7-residential-end.png'],
    video: 'artifacts/v7-residential-full-traversal.webm' }, null, 2));
} finally {
  await browser?.close();
  server.kill('SIGTERM');
  await rm(recordingDir, { recursive: true, force: true });
}
