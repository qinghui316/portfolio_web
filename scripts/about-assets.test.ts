import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const runtime = path.join(root, 'src', 'assets', 'about');
const runtimeFiles = [
  'dossier.webp',
  'comic-backing.webp',
  'character-default.webp',
  'character-active.webp',
  'badge-static-front.webp',
  'badge-static-back.webp',
  'badge-atlas.webp',
  'lanyard-fabric.webp',
  'card.glb',
];

test('About runtime assets stay within the transfer budget', async () => {
  const sizes = await Promise.all(runtimeFiles.map(async (name) => (await stat(path.join(runtime, name))).size));
  assert.ok(sizes.reduce((sum, size) => sum + size, 0) < 1_100_000);
});

test('About essential visual layer remains lightweight', async () => {
  const essentials = ['dossier.webp', 'comic-backing.webp', 'character-default.webp', 'badge-static-front.webp', 'badge-static-back.webp'];
  const sizes = await Promise.all(essentials.map(async (name) => (await stat(path.join(runtime, name))).size));
  assert.ok(sizes.reduce((sum, size) => sum + size, 0) < 350_000);
});

test('runtime GLB contains geometry without the unused embedded texture', async () => {
  const glb = await readFile(path.join(runtime, 'card.glb'));
  const jsonLength = glb.readUInt32LE(12);
  const json = JSON.parse(glb.subarray(20, 20 + jsonLength).toString('utf8').trim());
  assert.equal(json.images, undefined);
  assert.equal(json.textures, undefined);
  assert.ok(glb.length < 250_000);
});
