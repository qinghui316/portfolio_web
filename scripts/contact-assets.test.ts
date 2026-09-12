import test from 'node:test';
import assert from 'node:assert/strict';
import { stat, readdir } from 'node:fs/promises';
import sharp from 'sharp';
import { resolveContactState, contactValues } from '../src/components/contact/contactState';

const names = ['terrain', 'phone-closed', 'phone-open', 'email-closed', 'email-open'];
test('five assets have real alpha, budget under 1.8 MB', async () => {
  let sum = 0;
  for (const name of names) {
    const file = `src/assets/contact/${name}.webp`;
    const meta = await sharp(file).metadata();
    assert.equal(meta.hasAlpha, true);
    const raw = await sharp(file).ensureAlpha().raw().toBuffer();
    assert.equal(raw[3], 0, `${name} top corner must be transparent`);
    let magenta = 0;
    for (let i = 0; i < raw.length; i += 4) if (raw[i + 3] > 128 && Math.min(raw[i], raw[i + 2]) - raw[i + 1] > 90) magenta++;
    assert.equal(magenta, 0, `${name} has chroma-key spill`);
    sum += (await stat(file)).size;
  }
  assert.ok(sum < 1.8 * 1024 * 1024, `budget: ${sum}`);
});
test('state image canvas and ground contact anchors match', async () => {
  for (const name of ['phone', 'email']) {
    const a = await sharp(`src/assets/contact/${name}-closed.webp`).metadata();
    const b = await sharp(`src/assets/contact/${name}-open.webp`).metadata();
    assert.deepEqual([a.width, a.height], [b.width, b.height]);
  }
});
test('focus wins over hover and touch selection is explicit', () => {
  assert.equal(resolveContactState('phone', null, 'email'), 'phone');
  assert.equal(resolveContactState(null, null, null), 'idle');
  assert.equal(resolveContactState(null, 'email', 'phone'), 'email');
  assert.equal(resolveContactState('phone', null, null), 'phone');
});
test('copy payloads remain exact', () => {
  assert.equal(contactValues.email, '18379022106@163.com');
  assert.equal(contactValues.phone, '18379022106');
});
test('build does not ship Contact source PNGs', async () => {
  const files = await readdir('dist/assets');
  assert.equal(files.some(name => name.endsWith('.png') && /contact|phone|email|terrain/.test(name)), false);
  assert.ok(files.some(name => name.endsWith('.pdf')));
});
