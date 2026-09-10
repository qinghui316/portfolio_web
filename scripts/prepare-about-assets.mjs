import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'assets-source', 'about');
const output = path.join(root, 'src', 'assets', 'about');

const roundRect = (width, height, radius, fill, stroke = 'none', strokeWidth = 0) => Buffer.from(
  `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect x="${strokeWidth / 2}" y="${strokeWidth / 2}" width="${width - strokeWidth}" height="${height - strokeWidth}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/></svg>`,
);

async function webp(name, target, options = {}) {
  const pipeline = sharp(path.join(source, name));
  if (options.width || options.height) {
    pipeline.resize({ width: options.width, height: options.height, fit: 'inside', withoutEnlargement: true });
  }
  await pipeline.webp({ quality: options.quality ?? 84, alphaQuality: 100, effort: 6 }).toFile(path.join(output, target));
}

async function roundedFace(name, width, height, radius) {
  const image = await sharp(path.join(source, name)).resize(width, height, { fit: 'fill' }).toBuffer();
  return sharp(image)
    .composite([{ input: roundRect(width, height, radius, '#fff'), blend: 'dest-in' }])
    .png()
    .toBuffer();
}

async function buildBadgeAtlas() {
  const size = 2048;
  const half = size / 2;
  const faces = [
    { name: 'badge-front.png', x: 0, uvHeight: Math.round(size * 0.755) },
    { name: 'badge-back.png', x: half, uvHeight: Math.round(size * 0.757) },
  ];
  const composites = [];

  for (const face of faces) {
    const left = face.x + Math.round(half * 0.05);
    const top = Math.round(face.uvHeight * 0.075);
    const width = Math.round(half * 0.9);
    const height = Math.round(face.uvHeight * 0.9);
    composites.push({ input: roundRect(width + 8, height + 8, 36, '#767f7c'), left: left - 4, top: top - 4 });
    composites.push({ input: await roundedFace(face.name, width, height, 32), left, top });
    composites.push({ input: roundRect(half - 12, face.uvHeight - 12, 40, 'none', '#f8faf9', 5), left: face.x + 6, top: 6 });
  }

  await sharp({ create: { width: size, height: size, channels: 4, background: '#d4d7d5' } })
    .composite(composites)
    .webp({ quality: 90, alphaQuality: 100, effort: 6 })
    .toFile(path.join(output, 'badge-atlas.webp'));
}

async function stripGlbTexture() {
  const input = await fs.readFile(path.join(source, 'card.glb'));
  const jsonLength = input.readUInt32LE(12);
  const json = JSON.parse(input.subarray(20, 20 + jsonLength).toString('utf8').replace(/\0+$/u, ''));
  const binHeader = 20 + jsonLength;
  const binStart = binHeader + 8;
  const imageViews = new Set((json.images ?? []).map((image) => image.bufferView));
  const retainedViews = json.bufferViews.filter((_, index) => !imageViews.has(index));

  if (retainedViews.length !== json.bufferViews.length - imageViews.size || [...imageViews].some((index) => index < retainedViews.length)) {
    throw new Error('Unexpected GLB buffer layout; refusing to rewrite card.glb');
  }

  for (const mesh of json.meshes ?? []) {
    for (const primitive of mesh.primitives ?? []) delete primitive.material;
  }
  delete json.images;
  delete json.textures;
  delete json.samplers;
  delete json.materials;
  json.bufferViews = retainedViews;

  const binaryLength = retainedViews.reduce((end, view) => Math.max(end, (view.byteOffset ?? 0) + view.byteLength), 0);
  json.buffers[0].byteLength = binaryLength;
  const jsonBody = Buffer.from(JSON.stringify(json));
  const jsonPadding = (4 - (jsonBody.length % 4)) % 4;
  const paddedJson = Buffer.concat([jsonBody, Buffer.alloc(jsonPadding, 0x20)]);
  const binary = input.subarray(binStart, binStart + binaryLength);
  const binaryPadding = (4 - (binary.length % 4)) % 4;
  const paddedBinary = Buffer.concat([binary, Buffer.alloc(binaryPadding)]);
  const result = Buffer.alloc(12 + 8 + paddedJson.length + 8 + paddedBinary.length);
  result.writeUInt32LE(0x46546c67, 0);
  result.writeUInt32LE(2, 4);
  result.writeUInt32LE(result.length, 8);
  result.writeUInt32LE(paddedJson.length, 12);
  result.writeUInt32LE(0x4e4f534a, 16);
  paddedJson.copy(result, 20);
  const next = 20 + paddedJson.length;
  result.writeUInt32LE(paddedBinary.length, next);
  result.writeUInt32LE(0x004e4942, next + 4);
  paddedBinary.copy(result, next + 8);
  await fs.writeFile(path.join(output, 'card.glb'), result);
}

await fs.mkdir(output, { recursive: true });
await Promise.all([
  webp('dossier-clean.png', 'dossier.webp', { quality: 84 }),
  webp('comic-backing.png', 'comic-backing.webp', { quality: 82 }),
  webp('character-default.png', 'character-default.webp', { width: 1200, height: 1500, quality: 86 }),
  webp('character-active.png', 'character-active.webp', { width: 1200, height: 1500, quality: 86 }),
  webp('badge-static-front.png', 'badge-static-front.webp', { quality: 86 }),
  webp('badge-static-back.png', 'badge-static-back.webp', { quality: 86 }),
  webp('lanyard-fabric.png', 'lanyard-fabric.webp', { width: 384, height: 992, quality: 84 }),
  buildBadgeAtlas(),
  stripGlbTexture(),
]);

const files = await fs.readdir(output, { withFileTypes: true });
for (const file of files.filter((entry) => entry.isFile())) {
  const stats = await fs.stat(path.join(output, file.name));
  console.log(`${file.name}\t${stats.size}`);
}
