import { chromium } from '@playwright/test';
import { mkdir, rename } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const outDir = 'artifacts/recording';
await mkdir(outDir, { recursive: true });
const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173'], { stdio: 'ignore' });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1200, height: 760 }, recordVideo: { dir: outDir, size: { width: 1200, height: 760 } } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
let recording;

async function status() {
  return page.evaluate(() => {
    const g = window.__belfast.scene('Game');
    return { x: Math.round(g.player.x), health: g.health, ammo: g.ammo, bossHp: g.bossHp, phase: g.bossPhase, boss: !!g.boss, complete: g.complete, gameOver: g.health <= 0, banner: g.centerText.text };
  });
}
async function shot() {
  await page.keyboard.down('J'); await wait(45); await page.keyboard.up('J'); await wait(145);
}
async function logProgress(label) {
  const s = await status();
  console.log(`${label}: ${JSON.stringify(s)}`);
  return s;
}

try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch('http://127.0.0.1:4173')).ok) { ready = true; break; } } catch {}
    await wait(250);
  }
  if (!ready) throw new Error('Vite preview did not become ready');
  await page.goto('http://127.0.0.1:4173/?test=1');
  await page.waitForFunction(() => window.__belfast?.scene('Title')?.sys.isActive());
  await wait(1400);
  recording = page.video();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__belfast?.scene('Game')?.player);
  await wait(900);
  console.log('Started the run from the title screen with Enter.');

  await page.keyboard.down('D');
  let i = 0;
  let s = await status();
  while (s.x < 3970 && s.health > 0 && i < 280) {
    await shot();
    if (i % 17 === 8) { await page.keyboard.press('Space'); }
    if (i % 24 === 11) { await page.keyboard.press('K'); }
    i++;
    if (i % 20 === 0) s = await logProgress('Street advance');
    else s = await status();
  }
  await page.keyboard.up('D');
  s = await logProgress('City Hall approach');

  if (s.health > 0) {
    await page.keyboard.down('D');
    let approachTicks = 0;
    while (!s.boss && s.x < 4100 && s.health > 0 && approachTicks < 80) {
      await shot(); s = await status(); approachTicks++;
    }
    await page.keyboard.up('D');
    s = await logProgress('Boss entrance');
  }

  let dodgedBanner = '';
  let bossTicks = 0;
  while (s.boss && !s.complete && s.health > 0 && bossTicks < 220) {
    if (String(s.banner).includes('DODGE THE STRIKE') && dodgedBanner !== s.banner) {
      await page.keyboard.down('A'); await wait(520); await page.keyboard.up('A');
      dodgedBanner = s.banner;
    }
    await shot();
    if (bossTicks % 11 === 8 && s.phase === 1) {
      await page.keyboard.down('D'); await wait(260); await page.keyboard.up('D');
    }
    bossTicks++;
    if (bossTicks % 15 === 0) s = await logProgress('Boss fight');
    else s = await status();
  }
  s = await logProgress('Run result');
  if (!s.complete) console.log('Run did not reach victory through keyboard play; the recorded session preserves the actual result.');
  else await wait(1700);
  await wait(400);
  if (errors.length) throw new Error(`Browser exceptions: ${errors.join(' | ')}`);
} finally {
  await context.close();
  if (recording) {
    const tempPath = await recording.path();
    await rename(tempPath, 'artifacts/gameplay-run.webm');
  }
  await browser.close();
  server.kill('SIGTERM');
}
