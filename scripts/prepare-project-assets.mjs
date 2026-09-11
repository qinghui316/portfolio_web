import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(root, 'assets-source', 'projects');
const outputDir = path.join(root, 'src', 'assets', 'projects');

const covers = [
  ['moonai.png', 'moonai.webp'],
  ['ecl-harness.png', 'ecl-harness.webp'],
  ['yaoxiaohui.png', 'yaoxiaohui.webp'],
  ['video-fast-clip.png', 'video-fast-clip.webp'],
  ['qwen-embedding.png', 'qwen-embedding.webp'],
  ['aigc-course.png', 'aigc-course.webp'],
];

await Promise.all(
  covers.map(([source, output]) =>
    sharp(path.join(sourceDir, source))
      .resize(1024, 1024, { fit: 'cover' })
      .webp({ quality: 84, smartSubsample: true })
      .toFile(path.join(outputDir, output)),
  ),
);

const atlasSize = 2048;
const cellsPerRow = 3;
const cellSize = Math.floor(atlasSize / cellsPerRow);
const composites = await Promise.all(
  covers.map(async ([source], index) => ({
    input: await sharp(path.join(sourceDir, source))
      .resize(cellSize, cellSize, { fit: 'cover' })
      .webp({ quality: 86, smartSubsample: true })
      .toBuffer(),
    left: (index % cellsPerRow) * cellSize,
    top: Math.floor(index / cellsPerRow) * cellSize,
  })),
);

await sharp({
  create: {
    width: atlasSize,
    height: atlasSize,
    channels: 3,
    background: '#f4f0e8',
  },
})
  .composite(composites)
  .webp({ quality: 86, smartSubsample: true })
  .toFile(path.join(outputDir, 'project-atlas.webp'));

console.log(`Prepared ${covers.length} project covers and project-atlas.webp`);
