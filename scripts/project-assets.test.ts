import assert from 'node:assert/strict';
import { stat, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const assetDir = path.join(root, 'src', 'assets', 'projects');
const manifest = JSON.parse(await readFile(path.join(assetDir, 'project-manifest.json'), 'utf8')) as { id: string; coverFile: string }[];
const covers = manifest.map(item => item.coverFile);

test('project covers are square and lightweight', async () => {
  let totalBytes = 0;
  for (const cover of covers) {
    const file = path.join(assetDir, cover);
    const [metadata, info] = await Promise.all([sharp(file).metadata(), stat(file)]);
    assert.equal(metadata.width, 1024, `${cover} width`);
    assert.equal(metadata.height, 1024, `${cover} height`);
    assert.ok(info.size < 260_000, `${cover} should stay below 260 KB`);
    totalBytes += info.size;
  }
  assert.ok(totalBytes < 1_500_000, 'fallback covers should stay below 1.5 MB');
});

test('project atlas has the expected dimensions and budget', async () => {
  const file = path.join(assetDir, 'project-atlas.webp');
  const [metadata, info] = await Promise.all([sharp(file).metadata(), stat(file)]);
  assert.equal(metadata.width, 2048);
  assert.equal(metadata.height, 2048);
  assert.ok(info.size < 800_000, 'project atlas should stay below 800 KB');
});

test('first-project preview is small enough for Vite inline assets', async () => {
  const info = await stat(path.join(assetDir, 'first-project-preview.webp'));
  assert.ok(info.size < 4096, 'preview must not add a standalone request');
});

test('seven atlas cells match the ordered covers', async () => {
  assert.equal(manifest.length, 7);
  assert.equal(manifest[0].id, 'sayweave');
  assert.equal(new Set(manifest.map(item => item.id)).size, manifest.length);
  const references = await Promise.all(covers.map(cover => sharp(path.join(assetDir, cover)).resize(32, 32).removeAlpha().raw().toBuffer()));
  const scores: number[] = [];
  for (let i = 0; i < manifest.length; i++) {
    const cell = await sharp(path.join(assetDir, 'project-atlas.webp'))
      .extract({ left: i % 3 * 682, top: Math.floor(i / 3) * 682, width: 682, height: 682 }).resize(32, 32).removeAlpha().raw().toBuffer();
    const errors = references.map(ref => cell.reduce((sum, value, j) => sum + Math.abs(value - ref[j]), 0) / cell.length);
    assert.equal(errors.indexOf(Math.min(...errors)), i, `${manifest[i].id} should occupy cell ${i}`);
    assert.ok(errors[i] < 12, `${manifest[i].id} should retain its cover colors`);
    scores.push(errors[i]);
  }
  console.log('Atlas cell mean errors:', scores.map(score => score.toFixed(2)).join(', '));
});
