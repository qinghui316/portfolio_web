import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'source-images');
const output = path.join(root, 'src/assets/contact');
await mkdir(output, { recursive: true });

async function readSprite(name) {
  const { data, info } = await sharp(path.join(source, `${name}.png`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const chroma = Math.min(r, b) - g;
    const keep = 1 - Math.max(0, Math.min(1, (chroma - 25) / 90));
    data[i + 3] = Math.round(data[i + 3] * keep);
    if (keep < 1) {
      data[i] = Math.min(r, g + 24);
      data[i + 2] = Math.min(b, g + 24);
    }
  }
  return { data, info };
}

// Lock all non-moving cabin pixels to the closed sprite, including antennas and feet.
function mergeMovingRegion(closed, opened, region) {
  if (closed.info.width !== opened.info.width || closed.info.height !== opened.info.height) throw new Error('State canvases must match');
  const data = Buffer.from(closed.data);
  const { width, height } = closed.info;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (!region(x / width, y / height)) continue;
    const i = (y * width + x) * 4;
    opened.data.copy(data, i, i, i + 4);
  }
  return { data, info: closed.info };
}

const phoneClosed = await readSprite('phone-closed');
const phoneOpen = mergeMovingRegion(phoneClosed, await readSprite('phone-open'), (x, y) => x > .385 && y > .403 && y < .85);
const emailClosed = await readSprite('email-closed');
const emailOpen = mergeMovingRegion(emailClosed, await readSprite('email-open'), (x, y) => x > .24 && x < .95 && y > .2 && y < .735);
const sprites = { 'phone-closed': phoneClosed, 'phone-open': phoneOpen, 'email-closed': emailClosed, 'email-open': emailOpen };
for (const [name, sprite] of Object.entries(sprites)) {
  await sharp(sprite.data, { raw: sprite.info }).resize({ height: name.startsWith('phone') ? 1200 : 700 }).webp({ quality: 88, alphaQuality: 100, effort: 6 }).toFile(path.join(output, `${name}.webp`));
}

// Derive the mountain silhouette from the generated plate, removing its baked checkerboard sky.
const terrain = await sharp(path.join(source, 'terrain.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height } = terrain.info;
let minimum = height;
for (let x = 0; x < width; x++) {
  let boundary = height - 1;
  for (let y = Math.floor(height * .45); y < height; y++) {
    const i = (y * width + x) * 4;
    if (Math.max(terrain.data[i], terrain.data[i + 1], terrain.data[i + 2]) < 155) { boundary = y; break; }
  }
  minimum = Math.min(minimum, boundary);
  for (let y = 0; y < boundary; y++) terrain.data[(y * width + x) * 4 + 3] = 0;
}
await sharp(terrain.data, { raw: terrain.info }).extract({ left: 0, top: minimum - 3, width, height: height - minimum + 3 }).webp({ quality: 87, alphaQuality: 100, effort: 6 }).toFile(path.join(output, 'terrain.webp'));
await writeFile(path.join(output, 'layout.json'), JSON.stringify({ phone: { aspect: 1024 / 1536, anchorX: .62, bottom: .06, heightSvh: 66 }, email: { aspect: 1, anchorX: .35, bottom: .06, widthSvh: 29 }, groundHeight: .28 }, null, 2));
console.log('Prepared five aligned Contact WebP layers.');
