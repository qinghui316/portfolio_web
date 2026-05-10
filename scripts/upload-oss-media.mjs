import crypto from 'node:crypto';
import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(rootDir, '.env.local') });

const requiredEnv = [
  'OSS_ACCESS_KEY_ID',
  'OSS_ACCESS_KEY_SECRET',
  'OSS_ENDPOINT',
  'OSS_BUCKET_NAME',
];

const missing = requiredEnv.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing required env in .env.local: ${missing.join(', ')}`);
  process.exit(1);
}

const accessKeyId = process.env.OSS_ACCESS_KEY_ID;
const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET;
const endpoint = process.env.OSS_ENDPOINT.replace(/^https?:\/\//, '').replace(/\/$/, '');
const bucket = process.env.OSS_BUCKET_NAME;
const prefix = (process.env.OSS_PREFIX || 'users').replace(/^\/+|\/+$/g, '');
const forcePathStyle = process.env.OSS_FORCE_PATH_STYLE === 'true';
const portfolioPrefix = `${prefix}/portfolio`;
const requestedEnvNames = new Set(process.argv.slice(2));

const assets = [
  {
    envName: 'VITE_HERO_LOOK_SCRUB_2K_URL',
    localPath: 'public/media/hero/hero-look-scrub-2k.mp4',
    objectKey: `${portfolioPrefix}/hero/hero-look-scrub-2k.mp4`,
    contentType: 'video/mp4',
  },
  {
    envName: 'VITE_HERO_LOOK_SCRUB_1080_URL',
    localPath: 'public/media/hero/hero-look-scrub-1080.mp4',
    objectKey: `${portfolioPrefix}/hero/hero-look-scrub-1080.mp4`,
    contentType: 'video/mp4',
  },
  {
    envName: 'VITE_HERO_POSTER_URL',
    localPath: 'public/media/hero/hero-poster.webp',
    objectKey: `${portfolioPrefix}/hero/hero-poster.webp`,
    contentType: 'image/webp',
  },
  {
    envName: 'VITE_SCROLL_WORK_VIDEO_2K_URL',
    localPath: 'public/media/scroll/scroll-work-2k.mp4',
    objectKey: `${portfolioPrefix}/scroll/scroll-work-2k.mp4`,
    contentType: 'video/mp4',
  },
  {
    envName: 'VITE_SCROLL_WORK_VIDEO_1080_URL',
    localPath: 'public/media/scroll/scroll-work-1080.mp4',
    objectKey: `${portfolioPrefix}/scroll/scroll-work-1080.mp4`,
    contentType: 'video/mp4',
  },
  {
    envName: 'VITE_SCROLL_WORK_POSTER_URL',
    localPath: 'public/media/scroll/scroll-work-poster.webp',
    objectKey: `${portfolioPrefix}/scroll/scroll-work-poster.webp`,
    contentType: 'image/webp',
  },
  {
    envName: 'VITE_MOONAI_PROMO_VIDEO_URL',
    localPath: 'media-export/moonai-workbench-promo.mp4',
    objectKey: `${portfolioPrefix}/projects/moonai-workbench-promo.mp4`,
    contentType: 'video/mp4',
    optional: true,
  },
  {
    envName: 'VITE_MOONAI_FILM_DEMO_VIDEO_URL',
    localPath: 'media-export/moonai-film-demo.mp4',
    objectKey: `${portfolioPrefix}/projects/moonai-film-demo.mp4`,
    contentType: 'video/mp4',
    optional: true,
  },
];

const selectedAssets = requestedEnvNames.size
  ? assets.filter((asset) => requestedEnvNames.has(asset.envName))
  : assets;
const unknownEnvNames = [...requestedEnvNames].filter((envName) => !assets.some((asset) => asset.envName === envName));

if (unknownEnvNames.length) {
  console.error(`Unknown media env name(s): ${unknownEnvNames.join(', ')}`);
  process.exit(1);
}

const getPublicUrl = (objectKey) => {
  if (forcePathStyle) {
    return `https://${endpoint}/${bucket}/${objectKey}`;
  }

  return `https://${bucket}.${endpoint}/${objectKey}`;
};

const signRequest = ({ method, contentType, date, objectKey, ossHeaders }) => {
  const canonicalizedOSSHeaders = Object.entries(ossHeaders)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key.toLowerCase()}:${value}\n`)
    .join('');
  const canonicalizedResource = `/${bucket}/${objectKey}`;
  const stringToSign = `${method}\n\n${contentType}\n${date}\n${canonicalizedOSSHeaders}${canonicalizedResource}`;
  const signature = crypto
    .createHmac('sha1', accessKeySecret)
    .update(stringToSign)
    .digest('base64');

  return `OSS ${accessKeyId}:${signature}`;
};

const uploadAsset = (asset) =>
  new Promise((resolve, reject) => {
    const absolutePath = path.join(rootDir, asset.localPath);
    if (!fs.existsSync(absolutePath)) {
      reject(new Error(`Missing local file: ${asset.localPath}`));
      return;
    }

    const body = fs.readFileSync(absolutePath);
    const date = new Date().toUTCString();
    const ossHeaders = {
      'x-oss-object-acl': 'public-read',
    };
    const authorization = signRequest({
      method: 'PUT',
      contentType: asset.contentType,
      date,
      objectKey: asset.objectKey,
      ossHeaders,
    });
    const requestPath = forcePathStyle
      ? `/${bucket}/${asset.objectKey}`
      : `/${asset.objectKey}`;

    const request = https.request(
      {
        method: 'PUT',
        hostname: forcePathStyle ? endpoint : `${bucket}.${endpoint}`,
        path: requestPath,
        headers: {
          Authorization: authorization,
          Date: date,
          'Content-Type': asset.contentType,
          'Content-Length': body.length,
          'Cache-Control': 'public, max-age=31536000, immutable',
          ...ossHeaders,
        },
      },
      (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          const responseBody = Buffer.concat(chunks).toString('utf8');
          if (response.statusCode >= 200 && response.statusCode < 300) {
            resolve(getPublicUrl(asset.objectKey));
            return;
          }

          reject(new Error(`Upload failed for ${asset.localPath}: ${response.statusCode} ${responseBody}`));
        });
      },
    );

    request.on('error', reject);
    request.end(body);
  });

const uploaded = [];
for (const asset of selectedAssets) {
  const absolutePath = path.join(rootDir, asset.localPath);
  if (asset.optional && !requestedEnvNames.size && !fs.existsSync(absolutePath)) {
    console.log(`Skipping optional missing file: ${asset.localPath}`);
    continue;
  }

  process.stdout.write(`Uploading ${asset.localPath} ... `);
  const url = await uploadAsset(asset);
  uploaded.push({ envName: asset.envName, url });
  console.log('done');
}

console.log('\nAdd these public URLs to .env.production on the server:\n');
for (const asset of uploaded) {
  console.log(`${asset.envName}="${asset.url}"`);
}
