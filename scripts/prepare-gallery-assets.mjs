import sharp from 'sharp';
import { readFile, stat } from 'node:fs/promises';

const manifest = JSON.parse(await readFile('src/assets/projects/project-manifest.json', 'utf8'));
let desktopBytes = 0;
for (const { id } of manifest) {
  const source = `assets-source/gallery/${id}-generated-${id === 'sayweave' ? 'v2' : 'v3'}.png`;
  for (const [width, height, quality] of [[1600, 900, 85], [960, 540, 83]]) {
    const target = `src/assets/gallery/${id}-${width}.webp`;
    // The source already contains the complete artwork; this step only encodes delivery sizes.
    await sharp(source).resize(width, height, { fit: 'cover' }).webp({ quality, effort: 6 }).toFile(target);
    const bytes = (await stat(target)).size;
    if (bytes > 400_000) throw new Error(`Poster budget exceeded: ${target}: ${bytes}`);
    if (width === 1600) desktopBytes += bytes;
    console.log(target, bytes);
  }
}
if (desktopBytes > 2_800_000) throw new Error(`Gallery budget exceeded: ${desktopBytes}`);
await sharp('assets-source/gallery/sayweave-generated-v2.png').resize(160, 90, { fit: 'cover' }).webp({ quality: 35, effort: 6 }).toFile('src/assets/gallery/first-preview.webp');
if ((await stat('src/assets/gallery/first-preview.webp')).size >= 4096) throw new Error('First preview exceeds the inline budget');
