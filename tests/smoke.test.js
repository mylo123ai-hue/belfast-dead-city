import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('project keeps static browser build and Pages relative paths', async () => {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  const vite = await readFile(new URL('../vite.config.ts', import.meta.url), 'utf8');
  const workflow = await readFile(new URL('../.github/workflows/verify.yml', import.meta.url), 'utf8');
  assert.equal(pkg.dependencies.phaser.startsWith('^3.'), true);
  assert.match(vite, /base:\s*['"]\.\/['"]/);
  assert.match(workflow, /npm run test:browser/);
  assert.doesNotMatch(workflow, /deploy-pages|publish/i);
});

test('game provides the requested controls, sections, and enemy roster', async () => {
  const source = await readFile(new URL('../src/main.ts', import.meta.url), 'utf8');
  for (const needle of ['RESIDENTIAL BELFAST', 'CITY CENTRE', 'CITY HALL', "'shambler'", "'runner'", "'spitter'", 'GRENADE', 'PAUSED', 'BELFAST STANDS']) {
    assert.ok(source.includes(needle), `missing gameplay marker ${needle}`);
  }
});
