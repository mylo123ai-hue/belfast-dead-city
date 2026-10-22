import { chromium } from '@playwright/test';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const outDir = 'artifacts/v4-recording';
await mkdir(outDir, { recursive: true });
const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173'], { stdio: 'ignore' });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1200, height: 760 }, recordVideo: { dir: outDir, size: { width: 1200, height: 760 } } });
const page = await context.newPage();
const errors = [];
const trace = [];
page.on('pageerror', (e) => errors.push(e.stack || e.message));
let video;

async function state() {
  return page.evaluate(() => {
    const g = window.__belfast.scene('Game');
    return { x: Math.round(g.player.x), health: g.health, ammo: g.ammo, kills: g.kills, bossHp: g.bossHp,
      phase: g.bossPhase, boss: !!g.boss, complete: g.complete, gameOver: g.health <= 0,
      elapsed: Number(g.elapsed.toFixed(2)), section: g.section, banner: g.centerText.text, fps: Math.round(window.__belfast.fps()),
      paused: g.paused, bossActive: g.boss?.active ?? false, bossX: Math.round(g.boss?.x ?? 0), bullets: g.bullets.countActive(),
      explosion: g.children.list.some((child) => child.texture?.key?.startsWith('arc-blast-') && child.active) };
  });
}
async function tap(key, hold = 72) { await page.keyboard.down(key); await wait(hold); await page.keyboard.up(key); }
async function screenshot(name, settle = 360) { if (settle) await wait(settle); await page.screenshot({ path: 'artifacts/' + name }); }
async function log(label) { const s = await state(); trace.push({ label, ...s }); console.log(label + ': ' + JSON.stringify(s)); return s; }

try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch('http://127.0.0.1:4173')).ok) { ready = true; break; } } catch {}
    await wait(250);
  }
  if (!ready) throw new Error('Vite preview did not become ready');
  await page.goto('http://127.0.0.1:4173/?test=1');
  await page.waitForFunction(() => window.__belfast?.scene('Title')?.sys.isActive());
  await screenshot('v4-title.png');
  video = page.video();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__belfast?.scene('Game')?.player);
  await page.waitForTimeout(700);
  await screenshot('v4-residential-road.png');
  console.log('Natural run started at the title screen using Enter; all movement and combat below use keyboard input.');

  await page.keyboard.down('D');
  await page.keyboard.down('J');
  let s = await state(), tick = 0, nextJump = Date.now() + 500, nextGrenade = [720, 1850, 2900, 3920], grenadeAt = new Set();
  let screens = new Set();
  while (s.x < 3995 && !s.gameOver && tick < 650) {
    if (Date.now() >= nextJump) { await tap('Space', 65); nextJump = Date.now() + 610; }
    for (const x of nextGrenade) if (s.x > x && !grenadeAt.has(x) && s.ammo > 0) { await tap('K'); grenadeAt.add(x); }
    if (s.x > 720 && !screens.has('residential-junction')) { await screenshot('v4-residential-junction.png'); screens.add('residential-junction'); }
    if (s.x > 1900 && !screens.has('city')) { await screenshot('v4-city-centre.png'); screens.add('city'); }
    if (s.x > 2700 && !screens.has('mixed')) { await screenshot('v4-mixed-encounter.png'); screens.add('mixed'); }
    if (s.x > 3350 && !screens.has('cityhall-approach')) { await screenshot('v4-city-hall-approach.png'); screens.add('cityhall-approach'); }
    if (s.explosion && !screens.has('explosion')) { await screenshot('v4-explosion.png',35); screens.add('explosion'); }
    if (s.x > 4050 && !screens.has('hall') && s.bossActive) { await screenshot('v4-city-hall-boss.png'); screens.add('hall'); }
    if (tick % 15 === 0) s = await log('Route'); else s = await state();
    tick++;
    await wait(70);
  }
  await page.keyboard.up('D');
  s = await log('City Hall approach');
  if (s.gameOver) console.log('Player was defeated before reaching the boss; the recording preserves the natural result.');

  let bossAction = '', bossTicks = 0, nextHop = Date.now() + 250, strafeUntil = 0;
  if (!s.gameOver) {
    await page.keyboard.down('J');
    if (s.ammo > 0) await tap('K');
    while (!s.complete && !s.gameOver && bossTicks < 720) {
      s = await state();
      if (s.explosion && !screens.has('explosion')) { await screenshot('v3-explosion.png',35); screens.add('explosion'); }
      if (!screens.has('hall') && s.bossActive && (s.bossHp <= 30 || bossTicks === 64)) {
        await screenshot('v4-city-hall-boss.png'); screens.add('hall');
      }
      if (s.banner !== bossAction) {
        bossAction = s.banner;
        if (bossAction.includes('GROUND SLAM')) { await tap('Space', 80); }
        if (bossAction.includes('ACID VOLLEY')) { await tap('Space', 80); }
      }
      if (Date.now() >= nextHop) { await tap('Space', 65); nextHop = Date.now() + 650; }
      if (s.ammo > 0 && s.phase === 1 && bossTicks % 80 === 4) await tap('K');
      const direction = Math.floor(bossTicks / 28) % 2 === 0 ? 'D' : 'A';
      if (Date.now() >= strafeUntil) {
        await page.keyboard.up(direction === 'D' ? 'A' : 'D');
        await page.keyboard.down(direction);
        strafeUntil = Date.now() + 260;
      }
      if (bossTicks % 40 === 0) s = await log('Boss');
      bossTicks++;
      await wait(70);
    }
    await page.keyboard.up('A'); await page.keyboard.up('D'); await page.keyboard.up('J');
  }
  s = await log('Natural run result');
  await screenshot(s.complete ? 'v4-victory.png' : 'v4-run-result.png');
  await writeFile('artifacts/v4-playthrough.json', JSON.stringify({ result: s, trace,
    controls: 'Keyboard only: Enter, D/J held, timed Space jumps, K grenades, boss evasions. No scene-state mutation.',
    outcome: s.complete ? 'natural victory' : s.gameOver ? 'game over' : 'route limit reached' }, null, 2));
  if (errors.length) throw new Error('Browser exceptions: ' + errors.join(' | '));
  if (s.complete) console.log('Natural victory verified: browser video captured real keyboard play through the boss defeat and victory screen.');
  else console.log('No natural victory this run. The video shows the actual run result; this is not counted as a victory test.');
} finally {
  await context.close();
  if (video) await rename(await video.path(), 'artifacts/v4-full-playthrough.webm');
  await browser.close();
  server.kill('SIGTERM');
}
