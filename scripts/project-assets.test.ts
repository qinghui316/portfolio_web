import assert from 'node:assert/strict';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const assetDir = path.join(root, 'src', 'assets', 'projects');
const covers = [
  'moonai.webp',
  'ecl-harness.webp',
  'yaoxiaohui.webp',
  'video-fast-clip.webp',
  'qwen-embedding.webp',
  'aigc-course.webp',
];

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
  assert.ok(totalBytes < 1_200_000, 'fallback covers should stay below 1.2 MB');
});

test('project atlas has the expected dimensions and budget', async () => {
  const file = path.join(assetDir, 'project-atlas.webp');
  const [metadata, info] = await Promise.all([sharp(file).metadata(), stat(file)]);
  assert.equal(metadata.width, 2048);
  assert.equal(metadata.height, 2048);
  assert.ok(info.size < 700_000, 'project atlas should stay below 700 KB');
});
