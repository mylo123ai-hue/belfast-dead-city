import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const port = 4185;
const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(port)], { stdio: 'ignore' });
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

  const errors = [];
  const resources = [];
  const baseline = await browser.newPage({ viewport: { width: 1200, height: 760 } });
  baseline.on('pageerror', error => errors.push(`baseline: ${error.message}`));
  baseline.on('response', response => { if (response.status() >= 400) resources.push({ status: response.status(), url: response.url() }); });
  await baseline.goto(`http://127.0.0.1:${port}/?benchmark=v7&test=1`);
  await baseline.waitForFunction(() => window.__belfast?.scene('ResidentialScene')?.sys.isActive());
  await baseline.waitForTimeout(350);
  const before = await saveNativeCanvas(baseline, 'artifacts/v7-1-baseline-native.png');

  const stage = await browser.newPage({ viewport: { width: 1200, height: 760 } });
  stage.on('pageerror', error => errors.push(`v7.1: ${error.message}`));
  stage.on('response', response => { if (response.status() >= 400) resources.push({ status: response.status(), url: response.url() }); });
  await stage.goto(`http://127.0.0.1:${port}/?benchmark=v7.1&test=1`);
  await stage.waitForFunction(() => window.__belfast?.scene('ResidentialScene')?.stageArtMode === true);
  await stage.waitForTimeout(350);
  const after = await saveNativeCanvas(stage, 'artifacts/v7-1-stage-native.png');
  const stageContract = await stage.evaluate(() => {
    const s = window.__belfast.scene('ResidentialScene');
    return { mode: s.stageArtMode, world: s.physics.world.bounds.width, camera: s.cameras.main.getBounds().width,
      playerX: s.player.x, cameraX: s.cameras.main.scrollX, playerHeight: s.player.height,
      bodyBottom: s.player.body.bottom, groundTop: s.physics.world.staticBodies.entries[0]?.top,
      staticBodies: s.physics.world.staticBodies.entries.length,
      facadeTexture: s.textures.get('v7.1-three-house-facades').getSourceImage().width,
      facadeSection: 600 };
  });
  if (stageContract.mode !== true || stageContract.world !== 14500 || stageContract.camera !== 14500
      || stageContract.playerX !== 78 || stageContract.cameraX !== 0 || stageContract.bodyBottom !== 225
      || stageContract.groundTop !== 225 || stageContract.staticBodies !== 1 || stageContract.facadeTexture !== 1672
      || before.width !== 480 || before.height !== 270 || after.width !== 480 || after.height !== 270
      || before.playerX !== after.playerX || before.cameraX !== after.cameraX) {
    throw new Error(`Native baseline comparison or stage contract failed: ${JSON.stringify({ before, after, stageContract })}`);
  }

  await stage.evaluate(() => {
    const camera = window.__belfast.scene('ResidentialScene').cameras.main;
    camera.stopFollow();
    camera.setZoom(1.7);
    camera.setScroll(110, 40);
  });
  await stage.waitForTimeout(120);
  const detail = await saveNativeCanvas(stage, 'artifacts/v7-1-facade-detail-native.png');
  if (detail.width !== 480 || detail.height !== 270) throw new Error(`Facade detail capture is not native: ${JSON.stringify(detail)}`);

  const fpsSamples = [];
  const sample = setInterval(async () => {
    try { fpsSamples.push(Number((await stage.evaluate(() => window.__belfast.fps())).toFixed(1))); } catch {}
  }, 500);
  await stage.evaluate(() => {
    const s = window.__belfast.scene('ResidentialScene');
    s.cameras.main.setZoom(1).setScroll(0, 0).startFollow(s.player, true, 0.12, 0.08).setDeadzone(120, 36);
  });
  await stage.keyboard.down('D');
  await stage.waitForFunction(() => window.__belfast.scene('ResidentialScene').player.x > 690, undefined, { timeout: 7000 });
  await stage.keyboard.up('D');
  clearInterval(sample);
  const traversal = await stage.evaluate(() => {
    const s = window.__belfast.scene('ResidentialScene');
    return { x: Number(s.player.x.toFixed(1)), cameraX: s.cameras.main.scrollX,
      world: s.physics.world.bounds.width, groundTop: s.physics.world.staticBodies.entries[0]?.top,
      staticBodies: s.physics.world.staticBodies.entries.length, fps: Number(window.__belfast.fps().toFixed(1)) };
  });
  const scrollEnd = await saveNativeCanvas(stage, 'artifacts/v7-1-stage-scroll-end-native.png');

  const normal = await browser.newPage({ viewport: { width: 1200, height: 760 } });
  await normal.goto(`http://127.0.0.1:${port}/?test=1`);
  await normal.waitForFunction(() => window.__belfast?.scene('Title')?.sys.isActive());
  const normalMode = await normal.evaluate(() => ({ title: window.__belfast.scene('Title').sys.isActive(),
    v7: window.__belfast.scene('ResidentialScene').sys.isActive() }));
  await normal.close();

  const report = { browser: browser.version(), mode: 'headless Chromium / Linux', nativeResolution: '480 x 270',
    baseline: { path: 'artifacts/v7-1-baseline-native.png', ...before },
    stage: { path: 'artifacts/v7-1-stage-native.png', ...after, ...stageContract },
    facadeDetail: { path: 'artifacts/v7-1-facade-detail-native.png', ...detail, cameraZoom: 1.7 },
    scrollEnd: { path: 'artifacts/v7-1-stage-scroll-end-native.png', ...scrollEnd, cameraX: traversal.cameraX },
    traversal, performance: { method: 'window.__belfast.fps() sampled every 500 ms during the short section traversal',
      fpsSamples, medianFps: median(fpsSamples), minFps: Math.min(...fpsSamples), maxFps: Math.max(...fpsSamples) },
    normalMode, browserErrors: errors, resourceWarnings: resources };
  if (traversal.x < 690 || traversal.cameraX <= 0 || traversal.groundTop !== 225 || traversal.staticBodies !== 1
      || !normalMode.title || normalMode.v7 || errors.length || resources.length) {
    throw new Error(`Stage traversal/regression check failed: ${JSON.stringify(report)}`);
  }
  await writeFile('artifacts/v7-1-smoke.log', `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  await baseline.close();
  await stage.close();
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}

async function saveNativeCanvas(page, path) {
  const result = await page.evaluate(() => {
    const canvas = document.querySelector('#game canvas');
    const s = window.__belfast.scene('ResidentialScene');
    return { width: canvas.width, height: canvas.height, data: canvas.toDataURL('image/png'),
      playerX: s.player.x, cameraX: s.cameras.main.scrollX };
  });
  const base64 = result.data.slice(result.data.indexOf(',') + 1);
  await writeFile(path, Buffer.from(base64, 'base64'));
  delete result.data;
  return result;
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}
