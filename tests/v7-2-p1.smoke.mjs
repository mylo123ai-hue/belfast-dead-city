import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const port = 4187;
const outputDir = 'artifacts/v7-2';
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
  await mkdir(outputDir, { recursive: true });
  const errors = [];
  const resources = [];
  const baseline = await browser.newPage({ viewport: { width: 1200, height: 760 } });
  baseline.on('pageerror', error => errors.push(`V7.1 baseline: ${error.message}`));
  baseline.on('response', response => { if (response.status() >= 400) resources.push({ status: response.status(), url: response.url() }); });
  await baseline.goto(`http://127.0.0.1:${port}/?benchmark=v7.1&test=1`);
  await baseline.waitForFunction(() => window.__belfast?.scene('ResidentialScene')?.sys.isActive());
  await baseline.waitForTimeout(300);
  const before = await saveNativeCanvas(baseline, `${outputDir}/v7-2-before-native.png`);

  const stage = await browser.newPage({ viewport: { width: 1200, height: 760 } });
  stage.on('pageerror', error => errors.push(`V7.2: ${error.message}`));
  stage.on('response', response => { if (response.status() >= 400) resources.push({ status: response.status(), url: response.url() }); });
  await stage.goto(`http://127.0.0.1:${port}/?benchmark=v7.2&test=1`);
  await stage.waitForFunction(() => window.__belfast?.scene('ResidentialScene')?.environmentArtMode === true);
  await stage.waitForTimeout(400);
  const after = await saveNativeCanvas(stage, `${outputDir}/v7-2-after-native.png`);
  const contract = await stage.evaluate(() => {
    const s = window.__belfast.scene('ResidentialScene');
    const skyline = s.children.list.find(item => item.texture?.key === 'v7-distant-skyline');
    const groundImage = s.children.list.find(item => item.texture?.key === 'v7.2-residential-ground');
    const art = s.textures.get('v7.2-residential-ground').getSourceImage();
    const px = document.createElement('canvas'); px.width = art.width; px.height = art.height;
    const ctx = px.getContext('2d'); ctx.drawImage(art, 0, 0);
    const sample = x => [...ctx.getImageData(x, 18, 1, 1).data].slice(0, 3);
    return { environmentArtMode: s.environmentArtMode, worldWidth: s.physics.world.bounds.width,
      cameraWidth: s.cameras.main.getBounds().width, playerX: s.player.x, cameraX: s.cameras.main.scrollX,
      playerTexture: s.player.texture.key, playerBodyHeight: s.player.body.height,
      bodyBottom: s.player.body.bottom, groundTop: s.physics.world.staticBodies.entries[0]?.top,
      staticBodies: s.physics.world.staticBodies.entries.length, groundArt: { width: art.width, height: art.height,
        redKerb: sample(69), whiteKerb: sample(83), blueKerb: sample(97) },
      parallax: { skylineX: skyline?.scrollFactorX, skylineY: skyline?.scrollFactorY,
        groundX: groundImage?.scrollFactorX, groundY: groundImage?.scrollFactorY },
      facadeLoaded: s.textures.exists('v7.1-three-house-facades'), skyLoaded: s.textures.exists('v7.2-east-belfast-dusk') };
  });
  if (!contract.environmentArtMode || contract.worldWidth !== 14500 || contract.cameraWidth !== 14500
      || contract.playerX !== 78 || contract.cameraX !== 0 || contract.bodyBottom !== 225
      || contract.groundTop !== 225 || contract.staticBodies !== 1 || !contract.facadeLoaded || !contract.skyLoaded
      || contract.groundArt.width !== 600 || contract.groundArt.height !== 65
      || contract.parallax.skylineX !== 0.32 || contract.parallax.skylineY !== 0.2
      || contract.parallax.groundX !== 1 || contract.parallax.groundY !== 1
      || before.width !== 480 || after.width !== 480 || before.height !== 270 || after.height !== 270
      || before.playerX !== after.playerX || before.cameraX !== after.cameraX) {
    throw new Error(`V7.2 native comparison / environment contract failed: ${JSON.stringify({ before, after, contract })}`);
  }
  const [red, white, blue] = [contract.groundArt.redKerb, contract.groundArt.whiteKerb, contract.groundArt.blueKerb];
  if (!(red[0] > red[2] && white[0] > blue[0] && blue[2] > blue[0]))
    throw new Error(`Kerb paint color verification failed: ${JSON.stringify(contract.groundArt)}`);

  await stage.evaluate(() => {
    const s = window.__belfast.scene('ResidentialScene');
    s.cameras.main.stopFollow().setZoom(1.15).setScroll(0, 0);
  });
  await stage.waitForTimeout(100);
  const skyline = await saveNativeCanvas(stage, `${outputDir}/v7-2-sky-cranes-native.png`);
  await stage.evaluate(() => {
    const s = window.__belfast.scene('ResidentialScene');
    s.cameras.main.setZoom(1).setScroll(0, 0).startFollow(s.player, true, 0.12, 0.08).setDeadzone(120, 36);
  });

  await stage.evaluate(() => {
    const camera = window.__belfast.scene('ResidentialScene').cameras.main;
    camera.stopFollow(); camera.setZoom(1.8); camera.setScroll(70, 138);
  });
  await stage.waitForTimeout(120);
  const detail = await saveNativeCanvas(stage, `${outputDir}/v7-2-pavement-road-detail-native.png`);
  await stage.evaluate(() => {
    const camera = window.__belfast.scene('ResidentialScene').cameras.main;
    camera.setZoom(1).setScroll(0, 0);
    const s = window.__belfast.scene('ResidentialScene'); camera.startFollow(s.player, true, 0.12, 0.08).setDeadzone(120, 36);
  });

  const fpsSamples = [];
  const sampler = setInterval(async () => {
    try { fpsSamples.push(Number((await stage.evaluate(() => window.__belfast.fps())).toFixed(1))); } catch {}
  }, 500);
  await stage.keyboard.down('D');
  await stage.waitForFunction(() => window.__belfast.scene('ResidentialScene').player.x > 705, undefined, { timeout: 8000 });
  await stage.keyboard.up('D');
  clearInterval(sampler);
  const traversal = await stage.evaluate(() => {
    const s = window.__belfast.scene('ResidentialScene');
    return { playerX: Number(s.player.x.toFixed(1)), cameraX: s.cameras.main.scrollX,
      worldWidth: s.physics.world.bounds.width, groundTop: s.physics.world.staticBodies.entries[0]?.top,
      staticBodies: s.physics.world.staticBodies.entries.length, fps: Number(window.__belfast.fps().toFixed(1)) };
  });
  const scroll = await saveNativeCanvas(stage, `${outputDir}/v7-2-scroll-end-native.png`);
  const normal = await browser.newPage({ viewport: { width: 1200, height: 760 } });
  await normal.goto(`http://127.0.0.1:${port}/?test=1`);
  await normal.waitForFunction(() => window.__belfast?.scene('Title')?.sys.isActive());
  const normalMode = await normal.evaluate(() => ({ title: window.__belfast.scene('Title').sys.isActive(), residential: window.__belfast.scene('ResidentialScene').sys.isActive() }));
  await normal.close();
  const report = { browser: browser.version(), viewport: '1200 x 760', canvas: '480 x 270 native Phaser canvas',
    baseline: { path: `${outputDir}/v7-2-before-native.png`, ...before },
    stage: { path: `${outputDir}/v7-2-after-native.png`, ...after, ...contract },
    skyAndCranes: { path: `${outputDir}/v7-2-sky-cranes-native.png`, ...skyline, cameraZoom: 1.15 },
    detail: { path: `${outputDir}/v7-2-pavement-road-detail-native.png`, ...detail, cameraZoom: 1.8 },
    scrollEnd: { path: `${outputDir}/v7-2-scroll-end-native.png`, ...scroll }, traversal,
    fps: { method: 'window.__belfast.fps() sampled every 500 ms while walking from X=78 through the three-house gate',
      samples: fpsSamples, median: median(fpsSamples), min: Math.min(...fpsSamples), max: Math.max(...fpsSamples) },
    normalMode, browserErrors: errors, resourceWarnings: resources };
  if (traversal.playerX < 705 || traversal.cameraX <= 0 || traversal.worldWidth !== 14500
      || traversal.groundTop !== 225 || traversal.staticBodies !== 1 || !normalMode.title
      || normalMode.residential || !fpsSamples.length || errors.length || resources.length)
    throw new Error(`V7.2 scrolling / route checks failed: ${JSON.stringify(report)}`);
  await writeFile(`${outputDir}/v7-2-smoke.log`, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  await baseline.close(); await stage.close();
} finally { await browser?.close(); server.kill('SIGTERM'); }

async function saveNativeCanvas(page, path) {
  const result = await page.evaluate(() => {
    const canvas = document.querySelector('#game canvas');
    const s = window.__belfast.scene('ResidentialScene');
    return { width: canvas.width, height: canvas.height, data: canvas.toDataURL('image/png'),
      playerX: Number(s.player.x.toFixed(1)), cameraX: Number(s.cameras.main.scrollX.toFixed(1)) };
  });
  await writeFile(path, Buffer.from(result.data.slice(result.data.indexOf(',') + 1), 'base64'));
  delete result.data; return result;
}
function median(values) { const s = [...values].sort((a,b)=>a-b); return s.length ? s[Math.floor(s.length/2)] : null; }
