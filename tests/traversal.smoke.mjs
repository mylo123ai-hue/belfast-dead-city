import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const executablePath = existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined;
const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4179'], { stdio: 'ignore' });
let browser;

async function waitForRoof(page) {
  await page.waitForFunction(() => {
    const g = window.__belfast?.scene('Game');
    const p = g?.platforms.getChildren().find((item) => item.getData('platform') === 'platform-taxi');
    const body = g?.player?.body;
    return body && p && body.blocked.down && Math.abs(body.bottom - p.body.top) <= 1 &&
      body.right > p.body.left && body.left < p.body.right;
  }, undefined, { timeout: 3500 });
}

async function waitForRoad(page) {
  await page.waitForFunction(() => {
    const g = window.__belfast?.scene('Game');
    return g?.player?.body?.blocked.down && Math.abs(g.player.body.bottom - 225) <= 1;
  }, undefined, { timeout: 3500 });
}

try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch('http://127.0.0.1:4179')).ok) { ready = true; break; } } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!ready) throw new Error('Vite preview did not become ready');
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath, args: ['--no-sandbox'] } : {}) });
  const page = await browser.newPage({ viewport: { width: 1200, height: 760 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:4179/?test=1');
  await page.waitForFunction(() => window.__belfast?.scene('Title')?.sys.isActive());
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__belfast?.scene('Game')?.player);

  const anchor = await page.evaluate(() => {
    const g = window.__belfast.scene('Game');
    const p = g.platforms.getChildren().find((item) => item.getData('platform') === 'platform-taxi');
    return { x: p.x, top: p.body.top, left: p.body.left, right: p.body.right,
      roofAnchor: p.getData('roofAnchor'), checks: p.body.checkCollision };
  });
  if (anchor.top !== 185 || anchor.roofAnchor.topOffsetY !== -11 || anchor.right - anchor.left !== 62 ||
      !anchor.checks.up || anchor.checks.down || anchor.checks.left || anchor.checks.right) {
    throw new Error(`Taxi roof collision contract failed: ${JSON.stringify(anchor)}`);
  }

  // Ordinary keyboard movement to the left of the taxi, then a rightward jump
  // onto its roof. State is observed for assertions; the player is never moved
  // by the test harness.
  await page.keyboard.down('D'); await page.waitForTimeout(1200); await page.keyboard.up('D');
  const approachX = await page.evaluate(() => window.__belfast.scene('Game').player.x);
  if (approachX < 235 || approachX > 275) throw new Error(`Approach distance was unexpected: ${approachX}`);
  await page.keyboard.down('D'); await page.keyboard.down('Space');
  await page.waitForTimeout(160); await page.keyboard.up('Space'); await page.waitForTimeout(500); await page.keyboard.up('D');
  await waitForRoof(page);
  const firstLanding = await page.evaluate(() => {
    const g = window.__belfast.scene('Game'), p = g.platforms.getChildren()[0];
    return { x: g.player.x, bottom: g.player.body.bottom, roof: p.body.top,
      grounded: g.player.body.blocked.down, velocityY: g.player.body.velocity.y };
  });
  if (firstLanding.x < anchor.left - 12 || firstLanding.x > anchor.right + 12 || firstLanding.velocityY !== 0)
    throw new Error(`Natural taxi landing failed: ${JSON.stringify(firstLanding)}`);

  await page.keyboard.press('F2');
  await page.waitForTimeout(80);
  await mkdir('artifacts', { recursive: true });
  await page.screenshot({ path: 'artifacts/v5-traversal-roof-debug.png' });
  await page.keyboard.down('D'); await page.waitForTimeout(140); await page.keyboard.up('D');
  await page.waitForTimeout(80);
  const crossedRoof = await page.evaluate(() => {
    const g = window.__belfast.scene('Game'), p = g.platforms.getChildren()[0];
    return { x: g.player.x, bottom: g.player.body.bottom, roof: p.body.top,
      grounded: g.player.body.blocked.down, platform: [p.body.left, p.body.right] };
  });
  if (crossedRoof.x < firstLanding.x + 12 || !crossedRoof.grounded || Math.abs(crossedRoof.bottom - crossedRoof.roof) > 1)
    throw new Error(`Taxi roof traversal slipped or fell through: ${JSON.stringify(crossedRoof)}`);

  // Jump off the left side and land on the road, then repeat the roof landing.
  await page.keyboard.down('A'); await page.keyboard.down('Space');
  await page.waitForTimeout(160); await page.keyboard.up('Space'); await page.waitForTimeout(720); await page.keyboard.up('A');
  await waitForRoad(page);
  const offRoad = await page.evaluate(() => ({ x: window.__belfast.scene('Game').player.x,
    bottom: window.__belfast.scene('Game').player.body.bottom,
    grounded: window.__belfast.scene('Game').player.body.blocked.down }));
  if (offRoad.x > anchor.left - 5 || Math.abs(offRoad.bottom - 225) > 1)
    throw new Error(`Jumping off taxi did not return to road: ${JSON.stringify(offRoad)}`);
  await page.screenshot({ path: 'artifacts/v5-traversal-road-debug.png' });

  await page.keyboard.down('D'); await page.keyboard.down('Space');
  await page.waitForTimeout(160); await page.keyboard.up('Space'); await page.waitForTimeout(500); await page.keyboard.up('D');
  await waitForRoof(page);
  const secondLanding = await page.evaluate(() => {
    const g = window.__belfast.scene('Game'), p = g.platforms.getChildren()[0];
    return { x: g.player.x, bottom: g.player.body.bottom, roof: p.body.top,
      grounded: g.player.body.blocked.down, velocityY: g.player.body.velocity.y };
  });
  if (!secondLanding.grounded || Math.abs(secondLanding.bottom - secondLanding.roof) > 1)
    throw new Error(`Repeated taxi landing failed: ${JSON.stringify(secondLanding)}`);
  if (errors.length) throw new Error(`Browser exceptions: ${errors.join(' | ')}`);
  console.log(JSON.stringify({ browser: browser.version(), mode: 'headless Chromium / Linux cloud runner',
    anchor, approachX, firstLanding, crossedRoof, offRoad, secondLanding, browserErrors: errors,
    screenshots: ['artifacts/v5-traversal-roof-debug.png', 'artifacts/v5-traversal-road-debug.png'] }, null, 2));
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
