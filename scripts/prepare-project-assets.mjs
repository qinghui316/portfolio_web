import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { access, readFile } from 'node:fs/promises';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(root, 'assets-source', 'projects');
const outputDir = path.join(root, 'src', 'assets', 'projects');
const manifest = JSON.parse(await readFile(path.join(outputDir, 'project-manifest.json'), 'utf8'));

for (const { sourceFile, coverFile } of manifest) {
  const output = path.join(outputDir, coverFile);
  try { await access(output); }
  catch { await sharp(path.join(sourceDir, sourceFile)).resize(1024, 1024, { fit: 'cover' }).webp({ quality: 84, smartSubsample: true }).toFile(output); }
}

const atlasSize = 2048;
await sharp(path.join(outputDir, manifest[0].coverFile)).resize(128, 128).webp({ quality: 40 }).toFile(path.join(outputDir, 'first-project-preview.webp'));
const columns = 3;
const cellSize = Math.floor(atlasSize / columns);
if (manifest.length > columns * columns) throw new Error('Project atlas capacity exceeded');
const composites = await Promise.all(manifest.map(async ({ coverFile }, index) => ({
  input: await sharp(path.join(outputDir, coverFile)).resize(cellSize, cellSize, { fit: 'cover' }).toBuffer(),
  left: (index % columns) * cellSize,
  top: Math.floor(index / columns) * cellSize,
})));
await sharp({ create: { width: atlasSize, height: atlasSize, channels: 3, background: '#f4f0e8' } })
  .composite(composites).webp({ quality: 86, smartSubsample: true }).toFile(path.join(outputDir, 'project-atlas.webp'));
console.log(`Prepared ${manifest.length} project covers and project-atlas.webp`);
