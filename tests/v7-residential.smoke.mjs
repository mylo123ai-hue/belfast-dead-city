import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const port = 4182;
const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(port)], { stdio: 'ignore' });
let browser;
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`http://127.0.0.1:${port}`)).ok) { ready = true; break; } } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!ready) throw new Error('Vite preview did not become ready');
  browser = await chromium.launch({ headless: true,
    ...(existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] } : {}) });
  const page = await browser.newPage({ viewport: { width: 1200, height: 760 } });
  const errors = [];
  const resourceWarnings = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) resourceWarnings.push({ status: response.status(), url: response.url() }); });
  page.on('console', message => { if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) errors.push(`console: ${message.text()}`); });
  await page.goto(`http://127.0.0.1:${port}/?benchmark=v7&test=1`);
  await page.waitForFunction(() => window.__belfast?.scene('ResidentialScene')?.sys.isActive()
    && window.__belfast.scene('ResidentialScene').player);
  const start = await page.evaluate(() => {
    const s = window.__belfast.scene('ResidentialScene');
    return { world: s.physics.world.bounds.width, camera: s.cameras.main.getBounds().width,
      x: s.player.x, bodyHeight: s.player.body.height, groundTop: s.physics.world.staticBodies.entries[0]?.top,
      panorama: s.textures.get('v7-residential-panorama').getSourceImage().width,
      skyline: s.textures.get('v7-distant-skyline').getSourceImage().width,
      staticBodies: s.physics.world.staticBodies.entries.length,
      playerCount: s.children.list.filter(item => item.type === 'Sprite').length };
  });
  if (start.world !== 14500 || start.camera !== 14500 || start.panorama !== 14500 || start.skyline !== 14500
      || start.x !== 78 || start.groundTop !== 225 || start.staticBodies !== 1
      || start.skyline !== Math.ceil(start.world * 0.32 + 480)) {
    throw new Error(`Residential scene contract failed: ${JSON.stringify(start)}`);
  }
  await mkdir('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/v7-residential-start.png' });
  const fpsSamples = [];
  const sampleFps = setInterval(async () => {
    try { fpsSamples.push(Number((await page.evaluate(() => window.__belfast.fps())).toFixed(1))); } catch {}
  }, 500);
  await page.keyboard.down('D');
  await page.waitForFunction(() => window.__belfast.scene('ResidentialScene').player.x > 2600, undefined, { timeout: 24000 });
  await page.screenshot({ path: 'artifacts/v7-residential-seam-scale-mid.png' });
  await page.waitForFunction(() => window.__belfast.scene('ResidentialScene').player.x > 7200, undefined, { timeout: 36000 });
  await page.screenshot({ path: 'artifacts/v7-residential-seam-scale-late.png' });
  await page.waitForFunction(() => window.__belfast.scene('ResidentialScene').player.x > 11500, undefined, { timeout: 32000 });
  await page.screenshot({ path: 'artifacts/v7-residential-seam-scale-end.png' });
  await page.waitForFunction(() => window.__belfast.scene('ResidentialScene').player.x > 14450, undefined, { timeout: 62000 });
  await page.keyboard.up('D');
  clearInterval(sampleFps);
  const end = await page.evaluate(() => {
    const s = window.__belfast.scene('ResidentialScene');
    return { x: s.player.x, scrollX: s.cameras.main.scrollX, worldRight: s.cameras.main.getBounds().right,
      bottom: s.player.body.bottom, grounded: s.player.body.blocked.down,
      enemies: s.children.list.filter(item => item.name?.includes('enemy')).length,
      elapsed: Number(s.elapsed.toFixed(1)), fps: Number(window.__belfast.fps().toFixed(1)) };
  });
  await page.screenshot({ path: 'artifacts/v7-residential-end.png' });
  const unexpectedResources = resourceWarnings.filter(item => !item.url.endsWith('/favicon.ico'));
  if (end.x < 14450 || end.scrollX !== 14020 || end.worldRight !== 14500 || end.bottom !== 225 || !end.grounded || errors.length || unexpectedResources.length)
    throw new Error(`Residential full route failed: ${JSON.stringify({ end, errors, unexpectedResources })}`);

  const normal = await browser.newPage({ viewport: { width: 1200, height: 760 } });
  await normal.goto(`http://127.0.0.1:${port}/?test=1`);
  await normal.waitForFunction(() => window.__belfast?.scene('Title')?.sys.isActive());
  const normalMode = await normal.evaluate(() => ({ title: window.__belfast.scene('Title').sys.isActive(), v7: window.__belfast.scene('ResidentialScene').sys.isActive() }));
  await normal.close();
  if (!normalMode.title || normalMode.v7) throw new Error(`Normal mode changed: ${JSON.stringify(normalMode)}`);
  if (errors.length) throw new Error(`Browser exceptions: ${errors.join(' | ')}`);
  const sortedFps = [...fpsSamples].sort((a, b) => a - b);
  const performance = { fpsSamples, medianFps: sortedFps[Math.floor(sortedFps.length / 2)] ?? null,
    minFps: sortedFps[0] ?? null, maxFps: sortedFps.at(-1) ?? null, method: 'window.__belfast.fps() sampled every 500 ms while holding D across the full route' };
  console.log(JSON.stringify({ browser: browser.version(), viewport: '1200 x 760', start, end, performance, normalMode,
    browserErrors: errors, resourceWarnings, screenshots: ['artifacts/v7-residential-start.png', 'artifacts/v7-residential-seam-scale-mid.png',
      'artifacts/v7-residential-seam-scale-late.png', 'artifacts/v7-residential-seam-scale-end.png', 'artifacts/v7-residential-end.png'] }, null, 2));
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
