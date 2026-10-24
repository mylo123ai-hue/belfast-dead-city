import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const port = 4188;
const outputDir = 'artifacts/v7-2';
const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(port)], { stdio: 'ignore' });
const recordingDir = await mkdtemp(join(tmpdir(), 'belfast-v7-2-recordings-'));
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
  await mkdir(outputDir, { recursive: true });
  const context = await browser.newContext({ viewport: { width: 1200, height: 760 },
    recordVideo: { dir: recordingDir, size: { width: 1200, height: 760 } } });
  const page = await context.newPage();
  const browserErrors = []; const resourceWarnings = [];
  page.on('pageerror', error => browserErrors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) resourceWarnings.push({ status: response.status(), url: response.url() }); });
  await page.goto(`http://127.0.0.1:${port}/?benchmark=v7.2&test=1`);
  await page.waitForFunction(() => window.__belfast?.scene('ResidentialScene')?.environmentArtMode === true);
  const video = page.video();
  await page.keyboard.down('D');
  await page.waitForFunction(() => window.__belfast.scene('ResidentialScene').player.x > 710, undefined, { timeout: 8000 });
  await page.keyboard.up('D');
  const route = await page.evaluate(() => {
    const s = window.__belfast.scene('ResidentialScene');
    return { playerX: Number(s.player.x.toFixed(1)), cameraX: Number(s.cameras.main.scrollX.toFixed(1)),
      worldWidth: s.physics.world.bounds.width, groundTop: s.physics.world.staticBodies.entries[0]?.top,
      staticBodies: s.physics.world.staticBodies.entries.length, fps: Number(window.__belfast.fps().toFixed(1)) };
  });
  await page.close();
  await video.saveAs(`${outputDir}/v7-2-three-house-traversal.webm`);
  await context.close();
  const report = { browser: browser.version(), viewport: '1200 x 760', route, browserErrors, resourceWarnings,
    video: `${outputDir}/v7-2-three-house-traversal.webm`,
    recording: 'single uninterrupted recording from X=78 through all three houses and the visible X≈600 art boundary' };
  if (route.playerX < 710 || route.cameraX <= 0 || route.worldWidth !== 14500
      || route.groundTop !== 225 || route.staticBodies !== 1 || browserErrors.length || resourceWarnings.length)
    throw new Error(`V7.2 recording check failed: ${JSON.stringify(report)}`);
  await writeFile(`${outputDir}/v7-2-record.log`, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
} finally { await browser?.close(); server.kill('SIGTERM'); await rm(recordingDir, { recursive: true, force: true }); }
